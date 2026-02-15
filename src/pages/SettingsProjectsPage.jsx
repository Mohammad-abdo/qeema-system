import { useState, useEffect } from "react";
import { Loader2, FolderKanban, ListTodo, Flag } from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function SettingsProjectsPage() {
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/project-types").catch(() => ({ data: [] })),
      api.get("/api/v1/project-statuses").catch(() => ({ data: [] })),
      api.get("/api/v1/task-statuses").catch(() => ({ data: [] })),
    ])
      .then(([typesRes, statusesRes, taskRes]) => {
        const t = typesRes.data?.projectTypes ?? typesRes.data ?? [];
        const s = statusesRes.data?.projectStatuses ?? statusesRes.data ?? [];
        const ts = taskRes.data?.taskStatuses ?? taskRes.data ?? [];
        setProjectTypes(Array.isArray(t) ? t : []);
        setProjectStatuses(Array.isArray(s) ? s : []);
        setTaskStatuses(Array.isArray(ts) ? ts : []);
      })
      .catch(() => {
        notifyError("Failed to load project metadata");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Project Metadata Settings</h1>
      <p className="text-muted-foreground">
        Manage project types, project statuses, and task statuses. These apply across all projects.
      </p>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              <CardTitle className="text-lg">Project Types</CardTitle>
            </CardHeader>
            <CardContent>
              {projectTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No project types defined.</p>
              ) : (
                <ul className="space-y-2">
                  {projectTypes.map((pt) => (
                    <li key={pt.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span>{pt.name}</span>
                      {pt.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: pt.color }}
                          title={pt.color}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Flag className="h-5 w-5" />
              <CardTitle className="text-lg">Project Statuses</CardTitle>
            </CardHeader>
            <CardContent>
              {projectStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No project statuses defined.</p>
              ) : (
                <ul className="space-y-2">
                  {projectStatuses.map((ps) => (
                    <li key={ps.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span>{ps.name}</span>
                      {ps.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: ps.color }}
                          title={ps.color}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <ListTodo className="h-5 w-5" />
              <CardTitle className="text-lg">Task Statuses</CardTitle>
            </CardHeader>
            <CardContent>
              {taskStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No task statuses defined.</p>
              ) : (
                <ul className="space-y-2">
                  {taskStatuses.map((ts) => (
                    <li key={ts.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span>{ts.name}</span>
                      <div className="flex gap-1">
                        {ts.isFinal && <Badge variant="secondary" className="text-xs">Final</Badge>}
                        {ts.isBlocking && <Badge variant="outline" className="text-xs">Blocking</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
