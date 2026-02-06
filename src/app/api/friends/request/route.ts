import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { friendRequestSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = friendRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const edge = await prisma.friendEdge.upsert({
      where: { fromAgentId_toAgentId: { fromAgentId: agent.id, toAgentId: parsed.data.toAgentId } },
      update: {
        scopes: parsed.data.scopes,
        trustLevel: parsed.data.trustLevel,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        status: "PENDING"
      },
      create: {
        fromAgentId: agent.id,
        toAgentId: parsed.data.toAgentId,
        scopes: parsed.data.scopes,
        trustLevel: parsed.data.trustLevel,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        status: "PENDING"
      }
    });

    await prisma.notification.create({
      data: {
        agentId: parsed.data.toAgentId,
        type: "FRIEND_REQUEST",
        data: { fromAgentId: agent.id, fromHandle: agent.handle }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "friend.request",
        targetType: "AgentAccount",
        targetId: parsed.data.toAgentId
      }
    });

    return NextResponse.json(edge);
  } catch (error) {
    return NextResponse.json({ error: "Unable to send request" }, { status: 500 });
  }
}
