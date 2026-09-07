import { AgentName, PipelineStage } from "@prisma/client";
import { AGENT_DEFINITIONS } from "@/lib/agentDefinitions.generated";

// This app's agents are not re-implemented here — they come from
// ../../.claude/agents/*.md, the same real Claude Code subagent definitions
// from the planning phase. That's the point: the CRM doesn't have its own
// separate copy of "what offer-architect does" that can drift out of sync.
//
// Those .md files sit outside the Next.js app root, so they can't be read
// with fs at runtime — Next's build tracing doesn't bundle them and the
// deployed app has no parent .claude/ directory to read from. Instead
// scripts/sync-agent-definitions.mjs inlines them into
// agentDefinitions.generated.ts at build time (`npm run sync:agents`, wired
// into prebuild), which keeps the .md files as the single source of truth
// while making the prompts survive deployment. CI runs the script with
// --check so a .md edit that wasn't re-synced fails the build.

export const AGENT_FILES: Record<AgentName, string> = {
  MARKET_SIGNAL_RESEARCHER: "market-signal-researcher.md",
  OFFER_ARCHITECT: "offer-architect.md",
  CONTENT_ANGLE_STRATEGIST: "content-angle-strategist.md",
  CONVERSATION_SYSTEM_BUILDER: "conversation-system-builder.md",
};

// Maps a lead's current pipeline stage to the agent that should run on it.
// WON/LOST have no agent to run — they're end states, not chain steps.
export const AGENT_FOR_STAGE: Partial<Record<PipelineStage, AgentName>> = {
  SIGNAL: "MARKET_SIGNAL_RESEARCHER",
  OFFER: "OFFER_ARCHITECT",
  ANGLE: "CONTENT_ANGLE_STRATEGIST",
  CONVERSATION: "CONVERSATION_SYSTEM_BUILDER",
};

export interface AgentDefinition {
  name: AgentName;
  description: string;
  systemPrompt: string;
}

export function loadAgentDefinition(agent: AgentName): AgentDefinition {
  const definition = AGENT_DEFINITIONS[agent];
  if (!definition) {
    throw new Error(
      `No bundled definition for agent ${agent}. Run \`npm run sync:agents\` ` +
        `to regenerate it from .claude/agents/${AGENT_FILES[agent]}.`
    );
  }

  return {
    name: agent,
    description: definition.description,
    systemPrompt: definition.systemPrompt,
  };
}
