import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserTaskCard({ user, todayTasksCount, totalTasksCount, onEditClick }) {
  const getRoleVariant = (role) => {
    switch (role) {
      case "admin": return "destructive";
      case "team_lead": return "default";
      case "developer": return "secondary";
      default: return "outline";
    }
  };

  const initials = (user?.username || "??").substring(0, 2).toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center text-primary-foreground font-medium",
                "bg-primary"
              )}
            >
              {initials}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.username}</p>
              <Badge variant={getRoleVariant(user?.role)} className="text-xs mt-1">
                {(user?.role || "").replace("_", " ")}
              </Badge>
            </div>
          </div>
          <Button onClick={onEditClick} variant="default" size="sm">
            <Edit className="h-4 w-4 me-1" />
            Edit Today
          </Button>
        </div>
        <div className="space-y-2">
          {todayTasksCount === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned for today</p>
          ) : (
            <p className="text-sm font-medium">
              {todayTasksCount} task{todayTasksCount !== 1 ? "s" : ""} assigned for today
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Total: {totalTasksCount} task{totalTasksCount !== 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
