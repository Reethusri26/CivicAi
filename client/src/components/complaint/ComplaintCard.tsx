import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate, timeAgo } from "../../lib/format";
import type { Complaint } from "../../lib/types";
import { PriorityBadge, StatusBadge } from "../ui/Badges";

export function ComplaintCard({ complaint, to, showWorker = true }: { complaint: Complaint; to: string; showWorker?: boolean }) {
  return (
    <Link
      to={to}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-raised sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500">{complaint.reference}</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">{complaint.title}</h3>
        </div>
        <ChevronRight className="mt-3 size-5 shrink-0 text-slate-300 group-hover:text-brand-500" aria-hidden />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={complaint.status} />
        <PriorityBadge priority={complaint.priority} />
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{complaint.category}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {complaint.address && (
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{complaint.address}</span>
          </span>
        )}
        <span className="flex items-center gap-1" title={formatDate(complaint.createdAt)}>
          <CalendarDays className="size-3.5" aria-hidden />
          {timeAgo(complaint.createdAt)}
        </span>
        {showWorker && complaint.worker && <span>Assigned to {complaint.worker.name}</span>}
      </div>
    </Link>
  );
}
