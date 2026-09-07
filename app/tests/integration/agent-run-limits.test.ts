import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { checkAgentRunQuota, agentRunLimits } from "@/lib/agentRunLimits";
import { hasDatabase, resetDatabase, createWorkspace } from "./helpers";

// Every agent run is a paid model call on a trial that needs no card, so this
// quota is the only thing between one script and the month's API budget.

async function seedRuns(workspaceId: string, count: number, ageMs = 0) {
  const lead = await prisma.lead.create({ data: { workspaceId, name: `lead-${Math.random()}` } });
  for (let i = 0; i < count; i++) {
    await prisma.agentRun.create({
      data: {
        leadId: lead.id,
        agent: "MARKET_SIGNAL_RESEARCHER",
        input: "i",
        output: "o",
        model: "claude-opus-5",
        ...(ageMs ? { createdAt: new Date(Date.now() - ageMs) } : {}),
      },
    });
  }
  return lead;
}

describe.skipIf(!hasDatabase)("agent run quota", () => {
  beforeEach(resetDatabase);

  it("allows a workspace that has run nothing", async () => {
    const { workspaceId } = await createWorkspace();
    expect(await checkAgentRunQuota(workspaceId)).toEqual({ allowed: true });
  });

  it("blocks once the hourly cap is reached", async () => {
    const { perHour } = agentRunLimits();
    const { workspaceId } = await createWorkspace();
    await seedRuns(workspaceId, perHour);

    const quota = await checkAgentRunQuota(workspaceId);
    expect(quota.allowed).toBe(false);
    if (!quota.allowed) {
      expect(quota.retryAfterSeconds).toBeGreaterThan(0);
      expect(quota.message).toMatch(/hour/i);
    }
  });

  it("still allows the run one short of the cap", async () => {
    const { perHour } = agentRunLimits();
    const { workspaceId } = await createWorkspace();
    await seedRuns(workspaceId, perHour - 1);
    expect((await checkAgentRunQuota(workspaceId)).allowed).toBe(true);
  });

  it("ignores runs that have aged out of the window", async () => {
    const { perHour } = agentRunLimits();
    const { workspaceId } = await createWorkspace();
    await seedRuns(workspaceId, perHour, 2 * 60 * 60 * 1000); // two hours ago
    expect((await checkAgentRunQuota(workspaceId)).allowed).toBe(true);
  });

  it("counts per workspace, so one tenant cannot exhaust another's quota", async () => {
    const { perHour } = agentRunLimits();
    const busy = await createWorkspace("busy@example.com");
    const quiet = await createWorkspace("quiet@example.com");
    await seedRuns(busy.workspaceId, perHour);

    expect((await checkAgentRunQuota(busy.workspaceId)).allowed).toBe(false);
    expect((await checkAgentRunQuota(quiet.workspaceId)).allowed).toBe(true);
  });

  it("reports the daily cap when that is the binding limit", async () => {
    const { perDay } = agentRunLimits();
    const { workspaceId } = await createWorkspace();
    // Old enough to leave the hourly window, recent enough to stay in the day.
    await seedRuns(workspaceId, perDay, 90 * 60 * 1000);

    const quota = await checkAgentRunQuota(workspaceId);
    expect(quota.allowed).toBe(false);
    if (!quota.allowed) expect(quota.message).toMatch(/today/i);
  });
});
