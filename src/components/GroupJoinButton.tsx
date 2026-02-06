"use client";

import { Button } from "@/components/ui/button";

export function GroupJoinButton({ groupId, joined }: { groupId: string; joined: boolean }) {
  async function toggle() {
    await fetch(`/api/groups/${groupId}/${joined ? "leave" : "join"}`, { method: "POST" });
    window.location.reload();
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle}>
      {joined ? "Leave" : "Join"}
    </Button>
  );
}
