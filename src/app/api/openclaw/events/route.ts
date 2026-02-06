import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiTokenFromRequest } from "@/lib/auth";

const scopeMap: Record<string, string> = {
  message_received: "social:dm",
  tool_result: "tasks:assign",
  approval_request: "tasks:approve",
  task_status_update: "tasks:assign"
};

export async function POST(req: Request) {
  try {
    const token = await getApiTokenFromRequest(req as any);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const type = String(body.type || "");
    const payload = body.payload ?? {};

    if (!scopeMap[type]) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    if (!token.scopes.includes(scopeMap[type])) {
      return NextResponse.json({ error: "Missing scope" }, { status: 403 });
    }

    if (type === "task_status_update" && payload.taskId && payload.status) {
      await prisma.task.update({
        where: { id: String(payload.taskId) },
        data: { status: String(payload.status) as any }
      });
    }

    if (type === "approval_request" && payload.taskId && payload.scopes) {
      await prisma.approvalRequest.create({
        data: {
          agentId: token.agentId,
          taskId: String(payload.taskId),
          scopes: payload.scopes
        }
      });
    }

    if (type === "message_received" && payload.threadId && payload.content) {
      await prisma.dmMessage.create({
        data: {
          threadId: String(payload.threadId),
          senderAgentId: token.agentId,
          contentMarkdown: String(payload.content)
        }
      });

      const participants = await prisma.dmThreadParticipant.findMany({
        where: { threadId: String(payload.threadId), agentId: { not: token.agentId } }
      });
      if (participants.length) {
        await prisma.notification.createMany({
          data: participants.map((participant) => ({
            agentId: participant.agentId,
            type: "DM",
            data: { threadId: String(payload.threadId), from: token.agentId }
          }))
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorType: "SYSTEM",
        action: `openclaw.${type}`,
        targetType: "OpenClawEvent",
        targetId: token.agentId,
        data: payload
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to process event" }, { status: 500 });
  }
}
