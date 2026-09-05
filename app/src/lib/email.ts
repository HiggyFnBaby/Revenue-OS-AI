// The only outbound email the app sends today is the password reset link.
//
// Sends through Resend's HTTP API when RESEND_API_KEY is set — plain fetch,
// no SDK, because one POST does not justify a dependency. Without a key:
// in development the message is printed to the server log so the flow can
// be exercised end to end; in production it is a hard error, because
// silently "sending" nothing would leave a locked-out customer waiting for
// an email that never comes, which is worse than a visible failure.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM — see .env.example.");
    }
    console.log(`[email] (not configured — printing instead)\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 300)}`);
  }
}
