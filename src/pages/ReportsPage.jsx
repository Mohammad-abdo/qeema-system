import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, FolderKanban, CheckSquare, Calendar, Loader2, Users, AlertCircle } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { error as notifyError } from "@/utils/notify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export default function ReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    api
      .get("/api/v1/dashboard/summary")
      .then((res) => {
        const raw = res.data;
        const data = raw?.data ?? raw;
        setSummary(typeof data === "object" && data !== null ? data : {});
      })
      .catch((err) => {
        notifyError(err?.response?.data?.error || "Failed to load reports");
        setLoadError(err?.response?.data?.error || "Failed to load");
        setSummary({});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoadingProjects(true);
    api
      .get("/api/v1/projects", { params: { limit: 50 } })
      .then((res) => {
        const list = res.data?.projects ?? res.data?.data ?? res.data;
        setProjectsList(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjectsList([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    setLoadingTasks(true);
    api
      .get("/api/v1/tasks", { params: { limit: 50 } })
      .then((res) => {
        const list = res.data?.tasks ?? res.data?.data ?? res.data;
        setTasksList(Array.isArray(list) ? list : []);
      })
      .catch(() => setTasksList([]))
      .finally(() => setLoadingTasks(false));
  }, []);

  const userRole = user?.role || "developer";
  const isAdmin = userRole === "admin";
  const canViewAllReports = isAdmin;

  const data = summary || {};
  const totalTasks = data.totalTasks ?? 0;
  const myTasks = data.myTasks ?? 0;
  const projectsCount = data.totalProjects ?? 0;
  const overdueTasks = data.overdueTasks ?? 0;
  const todaysTasks = data.todaysTasks ?? 0;
  const completedToday = data.completedToday ?? 0;
  const taskStatuses = data.taskStatuses ?? [];
  const taskStatusCounts = data.taskStatusCounts ?? {};
  const hasNoData = projectsCount === 0 && totalTasks === 0;

  const cardClass = "rounded-xl border-0 bg-card/80 backdrop-blur-sm shadow-sm";

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
        </div>
      </div>

      {loadError && (
        <Card className={cardClass + " border-destructive/50 bg-destructive/5"}>
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              {t("common.retry") || "Retry"}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasNoData && !loadError && (
        <Card className={cardClass}>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-2">{t("reports.noDataYet") || "No data yet. Create projects and tasks to see reports."}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="default" size="sm" asChild>
                <Link to="/dashboard/projects">{t("reports.createProject") || "Create project"}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/tasks">{t("reports.viewTasks") || "View tasks"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 p-1 overflow-x-auto justify-start h-auto">
          <TabsTrigger value="overview">{t("reports.overview")}</TabsTrigger>
          <TabsTrigger value="projects">{t("reports.projects")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("reports.tasks")}</TabsTrigger>
          <TabsTrigger value="progress">{t("reports.progress")}</TabsTrigger>
          <TabsTrigger value="today">{t("reports.today")}</TabsTrigger>
          {canViewAllReports && (
            <>
              <TabsTrigger value="team">{t("reports.teamUsers")}</TabsTrigger>
              <TabsTrigger value="activity">{t("reports.activity")}</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("reports.totalProjects")}</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectsCount}</div>
                <p className="text-xs text-muted-foreground">{t("reports.allProjects") || "All projects"}</p>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("reports.totalTasks")}</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">{t("reports.acrossProjects") || "Across projects"}</p>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("reports.myTasks")}</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myTasks}</div>
                <p className="text-xs text-muted-foreground">{t("reports.assignedToYou") || "Assigned to you"}</p>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("reports.overdue")}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueTasks}</div>
                <p className="text-xs text-muted-foreground">{t("reports.pastDue") || "Past due date"}</p>
              </CardContent>
            </Card>
          </div>
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>{t("reports.quickLinks")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("reports.jumpToDetails") || "Jump to detailed views"}</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Link to="/dashboard/tasks" className="text-primary hover:underline font-medium">
                {t("reports.allTasks")}
              </Link>
              <Link to="/dashboard/projects" className="text-primary hover:underline font-medium">
                {t("nav.projects")} →
              </Link>
              <Link to="/dashboard/reports/progress" className="text-primary hover:underline font-medium">
                {t("reports.openProgress")}
              </Link>
              <Link to="/dashboard/focus" className="text-primary hover:underline font-medium">
                {t("reports.openFocus")}
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>{t("reports.projects")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("reports.totalProjects")}: {projectsCount}</p>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : projectsList.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">{t("reports.noProjects") || "No projects."} <Link to="/dashboard/projects" className="text-primary hover:underline">{t("reports.createProject") || "Create one"}</Link></p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("projects.nameRequired") || "Name"}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectsList.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <Link to={`/dashboard/projects/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{p.status ?? p.projectStatus?.name ?? "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/dashboard/projects/${p.id}`}>{t("common.view") || "View"}</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/projects">{t("reports.viewAllProjects") || "View all projects"}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>{t("reports.tasks")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("reports.totalTasks")}: {totalTasks}. {t("reports.myTasks")}: {myTasks}</p>
            </CardHeader>
            <CardContent>
              {taskStatuses.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                  {taskStatuses.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-lg font-bold">{taskStatusCounts[s.id] ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
              {loadingTasks ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : tasksList.length > 0 ? (
                <div className="overflow-x-auto mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("tasks.title") || "Task"}</TableHead>
                        <TableHead>{t("taskDetail.project")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasksList.slice(0, 15).map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <Link to={task.projectId ? `/dashboard/projects/${task.projectId}/tasks/${task.id}` : `/dashboard/tasks/${task.id}`} className="text-primary hover:underline truncate max-w-[200px] block">{task.title}</Link>
                          </TableCell>
                          <TableCell className="text-sm">{task.project?.name ?? "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{task.taskStatus?.name ?? task.status ?? "—"}</Badge></TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={task.projectId ? `/dashboard/projects/${task.projectId}/tasks/${task.id}` : `/dashboard/tasks/${task.id}`}>{t("common.view") || "View"}</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/tasks">{t("reports.allTasks")}</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-6">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>{t("reports.today")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("reports.completedOf", { completed: completedToday, total: todaysTasks })}
              </p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/focus">{t("reports.openFocus")}</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>{t("reports.progressReport")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("reports.progressSubtitle") || "View task and project progress over time"}</p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/reports/progress">{t("reports.openProgress")}</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {canViewAllReports && (
          <>
            <TabsContent value="team" className="space-y-6">
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle>{t("reports.teamUsers")}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t("reports.teamsUsersSubtitle") || "Teams and users overview"}</p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/teams" className="flex items-center gap-1"><Users className="h-4 w-4" /> {t("nav.teams")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/users" className="flex items-center gap-1"><Users className="h-4 w-4" /> {t("nav.users")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="space-y-6">
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle>{t("reports.activityAudit")}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t("reports.activitySubtitle") || "System activity logs"}</p>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/admin/activity-logs">{t("reports.openActivity")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
