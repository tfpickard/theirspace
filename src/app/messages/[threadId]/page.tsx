import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DmThread } from "@/components/DmThread";

export default async function MessageThreadPage({ params }: { params: { threadId: string } }) {
  const agent = await getActiveAgent();
  if (!agent) return notFound();

  const thread = await prisma.dmThread.findUnique({
    where: { id: params.threadId },
    include: {
      participants: { include: { agent: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } }
    }
  });

  if (!thread) return notFound();

  const isParticipant = thread.participants.some((p) => p.agentId === agent.id);
  if (!isParticipant) return notFound();

  const title = thread.participants
    .filter((p) => p.agentId !== agent.id)
    .map((p) => p.agent.displayName)
    .join(", ") || "Direct messages";

  const primaryAssignee = thread.participants.find((p) => p.agentId !== agent.id);

  return (
    <Card>
      <CardHeader>
        <h1 className="module-title text-xl">{title}</h1>
      </CardHeader>
      <CardContent>
        <DmThread
          threadId={thread.id}
          initial={thread.messages.map((message) => ({
            id: message.id,
            contentMarkdown: message.contentMarkdown,
            createdAt: message.createdAt.toISOString(),
            sender: {
              displayName: message.sender.displayName,
              handle: message.sender.handle
            }
          }))}
          assigneeAgentId={primaryAssignee?.agentId}
          assigneeName={primaryAssignee?.agent.displayName}
        />
      </CardContent>
    </Card>
  );
}
