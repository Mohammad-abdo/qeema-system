import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Bell, Filter, Check, CheckCheck } from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";

const LIMIT = 20;

function getTypeColor(type) {
  switch (type) {
    case "task":
      return "bg-chart-1/15 text-chart-1 border-chart-1/20";
    case "dependency":
      return "bg-chart-4/15 text-chart-4 border-chart-4/20";
    case "today_task":
      return "bg-chart-2/15 text-chart-2 border-chart-2/20";
    case "project_admin":
      return "bg-chart-1/15 text-chart-1 border-chart-1/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function ProjectNotificationsPage() {
  const { id: projectIdParam } = useParams();
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : null;
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [notificationsFromApi, setNotificationsFromApi] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: "all",
    isRead: "all",
    search: "",
  });

  const notifications = useMemo(() => {
    if (!filters.search.trim()) return notificationsFromApi;
    const searchLower = filters.search.toLowerCase();
    return notificationsFromApi.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(searchLower) ||
        (n.message || "").toLowerCase().includes(searchLower)
    );
  }, [notificationsFromApi, filters.search]);

  useEffect(() => {
    if (!projectIdParam || !projectId) return;
    api
      .get(`/api/v1/projects/${projectId}`)
      .then((res) => setProject(res.data?.data ?? res.data))
      .catch((err) => {
        setProject(null);
        notifyError(err?.response?.data?.error || "Failed to load project");
      })
      .finally(() => setLoading(false));
  }, [projectIdParam, projectId]);

  const fetchNotifications = () => {
    if (!projectId) return;
    setLoading(true);
    const params = {
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
    };
    if (filters.type !== "all") params.type = filters.type;
    if (filters.isRead === "read") params.isRead = true;
    else if (filters.isRead === "unread") params.isRead = false;

    api
      .get(`/api/v1/projects/${projectId}/notifications`, { params })
      .then((res) => {
        const list = res.data?.notifications ?? [];
        const totalCount = res.data?.total ?? list.length;
        setNotificationsFromApi(list);
        setTotal(totalCount);
      })
      .catch((err) => {
        setNotificationsFromApi([]);
        setTotal(0);
        notifyError(err?.response?.data?.error || "Failed to load notifications");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!projectId) return;
    fetchNotifications();
  }, [projectId, page, filters.type, filters.isRead]);

  const handleMarkAsRead = (notificationId) => {
    if (!projectId) return;
    api
      .patch(`/api/v1/projects/${projectId}/notifications/${notificationId}/read`)
      .then(() => {
        setNotificationsFromApi((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        notifySuccess(t("notifications.markedRead"));
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to mark as read"));
  };

  const handleMarkAllAsRead = () => {
    if (!projectId) return;
    api
      .post(`/api/v1/projects/${projectId}/notifications/mark-all-read`)
      .then(() => {
        setNotificationsFromApi((prev) => prev.map((n) => ({ ...n, isRead: true })));
        notifySuccess(t("notifications.allMarkedRead"));
      })
      .catch((err) => notifyError(err?.response?.data?.error || "Failed to mark all as read"));
  };

  const getNotificationLink = (notification) => {
    if (notification.entityType === "task" && notification.entityId) {
      return `/dashboard/projects/${projectId}/tasks/${notification.entityId}`;
    }
    return `/dashboard/projects/${projectId}`;
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  if (loading && !project) {
    return <ContentSkeleton className="container mx-auto py-6" />;
  }

  if (!project && !loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("projects.backToProjects")}
        </Link>
        <p className="text-destructive">{t("projects.projectNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/dashboard/projects/${projectId}`}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("projects.backToProject")}
          </Link>
        </div>
        <h1 className="page-title mt-4 flex items-center gap-2">
          <Bell className="h-8 w-8" />
          {t("projects.projectNotifications")}
        </h1>
        <p className="text-muted-foreground mt-2">{project?.name}</p>
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("notifications.filters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("notifications.type")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
                  value={filters.type}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, type: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="all">{t("notifications.allTypes")}</option>
                  <option value="task">{t("notifications.task")}</option>
                  <option value="dependency">{t("notifications.dependency")}</option>
                  <option value="today_task">{t("notifications.todayTask")}</option>
                  <option value="project_admin">{t("notifications.projectAdmin")}</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("notifications.status")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
                  value={filters.isRead}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, isRead: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="all">{t("notifications.all")}</option>
                  <option value="unread">{t("notifications.unread")}</option>
                  <option value="read">{t("notifications.read")}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-2 block">{t("common.search")}</Label>
                <Input
                  placeholder={t("notifications.searchPlaceholder")}
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, search: e.target.value }));
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                {t("notifications.markAllRead")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("notifications.title")} ({total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("notifications.noNotifications")}
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? "bg-chart-1/10 border-chart-1/20 dark:bg-chart-1/20 dark:border-chart-1/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </Badge>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-chart-1 shrink-0" />
                          )}
                          {notification.soundRequired && (
                            <Badge variant="destructive" className="text-xs">
                              {t("notifications.critical")}
                            </Badge>
                          )}
                        </div>
                        <Link to={getNotificationLink(notification)} className="block">
                          <p className="font-medium">{notification.title || "—"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message || ""}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.createdAt
                            ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                            : ""}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t("common.previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("common.page")} {page} {t("common.of")} {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t("common.next")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
