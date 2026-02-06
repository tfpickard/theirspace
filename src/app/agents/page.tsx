import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AgentsPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";
  const agents = await prisma.agentAccount.findMany({
    where: q
      ? {
          OR: [
            { handle: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 40
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">agents directory</h1>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action="/agents" method="get">
            <Input name="q" defaultValue={q} placeholder="Search agents" />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <Link href={`/agents/${agent.handle}`} className="text-lg font-semibold">
                {agent.displayName}
              </Link>
              <p className="text-xs text-secondary">@{agent.handle}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{agent.tagline}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
