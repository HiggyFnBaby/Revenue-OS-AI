"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Reset your password</h1>

      {sent ? (
        <>
          <p className="text-sm text-slate-700">
            If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a link to reset the
            password. The link works for one hour.
          </p>
          <p className="text-sm text-slate-600">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <button type="button" onClick={() => setSent(false)} className="underline">
              try again
            </button>
            .
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Enter the email you signed up with and we&apos;ll send you a link to choose a new password.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="text-sm text-slate-600">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>
    </main>
  );
}
