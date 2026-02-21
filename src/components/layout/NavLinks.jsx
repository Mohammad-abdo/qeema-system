import { useState, useEffect, Children } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Target,
  BarChart3,
  Users,
  Users2,
  Settings,
  FileText,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function NavItem({ to, nameKey, icon: Icon }) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-all duration-[var(--duration-ui)] ease-in-out",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
        )
      }
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {t(nameKey)}
    </NavLink>
  );
}

function NavGroup({ labelKey, icon: Icon, children, defaultOpen }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const location = useLocation();
  const hasActiveChild = Children.toArray(children).some(
    (c) => c?.props?.to === location.pathname || (c?.props?.to && c.props.to !== "/dashboard" && location.pathname.startsWith(c.props.to))
  );

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors duration-[var(--duration-ui)] ease-in-out",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          (open || hasActiveChild) && "text-sidebar-foreground"
        )}
      >
        <span className="flex items-center gap-3">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {t(labelKey)}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function NavLinks() {
  const { user } = useAuth();
  const role = user?.role || "";
  const isAdmin = role === "admin";
  const isLead = role === "team_lead" || isAdmin;

  return (
    <div className="space-y-1">
      <NavItem to="/dashboard" nameKey="nav.dashboard" icon={LayoutDashboard} />

      <NavGroup labelKey="nav.work" icon={FolderKanban} defaultOpen>
        <NavItem to="/dashboard/projects" nameKey="nav.projects" icon={FolderKanban} />
        <NavItem to="/dashboard/tasks" nameKey="nav.tasks" icon={ListTodo} />
        <NavItem to="/dashboard/focus" nameKey="nav.focus" icon={Target} />
        <NavItem to="/dashboard/reports" nameKey="nav.reports" icon={BarChart3} />
        {isLead && <NavItem to="/dashboard/today-tasks-assignment" nameKey="nav.taskAssignment" icon={Calendar} />}
      </NavGroup>

      <NavGroup labelKey="nav.people" icon={Users2}>
        <NavItem to="/dashboard/teams" nameKey="nav.teams" icon={Users2} />
        <NavItem to="/dashboard/users" nameKey="nav.users" icon={Users} />
      </NavGroup>

      {isAdmin && (
        <NavGroup labelKey="nav.admin" icon={FileText}>
          <NavItem to="/dashboard/admin/activity-logs" nameKey="nav.activityLogs" icon={FileText} />
          <NavItem to="/dashboard/admin/roles" nameKey="nav.rolesPermissions" icon={Users} />
        </NavGroup>
      )}

      <NavItem to="/dashboard/settings" nameKey="nav.settings" icon={Settings} />
    </div>
  );
}
