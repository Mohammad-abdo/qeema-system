import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  Plus,
  Loader2,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Folder,
} from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Sheet, SheetTrigger, SheetContent, useSheet } from "@/components/ui/Sheet";
import { ProjectsViewSwitcher } from "@/components/projects/ProjectsViewSwitcher";
import { ProjectsTableView } from "@/components/projects/ProjectsTableView";
import { cn } from "@/lib/utils";

function CreateProjectFormInner({ onSubmit, projectTypes }) {
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
      <h2 className="text-lg font-semibold">{t("projects.createTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("projects.createSubtitle")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">{t("projects.nameRequired")} *</Label>
          <Input id="project-name" name="name" required placeholder={t("projects.nameRequired")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-desc">{t("projects.description")}</Label>
          <textarea
            id="project-desc"
            name="description"
            placeholder={t("projects.description")}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-type">{t("projects.projectType")}</Label>
          <select
            id="project-type"
            name="projectTypeId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">—</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") ? searchParams.get("category").split(",").filter(Boolean) : []
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ? searchParams.get("status").split(",").filter(Boolean) : []
  );
  const [dateRange, setDateRange] = useState({
    start: searchParams.get("startDate") ? new Date(searchParams.get("startDate")) : undefined,
    end: searchParams.get("endDate") ? new Date(searchParams.get("endDate")) : undefined,
  });
  const [projectManagerFilter, setProjectManagerFilter] = useState(searchParams.get("projectManager") || "all");
  const [priorityFilter, setPriorityFilter] = useState(
    searchParams.get("priority") ? searchParams.get("priority").split(",").filter(Boolean) : []
  );
  const [viewMode, setViewMode] = useState(searchParams.get("view") === "table" ? "table" : "card");
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get("page") || "1", 10)));
  const [projectTypes, setProjectTypes] = useState([]);
  const limit = 12;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = { page, limit };
    if (searchQuery) params.search = searchQuery;
    if (categoryFilter.length > 0) params.category = categoryFilter;
    if (statusFilter.length > 0) params.status = statusFilter;
    if (projectManagerFilter !== "all") params.projectManager = projectManagerFilter;
    if (priorityFilter.length > 0) params.priority = priorityFilter;
    if (dateRange.start) params.startDate = (dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start)).toISOString().split("T")[0];
    if (dateRange.end) params.endDate = (dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end)).toISOString().split("T")[0];
    try {
      const res = await api.get("/api/v1/projects", { params });
      const data = res.data;
      setProjects(data?.projects ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to load projects");
      setProjects([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, categoryFilter, statusFilter, projectManagerFilter, priorityFilter, dateRange]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set("search", searchQuery);
    else params.delete("search");
    if (categoryFilter.length > 0) params.set("category", categoryFilter.join(","));
    else params.delete("category");
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    else params.delete("status");
    if (projectManagerFilter !== "all") params.set("projectManager", projectManagerFilter);
    else params.delete("projectManager");
    if (priorityFilter.length > 0) params.set("priority", priorityFilter.join(","));
    else params.delete("priority");
    if (dateRange.start) params.set("startDate", (dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start)).toISOString().split("T")[0]);
    else params.delete("startDate");
    if (dateRange.end) params.set("endDate", (dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end)).toISOString().split("T")[0]);
    else params.delete("endDate");
    if (viewMode !== "card") params.set("view", viewMode);
    else params.delete("view");
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    setSearchParams(params, { replace: true });
  }, [searchQuery, categoryFilter, statusFilter, projectManagerFilter, priorityFilter, dateRange, viewMode, page]);

  useEffect(() => {
    api.get("/api/v1/stats/projects").then((res) => {
      const d = res.data?.data ?? res.data;
      if (d) setStats({ total: d.total ?? 0, active: d.active ?? 0, completed: d.completed ?? 0, urgent: d.urgent ?? 0 });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/api/v1/project-types").then((r) => {
      const list = r.data?.projectTypes ?? r.data ?? [];
      setProjectTypes(Array.isArray(list) ? list : []);
    }).catch(() => setProjectTypes([]));
  }, []);

  useEffect(() => {
    api.get("/api/v1/users").then((r) => {
      const u = r.data?.users ?? r.data ?? [];
      setUsers(Array.isArray(u) ? u : []);
    }).catch(() => setUsers([]));
  }, []);

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter([]);
    setStatusFilter([]);
    setProjectManagerFilter("all");
    setPriorityFilter([]);
    setDateRange({});
    setPage(1);
  };

  const handleCreateProject = async (e, closeSheet) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("projects.nameRequired"));
      return;
    }
    try {
      await api.post("/api/v1/projects", {
        name,
        description: form.description?.value?.trim() || null,
        projectTypeId: form.projectTypeId?.value ? parseInt(form.projectTypeId.value, 10) : null,
      });
      notifySuccess(t("toast.projectCreated"));
      if (typeof closeSheet === "function") closeSheet();
      form.reset();
      setPage(1);
      fetchProjects();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to create project");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const statusOptions = ["planned", "active", "on_hold", "completed", "cancelled"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("projects.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectsViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("projects.newProject")}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md overflow-y-auto">
              <CreateProjectFormInner onSubmit={handleCreateProject} projectTypes={projectTypes} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => { setStatusFilter([]); setPriorityFilter([]); setCategoryFilter([]); setProjectManagerFilter("all"); setSearchQuery(""); setDateRange({}); setPage(1); }}
          className="text-left"
        >
          <Card className={cn(statusFilter.length === 0 && priorityFilter.length === 0 && categoryFilter.length === 0 && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("projects.total")}</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter(["active"]); setPriorityFilter([]); setPage(1); }}
          className="text-left"
        >
          <Card className={cn(statusFilter.includes("active") && statusFilter.length === 1 && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("projects.active")}</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter(["completed"]); setPriorityFilter([]); setPage(1); }}
          className="text-left"
        >
          <Card className={cn(statusFilter.includes("completed") && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("projects.completed")}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => { setPriorityFilter(["urgent"]); setStatusFilter([]); setPage(1); }}
          className="text-left"
        >
          <Card className={cn(priorityFilter.includes("urgent") && "ring-2 ring-primary/20")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("projects.urgent")}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.urgent}</div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("projects.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => { setSearchQuery(""); setPage(1); }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label className="text-xs">{t("projects.category")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={categoryFilter[0] || ""}
            onChange={(e) => { setCategoryFilter(e.target.value ? [e.target.value] : []); setPage(1); }}
          >
            <option value="">{t("tasks.all")}</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("common.status")}</Label>
          <select
            className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={statusFilter[0] || ""}
            onChange={(e) => { setStatusFilter(e.target.value ? [e.target.value] : []); setPage(1); }}
          >
            <option value="">{t("tasks.all")}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("projects.projectManager")}</Label>
          <select
            className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={projectManagerFilter}
            onChange={(e) => { setProjectManagerFilter(e.target.value); setPage(1); }}
          >
            <option value="all">{t("projects.allManagers")}</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.username}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("projects.startDate")}</Label>
          <Input
            type="date"
            className="h-9 w-[140px]"
            value={dateRange.start ? (dateRange.start instanceof Date ? dateRange.start.toISOString().split("T")[0] : String(dateRange.start).slice(0, 10)) : ""}
            onChange={(e) => { setDateRange((r) => ({ ...r, start: e.target.value ? new Date(e.target.value) : undefined })); setPage(1); }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("projects.endDate")}</Label>
          <Input
            type="date"
            className="h-9 w-[140px]"
            value={dateRange.end ? (dateRange.end instanceof Date ? dateRange.end.toISOString().split("T")[0] : String(dateRange.end).slice(0, 10)) : ""}
            onChange={(e) => { setDateRange((r) => ({ ...r, end: e.target.value ? new Date(e.target.value) : undefined })); setPage(1); }}
          />
        </div>
        <Button variant="outline" size="sm" className="self-end" onClick={handleClearFilters}>
          {t("projects.clearFilters")}
        </Button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "table" ? (
        <>
          {projects.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <h3 className="mt-4 text-lg font-semibold">{t("projects.noProjectsFound")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("projects.adjustFilters")}</p>
            </div>
          ) : (
            <ProjectsTableView
              projects={projects}
              total={total}
              page={page}
              limit={limit}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/dashboard/projects/${p.id}`}
                className="rounded-xl border bg-card p-6 hover:bg-accent/50 transition-colors block"
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || "—"}</p>
                <div className="flex gap-2 mt-3">
                  {p.status && (
                    <Badge variant="outline" className="text-xs">
                      {p.status.replace("_", " ")}
                    </Badge>
                  )}
                  {p._count?.tasks != null && (
                    <span className="text-xs text-muted-foreground">{p._count.tasks} {t("projects.tasksCount")}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {projects.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <h3 className="mt-4 text-lg font-semibold">{t("projects.noProjects")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("projects.adjustFilters")}</p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
                {t("common.previous")}
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {t("projects.pageOf", { page, total: totalPages })}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((x) => Math.min(totalPages, x + 1))}>
                {t("common.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
