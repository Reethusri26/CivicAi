import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/Landing/LandingPage";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";

import ProtectedRoute from "./ProtectedRoute";

import CitizenDashboard from "../pages/Citizen/CitizenDashboard";
import CreateComplaint from "../pages/Citizen/createComplaint";

import AdminDashboard from "../pages/Admin/AdminDashboard";

import WorkerLogin from "../pages/Worker/WorkerLogin";
import WorkerDashboard from "../pages/Worker/WorkerDashboard";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen Redirect */}
        <Route
          path="/citizen"
          element={<Navigate to="/citizen/dashboard" replace />}
        />

        {/* Citizen Dashboard */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute role="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />

        {/* Create Complaint */}
        <Route
          path="/citizen/create"
          element={
            <ProtectedRoute role="citizen">
              <CreateComplaint />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Worker Login */}
        <Route
          path="/worker/login"
          element={<WorkerLogin />}
        />

        {/* Worker Dashboard */}
        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute role="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown Route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;