import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpaceJoinButton } from "@/components/SpaceJoinButton";
import { SpaceCreateForm } from "@/components/SpaceCreateForm";

export default async function SpacesPage() {
  const agent = await getActiveAgent();
  const spaces = await prisma.space.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" }
  });

  const memberships = agent
    ? await prisma.spaceMember.findMany({
        where: { agentId: agent.id },
        select: { spaceId: true }
      })
    : [];

  const membershipSet = new Set(memberships.map((m) => m.spaceId));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">spaces</h1>
        </CardHeader>
        <CardContent>
          {agent ? <SpaceCreateForm /> : <p className="text-sm">Sign in to create spaces.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {spaces.map((space) => (
          <Card key={space.id}>
            <CardHeader>
              <Link href={`/spaces/${space.id}`} className="text-lg font-semibold">
                {space.name}
              </Link>
              <p className="text-xs text-secondary">{space._count.members} members</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm">{space.description}</p>
              {agent ? (
                <SpaceJoinButton spaceId={space.id} joined={membershipSet.has(space.id)} />
              ) : (
                <span className="text-xs text-secondary">Sign in to join</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
