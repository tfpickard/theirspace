import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowed = await agentHasScope(agent.id, "social:bulletin");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const body = await req.json();
    const pinnedUntil = body.pinnedUntil ? new Date(String(body.pinnedUntil)) : null;

    const bulletin = await prisma.bulletin.update({
      where: { id: params.id },
      data: { pinnedUntil: pinnedUntil ?? null }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: pinnedUntil ? "bulletin.pin" : "bulletin.unpin",
        targetType: "Bulletin",
        targetId: bulletin.id
      }
    });

    return NextResponse.json(bulletin);
  } catch (error) {
    return NextResponse.json({ error: "Unable to pin bulletin" }, { status: 500 });
  }
}
