# Revenue OS CRM (v1)

This is the actual running application version of the Revenue OS idea
described in `../business-brief.md` and `../runbooks/revenue-agent-runbook.md`.
Read those first if you haven't — this file is just "how to run it," not
"why it exists."

## What this is, in plain terms

A CRM where every lead moves through five stages that match the Revenue OS
chain: **Signal → Offer → Angle → Conversation → Won/Lost**. On each lead's
page, a "Run agent" button calls the Claude API using the exact same agent
definitions from `../.claude/agents/` — so the CRM and the planning docs
never drift apart; they're reading the same files.

It's a real multi-tenant app: anyone who signs up gets their own private
workspace, and billing (Stripe, to start) gates access per workspace.

## Before you can run it, you need three things

You don't need to be a developer to get these — each is a signup form on a
website, not a coding task.

1. **A Postgres database.** Easiest free option: create a project at
   [supabase.com](https://supabase.com) or [neon.tech](https://neon.tech) and
   copy the connection string into `DATABASE_URL`.
2. **An Anthropic API key.** Create one at
   [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   and put it in `ANTHROPIC_API_KEY`. This is what makes the "Run agent"
   button actually work — without it, everything else in the app still
   works, that one button just returns an error.
3. **A Stripe account** (test mode is fine while building). Create a
   recurring Price for your subscription in the Stripe Dashboard, and put its
   secret key + price ID + webhook secret into the matching `.env` values.
   Until this is set up, the "Upgrade" button on the billing page will show
   an error instead of a checkout page — everything else still works.

## Running it locally

```bash
cp .env.example .env
# fill in .env with real values, at minimum DATABASE_URL and NEXTAUTH_SECRET

npm install
npm run db:push      # creates the tables in your database from prisma/schema.prisma
npm run dev          # starts the app at http://localhost:3000
```

Then visit `http://localhost:3000`, click "Create workspace," and you're in.

## Tests

```bash
npm test              # everything
npm run test:unit     # no database needed
npm run test:integration
npm run test:watch
```

`tests/unit/` needs nothing but the repo. `tests/integration/` runs against a
real PostgreSQL and is **skipped** when `DATABASE_URL` is unset, so `npm test`
still works on a fresh clone. CI always provides one (a `postgres:16` service),
so everything runs on every pull request.

To run the integration tests locally, point `DATABASE_URL` and `DIRECT_URL` at
any throwaway Postgres, run `npm run db:push` once, then `npm test`.

What they cover, and why those pieces:

- **Multi-tenant isolation** — that one workspace cannot read another's leads,
  even by exact id. The one bug here that would leak customer data.
- **Access gating** (`hasActiveAccess`) — every branch of trial-vs-subscription.
  Wrong either way means giving the product away or locking out a payer.
- **Stripe webhook parsing** — against payloads signed with Stripe's own
  helper. Pins that the renewal date is read from the subscription *item*,
  which is where Stripe v22 moved it; reading the old place silently wrote an
  invalid date for every subscriber.
- **Password reset** — the whole lifecycle: single use, expiry, superseding an
  older link, the per-address cap, and that a request which cannot send email
  writes nothing and leaves an existing link working.
- **Stage-change automation** — that the lead, the audit event and the
  next-action task are written together.
- **Agent run quota** — the caps that stand between one script and the month's
  model budget, including that they count per workspace.

## What's real vs. what's a v1 shortcut

- **Real:** auth, multi-tenant data isolation, the pipeline board, stage-change
  automation (auto-created tasks), the Claude API agent runs, the Stripe
  checkout + webhook flow, the Stripe Customer Portal ("Manage billing" on the
  billing page, for card changes, invoices, and cancellation), a per-workspace
  quota on agent runs, and the provider-agnostic billing interface.
- **v1 shortcuts, worth knowing about before this goes to real customers:**
  - Login is email+password only — no Google/OAuth login. "Forgot password"
    works (emailed one-hour link via Resend; see `.env.example`).
  - No team invites yet — one user per workspace (the person who signed up).
  - The pipeline board uses a dropdown to change stage, not drag-and-drop —
    functionally equivalent, just less polished.
  - Only Stripe is wired up; Paddle/LemonSqueezy would need a new file in
    `src/lib/billing/` implementing the same interface (see that folder's
    `types.ts`).

## Where things live (if you want to look under the hood)

- `prisma.config.ts` — where the Prisma CLI (`db:push`, `db:migrate`) reads its
  connection URL since Prisma 7; the running app connects separately through
  the driver adapter in `src/lib/prisma.ts`.
- `prisma/schema.prisma` — the data model (Workspace, Lead, AgentRun, Task,
  StageEvent, Subscription).
- `src/lib/agents.ts` — loads the real agent definitions from
  `../.claude/agents/*.md` as Claude API system prompts.
- `src/lib/automations.ts` — the one classic automation: stage change always
  creates a next-action task.
- `src/lib/passwordReset.ts` + `src/lib/email.ts` — the forgot/reset password
  flow: hashed single-use tokens in `PasswordResetToken`, links emailed
  through Resend.
- `src/app/terms/` and `src/app/privacy/` — the Terms of Service and Privacy
  Policy, linked from the landing page footer, login, and signup. Operator
  facts (company name, contact email, governing law) come from
  `src/lib/legal.ts`, which reads the `NEXT_PUBLIC_*` variables in
  `.env.example`. The subprocessor list there must match what the code
  actually calls.
- `src/lib/billing/` — the provider-agnostic billing interface + Stripe
  implementation (checkout, customer portal, webhook parsing).
- `src/lib/agentRunLimits.ts` — the per-workspace agent-run quota
  (`AGENT_RUNS_PER_HOUR` / `AGENT_RUNS_PER_DAY`), counted from the `AgentRun`
  table so it needs no extra infrastructure.
- `src/app/dashboard/` — the actual UI (pipeline board, lead detail, billing).
