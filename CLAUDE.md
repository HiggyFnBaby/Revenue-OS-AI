# CLAUDE.md — Working Notes on Derrick & This Project

Persistent context so Claude Code doesn't have to re-derive this every
session. Read `business-brief.md` and `runbooks/revenue-agent-runbook.md`
for the full picture — this file is the condensed, working-memory version.

## Who this is for

- **Derrick** (GitHub: `HiggyFnBaby`) — an entrepreneur-creator, not a
  professional developer. He directs this system the way he'd direct steps
  in a no-code workflow: explain concepts in plain language first (what's a
  "subagent," what's a "runbook") before diving into implementation detail.
- He owns a portfolio of **80+ apps**. This repo (`Revenue-OS-AI`) is one
  product in that portfolio, but it's also the *engine* used to decide what
  else in the portfolio is worth monetizing.
- The cross-portfolio tracking doc (`docs/monetization-strategy.md`) lives in
  a **separate** repo, `HiggyFnBaby/Higgyd-Productions`. Don't duplicate it
  here — this repo stays scoped to Revenue OS itself.

## The core thesis (don't lose this in implementation details)

> Money is not a tool, money is in systems.

Tools (a CRM, a landing page, a chatbot) only produce activity. Revenue comes
from a repeatable system: proof a problem is real → a priced, sellable offer
→ words that make the right buyer stop scrolling → a designed conversation
that closes. The tool is where the *last* step gets implemented — never
where the first three get invented. If a request looks like "just add a
payment button" or "just wire up automation" without that chain behind it,
flag that — it's the anti-pattern this whole project exists to avoid.

## Dual purpose — keep both in view

1. **Internal, now:** run the four-agent chain against Derrick's own app
   portfolio to decide what's worth monetizing and how.
2. **Productized, later:** package the same chain as a SaaS/CRM for other
   entrepreneur-creators. Internal use has to prove it works first — don't
   treat "sellable to others" as done until it's proven on Derrick's own
   portfolio.

## The four-agent chain (signal → offer → angle → conversation)

Defined in `.claude/agents/`, each with a strict, non-overlapping job. Run in
this order, each output feeding the next as input:

1. **market-signal-researcher** → `signal-reports/<topic>.md` — proof a
   pain point is real, not opinion.
2. **offer-architect** → `offer-briefs/<topic>.md` — one specific, priced,
   sellable offer (what, to whom, at what price).
3. **content-angle-strategist** → `content-angles/<topic>.md` — 3–7 angles
   mapped to funnel stage, aimed at the exact buyer with that pain.
4. **conversation-system-builder** → `conversation-blueprints/<topic>.md` —
   the actual DM/CRM conversation flow that closes, including objection
   handling and what's automated vs. human-handled.

Then: implement the blueprint in the actual tool (the `app/` CRM or another
automation platform). Real results (what closed, what got objected to) feed
back into step 1 as new signal — it's a loop, not a one-time line. Full
operator detail is in `runbooks/revenue-agent-runbook.md`.

**Decisions that are Derrick's, not an agent's** — never auto-resolve these:
- Whether a signal report is strong enough to act on, or too thin.
- Whether an offer's price matches what he's actually willing to charge/deliver.
- Which content angle he's willing to put his name behind.
- Which conversation branches he'll personally handle vs. automate.

Current pilot niche across all four output directories: **real estate
agents**, offer name **"FirstReply."**

## The `app/` CRM

A real Next.js + Prisma multi-tenant app, not just planning docs. Pipeline
stages mirror the chain exactly: **Signal → Offer → Angle → Conversation →
Won/Lost**. The "Run agent" button on a lead calls the Claude API using the
literal `.claude/agents/*.md` files as system prompts (`src/lib/agents.ts`)
— so the app and the planning docs read the same source of truth and can't
drift apart. See `app/README.md` before making changes here; it lists known
v1 shortcuts (no OAuth, no team invites, dropdown instead of drag-and-drop
for stage changes) that are intentional, not bugs to silently "fix."

Billing is provider-agnostic (`app/src/lib/billing/types.ts`) with a working
Stripe adapter; Paddle/LemonSqueezy can be added later as a second adapter
without touching call sites — don't assume Stripe-only when adding billing
logic.

## Working conventions for this repo

- Don't duplicate the cross-portfolio memory doc here — link to it in
  `Higgyd-Productions` instead.
- When adding a new pilot niche, mirror the existing four-directory
  structure (`signal-reports/`, `offer-briefs/`, `content-angles/`,
  `conversation-blueprints/`), one file per topic, same filename across all
  four.
- Keep the agent definitions in `.claude/agents/` and the runbook in sync —
  the runbook describes what the agents do in plain language, so update both
  if an agent's job or output format changes.
- Explain new concepts plainly on first use (Derrick is directing, not
  coding) but don't over-explain established ones already covered in
  `business-brief.md`.
