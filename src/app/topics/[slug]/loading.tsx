import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DrillInHeader } from "@/components/drill-in-header";

export default function Loading() {
  return (
    <>
      <DrillInHeader title="Loading…" backHref="/topics" />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-5">
        <Skeleton className="mb-3 h-3.5 w-32" />
        <Card className="gap-0 divide-y divide-border p-0 px-4">
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3.5">
                <Skeleton className="mt-0.5 size-[22px] shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-1.5 h-3.5 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
