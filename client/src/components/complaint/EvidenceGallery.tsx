import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";
import { fileUrl } from "../../lib/api";
import type { EvidenceFile } from "../../lib/types";
import { Modal } from "../ui/Modal";

function Thumb({ file, label, onOpen }: { file: EvidenceFile; label: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 transition hover:ring-brand-400"
      aria-label={`Open ${label}`}
    >
      {failed ? (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-slate-500">
          <ImageOff className="size-5" aria-hidden />
          Unavailable
        </span>
      ) : (
        <img src={fileUrl(file.url)} alt={label} loading="lazy" className="size-full object-cover" onError={() => setFailed(true)} />
      )}
    </button>
  );
}

export function EvidenceGallery({ files, title, emptyText }: { files: EvidenceFile[]; title: string; emptyText?: string }) {
  const [open, setOpen] = useState<number | null>(null);

  if (!files.length) {
    return emptyText ? <p className="text-sm text-slate-500">{emptyText}</p> : null;
  }

  const current = open !== null ? files[open] : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {files.map((file, index) => (
          <Thumb key={file.id} file={file} label={`${title} photo ${index + 1}`} onOpen={() => setOpen(index)} />
        ))}
      </div>
      <Modal open={current !== null} onClose={() => setOpen(null)} title={`${title} · ${(open ?? 0) + 1} of ${files.length}`} size="lg">
        {current && (
          <div>
            <img src={fileUrl(current.url)} alt={`${title} photo ${(open ?? 0) + 1}`} className="max-h-[65vh] w-full rounded-lg bg-slate-100 object-contain" />
            {files.length > 1 && (
              <div className="mt-3 flex justify-between">
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                  onClick={() => setOpen(((open ?? 0) - 1 + files.length) % files.length)}
                >
                  <ChevronLeft className="size-4" /> Previous
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                  onClick={() => setOpen(((open ?? 0) + 1) % files.length)}
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
