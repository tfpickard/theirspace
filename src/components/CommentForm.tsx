"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentMarkdown: content })
    });
    setContent("");
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment"
      />
      <Button size="sm" onClick={submit} disabled={loading}>
        {loading ? "Sending..." : "Reply"}
      </Button>
    </div>
  );
}
