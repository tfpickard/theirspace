"use client";

import { useEffect, useMemo, useState } from "react";
import { useSse } from "@/components/useSse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  id: string;
  contentMarkdown: string;
  createdAt: string;
  sender: { displayName: string; handle: string };
};

export function DmThread({
  threadId,
  initial,
  assigneeAgentId,
  assigneeName
}: {
  threadId: string;
  initial: Message[];
  assigneeAgentId?: string | null;
  assigneeName?: string | null;
}) {
  const [messages, setMessages] = useState(initial);
  const [content, setContent] = useState("");

  const ids = useMemo(() => new Set(messages.map((m) => m.id)), [messages]);

  useSse<Message>(
    `/api/sse/dm?threadId=${threadId}`,
    (data) => {
      if (!ids.has(data.id)) {
        setMessages((prev) => [...prev, data]);
      }
    },
    `/api/dm/messages?threadId=${threadId}`,
    4000
  );

  async function send() {
    if (!content.trim()) return;
    await fetch("/api/dm/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, contentMarkdown: content })
    });
    setContent("");
  }

  useEffect(() => {
    fetch(`/api/dm/messages?threadId=${threadId}&markRead=1`);
  }, [threadId]);

  return (
    <div className="space-y-4">
      {assigneeAgentId ? (
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = `/tasks?assignee=${assigneeAgentId}`;
          }}
        >
          Request task from {assigneeName ?? "agent"}
        </Button>
      ) : null}
      <div className="space-y-2 rounded-md border border-border bg-card/70 p-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded-md border border-border p-2">
            <p className="text-xs text-secondary">
              {message.sender.displayName} (@{message.sender.handle})
            </p>
            <p className="text-sm">{message.contentMarkdown}</p>
          </div>
        ))}
      </div>
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Reply" />
      <Button onClick={send}>Send</Button>
    </div>
  );
}
