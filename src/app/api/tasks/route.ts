import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, getApiTokenFromRequest, agentHasScope } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";
import { scopesRequireApproval } from "@/lib/permissions";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET() {
  const agent = await getActiveAgent();
  if (!agent) return NextResponse.json([], { status: 200 });

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ requesterAgentId: agent.id }, { assigneeAgentId: agent.id }]
    },
    include: { requester: true, assignee: true, approvals: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const token = await getApiTokenFromRequest(req as any);
    if (!token) assertSameOrigin(req as any);

    const agent = token ? null : await getActiveAgent();
    const requesterAgentId = token?.agentId ?? agent?.id;
    if (!requesterAgentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (body.idempotency_key && !body.idempotencyKey) {
      body.idempotencyKey = body.idempotency_key;
    }
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    if (!token) {
      const canCreate = await agentHasScope(requesterAgentId, "tasks:create");
      if (!canCreate) return NextResponse.json({ error: "Missing scope" }, { status: 403 });
      if (parsed.data.assigneeAgentId && parsed.data.assigneeAgentId !== requesterAgentId) {
        const canAssign = await agentHasScope(requesterAgentId, "tasks:assign", parsed.data.assigneeAgentId);
        if (!canAssign) return NextResponse.json({ error: "Missing scope" }, { status: 403 });
      }
    } else {
      if (!token.scopes.includes("tasks:create")) {
        return NextResponse.json({ error: "Missing scope" }, { status: 403 });
      }
      if (token.spaceId && parsed.data.spaceId && token.spaceId !== parsed.data.spaceId) {
        return NextResponse.json({ error: "Token space mismatch" }, { status: 403 });
      }
    }

    if (parsed.data.idempotencyKey) {
      const existing = await prisma.task.findFirst({
        where: { requesterAgentId, idempotencyKey: parsed.data.idempotencyKey }
      });
      if (existing) return NextResponse.json(existing);
    }

    const task = await prisma.task.create({
      data: {
        requesterAgentId,
        assigneeAgentId: parsed.data.assigneeAgentId,
        spaceId: parsed.data.spaceId,
        intent: parsed.data.intent,
        requiredScopes: parsed.data.requiredScopes,
        idempotencyKey: parsed.data.idempotencyKey
      }
    });

    if (parsed.data.assigneeAgentId) {
      await prisma.notification.create({
        data: {
          agentId: parsed.data.assigneeAgentId,
          type: "TASK_UPDATE",
          data: { taskId: task.id, message: "New task assigned" }
        }
      });
    }

    const requester = await prisma.agentAccount.findUnique({ where: { id: requesterAgentId } });
    if (requester && scopesRequireApproval(parsed.data.requiredScopes) && !requester.isPrivileged) {
      const approval = await prisma.approvalRequest.create({
        data: {
          agentId: requesterAgentId,
          taskId: task.id,
          scopes: parsed.data.requiredScopes,
          status: "PENDING"
        }
      });

      const privilegedAgents = await prisma.agentAccount.findMany({
        where: { isPrivileged: true },
        select: { id: true }
      });
      if (privilegedAgents.length) {
        await prisma.notification.createMany({
          data: privilegedAgents.map((admin) => ({
            agentId: admin.id,
            type: "TASK_UPDATE",
            data: { taskId: task.id, message: "Approval required" }
          }))
        });
      }

      await prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          action: "approval.request.create",
          targetType: "ApprovalRequest",
          targetId: approval.id,
          data: { scopes: parsed.data.requiredScopes }
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorType: token ? "SYSTEM" : "AGENT",
        actorAgentId: token ? undefined : requesterAgentId,
        action: "task.create",
        targetType: "Task",
        targetId: task.id
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create task" }, { status: 500 });
  }
}
