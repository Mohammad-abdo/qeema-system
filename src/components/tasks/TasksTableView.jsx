import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowUpDown, ArrowUp, ArrowDown, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  waiting: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};
const PRIORITY_COLORS = {
  urgent: "bg-red-500/10 text-red-600 border-red-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  normal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };

export function TasksTableView({ tasks, total, page, limit, onPageChange }) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedTasks = useMemo(() => {
    if (!sortField) return tasks;
    return [...tasks].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "title":
          aVal = (a.title || "").toLowerCase();
          bVal = (b.title || "").toLowerCase();
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case "project":
          aVal = (a.project?.name || "").toLowerCase();
          bVal = (b.project?.name || "").toLowerCase();
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        case "priority":
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        case "dueDate":
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        case "assignee":
          aVal = (a.assignees?.[0]?.username || "").toLowerCase();
          bVal = (b.assignees?.[0]?.username || "").toLowerCase();
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        default:
          return 0;
      }
    });
  }, [tasks, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
  const isBlocked = (task) =>
    task.status === "waiting" || (task._count?.dependencies > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("title")}
                >
                  {t("tasks.titleColumn")}
                  {sortField === "title" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("project")}
                >
                  {t("tasks.project")}
                  {sortField === "project" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("status")}
                >
                  {t("tasks.status")}
                  {sortField === "status" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("priority")}
                >
                  {t("tasks.priority")}
                  {sortField === "priority" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("dueDate")}
                >
                  {t("tasks.due")}
                  {sortField === "dueDate" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("assignee")}
                >
                  {t("tasks.assignee")}
                  {sortField === "assignee" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => {
              const projectId = task.projectId ?? task.project?.id;
              const taskLink = projectId
                ? `/dashboard/projects/${projectId}/tasks/${task.id}`
                : `/dashboard/tasks/${task.id}`;
              const overdue = isOverdue(task);
              const blocked = isBlocked(task);
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link to={taskLink} className="font-medium hover:underline flex items-center gap-1">
                      {blocked && <Lock className="h-3 w-3 text-orange-500 shrink-0" />}
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {projectId ? (
                      <Link to={`/dashboard/projects/${projectId}`} className="text-muted-foreground hover:underline">
                        {task.project?.name || "—"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", STATUS_COLORS[task.status] || "bg-gray-500/10")}>
                      {(task.taskStatus?.name || task.status || "").replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[task.priority] || "")}>
                      {task.priority || "normal"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span className={cn(overdue && "text-red-600 font-medium")}>
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      "—"
                    )}
                    {overdue && <AlertCircle className="h-3 w-3 inline-block ms-1 text-red-600" />}
                  </TableCell>
                  <TableCell>
                    {task.assignees?.length > 0
                      ? task.assignees.map((a) => a.username).join(", ")
                      : <span className="text-muted-foreground">{t("tasks.unassigned")}</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {t("common.previous")}
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {t("tasks.pageOf", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            {t("common.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
