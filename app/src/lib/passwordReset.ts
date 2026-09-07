import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { assertEmailCanSend, sendEmail } from "@/lib/email";

// Password reset, end to end. Two entry points:
//
//   requestPasswordReset(email, appUrl)  — mint a token, email the link
//   resetPasswordWithToken(token, pw)    — verify the token, set the password
//
// The raw token is 32 random bytes and appears only in the emailed link;
// the database holds its SHA-256. Tokens expire after an hour and are
// single-use. Requesting a new token invalidates the user's earlier ones so
// only the latest email works.

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Cap on reset emails per address per hour. Anyone can type any email into
// the form, so without a cap the endpoint is a way to spam a stranger's
// inbox from our domain. Requests over the cap are dropped silently: the
// caller still gets the same "if that account exists" response.
const MAX_REQUESTS_PER_HOUR = 3;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildResetUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

// Always resolves without revealing whether the email belongs to a user.
// Every branch — unknown address, rate-limited, sent — returns the same
// thing to the caller; the difference is only whether an email goes out.
export async function requestPasswordReset(rawEmail: string, appUrl: string): Promise<void> {
  // Checked before any database work. A token minted for a message that
  // cannot go out is dead weight, and the mint retires the user's earlier
  // live tokens — so discovering the misconfiguration at the send could
  // leave someone holding a retired link and no replacement. Failing here
  // writes nothing and leaves any existing link intact.
  //
  // This throws for every address equally, known or not, so it still reveals
  // nothing about which emails have accounts.
  assertEmailCanSend();

  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } });
  if (!user) return;

  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESET_TOKEN_TTL_MS) } },
  });
  if (recent >= MAX_REQUESTS_PER_HOUR) return;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    // Retire any earlier live tokens so a stale email cannot be used after
    // a fresh one was requested.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  const url = buildResetUrl(appUrl, token);
  const greeting = user.name ? `Hi ${user.name},` : "Hi,";

  await sendEmail({
    to: user.email,
    subject: "Reset your Revenue OS password",
    text: `${greeting}\n\nSomeone asked to reset the password for your Revenue OS workspace. If that was you, open this link within the next hour:\n\n${url}\n\nIf you didn't ask for this, you can ignore this email — your password has not changed.`,
    html: `<p>${greeting}</p><p>Someone asked to reset the password for your Revenue OS workspace. If that was you, use the link below within the next hour:</p><p><a href="${url}">Reset your password</a></p><p>If you didn't ask for this, you can ignore this email — your password has not changed.</p>`,
  });
}

export type ResetResult = { ok: true } | { ok: false; reason: "invalid" | "expired" };

export async function resetPasswordWithToken(token: string, newPasswordHash: string): Promise<ResetResult> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt) return { ok: false, reason: "invalid" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  // Mark used only where usedAt is still null so two concurrent submissions
  // of the same link cannot both succeed; the count tells us who won.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return { ok: false, reason: "invalid" };

  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newPasswordHash } });
  return { ok: true };
}
