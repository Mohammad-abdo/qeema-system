import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
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
const PROJECT_STATUS_COLORS = {
  planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function Avatar({ user, className }) {
  const initials = (user?.username || "??").substring(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium",
        className
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
  const tab = searchParams.get("tab") || "overview";

  const [project, setProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/v1/projects/${id}`).then((r) => r.data),
      api.get(`/api/v1/stats/projects/${id}`).then((r) => r.data?.data ?? r.data).catch(() => null),
      api.get("/api/v1/users").then((r) => r.data?.users ?? r.data ?? []).catch(() => []),
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
    ["in_progress", "review"].includes(t.status)
  ).length;
  const blockedCount = tasks.filter((t) => {
    if (t.status === "waiting") return true;
    return (t.dependencies || []).some(
      (d) => d.dependsOnTask && d.dependsOnTask.status !== "completed"
    );
  }).length;
  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"
  ).length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const stats = useMemo(
    () => ({
      total: projectStats?.totalTasks ?? totalTasks,
      totalComp: projectStats?.completedTasks ?? completedCount,
      totalInProgress: projectStats?.inProgressTasks ?? inProgressCount,
      blockedTasks: projectStats?.blockedTasks ?? blockedCount,
      overdueTasks: projectStats?.overdueTasks ?? overdueCount,
      urgentTasks: projectStats?.urgentTasks ?? urgentCount,
      percentage,
    }),
    [
      projectStats,
      totalTasks,
      completedCount,
      inProgressCount,
      blockedCount,
      overdueCount,
      urgentCount,
      percentage,
    ]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery && !(task.title || "").toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all") {
        const hasUser = (task.assignees || []).some(
          (a) => String(a.id) === assigneeFilter
        );
        if (!hasUser) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const handleTabChange = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
          {t("projects.backToProjects")}
        </Link>
        <p className="text-destructive">{t("projects.projectNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("projects.backToProjects")}
        </Link>
      </div>

      {/* Header - match Next.js ProjectHeader */}
      <div className="border-b pb-4 pt-2 space-y-4 bg-background/95">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge
                className={cn(
                  PROJECT_STATUS_COLORS[project.status] || "bg-gray-100 text-gray-800"
                )}
              >
                {(project.status || "").replace("_", " ")}
              </Badge>
              {project.priority === "urgent" && (
                <Badge variant="destructive" className="animate-pulse">
                  URGENT
                </Badge>
              )}
              {project.priority === "high" && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  High Priority
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="text-muted-foreground max-w-3xl">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/dashboard/projects/${id}/settings`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 me-2" />
                Edit
              </Button>
            </Link>
            <Link to={`/dashboard/projects/${id}/notifications`}>
              <Button variant="outline" size="sm">
                {t("projects.notifications")}
              </Button>
            </Link>
            <Link to={`/dashboard/projects/${id}/tasks/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 me-2" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
          {project.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(project.startDate), "MMM d, yyyy")}
                {project.endDate &&
                  ` - ${format(new Date(project.endDate), "MMM d, yyyy")}`}
              </span>
            </div>
          )}
          {project.projectManager && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>PM: {project.projectManager.username}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>{stats.total} tasks</span>
            <span>•</span>
            <span>{stats.totalComp} completed</span>
          </div>
        </div>
      </div>

      {/* Stats cards - match Next SummaryStatsCards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => handleTabChange("tasks")}
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
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => handleTabChange("tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalComp}</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => handleTabChange("tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalInProgress}</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => handleTabChange("tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blockedTasks}</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => handleTabChange("tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.overdueTasks}</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => handleTabChange("tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgentTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Overview & Tasks */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
              <CardDescription>Overview of project status and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.totalComp}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalInProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.blockedTasks}</div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
                </div>
              </div>
              {stats.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{stats.percentage}%</span>
                  </div>
                  <Progress value={stats.percentage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
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
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    onChange={(e) => setPriorityFilter(e.target.value)}
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
                    onChange={(e) => setAssigneeFilter(e.target.value)}
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
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tasks found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => {
                        const isBlocked =
                          task.status === "waiting" ||
                          (task.dependencies || []).some(
                            (d) => d.dependsOnTask && d.dependsOnTask.status !== "completed"
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
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  STATUS_COLORS[task.status] || "bg-gray-500/10 text-gray-600"
                                )}
                              >
                                {(task.status || "").replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  PRIORITY_COLORS[task.priority] || "bg-gray-500/10"
                                )}
                              >
                                {task.priority || "normal"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <span className="text-sm">
                                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isBlocked ? (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
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
      </Tabs>
    </div>
  );
}
