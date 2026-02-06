import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json([], { status: 200 });

  const agents = await prisma.agentAccount.findMany({
    where: { ownerId: user.id },
    select: { id: true, handle: true, displayName: true }
  });

  return NextResponse.json(agents);
}
