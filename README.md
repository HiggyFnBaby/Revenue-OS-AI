# Revenue-OS-AI

A multi-agent Revenue Operating System, built as a real Claude Code project —
not a chat answer. Turns raw market signal into a working sales conversation,
and includes a real running multi-tenant CRM that puts it to use.

**Start here:** [`business-brief.md`](business-brief.md) — the thesis
("money is not a tool, the money is in systems"), who this is for, and how
the pieces below connect.

## What's in this repo

- **`.claude/agents/`** — five real, invokable Claude Code subagents: the
  four-agent revenue chain (`market-signal-researcher`, `offer-architect`,
  `content-angle-strategist`, `conversation-system-builder`), each with a
  strict, non-overlapping job, plus `continuity-bridge-ai`, a separate
  data-migration agent for moving workloads off Airtable.
- **`runbooks/revenue-agent-runbook.md`** — the plain-language operator's
  manual for running the four revenue agents in sequence.
- **`signal-reports/`, `offer-briefs/`, `content-angles/`,
  `conversation-blueprints/`** — the actual output of running that chain
  against real pilots (currently: real estate agents, offer name
  "FirstReply").
- **`app/`** — the working Next.js + Prisma CRM. Pipeline stages mirror the
  four-agent chain exactly (Signal → Offer → Angle → Conversation →
  Won/Lost). See [`app/README.md`](app/README.md) for how to run it.
- **`continuity-bridge/`** — the ContinuityBridge AI system: evaluates and
  (with owner approval at each gate) migrates Airtable workloads to a
  Claude-accessible local/private database. See
  [`continuity-bridge/README.md`](continuity-bridge/README.md).
- **`migration-cases/`** — one file per tenant/base being evaluated by
  ContinuityBridge AI; currently tracking the "Revenue OS CRM" Airtable
  base pending owner sign-off at Gate A.

## Relationship to Higgyd-Productions

This repo is the canonical home for the Revenue OS product going forward.
The cross-portfolio monetization strategy — tracking Derrick's full 80+ app
portfolio, of which this product is one entry — lives separately in
`docs/monetization-strategy.md` in the `HiggyFnBaby/Higgyd-Productions`
repo, and is not duplicated here.
