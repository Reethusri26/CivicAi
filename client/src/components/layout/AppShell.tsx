import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HOME_BY_ROLE } from "../../lib/constants";
import { cx } from "../../lib/cx";
import type { Role } from "../../lib/types";
import { Logo } from "../ui/Logo";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  mobileTab?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  citizen: [
    { to: "/citizen", label: "My complaints", icon: LayoutDashboard, end: true, mobileTab: true },
    { to: "/citizen/new", label: "Report an issue", icon: PlusCircle, mobileTab: true },
    { to: "/citizen/notifications", label: "Notifications", icon: Bell, mobileTab: true },
    { to: "/citizen/profile", label: "Profile", icon: UserRound, mobileTab: true },
    { to: "/citizen/help", label: "Help", icon: LifeBuoy },
  ],
  worker: [
    { to: "/worker", label: "My tasks", icon: ListTodo, end: true, mobileTab: true },
    { to: "/worker/history", label: "Completed", icon: ClipboardList, mobileTab: true },
    { to: "/worker/notifications", label: "Notifications", icon: Bell, mobileTab: true },
    { to: "/worker/profile", label: "Profile", icon: UserRound, mobileTab: true },
    { to: "/worker/help", label: "Help", icon: LifeBuoy },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/complaints", label: "Complaints", icon: ClipboardList },
    { to: "/admin/workers", label: "Workers", icon: HardHat },
    { to: "/admin/departments", label: "Departments", icon: Building2 },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/settings", label: "Settings", icon: Settings },
    { to: "/admin/help", label: "Help", icon: LifeBuoy },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  citizen: "Citizen portal",
  worker: "Field worker",
  admin: "Operations center",
};

function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1" aria-label="Main">
      {NAV[role].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive ? "bg-role text-white shadow-role" : "text-slate-300 hover:bg-white/5 hover:text-white"
            )
          }
        >
          <item.icon className="size-[18px]" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ role }: { role: Role }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const tabs = NAV[role].filter((item) => item.mobileTab);

  const accountBlock = (
    <div className="relative border-t border-white/10 pt-4">
      <div className="flex items-center gap-3 px-1">
        <span className="grid size-9 place-items-center rounded-full bg-role font-hero text-sm font-bold text-white">
          {(user?.name || "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.department ? `${user.department} · ` : ""}{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-[18px]" aria-hidden /> Sign out
      </button>
    </div>
  );

  return (
    <div data-role={role} className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--role-soft),transparent_55%)] lg:pl-64 print:pl-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden bg-night-950 px-4 py-5 lg:flex print:hidden">
        <div className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-role opacity-30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" aria-hidden />
        <Link to={NAV[role][0].to} className="relative px-2">
          <Logo inverse />
        </Link>
        <p className="relative mt-2 px-2"><span className="text-role text-xs font-bold uppercase tracking-[0.18em]">{ROLE_LABEL[role]}</span></p>
        <div className="relative mt-6 flex-1 overflow-y-auto">
          <SidebarNav role={role} />
        </div>
        {accountBlock}
      </aside>

      {/* Top bar */}
      <header className="print:hidden sticky top-0 z-20 flex h-14 border-t-[3px] border-t-[var(--role-a)] items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:h-16 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link to={NAV[role][0].to}>
            <Logo />
          </Link>
        </div>
        <p className="hidden text-sm text-slate-500 lg:block">{ROLE_LABEL[role]}</p>
        <div className="flex items-center gap-1">
          <NotificationBell role={role} />
          {role === "admin" && (
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
              <Users className="size-3.5" aria-hidden /> Admin
            </span>
          )}
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="relative flex h-full w-72 max-w-[85vw] animate-fade-in flex-col bg-night-900 px-4 py-5">
            <div className="flex items-center justify-between px-2">
              <Logo inverse />
              <button onClick={() => setMenuOpen(false)} className="rounded-md p-1 text-slate-400 hover:text-white" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="relative mt-6 flex-1 overflow-y-auto">
              <SidebarNav role={role} onNavigate={() => setMenuOpen(false)} />
            </div>
            {accountBlock}
          </div>
        </div>
      )}

      <main id="main" className={cx("mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8", tabs.length > 0 && "pb-24 lg:pb-8")}>
        {location.pathname.replace(/\/$/, "") !== HOME_BY_ROLE[role] && (
          <Link
            to={HOME_BY_ROLE[role]}
            className="print:hidden mb-4 inline-flex items-center gap-2 rounded-full bg-role px-4 py-1.5 text-sm font-semibold text-white shadow-role transition hover:-translate-y-0.5"
          >
            <LayoutDashboard className="size-4" aria-hidden /> Go to dashboard
          </Link>
        )}
        <Outlet />
      </main>

      {/* Mobile bottom tabs for citizens and workers */}
      {tabs.length > 0 && (
        <nav className="print:hidden fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Quick navigation">
          {tabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", isActive ? "text-[var(--role-ink)]" : "text-slate-500")
              }
            >
              <item.icon className="size-5" aria-hidden />
              {item.label.replace("Report an issue", "Report").replace("My complaints", "Home").replace("My tasks", "Tasks")}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
