# Field mappings: Revenue OS CRM + Content OPS → SQLite

Phase 4 mapping proposal for
[`revenue-os-crm-airtable.md`](./revenue-os-crm-airtable.md), implementing
[`continuity-bridge/target-schemas/revenue-os-crm.sql`](../continuity-bridge/target-schemas/revenue-os-crm.sql).
Pending **Gate C approval** — nothing has been imported anywhere yet.

## Primary keys

Every target table uses the **original Airtable record ID** (e.g.
`recENk96PwiFjfb4T`) as its primary key, verbatim. This keeps every row
traceable back to its Airtable source with no separate ID-mapping table to
maintain, and costs nothing at this scale (54 records).

## Table mapping

| Source (base, table) | Target table | Notes |
|---|---|---|
| Revenue OS CRM → Contacts | `contacts` | 1:1, direct field mapping |
| Revenue OS CRM → Deals | `deals` | 1:1; `Contact` link → `contact_id` FK |
| Revenue OS CRM → Products | `products` (+ `product_tools`) | `Tools Used` (multi-select) → child table |
| Revenue OS CRM → Orders | `orders` (+ `order_products`) | `Order ID` → `order_number` (unique); `Product` link (M:N) → join table |
| Revenue OS CRM → Activities | `activities` | `Contact`/`Deal` links → nullable FKs |
| Revenue OS CRM → Content | `content` (+ `content_platforms`, `content_products`, `content_deals`, `content_leads`) | linked-record fields → join tables |
| Content OPS → Content Calendar | `content_calendar` | `content_id` FK resolved by title match (below) |
| Content OPS → Performance | `performance` | `content_id` FK resolved by title match (below) |
| Content OPS → Shorts | `shorts` | `content_calendar_id` FK resolved by `Parent Video` text match (below) |

## Rollup/formula fields — converted to views, not columns

| Airtable field | Target | Rule |
|---|---|---|
| Contacts.Lifetime Value | `contact_lifetime_value` view | `SUM(orders.amount)`, per contact — **all linked orders, no status filter** |
| Contacts.Open Pipeline Value | `contact_open_pipeline_value` view | `SUM(deals.amount)`, per contact — **all linked deals, no stage filter** |
| Deals.Weighted Value | `deal_weighted_value` view | `amount * probability` |
| Deals.Days in Pipeline | `deal_days_in_pipeline` view | days since `created` |
| Products.Units Sold | `product_units_sold` view | `COUNT(order_products)` per product |
| Products.Revenue Generated | `product_revenue_generated` view | `SUM(orders.amount)`, per product — **all linked orders, no status filter** |
| Content.Influenced Revenue | `content_influenced_revenue` view | `SUM(deals.amount)`, per content — **all attributed deals, no stage filter** |

Rationale: storing these as plain columns would let them silently go stale
the moment a linked row changes. A view recomputes on every read, so it
can never drift — same guarantee Airtable's live rollups gave.

**Caught during review, before this went to Gate C:** the first draft of
this schema guessed "sensible" filters — only count Paid orders, only
count Won deals — instead of checking what the source data actually does.
Validating the views against the real export caught the mistake: none of
these four rollups filter by status/stage at all.

- Marcus Bell's Lifetime Value (426) = his Paid order (129) **+** his
  still-Pending order (297) — a Paid-only filter would have produced 129.
- Grace Whitfield's Open Pipeline Value (5000) comes entirely from her one
  **Won** deal — a stage filter excluding Won would have produced 0.
- "Stop Prompting Harder"'s Influenced Revenue (297) comes from a deal
  still in **Proposal Sent**, not Won — a Won-only filter would have
  produced 0.
- The King Of AI course's Revenue Generated (297) comes from a **Pending**
  order — a Paid-only filter would have produced 0.

The views now do a plain, unconditional `SUM`/`COUNT` over every linked
row, matching Airtable's actual (if oddly-named, in the "Open Pipeline
Value" case) behavior rather than a plausible-sounding guess.

**Mechanically verified, not just eyeballed:** built a throwaway SQLite
database from this exact schema, loaded every exported record into it
(resolving all linked-record fields back to Airtable IDs), and compared
every view's output against every corresponding source rollup/formula
value — all 6 contacts' Lifetime Value and Open Pipeline Value, all 6
deals' Weighted Value and Days in Pipeline, all 6 products' Units Sold and
Revenue Generated, all 5 content records' Influenced Revenue. Result:
exact match on every value, zero foreign-key violations, correct row
count on all 9 tables. That test database was not persisted or
committed — this was validation of the proposal, not Phase 5 execution.

## Cross-base link resolution (the Phase 1 open question, now resolved)

Content OPS has **no Airtable-level link fields** back to the CRM base.
Every record in Content OPS was matched to CRM `content` (or to Content
Calendar, for Shorts) purely by comparing title/video-title strings. The
full export (Phase 4) confirmed every populated title matches **exactly**
— no typos, no case differences, no drift:

| Content Calendar record | Working Title | → `content.id` |
|---|---|---|
| `rec3XnWK3ZW2wnbhq` | 12 Unsexy AI Workflows That Replace Admin | `recMMxw2Ymlts7Na0` |
| `recBMfae1uGPFbqZK` | How We Automated a Consulting Biz in 7 Days | `reczuosyRikDSSPZu` |
| `recW2XexnjzOosbYT` | The 4-Node Workflow Anyone Can Build | `recEb1hZCYJkAw3tI` |
| `recXZ2E6CALUFT37d` | You're Using AI Backwards | `recRR8Kh8F4nWtwp9` |
| `recbI4pGQJYcEcKDs` | *(no title — orphan, no other fields populated either)* | `NULL` |
| `reciKOiliXn9Yq4Nl` | Stop Prompting Harder | `recQ2iIBWjc6Tdpvy` |

| Performance record | Title | → `content.id` |
|---|---|---|
| `recA8yQKPdeBskO2Y` | Stop Prompting Harder | `recQ2iIBWjc6Tdpvy` |

| Shorts record | Parent Video | → `content_calendar.id` |
|---|---|---|
| `recC9XnFg6tQcPQRf` | 12 Unsexy AI Workflows That Replace Admin | `rec3XnWK3ZW2wnbhq` |
| `recEQ1SUQ63XhBl7W` | How We Automated a Consulting Biz in 7 Days | `recBMfae1uGPFbqZK` |
| `recEqNzPpWRajRkU9` | How We Automated a Consulting Biz in 7 Days | `recBMfae1uGPFbqZK` |
| `recOPV3kfZfUUnCQq` | Stop Prompting Harder | `reciKOiliXn9Yq4Nl` |
| `recPyhF9n7xrXDoFq` | 12 Unsexy AI Workflows That Replace Admin | `rec3XnWK3ZW2wnbhq` |
| `recbN9qOZhAP5tZ4n` | How We Automated a Consulting Biz in 7 Days | `recBMfae1uGPFbqZK` |
| `recehI85aicRFyvjO` | Stop Prompting Harder | `reciKOiliXn9Yq4Nl` |
| `rechc3nb2ydzNLUgm` | 12 Unsexy AI Workflows That Replace Admin | `rec3XnWK3ZW2wnbhq` |
| `recvEo6z0ebnQDJF9` | Stop Prompting Harder | `reciKOiliXn9Yq4Nl` |

**Exclusion, explicitly called out (not silently dropped):** Content
Calendar record `recbI4pGQJYcEcKDs` (created 2026-08-10) has no title and
no other field populated — it imports as a real row with `content_id =
NULL` rather than being skipped, so it stays visible for the owner to
either delete or fill in after migration.

## What's still open before Phase 5 (staging import)

- Owner approval at **Gate C** of this mapping proposal
- Still-unconfirmed assumption from Phase 2: no active Airtable
  automations/extensions/webhooks (nothing to migrate if true; nothing
  this agent can directly verify)
