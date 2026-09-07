import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { trialEndDate } from "@/lib/access";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

// Creates a brand-new tenant: one User, one Workspace, one owner Membership.
// This is the only place a Workspace gets created in v1 — there's no
// "invite a teammate to an existing workspace" flow yet.
export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name, workspaceName } = body as {
    email?: string;
    password?: string;
    name?: string;
    workspaceName?: string;
  };

  if (!email || !password || !workspaceName) {
    return NextResponse.json(
      { error: "email, password, and workspaceName are required" },
      { status: 400 }
    );
  }

  // Enforced here rather than only in the signup form: the form is just one
  // caller of this route, and a password accepted here is a password that
  // guards a whole workspace's data forever.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      memberships: {
        create: {
          role: "owner",
          workspace: { create: { name: workspaceName, trialEndsAt: trialEndDate() } },
        },
      },
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
