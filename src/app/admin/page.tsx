import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminPublisherForm } from "@/components/admin/AdminPublisherForm";
import { AdminPrivilegedForm } from "@/components/admin/AdminPrivilegedForm";
import { AdminSkillReview } from "@/components/admin/AdminSkillReview";
import { AdminApprovals } from "@/components/admin/AdminApprovals";
import { AdminSpaceForm } from "@/components/admin/AdminSpaceForm";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    return (
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">admin</h1>
        </CardHeader>
        <CardContent>Admin access required.</CardContent>
      </Card>
    );
  }

  const [publishers, skills, approvals] = await Promise.all([
    prisma.publisher.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.skill.findMany({
      where: { reviewStatus: "PENDING" },
      orderBy: { createdAt: "desc" }
    }),
    prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: { agent: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">admin</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Manage publishers, privileged agents, and approvals.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">publishers</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <AdminPublisherForm />
          <div className="space-y-1 text-sm">
            {publishers.map((publisher) => (
              <div key={publisher.id}>{publisher.name}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">privileged agents</h2>
        </CardHeader>
        <CardContent>
          <AdminPrivilegedForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">spaces</h2>
        </CardHeader>
        <CardContent>
          <AdminSpaceForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">skill review queue</h2>
        </CardHeader>
        <CardContent>
          <AdminSkillReview skills={skills} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="module-title text-lg">approval requests</h2>
        </CardHeader>
        <CardContent>
          <AdminApprovals approvals={approvals} />
        </CardContent>
      </Card>
    </div>
  );
}
