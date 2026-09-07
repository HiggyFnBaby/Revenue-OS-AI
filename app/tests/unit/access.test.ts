import { describe, it, expect } from "vitest";
import { hasActiveAccess, trialEndDate, TRIAL_DAYS } from "@/lib/access";

// hasActiveAccess is the single gate on whether a workspace can use the
// product. Getting it wrong either gives the app away or locks out a paying
// customer, so every branch is pinned here.

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

describe("hasActiveAccess", () => {
  it("allows a workspace inside its trial with no subscription", () => {
    expect(hasActiveAccess({ trialEndsAt: future() }, null)).toBe(true);
  });

  it("denies a workspace whose trial has expired with no subscription", () => {
    expect(hasActiveAccess({ trialEndsAt: past() }, null)).toBe(false);
  });

  it("allows an ACTIVE subscription even after the trial expired", () => {
    expect(hasActiveAccess({ trialEndsAt: past() }, { status: "ACTIVE" })).toBe(true);
  });

  it("allows a TRIALING subscription even after the trial expired", () => {
    expect(hasActiveAccess({ trialEndsAt: past() }, { status: "TRIALING" })).toBe(true);
  });

  it.each(["PAST_DUE", "CANCELED", "NONE"] as const)(
    "denies a %s subscription once the trial has expired",
    (status) => {
      expect(hasActiveAccess({ trialEndsAt: past() }, { status })).toBe(false);
    }
  );

  it.each(["PAST_DUE", "CANCELED", "NONE"] as const)(
    "still allows a %s subscription while the trial is running",
    (status) => {
      expect(hasActiveAccess({ trialEndsAt: future() }, { status })).toBe(true);
    }
  );
});

describe("trialEndDate", () => {
  it(`lands ${TRIAL_DAYS} days after the given moment`, () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const end = trialEndDate(from);
    expect(end.getTime() - from.getTime()).toBe(TRIAL_DAYS * 24 * 60 * 60 * 1000);
  });

  it("produces a date that is still active when checked immediately", () => {
    expect(hasActiveAccess({ trialEndsAt: trialEndDate() }, null)).toBe(true);
  });
});
