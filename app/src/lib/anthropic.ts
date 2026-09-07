import Anthropic from "@anthropic-ai/sdk";
import type { AgentRun, Lead } from "@prisma/client";
import { loadAgentDefinition, AGENT_FOR_STAGE } from "@/lib/agents";

// Model defaults. ANTHROPIC_MODEL overrides, but must name a current model
// (Claude 4.6 or later): this code sends adaptive thinking and the
// server-side fallback chain, which older models reject with a 400.
const DEFAULT_MODEL = "claude-opus-5";
const MODEL = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

// Room for a full report. Streaming (below) keeps a long generation from
// tripping the SDK's HTTP timeout; the route's maxDuration is the real cap.
const MAX_TOKENS = 16000;

// Optional cost/latency dial. Unset means the API default (high). "medium"
// is the usual step down that still holds quality on these models; "low"
// is for quick passes.
const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORT_LEVELS)[number];
function effortFromEnv(): Effort | undefined {
  const raw = process.env.ANTHROPIC_EFFORT;
  return (EFFORT_LEVELS as readonly string[]).includes(raw ?? "") ? (raw as Effort) : undefined;
}

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env — see .env.example for where to get one."
    );
  }
  return new Anthropic({ apiKey });
}

// Builds the input handed to the agent: the lead's own details, plus the
// full chain of every prior agent's output for this lead. This is what makes
// it a chain and not four disconnected AI calls — offer-architect actually
// reads what market-signal-researcher found, not a fresh blank slate.
function buildUserMessage(lead: Lead, priorRuns: AgentRun[]): string {
  const leadSummary = [
    `Lead name: ${lead.name}`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.contactInfo ? `Contact: ${lead.contactInfo}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const priorSection = priorRuns.length
    ? priorRuns
        .map((run) => `--- Prior output from ${run.agent} (${run.createdAt.toISOString()}) ---\n${run.output}`)
        .join("\n\n")
    : "No prior agent runs for this lead yet — this is the first step in the chain.";

  return `${leadSummary}\n\n${priorSection}`;
}

export async function runAgentForLead(lead: Lead, priorRuns: AgentRun[]) {
  const agentName = AGENT_FOR_STAGE[lead.stage];
  if (!agentName) {
    throw new Error(`No agent runs at stage ${lead.stage} — it's an end state, not a chain step.`);
  }

  const definition = loadAgentDefinition(agentName);
  const userMessage = buildUserMessage(lead, priorRuns);
  const effort = effortFromEnv();

  const stream = client().beta.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: definition.systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    // Adaptive thinking: the model decides how much to reason per request.
    thinking: { type: "adaptive" },
    ...(effort ? { output_config: { effort } } : {}),
    // If the model's safety classifiers decline the request, the API re-runs
    // it on the model's server-defined fallback inside the same call instead
    // of returning nothing. `response.model` reports whichever model answered.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  const response = await stream.finalMessage();

  if (response.stop_reason === "refusal") {
    const why = response.stop_details?.type === "refusal" ? response.stop_details.explanation : undefined;
    throw new Error(
      `The model declined to run this agent${why ? `: ${why}` : "."} Review the lead's notes and try again.`
    );
  }

  let output = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (response.stop_reason === "max_tokens") {
    output += "\n\n[Output was cut off at the length limit. Run the agent again to continue from here.]";
  }

  return { agent: agentName, input: userMessage, output, model: response.model };
}
