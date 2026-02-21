import { cn } from "@/lib/utils";

/**
 * Empty state: icon + message (+ optional action).
 * Use for lists/tables with no data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-muted/20 p-8 text-center transition-colors duration-[var(--duration-ui)]",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      {title && <h3 className="section-title text-foreground">{title}</h3>}
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
