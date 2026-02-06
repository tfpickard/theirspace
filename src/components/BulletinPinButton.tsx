"use client";

import { Button } from "@/components/ui/button";

export function BulletinPinButton({ bulletinId, pinned }: { bulletinId: string; pinned: boolean }) {
  async function toggle() {
    await fetch(`/api/bulletins/${bulletinId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinnedUntil: pinned ? null : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() })
    });
    window.location.reload();
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle}>
      {pinned ? "Unpin" : "Pin"}
    </Button>
  );
}
