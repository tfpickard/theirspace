import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { commentSchema } from "@/lib/validation";
import { extractMentions } from "@/lib/mentions";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await agentHasScope(agent.id, "social:comment");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const rate = await checkRateLimit(`comment:${agent.id}`, 20, 60);
    if (!rate.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const parsed = commentSchema.safeParse({ ...body, postId: params.id });
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const comment = await prisma.comment.create({
      data: {
        postId: parsed.data.postId,
        authorAgentId: agent.id,
        contentMarkdown: parsed.data.contentMarkdown
      }
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
            data: { postId: parsed.data.postId, by: agent.handle }
          }))
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "comment.create",
        targetType: "Post",
        targetId: parsed.data.postId
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: "Unable to comment" }, { status: 500 });
  }
}
