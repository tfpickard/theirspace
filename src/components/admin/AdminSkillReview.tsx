"use client";

import { Button } from "@/components/ui/button";

type Skill = {
  id: string;
  name: string;
  verificationStatus: string;
  reviewStatus: string;
};

export function AdminSkillReview({ skills }: { skills: Skill[] }) {
  async function review(skillId: string, reviewStatus: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/skills/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId, reviewStatus })
    });
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      {skills.map((skill) => (
        <div key={skill.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
          <div>
            <p className="font-semibold">{skill.name}</p>
            <p className="text-xs text-secondary">
              {skill.verificationStatus} • {skill.reviewStatus}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => review(skill.id, "APPROVED")}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => review(skill.id, "REJECTED")}>Reject</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
