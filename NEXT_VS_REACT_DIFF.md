# Next.js vs React — Difference Report (Strict Clone)

## 1. Visual / CSS

| Item | Next.js | React | Action |
|------|---------|--------|--------|
| Body font | Inter (layout.tsx) | Alexandria (index.css) | Use Inter in React to match |
| Root wrapper | `div.h-screen.bg-gray-50` | Same | OK |
| Card base | `flex flex-col gap-6 rounded-xl border py-6 shadow-sm` | `rounded-xl border ... shadow` (no flex, gap, py-6) | Align React Card to Next |
| CardHeader (Next default) | Grid, `px-6`, gap-2 | `p-6`, space-y-1.5 | Align React CardHeader/CardContent to Next |
| CardContent (Next) | `px-6` | `p-6 pt-0` | Use px-6, no pt-0 |
| Dashboard page wrapper | `div.space-y-6` (no font class) | `div.space-y-6.font-alexandria` | Remove font-alexandria for match or keep for i18n |

## 2. Layout structure

| Component | Next | React | Status |
|-----------|------|--------|--------|
| Dashboard layout | flex h-screen, sidebar md:w-64 lg:w-72, main flex-1 overflow-y-auto p-4 md:p-6 | Same | OK |
| Sidebar "Menu" label | Hardcoded "Menu" | t("nav.menu") | OK (i18n) |
| Header | h-14, border-b, gap-4, Sheet + UserButton + ProjectNotificationsHeader | + LanguageSwitch in React | OK (extra feature) |

## 3. Dashboard page

| Element | Next | React |
|---------|------|--------|
| Title | "Dashboard" | t("dashboard.title") |
| Role badge | "Admin" \| "Project Manager" \| "Developer" | t("dashboard.roleAdmin") etc. |
| My Tasks link | `/dashboard/tasks?assignee=me` | `/dashboard/tasks?assigneeId=me` | Align to assignee=me in URL |
| Stats grid | grid gap-4 md:grid-cols-2 lg:grid-cols-4 | Same | OK |
| Task statuses section | grid gap-4 md:grid-cols-2 lg:grid-cols-4 + h2 "Task Statuses" | Same | OK |
| Today's Tasks section | grid gap-4 md:grid-cols-2 | Same | OK |

## 4. API / behavior

| Area | Next | React |
|------|------|--------|
| Tasks filters (URL) | assignee, project, status, priority, view, page | assigneeId, projectId, status, page | Align URL param names to Next (assignee, project) and map to API (assigneeId, projectId) |
| Projects filters (URL) | category, status, projectManager, view, page | Same idea | Verify param names match |

## 5. Component hierarchy

- Next: Tasks page → TasksDashboard (client) with TasksSearchBar, TasksFilters, TasksViewSwitcher, Card/Table view.
- React: TasksPage with inline filters and card grid (no table view, no view switcher).
- Next: Projects page → wrapper div.space-y-6 → ProjectsDashboard.
- React: ProjectsPage with own layout (may lack stats bar, view switcher, same filters).

## 6. Fixes applied (Phase 1)

1. **Global:** Inter font in React; body uses Inter (RTL uses Alexandria).
2. **Card:** React Card aligned to Next (flex flex-col gap-6 rounded-xl border py-6 shadow-sm, CardHeader/CardContent px-6).
3. **Dashboard:** My Tasks href uses `assignee=me`; all `font-alexandria` removed from dashboard and layout.
4. **Tasks URL:** TasksPage uses `assignee` and `project` in URL; API still gets assigneeId/projectId.
5. **Layout:** Sidebar "Menu" label no longer uses font-alexandria.

## 7. Remaining for full parity

- Tasks: view switcher (card/table), full filters, table view.
- Projects: view switcher, filters/URL params (category, projectManager), same layout.
- Other pages: compare structure/behavior to Next and align.
