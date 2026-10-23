import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "amber" | "violet" | "blue" | "emerald" | "rose" | "slate";
  hint?: ReactNode;
  loading?: boolean;
}

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({ label, value, icon, tone = "brand", hint, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && <span className={cx("grid size-9 place-items-center rounded-lg", TONES[tone])}>{icon}</span>}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200" />
      ) : (
        <p className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
