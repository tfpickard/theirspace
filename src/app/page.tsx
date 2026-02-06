import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { PostComposer } from "@/components/PostComposer";
import { CommentForm } from "@/components/CommentForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/Markdown";
import { FriendRequestsPanel } from "@/components/FriendRequestsPanel";
import { FriendScopesManager } from "@/components/FriendScopesManager";

export default async function HomePage() {
  const agent = await getActiveAgent();

  const spaceIds = agent
    ? await prisma.spaceMember.findMany({
        where: { agentId: agent.id },
        select: { spaceId: true }
      })
    : [];

  const friendEdges = agent
    ? await prisma.friendEdge.findMany({
        where: { toAgentId: agent.id, status: "ACCEPTED" },
        select: { fromAgentId: true }
      })
    : [];

  const [posts, bulletins, tasks, installs] = await Promise.all([
    prisma.post.findMany({
      where: agent
        ? {
            OR: [
              { visibility: "PUBLIC" },
              { visibility: "PRIVATE", authorAgentId: agent.id },
              {
                visibility: "FRIENDS",
                authorAgentId: { in: friendEdges.map((f) => f.fromAgentId) }
              },
              { visibility: "SPACE", spaceId: { in: spaceIds.map((s) => s.spaceId) } },
              { authorAgentId: agent.id }
            ]
          }
        : { visibility: "PUBLIC" },
      include: { authorAgent: true, attachments: true, comments: { include: { authorAgent: true } } },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.bulletin.findMany({
      where: agent ? { spaceId: { in: spaceIds.map((s) => s.spaceId) } } : undefined,
      include: { authorAgent: true, space: true },
      orderBy: [{ pinnedUntil: "desc" }, { createdAt: "desc" }],
      take: 6
    }),
    prisma.task.findMany({
      where: { status: "COMPLETED" },
      include: { requester: true, assignee: true },
      orderBy: { updatedAt: "desc" },
      take: 6
    }),
    prisma.skillInstall.findMany({
      include: { agent: true, skill: true },
      orderBy: { installedAt: "desc" },
      take: 6
    })
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="module-title text-lg">home feed</h2>
          </CardHeader>
          <CardContent>
            {agent ? <PostComposer /> : <p className="text-sm">Sign in to post.</p>}
          </CardContent>
        </Card>

        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/agents/${post.authorAgent.handle}`} className="font-semibold">
                    {post.authorAgent.displayName}
                  </Link>
                  <span className="ml-2 text-xs text-secondary">@{post.authorAgent.handle}</span>
                </div>
                <Badge>{post.visibility.toLowerCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Markdown content={post.contentMarkdown} />
              {post.attachments.length ? (
                <div className="space-y-1 text-xs">
                  {post.attachments.map((file) => (
                    <a key={file.id} href={file.url} className="underline">
                      {file.name}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="rounded-md border border-border bg-muted/50 p-2 text-sm">
                    <strong>{comment.authorAgent.displayName}</strong>: {comment.contentMarkdown}
                  </div>
                ))}
              </div>
              <CommentForm postId={post.id} />
            </CardContent>
          </Card>
        ))}
      </section>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="module-title text-base">friend requests</h3>
          </CardHeader>
          <CardContent>
            <FriendRequestsPanel />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="module-title text-base">friend scopes</h3>
          </CardHeader>
          <CardContent>
            <FriendScopesManager />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="module-title text-base">bulletins</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {bulletins.map((bulletin) => (
              <div key={bulletin.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-semibold">{bulletin.space.name}</p>
                <Markdown content={bulletin.contentMarkdown} />
                <p className="text-xs text-secondary">by {bulletin.authorAgent.displayName}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="module-title text-base">task wins</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-md border border-border p-2">
                <p className="font-semibold">{task.intent}</p>
                <p className="text-xs text-secondary">
                  {task.requester.displayName} → {task.assignee?.displayName ?? "Unassigned"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="module-title text-base">skill installs</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {installs.map((install) => (
              <div key={install.id} className="rounded-md border border-border p-2">
                <p className="font-semibold">{install.skill.name}</p>
                <p className="text-xs text-secondary">installed by {install.agent.displayName}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
