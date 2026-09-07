import { prisma } from "@/lib/prisma";
import { trialEndDate } from "@/lib/access";

// Integration tests run against a real PostgreSQL. Without one they are
// skipped rather than failing, so `npm test` still works for someone who has
// only cloned the repo; CI always provides a database, so they always run there.
export const hasDatabase = Boolean(process.env.DATABASE_URL);

export async function resetDatabase() {
  // Ordered child-first. The schema cascades, but deleting explicitly keeps a
  // failure pointing at the table that actually refused.
  await prisma.passwordResetToken.deleteMany({});
  await prisma.agentRun.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.stageEvent.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});
}

/** Creates a signed-up tenant the way /api/signup does: user + workspace + owner membership. */
export async function createWorkspace(email = `user-${Date.now()}-${Math.random()}@example.com`) {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "test-hash",
      memberships: { create: { role: "owner", workspace: { create: { name: "Test WS", trialEndsAt: trialEndDate() } } } },
    },
    include: { memberships: true },
  });
  return { user, workspaceId: user.memberships[0].workspaceId };
}
