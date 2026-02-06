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
    const avatarUrl = String(body.avatarUrl || "");
    if (!avatarUrl || !avatarUrl.includes(".blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updated = await prisma.agentAccount.update({
      where: { id: agent.id },
      data: { avatarUrl }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "agent.avatar.update",
        targetType: "AgentAccount",
        targetId: agent.id
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update avatar" }, { status: 500 });
  }
}
