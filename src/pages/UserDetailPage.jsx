import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  UserCircle,
  FolderKanban,
  Users,
  ListTodo,
  CheckCircle2,
  FileDown,
  Send,
  Bell,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

function Avatar({ name, className }) {
  const initials = (name || "??").substring(0, 2).toUpperCase();
  return (
    <div
      className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium ${className || ""}`}
    >
      {initials}
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/v1/users/${id}`)
      .then((res) => setUser(res.data?.data ?? res.data))
      .catch((err) => {
        setUser(null);
        notifyError(err?.response?.data?.error || "Failed to load user");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/v1/users/${id}/projects`).then((r) => setProjects(r.data?.projects ?? [])).catch(() => setProjects([]));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/v1/users/${id}/teams`).then((r) => setTeams(r.data?.teams ?? [])).catch(() => setTeams([]));
  }, [id]);

  useEffect(() => {
    if (!id || (activeTab !== "tasks" && activeTab !== "progress")) return;
    api.get(`/api/v1/users/${id}/tasks`, { params: { limit: 100 } }).then((r) => setTasks(r.data?.tasks ?? [])).catch(() => setTasks([]));
  }, [id, activeTab]);

  const taskCompleted = useMemo(() => tasks.filter((t) => t.taskStatus?.isFinal || t.status === "completed").length, [tasks]);
  const taskTotal = tasks.length;
  const progressPct = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  if (loading && !user) {
    return <ContentSkeleton className="space-y-6" />;
  }
  if (!user) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/users" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t("users.backToUsers")}
        </Link>
        <p className="text-destructive">{t("userDetail.userNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/dashboard/users"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Avatar name={user.username} />
        <div className="flex-1 min-w-0">
          <h1 className="page-title">{user.username}</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="capitalize">
              {(user.role || "").replace("_", " ")}
            </Badge>
            <Badge variant={user.isActive ? "default" : "destructive"}>
              {user.isActive ? t("users.active") : t("users.inactive")}
            </Badge>
            {user.team && (
              <Link to={`/dashboard/teams/${user.team.id}`}>
                <Badge variant="secondary">{user.team.name}</Badge>
              </Link>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="overview">{t("userDetail.overview")}</TabsTrigger>
          <TabsTrigger value="projects">{t("userDetail.projects")}</TabsTrigger>
          <TabsTrigger value="teams">{t("userDetail.teams")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("userDetail.tasks")}</TabsTrigger>
          <TabsTrigger value="progress">{t("userDetail.progress")}</TabsTrigger>
          <TabsTrigger value="reports">{t("userDetail.reports")}</TabsTrigger>
          <TabsTrigger value="send">{t("userDetail.send")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("users.profileInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("users.username")}</p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("users.email")}</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("users.role")}</p>
                <p className="font-medium capitalize">{(user.role || "").replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.status")}</p>
                <p className="font-medium">{user.isActive ? t("users.active") : t("users.inactive")}</p>
              </div>
              {user.team && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("users.team")}</p>
                  <Link to={`/dashboard/teams/${user.team.id}`} className="font-medium text-primary hover:underline">
                    {user.team.name}
                  </Link>
                </div>
              )}
              {user.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(user.createdAt), "PP")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                {t("userDetail.projects")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("userDetail.noProjects")}</p>
              ) : (
                <ul className="space-y-2">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link to={`/dashboard/projects/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.name}
                      </Link>
                      {p.status && <span className="text-muted-foreground text-sm ml-2">({p.status})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("userDetail.teams")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("userDetail.noTeams")}</p>
              ) : (
                <ul className="space-y-2">
                  {teams.map((team) => (
                    <li key={team.id}>
                      <Link to={`/dashboard/teams/${team.id}`} className="font-medium text-primary hover:underline">
                        {team.name}
                      </Link>
                      {team.role && team.role !== "legacy" && (
                        <span className="text-muted-foreground text-sm ml-2">— {team.role}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("userDetail.tasks")}</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("userDetail.noTasks")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>{t("taskDetail.project")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("taskDetail.dueDate")}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <Link
                            to={task.projectId ? `/dashboard/projects/${task.projectId}/tasks/${task.id}` : `/dashboard/tasks/${task.id}`}
                            className="text-primary hover:underline"
                          >
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {task.project && (
                            <Link to={`/dashboard/projects/${task.project.id}`} className="text-primary hover:underline text-sm">
                              {task.project.name}
                            </Link>
                          )}
                          {!task.project && "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {task.taskStatus?.name ?? task.status ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.dueDate ? format(new Date(task.dueDate), "PP") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={task.projectId ? `/dashboard/projects/${task.projectId}/tasks/${task.id}` : `/dashboard/tasks/${task.id}`}>
                              {t("userDetail.viewTask")}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("userDetail.progress")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("userDetail.tasksCompleted")}</span>
                  <span className="font-bold">{taskCompleted} / {taskTotal}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {taskTotal === 0 ? t("userDetail.noTasks") : `${progressPct}% ${t("taskDetail.completed")}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                {t("userDetail.reports")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Reports about this user's activity, tasks, and progress.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link to={`/dashboard/reports?user=${id}`}>
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("userDetail.downloadReport")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-5 w-5" />
                {t("userDetail.send")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Assign tasks, send messages, alerts, and manage notifications for this user.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/dashboard/today-tasks-assignment">
                    <ListTodo className="mr-2 h-4 w-4" />
                    {t("userDetail.assignTask")}
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" disabled title="Coming soon">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t("userDetail.sendMessage")}
                </Button>
                <Button variant="outline" className="justify-start" disabled title="Coming soon">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {t("userDetail.sendAlert")}
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to={`/dashboard/users/${id}`}>
                    <Bell className="mr-2 h-4 w-4" />
                    {t("userDetail.notifications")}
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("userDetail.taskAssignmentHint")}</p>
              <p className="text-xs text-muted-foreground">{t("userDetail.notificationsHint")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
