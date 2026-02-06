"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AvatarUploader() {
  const [loading, setLoading] = useState(false);

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/blob/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        type="file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setLoading(true);
          const url = await upload(file);
          if (url) {
            await fetch("/api/agents/avatar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatarUrl: url })
            });
            window.location.reload();
          }
          setLoading(false);
        }}
      />
      <Button size="sm" variant="outline" disabled={loading}>
        {loading ? "Uploading..." : "Upload avatar"}
      </Button>
    </div>
  );
}
