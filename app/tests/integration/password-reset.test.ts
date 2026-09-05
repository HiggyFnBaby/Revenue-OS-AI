import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requestPasswordReset, resetPasswordWithToken, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { hasDatabase, resetDatabase, createWorkspace } from "./helpers";

// The reset flow is the only way a locked-out customer gets back in, and it
// hands out a credential by email, so both halves matter: it has to work, and
// it must not hand out more than it should.

const APP_URL = "https://app.example.com";

/** Runs fn and returns the raw token from the link sendEmail prints in development. */
async function captureToken(fn: () => Promise<void>): Promise<string> {
  let token = "";
  const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    const m = args.join(" ").match(/token=([A-Za-z0-9_-]+)/);
    if (m) token = m[1];
  });
  try {
    await fn();
  } finally {
    spy.mockRestore();
  }
  return token;
}

describe.skipIf(!hasDatabase)("password reset", () => {
  beforeEach(async () => {
    await resetDatabase();
    // sendEmail prints instead of sending when there is no provider in
    // development, which is how these tests read the emitted link.
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("EMAIL_FROM", undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("issues a link that sets a new password", async () => {
    const { user } = await createWorkspace("reset@example.com");
    const token = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
    expect(token.length).toBeGreaterThan(20);

    const result = await resetPasswordWithToken(token, "brand-new-hash");
    expect(result.ok).toBe(true);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.passwordHash).toBe("brand-new-hash");
  });

  it("stores only a hash of the token, never the token itself", async () => {
    await createWorkspace("reset@example.com");
    const token = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
    const row = await prisma.passwordResetToken.findFirstOrThrow({});
    expect(row.tokenHash).toHaveLength(64);
    expect(row.tokenHash).not.toContain(token);
  });

  it("refuses to reuse a token that already worked", async () => {
    const { user } = await createWorkspace("reset@example.com");
    const token = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));

    expect((await resetPasswordWithToken(token, "first")).ok).toBe(true);
    const second = await resetPasswordWithToken(token, "second");
    expect(second).toMatchObject({ ok: false, reason: "invalid" });

    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.passwordHash).toBe("first");
  });

  it("rejects an unknown token", async () => {
    await createWorkspace("reset@example.com");
    expect(await resetPasswordWithToken("not-a-real-token", "x")).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("rejects an expired token and says so", async () => {
    await createWorkspace("reset@example.com");
    const token = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));

    // Age the row past its TTL rather than waiting an hour.
    await prisma.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await resetPasswordWithToken(token, "x")).toMatchObject({ ok: false, reason: "expired" });
  });

  it("retires the previous link when a new one is requested", async () => {
    await createWorkspace("reset@example.com");
    const first = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
    const second = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
    expect(second).not.toBe(first);

    expect((await resetPasswordWithToken(first, "x")).ok).toBe(false);
    expect((await resetPasswordWithToken(second, "y")).ok).toBe(true);
  });

  it("reveals nothing about whether an address has an account", async () => {
    await createWorkspace("known@example.com");
    // Neither call throws, and the unknown one writes nothing.
    await expect(requestPasswordReset("nobody@example.com", APP_URL)).resolves.toBeUndefined();
    expect(await prisma.passwordResetToken.count()).toBe(0);
  });

  it("caps reset emails per address so the form cannot spam an inbox", async () => {
    await createWorkspace("reset@example.com");
    for (let i = 0; i < 3; i++) {
      await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
    }
    const afterThree = await prisma.passwordResetToken.count();

    await requestPasswordReset("reset@example.com", APP_URL); // 4th, over the cap
    expect(await prisma.passwordResetToken.count()).toBe(afterThree);
  });

  it("issues tokens that expire within the advertised window", async () => {
    await createWorkspace("reset@example.com");
    const before = Date.now();
    await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
    const row = await prisma.passwordResetToken.findFirstOrThrow({});
    expect(row.expiresAt.getTime()).toBeGreaterThan(before);
    expect(row.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + RESET_TOKEN_TTL_MS);
  });

  // Regression: an unconfigured provider used to be discovered only at the
  // send, after a token had been minted and the user's earlier live token
  // retired — leaving them with a dead link and no replacement.
  describe("when email cannot be sent", () => {
    it("writes nothing and leaves an existing link working", async () => {
      const { user } = await createWorkspace("reset@example.com");
      const goodToken = await captureToken(() => requestPasswordReset("reset@example.com", APP_URL));
      const countBefore = await prisma.passwordResetToken.count();

      vi.stubEnv("NODE_ENV", "production"); // no provider configured
      await expect(requestPasswordReset("reset@example.com", APP_URL)).rejects.toThrow(/not configured/i);

      expect(await prisma.passwordResetToken.count()).toBe(countBefore);
      expect(await prisma.passwordResetToken.count({ where: { usedAt: null } })).toBe(1);

      vi.stubEnv("NODE_ENV", "development");
      expect((await resetPasswordWithToken(goodToken, "still-works")).ok).toBe(true);
      const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(after.passwordHash).toBe("still-works");
    });

    it("fails the same way for an unknown address, giving nothing away", async () => {
      vi.stubEnv("NODE_ENV", "production");
      await expect(requestPasswordReset("nobody@example.com", APP_URL)).rejects.toThrow(/not configured/i);
      expect(await prisma.passwordResetToken.count()).toBe(0);
    });
  });
});
