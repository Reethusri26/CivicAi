import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ComplaintCard } from "../../components/complaint/ComplaintCard";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Field";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/States";
import { api } from "../../lib/api";
import { CATEGORIES, PRIORITIES, STATUSES } from "../../lib/constants";
import { cx } from "../../lib/cx";
import { formatDate } from "../../lib/format";
import type { Complaint, Department, Pagination as PaginationData, WorkerSummary } from "../../lib/types";
import { useApi } from "../../lib/useApi";
import { useDebounced } from "../../lib/useDebounced";

const FILTER_KEYS = ["status", "priority", "category", "department", "worker", "from", "to", "sort"] as const;

export default function AdminComplaints() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(params.get("q") || "");
  const [showFilters, setShowFilters] = useState(false);
  const q = useDebounced(search.trim(), 350);
  const page = Number(params.get("page") || 1);

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || ""])) as Record<(typeof FILTER_KEYS)[number], string>;
  const activeCount = FILTER_KEYS.filter((key) => key !== "sort" && filters[key]).length;

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    setParams(next, { replace: true });
  };

  const lists = useApi(
    () =>
      Promise.all([api.get("/admin/workers"), api.get("/admin/departments")]).then(([w, d]) => ({
        workers: w.data.workers as WorkerSummary[],
        departments: d.data.departments as Department[],
      })),
    []
  );

  const query = { ...filters, q, page };
  const result = useApi(
    () =>
      api
        .get("/admin/complaints", {
          params: Object.fromEntries(Object.entries({ ...query, limit: 20 }).filter(([, v]) => v !== "" && v !== undefined)),
        })
        .then((res) => res.data as { complaints: Complaint[]; pagination: PaginationData }),
    [JSON.stringify(query)]
  );

  const clearAll = () => {
    setSearch("");
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <>
      <PageHeader title="Complaints" description="Search, filter and act on every complaint in the system." />

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search complaints</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                update({ q: "" });
              }}
              placeholder="Search title, description, reference or address"
              className="w-full rounded-lg border-0 py-2.5 pl-9 pr-3 text-sm shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <Select aria-label="Sort" value={filters.sort || "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })} wrapperClassName="flex-1 md:w-44">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Highest priority</option>
              <option value="updated">Recently updated</option>
            </Select>
            <Button variant="secondary" onClick={() => setShowFilters((v) => !v)} icon={<Filter className="size-4" />} aria-expanded={showFilters}>
              Filters{activeCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeCount}</span>}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Status" value={filters.status} onChange={(e) => update({ status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Select label="Priority" value={filters.priority} onChange={(e) => update({ priority: e.target.value })}>
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </Select>
            <Select label="Category" value={filters.category} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select label="Department" value={filters.department} onChange={(e) => update({ department: e.target.value })}>
              <option value="">All departments</option>
              {lists.data?.departments.map((d) => <option key={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Worker" value={filters.worker} onChange={(e) => update({ worker: e.target.value })}>
              <option value="">Any worker</option>
              <option value="unassigned">Unassigned</option>
              {lists.data?.workers.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.department})</option>)}
            </Select>
            <Input label="From" type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} max={filters.to || undefined} />
            <Input label="To" type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} min={filters.from || undefined} />
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearAll} icon={<X className="size-4" />} disabled={!activeCount && !search}>Clear all</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4">
        {result.initialLoading ? (
          <ListSkeleton rows={6} />
        ) : result.error ? (
          <Card><ErrorState message={result.error} onRetry={result.reload} /></Card>
        ) : !result.data?.complaints.length ? (
          <Card>
            <EmptyState
              title={activeCount || q ? "No complaints match these filters" : "No complaints yet"}
              description={activeCount || q ? "Try removing a filter." : "New complaints from residents will appear here."}
              action={activeCount || q ? <Button variant="secondary" onClick={clearAll}>Clear filters</Button> : undefined}
            />
          </Card>
        ) : (
          <div className={cx("transition-opacity", result.loading && "opacity-60")}>
            {/* Desktop table */}
            <Card className="hidden overflow-hidden lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Complaint</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Priority</th>
                    <th scope="col" className="px-4 py-3">Assigned to</th>
                    <th scope="col" className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.complaints.map((c) => (
                    <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/complaints/${c.id}`)}>
                      <td className="max-w-sm px-4 py-3">
                        <Link to={`/admin/complaints/${c.id}`} className="block truncate font-medium text-slate-900 hover:text-brand-700" onClick={(e) => e.stopPropagation()}>
                          {c.title}
                        </Link>
                        <span className="font-mono text-xs text-slate-500">{c.reference}</span>
                        {c.citizen && <span className="text-xs text-slate-500"> · {c.citizen.name}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {c.category}
                        {c.department && <span className="block text-xs text-slate-500">{c.department}</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3 text-slate-700">{c.worker?.name || <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {result.data.complaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} to={`/admin/complaints/${c.id}`} />
              ))}
            </div>
            <Pagination pagination={result.data.pagination} onChange={(p) => update({ page: String(p) })} />
          </div>
        )}
      </div>
    </>
  );
}
