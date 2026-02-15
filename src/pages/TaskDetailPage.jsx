import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  Link2,
  ListTodo,
  Loader2,
} from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
  review: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  waiting: "bg-orange-500/10 text-orange-700 border-orange-500/20",
};

export default function TaskDetailPage() {
  const { id: projectIdParam, taskId } = useParams();
  const tid = taskId || projectIdParam;
  const projectIdFromUrl = projectIdParam && taskId ? projectIdParam : null;
  const { t } = useTranslation();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);

  const fetchTask = () => {
    if (!tid) return;
    api
      .get(`/api/v1/tasks/${tid}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setTask(data);
        setSelectedStatusId(data?.taskStatusId != null ? String(data.taskStatusId) : "");
        setSelectedAssigneeIds((data?.assignees ?? []).map((a) => a.id));
      })
      .catch((err) => {
        setTask(null);
        notifyError(err?.response?.data?.error || "Failed to load task");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!tid) return;
    setLoading(true);
    fetchTask();
  }, [tid]);

  useEffect(() => {
    api.get("/api/v1/users").then((r) => {
      const u = r.data?.users ?? r.data ?? [];
      setUsers(Array.isArray(u) ? u : []);
    }).catch(() => setUsers([]));
    api.get("/api/v1/task-statuses").then((r) => {
      const list = r.data?.taskStatuses ?? r.data ?? [];
      setTaskStatuses(Array.isArray(list) ? list : []);
    }).catch(() => setTaskStatuses([]));
  }, []);

  const projectId = task?.projectId ?? task?.project?.id ?? projectIdFromUrl;
  const backHref = projectId
    ? `/dashboard/projects/${projectId}?tab=tasks`
    : "/dashboard/tasks";
  const backLabel = projectId ? t("taskDetail.backToProjectTasks") : t("tasks.title");

  const isCompleted =
    task?.taskStatus?.isFinal === true ||
    task?.status === "completed" ||
    (task?.completedAt != null && task.completedAt !== "");

  const subtasks = task?.subtasks ?? [];
  const subtasksDone = subtasks.filter((s) => s.status === "completed").length;
  const progressPct = subtasks.length > 0 ? Math.round((subtasksDone / subtasks.length) * 100) : (isCompleted ? 100 : 0);

  const handleSaveStatus = () => {
    if (!task?.id || savingStatus) return;
    setSavingStatus(true);
    api
      .patch(`/api/v1/tasks/${task.id}`, {
        taskStatusId: selectedStatusId ? parseInt(selectedStatusId, 10) : null,
      })
      .then(() => {
        notifySuccess(t("toast.saved"));
        fetchTask();
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to update status"))
      .finally(() => setSavingStatus(false));
  };

  const handleSaveAssignees = () => {
    if (!task?.id || savingAssignees) return;
    setSavingAssignees(true);
    api
      .patch(`/api/v1/tasks/${task.id}`, {
        assigneeIds: selectedAssigneeIds,
      })
      .then(() => {
        notifySuccess(t("toast.saved"));
        fetchTask();
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to update assignees"))
      .finally(() => setSavingAssignees(false));
  };

  const toggleAssignee = (userId) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Link to={projectIdFromUrl ? `/dashboard/projects/${projectIdFromUrl}` : "/dashboard/tasks"} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <p className="text-destructive">{t("common.error")} — Task not found.</p>
      </div>
    );
  }

  const statusName = task.taskStatus?.name ?? task.status ?? "—";
  const statusColor = STATUS_COLORS[task.status] || "bg-gray-500/10 text-gray-700 border-gray-500/20";

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
            <Badge variant="outline" className={cn("text-xs", statusColor)}>
              {String(statusName).replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {task.description || t("taskDetail.noDescription")}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            {t("taskDetail.progress")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">
            {isCompleted ? t("taskDetail.completed") : t("taskDetail.notCompleted")}
          </p>
          {subtasks.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t("taskDetail.subtasks")}</span>
                <span>{subtasksDone} / {subtasks.length}</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details + Dependencies + Subtasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("taskDetail.taskDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("common.status")}</span>
                <Badge variant="outline" className={cn("text-xs", statusColor)}>{statusName}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("taskDetail.project")}</span>
                {task.project && (
                  <Link to={`/dashboard/projects/${task.project.id}`} className="font-medium text-primary hover:underline">
                    {task.project.name}
                  </Link>
                )}
                {!task.project && <span>—</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {t("taskDetail.dueDate")}
                </span>
                <span className="font-medium">
                  {task.dueDate ? format(new Date(task.dueDate), "PP") : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("taskDetail.priority")}</span>
                <Badge variant="outline" className="text-xs">{task.priority || "normal"}</Badge>
              </div>
              {task.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("taskDetail.createdOn")}</span>
                  <span>{format(new Date(task.createdAt), "PPp")}</span>
                </div>
              )}
              {task.creator && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("taskDetail.createdBy")}</span>
                  <span>{task.creator.username || task.creator.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dependencies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {t("taskDetail.dependencies")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!task.dependencies || task.dependencies.length === 0) ? (
                <p className="text-sm text-muted-foreground">{t("taskDetail.noDependencies")}</p>
              ) : (
                <ul className="space-y-2">
                  {task.dependencies.map((dep) => (
                    <li key={dep.dependsOnTaskId}>
                      <Link
                        to={projectId ? `/dashboard/projects/${projectId}/tasks/${dep.dependsOnTask?.id}` : `/dashboard/tasks/${dep.dependsOnTask?.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {dep.dependsOnTask?.title ?? `Task #${dep.dependsOnTaskId}`}
                      </Link>
                      {dep.dependsOnTask?.status && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({dep.dependsOnTask.status})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                {t("taskDetail.subtasks")} ({subtasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("taskDetail.noSubtasks")}</p>
              ) : (
                <ul className="space-y-2">
                  {subtasks.map((s) => (
                    <li
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 py-1.5 text-sm",
                        s.status === "completed" && "text-muted-foreground line-through"
                      )}
                    >
                      {s.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span>{s.title}</span>
                      {s.assignedTo && (
                        <span className="text-muted-foreground text-xs">
                          — {s.assignedTo.username}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Assignees + Update status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("taskDetail.assignees")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.slice(0, 50).map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{u.username || u.email}</span>
                  </label>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleSaveAssignees}
                disabled={savingAssignees}
                className="w-full"
              >
                {savingAssignees ? <Loader2 className="h-4 w-4 animate-spin" /> : t("taskDetail.save")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("taskDetail.updateStatus")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
              >
                <option value="">—</option>
                {taskStatuses.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="w-full"
              >
                {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : t("taskDetail.save")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
