import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Gauge, Hammer, Lightbulb, Timer, UserCheck } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Link } from "react-router-dom";
import "../../lib/charts";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badges";
import { LinkButton } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { PortalBanner } from "../../components/layout/PortalBanner";
import { PHOTOS } from "../../lib/photos";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api";
import { STATUS_CHART_COLORS, STATUSES } from "../../lib/constants";
import { formatHours, formatPercent, timeAgo } from "../../lib/format";
import type { Complaint } from "../../lib/types";
import { useApi } from "../../lib/useApi";

export interface Overview {
  total: number;
  pending: number;
  reviewed: number;
  assigned: number;
  inProgress: number;
  completed: number;
  highPriorityOpen: number;
  resolutionRate: number | null;
  avgResolutionHours: number | null;
  resolvedSampleSize: number;
}

export default function AdminOverview() {
  const overview = useApi(() => api.get("/admin/overview").then((res) => res.data.overview as Overview), []);
  const insights = useApi(
    () => api.get("/admin/analytics").then((res) => res.data.insights as { kind: string; text: string }[]),
    []
  );
  const queue = useApi(
    () =>
      api
        .get("/admin/complaints", { params: { status: "Pending", sort: "priority", limit: 6 } })
        .then((res) => res.data.complaints as Complaint[]),
    []
  );

  const o = overview.data;
  const loading = overview.initialLoading;

  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.reload} />;

  const statusValues = o ? [o.pending, o.reviewed, o.assigned, o.inProgress, o.completed] : [];

  return (
    <>
      <PortalBanner
        photo={PHOTOS.cityNight}
        eyebrow="Operations center"
        title="Overview"
        description="Live operational picture across all departments."
        actions={<LinkButton to="/admin/complaints" variant="inverse">Open complaint queue</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total complaints" value={o?.total ?? 0} loading={loading} icon={<ClipboardList className="size-5" />} />
        <StatCard label="Awaiting action" value={(o?.pending ?? 0) + (o?.reviewed ?? 0)} loading={loading} tone="amber" icon={<Clock className="size-5" />} hint={o ? `${o.pending} new · ${o.reviewed} reviewed` : undefined} />
        <StatCard label="Assigned" value={o?.assigned ?? 0} loading={loading} tone="violet" icon={<UserCheck className="size-5" />} />
        <StatCard label="In progress" value={o?.inProgress ?? 0} loading={loading} tone="blue" icon={<Hammer className="size-5" />} />
        <StatCard label="Completed" value={o?.completed ?? 0} loading={loading} tone="emerald" icon={<CheckCircle2 className="size-5" />} />
        <StatCard label="Open high priority" value={o?.highPriorityOpen ?? 0} loading={loading} tone="rose" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Resolution rate" value={formatPercent(o?.resolutionRate)} loading={loading} tone="slate" icon={<Gauge className="size-5" />} hint="Completed ÷ all complaints" />
        <StatCard
          label="Avg. resolution time"
          value={formatHours(o?.avgResolutionHours)}
          loading={loading}
          tone="slate"
          icon={<Timer className="size-5" />}
          hint={o?.resolvedSampleSize ? `Across ${o.resolvedSampleSize} resolved` : "Shown once something is resolved"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="New complaints to review"
            description="Pending complaints, highest priority first"
            action={<Link to="/admin/complaints?status=Pending" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>}
          />
          {queue.initialLoading ? (
            <LoadingState />
          ) : queue.error ? (
            <ErrorState message={queue.error} onRetry={queue.reload} />
          ) : !queue.data?.length ? (
            <EmptyState icon={<CheckCircle2 className="size-6" />} title="Nothing waiting" description="All new complaints have been reviewed." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.data.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/complaints/${c.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{c.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className="font-mono">{c.reference}</span> · {c.category} · {timeAgo(c.createdAt)}
                      </p>
                    </div>
                    <PriorityBadge priority={c.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Status distribution" />
          <div className="p-5">
            {loading ? (
              <LoadingState />
            ) : !o?.total ? (
              <EmptyState title="No complaints yet" description="The chart appears once complaints arrive." />
            ) : (
              <>
                <div className="h-52">
                  <Doughnut
                    data={{
                      labels: STATUSES,
                      datasets: [{ data: statusValues, backgroundColor: STATUSES.map((s) => STATUS_CHART_COLORS[s]), borderWidth: 2, borderColor: "#fff" }],
                    }}
                    options={{ cutout: "68%", plugins: { legend: { display: false } } }}
                    aria-label="Doughnut chart of complaints by status"
                    role="img"
                  />
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2">
                  {STATUSES.map((status, index) => (
                    <li key={status} className="flex items-center justify-between gap-2 text-sm">
                      <StatusBadge status={status} />
                      <span className="font-semibold tabular-nums">{statusValues[index]}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Insights" description="Observations computed from your data. Nothing is shown until there's enough to say." />
        <div className="p-5">
          {insights.initialLoading ? (
            <LoadingState />
          ) : !insights.data?.length ? (
            <p className="text-sm text-slate-500">No notable patterns yet.</p>
          ) : (
            <ul className="space-y-2">
              {insights.data.map((insight) => (
                <li key={insight.text} className="flex gap-2.5 rounded-lg bg-amber-50/60 p-3 text-sm text-slate-800">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  {insight.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}
