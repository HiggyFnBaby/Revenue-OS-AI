# Implementation roadmap: Airtable → Founder OS

A narrative, five-step version of the same migration this system executes
phase-by-phase (see [`README.md`](./README.md) for the formal Phase
1–9/Gate A–D process). Use this as the high-level map; use the README's
phases when actually running a case, since those carry the approval gates
and non-negotiable rules this doc doesn't restate.

Replacing Airtable end-to-end means replacing its four pillars:
relational data storage, automation/triggers, interfaces/dashboards, and
API integration layers.

## Step 1: Data model & schema audit

Before moving code or data, map the exact structure of current Airtable
dependencies.

- **Inventory tables and relationships** — every table, field type
  (formula, rollup, link to another record, attachment), and cardinality
  (one-to-many, many-to-many).
- **Identify formula logic** — extract every custom formula and rollup so
  it can be re-implemented as a database-level computed column/view, or
  handled in application logic or agent prompts.
- **Determine data store target** — PostgreSQL for relational integrity,
  SQLite for local-first/single-writer speed, or a vector-hybrid store if
  documents need to be embedded for agent retrieval.

Corresponds to Phase 1 (Intake) + Phase 2 (Dependency Audit) in the
README.

## Step 2: Provision the new database infrastructure

- **Schema migration** — write migration scripts (Prisma, Alembic, raw
  SQL) recreating tables, foreign keys, and constraints in the new
  database.
- **Data export & cleanse** — export Airtable bases to CSV/JSON, resolve
  legacy anomalies or orphaned linked records, seed the new database.
- **Establish access layer** — secure connection pooling and environment
  variables so both local tooling (e.g. Claude Code) and production
  services connect cleanly.

Corresponds to Phase 4 (Backup and Mapping) + Phase 5 (Staging Migration).

## Step 3: Replace automations & background jobs

Airtable automations typically handle record updates, webhook triggers,
and notifications — replace with code-driven event loops.

- **Define event triggers** — map what currently triggers each workflow
  ("when status changes to X, run script Y").
- **Build worker architecture** — background worker queues or event
  listeners (lightweight Node.js/Python scripts, Temporal, cron) for
  asynchronous tasks.
- **Integrate LLM agents** — route complex categorization, drafting, or
  data-processing steps to Claude agent prompts via API instead of rigid
  automation blocks.

Corresponds to Phase 6 (Interface and Automation Replacement).

## Step 4: Rebuild interfaces & UI dashboards

If day-to-day data entry and pipeline tracking rely on Airtable
Interfaces, build lightweight alternatives.

- **Assess UI needs** — decide whether a graphical interface is required,
  or whether a terminal-first/Markdown workflow (Claude Code in an IDE or
  workspace) suffices.
- **Lightweight admin panels** — if a GUI is required, a self-hosted admin
  interface (Directus, PocketBase, Retool, or this repo's own
  [`nocodb/`](../nocodb/) setup) on top of the new database replicates
  custom views, grids, and kanban boards without vendor lock-in.

Corresponds to Phase 6 (Interface and Automation Replacement) + Phase 7
(User Acceptance Testing).

## Step 5: Update API endpoints & client code

Redirect any external tools, scripts, or Zapier/Make workflows currently
pointing at the Airtable API.

- **Abstract the data layer** — a clean repository/API wrapper layer so
  agents and scripts call functions (`getFounderGoals()`,
  `updateProjectStatus()`) instead of hardcoded REST calls to a specific
  SaaS provider.
- **Test and validate** — run parallel tests where critical workflows
  write to both Airtable and the new database to verify data parity and
  performance before cutover.
- **Decommission** — only once stability is confirmed: revoke Airtable API
  keys, archive the bases, cut over completely.

Corresponds to Phase 8 (Controlled Cutover) + Phase 9 (Stabilization and
Retirement) — including the same automatic-rollback triggers and
Airtable-stays-read-only-during-validation rule defined in the README.
