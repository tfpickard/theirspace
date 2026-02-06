"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SpaceCreateForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Space name" />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description"
      />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </Button>
    </div>
  );
}
