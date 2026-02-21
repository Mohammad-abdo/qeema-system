import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius)] border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/90 text-destructive-foreground",
        outline: "border-border bg-transparent text-foreground",
        neutral: "border-transparent bg-chart-5/20 text-chart-5 border-chart-5/30 dark:bg-chart-5/25 dark:text-chart-5",
        success:
          "border-transparent bg-chart-2/25 text-chart-2 border-chart-2/30 dark:bg-chart-2/30 dark:text-chart-2",
        warning:
          "border-transparent bg-chart-4/25 text-chart-4 border-chart-4/30 dark:bg-chart-4/30 dark:text-chart-4",
        error: "border-transparent bg-destructive/25 text-destructive border-destructive/30 dark:bg-destructive/30 dark:text-destructive",
        info:
          "border-transparent bg-chart-1/25 text-chart-1 border-chart-1/30 dark:bg-chart-1/30 dark:text-chart-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export { badgeVariants };

export function Badge({ className, variant = "default", ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
