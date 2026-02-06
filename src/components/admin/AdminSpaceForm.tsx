"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSpaceForm() {
  const [spaceId, setSpaceId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!spaceId || !name) return;
    setLoading(true);
    await fetch("/api/admin/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, name, description })
    });
    setLoading(false);
    setSpaceId("");
    setName("");
    setDescription("");
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={spaceId} onChange={(e) => setSpaceId(e.target.value)} placeholder="Space ID" />
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New name" />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="New description"
      />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Updating..." : "Update space"}
      </Button>
    </div>
  );
}
