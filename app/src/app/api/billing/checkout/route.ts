import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  // A workspace that has been billed before (a lapsed or canceled
  // subscription) already has a customer record at the provider. Reuse it so
  // the portal and invoice history stay attached to one customer.
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { providerCustomerId: true },
  });

  const { url } = await getBillingProvider().createCheckoutSession({
    workspaceId: session.user.workspaceId,
    customerEmail: session.user.email,
    existingCustomerId: existing?.providerCustomerId ?? undefined,
    successUrl: `${origin}/dashboard/billing?checkout=success`,
    cancelUrl: `${origin}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url });
}
