// The handful of facts the Terms of Service and Privacy Policy need that
// belong to the operator, not the code. Each is an environment variable so
// they can be set on the deployment without a code change, with a fallback
// that is at least accurate for this app. Change these in one place.

export const LEGAL_EFFECTIVE_DATE = "September 5, 2026";

// The legal name that appears as the contracting party. Defaults to the
// product name; set NEXT_PUBLIC_COMPANY_NAME to the registered entity
// (e.g. "Higgyd Productions LLC") before taking payments.
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Revenue OS";

export const PRODUCT_NAME = "Revenue OS";

// Sender domains that belong to the email provider rather than to us.
// Resend hands every new account onboarding@resend.dev so the flow can be
// tested before a real domain is verified — useful for EMAIL_FROM, but it
// reaches Resend, not us, so it must never be published as our legal
// contact. Skipped below in favour of the next fallback.
const SHARED_SENDER_DOMAINS = ["resend.dev"];

function isOurs(address: string): boolean {
  const domain = address.split("@")[1]?.toLowerCase() ?? "";
  return !SHARED_SENDER_DOMAINS.some((shared) => domain === shared || domain.endsWith(`.${shared}`));
}

// Where privacy requests and legal notices go. Falls back to the address
// transactional email is sent from (EMAIL_FROM), then to support@ on the
// app's own domain, so the pages never render an empty contact.
function contactEmail(): string {
  const explicit = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL;
  if (explicit) return explicit;

  const from = process.env.EMAIL_FROM ?? "";
  const angled = from.match(/<([^>]+)>/);
  const fromAddress = angled ? angled[1].trim() : from.includes("@") ? from.trim() : "";
  if (fromAddress && isOurs(fromAddress)) return fromAddress;

  try {
    const host = new URL(process.env.NEXTAUTH_URL ?? "").hostname;
    if (host && host !== "localhost") return `support@${host}`;
  } catch {
    // fall through
  }
  return "support@example.com";
}

export const LEGAL_CONTACT_EMAIL = contactEmail();

// Jurisdiction whose law governs the terms. Set NEXT_PUBLIC_GOVERNING_LAW to
// something like "the State of Georgia, United States".
export const GOVERNING_LAW = process.env.NEXT_PUBLIC_GOVERNING_LAW || "the United States";

// Third parties that process customer data on the app's behalf. Listed in
// the Privacy Policy. Keep in sync with what the code actually calls.
export const SUBPROCESSORS = [
  { name: "Vercel", purpose: "Application hosting, serverless functions, and request logs", location: "United States" },
  { name: "Supabase", purpose: "PostgreSQL database hosting for all application data", location: "United States" },
  { name: "Stripe", purpose: "Subscription billing and payment processing", location: "United States" },
  { name: "Anthropic", purpose: "AI model (Claude) that powers agent runs on leads you choose to run them on", location: "United States" },
  { name: "Resend", purpose: "Transactional email, such as password reset links", location: "United States" },
] as const;
