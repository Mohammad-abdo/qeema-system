# Migration Checklist (Strict)

## ✅ Done

- **Notification system**: `src/utils/notify.js` with success, error, warning, info, confirm (react-hot-toast + sweetalert2). `<Toaster />` in root. No window.alert in new code.
- **API**: Centralized `src/services/api.js` – base URL from .env, token interceptor, 401 → redirect /login.
- **Layout**: Dashboard layout – same structure and Tailwind classes as Next.js (sidebar, header, main with Outlet).
- **NavLinks**: Same links and role-based visibility (admin: Activity Logs, Roles; admin/team_lead: Task Assignment).
- **Login page**: Pixel-perfect clone – same DOM, same classes, backend status, Arabic copy, Card/form structure. Uses notify.error on failure.
- **Register page**: Present with link back to login.
- **Dashboard page**: Same structure – header (title, date, DashboardExportButton, Badge), StatCard grid, Urgent section, Focus section. Uses StatCard, StatCardGridSkeleton, CardListSkeleton. DashboardExportButton uses api + success/notifyError.
- **All 22 routes** exist and render (placeholder content where not yet fully migrated).
- **SystemSettingsContext**: Fetches settings when token exists; defaults for login (systemName, logo, allowRegistration).
- **DashboardBranding**: Same as Next (logo/name, Link to /dashboard).

## 🔲 To complete (full pixel-perfect migration)

- **ProjectNotificationsHeader**: Add to dashboard header (next to UserButton) and implement notification dropdown/center.
- **Projects page**: Full clone of ProjectsDashboard (card/table view, filters, project dialogs, create/edit/delete with notify/confirm).
- **Project detail**: Full clone (ProjectHeader, ProjectTabs, productivity, forecasting, urgent banner, tabs: overview, tasks, board, settings, files).
- **Tasks page**: Full clone (TasksDashboard, filters, task dialogs, status update, dependencies, comments, attachments) – all with notify/confirm.
- **Focus page**: Full clone (FocusBoardWrapper, clear-all with confirm).
- **Today-tasks-assignment**: Full clone (AssignmentPageClient, assignment modal, notify on assign/remove).
- **Teams page + Team detail**: Full clone (team list, dialogs, add member/project, remove with confirm).
- **Users page + User detail**: Full clone (user list, user dialog, user actions, delete with confirm).
- **Reports + Reports/progress**: Full clone (tabs, charts, export).
- **Settings + Settings/projects**: Full clone (branding, project types/statuses, task statuses, RBAC, profile, password).
- **Project settings/notifications**: Full clone.
- **Task detail** (nested under project): Full clone.
- **Admin: Activity logs + Roles**: Full clone (roles CRUD, delete with confirm).
- **All forms**: Use notify.success/error on submit; all delete actions use notify.confirm().

## API usage (all via api.js)

- Auth: POST /api/v1/auth/login
- Dashboard: GET /api/v1/dashboard/summary
- Stats export: GET /api/v1/stats/projects
- Projects: GET/POST /api/v1/projects, GET/PATCH/DELETE /api/v1/projects/:id
- Tasks, project-types, project-statuses, task-statuses, users, teams, notifications, activity-logs, rbac, focus, settings – all via same axios instance with token.
