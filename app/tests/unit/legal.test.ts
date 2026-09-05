import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The legal pages name a contact address. It is read from the environment so
// the operator can set it without a code change, and it falls back rather
// than rendering blank — a Privacy Policy with no way to reach anyone is
// worse than one with an imperfect address.

beforeEach(() => {
  vi.resetModules();
  for (const key of ["NEXT_PUBLIC_LEGAL_CONTACT_EMAIL", "EMAIL_FROM", "NEXTAUTH_URL", "NEXT_PUBLIC_COMPANY_NAME"]) {
    vi.stubEnv(key, undefined);
  }
});
afterEach(() => {
  vi.unstubAllEnvs();
});

async function legal() {
  return import("@/lib/legal");
}

describe("LEGAL_CONTACT_EMAIL", () => {
  it("prefers the explicit variable", async () => {
    vi.stubEnv("NEXT_PUBLIC_LEGAL_CONTACT_EMAIL", "legal@company.com");
    vi.stubEnv("EMAIL_FROM", "Revenue OS <no-reply@other.com>");
    expect((await legal()).LEGAL_CONTACT_EMAIL).toBe("legal@company.com");
  });

  it("falls back to the address inside an angle-bracketed EMAIL_FROM", async () => {
    vi.stubEnv("EMAIL_FROM", "Revenue OS <no-reply@company.com>");
    expect((await legal()).LEGAL_CONTACT_EMAIL).toBe("no-reply@company.com");
  });

  it("accepts a bare EMAIL_FROM address", async () => {
    vi.stubEnv("EMAIL_FROM", "no-reply@company.com");
    expect((await legal()).LEGAL_CONTACT_EMAIL).toBe("no-reply@company.com");
  });

  it("falls back to support@ on the app's own domain", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://app.company.com");
    expect((await legal()).LEGAL_CONTACT_EMAIL).toBe("support@app.company.com");
  });

  it("ignores localhost so local dev does not leak into the rendered page", async () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    expect((await legal()).LEGAL_CONTACT_EMAIL).toBe("support@example.com");
  });

  it("never renders an empty contact", async () => {
    expect((await legal()).LEGAL_CONTACT_EMAIL).toMatch(/@/);
  });
});

describe("COMPANY_NAME", () => {
  it("uses the configured entity when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMPANY_NAME", "Higgyd Productions LLC");
    expect((await legal()).COMPANY_NAME).toBe("Higgyd Productions LLC");
  });

  it("falls back to the product name rather than blank", async () => {
    expect((await legal()).COMPANY_NAME).toBe("Revenue OS");
  });
});

describe("SUBPROCESSORS", () => {
  it("lists every third party the code actually calls", async () => {
    const names = (await legal()).SUBPROCESSORS.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["Vercel", "Supabase", "Stripe", "Anthropic", "Resend"]));
  });
});
