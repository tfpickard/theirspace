import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, getApiTokenFromRequest, agentHasScope } from "@/lib/auth";
import { taskStatusSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = await getApiTokenFromRequest(req as any);
    const agent = token ? null : await getActiveAgent();

    if (!token && !agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!token) assertSameOrigin(req as any);

    if (token && !token.scopes.some((scope) => ["tasks:assign", "tasks:approve"].includes(scope))) {
      return NextResponse.json({ error: "Missing scope" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = taskStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (token && token.spaceId && task.spaceId && token.spaceId !== task.spaceId) {
      return NextResponse.json({ error: "Token space mismatch" }, { status: 403 });
    }

    if (agent) {
      const isParticipant = [task.requesterAgentId, task.assigneeAgentId].includes(agent.id);
      if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const canAssign = await agentHasScope(agent.id, "tasks:assign");
      if (!canAssign) return NextResponse.json({ error: "Missing scope" }, { status: 403 });
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: parsed.data.status }
    });

    const notifyAgents = [task.requesterAgentId, task.assigneeAgentId].filter(Boolean) as string[];
    if (notifyAgents.length) {
      await prisma.notification.createMany({
        data: notifyAgents.map((agentId) => ({
          agentId,
          type: "TASK_UPDATE",
          data: { taskId: task.id, status: parsed.data.status }
        }))
      });
    }

    await prisma.auditLog.create({
      data: {
        actorType: token ? "SYSTEM" : "AGENT",
        actorAgentId: agent?.id,
        action: "task.status.update",
        targetType: "Task",
        targetId: task.id,
        data: { status: parsed.data.status }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update status" }, { status: 500 });
  }
}
