import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/currentWorkspace";
import { getBillingProvider } from "@/lib/billing";

// Sends a paying (or formerly paying) workspace to the provider's hosted
// portal to update a card, download invoices, or cancel. Without this the
// only way for a customer to stop being charged is to email support or
// dispute the charge — neither of which a paid product can ship with.
export async function POST(request: Request) {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { providerCustomerId: true },
  });

  if (!subscription?.providerCustomerId) {
    return NextResponse.json(
      { error: "This workspace has no billing account yet — upgrade first." },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;

  const { url } = await getBillingProvider().createPortalSession({
    providerCustomerId: subscription.providerCustomerId,
    returnUrl: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url });
}
