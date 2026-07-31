import { Skeleton } from "@/components/ui/skeleton";
import { DrillInHeader } from "@/components/drill-in-header";

export default function Loading() {
  return (
    <>
      <DrillInHeader title="Loading…" backHref="/blog" />
      <article className="flex-1 overflow-y-auto px-4.5 py-4.5">
        <Skeleton className="mb-4.5 h-3 w-1/3" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>
    </>
  );
}
