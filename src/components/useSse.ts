"use client";

import { useEffect, useRef } from "react";

export function useSse<T>(
  url: string,
  onEvent: (data: T) => void,
  pollUrl?: string,
  pollInterval = 5000
) {
  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let source: EventSource | null = null;

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        const res = await fetch(pollUrl ?? url);
        if (!res.ok) return;
        const payload = await res.json();
        if (!active) return;
        if (Array.isArray(payload)) {
          payload.forEach(onEvent);
        }
      }, pollInterval);
    };

    try {
      source = new EventSource(url);
      source.onmessage = (event) => {
        if (!active) return;
        lastEventId.current = event.lastEventId || lastEventId.current;
        onEvent(JSON.parse(event.data));
      };
      source.onerror = () => {
        source?.close();
        startPolling();
      };
    } catch (error) {
      startPolling();
    }

    return () => {
      active = false;
      source?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [url, onEvent, pollUrl, pollInterval]);
}
