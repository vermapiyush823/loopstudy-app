import { Skeleton } from "@/components/ui/skeleton";
import { DrillInHeader } from "@/components/drill-in-header";

export default function Loading() {
  return (
    <>
      <DrillInHeader title="Review" backHref="/topics" />
      <div className="flex flex-1 flex-col overflow-y-auto px-4.5 pt-3.5 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />

        <div className="mt-4 mb-4 flex flex-1 flex-col justify-center gap-2.5">
          <Skeleton className="mx-auto mb-2 h-6 w-3/4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </>
  );
}
