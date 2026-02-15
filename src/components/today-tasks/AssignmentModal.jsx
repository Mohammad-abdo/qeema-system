import { useState, useEffect } from "react";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export function AssignmentModal({
  userId,
  userName,
  open,
  onOpenChange,
  selectedDate,
  onSaved,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    api
      .get(`/api/v1/assignment/user/${userId}/projects`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const list = data?.projects ?? [];
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) setSelectedProjectId(list[0].id);
        else if (list.length > 0) setSelectedProjectId(list[0].id);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [open, userId]);

  useEffect(() => {
    if (!open || !userId || !selectedProjectId) {
      setAvailableTasks([]);
      setTodayTasks([]);
      return;
    }
    setLoading(true);
    const dateParam = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
    api
      .get(`/api/v1/assignment/user/${userId}/project/${selectedProjectId}/tasks`, {
        params: dateParam ? { date: dateParam } : {},
      })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAvailableTasks(data?.availableTasks ?? []);
        setTodayTasks(data?.todayTasks ?? []);
      })
      .catch(() => {
        setAvailableTasks([]);
        setTodayTasks([]);
      })
      .finally(() => setLoading(false));
  }, [open, userId, selectedProjectId, selectedDate]);

  const handleAssign = async (taskId) => {
    setPending(true);
    try {
      await api.post("/api/v1/assignment/assign", {
        userId,
        taskId,
        date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
      });
      const task = availableTasks.find((t) => t.id === taskId);
      if (task) {
        setAvailableTasks((prev) => prev.filter((t) => t.id !== taskId));
        setTodayTasks((prev) => [...prev, task]);
      }
      onSaved?.();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to assign");
    } finally {
      setPending(false);
    }
  };

  const handleRemove = async (taskId) => {
    setPending(true);
    try {
      await api.post("/api/v1/assignment/remove", { userId, taskId });
      const task = todayTasks.find((t) => t.id === taskId);
      if (task) {
        setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
        setAvailableTasks((prev) => [...prev, task]);
      }
      onSaved?.();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to remove");
    } finally {
      setPending(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background border rounded-lg shadow-lg">
        <div className="p-4 border-b flex-shrink-0 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Manage today&apos;s tasks — {userName}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground">
                  Available ({availableTasks.length})
                </h3>
                <ul className="space-y-2 max-h-[280px] overflow-y-auto">
                  {availableTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                    >
                      <span className="truncate flex-1">{task.title}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleAssign(task.id)}
                        className="shrink-0"
                      >
                        <ArrowRight className="h-3 w-3 me-1" />
                        Add
                      </Button>
                    </li>
                  ))}
                  {availableTasks.length === 0 && (
                    <li className="text-sm text-muted-foreground py-4">No available tasks</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground">
                  Today&apos;s tasks ({todayTasks.length})
                </h3>
                <ul className="space-y-2 max-h-[280px] overflow-y-auto">
                  {todayTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                    >
                      <span className="truncate flex-1">{task.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => handleRemove(task.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <ArrowLeft className="h-3 w-3 me-1" />
                        Remove
                      </Button>
                    </li>
                  ))}
                  {todayTasks.length === 0 && (
                    <li className="text-sm text-muted-foreground py-4">No tasks for today</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
