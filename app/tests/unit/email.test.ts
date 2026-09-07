import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { assertEmailCanSend, emailIsConfigured } from "@/lib/email";

// assertEmailCanSend is what stops the password reset flow from writing a
// token for a message that can never be delivered. Its contract is narrow:
// throw in production when unconfigured, stay quiet everywhere else.

// vi.stubEnv rather than assignment: NODE_ENV is typed read-only, and this
// restores every stub automatically after each test.
beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", undefined);
  vi.stubEnv("EMAIL_FROM", undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("emailIsConfigured", () => {
  it("is false when either variable is missing", () => {
    expect(emailIsConfigured()).toBe(false);
    vi.stubEnv("RESEND_API_KEY", "re_x");
    expect(emailIsConfigured()).toBe(false);
  });

  it("is true only when both are set", () => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("EMAIL_FROM", "Revenue OS <no-reply@example.com>");
    expect(emailIsConfigured()).toBe(true);
  });
});

describe("assertEmailCanSend", () => {
  it("throws in production when no provider is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertEmailCanSend()).toThrow(/not configured/i);
  });

  it("names the variables the operator has to set", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertEmailCanSend()).toThrow(/RESEND_API_KEY/);
    expect(() => assertEmailCanSend()).toThrow(/EMAIL_FROM/);
  });

  it("stays quiet in development, where sendEmail prints instead", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => assertEmailCanSend()).not.toThrow();
  });

  it("stays quiet in production once configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("EMAIL_FROM", "Revenue OS <no-reply@example.com>");
    expect(() => assertEmailCanSend()).not.toThrow();
  });
});
