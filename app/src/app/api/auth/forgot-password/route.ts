import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/passwordReset";

// The link in the email must point at this app's real address. NEXTAUTH_URL
// is trusted first: building it from the request's Host header would let
// anyone who can spoof that header send a real user a reset link that lands
// on a domain they control. The request origin is only the fallback for
// local development where NEXTAUTH_URL may be unset.
function appUrl(request: Request): string {
  return process.env.NEXTAUTH_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  try {
    await requestPasswordReset(email, appUrl(request));
  } catch (err) {
    // Only a configuration or provider failure reaches here (an unknown
    // email returns normally). That is a real outage for the person locked
    // out, so surface it instead of pretending an email was sent.
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "We couldn't send the reset email right now. Please try again later or contact support." },
      { status: 500 }
    );
  }

  // Same reply whether or not the address exists.
  return NextResponse.json({
    message: "If an account exists for that email, we've sent a link to reset the password.",
  });
}
