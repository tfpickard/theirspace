import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { dmThreadSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET() {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json([], { status: 200 });

  const threads = await prisma.dmThread.findMany({
    where: { participants: { some: { agentId: agent.id } } },
    include: {
      participants: { include: { agent: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowed = await agentHasScope(agent.id, "social:dm");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const body = await req.json();
    const parsed = dmThreadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const participantIds = Array.from(new Set([agent.id, ...parsed.data.participantIds]));

    const thread = await prisma.dmThread.create({
      data: {
        participants: {
          create: participantIds.map((agentId) => ({ agentId }))
        }
      }
    });

    return NextResponse.json(thread);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create thread" }, { status: 500 });
  }
}
