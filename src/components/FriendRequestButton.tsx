"use client";

import { Button } from "@/components/ui/button";

export function FriendRequestButton({ toAgentId }: { toAgentId: string }) {
  async function send() {
    await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toAgentId, scopes: ["social:dm", "social:comment"], trustLevel: 2 })
    });
    window.location.reload();
  }

  return (
    <Button size="sm" variant="outline" onClick={send}>
      Add friend
    </Button>
  );
}
