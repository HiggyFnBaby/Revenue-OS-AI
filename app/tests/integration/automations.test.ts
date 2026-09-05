import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { changeLeadStage } from "@/lib/automations";
import { hasDatabase, resetDatabase, createWorkspace } from "./helpers";

// A stage change writes three rows in one transaction: the lead's new stage,
// an audit event, and the next-action task. The promise the product makes is
// that a lead never goes quiet, so a partial write here is a silent failure.

describe.skipIf(!hasDatabase)("changeLeadStage", () => {
  beforeEach(resetDatabase);

  it("updates the stage, records the transition, and creates a task", async () => {
    const { workspaceId } = await createWorkspace();
    const lead = await prisma.lead.create({ data: { workspaceId, name: "Acme" } });

    const task = await changeLeadStage(lead.id, "OFFER");

    const after = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    const events = await prisma.stageEvent.findMany({ where: { leadId: lead.id } });

    expect(after.stage).toBe("OFFER");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ fromStage: "SIGNAL", toStage: "OFFER" });
    expect(task.leadId).toBe(lead.id);
    expect(task.title.length).toBeGreaterThan(0);
    expect(task.done).toBe(false);
  });

  it("writes a distinct next action for every stage", async () => {
    const { workspaceId } = await createWorkspace();
    const lead = await prisma.lead.create({ data: { workspaceId, name: "Acme" } });

    const titles: string[] = [];
    for (const stage of ["OFFER", "ANGLE", "CONVERSATION", "WON"] as const) {
      titles.push((await changeLeadStage(lead.id, stage)).title);
    }

    expect(new Set(titles).size).toBe(titles.length);
  });

  it("builds a full audit trail across several moves", async () => {
    const { workspaceId } = await createWorkspace();
    const lead = await prisma.lead.create({ data: { workspaceId, name: "Acme" } });

    await changeLeadStage(lead.id, "OFFER");
    await changeLeadStage(lead.id, "ANGLE");
    await changeLeadStage(lead.id, "LOST");

    const events = await prisma.stageEvent.findMany({ where: { leadId: lead.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => [e.fromStage, e.toStage])).toEqual([
      ["SIGNAL", "OFFER"],
      ["OFFER", "ANGLE"],
      ["ANGLE", "LOST"],
    ]);
  });

  it("writes nothing when the lead does not exist", async () => {
    const before = await prisma.task.count();
    await expect(changeLeadStage("no-such-lead", "OFFER")).rejects.toThrow();
    expect(await prisma.task.count()).toBe(before);
  });
});
