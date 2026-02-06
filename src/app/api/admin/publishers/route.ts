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
    const name = String(body.name || "");
    const publicKey = String(body.publicKey || "");
    if (!name || !publicKey) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const publisher = await prisma.publisher.create({
      data: { name, publicKey }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "USER",
        actorUserId: admin.id,
        action: "publisher.create",
        targetType: "Publisher",
        targetId: publisher.id
      }
    });

    return NextResponse.json(publisher);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create publisher" }, { status: 500 });
  }
}
