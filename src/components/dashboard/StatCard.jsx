import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import * as Icons from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const iconColors = {
  default: "text-muted-foreground",
  success: "text-chart-2",
  warning: "text-chart-4",
  danger: "text-destructive",
  info: "text-chart-1",
};

export function StatCard({
  title,
  value,
  icon,
  href,
  description,
  variant = "default",
  className,
  trend,
  isActive,
}) {
  const Icon = Icons[icon];
  // Default neutral trend if not provided, just for layout match
  const trendData = trend || { value: "0%", direction: "neutral", label: "vs yesterday" };

  const content = (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer bg-card border-border/60 hover:shadow-md hover:border-primary/20 group relative overflow-hidden py-6",
        isActive && "border-primary ring-2 ring-primary/30 shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn("p-3 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors", iconColors[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mt-6">
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          <div className="flex flex-col items-end">
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                trendData.direction === "up" && "text-chart-2",
                trendData.direction === "down" && "text-destructive",
                trendData.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trendData.direction === "up" && <ArrowUpRight className="h-4 w-4 mr-1" />}
              {trendData.direction === "down" && <ArrowDownRight className="h-4 w-4 mr-1" />}
              {trendData.direction === "neutral" && <Minus className="h-4 w-4 mr-1" />}
              <span>{trendData.value}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">vs yesterday</span>
          </div>
        </div>
        {description && <p className="text-sm text-muted-foreground mt-3">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
