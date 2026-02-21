import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ListTodo,
  CheckCircle2,
  Loader2,
  Ban,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Users,
  Search,
  Plus,
  Edit,
  Clock,
  TrendingUp,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Progress } from "@/components/ui/Progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { ProjectKanbanBoard } from "@/components/projects/ProjectKanbanBoard";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";
import { cn } from "@/lib/utils";
import {
  PRIORITY_COLORS,
  PROJECT_STATUS_COLORS,
  getTaskStatusDisplay,
  getTaskStatusColor,
} from "@/lib/statusColors";

function Avatar({ user, className }) {
  const initials = (user?.username || "??").substring(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium",
        className,
      )}
      title={user?.username}
    >
      {initials}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ["overview", "tasks", "board", "team", "today-tasks", "files", "activity", "reports"];
  const tabParam = searchParams.get("tab");
  const tab = validTabs.includes(tabParam) ? tabParam : "overview";

  const [project, setProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [blockedFilter, setBlockedFilter] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);

  const fetchProject = useCallback(() => {
    if (!id) return;
    api.get(`/api/v1/projects/${id}`).then((r) => setProject(r.data)).catch(() => setProject(null));
    api.get(`/api/v1/stats/projects/${id}`).then((r) => setProjectStats(r.data?.data ?? r.data)).catch(() => setProjectStats(null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/v1/projects/${id}`).then((r) => r.data),
      api
        .get(`/api/v1/stats/projects/${id}`)
        .then((r) => r.data?.data ?? r.data)
        .catch(() => null),
      api
        .get("/api/v1/users")
        .then((r) => r.data?.users ?? r.data ?? [])
        .catch(() => []),
    ])
      .then(([proj, stats, userList]) => {
        setProject(proj);
        setProjectStats(stats || null);
        setUsers(Array.isArray(userList) ? userList : []);
      })
      .catch((err) => {
        setProject(null);
        notifyError(err?.response?.data?.error || "Failed to load project");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const tasks = project?.tasks ?? [];
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const inProgressCount = tasks.filter((t) =>
    ["in_progress", "review"].includes(t.status),
  ).length;
  const blockedCount = tasks.filter((t) => {
    if (t.status === "waiting") return true;
    return (t.dependencies || []).some(
      (d) => d.dependsOnTask && d.dependsOnTask.status !== "completed",
    );
  }).length;
  const overdueCount = tasks.filter(
    (t) =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed",
  ).length;
  const urgentCount = tasks.filter(
    (t) => t.priority === "urgent" || t.priority === "high",
  ).length;
  const percentage =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  const stats = useMemo(() => {
    const total = projectStats?.totalTasks ?? totalTasks;
    const totalComp = projectStats?.completedTasks ?? completedCount;
    const pct = total > 0 ? Math.round((totalComp / total) * 100) : 0;

    return {
      total,
      totalComp,
      totalInProgress: projectStats?.inProgressTasks ?? inProgressCount,
      blockedTasks: projectStats?.blockedTasks ?? blockedCount,
      overdueTasks: projectStats?.overdueTasks ?? overdueCount,
      urgentTasks: projectStats?.urgentTasks ?? urgentCount,
      pendingCount: projectStats?.pendingTasks ?? pendingCount,
      percentage: pct,
    };
  }, [
    projectStats,
    totalTasks,
    completedCount,
    inProgressCount,
    blockedCount,
    overdueCount,
    urgentCount,
    pendingCount,
  ]);

  const blockedTasksList = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "waiting") return true;
      return (t.dependencies || []).some(
        (d) => d.dependsOnTask && d.dependsOnTask.status !== "completed"
      );
    }).map((task) => {
      const firstUnresolved = (task.dependencies || []).find(
        (d) => d.dependsOnTask && d.dependsOnTask.status !== "completed"
      );
      return {
        ...task,
        waitingForTitle: firstUnresolved?.dependsOnTask?.title || null,
      };
    });
  }, [tasks]);

  useEffect(() => {
    if (!id) return;
    api.get("/api/v1/activity-logs", { params: { projectId: id, limit: 50 } })
      .then((r) => setActivityLogs(r.data?.logs ?? []))
      .catch(() => setActivityLogs([]));
  }, [id]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return tasks.filter((task) => {
      if (
        searchQuery &&
        !(task.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;
      if (assigneeFilter !== "all") {
        const hasUser = (task.assignees || []).some(
          (a) => String(a.id) === assigneeFilter,
        );
        if (!hasUser) return false;
      }
      if (overdueFilter) {
        if (!task.dueDate || task.status === "completed") return false;
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due >= now) return false;
      }
      if (blockedFilter) {
        const isBlocked =
          task.status === "waiting" ||
          (task.dependencies || []).some(
            (d) => d.dependsOnTask && d.dependsOnTask.status !== "completed",
          );
        if (!isBlocked) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, overdueFilter, blockedFilter]);

  const handleTabChange = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  const handleStatCardClick = (filterType) => {
    handleTabChange("tasks");
    setOverdueFilter(false);
    setBlockedFilter(false);
    switch (filterType) {
      case "all":
        setStatusFilter("all");
        setPriorityFilter("all");
        break;
      case "completed":
        setStatusFilter("completed");
        setPriorityFilter("all");
        break;
      case "in_progress":
        setStatusFilter("in_progress");
        setPriorityFilter("all");
        break;
      case "blocked":
        setStatusFilter("all");
        setPriorityFilter("all");
        setBlockedFilter(true);
        break;
      case "overdue":
        setStatusFilter("all");
        setPriorityFilter("all");
        setOverdueFilter(true);
        break;
      case "urgent":
        setStatusFilter("all");
        setPriorityFilter("urgent");
        break;
      default:
        setStatusFilter("all");
        setPriorityFilter("all");
    }
  };

  if (loading) {
    return <ContentSkeleton className="space-y-6" />;
  }
  if (!project) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("projects.backToProjects")}
        </Link>
        <p className="text-destructive">{t("projects.projectNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {project && (
        <EditProjectModal
          project={project}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onProjectUpdated={fetchProject}
        />
      )}
      {/* Back link */}
      <div>
        <Link
          to="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("projects.backToProjects")}
        </Link>
      </div>

      {/* Brief details card - first section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="page-title">
                  {project.name}
                </h1>
                <Badge
                  className={cn(
                    PROJECT_STATUS_COLORS[project.status] ||
                      "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {project.projectStatus?.name ??
                    (project.status || "").replace("_", " ")}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground max-w-3xl">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/dashboard/projects/${id}/notifications`}>
                <Button variant="ghost" size="icon" title={t("projects.notifications")}>
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 me-2" />
                {t("common.edit")}
              </Button>
              <Link to={`/dashboard/projects/${id}/tasks/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 me-2" />
                  {t("projects.addTask")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("projects.progress")}</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
            {project.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {format(new Date(project.startDate), "MMM d, yyyy")}
                  {project.endDate &&
                    ` - ${format(new Date(project.endDate), "MMM d, yyyy")}`}
                </span>
              </div>
            )}
            {project.projectManager && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <span>PM: {project.projectManager.username}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>{stats.total} {t("projects.tasksCount")}</span>
              <span>•</span>
              <span>{stats.totalComp} {t("projects.completed")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards - match Next SummaryStatsCards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => handleStatCardClick("all")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStatCardClick("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => handleStatCardClick("completed")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStatCardClick("completed")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {stats.totalComp}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => handleStatCardClick("in_progress")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStatCardClick("in_progress")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {stats.totalInProgress}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => handleStatCardClick("blocked")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStatCardClick("blocked")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.blockedTasks}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => handleStatCardClick("overdue")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStatCardClick("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              {stats.overdueTasks}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => handleStatCardClick("urgent")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStatCardClick("urgent")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.urgentTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Overview, Tasks, Board, Team, etc. */}
      <Tabs value={tab} onValueChange={handleTabChange} variant="pill" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="overview">{t("projects.tabOverview")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("projects.tabTasks")}</TabsTrigger>
          <TabsTrigger value="board">{t("projects.tabBoard")}</TabsTrigger>
          <TabsTrigger value="team">{t("projects.tabTeam")}</TabsTrigger>
          <TabsTrigger value="today-tasks">{t("projects.tabTodayTasks")}</TabsTrigger>
          <TabsTrigger value="files">{t("projects.tabFiles")}</TabsTrigger>
          <TabsTrigger value="activity">{t("projects.tabActivity")}</TabsTrigger>
          <TabsTrigger value="reports">{t("projects.tabReports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("projectSummary.title")}</CardTitle>
              <CardDescription>
                {t("projectSummary.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-bold tracking-tight">{stats.total}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("projectSummary.totalTasks")}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-medium text-chart-2">
                  {stats.totalComp} {t("projectSummary.completed")}
                </span>
                <span className="font-medium text-chart-3">
                  {stats.totalInProgress} {t("projectSummary.inProgress")}
                </span>
                <span className="font-medium text-chart-4">
                  {stats.blockedTasks} {t("projectSummary.blocked")}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("projectSummary.overallProgress")}
                  </span>
                  <span className="font-medium">{stats.percentage}%</span>
                </div>
                <Progress value={stats.percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{t("projectSummary.taskStatistics")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />
                      {t("projectSummary.completed")}
                    </span>
                    <span className="font-medium">{stats.totalComp}</span>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 text-chart-3 shrink-0" />
                      {t("projectSummary.inProgress")}
                    </span>
                    <span className="font-medium">{stats.totalInProgress}</span>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0" />
                      {t("projectSummary.blocked")}
                    </span>
                    <span className="font-medium">{stats.blockedTasks}</span>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      {t("projectSummary.pending")}
                    </span>
                    <span className="font-medium">{stats.pendingCount}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{t("projectSummary.upcomingDeadlines")}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const withDue = tasks
                    .filter((t) => t.dueDate && t.status !== "completed")
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 5);
                  if (withDue.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">{t("projectSummary.noUpcomingDeadlines")}</p>
                    );
                  }
                  return (
                    <ul className="space-y-2">
                      {withDue.map((task) => (
                        <li key={task.id}>
                          <Link
                            to={`/dashboard/projects/${id}/tasks/${task.id}`}
                            className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <span className="truncate flex-1 min-w-0">{task.title}</span>
                            <span className="text-muted-foreground shrink-0">{format(new Date(task.dueDate), "MMM d")}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{t("projectSummary.teamMembers")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const seen = new Set();
                  const members = [];
                  if (project.projectManager) {
                    members.push(project.projectManager);
                    seen.add(project.projectManager.id);
                  }
                  (tasks || []).forEach((task) => {
                    (task.assignees || []).forEach((a) => {
                      if (a && !seen.has(a.id)) {
                        seen.add(a.id);
                        members.push(a);
                      }
                    });
                  });
                  (project.projectTeams || []).forEach((pt) => {
                    (pt.team?.members || []).forEach((m) => {
                      const u = m.user;
                      if (u && !seen.has(u.id)) {
                        seen.add(u.id);
                        members.push(u);
                      }
                    });
                  });
                  if (members.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">{t("projectSummary.noTeamMembers")}</p>
                    );
                  }
                  return (
                    <ul className="space-y-2">
                      {members.map((user) => (
                        <li key={user.id}>
                          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2 text-sm">
                            <Avatar user={user} />
                            <span className="font-medium truncate">{user.username || user.email}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0" />
                {t("projectSummary.blockedTasks")}
              </CardTitle>
              <CardDescription>
                {t("projectSummary.blockedTasksSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedTasksList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("projectSummary.noBlockedTasks")}</p>
              ) : (
                <ul className="space-y-2">
                  {blockedTasksList.map((task) => (
                    <li key={task.id}>
                      <Link
                        to={`/dashboard/projects/${id}/tasks/${task.id}`}
                        className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{task.title}</div>
                          {task.waitingForTitle && (
                            <div className="text-muted-foreground text-xs mt-0.5">
                              {t("projectSummary.waitingFor")}: {task.waitingForTitle}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0 bg-chart-4/15 text-chart-4 border-chart-4/20">
                          {t("projectSummary.blocked")}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t("projectSummary.recentActivity")}</CardTitle>
              <CardDescription>
                {t("projectSummary.recentActivitySubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("projectSummary.noRecentActivity")}</p>
              ) : (
                <ul className="space-y-2">
                  {activityLogs.slice(0, 10).map((log) => (
                    <li
                      key={log.id}
                      className="rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2.5 text-sm"
                    >
                      <div>{log.actionSummary}</div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {log.performedBy?.username || log.performedBy?.email || "—"} • {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    {filteredTasks.length} of {tasks.length} tasks
                  </CardDescription>
                </div>
                <Link to={`/dashboard/projects/${id}/tasks/new`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 me-2" />
                    Add Task
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <select
                    className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setOverdueFilter(false);
                      setBlockedFilter(false);
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="waiting">Waiting</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Priority</Label>
                  <select
                    className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setOverdueFilter(false);
                      setBlockedFilter(false);
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Assignee</Label>
                  <select
                    className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={assigneeFilter}
                    onChange={(e) => {
                      setAssigneeFilter(e.target.value);
                      setOverdueFilter(false);
                      setBlockedFilter(false);
                    }}
                  >
                    <option value="all">All Users</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Dependencies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No tasks found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => {
                        const isBlocked =
                          task.status === "waiting" ||
                          (task.dependencies || []).some(
                            (d) =>
                              d.dependsOnTask &&
                              d.dependsOnTask.status !== "completed",
                          );
                        return (
                          <TableRow key={task.id} className="hover:bg-muted/50">
                            <TableCell>
                              <Link
                                to={`/dashboard/projects/${id}/tasks/${task.id}`}
                                className="font-medium hover:underline"
                              >
                                {task.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex -space-x-2">
                                {(task.assignees || []).slice(0, 3).map((a) => (
                                  <Avatar key={a.id} user={a} />
                                ))}
                                {(task.assignees || []).length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                    +{(task.assignees || []).length - 3}
                                  </div>
                                )}
                                {(task.assignees || []).length === 0 && (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getTaskStatusColor(task))}
                              >
                                {getTaskStatusDisplay(task).replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  PRIORITY_COLORS[task.priority] ||
                                    "bg-muted text-muted-foreground border-border",
                                )}
                              >
                                {task.priority || "normal"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <span className="text-sm">
                                  {format(
                                    new Date(task.dueDate),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isBlocked ? (
                                <AlertCircle className="h-4 w-4 text-chart-4" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board" className="space-y-6 mt-6">
          <ProjectKanbanBoard
            projectId={id}
            tasks={tasks}
            onTaskMoved={fetchProject}
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-sm">{t("projects.tabComingSoon")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today-tasks" className="space-y-6 mt-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-sm">{t("projects.tabComingSoon")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6 mt-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-sm">{t("projects.tabComingSoon")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("projects.activityLogTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("projects.activityLogSubtitle")}
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t("projects.noActivityLog")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {activityLogs.map((log) => (
                      <li
                        key={log.id}
                        className="rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2.5 text-sm"
                      >
                        <div>{log.actionSummary}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          {log.performedBy?.username || log.performedBy?.email || "—"} •{" "}
                          {log.createdAt
                            ? format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")
                            : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-sm">{t("projects.tabComingSoon")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
