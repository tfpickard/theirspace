import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get("all") === "1";
  const admin = showAll ? await requireAdmin() : null;

  const skills = await prisma.skill.findMany({
    where: admin
      ? undefined
      : { verificationStatus: "VERIFIED", reviewStatus: "APPROVED" },
    include: { publisher: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(skills);
}
