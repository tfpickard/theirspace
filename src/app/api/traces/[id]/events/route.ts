import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { traceEventSchema } from "@/lib/validation";
import { redactSecrets } from "@/lib/security";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = traceEventSchema.safeParse({ ...body, traceId: params.id });
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const trace = await prisma.trace.findUnique({ where: { id: params.id } });
    if (!trace || trace.agentId !== agent.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const redacted = redactSecrets(parsed.data.payloadJson);

    const event = await prisma.traceEvent.create({
      data: {
        traceId: parsed.data.traceId,
        type: parsed.data.type,
        payloadJson: redacted
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "Unable to append trace" }, { status: 500 });
  }
}
