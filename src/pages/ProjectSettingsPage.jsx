import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import api from "@/services/api";
import { error as notifyError } from "@/utils/notify";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/v1/projects/${id}`)
      .then((res) => setProject(res.data?.data ?? res.data))
      .catch((err) => {
        setProject(null);
        notifyError(err?.response?.data?.error || "Failed to load project");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Link to="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
          {t("projects.backToProjects")}
        </Link>
        <p className="text-destructive">{t("projects.projectNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Link
              to={`/dashboard/projects/${id}`}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("projects.backToProject")}
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            {t("projects.projectSettings")}
          </h2>
          <p className="text-muted-foreground mt-1">
            {project.name} — {t("projects.projectSettingsSubtitle")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">{t("projects.projectSettingsSubtitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("projects.settingsApiHint")}</p>
      </div>
    </div>
  );
}
