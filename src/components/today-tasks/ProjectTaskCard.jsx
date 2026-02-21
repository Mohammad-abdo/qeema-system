import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_COLORS,
  getTaskStatusDisplay,
  getTaskStatusColor,
  getAssigneeColor,
  PRIORITY_COLORS,
} from "@/lib/statusColors";

export function ProjectTaskCard({ project }) {
  const todayTasks = project?.todayTasks ?? [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/projects/${project?.id}`} className="font-semibold text-lg hover:underline">
              {project?.name}
            </Link>
            {project?.status && (
              <Badge variant="outline" className={cn("text-xs", PROJECT_STATUS_COLORS[project.status] || "bg-muted text-muted-foreground border-border")}>
                {(project.status || "").replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No tasks assigned for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <Card
                key={task.id}
                className={cn(
                  "p-3 border-l-4",
                  task.isBlocked && "border-l-chart-4 bg-chart-4/10 dark:bg-chart-4/20"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        to={`/dashboard/projects/${project?.id}/tasks/${task.id}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {task.title}
                      </Link>
                      <Badge variant="outline" className={cn("text-xs", getTaskStatusColor(task))}>
                        {getTaskStatusDisplay(task).replace(/_/g, " ")}
                      </Badge>
                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs", PRIORITY_COLORS[task.priority] || "bg-muted text-muted-foreground border-border")}
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {task.isBlocked && (
                        <Badge variant="outline" className="text-xs border-chart-4 text-chart-4 bg-chart-4/10">
                          <AlertTriangle className="h-3 w-3 me-1" />
                          Blocked
                        </Badge>
                      )}
                    </div>
                    {task.assignees?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.assignees.map((a) => (
                          <Badge
                            key={a.id}
                            variant="outline"
                            className={cn("text-xs", getAssigneeColor(a))}
                          >
                            {a.username || a.email || "?"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {task.isBlocked && task.blockingDependencies?.length > 0 && (
                  <div className="mt-2 text-xs text-chart-4">
                    <p className="font-medium">Blocked by:</p>
                    <ul className="list-disc list-inside mt-1">
                      {task.blockingDependencies.map((dep) => (
                        <li key={dep.id}>{dep.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
