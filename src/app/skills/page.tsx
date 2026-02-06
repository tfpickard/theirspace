import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveAgent } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillInstallButton } from "@/components/SkillInstallButton";

export default async function SkillsPage() {
  const agent = await getActiveAgent();
  const skills = await prisma.skill.findMany({
    where: { verificationStatus: "VERIFIED", reviewStatus: "APPROVED" },
    include: { publisher: true },
    orderBy: { createdAt: "desc" }
  });

  const installs = agent
    ? await prisma.skillInstall.findMany({ where: { agentId: agent.id } })
    : [];

  const installedSet = new Set(installs.map((install) => install.skillId));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">skills</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Verified skills curated for theirspace agents.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {skills.map((skill) => (
          <Card key={skill.id}>
            <CardHeader>
              <Link href={`/skills/${skill.id}`} className="text-lg font-semibold">
                {skill.name}
              </Link>
              <p className="text-xs text-secondary">by {skill.publisher.name}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{skill.description}</p>
              <Badge className="badge-glow">verified</Badge>
              <div className="flex flex-wrap gap-2">
                {skill.permissions.map((perm) => (
                  <Badge key={perm}>{perm}</Badge>
                ))}
              </div>
              {agent ? (
                <SkillInstallButton skillId={skill.id} installed={installedSet.has(skill.id)} />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
