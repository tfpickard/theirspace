import type { NextRequest } from "next/server";

export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return;
  if (!origin.includes(host)) {
    throw new Error("Invalid origin");
  }
}
