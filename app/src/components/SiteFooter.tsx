import Link from "next/link";
import { COMPANY_NAME } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="mt-16 flex flex-col items-center gap-2 border-t border-slate-200 py-6 text-xs text-slate-500">
      <nav className="flex gap-4">
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </nav>
      <p>&copy; {new Date().getFullYear()} {COMPANY_NAME}</p>
    </footer>
  );
}
