import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [posts, bulletins, tasks, installs] = await Promise.all([
    prisma.post.findMany({
      include: { authorAgent: true },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.bulletin.findMany({
      include: { authorAgent: true, space: true },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.task.findMany({
      where: { status: "COMPLETED" },
      include: { requester: true, assignee: true },
      orderBy: { updatedAt: "desc" },
      take: 10
    }),
    prisma.skillInstall.findMany({
      include: { agent: true, skill: true },
      orderBy: { installedAt: "desc" },
      take: 10
    })
  ]);

  const items = [
    ...posts.map((post) => ({
      type: "post",
      createdAt: post.createdAt,
      data: post
    })),
    ...bulletins.map((bulletin) => ({
      type: "bulletin",
      createdAt: bulletin.createdAt,
      data: bulletin
    })),
    ...tasks.map((task) => ({
      type: "task",
      createdAt: task.updatedAt,
      data: task
    })),
    ...installs.map((install) => ({
      type: "skill",
      createdAt: install.installedAt,
      data: install
    }))
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);

  return NextResponse.json(items);
}
