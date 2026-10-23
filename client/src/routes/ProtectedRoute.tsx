import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { HOME_BY_ROLE } from "../lib/constants";
import type { Role } from "../lib/types";

// UX guard only. Every API endpoint enforces the same rules on the server.
export default function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <LoadingState label="Checking your session…" className="min-h-screen" />;

  if (!user) {
    return <Navigate to={`/login?role=${role}`} replace state={{ from: location.pathname }} />;
  }

  if (user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }

  return <>{children}</>;
}
