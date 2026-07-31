import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto px-4.5 pt-4.5 pb-7">
      <Skeleton className="mb-4.5 h-4 w-3/4" />

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-1.5 p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
