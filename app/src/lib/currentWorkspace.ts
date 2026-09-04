import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkspaceAccess } from "@/lib/access";

// Every API route that touches Lead/Task/AgentRun data calls this first.
// It's the one place tenant isolation is enforced: if there's no session or
// no workspaceId, the caller gets null and must return 401 — nothing past
// this point ever trusts a workspaceId that didn't come from the session.
export async function requireWorkspaceId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.workspaceId ?? null;
}

// Server-component counterpart for pages under /dashboard. The layout also
// redirects, but Next renders a layout and its page in parallel, so a page
// cannot rely on the layout having sent the visitor to /login first — a
// logged-out request would reach `session.user` on a null session and throw
// before the layout's redirect took effect. Calling this at the top of every
// dashboard page makes each page safe on its own.
export async function requireWorkspaceIdOrRedirect(): Promise<string> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) redirect("/login");
  return workspaceId;
}

// Stronger version for routes that cost money to call (agent runs) or
// create new billable usage (creating leads). Checked server-side, not just
// in the UI, so someone can't keep using the app for free by calling the API
// directly after their trial expires — the UI redirect alone wouldn't stop
// that.
export async function requireActiveWorkspaceId(): Promise<
  { workspaceId: string } | { errorResponse: NextResponse }
> {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const access = await getWorkspaceAccess(workspaceId);
  if (!access.active) {
    return {
      errorResponse: NextResponse.json(
        { error: "Your trial has ended. Upgrade to keep using Revenue OS." },
        { status: 402 }
      ),
    };
  }

  return { workspaceId };
}
