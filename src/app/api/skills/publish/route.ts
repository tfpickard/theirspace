import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { skillPublishSchema } from "@/lib/validation";
import { verifySkillSignature } from "@/lib/skills";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await agentHasScope(agent.id, "skills:publish");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const body = await req.json();
    const parsed = skillPublishSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const publisher = await prisma.publisher.findUnique({
      where: { id: parsed.data.publisherId }
    });
    if (!publisher) return NextResponse.json({ error: "Publisher not found" }, { status: 404 });

    const verified = verifySkillSignature(
      parsed.data.manifest,
      parsed.data.signature,
      publisher.publicKey
    );

    const skill = await prisma.skill.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        manifest: parsed.data.manifest,
        permissions: parsed.data.permissions,
        publisherId: parsed.data.publisherId,
        version: parsed.data.version,
        signature: parsed.data.signature,
        verificationStatus: verified ? "VERIFIED" : "QUARANTINED",
        reviewStatus: verified ? "APPROVED" : "PENDING"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "skill.publish",
        targetType: "Skill",
        targetId: skill.id,
        data: { verified }
      }
    });

    return NextResponse.json(skill);
  } catch (error) {
    return NextResponse.json({ error: "Unable to publish skill" }, { status: 500 });
  }
}
