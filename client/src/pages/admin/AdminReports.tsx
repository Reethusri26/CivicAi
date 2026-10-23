import { Download, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, PageHeader } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Field";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { STATUSES } from "../../lib/constants";
import { formatDateTime, formatHours, formatPercent } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import type { AnalyticsData } from "./AdminAnalytics";
import type { Overview } from "./AdminOverview";

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>{headers.map((h, i) => <th key={h} scope="col" className={`py-2 pr-4 ${i > 0 ? "text-right" : ""}`}>{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, r) => (
          <tr key={r}>{row.map((cell, i) => <td key={i} className={`py-2 pr-4 ${i > 0 ? "text-right tabular-nums" : ""}`}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminReports() {
  const toast = useToast();
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [downloading, setDownloading] = useState(false);
  const { data, error, initialLoading, reload } = useApi(
    () =>
      Promise.all([api.get("/admin/overview"), api.get("/admin/analytics")]).then(([o, a]) => ({
        overview: o.data.overview as Overview,
        analytics: a.data.analytics as AnalyticsData,
      })),
    []
  );

  const download = async () => {
    setDownloading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await api.get("/admin/reports/complaints.csv", { params, responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `civicai-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err, "Export failed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader title="Reports" description="Export complaint data and print a summary report." />

      <Card className="no-print">
        <CardHeader title="Export complaints (CSV)" description="Opens in Excel or Google Sheets. Residents' names and contact details are not included." />
        <div className="grid gap-3 p-5 sm:grid-cols-4">
          <Select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Input label="From" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <Input label="To" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <div className="flex items-end">
            <Button className="w-full" icon={<Download className="size-4" />} loading={downloading} onClick={download}>Download CSV</Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between no-print">
        <h2 className="text-lg font-semibold">Summary report</h2>
        <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()} disabled={!data}>Print / save as PDF</Button>
      </div>

      {initialLoading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error || "No data"} onRetry={reload} />
      ) : (
        <Card className="mt-3 p-6 print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold">CivicAI complaint summary</h2>
            <p className="text-sm text-slate-500">Generated {formatDateTime(new Date().toISOString())}</p>
          </div>

          <section className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</h3>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ["Total complaints", data.overview.total],
                ["Completed", data.overview.completed],
                ["Resolution rate", formatPercent(data.overview.resolutionRate)],
                ["Avg. resolution time", formatHours(data.overview.avgResolutionHours)],
                ["Pending", data.overview.pending],
                ["Assigned", data.overview.assigned],
                ["In progress", data.overview.inProgress],
                ["Open high priority", data.overview.highPriorityOpen],
              ].map(([label, value]) => (
                <div key={label as string}><dt className="text-slate-500">{label}</dt><dd className="text-lg font-bold">{value}</dd></div>
              ))}
            </dl>
          </section>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Category distribution</h3>
              <Table headers={["Category", "Complaints"]} rows={data.analytics.byCategory.map((r) => [r.key, r.count])} />
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Department workload</h3>
              <Table headers={["Department", "Open", "Completed"]} rows={data.analytics.departmentWorkload.map((r) => [r.department, r.open, r.completed])} />
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Worker performance</h3>
              <Table
                headers={["Worker", "Active", "Completed", "Avg. time"]}
                rows={data.analytics.workerPerformance.map((w) => [w.name, w.active, w.completed, formatHours(w.avgResolutionHours)])}
              />
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Resolution time by category</h3>
              <Table headers={["Category", "Resolved", "Avg. time"]} rows={data.analytics.resolutionByCategory.map((r) => [r.category, r.count, formatHours(r.avgHours)])} />
            </section>
          </div>
        </Card>
      )}
    </>
  );
}
