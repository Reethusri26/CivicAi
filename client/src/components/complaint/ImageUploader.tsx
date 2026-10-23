import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_MB } from "../../lib/constants";
import { cx } from "../../lib/cx";

interface ImageUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  max: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function ImageUploader({ files, onChange, max, label = "Photos", hint, disabled }: ImageUploaderProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const add = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted: File[] = [];
    const problems: string[] = [];

    for (const file of Array.from(incoming)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) problems.push(`${file.name}: use JPEG, PNG or WebP`);
      else if (file.size > MAX_IMAGE_MB * 1024 * 1024) problems.push(`${file.name}: larger than ${MAX_IMAGE_MB} MB`);
      else accepted.push(file);
    }

    const room = max - files.length;
    if (accepted.length > room) problems.push(`Only ${max} photos allowed`);
    setError(problems.join(". "));
    if (room > 0) onChange([...files, ...accepted.slice(0, room)]);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) add(event.dataTransfer.files);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">
          {files.length}/{max}
        </span>
      </div>

      {files.length < max && (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
            dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="mt-3 text-sm font-medium text-slate-800">
            <span className="text-brand-700">Choose photos</span> or drag them here
          </span>
          <span className="mt-1 text-xs text-slate-500">{hint || `JPEG, PNG or WebP · up to ${MAX_IMAGE_MB} MB each`}</span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              add(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      )}

      {error && <p className="mt-2 text-sm text-rose-600" role="alert">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <img src={previews[index]} alt={`Selected photo ${index + 1}: ${file.name}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                disabled={disabled}
                className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
