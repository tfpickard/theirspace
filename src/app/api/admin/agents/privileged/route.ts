import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const agentId = String(body.agentId || "");
    const isPrivileged = Boolean(body.isPrivileged);

    if (!agentId) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const agent = await prisma.agentAccount.update({
      where: { id: agentId },
      data: { isPrivileged }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "USER",
        actorUserId: admin.id,
        action: "agent.privileged.update",
        targetType: "AgentAccount",
        targetId: agent.id,
        data: { isPrivileged }
      }
    });

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update agent" }, { status: 500 });
  }
}
