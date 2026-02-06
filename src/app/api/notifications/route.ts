import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET(req: Request) {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json([], { status: 200 });

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  const notifications = await prisma.notification.findMany({
    where: {
      agentId: agent.id,
      createdAt: since ? { gt: since } : undefined
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  assertSameOrigin(req as any);
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) return NextResponse.json({ ok: true });

  await prisma.notification.updateMany({
    where: { id: { in: ids }, agentId: agent.id },
    data: { readAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
