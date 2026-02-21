import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

/**
 * Skeleton that matches the shape of a typical detail page: header + content blocks.
 * Use instead of full-page spinner when loading a single resource.
 */
export function ContentSkeleton({ className, ...props }) {
  return (
    <div className={className} {...props}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-[var(--radius)]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[75%]" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
