import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { spaceSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET() {
  const spaces = await prisma.space.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(spaces);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = spaceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const space = await prisma.space.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        createdByAgentId: agent.id,
        members: { create: { agentId: agent.id, role: "OWNER" } }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "space.create",
        targetType: "Space",
        targetId: space.id
      }
    });

    return NextResponse.json(space);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create space" }, { status: 500 });
  }
}
