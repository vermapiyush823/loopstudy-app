import { Skeleton } from "@/components/ui/skeleton";
import { DrillInHeader } from "@/components/drill-in-header";

export default function Loading() {
  return (
    <>
      <DrillInHeader title="Loading…" backHref="/topics" />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-7">
        <Skeleton className="mb-3.5 h-3.5 w-2/3" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </>
  );
}
