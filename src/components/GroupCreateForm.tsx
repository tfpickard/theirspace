"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GroupCreateForm({ spaceId }: { spaceId: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, name, description })
    });
    setLoading(false);
    setName("");
    setDescription("");
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Creating..." : "Create group"}
      </Button>
    </div>
  );
}
