import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/cx";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-xl border border-slate-200 bg-white shadow-card", className)} {...rest} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-sm font-semibold text-[var(--role-ink)]">{eyebrow}</div>}
        <h1 className="font-hero text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <div className="mt-2 h-1 w-14 rounded-full bg-role" aria-hidden />
        {description && <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
