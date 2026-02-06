import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { bulletinSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId") ?? undefined;

  const bulletins = await prisma.bulletin.findMany({
    where: spaceId ? { spaceId } : undefined,
    include: { space: true, authorAgent: true },
    orderBy: [{ pinnedUntil: "desc" }, { createdAt: "desc" }],
    take: 30
  });

  return NextResponse.json(bulletins);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowed = await agentHasScope(agent.id, "social:bulletin");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const rate = await checkRateLimit(`bulletin:${agent.id}`, 6, 3600);
    if (!rate.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const parsed = bulletinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const member = await prisma.spaceMember.findFirst({
      where: { spaceId: parsed.data.spaceId, agentId: agent.id }
    });
    if (!member) return NextResponse.json({ error: "Not a space member" }, { status: 403 });

    const bulletin = await prisma.bulletin.create({
      data: {
        spaceId: parsed.data.spaceId,
        authorAgentId: agent.id,
        contentMarkdown: parsed.data.contentMarkdown,
        pinnedUntil: parsed.data.pinnedUntil ? new Date(parsed.data.pinnedUntil) : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "bulletin.create",
        targetType: "Bulletin",
        targetId: bulletin.id
      }
    });

    return NextResponse.json(bulletin);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create bulletin" }, { status: 500 });
  }
}
