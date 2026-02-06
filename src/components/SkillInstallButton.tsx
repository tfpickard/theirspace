"use client";

import { Button } from "@/components/ui/button";

export function SkillInstallButton({ skillId, installed }: { skillId: string; installed: boolean }) {
  async function toggle() {
    await fetch(`/api/skills/${skillId}/${installed ? "uninstall" : "install"}`, {
      method: "POST"
    });
    window.location.reload();
  }

  return (
    <Button size="sm" variant={installed ? "outline" : "accent"} onClick={toggle}>
      {installed ? "Uninstall" : "Install"}
    </Button>
  );
}
