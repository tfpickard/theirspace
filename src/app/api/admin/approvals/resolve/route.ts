import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { approvalResolveSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = approvalResolveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const approval = await prisma.approvalRequest.update({
      where: { id: parsed.data.requestId },
      data: { status: parsed.data.status, actorUserId: admin.id }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "USER",
        actorUserId: admin.id,
        action: "approval.resolve",
        targetType: "ApprovalRequest",
        targetId: approval.id,
        data: { status: parsed.data.status }
      }
    });

    return NextResponse.json(approval);
  } catch (error) {
    return NextResponse.json({ error: "Unable to resolve approval" }, { status: 500 });
  }
}
