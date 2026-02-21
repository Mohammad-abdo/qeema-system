import { useState, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardExportButton } from "@/components/dashboard/DashboardExportButton";
import { TasksByStatusChart, ProjectsByStatusChart, OverviewProgressCard } from "@/components/dashboard/DashboardCharts";
import { StatCardGridSkeleton } from "@/components/ui/StatCardSkeleton";
import { CardListSkeleton } from "@/components/ui/CardListSkeleton";
import { Badge } from "@/components/ui/Badge";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";

function DashboardStatsSection({ summary, loadError }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (loadError) {
    return (
      <div className="p-8 text-center text-destructive">
        <h3 className="text-lg font-bold">{t("dashboard.errorLoading")}</h3>
        <p>{t("dashboard.refreshHint")} ({loadError})</p>
      </div>
    );
  }

  if (!summary) return <StatCardGridSkeleton count={4} />;

  const data = summary?.data ?? summary;
  const userRole = user?.role || "developer";
  const isPM = true; // Forcing display to match screenshot structure for now, or check permissions
  const totalProjects = data.totalProjects ?? data.projects?.total ?? 0;
  const totalTasks = data.totalTasks ?? data.tasks?.total ?? 0;
  const tasksData = data.tasks ?? { total: data.totalTasks, myTasks: data.myTasks, blocked: data.blockedTasks, overdue: data.overdueTasks };
  const todayTasksData = { total: data.todaysTasks ?? data.todayTasks?.total, completed: data.completedToday ?? data.todayTasks?.completed };

  return (
    <div className="space-y-6">
      {/* Top Row: 4 Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.totalProjects")}
          value={totalProjects}
          icon="Folder"
          href="/dashboard/projects"
          variant="info"
          trend={{ value: "- 0%", direction: "neutral" }}
        />
        <StatCard
          title={t("dashboard.totalTasks")}
          value={totalTasks}
          icon="CheckSquare"
          href="/dashboard/tasks"
          variant="info"
          trend={{ value: "- 0%", direction: "neutral" }}
        />
        <StatCard
          title={t("dashboard.myTasks")}
          value={tasksData.myTasks ?? 0}
          icon="User"
          href="/dashboard/tasks?assignee=me"
          variant="default"
          trend={{ value: "- 0%", direction: "neutral" }}
        />
        <StatCard
          title={t("dashboard.blockedTasks")}
          value={tasksData.blocked ?? 0}
          icon="AlertTriangle"
          href="/dashboard/tasks?dependencyState=blocked"
          variant="danger"
          trend={{ value: "- 0%", direction: "neutral" }}
        />
      </div>

      {/* Second Row: Overdue (Standalone) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.overdueTasks")}
          value={tasksData.overdue ?? 0}
          icon="Clock"
          href="/dashboard/tasks?overdue=true"
          variant="danger"
          trend={{ value: "- 0%", direction: "neutral" }}
        />
      </div>

      {/* Third Row: Wide Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <StatCard
          title={t("dashboard.todayTasks")}
          value={todayTasksData.total ?? 0}
          icon="Calendar"
          href="/dashboard/tasks?today=true"
          variant="info"
          trend={{ value: "- 0%", direction: "neutral" }}
          className="h-full"
        />
        <StatCard
          title={t("dashboard.completedToday")}
          value={todayTasksData.completed ?? 0}
          icon="CheckCircle2"
          href="/dashboard/reports?tab=today"
          variant="success"
          trend={{ value: "- 0%", direction: "neutral" }}
          className="h-full"
        />
      </div>
    </div>
  );
}

function UrgentProjectsSection() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/v1/projects?priority=urgent")
      .then((res) => {
        const list = res.data?.projects ?? res.data?.data ?? [];
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || projects.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 dark:border-destructive/40 dark:bg-destructive/20">
        <p className="text-sm font-medium text-destructive">
          {projects.length} {t("dashboard.urgentProjects")}
        </p>
      </div>
    </div>
  );
}

function DashboardFocusSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    api
      .get("/api/v1/tasks", {
        params: { startDate: today, endDate: today, assigneeId: "me", limit: 10 },
      })
      .then((res) => {
        const list = res.data?.tasks ?? res.data ?? [];
        setTasks(Array.isArray(list) ? list : []);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const userRole = user?.role || "developer";
  const isPM = userRole === "project_manager" || userRole === "admin";

  if (loading) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className={isPM ? "lg:col-span-2" : "lg:col-span-3"}>
        <div className="rounded-xl border border-border/60 bg-card p-8 shadow-sm h-full">
          <h3 className="text-base font-semibold">{t("dashboard.focusTitle")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("dashboard.focusSubtitle")}</p>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">{t("dashboard.noFocusTasks")}</p>
              <Link to="/dashboard/focus" className="text-sm font-medium text-primary hover:underline mt-4 inline-flex items-center">
                {t("dashboard.planYourDay")} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {isPM && (
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm h-full">
            <h3 className="text-base font-semibold">{t("dashboard.activity")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.recentActivity")}</p>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-sm text-muted-foreground">No recent activity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const userRole = user?.role || "developer";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const isPM = userRole === "project_manager" || userRole === "admin";

  useEffect(() => {
    api
      .get("/api/v1/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.error || err.message;
        setLoadError(msg);
        notifyError(msg);
      });
  }, []);

  const roleLabel = userRole === "admin" ? t("dashboard.roleAdmin") : userRole === "project_manager" ? t("dashboard.rolePM") : t("dashboard.roleDeveloper");
  const data = summary?.data ?? summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardExportButton />
          <Badge variant="secondary" className="text-sm">
            {roleLabel}
          </Badge>
        </div>
      </div>

      <DashboardStatsSection summary={summary} loadError={loadError} />

      {summary && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TasksByStatusChart
            taskStatuses={data?.taskStatuses ?? []}
            taskStatusCounts={data?.taskStatusCounts ?? {}}
          />
          {isPM && (
            <ProjectsByStatusChart
              projectStatuses={data?.projectStatuses ?? []}
              projectStatusCounts={data?.projectStatusCounts ?? {}}
              legacyActive={data?.legacyActive ?? 0}
              legacyOnHold={data?.legacyOnHold ?? 0}
            />
          )}
          <OverviewProgressCard summary={summary} />
        </section>
      )}

      <Suspense fallback={<CardListSkeleton count={2} />}>
        <UrgentProjectsSection />
      </Suspense>

      <Suspense fallback={<CardListSkeleton count={3} />}>
        <DashboardFocusSection />
      </Suspense>
    </div>
  );
}
