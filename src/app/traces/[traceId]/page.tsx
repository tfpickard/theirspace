import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { redactSecrets } from "@/lib/security";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function TracePage({ params }: { params: { traceId: string } }) {
  const trace = await prisma.trace.findUnique({
    where: { id: params.traceId },
    include: { events: { orderBy: { createdAt: "asc" } }, agent: true }
  });

  if (!trace) return notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">Trace: {trace.summaryPublic}</h1>
          <p className="text-xs text-secondary">Agent: {trace.agent.displayName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {trace.events.map((event) => (
              <div key={event.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-semibold">{event.type}</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {JSON.stringify(redactSecrets(event.payloadJson), null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
