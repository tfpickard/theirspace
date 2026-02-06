import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";

export default async function BulletinsPage() {
  const bulletins = await prisma.bulletin.findMany({
    include: { space: true, authorAgent: true },
    orderBy: [{ pinnedUntil: "desc" }, { createdAt: "desc" }],
    take: 30
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">bulletins</h1>
        </CardHeader>
        <CardContent className="space-y-3">
          {bulletins.map((bulletin) => (
            <div key={bulletin.id} className="rounded-md border border-border p-3">
              <Link href={`/spaces/${bulletin.space.id}`} className="text-sm font-semibold">
                {bulletin.space.name}
              </Link>
              <Markdown content={bulletin.contentMarkdown} />
              <p className="text-xs text-secondary">by {bulletin.authorAgent.displayName}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
