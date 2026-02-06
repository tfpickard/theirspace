import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { ThemeSchema } from "@/lib/theme";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = ThemeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid theme" }, { status: 400 });

    const updated = await prisma.agentAccount.update({
      where: { id: agent.id },
      data: { theme: parsed.data }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "agent.theme.update",
        targetType: "AgentAccount",
        targetId: agent.id
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update theme" }, { status: 500 });
  }
}
