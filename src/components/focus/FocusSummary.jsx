import { Card, CardContent } from "@/components/ui/Card";
import { BarChart2 } from "lucide-react";

export function FocusSummary({ tasks = [] }) {
  const totalTasks = tasks.length;
  const estimatedTime = tasks.reduce((acc, task) => acc + (task.estimatedHours || 0), 0);
  const uniqueProjects = new Set(tasks.map((t) => t.project?.name).filter(Boolean)).size;

  return (
    <div className="space-y-4 h-full">
      <div className="bg-card rounded-xl border shadow-sm p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <BarChart2 className="h-4 w-4" /> Summary
        </h3>

        <div className="space-y-4">
          <div className="p-3 bg-chart-1/10 dark:bg-chart-1/20 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Selected Tasks</p>
            <p className="text-2xl font-bold text-chart-1">{totalTasks}</p>
          </div>

          <div className="p-3 bg-chart-2/10 dark:bg-chart-2/20 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Estimated Time</p>
            <p className="text-2xl font-bold text-chart-2">{estimatedTime}h</p>
          </div>

          <div className="p-3 bg-chart-1/10 dark:bg-chart-1/20 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Projects Involved</p>
            <p className="text-2xl font-bold text-chart-1">{uniqueProjects}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
