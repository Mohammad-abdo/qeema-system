import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader2, Activity, Search, Filter } from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

const LIMIT_OPTIONS = [25, 50, 100];

export default function ActivityLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = { limit, offset };
    if (search.trim()) params.search = search.trim();
    if (userId) params.userId = userId;
    if (projectId) params.projectId = projectId;
    if (category) params.category = category;
    if (entityType) params.entityType = entityType;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    api
      .get("/api/v1/activity-logs", { params })
      .then((res) => {
        setLogs(res.data?.logs ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch((err) => {
        notifyError(err?.response?.data?.error || "Failed to load activity logs");
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [limit, offset, search, userId, projectId, category, entityType, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    api.get("/api/v1/users", { params: { limit: 200 } }).then((res) => {
      const list = res.data?.users ?? res.data?.data ?? res.data ?? [];
      setUsers(Array.isArray(list) ? list : []);
    }).catch(() => setUsers([]));
    api.get("/api/v1/projects", { params: { limit: 200 } }).then((res) => {
      const list = res.data?.projects ?? res.data?.data ?? res.data ?? [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const clearFilters = () => {
    setSearch("");
    setUserId("");
    setProjectId("");
    setCategory("");
    setEntityType("");
    setStartDate("");
    setEndDate("");
    setOffset(0);
  };

  const hasFilters = search || userId || projectId || category || entityType || startDate || endDate;
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("activityLogs.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("activityLogs.subtitle")}</p>
        </div>
      </div>

      <Card className="rounded-xl border-0 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground">{t("activityLogs.searchPlaceholder")}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("activityLogs.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), fetchLogs())}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-40">
              <Label className="text-xs text-muted-foreground">{t("activityLogs.filterByUser")}</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username || u.email}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-muted-foreground">{t("activityLogs.filterByProject")}</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <Label className="text-xs text-muted-foreground">{t("activityLogs.filterByCategory")}</Label>
              <Input
                className="mt-1"
                placeholder="e.g. task"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="w-28">
              <Label className="text-xs text-muted-foreground">{t("activityLogs.fromDate")}</Label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="w-28">
              <Label className="text-xs text-muted-foreground">{t("activityLogs.toDate")}</Label>
              <Input type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={fetchLogs}>
                <Filter className="h-4 w-4 me-1" />
                {t("activityLogs.applyFilters")}
              </Button>
              {hasFilters && (
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  {t("activityLogs.clearFilters")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.time")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.action")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.category")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.entityType")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.user")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.affectedUser")}</TableHead>
                      <TableHead className="whitespace-nowrap">{t("activityLogs.project")}</TableHead>
                      <TableHead className="min-w-[200px]">{t("activityLogs.summary")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal text-xs">
                            {log.actionType ?? log.action ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.actionCategory ?? "—"}</TableCell>
                        <TableCell className="text-sm">{log.entityType ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {log.performedBy ? (
                            <Link to={`/dashboard/users/${log.performedBy.id}`} className="text-primary hover:underline">
                              {log.performedBy.username ?? log.performedBy.email ?? "—"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.affectedUser ? (log.affectedUser.username ?? log.affectedUser.email ?? "—") : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.project ? (
                            <Link to={`/dashboard/projects/${log.project.id}`} className="text-primary hover:underline">
                              {log.project.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={log.actionSummary ?? ""}>
                          {log.actionSummary ?? log.summary ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!loading && logs.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  {t("activityLogs.noLogs")}
                </div>
              )}
              {total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 px-4 py-3 bg-muted/20">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {t("activityLogs.total")}: <strong>{total}</strong>
                    </span>
                    <select
                      className="h-8 rounded border border-input bg-background px-2 text-sm"
                      value={limit}
                      onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                    >
                      {LIMIT_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} {t("activityLogs.perPage")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0}
                      onClick={() => setOffset((o) => Math.max(0, o - limit))}
                    >
                      {t("activityLogs.prev")}
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset + limit >= total}
                      onClick={() => setOffset((o) => o + limit)}
                    >
                      {t("activityLogs.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
