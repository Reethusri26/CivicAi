import { CheckCircle2, ClipboardList, Clock, Hammer, Plus, Search, UserCheck } from "lucide-react";
import { useState } from "react";
import { ComplaintCard } from "../../components/complaint/ComplaintCard";
import { LinkButton } from "../../components/ui/Button";
import { PortalBanner } from "../../components/layout/PortalBanner";
import { PHOTOS } from "../../lib/photos";
import { Pagination } from "../../components/ui/Pagination";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/States";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { cx } from "../../lib/cx";
import { firstName } from "../../lib/format";
import type { Complaint, Pagination as PaginationData, Status } from "../../lib/types";
import { useApi } from "../../lib/useApi";
import { useDebounced } from "../../lib/useDebounced";

const FILTERS: { label: string; value: Status | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Reviewed", value: "Reviewed" },
  { label: "Assigned", value: "Assigned" },
  { label: "In progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim(), 350);

  const stats = useApi(
    () => api.get("/complaints/stats").then((res) => res.data.stats as Record<string, number>),
    []
  );
  const list = useApi(
    () =>
      api
        .get("/complaints", { params: { status: status || undefined, q: q || undefined, page, limit: 10 } })
        .then((res) => res.data as { complaints: Complaint[]; pagination: PaginationData }),
    [status, q, page]
  );

  const s = stats.data;
  const isNewUser = s?.total === 0;

  return (
    <>
      <PortalBanner
        photo={PHOTOS.streetLights}
        eyebrow={`${greeting()}, ${firstName(user?.name)}`}
        title="My complaints"
        description="Track everything you've reported and see what's happening with each one."
        actions={
          <LinkButton
            to="/citizen/new"
            icon={<Plus className="size-4" />}
            className="bg-mint-400 text-night-950 hover:bg-mint-300"
          >
            Report an issue
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Total" value={s?.total ?? 0} loading={stats.initialLoading} icon={<ClipboardList className="size-5" />} />
        <StatCard label="Pending" value={s?.pending ?? 0} loading={stats.initialLoading} tone="amber" icon={<Clock className="size-5" />} />
        <StatCard label="Assigned" value={s?.assigned ?? 0} loading={stats.initialLoading} tone="violet" icon={<UserCheck className="size-5" />} />
        <StatCard label="In progress" value={s?.inProgress ?? 0} loading={stats.initialLoading} tone="blue" icon={<Hammer className="size-5" />} />
        <StatCard label="Completed" value={s?.completed ?? 0} loading={stats.initialLoading} tone="emerald" icon={<CheckCircle2 className="size-5" />} />
      </div>

      {isNewUser ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white">
          <EmptyState
            title="You haven't reported anything yet"
            description="Seen a pothole, overflowing bin or broken street light? Report it and follow the fix from start to finish."
            action={<LinkButton to="/citizen/new" icon={<Plus className="size-4" />}>Report your first issue</LinkButton>}
          />
        </div>
      ) : (
        <section className="mt-8" aria-label="Complaint list">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter by status">
              {FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  role="tab"
                  aria-selected={status === filter.value}
                  onClick={() => {
                    setStatus(filter.value);
                    setPage(1);
                  }}
                  className={cx(
                    "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                    status === filter.value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="relative block lg:w-72">
              <span className="sr-only">Search complaints</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, reference or address"
                className="w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-4">
            {list.initialLoading ? (
              <ListSkeleton />
            ) : list.error ? (
              <ErrorState message={list.error} onRetry={list.reload} />
            ) : list.data && list.data.complaints.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white">
                <EmptyState title="No complaints match" description="Try a different status or search term." />
              </div>
            ) : (
              <div className={cx("space-y-3 transition-opacity", list.loading && "opacity-60")}>
                {list.data?.complaints.map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} to={`/citizen/complaints/${complaint.id}`} />
                ))}
                <Pagination pagination={list.data?.pagination} onChange={setPage} />
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
