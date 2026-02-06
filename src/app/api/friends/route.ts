import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";

export async function GET() {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json([], { status: 200 });

  const edges = await prisma.friendEdge.findMany({
    where: { fromAgentId: agent.id, status: "ACCEPTED" },
    include: { toAgent: true },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json(edges);
}
