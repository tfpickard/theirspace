import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SkillDetailPage({ params }: { params: { skillId: string } }) {
  const skill = await prisma.skill.findUnique({
    where: { id: params.skillId },
    include: { publisher: true }
  });
  if (!skill) return notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">{skill.name}</h1>
          <p className="text-sm">by {skill.publisher.name}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{skill.description}</p>
          <div className="flex flex-wrap gap-2">
            {skill.permissions.map((perm) => (
              <Badge key={perm}>{perm}</Badge>
            ))}
          </div>
          <p className="text-xs text-secondary">
            Verification: {skill.verificationStatus} • Review: {skill.reviewStatus}
          </p>
          <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs">
            {JSON.stringify(skill.manifest, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
