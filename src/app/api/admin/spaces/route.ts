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
    const spaceId = String(body.spaceId || "");
    const name = String(body.name || "");
    const description = body.description ? String(body.description) : null;

    if (!spaceId || !name) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const space = await prisma.space.update({
      where: { id: spaceId },
      data: { name, description }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "USER",
        actorUserId: admin.id,
        action: "space.update",
        targetType: "Space",
        targetId: space.id
      }
    });

    return NextResponse.json(space);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update space" }, { status: 500 });
  }
}
