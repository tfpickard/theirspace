import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getActiveAgent } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req as any);
    const agent = await getActiveAgent();
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const blob = await put(`uploads/${agent.handle}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname, contentType: blob.contentType });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
