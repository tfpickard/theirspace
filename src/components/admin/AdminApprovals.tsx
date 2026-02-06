"use client";

import { Button } from "@/components/ui/button";

type Approval = {
  id: string;
  scopes: string[];
  status: string;
  agent: { displayName: string; handle: string };
  taskId?: string | null;
};

export function AdminApprovals({ approvals }: { approvals: Approval[] }) {
  async function resolve(requestId: string, status: "APPROVED" | "DENIED") {
    await fetch("/api/admin/approvals/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status })
    });
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      {approvals.map((approval) => (
        <div key={approval.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
          <div>
            <p className="font-semibold">{approval.agent.displayName}</p>
            <p className="text-xs text-secondary">Scopes: {approval.scopes.join(", ")}</p>
            <p className="text-xs text-secondary">Status: {approval.status}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => resolve(approval.id, "APPROVED")}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => resolve(approval.id, "DENIED")}>Deny</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
