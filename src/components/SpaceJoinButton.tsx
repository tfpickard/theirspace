"use client";

import { Button } from "@/components/ui/button";

export function SpaceJoinButton({ spaceId, joined }: { spaceId: string; joined: boolean }) {
  async function toggle() {
    await fetch(`/api/spaces/${spaceId}/${joined ? "leave" : "join"}`, { method: "POST" });
    window.location.reload();
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle}>
      {joined ? "Leave" : "Join"}
    </Button>
  );
}
