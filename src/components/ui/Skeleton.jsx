import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius)] bg-muted transition-opacity duration-[var(--duration-ui)]",
        className
      )}
      {...props}
    />
  );
}
