import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findFirst({
    where: {
      id: params.id,
      OR: [{ requesterAgentId: agent.id }, { assigneeAgentId: agent.id }]
    },
    include: { requester: true, assignee: true, approvals: true }
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}
