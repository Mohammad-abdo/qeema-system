import { useState, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
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
      <div className="p-8 text-center text-red-500">
        <h3 className="text-lg font-bold">{t("dashboard.errorLoading")}</h3>
        <p>{t("dashboard.refreshHint")} ({loadError})</p>
      </div>
    );
  }

  if (!summary) return <StatCardGridSkeleton count={4} />;

  const data = summary?.data ?? summary;
  const userRole = user?.role || "developer";
  const isAdmin = userRole === "admin";
  const isPM = userRole === "project_manager" || isAdmin;
  const totalProjects = data.totalProjects ?? data.projects?.total ?? 0;
  const totalTasks = data.totalTasks ?? data.tasks?.total ?? 0;
  const tasksData = data.tasks ?? { total: data.totalTasks, myTasks: data.myTasks, blocked: data.blockedTasks, overdue: data.overdueTasks, statusCounts: data.taskStatusCounts, myTasksTrend: null, trend: null, blockedTrend: null, overdueTrend: null };
  const todayTasksData = { total: data.todaysTasks ?? data.todayTasks?.total, completed: data.completedToday ?? data.todayTasks?.completed, totalTrend: null, completedTrend: null };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isPM && (
          <>
            <StatCard
              title={t("dashboard.totalProjects")}
              value={totalProjects}
              icon="FolderKanban"
              href="/dashboard/projects"
              variant="info"
              trend={undefined}
            />
            {data.projectStatuses && data.projectStatuses.length > 0
              ? data.projectStatuses.map((status) => {
                  const count = data.projectStatusCounts?.[status.id] ?? 0;
                  if (count === 0) return null;
                  return (
                    <StatCard
                      key={status.id}
                      title={status.name}
                      value={count}
                      icon="FolderOpen"
                      href={`/dashboard/projects?status=${status.id}`}
                      variant="default"
                    />
                  );
                })
              : (
                  <>
                    {(data.legacyActive ?? 0) > 0 && (
                      <StatCard
                        title={t("dashboard.activeProjects")}
                        value={data.legacyActive ?? 0}
                        icon="FolderOpen"
                        href="/dashboard/projects?status=active"
                        variant="success"
                      />
                    )}
                    {(data.legacyOnHold ?? 0) > 0 && (
                      <StatCard
                        title={t("dashboard.onHoldProjects")}
                        value={data.legacyOnHold ?? 0}
                        icon="FolderX"
                        href="/dashboard/projects?status=on_hold"
                        variant="warning"
                      />
                    )}
                  </>
                )}
          </>
        )}

        {isPM && (
          <StatCard
            title={t("dashboard.totalTasks")}
            value={totalTasks}
            icon="CheckSquare"
            href="/dashboard/tasks"
            variant="info"
          />
        )}

        <StatCard
          title={t("dashboard.myTasks")}
          value={tasksData.myTasks ?? data.myTasks ?? 0}
          icon="UserCheck"
          href="/dashboard/tasks?assignee=me"
          variant="default"
        />

        <StatCard
          title={t("dashboard.blockedTasks")}
          value={tasksData.blocked ?? data.blockedTasks ?? 0}
          icon="AlertTriangle"
          href="/dashboard/tasks?dependencyState=blocked"
          variant="danger"
        />

        <StatCard
          title={t("dashboard.overdueTasks")}
          value={tasksData.overdue ?? data.overdueTasks ?? 0}
          icon="Clock"
          href="/dashboard/tasks?overdue=true"
          variant="danger"
        />
      </div>

      {data.taskStatuses && data.taskStatuses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <h2 className="col-span-full text-lg font-semibold">{t("dashboard.taskStatuses")}</h2>
          {data.taskStatuses.map((status) => {
            const count = data.taskStatusCounts?.[status.id] ?? 0;
            if (count === 0) return null;
            return (
              <StatCard
                key={status.id}
                title={status.name}
                value={count}
                icon="CheckSquare"
                href={`/dashboard/tasks?status=${status.id}`}
                variant="default"
              />
            );
          })}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title={t("dashboard.todayTasks")}
          value={todayTasksData.total ?? 0}
          icon="Calendar"
          href="/dashboard/tasks?today=true"
          variant="info"
        />
        <StatCard
          title={t("dashboard.completedToday")}
          value={todayTasksData.completed ?? 0}
          icon="CheckCircle2"
          href="/dashboard/reports?tab=today"
          variant="success"
        />
      </div>
    </>
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
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 dark:border-red-800">
        <p className="text-sm font-medium text-red-900 dark:text-red-100">
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className={isPM ? "lg:col-span-2" : "lg:col-span-3"}>
        <div className="rounded-xl border-0 bg-card/80 backdrop-blur-sm shadow-sm p-4">
          <h3 className="text-lg font-semibold">{t("dashboard.focusTitle")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.focusSubtitle")}</p>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("dashboard.noFocusTasks")}</p>
              <Link to="/dashboard/focus" className="text-sm text-primary hover:underline mt-2 inline-block">
                {t("dashboard.planYourDay")}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <li key={task.id} className="text-sm">
                  {task.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {isPM && (
        <div className="lg:col-span-1">
          <div className="rounded-xl border-0 bg-card/80 backdrop-blur-sm shadow-sm p-4">
            <h3 className="text-sm font-semibold">{t("dashboard.activity")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.recentActivity")}</p>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
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
