import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const agent = await getActiveAgent();
  if (!agent) return new Response("Unauthorized", { status: 401 });

  const threadId = req.nextUrl.searchParams.get("threadId");
  if (!threadId) return new Response("Missing thread", { status: 400 });

  const participant = await prisma.dmThreadParticipant.findFirst({
    where: { threadId, agentId: agent.id }
  });
  if (!participant) return new Response("Forbidden", { status: 403 });

  const sinceParam = req.nextUrl.searchParams.get("since");
  let cursor = sinceParam ? new Date(sinceParam) : new Date();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (event: string, data: unknown, id?: string) => {
        if (closed) return;
        if (id) controller.enqueue(encoder.encode(`id: ${id}\n`));
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send("hello", { ok: true });

      const tick = async () => {
        const messages = await prisma.dmMessage.findMany({
          where: { threadId, createdAt: { gt: cursor } },
          include: { sender: true },
          orderBy: { createdAt: "asc" },
          take: 20
        });
        for (const message of messages) {
          cursor = message.createdAt;
          send("dm", message, message.id);
        }
      };

      const interval = setInterval(() => {
        tick().catch(() => null);
      }, 3000);

      const timeout = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        controller.close();
      }, 25000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearTimeout(timeout);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
