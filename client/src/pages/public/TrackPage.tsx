import { MapPinned, Search } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { StatusStepper } from "../../components/complaint/ComplaintTimeline";
import { StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PublicFooter, PublicNav } from "../../components/layout/PublicLayout";
import { InlineAlert } from "../../components/ui/States";
import { api, errorMessage } from "../../lib/api";
import { formatDate, formatDateTime } from "../../lib/format";
import type { Status, TimelineEntry } from "../../lib/types";

interface TrackResult {
  reference: string;
  category: string;
  department: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  timeline: TimelineEntry[];
}

const EVENT_LABEL: Record<string, string> = {
  submitted: "Complaint submitted",
  reviewed: "Reviewed by the operations team",
  assigned: "Assigned to a field worker",
  reassigned: "Reassigned to another field worker",
  started: "Work started",
  completed: "Work completed",
};

export default function TrackPage() {
  const [params, setParams] = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") || "");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ref = reference.trim().toUpperCase();
    if (!ref) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/public/track/${encodeURIComponent(ref)}`);
      setResult(res.data.complaint);
      setParams({ ref });
    } catch (err) {
      setError(errorMessage(err, "We couldn't find that complaint"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="relative overflow-hidden bg-night-950">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden />
        <div className="pointer-events-none absolute -left-32 -top-32 size-[30rem] rounded-full bg-brand-600/40 blur-[120px]" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-10 size-[24rem] rounded-full bg-mint-500/20 blur-[120px]" aria-hidden />
        <PublicNav dark />
        <section className="relative mx-auto max-w-3xl px-4 pb-24 pt-14 text-center sm:px-6">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg glow-brand">
            <MapPinned className="size-7" aria-hidden />
          </span>
          <h1 className="mt-6 text-5xl font-bold text-white sm:text-6xl">
            Track a <span className="text-gradient">complaint</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Enter the reference number you received when the complaint was submitted. Only the status and dates are shown here —
            sign in to see full details.
          </p>
          <form
            onSubmit={submit}
            className="mx-auto mt-10 flex max-w-xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md sm:flex-row"
          >
            <label htmlFor="track-ref" className="sr-only">Reference number</label>
            <input
              id="track-ref"
              placeholder="CIV-260101-ABC123"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="h-12 flex-1 rounded-xl border-0 bg-white px-4 font-mono text-base uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 focus:ring-2 focus:ring-mint-400 focus:outline-none"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              icon={<Search className="size-5" />}
              disabled={!reference.trim()}
              className="rounded-xl bg-mint-400 font-bold text-night-950 hover:bg-mint-300"
            >
              Track
            </Button>
          </form>
        </section>
      </div>

      <main id="main" className="relative mx-auto -mt-12 w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
      {!result && !error && (
        <Card className="p-6 text-center text-sm text-slate-500 shadow-raised">
          Your reference looks like <span className="font-mono font-semibold text-slate-700">CIV-YYMMDD-XXXXXX</span> and is shown
          after you submit a complaint.
        </Card>
      )}

      {error && (
        <div className="mt-6">
          <InlineAlert tone="error">{error}</InlineAlert>
        </div>
      )}

      {result && (
        <Card className="p-5 shadow-raised sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-slate-500">{result.reference}</p>
              <p className="mt-1 text-lg font-semibold">
                {result.category}
                {result.department && <span className="font-normal text-slate-500"> · {result.department}</span>}
              </p>
            </div>
            <StatusBadge status={result.status} />
          </div>
          <div className="mt-6">
            <StatusStepper status={result.status} timeline={result.timeline} />
          </div>
          <ol className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            {[...result.timeline].reverse().map((entry, index) => (
              <li key={index} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-800">{EVENT_LABEL[entry.event] || entry.status}</span>
                <span className="shrink-0 text-slate-500">{formatDateTime(entry.date)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs text-slate-500">
            Submitted {formatDate(result.createdAt)} · Last updated {formatDate(result.updatedAt)}
          </p>
        </Card>
      )}
      </main>
      <PublicFooter />
    </div>
  );
}
