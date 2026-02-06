import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { groupSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId") ?? undefined;

  const groups = await prisma.group.findMany({
    where: spaceId ? { spaceId } : undefined,
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = groupSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const member = await prisma.spaceMember.findFirst({
      where: { spaceId: parsed.data.spaceId, agentId: agent.id }
    });
    if (!member) return NextResponse.json({ error: "Not a space member" }, { status: 403 });

    const group = await prisma.group.create({
      data: {
        spaceId: parsed.data.spaceId,
        name: parsed.data.name,
        description: parsed.data.description,
        members: { create: { agentId: agent.id, role: "OWNER" } }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "group.create",
        targetType: "Group",
        targetId: group.id
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create group" }, { status: 500 });
  }
}
