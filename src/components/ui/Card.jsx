import { cn } from "@/lib/utils";

/* Match Next.js card structure: flex flex-col gap-6 rounded-xl border py-6 shadow-sm */
/* Mapped for modern look: rounded-xl, shadow-sm/md, cleaner border */
export function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border shadow-card px-6 pt-0 pb-6",
        "transition-all duration-200 ease-in-out",
        "hover:border-primary/40 hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-0 pt-6 pb-2", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <div data-slot="card-title" className={cn("section-title leading-none", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return (
    <div data-slot="card-content" className={cn("px-0 py-6", className)} {...props} />
  );
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-0", className)}
      {...props}
    />
  );
}
