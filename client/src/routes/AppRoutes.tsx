import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PublicLayout } from "../components/layout/PublicLayout";
import { LoadingState } from "../components/ui/States";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";
import LandingPage from "../pages/public/LandingPage";
import { LoginPage, RegisterPage } from "../pages/public/AuthPages";
import { NotFoundPage, PrivacyPage, TermsPage } from "../pages/public/LegalPages";
import TrackPage from "../pages/public/TrackPage";
import ProtectedRoute from "./ProtectedRoute";

const CitizenDashboard = lazy(() => import("../pages/citizen/CitizenDashboard"));
const NewComplaint = lazy(() => import("../pages/citizen/NewComplaint"));
const CitizenComplaintDetail = lazy(() => import("../pages/citizen/CitizenComplaintDetail"));
const WorkerTasks = lazy(() => import("../pages/worker/WorkerTasks"));
const WorkerTaskDetail = lazy(() => import("../pages/worker/WorkerTaskDetail"));
const AdminOverview = lazy(() => import("../pages/admin/AdminOverview"));
const AdminComplaints = lazy(() => import("../pages/admin/AdminComplaints"));
const AdminComplaintDetail = lazy(() => import("../pages/admin/AdminComplaintDetail"));
const AdminWorkers = lazy(() => import("../pages/admin/AdminWorkers"));
const AdminDepartments = lazy(() => import("../pages/admin/AdminDepartments"));
const AdminAnalytics = lazy(() => import("../pages/admin/AdminAnalytics"));
const AdminReports = lazy(() => import("../pages/admin/AdminReports"));
const NotificationsPage = lazy(() => import("../pages/shared/AccountPages").then((m) => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import("../pages/shared/HelpPage"));
const ProfilePage = lazy(() => import("../pages/shared/AccountPages").then((m) => ({ default: m.ProfilePage })));

const Fallback = <LoadingState className="min-h-[50vh]" />;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={Fallback}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/track" element={<TrackPage />} />
              <Route element={<PublicLayout />}>

                <Route path="/help" element={<HelpPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Old paths from the previous version */}
              <Route path="/citizen/dashboard" element={<Navigate to="/citizen" replace />} />
              <Route path="/citizen/create" element={<Navigate to="/citizen/new" replace />} />
              <Route path="/worker/login" element={<Navigate to="/login?role=worker" replace />} />
              <Route path="/worker/dashboard" element={<Navigate to="/worker" replace />} />

              <Route path="/citizen" element={<ProtectedRoute role="citizen"><AppShell role="citizen" /></ProtectedRoute>}>
                <Route index element={<CitizenDashboard />} />
                <Route path="new" element={<NewComplaint />} />
                <Route path="complaints/:id" element={<CitizenComplaintDetail />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="help" element={<HelpPage role="citizen" />} />
              </Route>

              <Route path="/worker" element={<ProtectedRoute role="worker"><AppShell role="worker" /></ProtectedRoute>}>
                <Route index element={<WorkerTasks />} />
                <Route path="history" element={<WorkerTasks history />} />
                <Route path="tasks/:id" element={<WorkerTaskDetail />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="help" element={<HelpPage role="worker" />} />
              </Route>

              <Route path="/admin" element={<ProtectedRoute role="admin"><AppShell role="admin" /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="complaints" element={<AdminComplaints />} />
                <Route path="complaints/:id" element={<AdminComplaintDetail />} />
                <Route path="workers" element={<AdminWorkers />} />
                <Route path="departments" element={<AdminDepartments />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<ProfilePage />} />
                <Route path="help" element={<HelpPage role="admin" />} />
              </Route>
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
