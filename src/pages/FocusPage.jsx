import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Loader2, Target, Trash2 } from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FocusSummary } from "@/components/focus/FocusSummary";

function DataColumn({ id, tasks, isPlaceholder }) {
  return (
    <Droppable droppableId={id}>
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="h-full p-4 overflow-y-auto space-y-3 min-h-[100px]"
        >
          {isPlaceholder ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
              <Target className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-center">
                Drag tasks from your library
                <br />
                Or start by clicking on a task
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{task.project?.name}</span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1">
                            {task.priority || "normal"}
                          </Badge>
                          {task.status && task.status !== "pending" && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1">
                              {task.status}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default function FocusPage() {
  const { t } = useTranslation();
  const [focusTasks, setFocusTasks] = useState([]);
  const [libraryTasks, setLibraryTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const fetchFocus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/focus/data");
      const data = res.data?.data ?? res.data;
      setFocusTasks(data?.focusTasks ?? []);
      setLibraryTasks(data?.libraryTasks ?? []);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to load focus";
      setError(msg);
      notifyError(msg);
      setFocusTasks([]);
      setLibraryTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFocus();
  }, []);

  const setTaskPlannedDate = async (taskId, date) => {
    try {
      await api.patch(`/api/v1/tasks/${taskId}`, {
        plannedDate: date ? new Date(date).toISOString() : null,
      });
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to update task");
      fetchFocus();
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (source.droppableId === "library" && destination.droppableId === "focus") {
      const task = libraryTasks[source.index];
      const newLibrary = [...libraryTasks];
      newLibrary.splice(source.index, 1);
      const newFocus = [...focusTasks];
      newFocus.splice(destination.index, 0, task);
      setLibraryTasks(newLibrary);
      setFocusTasks(newFocus);
      setPending(true);
      setTaskPlannedDate(task.id, todayStart).finally(() => setPending(false));
    } else if (source.droppableId === "focus" && destination.droppableId === "library") {
      const task = focusTasks[source.index];
      const newFocus = [...focusTasks];
      newFocus.splice(source.index, 1);
      const newLibrary = [...libraryTasks];
      newLibrary.splice(destination.index, 0, task);
      setFocusTasks(newFocus);
      setLibraryTasks(newLibrary);
      setPending(true);
      setTaskPlannedDate(task.id, null).finally(() => setPending(false));
    } else if (source.droppableId === destination.droppableId) {
      const items = source.droppableId === "focus" ? [...focusTasks] : [...libraryTasks];
      const [reordered] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reordered);
      if (source.droppableId === "focus") setFocusTasks(items);
      else setLibraryTasks(items);
    }
  };

  const onClearFocus = async () => {
    if (focusTasks.length === 0) return;
    setPending(true);
    try {
      await api.post("/api/v1/focus/clear-my");
      setLibraryTasks((prev) => [...prev, ...focusTasks]);
      setFocusTasks([]);
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to clear focus");
      fetchFocus();
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <h3 className="text-lg font-bold">{t("dashboard.errorLoading", "Error Loading Focus Board")}</h3>
        <p className="mt-2">{t("dashboard.refreshHint")} ({error})</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.focusTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.focusSubtitle")}</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center text-blue-600 dark:text-blue-300 font-medium">
        Let&apos;s make today count!
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[400px]">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* My Tasks Library */}
          <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-primary">+</span> My Tasks Library
              </h3>
              <p className="text-sm text-muted-foreground">{libraryTasks.length} tasks available</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <DataColumn id="library" tasks={libraryTasks} />
            </div>
          </div>

          {/* Today's Focus Board */}
          <div className="flex flex-col h-full bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/50 dark:to-background rounded-xl border border-blue-200 dark:border-blue-900/30 shadow-md overflow-hidden">
            <div className="p-4 border-b border-blue-100 dark:border-blue-900/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Target className="h-4 w-4" /> Today&apos;s Focus Board
                </h3>
                {focusTasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFocus}
                    disabled={pending}
                    className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                  >
                    <Trash2 className="h-4 w-4 me-1" /> Clear
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Drag tasks here to work on today</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <DataColumn id="focus" tasks={focusTasks} isPlaceholder={focusTasks.length === 0} />
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col h-full">
            <FocusSummary tasks={focusTasks} />
          </div>
        </DragDropContext>
      </div>

      {pending && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-background border rounded-lg px-4 py-2 shadow-lg z-50">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Updating...</span>
        </div>
      )}
    </div>
  );
}
