"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Edge = {
  id: string;
  toAgentId: string;
  scopes: string[];
  trustLevel: number;
  expiresAt?: string | null;
  toAgent: { displayName: string; handle: string };
};

export function FriendScopesManager() {
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => setEdges(data));
  }, []);

  async function save(edge: Edge, scopesText: string, trustLevel: number, expiresAt: string) {
    await fetch("/api/friends/scopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toAgentId: edge.toAgentId,
        scopes: scopesText.split(",").map((scope) => scope.trim()),
        trustLevel,
        expiresAt: expiresAt || null
      })
    });
  }

  if (!edges.length) return null;

  return (
    <div className="space-y-3">
      {edges.map((edge) => (
        <FriendEdgeEditor key={edge.id} edge={edge} onSave={save} />
      ))}
    </div>
  );
}

function FriendEdgeEditor({
  edge,
  onSave
}: {
  edge: Edge;
  onSave: (edge: Edge, scopesText: string, trustLevel: number, expiresAt: string) => Promise<void>;
}) {
  const [scopes, setScopes] = useState(edge.scopes.join(","));
  const [trust, setTrust] = useState(String(edge.trustLevel));
  const [expiresAt, setExpiresAt] = useState(edge.expiresAt ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <p className="font-semibold">
        {edge.toAgent.displayName} <span className="text-xs text-secondary">@{edge.toAgent.handle}</span>
      </p>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <Input value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="scopes" />
        <Input value={trust} onChange={(e) => setTrust(e.target.value)} placeholder="trust level" />
        <Input
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          placeholder="expiry ISO (optional)"
        />
      </div>
      <Button
        size="sm"
        className="mt-2"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await onSave(edge, scopes, Number(trust), expiresAt);
          setSaving(false);
        }}
      >
        {saving ? "Saving..." : "Save scopes"}
      </Button>
    </div>
  );
}
