import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, RefreshCw, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { UserTaskCard } from "@/components/today-tasks/UserTaskCard";
import { ProjectTaskCard } from "@/components/today-tasks/ProjectTaskCard";
import { AssignmentModal } from "@/components/today-tasks/AssignmentModal";

export default function TodayTasksAssignmentPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("user");
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userTaskCounts, setUserTaskCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/assignment/users");
      const data = res.data?.data ?? res.data;
      setUsers(data?.users ?? []);
      setAccessError(null);
    } catch (err) {
      if (err?.response?.status === 403) {
        setAccessError(t("todayTasks.unauthorized", "Only admins and team leads can access this page."));
        setUsers([]);
      } else {
        notifyError(err?.response?.data?.error || "Failed to load users");
        setUsers([]);
      }
    }
  }, [t]);

  const loadTeams = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/teams");
      const data = res.data?.teams ?? res.data ?? [];
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      setTeams([]);
    }
  }, []);

  const loadTaskCounts = useCallback(async () => {
    if (viewMode !== "user") return;
    setLoading(true);
    try {
      const res = await api.get("/api/v1/assignment/task-counts", {
        params: { date: selectedDate },
      });
      const data = res.data?.data ?? res.data;
      setUserTaskCounts(data?.counts ?? {});
    } catch (err) {
      setUserTaskCounts({});
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  const loadProjectsWithTasks = useCallback(async () => {
    if (viewMode !== "project") return;
    setLoading(true);
    try {
      const res = await api.get("/api/v1/assignment/projects-with-tasks", {
        params: { date: selectedDate },
      });
      const data = res.data?.data ?? res.data;
      setProjects(data?.projects ?? []);
    } catch (err) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    loadUsers();
    loadTeams();
  }, [loadUsers, loadTeams]);

  useEffect(() => {
    loadTaskCounts();
  }, [loadTaskCounts]);

  useEffect(() => {
    loadProjectsWithTasks();
  }, [loadProjectsWithTasks]);

  const handleRefresh = () => {
    if (viewMode === "user") loadTaskCounts();
    else loadProjectsWithTasks();
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.team?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam =
      selectedTeamId === "all" ||
      (selectedTeamId === "none" && !user.team) ||
      (user.team && String(user.team.id) === selectedTeamId);
    return matchesSearch && matchesTeam;
  });

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = project.name?.toLowerCase().includes(q);
    const matchTask = (project.todayTasks || []).some(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        (t.assignees || []).some(
          (a) =>
            a.username?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
        )
    );
    return matchName || matchTask;
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleEditClick = (userId) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  };

  if (accessError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tasks.taskAssignment")}</h1>
          <p className="text-muted-foreground mt-1">{t("tasks.taskAssignmentSubtitle")}</p>
        </div>
        <Card className="p-8 text-center">
          <p className="text-destructive">{accessError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tasks.taskAssignment")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("todayTasks.manageDaily", "Manage daily tasks for all users")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[160px]"
          />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("todayTasks.searchPlaceholder", "Search by username, task, or project...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "user" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("user")}
          >
            {t("todayTasks.byUser", "By User")}
          </Button>
          <Button
            variant={viewMode === "project" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("project")}
          >
            {t("todayTasks.byProject", "By Project")}
          </Button>
          <select
            className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            <option value="all">{t("todayTasks.allTeams", "All Teams")}</option>
            <option value="none">{t("todayTasks.noTeam", "No Team")}</option>
            {teams.map((team) => (
              <option key={team.id} value={String(team.id)}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "user" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <UserTaskCard
                key={user.id}
                user={user}
                todayTasksCount={userTaskCounts[user.id]?.today ?? 0}
                totalTasksCount={userTaskCounts[user.id]?.total ?? 0}
                onEditClick={() => handleEditClick(user.id)}
              />
            ))}
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("todayTasks.noUsersMatch", "No users found matching your filters")}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectTaskCard key={project.id} project={project} />
            ))}
          </div>
          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("todayTasks.noProjectsMatch", "No projects found matching your filters")}</p>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <AssignmentModal
          userId={selectedUser.id}
          userName={selectedUser.username}
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedUserId(null);
          }}
          selectedDate={selectedDate ? new Date(selectedDate) : undefined}
          onSaved={() => {
            loadTaskCounts();
            loadProjectsWithTasks();
          }}
        />
      )}
    </div>
  );
}
