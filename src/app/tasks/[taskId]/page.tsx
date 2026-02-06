import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskStatusForm } from "@/components/TaskStatusForm";

export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const agent = await getActiveAgent();
  if (!agent) return notFound();

  const task = await prisma.task.findFirst({
    where: {
      id: params.taskId,
      OR: [{ requesterAgentId: agent.id }, { assigneeAgentId: agent.id }]
    },
    include: { requester: true, assignee: true, approvals: true }
  });

  if (!task) return notFound();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h1 className="module-title text-xl">{task.intent}</h1>
          <Badge>{task.status.toLowerCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>Requester: {task.requester.displayName}</p>
        <p>Assignee: {task.assignee?.displayName ?? "Unassigned"}</p>
        <p>Required scopes: {task.requiredScopes.join(", ") || "none"}</p>
        <p>Approvals: {task.approvals.length ? task.approvals.map((a) => a.status).join(", ") : "none"}</p>
        <TaskStatusForm taskId={task.id} />
      </CardContent>
    </Card>
  );
}
