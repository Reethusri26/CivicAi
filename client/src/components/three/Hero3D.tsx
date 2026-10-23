import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { cx } from "../../lib/cx";

const CityScene = lazy(() => import("./CityScene"));

const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Still isometric illustration used while the 3D scene loads, and instead of
// it when WebGL is unavailable or the visitor prefers reduced motion.
function StaticCity() {
  return (
    <svg viewBox="0 0 400 300" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="bld" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8579ff" />
          <stop offset="1" stopColor="#4728d8" />
        </linearGradient>
      </defs>
      <polygon points="200,60 380,160 200,260 20,160" fill="#1d1a4a" />
      <polygon points="200,120 290,170 270,180 180,130" fill="#0f0d2b" />
      <polygon points="110,170 200,120 220,130 130,180" fill="#0f0d2b" />
      {[
        [130, 130, 60],
        [250, 120, 90],
        [180, 190, 40],
        [290, 180, 70],
        [100, 175, 45],
      ].map(([x, y, h], i) => (
        <g key={i}>
          <polygon points={`${x},${y - h} ${x + 26},${y - h + 14} ${x + 26},${y + 14} ${x},${y}`} fill="url(#bld)" />
          <polygon points={`${x},${y - h} ${x - 26},${y - h + 14} ${x - 26},${y + 14} ${x},${y}`} fill="#3b23ae" />
          <polygon points={`${x},${y - h} ${x + 26},${y - h + 14} ${x},${y - h + 28} ${x - 26},${y - h + 14}`} fill="#a8a3ff" />
        </g>
      ))}
      <circle cx="232" cy="96" r="12" fill="#f59e0b" />
      <circle cx="160" cy="78" r="12" fill="#8579ff" />
      <circle cx="300" cy="120" r="12" fill="#3ee8bb" />
    </svg>
  );
}

export function Hero3D({ className }: { className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [enabled] = useState(() => typeof window !== "undefined" && supportsWebGL() && !prefersReducedMotion());
  const [visible, setVisible] = useState(true);

  // Stop rendering frames when the hero is scrolled out of view.
  useEffect(() => {
    if (!enabled || !wrapper.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <div ref={wrapper} className={cx("relative", className)}>
      {enabled ? (
        <Suspense fallback={<StaticCity />}>
          <CityScene active={visible} />
        </Suspense>
      ) : (
        <StaticCity />
      )}
    </div>
  );
}
