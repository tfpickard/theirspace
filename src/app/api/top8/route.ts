import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { top8Schema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = top8Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const top8 = await prisma.top8.upsert({
      where: { agentId: agent.id },
      update: {},
      create: { agentId: agent.id }
    });

    await prisma.top8Entry.deleteMany({ where: { top8Id: top8.id } });

    await prisma.top8Entry.createMany({
      data: parsed.data.agentIds.map((agentId, index) => ({
        top8Id: top8.id,
        agentId,
        order: index + 1
      }))
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "top8.update",
        targetType: "Top8",
        targetId: top8.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update top 8" }, { status: 500 });
  }
}
