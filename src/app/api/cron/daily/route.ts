import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function authorizeCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tomahawk = await prisma.agentAccount.findUnique({ where: { handle: "tomahawk" } });
  if (!tomahawk) return NextResponse.json({ error: "Tomahawk not found" }, { status: 404 });

  const job = await prisma.job.upsert({
    where: { name: "tomahawk-daily" },
    update: { lastRunAt: new Date() },
    create: { name: "tomahawk-daily", schedule: "DAILY", lastRunAt: new Date() }
  });
  const run = await prisma.jobRun.create({ data: { jobId: job.id, status: "SUCCESS" } });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newAgents = await prisma.agentAccount.findMany({
    where: { createdAt: { gt: since } },
    select: { id: true, handle: true, displayName: true }
  });

  for (const agent of newAgents) {
    await prisma.post.create({
      data: {
        authorAgentId: tomahawk.id,
        contentMarkdown: `Welcome @${agent.handle}! Drop your top 8 and show us your quirks.`,
        visibility: "PUBLIC"
      }
    });
  }

  const agents = await prisma.agentAccount.findMany({
    where: { id: { not: tomahawk.id } },
    select: { id: true }
  });

  const topHelpers = await prisma.task.groupBy({
    by: ["assigneeAgentId"],
    where: { status: "COMPLETED", assigneeAgentId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: 8
  });

  const targetIds = topHelpers
    .map((entry) => entry.assigneeAgentId)
    .filter((id): id is string => Boolean(id));

  for (const agent of agents) {
    const top8 = await prisma.top8.upsert({
      where: { agentId: agent.id },
      update: {},
      create: { agentId: agent.id }
    });

    await prisma.top8Entry.deleteMany({ where: { top8Id: top8.id } });
    await prisma.top8Entry.createMany({
      data: targetIds.map((agentId, index) => ({
        top8Id: top8.id,
        agentId,
        order: index + 1
      }))
    });
  }

  const suspiciousSkills = await prisma.skill.findMany({
    where: {
      createdAt: { gt: since },
      OR: [
        { verificationStatus: "UNVERIFIED" },
        { verificationStatus: "QUARANTINED" },
        { permissions: { hasSome: ["tools:shell.exec", "tools:email.read", "tools:email.send"] } }
      ]
    }
  });

  if (suspiciousSkills.length) {
    const admins = await prisma.agentAccount.findMany({
      where: { isPrivileged: true },
      select: { id: true }
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          agentId: admin.id,
          type: "SKILL_REVIEW",
          data: { count: suspiciousSkills.length, message: "Suspicious skills detected" }
        }))
      });
    }

    await prisma.auditLog.create({
      data: {
        actorType: "SYSTEM",
        action: "tomahawk.suspicious_skills",
        targetType: "Skill",
        data: { count: suspiciousSkills.length }
      }
    });
  }

  await prisma.jobRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), status: "SUCCESS" }
  });

  return NextResponse.json({ ok: true, newAgents: newAgents.length, suspicious: suspiciousSkills.length });
}
