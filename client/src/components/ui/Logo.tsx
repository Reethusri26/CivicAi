import { cx } from "../../lib/cx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#5536f5" />
      <path d="M16 6.5c-4.4 0-8 3.4-8 7.7 0 5.5 6.6 10.8 7.3 11.4.4.3 1 .3 1.4 0 .7-.6 7.3-5.9 7.3-11.4 0-4.3-3.6-7.7-8-7.7Z" fill="#fff" />
      <path d="m12.6 14.4 2.4 2.4 4.5-4.6" fill="none" stroke="#5536f5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cx("font-display text-lg font-bold tracking-tight", inverse ? "text-white" : "text-slate-900")}>
        Civic<span className={inverse ? "text-brand-300" : "text-brand-600"}>AI</span>
      </span>
    </span>
  );
}
