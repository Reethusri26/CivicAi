import { ArrowLeft, Camera, CheckCircle2, Play, Upload } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AiSummary, LocationCard, NotesList } from "../../components/complaint/ComplaintParts";
import { ComplaintTimeline, StatusStepper } from "../../components/complaint/ComplaintTimeline";
import { EvidenceGallery } from "../../components/complaint/EvidenceGallery";
import { ImageUploader } from "../../components/complaint/ImageUploader";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Field";
import { ConfirmDialog } from "../../components/ui/Modal";
import { ErrorState, InlineAlert, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { MAX_IMAGES } from "../../lib/constants";
import { formatDateTime } from "../../lib/format";
import type { Complaint } from "../../lib/types";
import { useApi } from "../../lib/useApi";

function NoteForm({ taskId, onSaved }: { taskId: string; onSaved: (c: Complaint) => void }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (text.trim().length < 2) return;
    setSaving(true);
    try {
      const res = await api.post(`/worker/tasks/${taskId}/notes`, { text: text.trim(), visibleToCitizen: !internal });
      onSaved(res.data.complaint);
      setText("");
      setInternal(false);
      toast.success("Note added");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea label="Add a progress note" rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Area barricaded, material arriving tomorrow" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="size-4 rounded border-slate-300 text-brand-600" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
          Internal note (hidden from the resident)
        </label>
        <Button type="submit" variant="secondary" size="sm" loading={saving} disabled={text.trim().length < 2}>Add note</Button>
      </div>
    </form>
  );
}

export default function WorkerTaskDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: task, error, initialLoading, reload, setData } = useApi(
    () => api.get(`/worker/tasks/${id}`).then((res) => res.data.complaint as Complaint),
    [id]
  );
  const [files, setFiles] = useState<File[]>([]);
  const [completionNote, setCompletionNote] = useState("");
  const [busy, setBusy] = useState<"" | "start" | "upload" | "complete">("");
  const [confirmComplete, setConfirmComplete] = useState(false);

  if (initialLoading) return <LoadingState label="Loading task…" />;
  if (error || !task) return <ErrorState message={error || "Task not found"} onRetry={reload} />;

  const start = async () => {
    setBusy("start");
    try {
      const res = await api.post(`/worker/tasks/${task.id}/start`);
      setData(res.data.complaint);
      toast.success("Work started. The resident has been notified.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const upload = async () => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    setBusy("upload");
    try {
      const res = await api.post(`/worker/tasks/${task.id}/evidence`, form);
      setData(res.data.complaint);
      setFiles([]);
      toast.success("Photos uploaded");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const complete = async () => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    if (completionNote.trim()) form.append("note", completionNote.trim());
    setBusy("complete");
    try {
      const res = await api.post(`/worker/tasks/${task.id}/complete`, form);
      setData(res.data.complaint);
      setFiles([]);
      setCompletionNote("");
      setConfirmComplete(false);
      toast.success("Task completed. Nice work!");
    } catch (err) {
      toast.error(errorMessage(err));
      setConfirmComplete(false);
    } finally {
      setBusy("");
    }
  };

  const hasEvidence = task.completionImages.length + files.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/worker" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" /> My tasks
      </Link>

      <div>
        <p className="font-mono text-sm text-slate-500">{task.reference}</p>
        <h1 className="mt-1 text-2xl font-bold">{task.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{task.category}</span>
        </div>
      </div>

      <Card className="mt-5 p-5">
        <StatusStepper status={task.status} timeline={task.timeline} />
      </Card>

      {/* Primary action area */}
      {task.status === "Assigned" && (
        <Card className="mt-5 border-brand-200 bg-brand-50/40 p-5">
          <h2 className="text-base font-semibold">Ready to begin?</h2>
          <p className="mt-1 text-sm text-slate-600">Start work when you're on site. The resident will see that work has begun.</p>
          <Button className="mt-4 w-full sm:w-auto" size="lg" icon={<Play className="size-4" />} loading={busy === "start"} onClick={start}>
            Start work
          </Button>
        </Card>
      )}

      {task.status === "In Progress" && (
        <Card className="mt-5 border-brand-200 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Camera className="size-5 text-brand-600" /> Completion evidence</h2>
          <p className="mt-1 text-sm text-slate-600">Upload at least one photo of the finished work before marking the task complete.</p>
          {task.completionImages.length > 0 && (
            <div className="mt-4">
              <EvidenceGallery files={task.completionImages} title="Uploaded evidence" />
            </div>
          )}
          <div className="mt-4">
            <ImageUploader
              files={files}
              onChange={setFiles}
              max={Math.max(0, Math.min(MAX_IMAGES, 10 - task.completionImages.length))}
              label="New photos"
              disabled={Boolean(busy)}
            />
          </div>
          {files.length > 0 && (
            <Button variant="secondary" size="sm" className="mt-3" icon={<Upload className="size-4" />} loading={busy === "upload"} onClick={upload}>
              Upload {files.length} photo{files.length > 1 ? "s" : ""} now
            </Button>
          )}
          <Textarea
            wrapperClassName="mt-4"
            label="Completion note (shared with the resident)"
            rows={2}
            maxLength={1000}
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            placeholder="What was done?"
          />
          {!hasEvidence && <div className="mt-4"><InlineAlert tone="warning">Add a photo to enable completion.</InlineAlert></div>}
          <Button
            variant="success"
            size="lg"
            className="mt-4 w-full sm:w-auto"
            icon={<CheckCircle2 className="size-4" />}
            disabled={!hasEvidence || Boolean(busy)}
            onClick={() => setConfirmComplete(true)}
          >
            Mark as complete
          </Button>
        </Card>
      )}

      {task.status === "Completed" && (
        <div className="mt-5">
          <InlineAlert tone="success">Completed {formatDateTime(task.completedAt)}. Thank you!</InlineAlert>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Issue details" description={task.citizen?.name ? `Reported by ${task.citizen.name} · ${formatDateTime(task.createdAt)}` : undefined} />
            <div className="space-y-5 p-5">
              <p className="whitespace-pre-line text-sm text-slate-800">{task.description}</p>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Resident's photos</h3>
                <EvidenceGallery files={task.images} title="Reported issue" emptyText="No photos were provided." />
              </div>
              {task.status === "Completed" && task.completionImages.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Completion photos</h3>
                  <EvidenceGallery files={task.completionImages} title="Completed work" />
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <div className="space-y-5 p-5">
              {task.status !== "Completed" && <NoteForm taskId={task.id} onSaved={setData} />}
              <NotesList notes={task.notes} showVisibility />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Location" />
            <div className="p-5">
              <LocationCard complaint={task} directions />
            </div>
          </Card>
          {task.ai && (
            <Card>
              <CardHeader title="AI assessment" />
              <div className="p-5"><AiSummary ai={task.ai} /></div>
            </Card>
          )}
          <Card>
            <CardHeader title="History" />
            <div className="p-5"><ComplaintTimeline timeline={task.timeline} /></div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmComplete}
        title="Mark this task complete?"
        message={`The resident will be notified and asked for feedback. ${files.length ? `${files.length} new photo(s) will be uploaded.` : ""}`}
        confirmLabel="Complete task"
        loading={busy === "complete"}
        onConfirm={complete}
        onCancel={() => setConfirmComplete(false)}
      />
    </div>
  );
}
