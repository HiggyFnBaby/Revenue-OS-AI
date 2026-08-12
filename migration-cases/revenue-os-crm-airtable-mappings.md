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
| Contacts.Lifetime Value | `contact_lifetime_value` view | `SUM(orders.amount)` where `payment_status = 'Paid'`, per contact |
| Contacts.Open Pipeline Value | `contact_open_pipeline_value` view | `SUM(deals.amount)` where `stage NOT IN ('Won','Lost')`, per contact |
| Deals.Weighted Value | `deal_weighted_value` view | `amount * probability` |
| Deals.Days in Pipeline | `deal_days_in_pipeline` view | days since `created` |
| Products.Units Sold | `product_units_sold` view | `COUNT(order_products)` per product |
| Products.Revenue Generated | `product_revenue_generated` view | `SUM(orders.amount)` for paid orders containing the product |
| Content.Influenced Revenue | `content_influenced_revenue` view | `SUM(deals.amount)` for `Won` deals attributed to the content |

Rationale: storing these as plain columns would let them silently go stale
the moment a linked row changes. A view recomputes on every read, so it
can never drift — same guarantee Airtable's live rollups gave.

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
