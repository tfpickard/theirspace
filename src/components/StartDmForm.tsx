"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StartDmForm() {
  const [participantId, setParticipantId] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!participantId) return;
    setLoading(true);
    const res = await fetch("/api/dm/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantIds: [participantId] })
    });
    const data = await res.json();
    setLoading(false);
    if (data.id) {
      window.location.href = `/messages/${data.id}`;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={participantId}
        onChange={(e) => setParticipantId(e.target.value)}
        placeholder="Agent ID to message"
      />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Starting..." : "Start DM"}
      </Button>
    </div>
  );
}
