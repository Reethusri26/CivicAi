import type { ReactNode } from "react";
import type { Photo } from "../../lib/photos";
import { Scene3D } from "../three/Hero3D";

interface PortalBannerProps {
  photo: Photo;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

// Home-page header for each portal: a real photo, a dark gradient for
// legible text, and the animated 3D street on the right.
export function PortalBanner({ photo, eyebrow, title, description, actions }: PortalBannerProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl bg-night-950 shadow-raised">
      <img src={photo.src} alt="" className="absolute inset-0 size-full object-cover opacity-45" loading="eager" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/85 to-brand-900/40" aria-hidden />
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-role opacity-50 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 size-64 rounded-full bg-role opacity-25 blur-3xl" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-role" aria-hidden />

      <div className="relative grid items-center gap-2 md:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 p-6 sm:p-8">
          {eyebrow && (
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 font-hero text-3xl font-bold leading-tight text-white sm:text-5xl">
            <span className="text-role">{title}</span>
          </h1>
          {description && <p className="mt-2 max-w-lg text-sm text-slate-300 sm:text-base">{description}</p>}
          {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
        </div>
        <Scene3D scene="road" className="-mt-4 h-40 min-w-0 md:mt-0 md:h-56 lg:h-64" />
      </div>
      <p className="absolute bottom-1.5 right-3 text-[10px] text-white/50">
        Photo: {photo.credit}, {photo.license}
      </p>
    </section>
  );
}
