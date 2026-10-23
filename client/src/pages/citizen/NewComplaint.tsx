import { ArrowLeft, CheckCircle2, Copy, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ImageUploader } from "../../components/complaint/ImageUploader";
import { LocationPicker } from "../../components/complaint/LocationPicker";
import type { LocationValue } from "../../components/complaint/LocationPicker";
import { AiSourceBadge, PriorityBadge } from "../../components/ui/Badges";
import { Button, LinkButton } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { InlineAlert } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { CATEGORIES, MAX_IMAGES } from "../../lib/constants";
import type { Complaint } from "../../lib/types";

function Section({ step, title, description, children }: { step: number; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{step}</span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export default function NewComplaint() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("auto");
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<LocationValue>({ address: "", landmark: "", latitude: null, longitude: null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [created, setCreated] = useState<Complaint | null>(null);
  // One key per form fill, so a double-click or retry can't create duplicates.
  const idempotencyKey = useRef(newKey());

  const validate = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 5) next.title = "Give the issue a short title (at least 5 characters)";
    if (description.trim().length < 15) next.description = "Describe the issue in at least 15 characters";
    if (location.address.trim().length < 5 && location.latitude === null) next.address = "Enter an address or share your location";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    const form = new FormData();
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("category", category);
    form.append("address", location.address.trim());
    form.append("landmark", location.landmark.trim());
    if (location.latitude !== null && location.longitude !== null) {
      form.append("latitude", String(location.latitude));
      form.append("longitude", String(location.longitude));
    }
    files.forEach((file) => form.append("images", file));

    setSubmitting(true);
    setServerError("");
    setProgress(0);
    try {
      const res = await api.post("/complaints", form, {
        headers: { "Idempotency-Key": idempotencyKey.current },
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      setCreated(res.data.complaint);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setServerError(errorMessage(err, "Your complaint could not be submitted"));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("auto");
    setFiles([]);
    setLocation({ address: "", landmark: "", latitude: null, longitude: null });
    setCreated(null);
    idempotencyKey.current = newKey();
  };

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Complaint submitted</h1>
          <p className="mt-2 text-slate-600">Keep this reference number to track your complaint.</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <code className="rounded-lg bg-slate-100 px-4 py-2 font-mono text-lg font-semibold text-slate-900">{created.reference}</code>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Copy reference"
              onClick={() => navigator.clipboard?.writeText(created.reference).then(() => toast.success("Reference copied"))}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          {created.ai && (
            <div className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-4 text-brand-600" /> Initial triage</p>
                <AiSourceBadge source={created.ai.source} />
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Filed under <strong>{created.category}</strong>
                {created.department && <> for the <strong>{created.department}</strong> department</>}.
              </p>
              <div className="mt-2"><PriorityBadge priority={created.priority} /></div>
              <p className="mt-2 text-xs text-slate-500">An administrator will review this and may adjust it.</p>
            </div>
          )}
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <LinkButton to={`/citizen/complaints/${created.id}`}>View complaint</LinkButton>
            <Button variant="secondary" onClick={reset}>Report another issue</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/citizen" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to my complaints
      </Link>
      <h1 className="text-2xl font-bold sm:text-[1.75rem]">Report an issue</h1>
      <p className="mt-1 text-slate-600">Three short steps. Fields marked * are required.</p>

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <Section step={1} title="What's the problem?" description="A clear title and a few details help the right team respond faster.">
          <Input
            label="Title"
            required
            placeholder="e.g. Deep pothole near the bus stop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            maxLength={120}
            disabled={submitting}
          />
          <Textarea
            label="Description"
            required
            rows={5}
            placeholder="What did you see, how big is it, and is it causing any danger?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            hint={`${description.length}/2000`}
            maxLength={2000}
            disabled={submitting}
          />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={submitting}
            hint="Not sure? Leave it to CivicAI to suggest one — staff will check it.">
            <option value="auto">Let CivicAI suggest a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Section>

        <Section step={2} title="Add photos" description={`Optional, up to ${MAX_IMAGES}. Photos make it much easier to assess the issue.`}>
          <ImageUploader files={files} onChange={setFiles} max={MAX_IMAGES} disabled={submitting} />
        </Section>

        <Section step={3} title="Where is it?" description="Share your location or type the address — either works.">
          <LocationPicker value={location} onChange={setLocation} addressError={errors.address} disabled={submitting} />
        </Section>

        {serverError && <InlineAlert tone="error">{serverError}</InlineAlert>}

        <div className="sticky bottom-20 z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-raised backdrop-blur lg:bottom-4">
          {submitting && files.length > 0 && (
            <div className="mb-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{progress < 100 ? `Uploading photos… ${progress}%` : "Analysing your report…"}</p>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">You can edit or withdraw it until staff begin handling it.</p>
            <Button type="submit" size="lg" loading={submitting}>
              {submitting ? "Submitting…" : "Submit complaint"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
