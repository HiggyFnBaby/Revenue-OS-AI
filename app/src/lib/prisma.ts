import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 connects through a driver adapter (node-postgres) rather than its
// own bundled query engine, so the app's connection string is read here
// rather than from schema.prisma. The CLI has a separate one in
// prisma.config.ts, pointed at the unpooled endpoint for migrations.
//
// Supabase's transaction pooler (port 6543) hands a different backend
// connection to each transaction. Under Prisma 6's engine that broke with:
//
//   ERROR 42P05: prepared statement "s0" already exists
//
// because the engine used *named* prepared statements that outlived the
// transaction. node-postgres sends unnamed prepared statements, so the
// collision no longer arises. The flag is kept anyway: it is what Supabase
// and Prisma both document for pooled URLs, it costs nothing, and
// node-postgres ignores query parameters it does not recognise (verified
// against PostgreSQL 16 — a connection string carrying pgbouncer=true
// connects and queries normally).
export function withPgBouncerFlag(url: string): string;
export function withPgBouncerFlag(url: undefined): undefined;
export function withPgBouncerFlag(url: string | undefined): string | undefined;
export function withPgBouncerFlag(url: string | undefined): string | undefined {
  if (!url || !url.includes(":6543/")) return url;
  if (/[?&]pgbouncer=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`;
}

function createClient(): PrismaClient {
  const connectionString = withPgBouncerFlag(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.example.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Created on first property access rather than at import time. Prisma 6 could
// be constructed with no connection string and only fail on the first query;
// the adapter needs the string up front, and `next build` imports this module
// with no DATABASE_URL set. Deferring construction keeps the build working
// while still failing loudly on the first real query if the variable is
// genuinely missing in production.
//
// Caching on globalThis stops a dev hot reload from opening a new connection
// pool on every edit; in production the module is evaluated once per
// serverless instance, so the cache is simply that instance's single client.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (globalForPrisma.prisma ??= createClient());
    const value = Reflect.get(client, prop) as unknown;
    // Bind methods so `this` is the real client, not the proxy.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
