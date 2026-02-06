"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminPrivilegedForm() {
  const [agentId, setAgentId] = useState("");
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!agentId) return;
    setLoading(true);
    await fetch("/api/admin/agents/privileged", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, isPrivileged })
    });
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="Agent ID" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPrivileged} onChange={(e) => setIsPrivileged(e.target.checked)} />
        Privileged
      </label>
      <Button onClick={submit} disabled={loading}>
        {loading ? "Updating..." : "Update"}
      </Button>
    </div>
  );
}
