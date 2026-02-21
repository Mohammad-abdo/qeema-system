import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, FolderKanban, Loader2, Image, Upload, Activity, Users, Settings2 } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { success as notifySuccess, error as notifyError } from "@/utils/notify";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings: systemSettings, refreshSettings } = useSystemSettings();
  const [profile, setProfile] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [branding, setBranding] = useState({
    systemName: systemSettings.systemName || "Qeema Tech Management",
    systemLogo: systemSettings.systemLogo || "",
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const logoFileInputRef = useRef(null);
  const [adminPermissions, setAdminPermissions] = useState([]);

  useEffect(() => {
    const id = user?.id;
    if (!id) {
      setLoading(false);
      setProfile({ username: user?.name ?? "", email: user?.email ?? "" });
      return;
    }
    api
      .get(`/api/v1/users/${id}`)
      .then((res) => {
        const u = res.data;
        setProfile({
          username: u.username ?? "",
          email: u.email ?? "",
        });
      })
      .catch(() => setProfile({ username: user?.name ?? "", email: user?.email ?? "" }))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin && user?.id) {
      api.get("/api/v1/rbac/permissions", { params: { userId: user.id } })
        .then((res) => {
          const p = res.data?.permissions ?? res.data ?? [];
          setAdminPermissions(Array.isArray(p) ? p : []);
        })
        .catch(() => setAdminPermissions([]));
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    setBranding((b) => ({
      systemName: systemSettings.systemName || b.systemName,
      systemLogo: systemSettings.systemLogo || b.systemLogo,
    }));
  }, [systemSettings.systemName, systemSettings.systemLogo]);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post("/api/v1/settings/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url;
      if (url) setBranding((prev) => ({ ...prev, systemLogo: url }));
    } catch (err) {
      notifyError(err?.response?.data?.error || t("toast.settingsError"));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const systemName = form.systemName?.value?.trim() || "Qeema Tech Management";
    const systemLogo = branding.systemLogo || form.systemLogo?.value?.trim() || "/assets/logo.png";
    setSavingBranding(true);
    try {
      await api.put("/api/v1/settings/system", {
        key: "general",
        value: JSON.stringify({
          systemName,
          systemLogo,
          allowRegistration: systemSettings.allowRegistration !== false,
        }),
        category: "branding",
      });
      notifySuccess(t("toast.settingsSaved"));
      refreshSettings();
    } catch (err) {
      notifyError(err?.response?.data?.error || t("toast.settingsError"));
    } finally {
      setSavingBranding(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username?.value?.trim();
    const email = form.email?.value?.trim();
    if (!username) {
      notifyError(t("settings.usernameRequired"));
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch(`/api/v1/users/${user.id}`, { username, email: email || undefined });
      notifySuccess(t("settings.profileUpdated"));
      setProfile({ username, email: email || "" });
    } catch (err) {
      notifyError(err?.response?.data?.error || t("settings.profileUpdateFailed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const current = form.currentPassword?.value;
    const newPass = form.newPassword?.value;
    if (!newPass || newPass.length < 6) {
      notifyError(t("settings.passwordMinLength"));
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        currentPassword: current,
        newPassword: newPass,
      });
      notifySuccess(t("settings.passwordUpdated"));
      form.reset();
    } catch (err) {
      notifyError(err?.response?.data?.error || t("settings.changePasswordFailed"));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <ContentSkeleton className="space-y-6" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title font-alexandria">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1 font-alexandria">{t("settings.subtitle")}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link to="/dashboard/admin/roles">
              <Button variant="outline">
                <Shield className="h-4 w-4 me-2" />
                {t("settings.manageRoles")}
              </Button>
            </Link>
            <Link to="/dashboard/settings/projects">
              <Button variant="outline">
                <FolderKanban className="h-4 w-4 me-2" />
                {t("settings.projectMetadata")}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="p-1 flex flex-wrap">
          <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("settings.preferences")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="branding">{t("settings.branding")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {isAdmin && (
            <Card className="rounded-xl border-0 bg-card/80 backdrop-blur-sm shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-primary" />
                {t("settings.adminProfile")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{t("settings.adminProfileSubtitle")}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("settings.yourRole")}</p>
                  <Badge variant="default" className="capitalize">{(user?.role || "admin").replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("settings.yourPermissions")}</p>
                  <p className="text-sm font-medium">{t("settings.permissionsCount", { count: adminPermissions.length })}</p>
                  {adminPermissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto">
                      {adminPermissions.slice(0, 12).map((perm, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">{typeof perm === "string" ? perm : perm.name ?? perm.key}</Badge>
                      ))}
                      {adminPermissions.length > 12 && <span className="text-xs text-muted-foreground">+{adminPermissions.length - 12}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t("settings.quickLinks")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/admin/activity-logs">
                      <Activity className="h-4 w-4 me-2" />
                      {t("settings.activityLogsLink")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/admin/roles">
                      <Users className="h-4 w-4 me-2" />
                      {t("settings.rolesPermissionsLink")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/settings/projects">
                      <Settings2 className="h-4 w-4 me-2" />
                      {t("settings.projectMetadataLink")}
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
          <Card className="border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-4">{t("settings.profileInfo")}</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  name="username"
                  defaultValue={profile.username}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("settings.saveProfile")}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-4">{t("settings.changePassword")}</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder={t("settings.currentPasswordPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  minLength={6}
                  placeholder={t("settings.newPasswordPlaceholder")}
                />
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("settings.updatePassword")}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">{t("settings.passwordHint")}</p>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">{t("settings.preferences")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.preferencesText")}</p>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="branding" className="space-y-4">
            <Card className="border rounded-lg bg-card">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Image className="h-5 w-5" />
                {t("settings.brandingTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{t("settings.brandingSubtitle")}</p>
              <form onSubmit={handleBrandingSubmit} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="systemName">{t("settings.siteName")}</Label>
                  <Input
                    id="systemName"
                    name="systemName"
                    defaultValue={branding.systemName}
                    placeholder={t("settings.siteNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.uploadLogo")}</Label>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 me-2" />
                    {t("settings.uploadLogo")}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemLogo">{t("settings.logoUrlOrUpload")}</Label>
                  <Input
                    id="systemLogo"
                    name="systemLogo"
                    type="text"
                    value={branding.systemLogo || ""}
                    placeholder={t("settings.logoUrlPlaceholder")}
                    onChange={(e) => setBranding((prev) => ({ ...prev, systemLogo: e.target.value?.trim() || "" }))}
                  />
                </div>
                {branding.systemLogo && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{t("settings.preview")}:</span>
                    <img
                      src={branding.systemLogo}
                      alt="Logo"
                      className="h-10 w-auto max-w-[120px] object-contain border rounded"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <Button type="submit" disabled={savingBranding}>
                  {savingBranding && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t("settings.saveBranding")}
                </Button>
              </form>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
