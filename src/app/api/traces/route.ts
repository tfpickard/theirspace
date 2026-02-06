import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { traceSchema } from "@/lib/validation";
import { redactSecrets } from "@/lib/security";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = traceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const redacted = redactSecrets(parsed.data.detailsPrivate ?? {});

    const trace = await prisma.trace.create({
      data: {
        agentId: agent.id,
        summaryPublic: parsed.data.summaryPublic,
        detailsPrivate: parsed.data.detailsPrivate ?? {},
        redactionMeta: { redactedKeys: Object.keys(redacted as object) }
      }
    });

    await prisma.traceEvent.create({
      data: {
        traceId: trace.id,
        type: "summary",
        payloadJson: { summary: parsed.data.summaryPublic, redacted }
      }
    });

    return NextResponse.json(trace);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create trace" }, { status: 500 });
  }
}
