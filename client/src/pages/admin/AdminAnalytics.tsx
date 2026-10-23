import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { ReactNode } from "react";
import { GRID_COLOR, SERIES_COLORS, integerAxis } from "../../lib/charts";
import { Card, CardHeader, PageHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api";
import { PRIORITY_CHART_COLORS, STATUS_CHART_COLORS } from "../../lib/constants";
import { formatHours, formatPercent } from "../../lib/format";
import type { Priority, Status } from "../../lib/types";
import { useApi } from "../../lib/useApi";

export interface AnalyticsData {
  byStatus: { key: Status; count: number }[];
  byCategory: { key: string; count: number }[];
  byPriority: { key: Priority; count: number }[];
  trend: { month: string; created: number; completed: number }[];
  departmentWorkload: { department: string; open: number; completed: number }[];
  workerPerformance: { workerId: string; name: string; department: string; active: number; completed: number; avgResolutionHours: number | null }[];
  resolutionByCategory: { category: string; avgHours: number; count: number }[];
}

interface Evaluation {
  source: "gemini" | "rules";
  reviewed: number;
  categoryAgreement: number | null;
  priorityAgreement: number | null;
}

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });

function ChartCard({ title, description, children, empty }: { title: string; description?: string; children: ReactNode; empty: boolean }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="p-5">{empty ? <p className="py-10 text-center text-sm text-slate-500">Not enough data yet.</p> : children}</div>
    </Card>
  );
}

export default function AdminAnalytics() {
  const { data, error, initialLoading, reload } = useApi(
    () =>
      Promise.all([api.get("/admin/analytics"), api.get("/admin/ai-evaluation")]).then(([a, e]) => ({
        analytics: a.data.analytics as AnalyticsData,
        evaluation: e.data.evaluation as Evaluation[],
      })),
    []
  );

  if (initialLoading) return <LoadingState label="Crunching numbers…" />;
  if (error || !data) return <ErrorState message={error || "No data"} onRetry={reload} />;

  const a = data.analytics;
  const total = a.byStatus.reduce((sum, row) => sum + row.count, 0);

  if (total === 0) {
    return (
      <>
        <PageHeader title="Analytics" />
        <Card><EmptyState title="No complaints yet" description="Charts appear here as soon as residents start reporting issues." /></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Analytics" description={`Based on ${total} complaint${total === 1 ? "" : "s"} in the database. All figures are live.`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Complaints over time" description="Created vs. completed per month (last 6 months)" empty={false}>
          <div className="h-64">
            <Line
              data={{
                labels: a.trend.map((t) => monthLabel(t.month)),
                datasets: [
                  { label: "Created", data: a.trend.map((t) => t.created), borderColor: "#5536f5", backgroundColor: "rgba(85,54,245,0.10)", fill: true, tension: 0.3 },
                  { label: "Completed", data: a.trend.map((t) => t.completed), borderColor: "#10b981", backgroundColor: "transparent", tension: 0.3 },
                ],
              }}
              options={{ scales: { y: integerAxis, x: { grid: { display: false } } }, interaction: { mode: "index", intersect: false } }}
              aria-label="Line chart of complaints created and completed per month"
              role="img"
            />
          </div>
        </ChartCard>

        <ChartCard title="By category" empty={!a.byCategory.length}>
          <div className="h-64">
            <Bar
              data={{
                labels: a.byCategory.map((r) => r.key),
                datasets: [{ label: "Complaints", data: a.byCategory.map((r) => r.count), backgroundColor: "#5536f5", borderRadius: 6, maxBarThickness: 36 }],
              }}
              options={{ indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: integerAxis, y: { grid: { display: false } } } }}
              aria-label="Bar chart of complaints by category"
              role="img"
            />
          </div>
        </ChartCard>

        <ChartCard title="By status" empty={!a.byStatus.length}>
          <div className="h-56">
            <Doughnut
              data={{
                labels: a.byStatus.map((r) => r.key),
                datasets: [{ data: a.byStatus.map((r) => r.count), backgroundColor: a.byStatus.map((r) => STATUS_CHART_COLORS[r.key]), borderColor: "#fff", borderWidth: 2 }],
              }}
              options={{ cutout: "62%", plugins: { legend: { position: "right" } } }}
              aria-label="Doughnut chart of complaints by status"
              role="img"
            />
          </div>
        </ChartCard>

        <ChartCard title="By priority" empty={!a.byPriority.length}>
          <div className="h-56">
            <Doughnut
              data={{
                labels: a.byPriority.map((r) => r.key),
                datasets: [{ data: a.byPriority.map((r) => r.count), backgroundColor: a.byPriority.map((r) => PRIORITY_CHART_COLORS[r.key]), borderColor: "#fff", borderWidth: 2 }],
              }}
              options={{ cutout: "62%", plugins: { legend: { position: "right" } } }}
              aria-label="Doughnut chart of complaints by priority"
              role="img"
            />
          </div>
        </ChartCard>

        <ChartCard title="Department workload" description="Open vs. completed complaints" empty={!a.departmentWorkload.length}>
          <div className="h-64">
            <Bar
              data={{
                labels: a.departmentWorkload.map((r) => r.department),
                datasets: [
                  { label: "Open", data: a.departmentWorkload.map((r) => r.open), backgroundColor: "#f59e0b", borderRadius: 4, maxBarThickness: 40 },
                  { label: "Completed", data: a.departmentWorkload.map((r) => r.completed), backgroundColor: "#10b981", borderRadius: 4, maxBarThickness: 40 },
                ],
              }}
              options={{ scales: { x: { stacked: true, grid: { display: false } }, y: { ...integerAxis, stacked: true } } }}
              aria-label="Stacked bar chart of open and completed complaints by department"
              role="img"
            />
          </div>
        </ChartCard>

        <ChartCard title="Average resolution time by category" description="Submission to completion" empty={!a.resolutionByCategory.length}>
          <div className="h-64">
            <Bar
              data={{
                labels: a.resolutionByCategory.map((r) => `${r.category} (n=${r.count})`),
                datasets: [{ label: "Hours", data: a.resolutionByCategory.map((r) => Number(r.avgHours.toFixed(1))), backgroundColor: SERIES_COLORS[1], borderRadius: 6, maxBarThickness: 36 }],
              }}
              options={{ indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: GRID_COLOR }, title: { display: true, text: "Hours" } }, y: { grid: { display: false } } } }}
              aria-label="Bar chart of average resolution hours by category"
              role="img"
            />
          </div>
        </ChartCard>
      </div>

      <Card className="mt-6">
        <CardHeader title="Worker task completion" />
        {a.workerPerformance.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No tasks have been assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Worker</th>
                  <th scope="col" className="px-4 py-3">Department</th>
                  <th scope="col" className="px-4 py-3 text-right">Active</th>
                  <th scope="col" className="px-4 py-3 text-right">Completed</th>
                  <th scope="col" className="px-4 py-3 text-right">Avg. resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.workerPerformance.map((w) => (
                  <tr key={w.workerId}>
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3">{w.department}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{w.active}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{w.completed}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatHours(w.avgResolutionHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="AI suggestion agreement"
          description="Of complaints an admin has reviewed, how often the final category/priority matches the suggestion. This measures agreement with staff, not ground-truth accuracy."
        />
        {data.evaluation.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No reviewed complaints yet.</p>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {data.evaluation.map((e) => (
              <div key={e.source} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold">{e.source === "gemini" ? "Gemini" : "Rule-based fallback"}</p>
                <p className="text-xs text-slate-500">{e.reviewed} reviewed complaint{e.reviewed === 1 ? "" : "s"}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-slate-500">Category kept</dt><dd className="text-xl font-bold">{formatPercent(e.categoryAgreement)}</dd></div>
                  <div><dt className="text-slate-500">Priority kept</dt><dd className="text-xl font-bold">{formatPercent(e.priorityAgreement)}</dd></div>
                </dl>
                {e.reviewed < 30 && <p className="mt-2 text-xs text-amber-700">Small sample — treat with caution.</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
