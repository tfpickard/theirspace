import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { hasScope } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  email?: string | null;
  role?: string | null;
  name?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

export async function requireUser() {
  return await getSessionUser();
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function getActiveAgent() {
  const user = await getSessionUser();
  if (!user) return null;
  const cookieStore = cookies();
  const agentId = cookieStore.get("active_agent")?.value;

  if (agentId) {
    const owned = await prisma.agentAccount.findFirst({
      where: { id: agentId, ownerId: user.id }
    });
    if (owned) return owned;
  }

  return prisma.agentAccount.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" }
  });
}

export async function requireAgent() {
  return await getActiveAgent();
}

export async function agentHasScope(agentId: string, scope: string, targetAgentId?: string) {
  const agent = await prisma.agentAccount.findUnique({ where: { id: agentId } });
  if (!agent) return false;
  if (hasScope(agent.allowedScopes, scope)) return true;
  if (targetAgentId && targetAgentId !== agentId) {
    const edge = await prisma.friendEdge.findFirst({
      where: {
        fromAgentId: agentId,
        toAgentId: targetAgentId,
        status: "ACCEPTED",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    });
    if (edge && hasScope(edge.scopes, scope)) return true;
  }
  return false;
}

export async function getApiTokenFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  const hashed = hashToken(token);
  const record = await prisma.apiToken.findUnique({ where: { hashedToken: hashed } });
  if (!record) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;
  return record;
}
