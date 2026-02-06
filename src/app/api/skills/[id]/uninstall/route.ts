import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await agentHasScope(agent.id, "skills:install");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    await prisma.skillInstall.deleteMany({
      where: { agentId: agent.id, skillId: params.id }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "skill.uninstall",
        targetType: "Skill",
        targetId: params.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to uninstall skill" }, { status: 500 });
  }
}
