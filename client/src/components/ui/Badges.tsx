import { Bot, ListChecks } from "lucide-react";
import { PRIORITY_STYLES, STATUS_DOT, STATUS_STYLES } from "../../lib/constants";
import { cx } from "../../lib/cx";
import type { Priority, Status } from "../../lib/types";

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cx(base, STATUS_STYLES[status] || STATUS_STYLES.Pending)}>
      <span className={cx("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cx(base, PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low)}>{priority} priority</span>;
}

export function AiSourceBadge({ source }: { source: "gemini" | "rules" }) {
  return source === "gemini" ? (
    <span className={cx(base, "bg-brand-50 text-brand-800 ring-brand-200")}>
      <Bot className="size-3.5" aria-hidden /> Gemini
    </span>
  ) : (
    <span className={cx(base, "bg-slate-100 text-slate-700 ring-slate-200")}>
      <ListChecks className="size-3.5" aria-hidden /> Rule-based fallback
    </span>
  );
}
