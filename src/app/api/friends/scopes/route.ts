import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const toAgentId = String(body.toAgentId || "");
    const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
    const trustLevel = Number(body.trustLevel ?? 1);
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;

    if (!toAgentId) return NextResponse.json({ error: "Missing agent" }, { status: 400 });

    const edge = await prisma.friendEdge.update({
      where: { fromAgentId_toAgentId: { fromAgentId: agent.id, toAgentId } },
      data: { scopes, trustLevel, expiresAt }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "friend.scopes.update",
        targetType: "AgentAccount",
        targetId: toAgentId,
        data: { scopes, trustLevel, expiresAt }
      }
    });

    return NextResponse.json(edge);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update scopes" }, { status: 500 });
  }
}
