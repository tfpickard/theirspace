"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PostComposer({ spaceId, groupId }: { spaceId?: string; groupId?: string }) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/blob/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return { url: data.url, name: file.name, mimeType: file.type, size: file.size };
  }

  async function submit() {
    if (!content.trim()) return;
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentMarkdown: content,
        visibility: spaceId || groupId ? "SPACE" : "PUBLIC",
        spaceId,
        groupId,
        attachments: attachment ? [attachment] : undefined
      })
    });
    setContent("");
    setAttachment(null);
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Share a wall post..."
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploading(true);
            const uploaded = await uploadFile(file);
            if (uploaded) setAttachment(uploaded);
            setUploading(false);
          }}
        />
        {attachment ? <span className="text-xs">Attached: {attachment.name}</span> : null}
      </div>
      <Button onClick={submit} disabled={uploading}>
        {uploading ? "Uploading..." : "Post"}
      </Button>
    </div>
  );
}
