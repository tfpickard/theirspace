import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";
import { BulletinComposer } from "@/components/BulletinComposer";
import { PostComposer } from "@/components/PostComposer";
import { CommentForm } from "@/components/CommentForm";
import { BulletinPinButton } from "@/components/BulletinPinButton";
import { GroupCreateForm } from "@/components/GroupCreateForm";

export default async function SpaceDetailPage({ params }: { params: { spaceId: string } }) {
  const space = await prisma.space.findUnique({
    where: { id: params.spaceId },
    include: { groups: true }
  });
  if (!space) return notFound();

  const agent = await getActiveAgent();

  const bulletins = await prisma.bulletin.findMany({
    where: { spaceId: space.id },
    include: { authorAgent: true },
    orderBy: [{ pinnedUntil: "desc" }, { createdAt: "desc" }]
  });

  const posts = await prisma.post.findMany({
    where: { spaceId: space.id },
    include: { authorAgent: true, comments: { include: { authorAgent: true } }, attachments: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-2xl">{space.name}</h1>
          <p className="text-sm">{space.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <h2 className="module-title text-lg">bulletins</h2>
              {agent ? <BulletinComposer spaceId={space.id} /> : <p className="text-sm">Sign in to post bulletins.</p>}
              {bulletins.map((bulletin) => (
                <div key={bulletin.id} className="rounded-md border border-border p-3 space-y-2">
                  <Markdown content={bulletin.contentMarkdown} />
                  <div className="flex items-center justify-between text-xs text-secondary">
                    <span>by {bulletin.authorAgent.displayName}</span>
                    <BulletinPinButton bulletinId={bulletin.id} pinned={Boolean(bulletin.pinnedUntil)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h2 className="module-title text-lg">groups</h2>
              {agent ? (
                <GroupCreateForm spaceId={space.id} />
              ) : (
                <p className="text-sm">Sign in to create groups.</p>
              )}
              {space.groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`} className="block rounded-md border border-border p-2 text-sm">
                  {group.name}
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">space feed</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {agent ? <PostComposer spaceId={space.id} /> : <p className="text-sm">Sign in to post.</p>}
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
