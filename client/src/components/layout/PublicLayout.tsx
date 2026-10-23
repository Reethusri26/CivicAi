import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HOME_BY_ROLE } from "../../lib/constants";
import { PHOTOS } from "../../lib/photos";
import { buttonClasses, cx } from "../../lib/cx";
import { Logo } from "../ui/Logo";

const LINKS = [
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#features", label: "Features" },
  { to: "/track", label: "Track a complaint" },
  { to: "/#faq", label: "FAQ" },
];

export function PublicNav({ dark = false }: { dark?: boolean }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className={cx("sticky top-0 z-30 border-b backdrop-blur", dark ? "border-white/10 bg-night-900/85" : "border-slate-200 bg-white/90")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="CivicAI home">
          <Logo inverse={dark} />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cx("rounded-lg px-3 py-2 text-sm font-medium", dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to={HOME_BY_ROLE[user.role]} className={buttonClasses(dark ? "inverse" : "primary", "md")}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <NavLink to="/login" className={cx("rounded-lg px-3 py-2 text-sm font-semibold", dark ? "text-white" : "text-slate-700")}>
                Sign in
              </NavLink>
              <Link to="/register" className={buttonClasses(dark ? "inverse" : "primary", "md")}>
                Create account
              </Link>
            </>
          )}
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className={cx("grid size-10 place-items-center rounded-lg md:hidden", dark ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100")}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className={cx("border-t px-4 pb-4 md:hidden", dark ? "border-white/10" : "border-slate-200")}>
          <nav className="flex flex-col py-2" aria-label="Mobile">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={cx("rounded-lg px-3 py-2.5 text-sm font-medium", dark ? "text-slate-200" : "text-slate-700")}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <Link to={HOME_BY_ROLE[user.role]} className={buttonClasses("primary", "md", "w-full")}>Go to dashboard</Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className={buttonClasses("secondary", "md")}>Sign in</Link>
              <Link to="/register" className={buttonClasses("primary", "md")}>Create account</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-600">
            Helping communities report civic problems and track them transparently from submission to resolution.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Use CivicAI</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link to="/register" className="hover:text-brand-700">Report an issue</Link></li>
            <li><Link to="/track" className="hover:text-brand-700">Track a complaint</Link></li>
            <li><Link to="/login?role=worker" className="hover:text-brand-700">Field worker sign in</Link></li>
            <li><Link to="/login?role=admin" className="hover:text-brand-700">Administrator sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">About</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link to="/privacy" className="hover:text-brand-700">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-700">Terms of use</Link></li>
            <li><Link to="/#contact" className="hover:text-brand-700">Contact & support</Link></li>
          </ul>
        </div>
      </div>
      <details className="mx-auto max-w-7xl px-4 pb-4 text-xs text-slate-500 sm:px-6 lg:px-8">
        <summary className="cursor-pointer select-none hover:text-slate-700">Photo credits</summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {Object.values(PHOTOS).map((photo) => (
            <li key={photo.src}>
              <a href={photo.source} target="_blank" rel="noreferrer" className="underline hover:text-brand-700">
                {photo.alt.split(",")[0]}
              </a>{" "}
              — {photo.credit}, {photo.license}, via Wikimedia Commons
            </li>
          ))}
        </ul>
      </details>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CivicAI. A pilot civic-technology project.
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNav />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
