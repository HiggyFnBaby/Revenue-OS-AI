import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";
import { SiteFooter } from "@/components/SiteFooter";

// Shared shell for /terms and /privacy so the two read as one document set.
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mb-6 text-sm">
        <Link href="/" className="text-slate-500 hover:underline">
          &larr; Revenue OS
        </Link>
      </p>
      <h1 className="mb-1 text-3xl font-bold">{title}</h1>
      <p className="mb-8 text-sm text-slate-500">Effective {LEGAL_EFFECTIVE_DATE}</p>
      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-800 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_a]:underline">
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}
