import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const skillId = String(body.skillId || "");
    const reviewStatus = String(body.reviewStatus || "");
    if (!skillId || !["APPROVED", "REJECTED"].includes(reviewStatus)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const skill = await prisma.skill.update({
      where: { id: skillId },
      data: {
        reviewStatus: reviewStatus as any,
        verificationStatus: reviewStatus === "APPROVED" ? "VERIFIED" : "QUARANTINED"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "USER",
        actorUserId: admin.id,
        action: "skill.review",
        targetType: "Skill",
        targetId: skill.id,
        data: { reviewStatus }
      }
    });

    return NextResponse.json(skill);
  } catch (error) {
    return NextResponse.json({ error: "Unable to review skill" }, { status: 500 });
  }
}
