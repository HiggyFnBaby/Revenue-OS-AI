import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Stripe from "stripe";
import { stripeProvider } from "@/lib/billing/stripe";

// Regression coverage for the Stripe v22 upgrade.
//
// `current_period_end` used to live on the Subscription. It now lives on the
// subscription's items, because items can bill on different cadences. Reading
// the old location yields `undefined`, and `new Date(undefined * 1000)` is
// Invalid Date — so the webhook would keep returning 200 while writing a
// garbage renewal date for every subscriber. Nothing would look broken until
// a customer asked why their billing page showed no renewal date.
//
// These tests fail loudly if that read ever moves back.

const WEBHOOK_SECRET = "whsec_test_secret";
const PERIOD_END = 1790000000;

beforeAll(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
});
afterAll(() => {
  vi.unstubAllEnvs();
});

const stripe = new Stripe("sk_test_dummy");

function subscriptionEvent(opts: {
  type?: string;
  items: { period: number; priceId: string }[];
  status?: string;
  workspaceId?: string;
}) {
  return {
    id: "evt_1",
    object: "event",
    type: opts.type ?? "customer.subscription.updated",
    data: {
      object: {
        id: "sub_123",
        object: "subscription",
        customer: "cus_456",
        status: opts.status ?? "active",
        cancel_at_period_end: false,
        metadata: opts.workspaceId ? { workspaceId: opts.workspaceId } : {},
        items: {
          object: "list",
          has_more: false,
          data: opts.items.map((it, i) => ({
            id: `si_${i}`,
            object: "subscription_item",
            current_period_end: it.period,
            current_period_start: it.period - 2_592_000,
            price: { id: it.priceId, object: "price" },
          })),
        },
      },
    },
  };
}

// Signs with Stripe's own helper, so these exercise real signature
// verification rather than a stub.
function sign(payloadObj: unknown) {
  const payload = JSON.stringify(payloadObj);
  return {
    payload,
    header: stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET }),
  };
}

const parse = (o: unknown) => {
  const { payload, header } = sign(o);
  return stripeProvider.parseWebhookEvent(payload, header);
};

describe("parseWebhookEvent", () => {
  it("reads currentPeriodEnd from the subscription ITEM, not the subscription", async () => {
    const ev = await parse(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "price_a" }], workspaceId: "ws_1" }));
    expect(ev?.currentPeriodEnd).toEqual(new Date(PERIOD_END * 1000));
  });

  it("never produces an Invalid Date", async () => {
    const ev = await parse(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "price_a" }], workspaceId: "ws_1" }));
    expect(Number.isNaN(ev?.currentPeriodEnd?.getTime())).toBe(false);
  });

  it("takes the latest period across a multi-item subscription", async () => {
    const ev = await parse(
      subscriptionEvent({
        items: [
          { period: PERIOD_END, priceId: "price_a" },
          { period: PERIOD_END + 86_400, priceId: "price_b" },
        ],
        workspaceId: "ws_1",
      })
    );
    expect(ev?.currentPeriodEnd).toEqual(new Date((PERIOD_END + 86_400) * 1000));
  });

  it("leaves currentPeriodEnd undefined rather than invalid when there are no items", async () => {
    const ev = await parse(subscriptionEvent({ items: [], workspaceId: "ws_1" }));
    expect(ev?.currentPeriodEnd).toBeUndefined();
  });

  it("carries the identifiers the app stores", async () => {
    const ev = await parse(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "price_a" }], workspaceId: "ws_1" }));
    expect(ev).toMatchObject({
      workspaceId: "ws_1",
      providerCustomerId: "cus_456",
      providerSubscriptionId: "sub_123",
      priceId: "price_a",
    });
  });

  it.each([
    ["active", "ACTIVE"],
    ["trialing", "TRIALING"],
    ["past_due", "PAST_DUE"],
    ["unpaid", "PAST_DUE"],
    ["canceled", "CANCELED"],
    ["incomplete_expired", "CANCELED"],
    ["paused", "NONE"],
  ])("maps Stripe status %s to %s", async (stripeStatus, expected) => {
    const ev = await parse(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "p" }], status: stripeStatus, workspaceId: "ws_1" }));
    expect(ev?.status).toBe(expected);
  });

  it.each(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"])(
    "handles the %s event type",
    async (type) => {
      const ev = await parse(subscriptionEvent({ type, items: [{ period: PERIOD_END, priceId: "p" }], workspaceId: "ws_1" }));
      expect(ev).not.toBeNull();
    }
  );

  it("ignores an event with no workspaceId metadata instead of guessing", async () => {
    expect(await parse(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "p" }] }))).toBeNull();
  });

  it("ignores event types the app does not act on", async () => {
    expect(await parse(subscriptionEvent({ type: "invoice.paid", items: [{ period: PERIOD_END, priceId: "p" }], workspaceId: "ws_1" }))).toBeNull();
  });

  it("rejects a payload whose signature does not verify", async () => {
    const { payload } = sign(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "p" }], workspaceId: "ws_1" }));
    await expect(stripeProvider.parseWebhookEvent(payload, "t=1,v1=deadbeef")).rejects.toThrow();
  });

  it("rejects a payload that was tampered with after signing", async () => {
    const { payload, header } = sign(subscriptionEvent({ items: [{ period: PERIOD_END, priceId: "p" }], workspaceId: "ws_1" }));
    const tampered = payload.replace("ws_1", "ws_attacker");
    await expect(stripeProvider.parseWebhookEvent(tampered, header)).rejects.toThrow();
  });
});
