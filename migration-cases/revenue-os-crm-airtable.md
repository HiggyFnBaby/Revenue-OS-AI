# Migration case: Revenue OS CRM (Airtable)

Tracked per [`continuity-bridge/README.md`](../continuity-bridge/README.md).
Nothing in this case has executed a write against Airtable or any
production database — Phases 1–3 (intake, dependency audit, decision
scoring) only. Phase 4 (backup and mapping) has not started.

```
CASE: revenue-os-crm-airtable | TENANT: derrick | MODE: SINGLE_CLIENT
RECOMMENDATION: MIGRATE
CURRENT PHASE: 3_DECISION_ENGINE (complete) | RISK: LOW | DAYS TO EXPIRATION: n/a (no deadline)
VERIFIED: base/table/field inventory, record counts, formula/rollup inventory, cross-base link mechanism (see below)
ASSUMPTIONS: no Airtable automations/extensions/webhooks in active use; no recurring-cost pressure driving this (see Phase 3)
OPEN BLOCKERS: none for Gate A/B; Gate C mapping approval still to come in Phase 4
BACKUP PLAN: local, gitignored, checksummed export under migration-cases/backups/ — indefinite retention (approved)
APPROVAL REQUIRED: Gate B — strategy approval (MIGRATE) before Phase 4 starts
NEXT BEST ACTION: owner approves MIGRATE at Gate B, then Phase 4 (backup export + field mapping proposal) begins
ROLLBACK READY: n/a — no writes have occurred yet
```

## Gate A — Scope confirmation: **APPROVED**

Resolved by owner on 2026-08-12:

- **Tenant / owner:** Derrick (single client — this repo's owner)
- **Service mode:** `SINGLE_CLIENT`
- **Target backend:** new local SQLite database (per ContinuityBridge's own default guidance for one active writer)
- **Scope:** both Airtable bases included —
  - "Revenue OS CRM" — `apphhT2YHy5AupUeB`
  - "TheRealKingOfAI — Content OPS" — `apprfcwDHq7ElBQ3S`
- **Urgency:** no hard deadline (not trial-driven); proceed at a normal pace through the remaining gates

**Backup destination and retention policy** — resolved by owner on
2026-08-12:

- Destination: local filesystem, under `migration-cases/backups/<case>/<date>/`, one JSON file per table plus a `manifest.json` (record counts, export timestamp) and a `CHECKSUMS.sha256`. Gitignored (see `migration-cases/.gitignore`) — never committed, since the export contains real contact PII (names, emails, phone numbers).
- Retention: indefinite for the pre-migration backup (data volume is trivial — a few KB). A second checksummed snapshot will be taken immediately before Phase 8 cutover, so a last-known-good copy survives even after Airtable access is eventually retired.

Still open, but non-blocking for Gate A/B (needed before Phase 8
cutover):

- Confirmation that no Airtable automations/extensions/webhooks are in
  active use (assumed absent below — see Phase 2)

## Source

### Base 1: Revenue OS CRM — `apphhT2YHy5AupUeB`

6 tables, 38 records total, 0 attachments, 6 formula/rollup fields, dense
cross-table linking (every table links to at least two others):

| Table | Records | Fields | Linked-record fields | Formula/rollup fields |
|---|---|---|---|---|
| Contacts | 6 | 12 | Deals, Orders, Activities, Content | Lifetime Value (rollup), Open Pipeline Value (rollup) |
| Deals | 6 | 15 | Contact, Products, Orders, Activities, Content | Weighted Value (formula), Days in Pipeline (formula) |
| Products | 6 | 15 | Deals, Orders, Content | Units Sold (count), Revenue Generated (rollup) |
| Orders | 5 | 10 | Customer, Product, Deal | — |
| Activities | 10 | 8 | Contact, Deal | — |
| Content | 5 | 15 | Promotes Products, Attributed Deals, Leads Generated | Influenced Revenue (rollup) |

### Base 2: TheRealKingOfAI — Content OPS — `apprfcwDHq7ElBQ3S`

3 tables, 16 records total, 0 attachments, 0 formula/rollup fields, **no
Airtable-level linked-record fields at all**:

| Table | Records | Fields | Notes |
|---|---|---|---|
| Content Calendar | 6 | 9 | Production pipeline; `Working Title` is plain text |
| Performance | 1 | 8 | Metrics vs. 2026 benchmarks; `Title` is plain text |
| Shorts | 9 | 8 | `Parent Video` is plain text, not a link field |

**Key finding:** the "cross-base dependency" flagged at Phase 1 is **not**
a real Airtable relational link. The CRM base's `Content` table and this
base's `Content Calendar`/`Performance` tables are connected only by
matching title strings by eye/convention (e.g. "Stop Prompting Harder"
appears as a record in both). There is no enforced referential integrity
today — titles could already have silently drifted. Treat this as a
**data-matching risk to resolve during Phase 4 mapping** (fuzzy-match by
title, manually confirm each pair, then assign a stable foreign key) —
not as a schema dependency to preserve mechanically.

Combined scope: **9 tables, 54 records, 0 attachments** across both bases.

## Phase 2 — Dependency audit

| Dependency | Criticality | Replacement effort | Downgrade impact | Evidence |
|---|---|---|---|---|
| Linked records within Revenue OS CRM (all tables) | HIGH | NATIVE_SQL (foreign keys) | DEGRADED if links break | schema inspection |
| Rollup fields (Lifetime Value, Open Pipeline Value, Revenue Generated, Influenced Revenue) | MEDIUM | NATIVE_SQL (SQL views/aggregates) | DEGRADED — would stop updating live | schema inspection |
| Formula fields (Weighted Value, Days in Pipeline) | LOW | NATIVE_SQL (generated columns) | DEGRADED, easily reproduced | schema inspection |
| Single/multi-select fields (Stage, Lifecycle Stage, Payment Status, Lane, Status, etc.) | LOW | NATIVE_SQL (enums/lookup tables) | NONE if enumerated correctly | schema inspection |
| Soft title-matched link between CRM `Content` and Content OPS `Content Calendar`/`Performance` | MEDIUM | SCRIPT (fuzzy match + manual confirm during Phase 4) | DEGRADED — matches could be wrong today, not just after migration | schema inspection, see finding above |
| Checkbox-based multi-platform tracking (Shorts: YouTube/TikTok/IG Reels) | LOW | NATIVE_SQL (boolean columns) | NONE | schema inspection |
| Views, forms, interfaces, automations, webhooks | UNKNOWN, **assumed NONE/LOW** | UNRESOLVED if any exist | UNKNOWN | not inspected — table/record-level Airtable access doesn't cover automations/interfaces; assumption to verify before Phase 8 cutover |
| Active users / permissions | N/A | — | — | resolved by Gate A: SINGLE_CLIENT, one user (Derrick) |

### Relationship to this repo's existing CRM

`app/prisma/schema.prisma` implements an unrelated Postgres-backed CRM
(`Workspace`, `User`, `Lead` moving through `SIGNAL → OFFER → ANGLE →
CONVERSATION → WON/LOST`). Gate A resolved this: the migrated data goes to
a **new, separate SQLite database**, not into `app/`'s schema. The two
systems stay distinct.

## Phase 3 — Decision engine

| Factor | Weight | Score (1–5) | Rationale |
|---|---|---|---|
| Non-technical multi-user UI dependency | 20 | 1 | Single technical owner (Derrick), no non-technical users depend on Airtable's grid UI |
| Native automation and extension dependency | 15 | 1 | No automations/extensions observed in the data; **assumption**, not directly verified — flagged above |
| Migration time available | 15 | 5 | No deadline; can proceed carefully through every gate |
| Data ownership/privacy requirement | 15 | 5 | Owner explicitly chose local SQLite over cloud alternatives at Gate A |
| Recurring cost pressure | 10 | 3 | Not stated either way; **assumption** — treated as neutral, not a driver |
| Internal technical capacity | 10 | 5 | Repo already runs Next.js/Prisma/Postgres/Docker — ample capacity to own a SQLite store |
| Concurrent access and permissions complexity | 10 | 1 | Single writer, no permission tiers — SQLite is directly viable per deployment guidance |
| Offline/local operation requirement | 5 | 4 | Implied by the local-SQLite choice at Gate A |

Weighted read: every high-weight factor (non-technical UI dependency,
automation dependency, concurrency complexity) that would normally argue
for staying on Airtable scores **low** here, while migration-time,
ownership, and technical-capacity — which argue for moving — all score
**high**. The dataset itself is small (54 records, 0 attachments) and the
only real complication (the soft title-matched cross-base link) is a
one-time mapping problem, not a reason to keep Airtable running.

**Recommendation: MIGRATE.** Not `HYBRID_TRANSITION` — there's no
identified critical workflow that needs Airtable to keep running in
parallel once staging validation passes.

## Gate B — Strategy approval

**Status: PENDING.** Recommended strategy: `MIGRATE`. Awaiting owner
approval before Phase 4 (backup export, field-mapping proposal, primary-key
assignment, and a concrete resolution plan for the soft title-matched
cross-base link) begins.
