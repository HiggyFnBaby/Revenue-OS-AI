"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not reset your password. Please request a new link.");
      return;
    }

    setDone(true);
    router.push("/login?reset=1");
  }

  if (done) {
    return <p className="text-sm text-slate-700">Password updated. Taking you to log in...</p>;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="New password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Link expired?{" "}
        <Link href="/forgot-password" className="underline">
          Request a new one
        </Link>
      </p>
    </>
  );
}
