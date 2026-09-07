import { defineConfig } from "prisma/config";

// Prisma 7 moved connection URLs out of schema.prisma. This file is read by
// the CLI only — `prisma db push`, `prisma migrate`, `prisma studio` — and
// never by the running app, which connects through the driver adapter in
// src/lib/prisma.ts.
//
// The URL here is the *unpooled* one (DIRECT_URL, port 5432 on Supabase):
// migrations take advisory locks and run DDL across a session, which a
// transaction pooler cannot carry. DATABASE_URL is the fallback so a plain
// local Postgres with no pooler works with only one variable set.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
