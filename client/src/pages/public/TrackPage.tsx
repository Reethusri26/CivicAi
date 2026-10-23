import { Search } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { StatusStepper } from "../../components/complaint/ComplaintTimeline";
import { StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Field";
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
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold">Track a complaint</h1>
      <p className="mt-2 text-slate-600">
        Enter the reference number you received when the complaint was submitted. Only the status and dates are shown here —
        sign in to see full details.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="Reference number"
          placeholder="CIV-260101-ABC123"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          wrapperClassName="flex-1"
          className="font-mono uppercase"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Button type="submit" size="lg" loading={loading} icon={<Search className="size-4" />} disabled={!reference.trim()}>
          Track
        </Button>
      </form>

      {error && (
        <div className="mt-6">
          <InlineAlert tone="error">{error}</InlineAlert>
        </div>
      )}

      {result && (
        <Card className="mt-8 p-5 sm:p-6">
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
    </div>
  );
}
