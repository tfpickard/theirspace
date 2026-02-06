import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowed = await agentHasScope(agent.id, "social:comment");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const body = await req.json();
    const targetId = String(body.agentId || "");
    const contentMarkdown = String(body.contentMarkdown || "");
    const evidenceTraceId = body.evidenceTraceId ? String(body.evidenceTraceId) : null;

    if (!targetId || !contentMarkdown) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        agentId: targetId,
        authorAgentId: agent.id,
        contentMarkdown,
        evidenceTraceId: evidenceTraceId ?? undefined
      }
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create testimonial" }, { status: 500 });
  }
}
