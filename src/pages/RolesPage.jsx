import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Shield, Plus, Pencil, Trash2 } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { success as notifySuccess, error as notifyError, confirm as notifyConfirm } from "@/utils/notify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Sheet, SheetTrigger, SheetContent, useSheet } from "@/components/ui/Sheet";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

function AddRoleForm({ onAdded }) {
  const { t } = useTranslation();
  const { setOpen } = useSheet();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/api/v1/rbac/roles", { name: name.trim(), description: description.trim() || null });
      notifySuccess(t("roles.roleCreated"));
      setOpen(false);
      setName("");
      setDescription("");
      onAdded?.();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("roles.addRole")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role-name">{t("roles.roleName")}</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("roles.roleName")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-desc">{t("roles.roleDescription")}</Label>
          <Input
            id="role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("roles.roleDescription")}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("roles.save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("roles.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function EditRoleSheet({ roleId, roleName, onSaved }) {
  const { t } = useTranslation();
  const { setOpen } = useSheet();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(roleName || "");
  const [description, setDescription] = useState("");
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingPerms, setLoadingPerms] = useState(true);

  useEffect(() => {
    setName(roleName || "");
  }, [roleName]);

  useEffect(() => {
    if (!roleId) return;
    setLoadingPerms(true);
    Promise.all([
      api.get("/api/v1/rbac/permissions/list"),
      api.get(`/api/v1/rbac/roles/${roleId}/permissions`),
    ])
      .then(([listRes, roleRes]) => {
        const perms = listRes.data?.permissions ?? [];
        const rolePerms = roleRes.data?.permissions ?? [];
        setAllPermissions(perms);
        setSelectedIds(new Set(rolePerms.map((p) => p.id)));
        setDescription(roleRes.data?.role?.description ?? "");
        if (!roleName) setName(roleRes.data?.role?.name ?? "");
      })
      .catch(() => notifyError("Failed to load permissions"))
      .finally(() => setLoadingPerms(false));
  }, [roleId, roleName]);

  const togglePermission = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/api/v1/rbac/roles/${roleId}`, { name: name.trim(), description: description.trim() || null });
      await api.put(`/api/v1/rbac/roles/${roleId}/permissions`, { permissionIds: Array.from(selectedIds) });
      notifySuccess(t("roles.roleUpdated"));
      setOpen(false);
      onSaved?.();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("roles.editRole")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-role-name">{t("roles.roleName")}</Label>
          <Input
            id="edit-role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-role-desc">{t("roles.roleDescription")}</Label>
          <Input
            id="edit-role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("roles.selectPermissions")}</Label>
          {loadingPerms ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">{t("common.loading") || "Loading…"}</span>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-2">
              {allPermissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => togglePermission(p.id)}
                    className="rounded border-input"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("roles.save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("roles.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function RolesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(() => {
    api
      .get("/api/v1/rbac/roles")
      .then((res) => setRoles(res.data?.roles ?? []))
      .catch(() => setRoles([]));
  }, []);

  const fetchPermissions = useCallback(() => {
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    api
      .get("/api/v1/rbac/permissions", { params: { userId } })
      .then((res) => {
        const p = res.data?.permissions ?? res.data ?? [];
        setPermissions(Array.isArray(p) ? p : []);
      })
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const handleDeleteRole = async (role) => {
    if (role.isSystemRole) {
      notifyError(t("roles.cannotDeleteSystem"));
      return;
    }
    const ok = await notifyConfirm({
      title: t("roles.deleteRole"),
      text: `${t("roles.deleteRole")}: "${role.name}"?`,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/rbac/roles/${role.id}`);
      notifySuccess(t("roles.roleDeleted"));
      fetchRoles();
    } catch (err) {
      notifyError(err?.response?.data?.error || "Failed to delete role");
    }
  };

  const isRtl = i18n.language === "ar";
  const tableDir = isRtl ? "rtl" : "ltr";

  return (
    <div className="space-y-6" dir={tableDir}>
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("roles.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("roles.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t("roles.allRoles")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("roles.permissionsForRole")}</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 me-2" />
                {t("roles.addRole")}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md">
              <AddRoleForm onAdded={fetchRoles} />
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
          {loading && roles.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6">{t("roles.noPermissions")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("roles.roleName")}</TableHead>
                  <TableHead>{t("roles.roleDescription")}</TableHead>
                  <TableHead>{t("roles.permissionsCount")}</TableHead>
                  <TableHead>{t("roles.usersCount")}</TableHead>
                  <TableHead className="text-end">{t("common.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <span>{role.name}</span>
                      {role.isSystemRole && (
                        <Badge variant="secondary" className="ms-2 text-xs">
                          System
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {role.description || "—"}
                    </TableCell>
                    <TableCell>{role.permissionsCount ?? 0}</TableCell>
                    <TableCell>{role.usersCount ?? 0}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 me-1" />
                              {t("roles.managePermissions")}
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full max-w-md overflow-y-auto">
                            <EditRoleSheet
                              roleId={role.id}
                              roleName={role.name}
                              onSaved={fetchRoles}
                            />
                          </SheetContent>
                        </Sheet>
                        {!role.isSystemRole && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteRole(role)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("roles.yourPermissions")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("roles.permissionsForRole")} {permissions.length} {t("roles.permissionsCount")}.
          </p>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("roles.noPermissions")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <Badge key={perm.id ?? perm.name ?? perm} variant="secondary" className="text-xs">
                  {perm.name ?? perm}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
