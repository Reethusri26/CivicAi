import { ArrowLeft, HardHat, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AiSummary, DetailRow, LocationCard, NotesList } from "../../components/complaint/ComplaintParts";
import { ComplaintTimeline, StatusStepper } from "../../components/complaint/ComplaintTimeline";
import { EvidenceGallery } from "../../components/complaint/EvidenceGallery";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { CATEGORIES } from "../../lib/constants";
import { cx } from "../../lib/cx";
import { formatDateTime } from "../../lib/format";
import type { Complaint } from "../../lib/types";
import { useApi } from "../../lib/useApi";

function FeedbackForm({ complaint, onSaved }: { complaint: Complaint; onSaved: (c: Complaint) => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) {
      setError("Choose a rating from 1 to 5 stars");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(`/complaints/${complaint.id}/feedback`, { rating, comment });
      onSaved(res.data.complaint);
      toast.success("Thanks for your feedback");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const labels = ["", "Very poor", "Poor", "Okay", "Good", "Excellent"];

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">How well was this resolved?</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer" onMouseEnter={() => setHover(value)}>
              <input type="radio" name="rating" value={value} className="peer sr-only" checked={rating === value} onChange={() => { setRating(value); setError(""); }} />
              <Star
                className={cx("size-8 transition peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500", (hover || rating) >= value ? "fill-amber-400 text-amber-400" : "text-slate-300")}
                aria-hidden
              />
              <span className="sr-only">{value} star{value > 1 ? "s" : ""} — {labels[value]}</span>
            </label>
          ))}
          <span className="ml-2 text-sm text-slate-600">{labels[hover || rating]}</span>
        </div>
        {error && <p className="mt-1 text-sm text-rose-600" role="alert">{error}</p>}
      </fieldset>
      <Textarea label="Comments (optional)" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button type="submit" loading={saving}>Submit feedback</Button>
    </form>
  );
}

export default function CitizenComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: complaint, error, initialLoading, reload, setData } = useApi(
    () => api.get(`/complaints/${id}`).then((res) => res.data.complaint as Complaint),
    [id]
  );
  const [editing, setEditing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", category: "", address: "" });

  if (initialLoading) return <LoadingState label="Loading complaint…" />;
  if (error || !complaint) return <ErrorState message={error || "Complaint not found"} onRetry={reload} />;

  const editable = complaint.status === "Pending";

  const openEdit = () => {
    setDraft({ title: complaint.title, description: complaint.description, category: complaint.category, address: complaint.address });
    setEditing(true);
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const res = await api.put(`/complaints/${complaint.id}`, draft);
      setData(res.data.complaint);
      setEditing(false);
      toast.success("Complaint updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await api.delete(`/complaints/${complaint.id}`);
      toast.success("Complaint withdrawn");
      navigate("/citizen", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
      setWithdrawing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/citizen" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" /> My complaints
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-sm text-slate-500">{complaint.reference}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-[1.75rem]">{complaint.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{complaint.category}</span>
          </div>
        </div>
        {editable && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Pencil className="size-4" />} onClick={openEdit}>Edit</Button>
            <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" />} onClick={() => setWithdrawing(true)} className="text-rose-700 hover:bg-rose-50">
              Withdraw
            </Button>
          </div>
        )}
      </div>

      <Card className="mt-6 p-5">
        <StatusStepper status={complaint.status} timeline={complaint.timeline} />
      </Card>

      {complaint.status === "Completed" && !complaint.feedback && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50/40">
          <CardHeader title="Your issue has been resolved" description="Tell us how it went — it helps the team improve." />
          <div className="p-5">
            <FeedbackForm complaint={complaint} onSaved={setData} />
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <div className="space-y-5 p-5">
              <p className="whitespace-pre-line text-sm text-slate-800">{complaint.description}</p>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Your photos</h3>
                <EvidenceGallery files={complaint.images} title="Reported issue" emptyText="No photos were added." />
              </div>
            </div>
          </Card>

          {(complaint.completionImages.length > 0 || complaint.notes.length > 0) && (
            <Card>
              <CardHeader title="Work updates" description="Notes and photos shared by the team handling your complaint." />
              <div className="space-y-5 p-5">
                {complaint.completionImages.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Completion photos</h3>
                    <EvidenceGallery files={complaint.completionImages} title="Completed work" />
                  </div>
                )}
                <NotesList notes={complaint.notes} />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Timeline" />
            <div className="p-5">
              <ComplaintTimeline timeline={complaint.timeline} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Summary" />
            <dl className="divide-y divide-slate-100 px-5 py-2">
              <DetailRow label="Department">{complaint.department || "To be decided"}</DetailRow>
              <DetailRow label="Submitted">{formatDateTime(complaint.createdAt)}</DetailRow>
              <DetailRow label="Last updated">{formatDateTime(complaint.updatedAt)}</DetailRow>
              {complaint.completedAt && <DetailRow label="Resolved">{formatDateTime(complaint.completedAt)}</DetailRow>}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Assigned to" />
            <div className="p-5">
              {complaint.worker ? (
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand-700"><HardHat className="size-5" /></span>
                  <div>
                    <p className="text-sm font-semibold">{complaint.worker.name}</p>
                    <p className="text-xs text-slate-500">{complaint.worker.department} department</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Not assigned yet. You'll be notified when a field worker takes it on.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Location" />
            <div className="p-5">
              <LocationCard complaint={complaint} />
            </div>
          </Card>

          {complaint.ai && (
            <Card>
              <CardHeader title="Automatic triage" />
              <div className="p-5">
                <AiSummary ai={complaint.ai} />
              </div>
            </Card>
          )}

          {complaint.feedback && (
            <Card>
              <CardHeader title="Your feedback" />
              <div className="p-5">
                <div className="flex gap-0.5" aria-label={`${complaint.feedback.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} className={cx("size-5", v <= complaint.feedback!.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} aria-hidden />
                  ))}
                </div>
                {complaint.feedback.comment && <p className="mt-2 text-sm text-slate-700">{complaint.feedback.comment}</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit complaint"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveEdit} loading={busy}>Save changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} data-autofocus />
          <Textarea label="Description" rows={4} maxLength={2000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <Select label="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Address" value={draft.address} maxLength={300} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={withdrawing}
        title="Withdraw this complaint?"
        message="It will be permanently removed along with its photos. This can't be undone."
        confirmLabel="Withdraw complaint"
        tone="danger"
        loading={busy}
        onConfirm={withdraw}
        onCancel={() => setWithdrawing(false)}
      />
    </div>
  );
}
