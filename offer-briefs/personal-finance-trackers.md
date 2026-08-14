# Offer Brief: Personal Finance Trackers (Higgyd Money OS)

**Agent:** offer-architect
**Input:** `../signal-reports/personal-finance-trackers.md`

**The pain points this offer is built against:** #1 and #2 from the signal
report, used for two different jobs rather than as two competing offers (per
the chain's own rule — pick one offer, don't split focus):

- **#1 (Mint's 2024 shutdown → mass free-to-paid migration)** is used as
  **market proof**, not as the offer's mechanism. It's the strongest evidence
  in the report that people in this exact market will convert from free to
  paid for a *complete* tracker — but the triggering event is ~2.5 years old
  now, so its acuteness as an active buying trigger is fading. Leaning the
  whole offer on "are you still mad about Mint" would be building on a
  cooling signal.
- **#2 (subscription/recurring-charge blindness)** is used as the **offer's
  actual mechanism and pricing anchor** — it's evergreen (not tied to a
  2024 event) and it has the cleanest, most direct willingness-to-pay
  evidence in the report: people already hand over 35–60% of found savings
  to Rocket Money just to catch wasted subscriptions.

**Why not build on #2 alone, as a narrow subscription-tracker-only product:**
the signal report's #3 (bank-sync reliability) and the general competitive
set show that a tool with *only* a subscription list, no full account
picture, competes with free built-in bank/card app features and has a much
lower ceiling. Combining "full tracker" (validated as payable by #1) with
"finds money you're already wasting in week one" (validated as payable, at a
steep price, by #2) produces one sellable thing: a complete tracker that
proves its own value immediately, instead of asking for trust up front.

---

## The promise

**See where every dollar goes, and get back the subscription money you're
already leaking — find it in your first week, or it's free.**

Deliberately not "replace Mint" (a dying trigger) or "cancel subscriptions
for you" (that's Rocket Money's model, and its success-fee complaints in the
signal report are a reason to avoid copying it, not imitate it). The promise
is a complete picture *plus* an immediate, provable win in week one.

## The buyer

People currently juggling more than one budgeting/banking app or a
spreadsheet, who have never gotten one clear, complete picture of their
money — a broader, more durable buyer than "displaced Mint users"
specifically, because the report flags that trigger as fading. Two buyer
signals from the report both point here:
- Anyone who was part of the free→paid wave after Mint shut down and is
  still shopping (report #1) — still a valid entry point, just not the whole
  buyer base going forward.
- Anyone with more than a handful of recurring subscriptions and no single
  place tracking them (report #2) — this is the larger, non-decaying buyer
  group, and the one the price and guarantee below are actually built for.

## The format

**Subscription, monthly, no annual lock-in.** The evidenced competitive band
(YNAB $109/yr ≈ $9/mo, Monarch $99.99/yr ≈ $8.33/mo, Quicken Simplifi ~$48/yr
≈ $4/mo) shows this buyer already pays monthly-equivalent pricing for a
tracker. A flat monthly subscription — not Rocket Money's percentage-of-savings
model — is also a deliberate contrast: report #2 shows people paying Rocket
Money's 35–60% success fee *and* still filing complaints about being charged
twice on savings that didn't change. A flat, predictable price is a stated
alternative to a model this exact market already resents paying.

## The price

**$7/month.**

Reasoning, tied directly to the evidence (not picked by feel):
- Sits inside the evidenced $4–9/mo band competitors already charge and this
  buyer already pays (Simplifi, Monarch, YNAB) — no format or price
  education needed.
- Report #2 puts average wasted subscription spend at **$133/year (~$11/mo)**
  per person. At $7/mo, the guarantee below (find waste in week one or it's
  free) is asking the product to find *less* than the evidenced average
  waste to pay for itself — a target the evidence says should usually be
  cleared, not a stretch claim.
- Priced meaningfully below what Rocket Money effectively extracts (a
  35–60% cut of found savings, which on a modest find can exceed $7/mo many
  times over) — "flat $7/mo, not a cut of your own money" is a direct,
  evidenced contrast, not an invented one.

**Confidence flag:** the signal report itself has zero first-person Reddit
quotes and leans on review-roundup/press summaries one layer removed from
primary sources — a real gap given how much of this market's discourse lives
on Reddit. Treat $7/mo as a reasoned starting hypothesis to validate against
actual prospective buyers (ideally after someone reads live r/mintuit and
r/ynab threads directly, as the signal report recommends) — not a locked
number.

## The guarantee / risk reversal

**Find subscription waste in your first 7 days, or the first month is free.**
This is deliberately a narrower, more provable claim than "save money" in
general — it's tied to the one pain point (#2) with the strongest, most
concrete evidence in the report ($133/yr average, a named and quantified
pattern), so the guarantee is testing something the evidence already
suggests is likely to be true, not a vague satisfaction promise.

## What's explicitly NOT included

- **Not a bill-negotiation service.** No calling providers, no percentage-of-savings
  fee — that's Rocket Money's model, and the signal report shows real
  complaints about it (charged twice, aggressive fee structure). This offer
  surfaces the waste; the user decides what to do about it.
- **Not couples/shared-budgeting-specific.** Report #5 (shared budgeting
  priced as an afterthought) is a real, separate gap but out of scope here —
  building for it would require its own validation, not a bolt-on.
- **Not built for freelancer/irregular income specifically.** Report #7 is
  flagged as the weakest, vendor-sourced entry in the signal report and
  should not be built against without primary-source validation first.
- **Not a guaranteed bank-sync fix.** Report #3 shows sync reliability is a
  near-universal weakness across this entire competitive category (Plaid/
  Finicity/MX, not any one vendor's failure) — this offer commits to honest
  fallback (manual/CSV entry) rather than promising reliability the whole
  category can't currently deliver.

---

## Naming note

Unlike the real-estate-agents pilot (where "RealEstateOS Enterprise"
oversold scope and had to be replaced with "FirstReply"), "Higgyd Money OS"
doesn't make a promise this offer can't keep, so no renaming decision is
needed here — sold under the existing name.

## Handoff

Ready for **content-angle-strategist** to draft hooks against this promise
and buyer, and eventually **conversation-system-builder** to design the
flow that closes it.
