import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Lock,
  ListTodo,
  Target,
  User,
} from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { StatCard } from "@/components/dashboard/StatCard";
import { TasksViewSwitcher } from "@/components/tasks/TasksViewSwitcher";
import { TasksTableView } from "@/components/tasks/TasksTableView";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import {
  PRIORITY_COLORS,
  getTaskStatusDisplay,
  getTaskStatusColor,
  getAssigneeColor,
} from "@/lib/statusColors";

function Avatar({ name, className }) {
  const initials = (name || "??").substring(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-muted text-xs font-medium",
        className
      )}
    >
      {initials}
    </div>
  );
}

export default function TasksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get("project") ? searchParams.get("project").split(",").filter(Boolean) : (searchParams.get("projectId") ? searchParams.get("projectId").split(",").filter(Boolean) : [])
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ? searchParams.get("status").split(",").filter(Boolean) : []
  );
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get("assignee") || searchParams.get("assigneeId") || "all");
  const [priorityFilter, setPriorityFilter] = useState(
    searchParams.get("priority") ? searchParams.get("priority").split(",").filter(Boolean) : []
  );
  const [dependencyState, setDependencyState] = useState(searchParams.get("dependencyState") || "all");
  const [dateRange, setDateRange] = useState({
    start: searchParams.get("startDate") ? new Date(searchParams.get("startDate")) : undefined,
    end: searchParams.get("endDate") ? new Date(searchParams.get("endDate")) : undefined,
  });
  const [dateFilterType, setDateFilterType] = useState(
    (searchParams.get("dateFilterType") === "createdDate" ? "createdDate" : "dueDate")
  );
  const [viewMode, setViewMode] = useState(searchParams.get("view") === "table" ? "table" : "card");
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get("page") || "1", 10)));
  const limit = 20;
  const cardFilter = searchParams.get("filter") || null;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      page: cardFilter === "overdue" ? 1 : page,
      limit: cardFilter === "overdue" ? 100 : limit,
      search: searchQuery || undefined,
      assigneeId: assigneeFilter !== "all" ? (assigneeFilter === "me" ? "me" : assigneeFilter) : undefined,
      dateFilterType: dateFilterType || "dueDate",
    };
    if (projectFilter.length > 0) params.projectId = projectFilter;
    if (statusFilter.length > 0) params.status = statusFilter;
    if (priorityFilter.length > 0) params.priority = priorityFilter;
    if (dateRange.start) params.startDate = dateRange.start.toISOString?.() ? dateRange.start.toISOString().split("T")[0] : dateRange.start;
    if (dateRange.end) params.endDate = dateRange.end.toISOString?.() ? dateRange.end.toISOString().split("T")[0] : dateRange.end;
    if (cardFilter === "overdue") {
      const today = new Date().toISOString().split("T")[0];
      params.endDate = today;
      params.dateFilterType = "dueDate";
    }

    try {
      const res = await api.get("/api/v1/tasks", { params });
      const data = res.data;
      let list = data?.tasks ?? [];
      if (dependencyState === "blocked") {
        list = list.filter((t) => t.status === "waiting" || (t._count?.dependencies > 0));
      }
      if (cardFilter === "overdue") {
        const now = new Date();
        list = list.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed"
        );
        setTotal(list.length);
      } else {
        setTotal(data?.total ?? 0);
      }
      setTasks(list);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message;
      setError(msg);
      notifyError(msg);
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, projectFilter, statusFilter, assigneeFilter, priorityFilter, dateRange, dateFilterType, dependencyState, cardFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setProjectFilter(searchParams.get("project") ? searchParams.get("project").split(",").filter(Boolean) : []);
    setStatusFilter(searchParams.get("status") ? searchParams.get("status").split(",").filter(Boolean) : []);
    setAssigneeFilter(searchParams.get("assignee") || "all");
    setPriorityFilter(searchParams.get("priority") ? searchParams.get("priority").split(",").filter(Boolean) : []);
    setDependencyState(searchParams.get("dependencyState") || "all");
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    setDateRange({
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
    });
    setDateFilterType(searchParams.get("dateFilterType") || "dueDate");
    setPage(Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set("search", searchQuery);
    else params.delete("search");
    if (projectFilter.length > 0) params.set("project", projectFilter.join(","));
    else params.delete("project");
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    else params.delete("status");
    if (assigneeFilter !== "all") params.set("assignee", assigneeFilter);
    else params.delete("assignee");
    if (priorityFilter.length > 0) params.set("priority", priorityFilter.join(","));
    else params.delete("priority");
    if (dependencyState !== "all") params.set("dependencyState", dependencyState);
    else params.delete("dependencyState");
    if (cardFilter) params.set("filter", cardFilter);
    else params.delete("filter");
    if (dateRange.start) params.set("startDate", (dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start)).toISOString().split("T")[0]);
    else params.delete("startDate");
    if (dateRange.end) params.set("endDate", (dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end)).toISOString().split("T")[0]);
    else params.delete("endDate");
    if (dateFilterType !== "dueDate") params.set("dateFilterType", dateFilterType);
    else params.delete("dateFilterType");
    if (viewMode !== "card") params.set("view", viewMode);
    else params.delete("view");
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    setSearchParams(params, { replace: true });
  }, [searchQuery, projectFilter, statusFilter, assigneeFilter, priorityFilter, dependencyState, dateRange, dateFilterType, viewMode, page]);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/users").then((r) => r.data?.users ?? r.data ?? []).catch(() => []),
      api.get("/api/v1/projects?limit=100").then((r) => r.data?.projects ?? r.data ?? []).catch(() => []),
      api.get("/api/v1/task-statuses").then((r) => r.data ?? []).catch(() => []),
    ]).then(([u, p, s]) => {
      setUsers(Array.isArray(u) ? u : []);
      setProjects(Array.isArray(p) ? p : []);
      setTaskStatuses(Array.isArray(s) ? s : []);
    });
  }, []);

  useEffect(() => {
    api
      .get("/api/v1/dashboard/summary")
      .then((res) => {
        const data = res.data?.data ?? res.data ?? {};
        setSummaryStats({
          totalTasks: data.totalTasks ?? 0,
          myTasks: data.myTasks ?? 0,
          todaysTasks: data.todaysTasks ?? 0,
          blockedTasks: data.blockedTasks ?? 0,
          overdueTasks: data.overdueTasks ?? 0,
          completedToday: data.completedToday ?? 0,
        });
      })
      .catch(() => setSummaryStats(null));
  }, []);

  const handleClearFilters = () => {
    setSearchQuery("");
    setProjectFilter([]);
    setStatusFilter([]);
    setAssigneeFilter("all");
    setPriorityFilter([]);
    setDependencyState("all");
    setDateRange({});
    setDateFilterType("dueDate");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const todayStr = new Date().toISOString().split("T")[0];
  const tasksBase = "/dashboard/tasks";
  const isCardActive = (key) =>
    (key === "all" && !cardFilter && assigneeFilter === "all" && dependencyState === "all") ||
    (key === "mine" && assigneeFilter === "me") ||
    (key === "blocked" && dependencyState === "blocked") ||
    (key === "overdue" && cardFilter === "overdue") ||
    (key === "completed_today" && cardFilter === "completed_today");
  const isBlocked = (task) =>
    task.status === "waiting" || (task._count?.dependencies > 0);
  const isOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("tasks.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("tasks.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <TasksViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Summary stat cards – click to filter task list */}
      {summaryStats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title={t("tasks.totalTasks")}
            value={summaryStats.totalTasks}
            icon="ListTodo"
            href={tasksBase}
            variant="info"
            isActive={isCardActive("all")}
          />
          <StatCard
            title={t("tasks.myTasks")}
            value={summaryStats.myTasks}
            icon="User"
            href={`${tasksBase}?assignee=me`}
            variant="default"
            isActive={isCardActive("mine")}
          />
          <StatCard
            title={t("tasks.todaysFocus")}
            value={summaryStats.todaysTasks}
            icon="Calendar"
            href="/dashboard/focus"
            variant="info"
          />
          <StatCard
            title={t("tasks.blocked")}
            value={summaryStats.blockedTasks}
            icon="AlertTriangle"
            href={`${tasksBase}?dependencyState=blocked`}
            variant="danger"
            isActive={isCardActive("blocked")}
          />
          <StatCard
            title={t("tasks.overdue")}
            value={summaryStats.overdueTasks}
            icon="Clock"
            href={`${tasksBase}?filter=overdue`}
            variant="danger"
            isActive={isCardActive("overdue")}
          />
          <StatCard
            title={t("tasks.completedToday")}
            value={summaryStats.completedToday}
            icon="CheckCircle2"
            href={`${tasksBase}?filter=completed_today&status=completed&startDate=${todayStr}&endDate=${todayStr}&dateFilterType=createdDate`}
            variant="success"
            isActive={isCardActive("completed_today")}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("tasks.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              setSearchQuery("");
              setPage(1);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.project")}</Label>
          <select
            className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={projectFilter[0] || ""}
            onChange={(e) => {
              const v = e.target.value;
              setProjectFilter(v ? [v] : []);
              setPage(1);
            }}
          >
            <option value="">{t("tasks.allProjects")}</option>
            {projects.map((proj) => (
              <option key={proj.id} value={String(proj.id)}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.status")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={statusFilter[0] || ""}
            onChange={(e) => {
              const v = e.target.value;
              setStatusFilter(v ? [v] : []);
              setPage(1);
            }}
          >
            <option value="">{t("tasks.allStatuses")}</option>
            {taskStatuses.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
            {taskStatuses.length === 0 && (
              <>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="waiting">Waiting</option>
              </>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.assignee")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={assigneeFilter}
            onChange={(e) => {
              setAssigneeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("tasks.allUsers")}</option>
            <option value="me">{t("tasks.myTasks")}</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.priority")}</Label>
          <select
            className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={priorityFilter[0] || ""}
            onChange={(e) => {
              setPriorityFilter(e.target.value ? [e.target.value] : []);
              setPage(1);
            }}
          >
            <option value="">{t("tasks.all")}</option>
            <option value="low">{t("tasks.low")}</option>
            <option value="normal">{t("tasks.normal")}</option>
            <option value="high">{t("tasks.high")}</option>
            <option value="urgent">{t("tasks.urgent")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.dependency")}</Label>
          <select
            className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={dependencyState}
            onChange={(e) => {
              setDependencyState(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("tasks.allTasks")}</option>
            <option value="blocked">{t("tasks.blocked")}</option>
            <option value="free">{t("tasks.free")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.dateType")}</Label>
          <select
            className="flex h-9 w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={dateFilterType}
            onChange={(e) => {
              setDateFilterType(e.target.value);
              setPage(1);
            }}
          >
            <option value="dueDate">{t("tasks.dueDate")}</option>
            <option value="createdDate">{t("tasks.createdDate")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.from")}</Label>
          <Input
            type="date"
            className="h-9 w-[140px]"
            value={dateRange.start ? (dateRange.start instanceof Date ? dateRange.start.toISOString().split("T")[0] : String(dateRange.start).slice(0, 10)) : ""}
            onChange={(e) => {
              setDateRange((r) => ({ ...r, start: e.target.value ? new Date(e.target.value) : undefined }));
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("tasks.to")}</Label>
          <Input
            type="date"
            className="h-9 w-[140px]"
            value={dateRange.end ? (dateRange.end instanceof Date ? dateRange.end.toISOString().split("T")[0] : String(dateRange.end).slice(0, 10)) : ""}
            onChange={(e) => {
              setDateRange((r) => ({ ...r, end: e.target.value ? new Date(e.target.value) : undefined }));
              setPage(1);
            }}
          />
        </div>
        <Button variant="outline" size="sm" className="self-end" onClick={handleClearFilters}>
          {t("tasks.clearFilters")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        className={
          loading && tasks.length > 0
            ? "opacity-50 pointer-events-none transition-opacity"
            : "opacity-100 transition-opacity"
        }
      >
        {tasks.length === 0 && !loading && (
          <EmptyState
            icon={ListTodo}
            title={t("tasks.noTasks")}
            description={t("tasks.adjustFilters")}
          />
        )}

        {tasks.length > 0 && viewMode === "table" && (
          <TasksTableView
            tasks={tasks}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
          />
        )}

        {tasks.length > 0 && viewMode === "card" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => {
                const blocked = isBlocked(task);
                const overdue = isOverdue(task);
                const projectId = task.projectId ?? task.project?.id;
                const taskLink = projectId
                  ? `/dashboard/projects/${projectId}/tasks/${task.id}`
                  : `/dashboard/tasks/${task.id}`;

                const assigneeLabel =
                  task.assignees?.length > 0
                    ? (task.assignees[0].username || task.assignees[0].email || "??").substring(0, 2).toUpperCase()
                    : null;

                return (
                  <Link key={task.id} to={taskLink}>
                    <Card
                      className={cn(
                        "transition-shadow hover:shadow-md h-full cursor-pointer relative",
                        blocked && "border-orange-500/50",
                        overdue && "border-red-500/50"
                      )}
                    >
                      {overdue && (
                        <div
                          className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          title={t("tasks.overdue")}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pr-10">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold leading-none line-clamp-2">
                            {task.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {task.project?.name || "Unknown Project"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getTaskStatusColor(task))}
                          >
                            {getTaskStatusDisplay(task).replace(/_/g, " ")}
                          </Badge>
                          {blocked && (
                            <Lock className="h-4 w-4 text-chart-4 shrink-0" title={t("tasks.blocked")} />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              PRIORITY_COLORS[task.priority] || "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {task.priority || "normal"}
                          </Badge>
                          {task.assignees?.length > 0 ? (
                            task.assignees.slice(0, 2).map((a) => (
                              <Badge
                                key={a.id}
                                variant="outline"
                                className={cn("text-xs", getAssigneeColor(a))}
                              >
                                {a.username || a.email || "?"}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">{t("tasks.unassigned")}</span>
                          )}
                          {overdue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {t("tasks.overdue")}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {task.creator && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              <span>{t("tasks.createdBy", "Created by")} {task.creator.username ?? task.creator.email ?? "—"}</span>
                            </div>
                          )}
                          {task.createdAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{t("tasks.created", "Created")} {format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                            </div>
                          )}
                          {task.dueDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className={cn(overdue && "text-destructive font-medium")}>
                                {t("tasks.due")}: {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0 opacity-50" />
                              <span>{t("tasks.noDueDate", "No due date")}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t("common.next")}
                </Button>
              </div>
            )}
          </>
        )}

        {loading && tasks.length === 0 && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {loading && tasks.length > 0 && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 shadow-lg z-50">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("tasks.updating")}</span>
        </div>
      )}
    </div>
  );
}
