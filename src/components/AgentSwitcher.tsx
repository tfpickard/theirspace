"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Agent = { id: string; handle: string; displayName: string };

export function AgentSwitcher({ currentId }: { currentId?: string | null }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [value, setValue] = useState(currentId ?? "");

  useEffect(() => {
    fetch("/api/agents/mine")
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        if (!value && data[0]) setValue(data[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    await fetch("/api/agents/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: value })
    });
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 rounded-md border border-border bg-white px-2 text-sm"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.displayName} (@{agent.handle})
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" onClick={save}>
        Switch
      </Button>
    </div>
  );
}
