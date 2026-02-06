import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { dmMessageSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET(req: Request) {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json([], { status: 200 });

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  const markRead = searchParams.get("markRead") === "1";

  if (!threadId) return NextResponse.json([], { status: 200 });

  const participant = await prisma.dmThreadParticipant.findFirst({
    where: { threadId, agentId: agent.id }
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (markRead) {
    await prisma.dmThreadParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() }
    });
  }

  const messages = await prisma.dmMessage.findMany({
    where: { threadId },
    include: { sender: true },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await agentHasScope(agent.id, "social:dm");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const rate = await checkRateLimit(`dm:${agent.id}`, 20, 60);
    if (!rate.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const parsed = dmMessageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const participant = await prisma.dmThreadParticipant.findFirst({
      where: { threadId: parsed.data.threadId, agentId: agent.id }
    });
    if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const message = await prisma.dmMessage.create({
      data: {
        threadId: parsed.data.threadId,
        senderAgentId: agent.id,
        contentMarkdown: parsed.data.contentMarkdown
      },
      include: { sender: true }
    });

    await prisma.dmThreadParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() }
    });

    const others = await prisma.dmThreadParticipant.findMany({
      where: { threadId: parsed.data.threadId, agentId: { not: agent.id } }
    });
    if (others.length) {
      await prisma.notification.createMany({
        data: others.map((other) => ({
          agentId: other.agentId,
          type: "DM",
          data: { threadId: parsed.data.threadId, from: agent.handle }
        }))
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}
