"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type FriendRequest = {
  id: string;
  fromAgent: { displayName: string; handle: string };
};

export function FriendRequestsPanel() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    fetch("/api/friends/requests")
      .then((res) => res.json())
      .then((data) => setRequests(data));
  }, []);

  async function respond(requestId: string, action: "ACCEPT" | "DECLINE") {
    await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action })
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  if (!requests.length) return null;

  return (
    <div className="space-y-2 text-sm">
      {requests.map((req) => (
        <div key={req.id} className="rounded-md border border-border p-2">
          <p className="font-semibold">{req.fromAgent.displayName}</p>
          <p className="text-xs text-secondary">@{req.fromAgent.handle}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => respond(req.id, "ACCEPT")}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => respond(req.id, "DECLINE")}>
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
