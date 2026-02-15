import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const CHART_COLORS = [
  "hsl(220 70% 50%)",
  "hsl(160 60% 45%)",
  "hsl(35 90% 55%)",
  "hsl(280 65% 55%)",
  "hsl(190 75% 45%)",
  "hsl(10 75% 55%)",
  "hsl(45 85% 60%)",
  "hsl(260 60% 60%)",
];

export function TasksByStatusChart({ taskStatuses = [], taskStatusCounts = {} }) {
  const { t } = useTranslation();
  const data = taskStatuses
    .map((s) => ({
      name: s.name,
      value: taskStatusCounts[s.id] ?? 0,
      id: s.id,
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t("dashboard.tasksByStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">{t("common.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("dashboard.tasksByStatus")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("dashboard.taskStatuses")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                formatter={(value) => [value, t("common.status")]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsByStatusChart({ projectStatuses = [], projectStatusCounts = {}, legacyActive = 0, legacyOnHold = 0 }) {
  const { t } = useTranslation();
  let data = projectStatuses
    .map((s) => ({
      name: s.name,
      count: projectStatusCounts[s.id] ?? 0,
      id: s.id,
    }))
    .filter((d) => d.count > 0);
  if (data.length === 0 && (legacyActive > 0 || legacyOnHold > 0)) {
    data = [
      { name: t("dashboard.activeProjects"), count: legacyActive, id: "active" },
      { name: t("dashboard.onHoldProjects"), count: legacyOnHold, id: "on_hold" },
    ].filter((d) => d.count > 0);
  }

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t("dashboard.projectsByStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">{t("common.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("dashboard.projectsByStatus")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("dashboard.totalProjects")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                formatter={(value) => [value, t("dashboard.totalProjects")]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name={t("dashboard.totalProjects")} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewProgressCard({ summary }) {
  const { t } = useTranslation();
  const data = summary?.data ?? summary;
  const total = data.totalTasks ?? 0;
  const myTasks = data.myTasks ?? 0;
  const completedToday = data.completedToday ?? 0;
  const todaysTasks = data.todaysTasks ?? 0;
  const dayProgress = todaysTasks > 0 ? Math.round((completedToday / todaysTasks) * 100) : 0;
  const myShare = total > 0 ? Math.round((myTasks / total) * 100) : 0;

  return (
    <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("dashboard.overview")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("dashboard.overviewSubtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{t("dashboard.todayProgress")}</span>
            <span className="font-medium">{dayProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/80 transition-all duration-500"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedToday} / {todaysTasks} {t("dashboard.completedToday").toLowerCase()}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{t("dashboard.myTasksShare")}</span>
            <span className="font-medium">{myShare}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-500"
              style={{ width: `${myShare}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {myTasks} {t("dashboard.myTasks").toLowerCase()} / {total} {t("dashboard.totalTasks").toLowerCase()}
          </p>
        </div>
        <Link
          to="/dashboard/reports"
          className="text-xs font-medium text-primary hover:underline block mt-2"
        >
          {t("dashboard.viewReports")} →
        </Link>
      </CardContent>
    </Card>
  );
}
