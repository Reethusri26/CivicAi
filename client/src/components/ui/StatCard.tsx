import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { TiltCard } from "../three/TiltCard";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "amber" | "violet" | "blue" | "emerald" | "rose" | "slate";
  hint?: ReactNode;
  loading?: boolean;
}

// Colours stay tied to meaning (amber = pending, emerald = done, ...).
const TONES = {
  brand: { tile: "from-brand-500 to-fuchsia-500", glow: "bg-brand-500" },
  amber: { tile: "from-amber-400 to-orange-500", glow: "bg-amber-400" },
  violet: { tile: "from-violet-500 to-purple-600", glow: "bg-violet-500" },
  blue: { tile: "from-sky-400 to-brand-600", glow: "bg-sky-400" },
  emerald: { tile: "from-mint-400 to-emerald-600", glow: "bg-mint-400" },
  rose: { tile: "from-rose-500 to-pink-600", glow: "bg-rose-500" },
  slate: { tile: "from-slate-600 to-night-800", glow: "bg-slate-400" },
};

export function StatCard({ label, value, icon, tone = "brand", hint, loading }: StatCardProps) {
  const t = TONES[tone];
  return (
    <TiltCard depth={8}>
      <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-raised sm:p-5">
        <div className={cx("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.tile)} aria-hidden />
        <div className={cx("pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30", t.glow)} aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          {icon && (
            <span
              className={cx("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", t.tile)}
              style={{ transform: "translateZ(24px)" }}
            >
              {icon}
            </span>
          )}
        </div>
        {loading ? (
          <div className="mt-2 h-9 w-16 animate-pulse rounded bg-slate-200" />
        ) : (
          <p className="relative mt-1 font-hero text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" style={{ transform: "translateZ(16px)" }}>
            {value}
          </p>
        )}
        {hint && <p className="relative mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </TiltCard>
  );
}
