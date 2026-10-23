import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

const control =
  "block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:outline-none disabled:bg-slate-50 disabled:text-slate-500";

const ringFor = (error?: string) =>
  error ? "ring-rose-300 focus:ring-rose-500" : "ring-slate-300 focus:ring-brand-500";

interface WrapperProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldWrapper({ id, label, hint, error, required, children, className }: WrapperProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-600" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type Common = { label?: ReactNode; hint?: ReactNode; error?: string; wrapperClassName?: string };

export function Input({ label, hint, error, wrapperClassName, className, id, required, type, ...rest }: InputHTMLAttributes<HTMLInputElement> & Common) {
  const autoId = useId();
  const fieldId = id || autoId;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  const input = (
    <input
      id={fieldId}
      type={isPassword && visible ? "text" : type}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
      className={cx(control, ringFor(error), isPassword && "pr-11", className)}
      {...rest}
    />
  );

  return (
    <FieldWrapper id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {isPassword ? (
        <div className="relative">
          {input}
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-slate-500 hover:text-brand-700 focus-visible:outline-offset-[-2px]"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            aria-controls={fieldId}
            disabled={rest.disabled}
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      ) : (
        input
      )}
    </FieldWrapper>
  );
}

export function Textarea({ label, hint, error, wrapperClassName, className, id, required, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & Common) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldWrapper id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cx(control, ringFor(error), "min-h-24", className)}
        {...rest}
      />
    </FieldWrapper>
  );
}

export function Select({ label, hint, error, wrapperClassName, className, id, required, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & Common) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldWrapper id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cx(control, ringFor(error), "pr-8", className)}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
