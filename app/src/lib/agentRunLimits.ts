import { prisma } from "@/lib/prisma";

// Every agent run is a paid Anthropic API call, and a free trial needs no
// card. Without a ceiling, one script against /run-agent can spend the whole
// month's API budget before anyone notices. The ceiling is per workspace and
// counted from the AgentRun table, so it holds across serverless instances
// without any extra infrastructure — at the cost of a small race where two
// requests that land in the same instant can both pass. That is fine: the
// goal is to bound abuse, not to be exact to the run.
//
// Runs that fail before a row is written (an Anthropic error) are not
// counted. They cost little or nothing, and counting them would let an
// outage lock a workspace out of its quota.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const DEFAULT_RUNS_PER_HOUR = 20;
const DEFAULT_RUNS_PER_DAY = 100;

function limitFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function agentRunLimits() {
  return {
    perHour: limitFromEnv("AGENT_RUNS_PER_HOUR", DEFAULT_RUNS_PER_HOUR),
    perDay: limitFromEnv("AGENT_RUNS_PER_DAY", DEFAULT_RUNS_PER_DAY),
  };
}

export type AgentRunQuota =
  | { allowed: true }
  | { allowed: false; message: string; retryAfterSeconds: number };

async function windowState(workspaceId: string, windowMs: number, now: number) {
  const since = new Date(now - windowMs);
  const where = { lead: { workspaceId }, createdAt: { gte: since } };
  const [count, oldest] = await Promise.all([
    prisma.agentRun.count({ where }),
    prisma.agentRun.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  // When the oldest run in the window ages out, one slot frees up.
  const retryAfterSeconds = oldest
    ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + windowMs - now) / 1000))
    : 1;
  return { count, retryAfterSeconds };
}

export async function checkAgentRunQuota(workspaceId: string): Promise<AgentRunQuota> {
  const { perHour, perDay } = agentRunLimits();
  const now = Date.now();

  const [hour, day] = await Promise.all([
    windowState(workspaceId, HOUR_MS, now),
    windowState(workspaceId, DAY_MS, now),
  ]);

  if (day.count >= perDay) {
    return {
      allowed: false,
      message: `This workspace has used its ${perDay} agent runs for today. Try again later.`,
      retryAfterSeconds: day.retryAfterSeconds,
    };
  }

  if (hour.count >= perHour) {
    return {
      allowed: false,
      message: `This workspace has used its ${perHour} agent runs for this hour. Try again in a little while.`,
      retryAfterSeconds: hour.retryAfterSeconds,
    };
  }

  return { allowed: true };
}
