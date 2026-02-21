import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  FolderKanban,
  ListTodo,
  Flag,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import { error as notifyError, success as notifySuccess } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";

function fetchAll(params = {}) {
  const includeInactive = params.includeInactive !== false ? "true" : "false";
  return Promise.all([
    api.get("/api/v1/project-types", { params: { includeInactive } }).catch(() => ({ data: {} })),
    api.get("/api/v1/project-statuses", { params: { includeInactive } }).catch(() => ({ data: {} })),
    api.get("/api/v1/task-statuses", { params: { includeInactive } }).catch(() => ({ data: {} })),
  ]).then(([typesRes, statusesRes, taskRes]) => ({
    projectTypes: Array.isArray(typesRes.data?.projectTypes) ? typesRes.data.projectTypes : typesRes.data ? (Array.isArray(typesRes.data) ? typesRes.data : []) : [],
    projectStatuses: Array.isArray(statusesRes.data?.projectStatuses) ? statusesRes.data.projectStatuses : statusesRes.data ? (Array.isArray(statusesRes.data) ? statusesRes.data : []) : [],
    taskStatuses: Array.isArray(taskRes.data?.taskStatuses) ? taskRes.data.taskStatuses : taskRes.data ? (Array.isArray(taskRes.data) ? taskRes.data : []) : [],
  }));
}

export default function SettingsProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [projectTypeModal, setProjectTypeModal] = useState({ open: false, edit: null });
  const [projectStatusModal, setProjectStatusModal] = useState({ open: false, edit: null });
  const [taskStatusModal, setTaskStatusModal] = useState({ open: false, edit: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAll({ includeInactive: true })
      .then(({ projectTypes: t, projectStatuses: s, taskStatuses: ts }) => {
        setProjectTypes(t);
        setProjectStatuses(s);
        setTaskStatuses(ts);
      })
      .catch(() => {
        notifyError(t("settingsProjects.failedLoad"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateProjectType = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("settingsProjects.nameRequired"));
      return;
    }
    setSaving(true);
    api
      .post("/api/v1/project-types", {
        name,
        description: form.description?.value?.trim() || null,
        color: form.color?.value?.trim() || null,
        icon: form.icon?.value?.trim() || null,
      })
      .then(() => {
        notifySuccess(t("settingsProjects.created"));
        setProjectTypeModal({ open: false, edit: null });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        notifyError(msg && msg.includes("already exists") ? t("settingsProjects.alreadyExists") : msg || "Failed to create");
      })
      .finally(() => setSaving(false));
  };

  const handleUpdateProjectType = (e) => {
    e.preventDefault();
    const id = projectTypeModal.edit?.id;
    if (!id) return;
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("settingsProjects.nameRequired"));
      return;
    }
    setSaving(true);
    api
      .put(`/api/v1/project-types/${id}`, {
        name,
        description: form.description?.value?.trim() || null,
        color: form.color?.value?.trim() || null,
        icon: form.icon?.value?.trim() || null,
      })
      .then(() => {
        notifySuccess(t("settingsProjects.updated"));
        setProjectTypeModal({ open: false, edit: null });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        notifyError(msg && msg.includes("already exists") ? t("settingsProjects.alreadyExists") : msg || "Failed to update");
      })
      .finally(() => setSaving(false));
  };

  const handleCreateProjectStatus = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("settingsProjects.nameRequired"));
      return;
    }
    setSaving(true);
    api
      .post("/api/v1/project-statuses", {
        name,
        color: form.color?.value?.trim() || undefined,
        isDefault: form.isDefault?.checked ?? false,
        isFinal: form.isFinal?.checked ?? false,
        isUrgent: form.isUrgent?.checked ?? false,
        isActive: form.isActive?.checked !== false,
      })
      .then(() => {
        notifySuccess(t("settingsProjects.created"));
        setProjectStatusModal({ open: false, edit: null });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        notifyError(msg && msg.includes("already exists") ? t("settingsProjects.alreadyExists") : msg || "Failed to create");
      })
      .finally(() => setSaving(false));
  };

  const handleUpdateProjectStatus = (e) => {
    e.preventDefault();
    const id = projectStatusModal.edit?.id;
    if (!id) return;
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("settingsProjects.nameRequired"));
      return;
    }
    setSaving(true);
    api
      .put(`/api/v1/project-statuses/${id}`, {
        name,
        color: form.color?.value?.trim() || undefined,
        isDefault: form.isDefault?.checked ?? false,
        isFinal: form.isFinal?.checked ?? false,
        isUrgent: form.isUrgent?.checked ?? false,
        isActive: form.isActive?.checked !== false,
      })
      .then(() => {
        notifySuccess(t("settingsProjects.updated"));
        setProjectStatusModal({ open: false, edit: null });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        notifyError(msg && msg.includes("already exists") ? t("settingsProjects.alreadyExists") : msg || "Failed to update");
      })
      .finally(() => setSaving(false));
  };

  const handleCreateTaskStatus = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("settingsProjects.nameRequired"));
      return;
    }
    setSaving(true);
    api
      .post("/api/v1/task-statuses", {
        name,
        color: form.color?.value?.trim() || undefined,
        isDefault: form.isDefault?.checked ?? false,
        isFinal: form.isFinal?.checked ?? false,
        isBlocking: form.isBlocking?.checked ?? false,
        isActive: form.isActive?.checked !== false,
      })
      .then(() => {
        notifySuccess(t("settingsProjects.created"));
        setTaskStatusModal({ open: false, edit: null });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        notifyError(msg && msg.includes("already exists") ? t("settingsProjects.alreadyExists") : msg || "Failed to create");
      })
      .finally(() => setSaving(false));
  };

  const handleUpdateTaskStatus = (e) => {
    e.preventDefault();
    const id = taskStatusModal.edit?.id;
    if (!id) return;
    const form = e.target;
    const name = form.name?.value?.trim();
    if (!name) {
      notifyError(t("settingsProjects.nameRequired"));
      return;
    }
    setSaving(true);
    api
      .put(`/api/v1/task-statuses/${id}`, {
        name,
        color: form.color?.value?.trim() || undefined,
        isDefault: form.isDefault?.checked ?? false,
        isFinal: form.isFinal?.checked ?? false,
        isBlocking: form.isBlocking?.checked ?? false,
        isActive: form.isActive?.checked !== false,
      })
      .then(() => {
        notifySuccess(t("settingsProjects.updated"));
        setTaskStatusModal({ open: false, edit: null });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        notifyError(msg && msg.includes("already exists") ? t("settingsProjects.alreadyExists") : msg || "Failed to update");
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;
    setDeleting(true);
    const base = type === "projectType" ? "/api/v1/project-types" : type === "projectStatus" ? "/api/v1/project-statuses" : "/api/v1/task-statuses";
    api
      .delete(`${base}/${id}`)
      .then(() => {
        notifySuccess(t("settingsProjects.deleted"));
        setDeleteConfirm({ open: false, type: null, id: null, name: "" });
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error;
        const isInUse = msg && (msg.includes("using") || msg.includes("Cannot delete"));
        notifyError(isInUse ? t("settingsProjects.inUse") : msg || "Failed to delete");
      })
      .finally(() => setDeleting(false));
  };

  if (user && user.role !== "admin") {
    return <Navigate to="/dashboard/settings" replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t("settingsProjects.title")}</h1>
      <p className="text-muted-foreground">{t("settingsProjects.subtitle")}</p>

      {loading ? (
        <ContentSkeleton className="space-y-6" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Project Types */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                <CardTitle className="text-lg">{t("settingsProjects.projectTypes")}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProjectTypeModal({ open: true, edit: null })}
              >
                <Plus className="h-4 w-4 me-1" />
                {t("common.add")}
              </Button>
            </CardHeader>
            <CardContent>
              {projectTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("settingsProjects.noTypes")}</p>
              ) : (
                <ul className="space-y-2">
                  {projectTypes.map((pt) => (
                    <li
                      key={pt.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{pt.name}</span>
                        {pt.color && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-border"
                            style={{ backgroundColor: pt.color }}
                            title={pt.color}
                          />
                        )}
                        {pt.isActive === false && (
                          <Badge variant="secondary" className="text-xs shrink-0">{t("settingsProjects.activeLabel")}: off</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setProjectTypeModal({ open: true, edit: pt })}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ open: true, type: "projectType", id: pt.id, name: pt.name })}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Project Statuses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                <CardTitle className="text-lg">{t("settingsProjects.projectStatuses")}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProjectStatusModal({ open: true, edit: null })}
              >
                <Plus className="h-4 w-4 me-1" />
                {t("common.add")}
              </Button>
            </CardHeader>
            <CardContent>
              {projectStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("settingsProjects.noStatuses")}</p>
              ) : (
                <ul className="space-y-2">
                  {projectStatuses.map((ps) => (
                    <li
                      key={ps.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="truncate">{ps.name}</span>
                        {ps.color && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-border"
                            style={{ backgroundColor: ps.color }}
                            title={ps.color}
                          />
                        )}
                        <div className="flex gap-1 shrink-0">
                          {ps.isDefault && <Badge variant="outline" className="text-xs">{t("settingsProjects.defaultLabel")}</Badge>}
                          {ps.isFinal && <Badge variant="secondary" className="text-xs">{t("settingsProjects.final")}</Badge>}
                          {ps.isUrgent && <Badge variant="outline" className="text-xs">{t("settingsProjects.urgentLabel")}</Badge>}
                          {ps.isActive === false && <Badge variant="secondary" className="text-xs">{t("settingsProjects.activeLabel")}: off</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setProjectStatusModal({ open: true, edit: ps })}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ open: true, type: "projectStatus", id: ps.id, name: ps.name })}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Task Statuses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                <CardTitle className="text-lg">{t("settingsProjects.taskStatuses")}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTaskStatusModal({ open: true, edit: null })}
              >
                <Plus className="h-4 w-4 me-1" />
                {t("common.add")}
              </Button>
            </CardHeader>
            <CardContent>
              {taskStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("settingsProjects.noTaskStatuses")}</p>
              ) : (
                <ul className="space-y-2">
                  {taskStatuses.map((ts) => (
                    <li
                      key={ts.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="truncate">{ts.name}</span>
                        {ts.color && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-border"
                            style={{ backgroundColor: ts.color }}
                            title={ts.color}
                          />
                        )}
                        <div className="flex gap-1 shrink-0">
                          {ts.isFinal && <Badge variant="secondary" className="text-xs">{t("settingsProjects.final")}</Badge>}
                          {ts.isBlocking && <Badge variant="outline" className="text-xs">{t("settingsProjects.blocking")}</Badge>}
                          {ts.isActive === false && <Badge variant="secondary" className="text-xs">{t("settingsProjects.activeLabel")}: off</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setTaskStatusModal({ open: true, edit: ts })}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ open: true, type: "taskStatus", id: ts.id, name: ts.name })}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Type modal */}
      <Dialog open={projectTypeModal.open} onOpenChange={(open) => !open && setProjectTypeModal({ open: false, edit: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{projectTypeModal.edit ? t("settingsProjects.editProjectType") : t("settingsProjects.addProjectType")}</DialogTitle>
            <DialogDescription>{t("settingsProjects.nameLabel")} is required.</DialogDescription>
          </DialogHeader>
          <form onSubmit={projectTypeModal.edit ? handleUpdateProjectType : handleCreateProjectType} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pt-name">{t("settingsProjects.nameLabel")} *</Label>
              <Input
                id="pt-name"
                name="name"
                defaultValue={projectTypeModal.edit?.name}
                required
                placeholder="e.g. Software"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-description">{t("settingsProjects.descriptionLabel")}</Label>
              <Input id="pt-description" name="description" defaultValue={projectTypeModal.edit?.description} placeholder="Optional" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-color">{t("settingsProjects.colorLabel")}</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="pt-color-picker"
                  className="h-9 w-14 rounded border border-input cursor-pointer"
                  defaultValue={projectTypeModal.edit?.color || "#6b7280"}
                  onChange={(e) => {
                    const text = document.getElementById("pt-color");
                    if (text) text.value = e.target.value;
                  }}
                />
                <Input id="pt-color" name="color" defaultValue={projectTypeModal.edit?.color} placeholder="#6b7280" className="flex-1 font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-icon">{t("settingsProjects.iconLabel")}</Label>
              <Input id="pt-icon" name="icon" defaultValue={projectTypeModal.edit?.icon} placeholder="Optional" className="w-full" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProjectTypeModal({ open: false, edit: null })}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Status modal */}
      <Dialog open={projectStatusModal.open} onOpenChange={(open) => !open && setProjectStatusModal({ open: false, edit: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{projectStatusModal.edit ? t("settingsProjects.editProjectStatus") : t("settingsProjects.addProjectStatus")}</DialogTitle>
            <DialogDescription>{t("settingsProjects.nameLabel")} is required.</DialogDescription>
          </DialogHeader>
          <form onSubmit={projectStatusModal.edit ? handleUpdateProjectStatus : handleCreateProjectStatus} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ps-name">{t("settingsProjects.nameLabel")} *</Label>
              <Input
                id="ps-name"
                name="name"
                defaultValue={projectStatusModal.edit?.name}
                required
                placeholder="e.g. Active"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ps-color">{t("settingsProjects.colorLabel")}</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="ps-color-picker"
                  className="h-9 w-14 rounded border border-input cursor-pointer"
                  defaultValue={projectStatusModal.edit?.color || "#6b7280"}
                  onChange={(e) => {
                    const text = document.getElementById("ps-color");
                    if (text) text.value = e.target.value;
                  }}
                />
                <Input id="ps-color" name="color" defaultValue={projectStatusModal.edit?.color} placeholder="#6b7280" className="flex-1 font-mono text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isDefault" defaultChecked={projectStatusModal.edit?.isDefault} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.defaultLabel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isFinal" defaultChecked={projectStatusModal.edit?.isFinal} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.finalLabel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isUrgent" defaultChecked={projectStatusModal.edit?.isUrgent} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.urgentLabel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" defaultChecked={projectStatusModal.edit?.isActive !== false} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.activeLabel")}</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProjectStatusModal({ open: false, edit: null })}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Status modal */}
      <Dialog open={taskStatusModal.open} onOpenChange={(open) => !open && setTaskStatusModal({ open: false, edit: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{taskStatusModal.edit ? t("settingsProjects.editTaskStatus") : t("settingsProjects.addTaskStatus")}</DialogTitle>
            <DialogDescription>{t("settingsProjects.nameLabel")} is required.</DialogDescription>
          </DialogHeader>
          <form onSubmit={taskStatusModal.edit ? handleUpdateTaskStatus : handleCreateTaskStatus} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ts-name">{t("settingsProjects.nameLabel")} *</Label>
              <Input
                id="ts-name"
                name="name"
                defaultValue={taskStatusModal.edit?.name}
                required
                placeholder="e.g. In Progress"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ts-color">{t("settingsProjects.colorLabel")}</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="ts-color-picker"
                  className="h-9 w-14 rounded border border-input cursor-pointer"
                  defaultValue={taskStatusModal.edit?.color || "#6b7280"}
                  onChange={(e) => {
                    const text = document.getElementById("ts-color");
                    if (text) text.value = e.target.value;
                  }}
                />
                <Input id="ts-color" name="color" defaultValue={taskStatusModal.edit?.color} placeholder="#6b7280" className="flex-1 font-mono text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isDefault" defaultChecked={taskStatusModal.edit?.isDefault} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.defaultLabel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isFinal" defaultChecked={taskStatusModal.edit?.isFinal} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.finalLabel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isBlocking" defaultChecked={taskStatusModal.edit?.isBlocking} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.blockingLabel")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" defaultChecked={taskStatusModal.edit?.isActive !== false} className="rounded border-input" />
                <span className="text-sm">{t("settingsProjects.activeLabel")}</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskStatusModal({ open: false, edit: null })}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, type: null, id: null, name: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>
              {deleteConfirm.type === "projectType" && t("settingsProjects.deleteProjectTypeConfirm", { name: deleteConfirm.name })}
              {deleteConfirm.type === "projectStatus" && t("settingsProjects.deleteProjectStatusConfirm", { name: deleteConfirm.name })}
              {deleteConfirm.type === "taskStatus" && t("settingsProjects.deleteTaskStatusConfirm", { name: deleteConfirm.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: "" })}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
