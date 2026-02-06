"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TokenGenerator() {
  const [name, setName] = useState("openclaw");
  const [scopes, setScopes] = useState("tasks:create,tasks:assign");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes: scopes.split(",").map((s) => s.trim()) })
    });
    const data = await res.json();
    setToken(data.token);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" />
      <Input
        value={scopes}
        onChange={(e) => setScopes(e.target.value)}
        placeholder="Scopes comma-separated"
      />
      <Button onClick={create} disabled={loading}>
        {loading ? "Creating..." : "Generate token"}
      </Button>
      {token ? (
        <div className="rounded-md border border-border bg-muted/40 p-2 text-xs">
          Token (store it now): <code>{token}</code>
        </div>
      ) : null}
    </div>
  );
}
