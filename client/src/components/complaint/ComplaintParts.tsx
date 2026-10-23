import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { ReactNode } from "react";
import { formatDateTime, formatPercent, mapsLink, mapsSearchLink, osmEmbed } from "../../lib/format";
import type { AiResult, Complaint, Note } from "../../lib/types";
import { AiSourceBadge } from "../ui/Badges";
import { buttonClasses } from "../../lib/cx";

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export function LocationCard({ complaint, showMap = true, directions = false }: { complaint: Complaint; showMap?: boolean; directions?: boolean }) {
  const hasCoords = complaint.latitude !== null && complaint.longitude !== null;
  const link = hasCoords ? mapsLink(complaint.latitude!, complaint.longitude!) : complaint.address ? mapsSearchLink(complaint.address) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
        <div>
          <p className="text-slate-900">{complaint.address || "No address given"}</p>
          {complaint.landmark && <p className="text-slate-500">Near {complaint.landmark}</p>}
          {hasCoords && (
            <p className="font-mono text-xs text-slate-500">
              {complaint.latitude}, {complaint.longitude}
            </p>
          )}
        </div>
      </div>
      {showMap && hasCoords && (
        <iframe
          title={`Map of ${complaint.reference}`}
          src={osmEmbed(complaint.latitude!, complaint.longitude!)}
          className="h-48 w-full rounded-lg border border-slate-200"
          loading="lazy"
        />
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses(directions ? "primary" : "secondary", "sm", directions ? "w-full sm:w-auto" : "")}
        >
          {directions ? <Navigation className="size-4" aria-hidden /> : <ExternalLink className="size-4" aria-hidden />}
          {directions ? "Get directions" : "Open in Google Maps"}
        </a>
      )}
    </div>
  );
}

export function AiSummary({ ai }: { ai: AiResult }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <AiSourceBadge source={ai.source} />
        {ai.source === "gemini" && ai.usedImage && <span className="text-xs text-slate-500">Photo included in analysis</span>}
      </div>
      <dl className="divide-y divide-slate-100">
        <DetailRow label="Suggested category">{ai.category}</DetailRow>
        <DetailRow label="Suggested priority">{ai.priority}</DetailRow>
        {ai.department && <DetailRow label="Suggested department">{ai.department}</DetailRow>}
        {ai.source === "gemini" && ai.confidence !== null && (
          <DetailRow label="Model self-reported confidence">{formatPercent(ai.confidence)}</DetailRow>
        )}
      </dl>
      {ai.explanation && <p className="rounded-lg bg-slate-50 p-3 text-slate-700">{ai.explanation}</p>}
      {ai.source === "rules" && ai.fallbackReason && (
        <p className="text-xs text-slate-500">Used keyword rules because: {ai.fallbackReason.toLowerCase()}.</p>
      )}
      <p className="text-xs text-slate-500">
        AI output is a suggestion for staff to review, not a final decision.
        {ai.analyzedAt && <> Analysed {formatDateTime(ai.analyzedAt)}.</>}
      </p>
    </div>
  );
}

export function NotesList({ notes, showVisibility = false }: { notes: Note[]; showVisibility?: boolean }) {
  if (!notes.length) return <p className="text-sm text-slate-500">No notes yet.</p>;
  return (
    <ul className="space-y-3">
      {[...notes].reverse().map((note) => (
        <li key={note.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="whitespace-pre-line text-sm text-slate-800">{note.text}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            {note.authorName || (note.authorRole === "admin" ? "Operations team" : "Field worker")}
            {note.date && <> · {formatDateTime(note.date)}</>}
            {showVisibility && !note.visibleToCitizen && (
              <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">Internal</span>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
