import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
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
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/statusColors";

export default function TaskDetailPage() {
  const { id: projectIdParam, taskId } = useParams();
  const tid = taskId || projectIdParam;
  const projectIdFromUrl = projectIdParam && taskId ? projectIdParam : null;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [dependencySearch, setDependencySearch] = useState("");
  const [dependencyCandidates, setDependencyCandidates] = useState([]);
  const [dependencyLoading, setDependencyLoading] = useState(false);
  const [savingDependency, setSavingDependency] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [savingSubtask, setSavingSubtask] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const commentInputRef = useRef(null);
  const pendingCursorRef = useRef(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [deletingTask, setDeletingTask] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editFormPriority, setEditFormPriority] = useState("normal");
  const [editFormTaskStatusId, setEditFormTaskStatusId] = useState("");

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
    if (dependencyModalOpen && task?.id) fetchDependencyCandidates(dependencySearch);
  }, [dependencyModalOpen]);

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

  useEffect(() => {
    if (editModalOpen && task) {
      setEditFormPriority(task.priority ?? "normal");
      setEditFormTaskStatusId(task.taskStatusId != null ? String(task.taskStatusId) : "");
    }
  }, [editModalOpen, task]);

  const mentionQueryLower = mentionQuery.toLowerCase();
  const filteredMentionUsers = users
    .filter(
      (u) =>
        (u.username || "").toLowerCase().includes(mentionQueryLower) ||
        (u.email || "").toLowerCase().includes(mentionQueryLower)
    )
    .slice(0, 10);

  const handleCommentChange = (e) => {
    const value = e.target.value;
    const pos = e.target.selectionStart ?? value.length;
    setCommentContent(value);
    setCursorPos(pos);
    const textBeforeCursor = value.slice(0, pos);
    const lastAt = textBeforeCursor.lastIndexOf("@");
    if (lastAt === -1) {
      setMentionOpen(false);
      return;
    }
    const afterAt = textBeforeCursor.slice(lastAt + 1);
    if (/\s/.test(afterAt)) {
      setMentionOpen(false);
      return;
    }
    setMentionStartIndex(lastAt);
    setMentionQuery(afterAt);
    setMentionSelectedIndex(0);
    setMentionOpen(true);
  };

  const selectMention = (user) => {
    const before = commentContent.slice(0, mentionStartIndex);
    const after = commentContent.slice(cursorPos);
    const insert = `@${user.username || user.email || ""} `;
    const nextContent = before + insert + after;
    setCommentContent(nextContent);
    setMentionOpen(false);
    const nextCursor = mentionStartIndex + insert.length;
    pendingCursorRef.current = nextCursor;
  };

  useEffect(() => {
    if (commentInputRef.current && pendingCursorRef.current != null) {
      const pos = pendingCursorRef.current;
      pendingCursorRef.current = null;
      commentInputRef.current.focus();
      commentInputRef.current.setSelectionRange(pos, pos);
    }
  }, [commentContent]);

  const handleCommentKeyDown = (e) => {
    if (mentionOpen && filteredMentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionSelectedIndex((i) => (i + 1) % filteredMentionUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionSelectedIndex((i) => (i - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredMentionUsers[mentionSelectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

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

  const isDependencyResolved = (depTask) =>
    depTask?.taskStatus?.isFinal === true || depTask?.status === "completed";
  const dependencies = task?.dependencies ?? [];
  const blockingDeps = dependencies.filter((d) => !isDependencyResolved(d.dependsOnTask));
  const isBlocked = blockingDeps.length > 0;

  const fetchDependencyCandidates = (search = "") => {
    if (!task?.id) return;
    setDependencyLoading(true);
    api
      .get(`/api/v1/tasks/${task.id}/dependency-candidates`, { params: { search: search || undefined, limit: 30 } })
      .then((res) => {
        const list = res.data?.tasks ?? res.data ?? [];
        setDependencyCandidates(Array.isArray(list) ? list : []);
      })
      .catch(() => setDependencyCandidates([]))
      .finally(() => setDependencyLoading(false));
  };

  const handleAddDependency = (dependsOnTaskId) => {
    if (!task?.id || savingDependency) return;
    setSavingDependency(true);
    api
      .post(`/api/v1/tasks/${task.id}/dependencies`, { dependsOnTaskId })
      .then(() => {
        notifySuccess(t("toast.saved"));
        setDependencyModalOpen(false);
        setDependencySearch("");
        setDependencyCandidates([]);
        fetchTask();
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to add dependency"))
      .finally(() => setSavingDependency(false));
  };

  const handleRemoveDependency = (dependsOnTaskId) => {
    if (!task?.id || savingDependency) return;
    setSavingDependency(true);
    api
      .delete(`/api/v1/tasks/${task.id}/dependencies/${dependsOnTaskId}`)
      .then(() => {
        notifySuccess(t("toast.saved"));
        fetchTask();
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to remove dependency"))
      .finally(() => setSavingDependency(false));
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!task?.id || !title || savingSubtask) return;
    setSavingSubtask(true);
    api
      .post(`/api/v1/tasks/${task.id}/subtasks`, { title })
      .then(() => {
        setNewSubtaskTitle("");
        fetchTask();
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to add subtask"))
      .finally(() => setSavingSubtask(false));
  };

  const handleToggleSubtask = (subtaskId, currentStatus) => {
    if (!task?.id || savingSubtask) return;
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    setSavingSubtask(true);
    api
      .patch(`/api/v1/tasks/${task.id}/subtasks/${subtaskId}`, { status: nextStatus })
      .then(() => fetchTask())
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to update"))
      .finally(() => setSavingSubtask(false));
  };

  const handleRemoveSubtask = (subtaskId) => {
    if (!task?.id || savingSubtask) return;
    setSavingSubtask(true);
    api
      .delete(`/api/v1/tasks/${task.id}/subtasks/${subtaskId}`)
      .then(() => fetchTask())
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to remove"))
      .finally(() => setSavingSubtask(false));
  };

  const handleDeleteTask = () => {
    if (!task?.id || deletingTask) return;
    if (!window.confirm(t("taskDetail.deleteTaskConfirm") || "Are you sure you want to delete this task?")) return;
    setDeletingTask(true);
    api
      .delete(`/api/v1/tasks/${task.id}`)
      .then(() => {
        notifySuccess(t("toast.saved"));
        navigate(backHref);
      })
      .catch((err) => {
        notifyError(err?.response?.data?.error || "Failed to delete task");
        setDeletingTask(false);
      });
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!task?.id || savingEdit) return;
    const form = e.target;
    const title = form.title?.value?.trim();
    if (!title) {
      notifyError(t("taskDetail.editTitleRequired") || "Title is required");
      return;
    }
    const assigneeIds = [];
    form.querySelectorAll('input[name="assigneeIds"]:checked').forEach((el) => {
      assigneeIds.push(parseInt(el.value, 10));
    });
    setSavingEdit(true);
    try {
      await api.patch(`/api/v1/tasks/${task.id}`, {
        title,
        description: form.description?.value?.trim() || null,
        priority: editFormPriority || "normal",
        taskStatusId: editFormTaskStatusId ? parseInt(editFormTaskStatusId, 10) : null,
        dueDate: form.dueDate?.value || null,
        assigneeIds,
      });
      notifySuccess(t("toast.saved"));
      setEditModalOpen(false);
      fetchTask();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to update task");
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePostComment = () => {
    const content = commentContent.trim();
    if (!task?.id || !content || savingComment) return;
    setSavingComment(true);
    api
      .post(`/api/v1/tasks/${task.id}/comments`, { content })
      .then(() => {
        setCommentContent("");
        fetchTask();
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to post comment"))
      .finally(() => setSavingComment(false));
  };

  const handleDeleteComment = (commentId) => {
    if (!task?.id || savingComment) return;
    setSavingComment(true);
    api
      .delete(`/api/v1/tasks/${task.id}/comments/${commentId}`)
      .then(() => fetchTask())
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to delete comment"))
      .finally(() => setSavingComment(false));
  };

  const renderCommentContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) =>
      /^@\w+$/.test(part) ? (
        <span key={i} className="font-medium text-primary">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

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
      <div className="container mx-auto py-6 max-w-5xl">
        <ContentSkeleton />
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
  const statusColor = STATUS_COLORS[task.status] || "bg-muted text-muted-foreground border-border";

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
            <h1 className="page-title">{task.title}</h1>
            <Badge variant="outline" className={cn("text-xs", statusColor)}>
              {String(statusName).replace("_", " ")}
            </Badge>
            {isBlocked && (
              <Badge variant="outline" className="text-xs bg-chart-4/15 text-chart-4 border-chart-4/20 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {t("tasks.blocked")}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {task.description || t("taskDetail.noDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            {t("taskDetail.edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteTask}
            disabled={deletingTask}
          >
            {deletingTask ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
            {t("taskDetail.delete")}
          </Button>
        </div>
      </div>

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
                <span className="text-muted-foreground">{t("taskDetail.assignedTo")}</span>
                <span className="font-medium">
                  {(task.assignees ?? []).length > 0
                    ? task.assignees.map((a) => a.username || a.email).join(", ")
                    : "—"}
                </span>
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
                <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[task.priority] || "bg-muted text-muted-foreground border-border")}>{task.priority || "normal"}</Badge>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {t("taskDetail.dependencies")}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDependencyModalOpen(true);
                  setDependencySearch("");
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("taskDetail.addDependency")}
              </Button>
            </CardHeader>
            <CardContent>
              {isBlocked && (
                <p className="text-sm text-chart-4 mb-3 flex items-center gap-1">
                  <Lock className="h-4 w-4 shrink-0" />
                  {t("taskDetail.blockedUntilResolved")}
                </p>
              )}
              {(!dependencies || dependencies.length === 0) ? (
                <p className="text-sm text-muted-foreground">{t("taskDetail.noDependencies")}</p>
              ) : (
                <ul className="space-y-2">
                  {dependencies.map((dep) => {
                    const depTask = dep.dependsOnTask;
                    const resolved = isDependencyResolved(depTask);
                    const depProjectId = depTask?.project?.id ?? depTask?.projectId ?? projectId;
                    const taskLink = depProjectId
                      ? `/dashboard/projects/${depProjectId}/tasks/${depTask?.id}`
                      : `/dashboard/tasks/${depTask?.id}`;
                    return (
                      <li
                        key={dep.dependsOnTaskId}
                        className="flex items-center justify-between gap-2 rounded border p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            to={taskLink}
                            className="text-primary hover:underline font-medium line-clamp-1"
                          >
                            {depTask?.title ?? `Task #${dep.dependsOnTaskId}`}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {depTask?.project?.name && (
                              <span className="text-xs text-muted-foreground">{depTask.project.name}</span>
                            )}
                            {resolved ? (
                              <span className="text-xs text-chart-2 flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {t("taskDetail.dependencyResolved")}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                ({depTask?.taskStatus?.name ?? depTask?.status ?? "—"})
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveDependency(dep.dependsOnTaskId)}
                          disabled={savingDependency}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Edit Task modal */}
          <Dialog
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
          >
            {task && (
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] my-2 p-0 gap-0 overflow-hidden flex flex-col border-border bg-card">
                <DialogHeader className="border-b border-border px-6 py-4 pb-3 text-left shrink-0">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                    {t("taskDetail.editTaskTitle")}
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                    {t("taskDetail.editTaskSubtitle")}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditTaskSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="space-y-4 overflow-y-auto flex-1 min-h-0 px-6 py-4 pr-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("taskDetail.taskDetails")}
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-title" className="text-foreground">
                          {t("taskDetail.titleLabel")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="edit-title"
                          name="title"
                          required
                          defaultValue={task.title}
                          placeholder={t("taskDetail.titlePlaceholder")}
                          className="transition-[border-color,box-shadow] duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-description" className="text-foreground">
                          {t("taskDetail.description")}
                        </Label>
                        <textarea
                          id="edit-description"
                          name="description"
                          placeholder={t("taskDetail.noDescription")}
                          rows={2}
                          defaultValue={task.description ?? ""}
                          className="flex min-h-[88px] w-full rounded-[var(--radius)] border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-3 focus:ring-ring/50 focus:ring-offset-0 resize-y"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("taskDetail.statusAndSchedule")}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-priority" className="text-foreground">
                          {t("taskDetail.priority")}
                        </Label>
                        <Select
                          value={editFormPriority}
                          onValueChange={setEditFormPriority}
                        >
                          <SelectTrigger id="edit-priority" className="w-full">
                            <SelectValue placeholder={t("taskDetail.priority")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t("tasks.low")}</SelectItem>
                            <SelectItem value="normal">{t("tasks.normal")}</SelectItem>
                            <SelectItem value="high">{t("tasks.high")}</SelectItem>
                            <SelectItem value="urgent">{t("tasks.urgent")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-status" className="text-foreground">
                          {t("common.status")}
                        </Label>
                        <Select
                          value={editFormTaskStatusId === "" ? "__none__" : editFormTaskStatusId}
                          onValueChange={(v) => setEditFormTaskStatusId(v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger id="edit-status" className="w-full">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {taskStatuses.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-dueDate" className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {t("taskDetail.dueDate")}
                      </Label>
                      <Input
                        type="date"
                        id="edit-dueDate"
                        name="dueDate"
                        defaultValue={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                        className="transition-[border-color,box-shadow] duration-200"
                      />
                    </div>
                  </section>
                  </div>

                  <section className="space-y-3">
                    <Label className="text-foreground">{t("taskDetail.assignees")}</Label>
                    <div className="max-h-[120px] overflow-y-auto rounded-[var(--radius)] border border-border bg-muted/30">
                      {users.length > 0 ? (
                        <ul className="p-1.5 space-y-0.5">
                          {users.map((user) => (
                            <li key={user.id}>
                              <label
                                className={cn(
                                  "flex items-center gap-3 rounded-[calc(var(--radius)-2px)] px-2.5 py-2 cursor-pointer text-sm text-foreground transition-colors",
                                  "hover:bg-accent/80"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  name="assigneeIds"
                                  value={user.id}
                                  defaultChecked={(task.assignees ?? []).some((a) => a.id === user.id)}
                                  className="h-4 w-4 rounded border-input text-primary focus:ring-3 focus:ring-ring/50 focus:ring-offset-0"
                                />
                                <span className="font-medium">{user.username || user.email}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="p-4 text-sm text-muted-foreground text-center">
                          {t("taskDetail.noAssignees")}
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                  <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-muted/30 -mx-6 -mb-5 px-6 py-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditModalOpen(false)}
                      className="min-w-[80px]"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={savingEdit} className="min-w-[120px]">
                      {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />}
                      {t("taskDetail.updateTask")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            )}
          </Dialog>

          {/* Add dependency modal */}
          {dependencyModalOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                aria-hidden
                onClick={() => setDependencyModalOpen(false)}
              />
              <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                <h3 className="font-semibold mb-3">{t("taskDetail.addDependency")}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("taskDetail.searchDependencyPlaceholder")}
                </p>
                <input
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mb-3"
                  placeholder={t("taskDetail.searchDependencyPlaceholder")}
                  value={dependencySearch}
                  onChange={(e) => {
                    setDependencySearch(e.target.value);
                    fetchDependencyCandidates(e.target.value);
                  }}
                />
                <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                  {dependencyLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : dependencyCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("taskDetail.noDependencies")}</p>
                  ) : (
                    dependencyCandidates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="w-full text-left rounded px-2 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                        onClick={() => handleAddDependency(t.id)}
                        disabled={savingDependency}
                      >
                        <span className="font-medium truncate">{t.title}</span>
                        {t.project?.name && (
                          <span className="text-xs text-muted-foreground shrink-0">{t.project.name}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" onClick={() => setDependencyModalOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                {t("taskDetail.checklist")}
                {subtasks.length > 0 && (
                  <span className="text-muted-foreground font-normal text-sm">
                    ({subtasksDone}/{subtasks.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder={t("taskDetail.addChecklistItem")}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  disabled={savingSubtask}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim() || savingSubtask}
                >
                  {savingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("taskDetail.noSubtasks")}</p>
              ) : (
                <ul className="space-y-1">
                  {subtasks.map((s) => (
                    <li
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 rounded border p-2 text-sm",
                        s.status === "completed" && "bg-muted/50"
                      )}
                    >
                      <button
                        type="button"
                        className="shrink-0 rounded p-0.5 hover:bg-muted"
                        onClick={() => handleToggleSubtask(s.id, s.status)}
                        disabled={savingSubtask}
                        aria-label={s.status === "completed" ? t("taskDetail.notCompleted") : t("taskDetail.completed")}
                      >
                        {s.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-chart-2" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span
                        className={cn(
                          "min-w-0 flex-1",
                          s.status === "completed" && "text-muted-foreground line-through"
                        )}
                      >
                        {s.title}
                      </span>
                      {s.assignedTo && (
                        <span className="text-muted-foreground text-xs shrink-0">
                          {s.assignedTo.username}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSubtask(s.id)}
                        disabled={savingSubtask}
                        aria-label={t("taskDetail.removeDependency")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions + Comments */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("taskDetail.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("taskDetail.updateStatus")}</label>
                <div className="flex gap-2">
                  <select
                    className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
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
                  >
                    {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : t("taskDetail.update")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t("taskDetail.comments")}
                {task?.comments?.length > 0 && (
                  <span className="text-muted-foreground font-normal text-sm">({task.comments.length})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <textarea
                  ref={commentInputRef}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t("taskDetail.addCommentPlaceholderWithMention")}
                  value={commentContent}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  onBlur={() => setTimeout(() => setMentionOpen(false), 180)}
                  disabled={savingComment}
                  rows={3}
                  aria-describedby={mentionOpen ? "mention-listbox" : undefined}
                />
                {mentionOpen && (
                  <ul
                    id="mention-listbox"
                    role="listbox"
                    className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-card shadow-lg py-1 animate-in fade-in duration-200"
                  >
                    {filteredMentionUsers.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-muted-foreground">{t("taskDetail.noUsersFound") || "No users found"}</li>
                    ) : (
                      filteredMentionUsers.map((u, i) => (
                        <li
                          key={u.id}
                          role="option"
                          aria-selected={i === mentionSelectedIndex}
                          className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                            i === mentionSelectedIndex ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/50"
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectMention(u);
                          }}
                        >
                          {u.username || u.email || `User #${u.id}`}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("taskDetail.mentionTip")}
              </p>
              <Button
                onClick={handlePostComment}
                disabled={!commentContent.trim() || savingComment}
                className="w-full sm:w-auto"
              >
                {savingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t("taskDetail.addComment")}
              </Button>
              {(!task?.comments || task.comments.length === 0) ? (
                <p className="text-sm text-muted-foreground">{t("taskDetail.noCommentsYet")}</p>
              ) : (
                <ul className="space-y-3">
                  {task.comments.map((c) => (
                    <li key={c.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {c.author?.username ?? c.author?.email ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.createdAt ? format(new Date(c.createdAt), "MMM d, HH:mm") : ""}
                          </p>
                          <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                            {renderCommentContent(c.content)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={savingComment}
                          aria-label={t("taskDetail.deleteComment")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
