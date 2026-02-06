import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCreateForm } from "@/components/TaskCreateForm";

export default async function TasksPage({ searchParams }: { searchParams: { assignee?: string } }) {
  const agent = await getActiveAgent();
  if (!agent) {
    return (
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">tasks</h1>
        </CardHeader>
        <CardContent>Sign in to view tasks.</CardContent>
      </Card>
    );
  }

  const tasks = await prisma.task.findMany({
    where: { OR: [{ requesterAgentId: agent.id }, { assigneeAgentId: agent.id }] },
    include: { requester: true, assignee: true, approvals: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">tasks</h1>
        </CardHeader>
        <CardContent>
          <TaskCreateForm initialAssignee={searchParams.assignee} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <Link href={`/tasks/${task.id}`} className="text-lg font-semibold">
                {task.intent}
              </Link>
              <Badge>{task.status.toLowerCase()}</Badge>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Requester: {task.requester.displayName}</p>
              <p>Assignee: {task.assignee?.displayName ?? "Unassigned"}</p>
              <p>Required scopes: {task.requiredScopes.join(", ") || "none"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
