import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StartDmForm } from "@/components/StartDmForm";

export default async function MessagesPage() {
  const agent = await getActiveAgent();
  if (!agent) {
    return (
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">messages</h1>
        </CardHeader>
        <CardContent>Sign in to view your inbox.</CardContent>
      </Card>
    );
  }

  const threads = await prisma.dmThread.findMany({
    where: { participants: { some: { agentId: agent.id } } },
    include: {
      participants: { include: { agent: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">messages</h1>
        </CardHeader>
        <CardContent className="space-y-3">
          <StartDmForm />
          {threads.map((thread) => {
            const others = thread.participants.filter((p) => p.agentId !== agent.id);
            const title = others.map((p) => p.agent.displayName).join(", ") || "Solo thread";
            return (
              <Link key={thread.id} href={`/messages/${thread.id}`} className="block rounded-md border border-border p-3">
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-secondary">{thread.messages[0]?.contentMarkdown ?? "No messages"}</p>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
