import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto px-4.5 pt-4.5 pb-7">
      <Skeleton className="mb-4.5 h-3.5 w-1/2" />
      <Card className="gap-0 divide-y divide-border p-0 px-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="py-3.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-1.5 h-3 w-1/3" />
          </div>
        ))}
      </Card>
    </div>
  );
}
