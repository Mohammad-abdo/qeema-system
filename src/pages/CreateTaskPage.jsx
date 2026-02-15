import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function CreateTaskPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/users").then((r) => {
      const u = r.data?.users ?? r.data ?? [];
      setUsers(Array.isArray(u) ? u : []);
    }).catch(() => setUsers([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.title?.value?.trim();
    if (!title) {
      notifyError("Title is required");
      return;
    }
    const assigneeIds = [];
    form.querySelectorAll('input[name="assigneeIds"]:checked').forEach((el) => {
      assigneeIds.push(parseInt(el.value, 10));
    });
    setLoading(true);
    try {
      await api.post("/api/v1/tasks", {
        projectId: parseInt(projectId, 10),
        title,
        description: form.description?.value?.trim() || null,
        priority: form.priority?.value || "normal",
        dueDate: form.dueDate?.value || null,
        assigneeIds,
      });
      notifySuccess("Task created");
      navigate(`/dashboard/projects/${projectId}?tab=tasks`, { replace: true });
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Link
        to={`/dashboard/projects/${projectId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to project
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
          <p className="text-sm text-muted-foreground">Add a new task to this project.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="Task title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the task..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="normal"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input type="date" id="dueDate" name="dueDate" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignees</Label>
              <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-2">
                {users.length > 0 ? (
                  users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="assigneeIds" value={user.id} className="rounded border-input" />
                      <span className="text-sm">{user.username}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No users available</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                Create Task
              </Button>
              <Link to={`/dashboard/projects/${projectId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
