import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const TaskDetailPage = lazy(() => import("./pages/TaskDetailPage"));
const FocusPage = lazy(() => import("./pages/FocusPage"));
const TodayTasksAssignmentPage = lazy(() => import("./pages/TodayTasksAssignmentPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const TeamDetailPage = lazy(() => import("./pages/TeamDetailPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const UserDetailPage = lazy(() => import("./pages/UserDetailPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ReportsProgressPage = lazy(() => import("./pages/ReportsProgressPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SettingsProjectsPage = lazy(() => import("./pages/SettingsProjectsPage"));
const ProjectSettingsPage = lazy(() => import("./pages/ProjectSettingsPage"));
const ProjectNotificationsPage = lazy(() => import("./pages/ProjectNotificationsPage"));
const CreateTaskPage = lazy(() => import("./pages/CreateTaskPage"));
const ActivityLogsPage = lazy(() => import("./pages/ActivityLogsPage"));
const RolesPage = lazy(() => import("./pages/RolesPage"));

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PageFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <div className="h-screen bg-gray-50">
      <Suspense fallback={<PageFallback />}>
        <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/settings" element={<ProjectSettingsPage />} />
          <Route path="projects/:id/notifications" element={<ProjectNotificationsPage />} />
          <Route path="projects/:id/tasks/new" element={<CreateTaskPage />} />
          <Route path="projects/:id/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="today-tasks-assignment" element={<TodayTasksAssignmentPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:id" element={<TeamDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/progress" element={<ReportsProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/projects" element={<SettingsProjectsPage />} />
          <Route path="admin/activity-logs" element={<ActivityLogsPage />} />
          <Route path="admin/roles" element={<RolesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
