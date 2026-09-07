import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { resetPasswordWithToken } from "@/lib/passwordReset";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "token and password are required" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token || !password) {
    return NextResponse.json({ error: "token and password are required" }, { status: 400 });
  }

  // Same rule as signup — enforced here, not just in the form.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await resetPasswordWithToken(token, passwordHash);

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This reset link has expired. Request a new one."
        : "This reset link is invalid or has already been used. Request a new one.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
