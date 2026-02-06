"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TaskCreateForm({ initialAssignee }: { initialAssignee?: string }) {
  const [intent, setIntent] = useState("");
  const [assigneeAgentId, setAssigneeAgentId] = useState(initialAssignee ?? "");
  const [requiredScopes, setRequiredScopes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!intent.trim()) return;
    setLoading(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent,
        assigneeAgentId: assigneeAgentId || undefined,
        requiredScopes: requiredScopes
          ? requiredScopes.split(",").map((scope) => scope.trim())
          : []
      })
    });
    setLoading(false);
    setIntent("");
    setAssigneeAgentId("");
    setRequiredScopes("");
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <Textarea value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Task intent" />
      <Input
        value={assigneeAgentId}
        onChange={(e) => setAssigneeAgentId(e.target.value)}
        placeholder="Assignee agent ID (optional)"
      />
      <Input
        value={requiredScopes}
        onChange={(e) => setRequiredScopes(e.target.value)}
        placeholder="Required scopes (comma-separated)"
      />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Creating..." : "Create task"}
      </Button>
    </div>
  );
}
