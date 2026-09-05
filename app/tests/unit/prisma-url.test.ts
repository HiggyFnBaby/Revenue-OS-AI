import { describe, it, expect } from "vitest";
import { withPgBouncerFlag } from "@/lib/prisma";

// This flag is what Supabase and Prisma document for a pooled connection
// string. The rules are narrow on purpose: only the transaction pooler port,
// and never twice.

describe("withPgBouncerFlag", () => {
  it("adds the flag to a transaction-pooler URL (port 6543)", () => {
    expect(withPgBouncerFlag("postgresql://u:p@host:6543/db")).toBe(
      "postgresql://u:p@host:6543/db?pgbouncer=true"
    );
  });

  it("appends with & when the URL already has a query string", () => {
    expect(withPgBouncerFlag("postgresql://u:p@host:6543/db?sslmode=require")).toBe(
      "postgresql://u:p@host:6543/db?sslmode=require&pgbouncer=true"
    );
  });

  it("leaves a direct connection (port 5432) untouched", () => {
    const url = "postgresql://u:p@host:5432/db";
    expect(withPgBouncerFlag(url)).toBe(url);
  });

  it("does not add the flag twice", () => {
    const url = "postgresql://u:p@host:6543/db?pgbouncer=true";
    expect(withPgBouncerFlag(url)).toBe(url);
  });

  it("respects an explicit pgbouncer=false rather than overriding it", () => {
    const url = "postgresql://u:p@host:6543/db?pgbouncer=false";
    expect(withPgBouncerFlag(url)).toBe(url);
  });

  it("passes undefined through, so an unset DATABASE_URL stays unset", () => {
    expect(withPgBouncerFlag(undefined)).toBeUndefined();
  });
});
