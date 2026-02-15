import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { playNotificationSound } from "@/utils/notificationSound";
import { format } from "date-fns";

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

export function ProjectNotificationsHeader() {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchUnreadCount = useCallback(() => {
    api
      .get("/api/v1/notifications/unread-count")
      .then((res) => {
        const n = res.data?.count ?? res.data?.data?.count ?? 0;
        setUnreadCount(Number(n));
      })
      .catch(() => setUnreadCount(0));
  }, []);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    api
      .get("/api/v1/notifications", { params: { limit: 50 } })
      .then((res) => {
        const list = res.data?.notifications ?? res.data ?? [];
        setNotifications(Array.isArray(list) ? list : []);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  const togglePanel = () => {
    const next = !panelOpen;
    setPanelOpen(next);
    if (next) {
      fetchNotifications();
      fetchUnreadCount();
      if (unreadCount > 0) playNotificationSound();
    }
  };

  const handleMarkAsRead = (id) => {
    api
      .patch(`/api/v1/notifications/${id}/read`)
      .then(() => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        notifySuccess(t("notifications.markedRead"));
      })
      .catch(() => notifyError(t("notifications.markReadFailed") || "Failed"));
  };

  const handleMarkAllRead = () => {
    api
      .post("/api/v1/notifications/mark-all-read")
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        notifySuccess(t("notifications.markAllRead") || t("notifications.allMarkedRead"));
      })
      .catch(() => notifyError(t("notifications.markAllReadFailed") || "Failed"));
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={t("notifications.title")}
        onClick={togglePanel}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
      {panelOpen && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setPanelOpen(false)}
        />
      )}
      {panelOpen && (
        <div className="fixed right-0 top-14 z-50 w-full max-w-md border-l border-border bg-background shadow-xl max-h-[calc(100vh-3.5rem)] flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">{t("notifications.title")}</h2>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 me-1" />
                {t("notifications.markAllRead")}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">{t("notifications.noNotifications")}</p>
            ) : (
              <ul className="space-y-1">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg border p-3 transition-colors ${!n.isRead ? "bg-primary/5 border-primary/20" : "bg-card"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{n.title || "—"}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {n.createdAt ? format(new Date(n.createdAt), "MMM d, HH:mm") : ""}
                        </p>
                      </div>
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs"
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          {t("notifications.markRead")}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
