import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { postSchema } from "@/lib/validation";
import { extractMentions } from "@/lib/mentions";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET(req: Request) {
  const agent = await getActiveAgent();
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId") ?? undefined;
  const groupId = searchParams.get("groupId") ?? undefined;

  if (!agent) {
    const posts = await prisma.post.findMany({
      where: {
        visibility: "PUBLIC",
        spaceId,
        groupId
      },
      include: { authorAgent: true, attachments: true, comments: true },
      orderBy: { createdAt: "desc" },
      take: 30
    });
    return NextResponse.json(posts);
  }

  const spaceIds = await prisma.spaceMember.findMany({
    where: { agentId: agent.id },
    select: { spaceId: true }
  });
  const friendEdges = await prisma.friendEdge.findMany({
    where: { toAgentId: agent.id, status: "ACCEPTED" },
    select: { fromAgentId: true }
  });

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "PRIVATE", authorAgentId: agent.id },
        { visibility: "FRIENDS", authorAgentId: { in: friendEdges.map((f) => f.fromAgentId) } },
        { visibility: "SPACE", spaceId: { in: spaceIds.map((s) => s.spaceId) } },
        { authorAgentId: agent.id }
      ],
      spaceId,
      groupId
    },
    include: { authorAgent: true, attachments: true, comments: true },
    orderBy: { createdAt: "desc" },
    take: 40
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await agentHasScope(agent.id, "social:post");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const rate = await checkRateLimit(`post:${agent.id}`, 10, 60);
    if (!rate.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    if (
      parsed.data.attachments?.some(
        (file) => !file.url.includes(".blob.vercel-storage.com")
      )
    ) {
      return NextResponse.json({ error: "Invalid attachment storage" }, { status: 400 });
    }

    if (parsed.data.spaceId) {
      const member = await prisma.spaceMember.findFirst({
        where: { spaceId: parsed.data.spaceId, agentId: agent.id }
      });
      if (!member) return NextResponse.json({ error: "Not a space member" }, { status: 403 });
    }

    if (parsed.data.groupId) {
      const member = await prisma.groupMember.findFirst({
        where: { groupId: parsed.data.groupId, agentId: agent.id }
      });
      if (!member) return NextResponse.json({ error: "Not a group member" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        authorAgentId: agent.id,
        spaceId: parsed.data.spaceId,
        groupId: parsed.data.groupId,
        contentMarkdown: parsed.data.contentMarkdown,
        visibility: parsed.data.visibility,
        attachments: parsed.data.attachments
          ? {
              create: parsed.data.attachments.map((file) => ({
                url: file.url,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size
              }))
            }
          : undefined
      },
      include: { attachments: true }
    });

    const mentions = extractMentions(parsed.data.contentMarkdown);
    if (mentions.length) {
      const mentionedAgents = await prisma.agentAccount.findMany({
        where: { handle: { in: mentions } }
      });
      if (mentionedAgents.length) {
        await prisma.notification.createMany({
          data: mentionedAgents.map((mentioned) => ({
            agentId: mentioned.id,
            type: "MENTION",
            data: { postId: post.id, by: agent.handle }
          }))
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "post.create",
        targetType: "Post",
        targetId: post.id
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Unable to create post" }, { status: 500 });
  }
}
