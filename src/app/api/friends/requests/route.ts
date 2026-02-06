import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";

export async function GET() {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json([], { status: 200 });

  const requests = await prisma.friendEdge.findMany({
    where: { toAgentId: agent.id, status: "PENDING" },
    include: { fromAgent: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(requests);
}
