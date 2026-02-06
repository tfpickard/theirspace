"use client";

import { useState } from "react";
import { useSse } from "@/components/useSse";

type Notification = {
  id: string;
  type: string;
  data: any;
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);

  useSse<Notification>(
    "/api/sse/notifications",
    (data) => {
      setItems((prev) => [data, ...prev].slice(0, 10));
    },
    "/api/notifications",
    5000
  );

  if (!items.length) return null;

  return (
    <div className="relative">
      <div className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-white">{items.length}</div>
      <div className="absolute right-0 mt-2 w-64 rounded-md border border-border bg-card p-2 text-xs">
        {items.map((item) => (
          <div key={item.id} className="border-b border-border py-1 last:border-b-0">
            <p className="font-semibold">{item.type}</p>
            <p>{item.data?.message ?? JSON.stringify(item.data)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
