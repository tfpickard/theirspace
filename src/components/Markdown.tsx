import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export async function Markdown({ content, className }: { content: string; className?: string }) {
  const html = await markdownToHtml(content);
  return (
    <div
      className={cn("space-y-3 text-sm leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
