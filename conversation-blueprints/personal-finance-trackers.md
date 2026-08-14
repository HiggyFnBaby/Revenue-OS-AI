# Conversation Blueprint: Personal Finance Trackers (Higgyd Money OS)

**Agent:** conversation-system-builder
**Inputs:** `../offer-briefs/personal-finance-trackers.md`,
`../content-angles/personal-finance-trackers.md`

Offer being closed: **"find the subscription money you're already leaking in
week one, or it's free"** — $7/mo, no annual lock-in, full tracker included.
Not a bill-negotiation service, not couples-specific, no bank-sync-reliability
promises beyond honest manual/CSV fallback.

Two branch structures below, same reasoning as the real-estate-agents
blueprint: a HOT trigger (angle #5, already comparing paid options) can open
straight into the pitch; a COLD/WARM trigger (angles #1–#4) needs a
qualifying step first, since the reader may not have consciously identified
this as a solvable, paid problem yet.

---

## Flow A — triggered by the HOT angle (#5, tested first)

**Trigger:** Reader replied to or DM'd in response to angle #5 (the
Rocket-Money-fee contrast) — they already know they're paying, or considered
paying, someone else to find wasted spend.

### Opening move (no trust-building needed — they're already warm)

> "Yeah — that fee structure is the exact thing this avoids. Same idea
> (finds money you're leaking), but it's a flat $7/mo instead of a cut of
> whatever it finds you, and it's a full tracker too, not just a
> subscription list. Want the 30-second version?"

### Branches

- **Interested / "tell me more":**
  Send a 3-line explanation of the mechanism (links accounts, surfaces every
  recurring charge in one place, flags the ones that look forgotten/unused
  in the first week), then ask directly: *"Want to connect one account and
  see what it finds — no commitment, and if it doesn't find anything in the
  first week it's free anyway?"* — moves to a live first-look, not a pitch
  deck.

- **Price objection ("$7 is still $7 for something free apps sort of do"):**
  Anchor directly to the offer brief's own math: *"Fair — most bank apps
  show your subscriptions if you dig, they just don't flag which ones are
  dead weight. Average person's leaking about $133 a year in forgotten
  subscriptions — this pays for itself finding less than $1/month of that,
  and if it doesn't in week one, you don't pay for the month."* Do not
  discount the price — reframe against the evidenced average waste, which is
  the offer's actual pricing logic.

- **Skeptical of the guarantee ("that sounds too easy"):**
  *"Fair to be skeptical — it's not magic, it's just that most people have
  never actually looked at every recurring charge in one place at once.
  That's genuinely most of the trick."* Keeps the claim modest and
  evidence-shaped rather than overselling.

- **Timing objection ("maybe later"):**
  *"No worries — mind if I check back in a couple weeks? Takes like 5
  minutes to set up whenever you're ready."* Schedule a specific follow-up,
  don't leave it open-ended.

- **"Just looking" / comparing options:**
  *"All good — one thing worth knowing while you compare: this isn't trying
  to negotiate your bills down and take a cut, it just shows you everything
  in one place so you can decide. Happy to answer anything as you look
  around."* Low-pressure, keeps the door open without chasing.

- **Ghosting (no reply after opening move):**
  See follow-up cadence below — do not re-pitch, re-approach with new value
  each touch.

### The close

> "Sounds like this is exactly the kind of thing that's worth 5 minutes to
> check. $7/mo, cancel anytime, and if it hasn't found subscription waste in
> your first week I'll refund the month — genuinely no risk on your end.
> Want the signup link?"

This is the only message in the whole blueprint that should ever ask
directly for the sale. Every other message moves someone toward this one.

---

## Flow B — triggered by a COLD/WARM angle (#1, #2, #3, #4)

**Trigger:** Reader engaged with a stat-shock, reframe, self-assessment, or
"still using Credit Karma" hook — they may not have consciously identified
this as a solvable, paid problem yet.

### Opening move (qualify before pitching — trust-building step)

> "Curious — when's the last time you actually went through every recurring
> charge across your accounts, not just the ones you remember off the top
> of your head?"

This is a genuine qualifying question, not a rhetorical setup — if their
answer shows they already have a tight handle on every subscription (rare,
but possible), this is the honest exit point; don't push the offer onto
someone the signal report's evidence doesn't apply to.

### Branches

- **Confirms the pain ("honestly, probably not in a year / never"):**
  *"That's basically everyone — checkout makes it easy to sign up and
  nothing makes it easy to notice you're still paying. There's a simple way
  to see it all in one place, want me to walk you through it?"* — now
  transitions into Flow A's opening move.

- **Doesn't recognize the pain / unclear ("I think I'm pretty on top of it"):**
  *"Good to hear — if that ever changes, happy to share what's worked for
  other people."* Exit gracefully; log as low-priority nurture, not active
  follow-up (see cadence).

- **Mentions Mint/Credit Karma specifically (angle #3 responders):**
  *"Yeah, Credit Karma's budgeting is pretty thin compared to what Mint
  used to do. This isn't trying to be Mint again exactly — it does the full
  tracking, but the actual point is catching what you're paying for and
  forgetting, not just categorizing spend."* Reinforces the offer's real
  differentiator (waste-finding) rather than just "Mint replacement," per
  the offer brief's own reasoning about that trigger fading.

- **Price objection (comes up after transitioning into Flow A):** Use
  Flow A's price objection response.

- **Skeptical ("sounds like every other budgeting app"):**
  *"Fair to be skeptical — most of these ask you to categorize everything
  by hand and hope you keep it up. This one's built around one specific
  job: tell you what you're wasting, in the first week, automatically."*
  Reinforces the offer brief's explicit scope boundary as the
  differentiator.

- **Ghosting after the qualifying question:**
  See follow-up cadence below.

### The close

Same close message as Flow A, used once the conversation has moved from
qualifying into the pitch.

---

## Follow-up cadence

- **Touch 1:** Immediate reply to their engagement (same day).
- **Touch 2:** If no reply, follow up once after **3 days** with new value,
  not a repeat ask — e.g. share the $133/year average-waste stat if it
  wasn't used yet, or ask the qualifying question a different way.
- **Touch 3:** If still no reply, follow up once after **7 more days**
  (10 days total) with a low-pressure, no-pitch check-in: *"No worries if
  now's not the time — I'll leave this here in case it's useful later."*
- **After touch 3 with no response:** Move to long-term nurture (occasional
  value content, not active follow-up) rather than continuing to chase.

## Handoff to the CRM/automation tool

This maps directly onto `revenue-os/app/`'s pipeline, the same way the
real-estate-agents pilot uses it — the CRM here tracks *prospects for the
Higgyd Money OS offer*, not the finance-tracking product's own end-user data:

- **Automated already, today:** moving a lead into the `CONVERSATION` stage
  auto-creates a task ("implement the blueprint in your outreach") — that's
  the trigger reminder to start Flow A or B manually.
- **Manual (human-required):** every actual DM/reply in both flows above.
  v1 of the app has no social/DM platform integration, so a person sends
  these messages on whatever platform the conversation is happening on
  (Reddit, forums, comment sections) and logs the outcome as a lead note or
  stage change in the CRM — the CRM tracks *state*, it doesn't send the
  messages itself yet.
- **Candidate for future automation** (not built yet, flagging for later):
  touch 2 and touch 3 of the follow-up cadence are formulaic enough (fixed
  wait times, near-fixed message content) that they could become a
  scheduled reminder or auto-send in a later version — touch 1 and all
  objection-branch responses should stay human, since they require reading
  the actual reply.
- **Stage-change discipline:** move the lead to `WON` or `LOST` the moment
  the close message gets a yes/no — not before — so the pipeline reflects
  reality, not optimism.

## Closing the loop

Whatever actually happens when this runs — which objection came up most,
whether the "$7 flat vs. Rocket Money's cut" contrast actually lands, what
real close rate this gets, any language a prospect used that wasn't
anticipated here — is new signal, and this round's evidence gaps (zero
first-person Reddit quotes, a possibly-stale Mint-shutdown trigger) make
that real-world feedback more valuable than usual. Feed it back into
`market-signal-researcher` for round two, per the runbook. This blueprint is
a starting hypothesis for round one, not a finished script to run unchanged
forever.
