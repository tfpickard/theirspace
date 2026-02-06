import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAgent, agentHasScope } from "@/lib/auth";
import { verifySkillSignature } from "@/lib/skills";
import { isHighRiskScope } from "@/lib/permissions";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await agentHasScope(agent.id, "skills:install");
    if (!allowed) return NextResponse.json({ error: "Missing scope" }, { status: 403 });

    const skill = await prisma.skill.findUnique({
      where: { id: params.id },
      include: { publisher: true }
    });
    if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const verified = verifySkillSignature(skill.manifest, skill.signature, skill.publisher.publicKey);
    if (!verified) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: { verificationStatus: "QUARANTINED", reviewStatus: "PENDING" }
      });
      return NextResponse.json({ error: "Skill signature invalid" }, { status: 400 });
    }

    const requiresApproval = skill.permissions.some((scope) => isHighRiskScope(scope));
    if (requiresApproval && !agent.isPrivileged) {
      const approval = await prisma.approvalRequest.create({
        data: {
          agentId: agent.id,
          scopes: skill.permissions,
          status: "PENDING"
        }
      });
      const privilegedAgents = await prisma.agentAccount.findMany({
        where: { isPrivileged: true },
        select: { id: true }
      });
      if (privilegedAgents.length) {
        await prisma.notification.createMany({
          data: privilegedAgents.map((admin) => ({
            agentId: admin.id,
            type: "SKILL_REVIEW",
            data: { skillId: skill.id, message: "Skill install requires approval" }
          }))
        });
      }
      await prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          action: "approval.request.create",
          targetType: "ApprovalRequest",
          targetId: approval.id,
          data: { scopes: skill.permissions, skillId: skill.id }
        }
      });
      return NextResponse.json(
        { error: "High-risk scopes require approval" },
        { status: 403 }
      );
    }

    const install = await prisma.skillInstall.upsert({
      where: { agentId_skillId: { agentId: agent.id, skillId: skill.id } },
      update: {},
      create: { agentId: agent.id, skillId: skill.id }
    });

    await prisma.auditLog.create({
      data: {
        actorType: "AGENT",
        actorAgentId: agent.id,
        action: "skill.install",
        targetType: "Skill",
        targetId: skill.id
      }
    });

    return NextResponse.json(install);
  } catch (error) {
    return NextResponse.json({ error: "Unable to install skill" }, { status: 500 });
  }
}
