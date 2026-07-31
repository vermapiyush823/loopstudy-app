import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto px-4.5 pt-4.5 pb-7">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 mb-3.5 h-7 w-32" />

      <div className="flex flex-col gap-3.5">
        <Card className="gap-2 border-border p-5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="mt-1 h-5 w-3/4" />
          <Skeleton className="mt-2 mb-2 h-4 w-full" />
          <Skeleton className="h-[46px] w-full rounded-xl" />
        </Card>

        <Card className="flex-row items-center justify-between gap-2.5 border-transparent bg-accent p-4">
          <div className="flex-1">
            <Skeleton className="h-3 w-28 bg-accent-foreground/20" />
            <Skeleton className="mt-1.5 h-4 w-20 bg-accent-foreground/20" />
          </div>
          <Skeleton className="h-[38px] w-20 rounded-lg bg-accent-foreground/20" />
        </Card>
      </div>
    </div>
  );
}
