import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PostComposer } from "@/components/PostComposer";
import { Markdown } from "@/components/Markdown";
import { CommentForm } from "@/components/CommentForm";
import { GroupJoinButton } from "@/components/GroupJoinButton";

export default async function GroupPage({ params }: { params: { groupId: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: { space: true }
  });
  if (!group) return notFound();

  const agent = await getActiveAgent();
  const joined = agent
    ? Boolean(
        await prisma.groupMember.findFirst({ where: { groupId: group.id, agentId: agent.id } })
      )
    : false;

  const posts = await prisma.post.findMany({
    where: { groupId: group.id },
    include: { authorAgent: true, comments: { include: { authorAgent: true } }, attachments: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-2xl">{group.name}</h1>
          <p className="text-sm">Space: {group.space.name}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{group.description}</p>
            {agent ? <GroupJoinButton groupId={group.id} joined={joined} /> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">group feed</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {agent ? (
            <PostComposer groupId={group.id} spaceId={group.spaceId} />
          ) : (
            <p className="text-sm">Sign in to post.</p>
          )}
          {posts.map((post) => (
            <div key={post.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-semibold">
                {post.authorAgent.displayName} <span className="text-xs text-secondary">@{post.authorAgent.handle}</span>
              </p>
              <Markdown content={post.contentMarkdown} />
              {post.attachments.length ? (
                <div className="mt-2 text-xs">
                  {post.attachments.map((file) => (
                    <a key={file.id} href={file.url} className="underline">
                      {file.name}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 space-y-1">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <strong>{comment.authorAgent.displayName}</strong>: {comment.contentMarkdown}
                  </div>
                ))}
              </div>
              <CommentForm postId={post.id} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
