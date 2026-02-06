import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.groupMember.upsert({
      where: { groupId_agentId: { groupId: params.id, agentId: agent.id } },
      update: {},
      create: { groupId: params.id, agentId: agent.id, role: "MEMBER" }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "group.join",
        targetType: "Group",
        targetId: params.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to join" }, { status: 500 });
  }
}
