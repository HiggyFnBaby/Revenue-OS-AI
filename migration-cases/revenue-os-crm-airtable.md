# Migration case: Revenue OS CRM (Airtable)

Tracked per [`continuity-bridge/README.md`](../continuity-bridge/README.md).
This file is the human-readable case record; nothing here has executed a
write against Airtable or any production database — Phase 1 (intake) and
the read-only portion of Phase 2 (dependency audit) only.

```
CASE: revenue-os-crm-airtable | TENANT: (unconfirmed — see below)
RECOMMENDATION: not yet scored — Phase 3 blocked on Gate A
CURRENT PHASE: 1_INTAKE / 2_DEPENDENCY_AUDIT (partial) | RISK: UNKNOWN | DAYS TO EXPIRATION: unknown
VERIFIED: base inventory, field/type map, record counts (see below)
ASSUMPTIONS: none stated as fact — all open items listed as blockers
OPEN BLOCKERS: 8 required intake fields unconfirmed (see below)
APPROVAL REQUIRED: Gate A — scope confirmation
NEXT BEST ACTION: owner answers the open intake questions below
ROLLBACK READY: n/a — no writes have occurred
```

## Source

- **Platform:** Airtable
- **Base:** "Revenue OS CRM" — `apphhT2YHy5AupUeB`
- **Access verified:** yes, via connected Airtable account, `create`-level permission
- **Related base seen in the same account** (not yet audited): "TheRealKingOfAI — Content OPS" — `apprfcwDHq7ElBQ3S`. The `Content` table's description in this base ("linking the Content OPS pipeline to Revenue OS attribution") implies a cross-base dependency — flagged, not yet inventoried.

## Phase 1 — Intake: confirmed vs. missing

Confirmed by direct inspection:

| Field | Value |
|---|---|
| bases/tables/fields | 1 base, 6 tables (below) |
| record counts | 38 total across all 6 tables (below) |
| attachments | none — no `multipleAttachments` field type present in any table |
| formulas/rollups | 6 present (below) — all straightforward, no nested cross-table chains observed |
| linked records | present in every table — see dependency audit |

**Missing — required before Gate A can close** (this agent cannot infer these):

1. `tenant_id` / organization name and **owner** for this case
2. **Service mode** — `SINGLE_CLIENT` or `TEAM`? (determines concurrency requirements and whether SQLite is viable as the target — see deployment guidance)
3. Airtable **trial expiration / downgrade date**, if any (drives urgency)
4. **Active users and permission levels** on this base (not visible from schema/record inspection)
5. **Critical workflows and acceptable downtime**
6. **Target backend decision** — this repo already has a running Postgres + Prisma CRM at `app/` (see below for why the two don't currently overlap) — should this migrate into a *new* SQLite/Postgres store dedicated to this data, or be reconciled with `app/prisma/schema.prisma`?
7. **Backup destination and retention policy**
8. Whether the flagged "TheRealKingOfAI — Content OPS" base should be in scope for this case or tracked separately

## Phase 2 — Dependency audit (read-only, so far)

### Tables, fields, and record counts

| Table | Records | Fields | Linked-record fields | Formula/rollup fields |
|---|---|---|---|---|
| Contacts | 6 | 12 | Deals, Orders, Activities, Content | Lifetime Value (rollup), Open Pipeline Value (rollup) |
| Deals | 6 | 15 | Contact, Products, Orders, Activities, Content | Weighted Value (formula), Days in Pipeline (formula) |
| Products | 6 | 15 | Deals, Orders, Content | Units Sold (count), Revenue Generated (rollup) |
| Orders | 5 | 10 | Customer, Product, Deal | — |
| Activities | 10 | 8 | Contact, Deal | — |
| Content | 5 | 15 | Promotes Products, Attributed Deals, Leads Generated | Influenced Revenue (rollup) |

Total: 38 records, 0 attachments, 6 computed fields, dense cross-table
linking (every table links to at least two others).

### Criticality / replacement-effort assessment (preliminary — not yet owner-reviewed)

| Dependency | Criticality | Replacement effort | Downgrade impact | Evidence |
|---|---|---|---|---|
| Linked records (all tables) | HIGH | NATIVE_SQL (foreign keys) | DEGRADED if links break | schema inspection |
| Rollup fields (Lifetime Value, Open Pipeline Value, Revenue Generated, Influenced Revenue) | MEDIUM | NATIVE_SQL (SQL views/aggregates) | DEGRADED — values would stop updating live | schema inspection |
| Formula fields (Weighted Value, Days in Pipeline) | LOW | NATIVE_SQL (generated columns) | DEGRADED, easily reproduced | schema inspection |
| Single/multi-select fields (Stage, Lifecycle Stage, Payment Status, etc.) | LOW | NATIVE_SQL (enums/lookup tables) | NONE if enumerated correctly | schema inspection |
| Cross-base link to "Content OPS" base | UNKNOWN | UNRESOLVED | UNKNOWN | not yet audited — needs Gate A scope decision |
| Views, forms, interfaces, automations, webhooks | UNKNOWN | UNRESOLVED | UNKNOWN | not inspected — Airtable MCP access used here only covers table/record data, not automations/interfaces; would need direct Airtable UI/API review |
| Active users / permissions | UNKNOWN | UNRESOLVED | UNKNOWN | not visible via available tooling |

### Relationship to this repo's existing CRM

`app/prisma/schema.prisma` already implements a Postgres-backed CRM
(`Workspace`, `User`, `Lead` moving through `SIGNAL → OFFER → ANGLE →
CONVERSATION → WON/LOST`). That model does **not** structurally match this
Airtable base — the Airtable base tracks a fuller sales/commerce flow
(`Contacts`, `Deals`, `Products` inventory, `Orders`, `Activities`,
marketing-attribution `Content`) with no equivalent tables in `app/`
today. Treat these as two distinct systems until an owner decides
otherwise; do not assume they should merge.

## Phase 3 — Decision engine

**Blocked.** Scoring requires answers to the missing intake fields above,
in particular service mode (factor: concurrent access complexity),
migration time available, and data ownership/privacy requirement — none of
which this agent can respond to on the source data alone.

## Gate A — Scope confirmation

**Status: PENDING.** Recommend the owner confirm:

- Which base(s) are in scope (just "Revenue OS CRM", or also "Content OPS")
- Service mode
- Target backend direction (new dedicated store vs. reconciling with `app/`)

No further phase work should proceed until Gate A closes.
