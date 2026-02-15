import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, TrendingUp, CheckSquare } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { error as notifyError } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function ReportsProgressPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/v1/dashboard/summary")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setSummary(data);
      })
      .catch((err) => {
        notifyError(err?.response?.data?.error || "Failed to load progress data");
      })
      .finally(() => setLoading(false));
  }, []);

  const data = summary || {};
  const totalTasks = data.totalTasks ?? 0;
  const myTasks = data.myTasks ?? 0;
  const completedToday = data.completedToday ?? 0;
  const todaysTasks = data.todaysTasks ?? 0;
  const progressPct = todaysTasks > 0 ? Math.round((completedToday / todaysTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Report</h1>
          <p className="text-muted-foreground mt-1">
            Task and project progress overview
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Today&apos;s Progress
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Completed {completedToday} of {todaysTasks} tasks due today
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Your task counts</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Total tasks (visible)</span>
                <span className="font-medium">{totalTasks}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">My tasks</span>
                <span className="font-medium">{myTasks}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Completed today</span>
                <span className="font-medium">{completedToday}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Link to="/dashboard/tasks" className="text-primary hover:underline font-medium">
            View all tasks →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
