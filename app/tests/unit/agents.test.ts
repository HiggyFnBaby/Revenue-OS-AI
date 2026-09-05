import { describe, it, expect } from "vitest";
import { AGENT_FOR_STAGE, AGENT_FILES, loadAgentDefinition } from "@/lib/agents";

// The stage -> agent map decides which prompt runs when someone clicks "Run
// agent". A wrong entry silently runs the wrong agent, which reads as a bad
// model rather than a bug, so it is pinned exactly.

describe("AGENT_FOR_STAGE", () => {
  it("maps each working stage to its own agent", () => {
    expect(AGENT_FOR_STAGE).toMatchObject({
      SIGNAL: "MARKET_SIGNAL_RESEARCHER",
      OFFER: "OFFER_ARCHITECT",
      ANGLE: "CONTENT_ANGLE_STRATEGIST",
      CONVERSATION: "CONVERSATION_SYSTEM_BUILDER",
    });
  });

  it("has no agent for the end states", () => {
    expect(AGENT_FOR_STAGE.WON).toBeUndefined();
    expect(AGENT_FOR_STAGE.LOST).toBeUndefined();
  });

  it("never maps two stages to the same agent", () => {
    const agents = Object.values(AGENT_FOR_STAGE);
    expect(new Set(agents).size).toBe(agents.length);
  });
});

describe("loadAgentDefinition", () => {
  it.each(Object.keys(AGENT_FILES) as (keyof typeof AGENT_FILES)[])(
    "returns a usable system prompt for %s",
    (agent) => {
      const def = loadAgentDefinition(agent);
      expect(def.name).toBe(agent);
      expect(def.systemPrompt.length).toBeGreaterThan(200);
      expect(def.description.length).toBeGreaterThan(0);
    }
  );

  it("throws a actionable error for an agent with no bundled definition", () => {
    // @ts-expect-error deliberately outside the union
    expect(() => loadAgentDefinition("NOT_A_REAL_AGENT")).toThrow(/sync:agents/);
  });
});
