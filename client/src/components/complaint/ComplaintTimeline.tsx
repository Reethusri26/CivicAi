import { Check } from "lucide-react";
import { STATUS_DOT, STATUSES } from "../../lib/constants";
import { cx } from "../../lib/cx";
import { formatDateTime } from "../../lib/format";
import type { Status, TimelineEntry } from "../../lib/types";

const STEP_LABELS: Record<Status, string> = {
  Pending: "Submitted",
  Reviewed: "Reviewed",
  Assigned: "Assigned",
  "In Progress": "In progress",
  Completed: "Completed",
};

// Progress across the five stages. A stage is marked done only if the
// timeline contains an event that reached it (Reviewed may be skipped when an
// admin assigns directly).
export function StatusStepper({ status, timeline }: { status: Status; timeline: TimelineEntry[] }) {
  const reached = new Set(timeline.map((entry) => entry.status));
  reached.add(status);
  const currentIndex = STATUSES.indexOf(status);

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Complaint progress">
      {STATUSES.map((step, index) => {
        const done = index <= currentIndex && (reached.has(step) || index < currentIndex);
        const skipped = index < currentIndex && !reached.has(step);
        const current = step === status;
        return (
          <li key={step} className="flex flex-col items-center text-center" aria-current={current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cx("h-0.5 flex-1", index === 0 ? "bg-transparent" : done ? "bg-brand-500" : "bg-slate-200")} />
              <span
                className={cx(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-4 ring-white",
                  skipped ? "bg-slate-200 text-slate-500" : done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
                )}
              >
                {done && !skipped ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span className={cx("h-0.5 flex-1", index === STATUSES.length - 1 ? "bg-transparent" : index < currentIndex ? "bg-brand-500" : "bg-slate-200")} />
            </div>
            <span className={cx("mt-1.5 text-[11px] leading-tight sm:text-xs", current ? "font-semibold text-slate-900" : "text-slate-500")}>
              {STEP_LABELS[step]}
              {skipped && <span className="block text-[10px] text-slate-400">skipped</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ComplaintTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  const entries = [...timeline].reverse();
  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {entries.map((entry, index) => (
        <li key={`${entry.date}-${index}`} className="relative">
          <span className={cx("absolute -left-[26px] top-1 size-3 rounded-full ring-4 ring-white", STATUS_DOT[entry.status] || "bg-slate-400")} aria-hidden />
          <p className="text-sm font-medium text-slate-900">{entry.message || entry.status}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDateTime(entry.date)}
            {entry.actorName && <> · {entry.actorName}</>}
            {!entry.actorName && entry.actorRole === "admin" && <> · Operations team</>}
          </p>
        </li>
      ))}
    </ol>
  );
}
