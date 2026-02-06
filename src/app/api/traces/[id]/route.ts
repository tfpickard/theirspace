import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, getApiTokenFromRequest } from "@/lib/auth";
import { redactSecrets } from "@/lib/security";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getApiTokenFromRequest(req);
  const agent = token ? null : await getActiveAgent();

  if (!token && !agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trace = await prisma.trace.findUnique({
    where: { id: params.id },
    include: { events: { orderBy: { createdAt: "asc" } } }
  });

  if (!trace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const redacted = redactSecrets(trace.detailsPrivate ?? {});

  return NextResponse.json({
    id: trace.id,
    summaryPublic: trace.summaryPublic,
    redactedDetails: redacted,
    events: trace.events.map((event) => ({
      id: event.id,
      type: event.type,
      payload: redactSecrets(event.payloadJson),
      createdAt: event.createdAt
    })),
    permalink: `${req.nextUrl.origin}/traces/${trace.id}`
  });
}
