import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Supabase's transaction pooler (port 6543) hands a different backend
// connection to each transaction, so Prisma's named prepared statements
// collide between requests:
//
//   ERROR 42P05: prepared statement "s0" already exists
//
// It is intermittent — a request succeeds until it lands on a backend that
// already has "s0" — which makes it read like a flaky database rather than a
// missing connection-string parameter. Prisma's fix is the pgbouncer=true
// flag, which turns prepared statements off.
//
// Applied here rather than left to whoever types DATABASE_URL, because the
// failure it prevents is invisible at deploy time and only shows up as
// occasional 500s in production. Port 6543 is the only Supabase endpoint that
// pools this way; the session pooler and direct connections are left alone, as
// is any URL that already sets the flag.
export function withPgBouncerFlag(url: string): string;
export function withPgBouncerFlag(url: undefined): undefined;
export function withPgBouncerFlag(url: string | undefined): string | undefined;
export function withPgBouncerFlag(url: string | undefined): string | undefined {
  if (!url || !url.includes(":6543/")) return url;
  if (/[?&]pgbouncer=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`;
}

// Left undefined when DATABASE_URL is unset — the state `prisma generate` runs
// in during the Vercel build — so PrismaClient falls back to reading the
// datasource from the environment itself and the build does not need a
// database.
const datasourceUrl = withPgBouncerFlag(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
