import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserPlus,
  Trash2,
  Loader2,
  Search,
  X,
  LayoutGrid,
  List,
  Users as UsersIcon,
} from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError, confirm as notifyConfirm } from "@/utils/notify";
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
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Sheet, SheetTrigger, SheetContent, useSheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";

function Avatar({ name, className }) {
  const initials = (name || "??").substring(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium",
        className
      )}
    >
      {initials}
    </div>
  );
}

function UserCard({ user, onDelete }) {
  const { t } = useTranslation();
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-3">
          <Avatar name={user.username} className="h-10 w-10" />
          <Link to={`/dashboard/users/${user.id}`} className="hover:underline">
            {user.username}
          </Link>
        </CardTitle>
        <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
          {user.isActive ? t("users.active") : t("users.inactive")}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="capitalize text-xs">
            {(user.role || "").replace("_", " ")}
          </Badge>
          {user.team && (
            <Badge variant="secondary" className="text-xs">
              {user.team.name}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/users/${user.id}`}>{t("users.userDetail")}</Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(user)}
              title={t("common.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateUserFormInner({ teams, onSubmit }) {
  const { t } = useTranslation();
  const { setOpen } = useSheet();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    setLoading(true);
    try {
      await onSubmit(e, () => setOpen(false));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("users.createTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("users.createSubtitle")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">{t("users.username")} *</Label>
          <Input id="username" name="username" required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("users.email")} *</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("users.password")} *</Label>
          <Input id="password" name="password" type="password" required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{t("users.role")}</Label>
          <select
            id="role"
            name="role"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="developer">Developer</option>
            <option value="project_manager">Project Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="teamId">{t("users.team")}</Label>
          <select
            id="teamId"
            name="teamId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("users.createUser")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [viewMode, setViewMode] = useState("table");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (roleFilter !== "all") params.role = roleFilter;
    if (teamFilter !== "all") params.teamId = teamFilter;
    if (statusFilter === "false") params.isActive = "false";
    if (statusFilter === "all") params.isActive = "all";
    try {
      const res = await api.get("/api/v1/users", { params });
      const data = res.data;
      setUsers(Array.isArray(data) ? data : data?.users ?? []);
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, teamFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    api
      .get("/api/v1/teams")
      .then((r) => setTeams(Array.isArray(r.data) ? r.data : r.data?.teams ?? []))
      .catch(() => setTeams([]));
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [users]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setTeamFilter("all");
    setStatusFilter("active");
  };

  const handleCreateUser = async (e, closeSheet) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username?.value?.trim();
    const email = form.email?.value?.trim();
    const password = form.password?.value;
    if (!username || username.length < 3) {
      notifyError(t("users.username") + " must be at least 3 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      notifyError(t("validation.invalidEmail") || "Invalid email");
      return;
    }
    if (!password || password.length < 6) {
      notifyError(t("users.password") + " must be at least 6 characters");
      return;
    }
    try {
      await api.post("/api/v1/users", {
        username,
        email,
        password,
        role: form.role?.value || "developer",
        teamId: form.teamId?.value ? parseInt(form.teamId.value, 10) : null,
      });
      notifySuccess("User created successfully");
      if (typeof closeSheet === "function") closeSheet();
      form.reset();
      fetchUsers();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to create user");
    }
  };

  const handleDelete = async (user) => {
    const ok = await notifyConfirm({
      title: t("users.deleteConfirmTitle"),
      text: `Are you sure you want to delete "${user.username}"? This action cannot be undone.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/users/${user.id}`);
      notifySuccess("User deleted");
      fetchUsers();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to delete user");
    }
  };

  const hasActiveFilters = searchQuery.trim() !== "" || roleFilter !== "all" || teamFilter !== "all" || statusFilter !== "active";
  const roleOptions = ["admin", "project_manager", "team_lead", "developer", "viewer"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("users.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-input overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={cn(
                "p-2",
                viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
              title={t("users.viewCards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2",
                viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
              title={t("users.viewTable")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("users.createUser")}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md overflow-y-auto">
              <CreateUserFormInner teams={teams} onSubmit={handleCreateUser} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => { setStatusFilter("active"); setSearchQuery(""); setRoleFilter("all"); setTeamFilter("all"); }}
          className="text-left"
        >
          <Card className={cn(!hasActiveFilters && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("users.total")}</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </button>
        <button type="button" onClick={() => setStatusFilter("active")} className="text-left">
          <Card className={cn(statusFilter === "active" && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("users.active")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
        </button>
        <button type="button" onClick={() => setStatusFilter("false")} className="text-left">
          <Card className={cn(statusFilter === "false" && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("users.inactive")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
            </CardContent>
          </Card>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("users.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label className="text-xs">{t("users.role")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{t("notifications.all")}</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{(r || "").replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("users.team")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">{t("notifications.all")}</option>
            {teams.map((team) => (
              <option key={team.id} value={String(team.id)}>{team.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("common.status")}</Label>
          <select
            className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">{t("users.active")}</option>
            <option value="false">{t("users.inactive")}</option>
            <option value="all">{t("notifications.all")}</option>
          </select>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            {t("users.clearFilters")}
          </Button>
        )}
      </div>

      <Card className="rounded-md border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.user")}</TableHead>
                <TableHead>{t("users.role")}</TableHead>
                <TableHead>{t("users.team")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3 font-medium">
                    <Avatar name={user.username} />
                    <div className="flex flex-col">
                      <Link
                        to={`/dashboard/users/${user.id}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {user.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {(user.role || "").replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.team ? (
                      <Badge variant="secondary">{user.team.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
                      {user.isActive ? t("users.active") : t("users.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/users/${user.id}`}>{t("users.userDetail")}</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(user)}
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} onDelete={handleDelete} />
              ))}
            </div>
          </CardContent>
        )}
        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>{t("users.noUsers")}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
