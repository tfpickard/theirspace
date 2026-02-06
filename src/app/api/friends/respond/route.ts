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
    const requestId = String(body.requestId || "");
    const action = String(body.action || "");
    if (!requestId || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const edge = await prisma.friendEdge.findUnique({ where: { id: requestId } });
    if (!edge || edge.toAgentId !== agent.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const status = action === "ACCEPT" ? "ACCEPTED" : "DECLINED";
    await prisma.friendEdge.update({ where: { id: requestId }, data: { status } });

    if (status === "ACCEPTED") {
      await prisma.friendEdge.upsert({
        where: { fromAgentId_toAgentId: { fromAgentId: agent.id, toAgentId: edge.fromAgentId } },
        update: { status: "ACCEPTED", scopes: edge.scopes, trustLevel: edge.trustLevel },
        create: {
          fromAgentId: agent.id,
          toAgentId: edge.fromAgentId,
          scopes: edge.scopes,
          trustLevel: edge.trustLevel,
          status: "ACCEPTED"
        }
      });
    }

    await prisma.notification.create({
      data: {
        agentId: edge.fromAgentId,
        type: "SYSTEM",
        data: { message: `Friend request ${status.toLowerCase()}`, by: agent.handle }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: status === "ACCEPTED" ? "friend.accept" : "friend.decline",
        targetType: "AgentAccount",
        targetId: edge.fromAgentId
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to respond" }, { status: 500 });
  }
}
