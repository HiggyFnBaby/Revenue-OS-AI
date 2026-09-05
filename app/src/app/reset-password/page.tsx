import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

// Server component so the token can be read from the URL without a client
// useSearchParams() Suspense boundary; the form itself is a client component.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <p className="text-sm text-slate-600">
            This page needs the link from your reset email. Open the email and click the link, or request a new one.
          </p>
          <p className="text-sm text-slate-600">
            <Link href="/forgot-password" className="underline">
              Request a new reset link
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
