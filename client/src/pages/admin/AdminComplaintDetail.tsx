import { ArrowLeft, CheckCheck, Mail, Phone, RefreshCw, Sparkles, Star, UserCheck } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AiSummary, DetailRow, LocationCard, NotesList } from "../../components/complaint/ComplaintParts";
import { ComplaintTimeline, StatusStepper } from "../../components/complaint/ComplaintTimeline";
import { EvidenceGallery } from "../../components/complaint/EvidenceGallery";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { ErrorState, InlineAlert, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { CATEGORIES, PRIORITIES } from "../../lib/constants";
import { cx } from "../../lib/cx";
import { formatDateTime } from "../../lib/format";
import type { Complaint, Department, WorkerSummary } from "../../lib/types";
import { useApi } from "../../lib/useApi";

function AssignModal({
  complaint,
  workers,
  open,
  onClose,
  onDone,
}: {
  complaint: Complaint;
  workers: WorkerSummary[];
  open: boolean;
  onClose: () => void;
  onDone: (c: Complaint) => void;
}) {
  const toast = useToast();
  const [workerId, setWorkerId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isReassign = Boolean(complaint.worker);

  const active = workers.filter((w) => w.isActive && w.id !== complaint.worker?.id);
  const matching = active.filter((w) => w.department === complaint.department).sort((a, b) => a.activeTasks - b.activeTasks);
  const others = active.filter((w) => w.department !== complaint.department);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!workerId) return setError("Choose a worker");
    if (isReassign && !reason.trim()) return setError("Give a reason for reassigning");
    setSaving(true);
    setError("");
    try {
      const res = await api.post(`/admin/complaints/${complaint.id}/assign`, { workerId, reason: reason.trim() });
      onDone(res.data.complaint);
      toast.success(res.data.message);
      onClose();
      setWorkerId("");
      setReason("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const row = (w: WorkerSummary, recommended = false) => (
    <label
      key={w.id}
      className={cx(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition",
        workerId === w.id ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <span className="flex items-center gap-3">
        <input type="radio" name="worker" value={w.id} checked={workerId === w.id} onChange={() => setWorkerId(w.id)} className="size-4 text-brand-600" />
        <span>
          <span className="block text-sm font-medium text-slate-900">
            {w.name}
            {recommended && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">Matches department</span>}
          </span>
          <span className="block text-xs text-slate-500">{w.department}</span>
        </span>
      </span>
      <span className="text-right text-xs text-slate-500">
        <span className="block font-semibold text-slate-700">{w.activeTasks}</span> open tasks
      </span>
    </label>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReassign ? "Reassign complaint" : "Assign a worker"}
      description={complaint.department ? `Routed to ${complaint.department}. Workers with the fewest open tasks are listed first.` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving} disabled={!workerId}>{isReassign ? "Reassign" : "Assign"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        {active.length === 0 ? (
          <InlineAlert tone="warning">
            There are no other active workers. <Link to="/admin/workers" className="font-semibold underline">Add a worker</Link> first.
          </InlineAlert>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Workers">
            {matching.map((w) => row(w, true))}
            {others.length > 0 && matching.length > 0 && <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Other departments</p>}
            {others.map((w) => row(w))}
          </div>
        )}
        {isReassign && (
          <Textarea label="Reason for reassignment" required rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} hint="Recorded on the complaint timeline" />
        )}
      </form>
    </Modal>
  );
}

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: complaint, error, initialLoading, reload, setData } = useApi(
    () => api.get(`/admin/complaints/${id}`).then((res) => res.data.complaint as Complaint),
    [id]
  );
  const refs = useApi(
    () =>
      Promise.all([api.get("/admin/workers"), api.get("/admin/departments")]).then(([w, d]) => ({
        workers: w.data.workers as WorkerSummary[],
        departments: d.data.departments as Department[],
      })),
    []
  );
  const [assigning, setAssigning] = useState(false);
  const [busy, setBusy] = useState("");
  const [fields, setFields] = useState<{ category: string; priority: string; department: string } | null>(null);
  const [note, setNote] = useState({ text: "", visibleToCitizen: false });

  if (initialLoading) return <LoadingState label="Loading complaint…" />;
  if (error || !complaint) return <ErrorState message={error || "Complaint not found"} onRetry={reload} />;

  const run = async (key: string, request: () => Promise<{ data: { complaint: Complaint; message: string } }>) => {
    setBusy(key);
    try {
      const res = await request();
      setData(res.data.complaint);
      toast.success(res.data.message);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setBusy("");
    }
  };

  const editing = fields ?? { category: complaint.category, priority: complaint.priority, department: complaint.department };
  const fieldsChanged =
    editing.category !== complaint.category || editing.priority !== complaint.priority || editing.department !== complaint.department;
  const aiDiffers =
    complaint.ai &&
    (complaint.ai.category !== complaint.category ||
      complaint.ai.priority !== complaint.priority ||
      (complaint.ai.department && complaint.ai.department !== complaint.department));

  const canAssign = complaint.status !== "Completed";

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/admin/complaints" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Complaints
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-sm text-slate-500">{complaint.reference}</p>
          <h1 className="mt-1 text-2xl font-bold">{complaint.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{complaint.category}</span>
            {complaint.department && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{complaint.department}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {complaint.status === "Pending" && (
            <Button variant="secondary" icon={<CheckCheck className="size-4" />} loading={busy === "review"} onClick={() => run("review", () => api.post(`/admin/complaints/${complaint.id}/review`))}>
              Mark reviewed
            </Button>
          )}
          {canAssign && (
            <Button icon={<UserCheck className="size-4" />} onClick={() => setAssigning(true)}>
              {complaint.worker ? "Reassign" : "Assign worker"}
            </Button>
          )}
        </div>
      </div>

      <Card className="mt-6 p-5">
        <StatusStepper status={complaint.status} timeline={complaint.timeline} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Report" description={`Submitted ${formatDateTime(complaint.createdAt)}`} />
            <div className="space-y-5 p-5">
              <p className="whitespace-pre-line text-sm text-slate-800">{complaint.description}</p>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Citizen evidence</h3>
                <EvidenceGallery files={complaint.images} title="Reported issue" emptyText="No photos were provided." />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Completion evidence</h3>
                <EvidenceGallery files={complaint.completionImages} title="Completed work" emptyText="None yet — the worker uploads this before completing." />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" description="Internal notes are hidden from the resident." />
            <div className="space-y-5 p-5">
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run("note", () => api.post(`/admin/complaints/${complaint.id}/notes`, note))) setNote({ text: "", visibleToCitizen: false });
                }}
              >
                <Textarea label="Add a note" rows={2} maxLength={1000} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="size-4 rounded border-slate-300" checked={note.visibleToCitizen} onChange={(e) => setNote({ ...note, visibleToCitizen: e.target.checked })} />
                    Visible to the resident
                  </label>
                  <Button type="submit" variant="secondary" size="sm" loading={busy === "note"} disabled={note.text.trim().length < 2}>Add note</Button>
                </div>
              </form>
              <NotesList notes={complaint.notes} showVisibility />
            </div>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <div className="p-5"><ComplaintTimeline timeline={complaint.timeline} /></div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Classification" description="Changes are recorded on the timeline." />
            <div className="space-y-3 p-5">
              <Select label="Category" value={editing.category} onChange={(e) => setFields({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Select label="Priority" value={editing.priority} onChange={(e) => setFields({ ...editing, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </Select>
              <Select label="Department" value={editing.department} onChange={(e) => setFields({ ...editing, department: e.target.value })}>
                <option value="">Unassigned</option>
                {refs.data?.departments.map((d) => <option key={d.id}>{d.name}</option>)}
              </Select>
              {fieldsChanged && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    loading={busy === "fields"}
                    onClick={async () => {
                      if (await run("fields", () => api.patch(`/admin/complaints/${complaint.id}`, editing))) setFields(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setFields(null)}>Reset</Button>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title={<span className="flex items-center gap-1.5"><Sparkles className="size-4 text-brand-600" /> AI suggestion</span>}
              action={
                <Button size="sm" variant="ghost" icon={<RefreshCw className="size-3.5" />} loading={busy === "ai"} onClick={() => run("ai", () => api.post(`/admin/complaints/${complaint.id}/reanalyze`))}>
                  Re-run
                </Button>
              }
            />
            <div className="p-5">
              {complaint.ai ? (
                <>
                  <AiSummary ai={complaint.ai} />
                  {aiDiffers && (
                    <Button className="mt-4 w-full" variant="secondary" size="sm" loading={busy === "apply"} onClick={() => run("apply", () => api.post(`/admin/complaints/${complaint.id}/apply-ai`))}>
                      Apply this suggestion
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No analysis stored for this complaint. Use Re-run to analyse it.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="People" />
            <div className="space-y-4 p-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported by</p>
                <p className="mt-1 font-medium text-slate-900">{complaint.citizen?.name || "Unknown"}</p>
                {complaint.citizen?.email && (
                  <a href={`mailto:${complaint.citizen.email}`} className="mt-0.5 flex items-center gap-1.5 text-brand-700 hover:underline"><Mail className="size-3.5" />{complaint.citizen.email}</a>
                )}
                {complaint.citizen?.phone && (
                  <a href={`tel:${complaint.citizen.phone}`} className="mt-0.5 flex items-center gap-1.5 text-brand-700 hover:underline"><Phone className="size-3.5" />{complaint.citizen.phone}</a>
                )}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned worker</p>
                {complaint.worker ? (
                  <>
                    <p className="mt-1 font-medium text-slate-900">{complaint.worker.name}</p>
                    <p className="text-slate-500">{complaint.worker.department}</p>
                    {complaint.worker.phone && <a href={`tel:${complaint.worker.phone}`} className="mt-0.5 flex items-center gap-1.5 text-brand-700 hover:underline"><Phone className="size-3.5" />{complaint.worker.phone}</a>}
                  </>
                ) : (
                  <p className="mt-1 text-slate-500">Not assigned</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Dates" />
            <dl className="divide-y divide-slate-100 px-5 py-2">
              <DetailRow label="Submitted">{formatDateTime(complaint.createdAt)}</DetailRow>
              <DetailRow label="Reviewed">{formatDateTime(complaint.reviewedAt)}</DetailRow>
              <DetailRow label="Assigned">{formatDateTime(complaint.assignedAt)}</DetailRow>
              <DetailRow label="Started">{formatDateTime(complaint.startedAt)}</DetailRow>
              <DetailRow label="Completed">{formatDateTime(complaint.completedAt)}</DetailRow>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Location" />
            <div className="p-5"><LocationCard complaint={complaint} /></div>
          </Card>

          {complaint.feedback && (
            <Card>
              <CardHeader title="Resident feedback" />
              <div className="p-5">
                <div className="flex gap-0.5" aria-label={`${complaint.feedback.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((v) => <Star key={v} className={cx("size-5", v <= complaint.feedback!.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} aria-hidden />)}
                </div>
                {complaint.feedback.comment && <p className="mt-2 text-sm text-slate-700">{complaint.feedback.comment}</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {refs.data && (
        <AssignModal complaint={complaint} workers={refs.data.workers} open={assigning} onClose={() => setAssigning(false)} onDone={(c) => { setData(c); refs.reload(); }} />
      )}
    </div>
  );
}
