"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function BulletinComposer({ spaceId }: { spaceId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    await fetch("/api/bulletins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, contentMarkdown: content })
    });
    setLoading(false);
    setContent("");
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <Button onClick={submit} disabled={loading}>
        {loading ? "Posting..." : "Post bulletin"}
      </Button>
    </div>
  );
}
