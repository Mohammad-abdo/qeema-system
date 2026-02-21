import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";
import { cn } from "@/lib/utils";

const STATUS_ORDER = ["pending", "in_progress", "review", "completed", "waiting"];

function normalizeStatusKey(nameOrSlug) {
  if (!nameOrSlug) return "";
  return String(nameOrSlug).toLowerCase().replace(/\s+/g, "_");
}

export function ProjectKanbanBoard({ projectId, tasks = [], onTaskMoved }) {
  const { t } = useTranslation();
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [movingId, setMovingId] = useState(null);

  useEffect(() => {
    api
      .get("/api/v1/task-statuses")
      .then((r) => {
        const list = r.data?.taskStatuses ?? r.data ?? [];
        setTaskStatuses(Array.isArray(list) ? list : []);
      })
      .catch(() => setTaskStatuses([]))
      .finally(() => setLoadingStatuses(false));
  }, []);

  const columns = useMemo(() => {
    const list = taskStatuses.slice();
    list.sort((a, b) => {
      const keyA = normalizeStatusKey(a.slug ?? a.name);
      const keyB = normalizeStatusKey(b.slug ?? b.name);
      const iA = STATUS_ORDER.indexOf(keyA);
      const iB = STATUS_ORDER.indexOf(keyB);
      if (iA === -1 && iB === -1) return (a.id ?? 0) - (b.id ?? 0);
      if (iA === -1) return 1;
      if (iB === -1) return -1;
      return iA - iB;
    });
    return list;
  }, [taskStatuses]);

  const taskToStatusId = (task) => {
    if (task.taskStatusId != null) return task.taskStatusId;
    const taskKey = normalizeStatusKey(task.status);
    const found = taskStatuses.find(
      (s) => normalizeStatusKey(s.slug ?? s.name) === taskKey
    );
    return found?.id ?? null;
  };

  const tasksByColumn = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.id] = [];
    });
    tasks.forEach((task) => {
      const statusId = taskToStatusId(task);
      if (statusId != null && map[statusId]) {
        map[statusId].push(task);
      } else if (columns.length > 0) {
        map[columns[0].id].push(task);
      }
    });
    return map;
  }, [columns, tasks]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destStatusId = parseInt(destination.droppableId, 10);
    const sourceTasks = tasksByColumn[source.droppableId] ?? [];
    const task = sourceTasks[source.index];
    if (!task?.id) return;

    setMovingId(task.id);
    api
      .patch(`/api/v1/tasks/${task.id}`, { taskStatusId: destStatusId })
      .then(() => {
        onTaskMoved?.();
      })
      .catch((err) => {
        notifyError(err?.response?.data?.error || "Failed to update task status");
      })
      .finally(() => setMovingId(null));
  };

  if (loadingStatuses) {
    return <ContentSkeleton className="h-64 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {t("projects.kanbanTitle", "Kanban Board")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("projects.kanbanSubtitle", "Drag and drop tasks to update their status.")}
        </p>
      </div>

      {columns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {t("projects.kanbanNoStatuses", "No task statuses configured. Add statuses in settings to use the board.")}
          </CardContent>
        </Card>
      ) : (
      <div className="flex gap-4 overflow-x-auto pb-2 min-h-[420px]">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex-shrink-0 w-[280px] rounded-xl border border-border bg-muted/20 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{col.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(tasksByColumn[col.id] ?? []).length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={String(col.id)}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[120px]"
                  >
                    {(tasksByColumn[col.id] ?? []).map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={String(task.id)}
                        index={index}
                        isDragDisabled={movingId === task.id}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Link
                              to={`/dashboard/projects/${projectId}/tasks/${task.id}`}
                              className={cn(
                                "block rounded-[var(--radius)] border border-border bg-background p-3 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                snapshot.isDragging && "shadow-lg opacity-90",
                                movingId === task.id && "opacity-60 pointer-events-none"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-sm line-clamp-2 flex-1 min-w-0">
                                  {task.title}
                                </span>
                                {movingId === task.id && (
                                  <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {task.priority && task.priority !== "normal" && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                    {task.priority}
                                  </Badge>
                                )}
                                {task.assignees?.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {task.assignees.length} assignee{task.assignees.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      </div>
      )}
    </div>
  );
}
