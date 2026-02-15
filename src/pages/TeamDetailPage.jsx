import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Users,
  FolderKanban,
  UserCircle,
  Trash2,
  Plus,
  X,
  ListTodo,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError, confirm as notifyConfirm } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Sheet, SheetTrigger, SheetContent, useSheet } from "@/components/ui/Sheet";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

function AddMemberFormInner({ teamId, availableUsers, onAdded }) {
  const { t } = useTranslation();
  const { setOpen } = useSheet();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await api.post(`/api/v1/teams/${teamId}/members`, { userId: parseInt(selectedUserId, 10), role: "member" });
      notifySuccess(t("toast.saved"));
      setOpen(false);
      setSelectedUserId("");
      onAdded?.();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("teamDetail.addMember")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t("teams.members")}</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          >
            <option value="">—</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.username || u.email}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !selectedUserId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("teamDetail.addMember")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function TeamDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [team, setTeam] = useState(null);
  const [teamTasks, setTeamTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchTeam = useCallback(() => {
    if (!id) return;
    api
      .get(`/api/v1/teams/${id}`)
      .then((res) => setTeam(res.data?.data ?? res.data))
      .catch((err) => {
        setTeam(null);
        notifyError(err?.response?.data?.error || "Failed to load team");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTeam();
  }, [fetchTeam, id]);

  useEffect(() => {
    api.get("/api/v1/users").then((r) => {
      const u = r.data?.users ?? r.data ?? [];
      setAllUsers(Array.isArray(u) ? u : []);
    }).catch(() => setAllUsers([]));
  }, []);

  useEffect(() => {
    if (!id || activeTab !== "tasks") return;
    setTasksLoading(true);
    api
      .get(`/api/v1/teams/${id}/tasks`, { params: { limit: 50 } })
      .then((res) => {
        setTeamTasks(res.data?.tasks ?? []);
      })
      .catch(() => setTeamTasks([]))
      .finally(() => setTasksLoading(false));
  }, [id, activeTab]);

  const memberIds = (team?.members ?? []).map((m) => m.userId ?? m.user?.id);
  const availableUsers = allUsers.filter((u) => !memberIds.includes(u.id));

  const handleRemoveMember = async (userId) => {
    const ok = await notifyConfirm({ title: t("teamDetail.removeMember"), text: t("teamDetail.removeMemberConfirm") });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/teams/${id}/members/${userId}`);
      notifySuccess(t("toast.saved"));
      fetchTeam();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to remove member");
    }
  };

  const handleDeleteTeam = async () => {
    const ok = await notifyConfirm({ title: t("teamDetail.deleteTeam"), text: t("teams.deleteConfirm") });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/teams/${id}`);
      notifySuccess(t("teams.deleteSuccess"));
      window.location.href = "/dashboard/teams";
    } catch (err) {
      notifyError(err?.response?.data?.error || t("toast.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !team) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <Link to="/dashboard/teams" className="text-sm text-muted-foreground hover:text-foreground">
          {t("teamDetail.backToTeams")}
        </Link>
        <p className="text-destructive">{t("teamDetail.teamNotFound")}</p>
      </div>
    );
  }

  const members = team.members ?? [];
  const projectTeams = team.projectTeams ?? [];
  const lead = team.teamLead;
  const memberCount = team._count?.members ?? members.length;
  const projectCount = team._count?.projectTeams ?? projectTeams.length;

  const taskCompleted = teamTasks.filter((t) => t.taskStatus?.isFinal || t.status === "completed").length;
  const taskTotal = teamTasks.length;
  const progressPct = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/teams"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{team.name}</h2>
            <p className="text-muted-foreground">{team.description || t("teams.subtitle")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteTeam}
          disabled={deleting}
          className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Trash2 className="h-4 w-4 me-1" />
          {t("teamDetail.deleteTeam")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="overview">{t("teamDetail.overview")}</TabsTrigger>
          <TabsTrigger value="members">{t("teams.members")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("teamDetail.teamTasks")}</TabsTrigger>
          <TabsTrigger value="progress">{t("teamDetail.progress")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("teamDetail.notifications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("teamDetail.teamInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("teams.name")}: </span>
                  <span className="font-medium">{team.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("teams.teamDescription")}: </span>
                  <span>{team.description || "—"}</span>
                </div>
                <div>
                  <Badge variant={team.status === "active" ? "default" : "secondary"}>
                    {team.status === "active" ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" />{t("teams.active")}</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" />{t("teams.inactive")}</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  {t("teams.lead")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead ? (
                  <p className="font-medium">{lead.username ?? lead.email ?? "—"}</p>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("teamDetail.statistics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{memberCount}</p>
                    <p className="text-xs text-muted-foreground">{t("teams.members")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{projectCount}</p>
                    <p className="text-xs text-muted-foreground">{t("teams.projects")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("teams.projects")}</CardTitle>
            </CardHeader>
            <CardContent>
              {projectTeams.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("teamDetail.noProjectsAssigned")}</p>
              ) : (
                <ul className="space-y-2">
                  {projectTeams.map((pt) => (
                    <li key={pt.project?.id ?? pt.projectId}>
                      <Link
                        to={`/dashboard/projects/${pt.project?.id ?? pt.projectId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {pt.project?.name ?? "—"}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("teams.members")}</CardTitle>
              {availableUsers.length > 0 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("teamDetail.addMember")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full max-w-md">
                    <AddMemberFormInner
                      teamId={Number(id)}
                      availableUsers={availableUsers}
                      onAdded={fetchTeam}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{t("teamDetail.noMembers")}</p>
                  {availableUsers.length > 0 && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("teamDetail.addMember")}
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full max-w-md">
                        <AddMemberFormInner teamId={Number(id)} availableUsers={availableUsers} onAdded={fetchTeam} />
                      </SheetContent>
                    </Sheet>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => {
                    const u = m.user ?? m;
                    return (
                      <div
                        key={m.id ?? u.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{u.username ?? u.email ?? "—"}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{m.role || "member"}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {t("teamDetail.joined")} {m.joinedAt ? format(new Date(m.joinedAt), "PP") : ""}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(m.userId ?? u.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("teamDetail.teamTasks")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("teamDetail.teamTasksDescription")}</p>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : teamTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6">{t("teamDetail.noTasks")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("tasks.title")}</TableHead>
                      <TableHead>{t("taskDetail.project")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("taskDetail.assignees")}</TableHead>
                      <TableHead>{t("taskDetail.dueDate")}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamTasks.map((task) => (
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
                          {(task.assignees ?? []).map((a) => a.username).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.dueDate ? format(new Date(task.dueDate), "PP") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={task.projectId ? `/dashboard/projects/${task.projectId}/tasks/${task.id}` : `/dashboard/tasks/${task.id}`}>
                              {t("teamDetail.viewTask")}
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

        <TabsContent value="progress" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("teamDetail.progress")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("teamDetail.teamTasksDescription")}</p>
            </CardHeader>
            <CardContent>
              {tasksLoading && taskTotal === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("teamDetail.tasksByStatus")}</span>
                    <span className="font-bold">{taskCompleted} / {taskTotal}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {taskTotal === 0
                      ? t("teamDetail.noTasks")
                      : `${progressPct}% ${t("taskDetail.completed")}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("teamDetail.notifications")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("teamDetail.notificationsDescription")}
              </p>
            </CardHeader>
            <CardContent>
              {projectTeams.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("teamDetail.noProjectsAssigned")}</p>
              ) : (
                <ul className="space-y-2">
                  {projectTeams.map((pt) => (
                    <li key={pt.project?.id ?? pt.projectId}>
                      <Link
                        to={`/dashboard/projects/${pt.project?.id ?? pt.projectId}/notifications`}
                        className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                      >
                        <Bell className="h-4 w-4" />
                        {pt.project?.name ?? "—"} — {t("notifications.title")}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
