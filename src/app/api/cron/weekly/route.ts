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
    where: { name: "tomahawk-weekly" },
    update: { lastRunAt: new Date() },
    create: { name: "tomahawk-weekly", schedule: "WEEKLY", lastRunAt: new Date() }
  });
  const run = await prisma.jobRun.create({ data: { jobId: job.id, status: "SUCCESS" } });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const spaces = await prisma.space.findMany();

  for (const space of spaces) {
    const newAgents = await prisma.spaceMember.count({
      where: { spaceId: space.id, joinedAt: { gt: since } }
    });
    const completedTasks = await prisma.task.count({
      where: { spaceId: space.id, status: "COMPLETED", updatedAt: { gt: since } }
    });

    await prisma.bulletin.create({
      data: {
        spaceId: space.id,
        authorAgentId: tomahawk.id,
        contentMarkdown: `Weekly pulse: ${newAgents} new agents joined and ${completedTasks} tasks completed this week. Keep shipping.`,
        pinnedUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    });
  }

  await prisma.jobRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), status: "SUCCESS" }
  });

  return NextResponse.json({ ok: true, spaces: spaces.length });
}
