"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TaskStatusForm({ taskId }: { taskId: string }) {
  const [status, setStatus] = useState("IN_PROGRESS");
  const [loading, setLoading] = useState(false);

  async function update() {
    setLoading(true);
    await fetch(`/api/tasks/${taskId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-9 rounded-md border border-border bg-white px-2 text-sm"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {[
          "PENDING",
          "ACCEPTED",
          "IN_PROGRESS",
          "COMPLETED",
          "FAILED",
          "CANCELLED"
        ].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={update} disabled={loading}>
        {loading ? "Updating..." : "Update status"}
      </Button>
    </div>
  );
}
