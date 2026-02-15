import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Users,
  FolderKanban,
  Loader2,
  Search,
  X,
  LayoutGrid,
  List,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError, confirm as notifyConfirm } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Sheet, SheetTrigger, SheetContent, useSheet } from "@/components/ui/Sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

function TeamCard({ team, onDelete }) {
  const { t } = useTranslation();
  const memberCount = team._count?.members ?? team._count?.users ?? 0;
  const projectCount = team._count?.projectTeams ?? 0;
  const lead = team.teamLead;
  const members = team.members ?? team.users ?? [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">
          <Link to={`/dashboard/teams/${team.id}`} className="hover:underline">
            {team.name}
          </Link>
        </CardTitle>
        <Badge variant={team.status === "active" ? "default" : "secondary"}>
          {team.status === "active" ? t("teams.active") : t("teams.inactive")}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground min-h-[40px] mb-4">
          {team.description || "—"}
        </p>
        {lead && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("teams.lead")}:</span>
            <span className="font-medium">{lead.username}</span>
          </div>
        )}
        <div className="space-y-3 mt-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{t("teams.members")}</span>
            </div>
            <span className="font-medium">{memberCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              <span>{t("teams.projects")}</span>
            </div>
            <span className="font-medium">{projectCount}</span>
          </div>
          {members.length > 0 && (
            <div className="flex -space-x-2 overflow-hidden pt-2">
              {members.slice(0, 5).map((m, i) => {
                const user = m.user ?? m;
                const name = user.username || "";
                return (
                  <div
                    key={user.id || i}
                    title={name}
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background"
                    )}
                  >
                    {name.substring(0, 2).toUpperCase()}
                  </div>
                );
              })}
              {memberCount > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background text-xs">
                  +{memberCount - 5}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/teams/${team.id}`}>{t("common.edit")}</Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.preventDefault(); onDelete(team); }}
                title={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTeamFormInner({ onSubmit }) {
  const { t } = useTranslation();
  const { setOpen } = useSheet();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(e, () => setOpen(false));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("teams.createTeam")}</h2>
      <p className="text-sm text-muted-foreground">{t("teams.subtitle")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">{t("teams.teamName")} *</Label>
          <Input id="team-name" name="name" required placeholder="e.g. Frontend" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-desc">{t("teams.teamDescription")}</Label>
          <textarea
            id="team-desc"
            name="description"
            placeholder="Team responsibilities..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("teams.createTeam")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function TeamsPage() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [viewMode, setViewMode] = useState("card"); // card | table

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/teams");
      const data = res.data;
      setTeams(Array.isArray(data) ? data : data?.teams ?? []);
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to load teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = useMemo(() => {
    let list = teams;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((t) => t.status === "active");
    if (statusFilter === "inactive") list = list.filter((t) => t.status === "inactive");
    return list;
  }, [teams, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = teams.length;
    const active = teams.filter((t) => t.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [teams]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const handleCreateTeam = async (e, closeSheet) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("teams.teamName") + " is required");
      return;
    }
    try {
      await api.post("/api/v1/teams", {
        name,
        description: form.description?.value?.trim() || null,
        status: "active",
      });
      notifySuccess(t("teams.createSuccess"));
      if (typeof closeSheet === "function") closeSheet();
      form.reset();
      fetchTeams();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to create team");
    }
  };

  const handleDeleteTeam = async (team) => {
    const ok = await notifyConfirm({
      title: t("teamDetail.deleteTeam"),
      text: t("teams.deleteConfirm"),
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/teams/${team.id}`);
      notifySuccess(t("teams.deleteSuccess"));
      fetchTeams();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to delete team");
    }
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("teams.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("teams.subtitle")}</p>
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
              title={t("teams.viewCards")}
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
              title={t("teams.viewTable")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("teams.newTeam")}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md overflow-y-auto">
              <CreateTeamFormInner onSubmit={handleCreateTeam} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}
          className="text-left"
        >
          <Card className={cn(statusFilter === "all" && !searchQuery && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("teams.total")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className="text-left"
        >
          <Card className={cn(statusFilter === "active" && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("teams.active")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("inactive")}
          className="text-left"
        >
          <Card className={cn(statusFilter === "inactive" && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("teams.inactive")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("teams.searchPlaceholder")}
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

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label className="text-xs">{t("common.status")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("notifications.all")}</option>
            <option value="active">{t("teams.active")}</option>
            <option value="inactive">{t("teams.inactive")}</option>
          </select>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            {t("teams.clearFilters")}
          </Button>
        )}
      </div>

      {/* Content */}
      <Card className="rounded-md border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("teams.name")}</TableHead>
                <TableHead>{t("teams.lead")}</TableHead>
                <TableHead>{t("teams.members")}</TableHead>
                <TableHead>{t("teams.projects")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <Link to={`/dashboard/teams/${team.id}`} className="hover:underline text-primary">
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {team.teamLead ? team.teamLead.username : "—"}
                  </TableCell>
                  <TableCell>{team._count?.members ?? team._count?.users ?? 0}</TableCell>
                  <TableCell>{team._count?.projectTeams ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={team.status === "active" ? "default" : "secondary"}>
                      {team.status === "active" ? t("teams.active") : t("teams.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/teams/${team.id}`}>{t("common.edit")}</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTeam(team)}
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
              {filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} onDelete={handleDeleteTeam} />
              ))}
            </div>
          </CardContent>
        )}

        {!loading && filteredTeams.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>{t("teams.noTeams")}</p>
            <p className="text-sm mt-1">{hasActiveFilters ? t("projects.adjustFilters") : t("teams.createOne")}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
