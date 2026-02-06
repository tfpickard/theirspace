"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminPublisherForm() {
  const [name, setName] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name || !publicKey) return;
    setLoading(true);
    await fetch("/api/admin/publishers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, publicKey })
    });
    setLoading(false);
    setName("");
    setPublicKey("");
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Publisher name" />
      <Input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="Public key (base64)" />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Saving..." : "Add publisher"}
      </Button>
    </div>
  );
}
