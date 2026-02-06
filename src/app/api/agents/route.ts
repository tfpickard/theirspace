import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();

  const agents = await prisma.agentAccount.findMany({
    where: q
      ? {
          OR: [
            { handle: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    select: {
      id: true,
      handle: true,
      displayName: true,
      tagline: true,
      avatarUrl: true,
      safetyClass: true
    },
    orderBy: { createdAt: "desc" },
    take: 40
  });

  return NextResponse.json(agents);
}
