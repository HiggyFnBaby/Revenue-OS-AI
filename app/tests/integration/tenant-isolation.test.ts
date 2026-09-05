import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { hasDatabase, resetDatabase, createWorkspace } from "./helpers";

// Multi-tenancy is the property that, if it broke, would leak one customer's
// leads to another. Every API route filters by a workspaceId taken from the
// session; these tests pin that the filter actually excludes.

describe.skipIf(!hasDatabase)("tenant isolation", () => {
  beforeEach(resetDatabase);

  it("does not return another workspace's lead, even by exact id", async () => {
    const a = await createWorkspace("a@example.com");
    const b = await createWorkspace("b@example.com");
    const lead = await prisma.lead.create({ data: { workspaceId: a.workspaceId, name: "A's lead" } });

    // How every route scopes a lookup.
    const asOwner = await prisma.lead.findFirst({ where: { id: lead.id, workspaceId: a.workspaceId } });
    const asOther = await prisma.lead.findFirst({ where: { id: lead.id, workspaceId: b.workspaceId } });

    expect(asOwner?.id).toBe(lead.id);
    expect(asOther).toBeNull();
  });

  it("lists only the requesting workspace's leads", async () => {
    const a = await createWorkspace("a@example.com");
    const b = await createWorkspace("b@example.com");
    await prisma.lead.createMany({
      data: [
        { workspaceId: a.workspaceId, name: "a1" },
        { workspaceId: a.workspaceId, name: "a2" },
        { workspaceId: b.workspaceId, name: "b1" },
      ],
    });

    const forA = await prisma.lead.findMany({ where: { workspaceId: a.workspaceId } });
    expect(forA.map((l) => l.name).sort()).toEqual(["a1", "a2"]);
  });

  it("deleting a workspace removes its leads and everything hanging off them", async () => {
    const { workspaceId } = await createWorkspace();
    const lead = await prisma.lead.create({ data: { workspaceId, name: "doomed" } });
    await prisma.agentRun.create({
      data: { leadId: lead.id, agent: "MARKET_SIGNAL_RESEARCHER", input: "i", output: "o", model: "claude-opus-5" },
    });
    await prisma.task.create({ data: { leadId: lead.id, title: "t" } });

    await prisma.workspace.delete({ where: { id: workspaceId } });

    expect(await prisma.lead.count({ where: { id: lead.id } })).toBe(0);
    expect(await prisma.agentRun.count({ where: { leadId: lead.id } })).toBe(0);
    expect(await prisma.task.count({ where: { leadId: lead.id } })).toBe(0);
  });

  it("keeps one account per email address", async () => {
    await createWorkspace("dup@example.com");
    await expect(createWorkspace("dup@example.com")).rejects.toThrow();
  });
});
