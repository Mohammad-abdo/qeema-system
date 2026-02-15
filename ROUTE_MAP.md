# Route Map: Next.js → React

## Next.js (source) – `frontend/src/app/`

| Route | File | Notes |
|-------|------|--------|
| `/` | `page.tsx` | Home redirect |
| `/login` | `login/page.tsx` | Login |
| `/register` | `register/page.tsx` | Register |
| `/dashboard` | `dashboard/page.tsx` | Dashboard index |
| `/dashboard/projects` | `dashboard/projects/page.tsx` | Projects list |
| `/dashboard/projects/[id]` | `dashboard/projects/[id]/page.tsx` | Project detail |
| `/dashboard/projects/[id]/settings` | `dashboard/projects/[id]/settings/page.tsx` | Project settings |
| `/dashboard/projects/[id]/notifications` | `dashboard/projects/[id]/notifications/page.tsx` | Project notifications |
| `/dashboard/projects/[id]/tasks/[taskId]` | `dashboard/projects/[id]/tasks/[taskId]/page.tsx` | Task detail (under project) |
| `/dashboard/tasks` | `dashboard/tasks/page.tsx` | All tasks |
| `/dashboard/focus` | `dashboard/focus/page.tsx` | Today's focus |
| `/dashboard/today-tasks-assignment` | `dashboard/today-tasks-assignment/page.tsx` | Task assignment |
| `/dashboard/teams` | `dashboard/teams/page.tsx` | Teams list |
| `/dashboard/teams/[id]` | `dashboard/teams/[id]/page.tsx` | Team detail |
| `/dashboard/users` | `dashboard/users/page.tsx` | Users list |
| `/dashboard/users/[id]` | `dashboard/users/[id]/page.tsx` | User detail |
| `/dashboard/reports` | `dashboard/reports/page.tsx` | Reports |
| `/dashboard/reports/progress` | `dashboard/reports/progress/page.tsx` | Progress report |
| `/dashboard/settings` | `dashboard/settings/page.tsx` | Settings |
| `/dashboard/settings/projects` | `dashboard/settings/projects/page.tsx` | Project metadata settings |
| `/dashboard/admin/activity-logs` | `dashboard/admin/activity-logs/page.tsx` | Activity logs |
| `/dashboard/admin/roles` | `dashboard/admin/roles/page.tsx` | Roles & permissions |

**Total Next.js dashboard routes: 22 (excluding /, /login, /register).**

---

## React (current) – `frontend-react/src/App.jsx` + `src/pages/`

| React Route | Component | Next.js equivalent |
|-------------|-----------|--------------------|
| `/` | HomeRedirect | `/` |
| `/login` | LoginPage | `/login` |
| `/register` | RegisterPage | `/register` |
| `/dashboard` | DashboardPage | `/dashboard` |
| `/dashboard/projects` | ProjectsPage | `/dashboard/projects` |
| `/dashboard/projects/:id` | ProjectDetailPage | `/dashboard/projects/[id]` |
| `/dashboard/projects/:id/settings` | ProjectSettingsPage | `/dashboard/projects/[id]/settings` |
| `/dashboard/projects/:id/notifications` | ProjectNotificationsPage | `/dashboard/projects/[id]/notifications` |
| `/dashboard/projects/:id/tasks/:taskId` | TaskDetailPage | `/dashboard/projects/[id]/tasks/[taskId]` |
| `/dashboard/tasks` | TasksPage | `/dashboard/tasks` |
| `/dashboard/focus` | FocusPage | `/dashboard/focus` |
| `/dashboard/today-tasks-assignment` | TodayTasksAssignmentPage | `/dashboard/today-tasks-assignment` |
| `/dashboard/teams` | TeamsPage | `/dashboard/teams` |
| `/dashboard/teams/:id` | TeamDetailPage | `/dashboard/teams/[id]` |
| `/dashboard/users` | UsersPage | `/dashboard/users` |
| `/dashboard/users/:id` | UserDetailPage | `/dashboard/users/[id]` |
| `/dashboard/reports` | ReportsPage | `/dashboard/reports` |
| `/dashboard/reports/progress` | ReportsProgressPage | `/dashboard/reports/progress` |
| `/dashboard/settings` | SettingsPage | `/dashboard/settings` |
| `/dashboard/settings/projects` | SettingsProjectsPage | `/dashboard/settings/projects` |
| `/dashboard/admin/activity-logs` | ActivityLogsPage | `/dashboard/admin/activity-logs` |
| `/dashboard/admin/roles` | RolesPage | `/dashboard/admin/roles` |

**Total React dashboard routes: 22. Parity: 1:1.**

---

## Dynamic segments

- Next `[id]` → React `:id`
- Next `[taskId]` → React `:taskId`
- Use `useParams()` in React to read `id`, `taskId`.

---

## Task detail links

- From **Tasks list**: link to `/dashboard/projects/${task.projectId}/tasks/${task.id}` or `/dashboard/tasks/${task.id}` (both work).
- From **Project detail**: link to `/dashboard/projects/${id}/tasks/${task.id}`.
- Standalone **task detail** route: `/dashboard/tasks/:taskId` (no project in path).

---

## Backend connectivity (why "no data" can happen)

1. **CORS**  
   Backend now allows by default: `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:5173`.  
   If your React app runs on another port, set `CORS_ORIGIN` or `CORS_ORIGINS` in backend `.env`.

2. **API base URL**  
   In frontend `.env` set:
   ```bash
   VITE_API_URL=http://127.0.0.1:4000
   ```
   (No trailing slash, no `/api/v1` — the app adds that to each request.)

3. **Auth**  
   Login stores a JWT; every API request sends `Authorization: Bearer <token>`.  
   Backend uses `NEXTAUTH_SECRET` (or fallback `your-secret-key`) to verify.  
   If you get 401 on all pages after login, set `NEXTAUTH_SECRET` in backend `.env` and restart the backend.

4. **Backend must be running**  
   Start with `npm run dev` (or equivalent) in the `backend` folder so it listens on port 4000 (or your `PORT`).
