import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { cx } from "../../lib/cx";
import { timeAgo } from "../../lib/format";
import { complaintPathFor } from "../../lib/paths";
import type { AppNotification, Role } from "../../lib/types";

const POLL_MS = 60_000;

export function NotificationBell({ role, dark = false }: { role: Role; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    api
      .get("/notifications")
      .then((res) => {
        setItems(res.data.notifications.slice(0, 8));
        setUnread(res.data.unread);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = async (item: AppNotification) => {
    setOpen(false);
    if (!item.read) {
      api.post("/notifications/read", { ids: [item.id] }).then(load).catch(() => undefined);
    }
    if (item.complaintId) navigate(complaintPathFor(role, item.complaintId));
  };

  const markAll = () => api.post("/notifications/read", {}).then(load).catch(() => undefined);

  return (
    <div ref={wrapper} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "relative grid size-10 place-items-center rounded-lg transition",
          dark ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100"
        )}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-raised">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-brand-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button onClick={() => openItem(item)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-brand-600")} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">{item.title}</span>
                      {item.message && <span className="block truncate text-xs text-slate-600">{item.message}</span>}
                      <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/${role}/notifications`}
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand-700 hover:bg-slate-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
