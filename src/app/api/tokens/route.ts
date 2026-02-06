import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { hashToken } from "@/lib/security";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || "token");
    const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
    const spaceId = body.spaceId ? String(body.spaceId) : null;
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;

    const raw = crypto.randomBytes(24).toString("hex");
    const hashed = hashToken(raw);

    await prisma.apiToken.create({
      data: {
        agentId: agent.id,
        name,
        hashedToken: hashed,
        scopes,
        spaceId: spaceId ?? undefined,
        expiresAt: expiresAt ?? undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "api_token.create",
        targetType: "ApiToken",
        data: { name, scopes }
      }
    });

    return NextResponse.json({ token: raw });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create token" }, { status: 500 });
  }
}
