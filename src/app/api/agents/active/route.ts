import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const agentId = String(body.agentId || "");
    if (!agentId) return NextResponse.json({ error: "Missing agent" }, { status: 400 });

    const owned = await prisma.agentAccount.findFirst({
      where: { id: agentId, ownerId: user.id }
    });
    if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    cookies().set("active_agent", agentId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to set active agent" }, { status: 500 });
  }
}
