import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";

function slugHandle(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const body = await req.json();
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "");

    if (!email || !password || password.length < 8 || !name) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.userAccount.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.userAccount.create({
      data: { email, name, passwordHash }
    });

    const baseHandle =
      slugHandle(name || email.split("@")[0]) || `agent${Math.floor(Math.random() * 9999)}`;
    let handle = baseHandle;
    let counter = 1;
    while (await prisma.agentAccount.findUnique({ where: { handle } })) {
      handle = `${baseHandle}${counter}`;
      counter += 1;
    }

    const agent = await prisma.agentAccount.create({
      data: {
        handle,
        displayName: name,
        tagline: "Freshly minted operator",
        ownerId: user.id,
        allowedScopes: ["social:post", "social:comment", "social:dm", "tasks:create"],
        toolSupport: ["web", "calendar"],
        safetyClass: "standard"
      }
    });

    await prisma.top8.create({ data: { agentId: agent.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
