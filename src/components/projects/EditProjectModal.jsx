import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";

export function EditProjectModal({ project, open, onOpenChange, onProjectUpdated }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    projectTypeId: "",
    projectStatusId: "",
    description: "",
    scope: "",
    startDate: null,
    endDate: null,
  });
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  useEffect(() => {
    if (project) {
      const statusId = project.projectStatusId ?? project.projectStatus?.id ?? "";
      setFormData({
        name: project.name || "",
        projectTypeId: project.projectTypeId != null ? String(project.projectTypeId) : (project.projectType?.id != null ? String(project.projectType.id) : ""),
        projectStatusId: statusId !== "" ? String(statusId) : "",
        description: project.description || "",
        scope: project.scope || "",
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
      });
    }
  }, [project]);

  useEffect(() => {
    if (open) {
      api.get("/api/v1/project-types").then((res) => {
        const data = res.data?.projectTypes ?? res.data?.data ?? res.data;
        setProjectTypes(Array.isArray(data) ? data : []);
      }).catch(() => setProjectTypes([]));
      api.get("/api/v1/project-statuses").then((res) => {
        const data = res.data?.projectStatuses ?? res.data?.data ?? res.data;
        setProjectStatuses(Array.isArray(data) ? data : []);
      }).catch(() => setProjectStatuses([]));
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      notifyError(t("projects.nameRequired") || "Project name is required");
      return;
    }
    if (!formData.projectTypeId || !formData.projectStatusId) {
      notifyError(t("projects.typeAndStatusRequired") || "Project type and status are required");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/api/v1/projects/${project.id}`, {
        name: formData.name,
        projectTypeId: formData.projectTypeId ? parseInt(formData.projectTypeId, 10) : undefined,
        projectStatusId: formData.projectStatusId ? parseInt(formData.projectStatusId, 10) : undefined,
        description: formData.description || null,
        scope: formData.scope || null,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
      });
      notifySuccess(t("projects.updated"));
      onProjectUpdated?.();
      onOpenChange(false);
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden border-border bg-card">
        <DialogHeader className="border-b border-border px-6 py-5 pb-4 text-left">
          <DialogTitle className="text-xl font-semibold tracking-[-0.025em] text-foreground">
            {t("projects.editTitle")}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {t("projects.editSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-6 overflow-y-auto flex-1 min-h-0 px-6 py-5 pr-1">
            <section className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("projects.detailsSection")}
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-project-name" className="text-foreground">
                    {t("projects.projectNameRequired")}
                  </Label>
                  <Input
                    id="edit-project-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={t("projects.projectName")}
                    className="bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-project-type" className="text-foreground">
                      {t("projects.projectType")} *
                    </Label>
                    <Select
                      value={formData.projectTypeId}
                      onValueChange={(val) => setFormData({ ...formData, projectTypeId: val })}
                    >
                      <SelectTrigger id="edit-project-type" className="bg-transparent">
                        <SelectValue placeholder={t("projects.selectProjectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-project-status" className="text-foreground">
                      {t("common.status")} *
                    </Label>
                    <Select
                      value={formData.projectStatusId}
                      onValueChange={(val) => setFormData({ ...formData, projectStatusId: val })}
                    >
                      <SelectTrigger id="edit-project-status" className="bg-transparent">
                        <SelectValue placeholder={t("projects.selectStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        {projectStatuses.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-project-description" className="text-foreground">
                    {t("projects.description")}
                  </Label>
                  <Textarea
                    id="edit-project-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[80px] bg-transparent resize-y"
                    placeholder={t("projects.description") + "..."}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-project-scope" className="text-foreground">
                    {t("projects.projectScope")}
                  </Label>
                  <Textarea
                    id="edit-project-scope"
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="min-h-[80px] bg-transparent resize-y"
                    placeholder={t("projects.projectScopePlaceholder")}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("projects.timelineSection")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-foreground" id="edit-project-start-date-label">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {t("projects.startDate")}
                  </Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        aria-haspopup="dialog"
                        aria-expanded={startDateOpen}
                        aria-labelledby="edit-project-start-date-label"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        {formData.startDate ? format(formData.startDate, "PPP") : t("projects.startDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-[200] w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Calendar
                        mode="single"
                        selected={formData.startDate ?? undefined}
                        onSelect={(date) => {
                          setFormData((prev) => ({ ...prev, startDate: date ?? null }));
                          setStartDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-foreground" id="edit-project-end-date-label">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {t("projects.targetEndDate")}
                  </Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        aria-haspopup="dialog"
                        aria-expanded={endDateOpen}
                        aria-labelledby="edit-project-end-date-label"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        {formData.endDate ? format(formData.endDate, "PPP") : t("projects.targetEndDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-[200] w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Calendar
                        mode="single"
                        selected={formData.endDate ?? undefined}
                        onSelect={(date) => {
                          setFormData((prev) => ({ ...prev, endDate: date ?? null }));
                          setEndDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="flex shrink-0 justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="min-w-[80px]">
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
              {t("projects.updateProject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
