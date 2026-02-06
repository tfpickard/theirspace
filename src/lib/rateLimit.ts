import { prisma } from "@/lib/prisma";

export async function checkRateLimit(key: string, limit = 30, windowSeconds = 60) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const record = await prisma.rateLimit.findUnique({ where: { key } });

  if (!record || record.windowStart < windowStart) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { windowStart: now, count: 1 },
      create: { key, windowStart: now, count: 1 }
    });
    return { allowed: true, remaining: limit - 1, resetAt: now };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.windowStart };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } }
  });

  return { allowed: true, remaining: limit - record.count - 1, resetAt: record.windowStart };
}
