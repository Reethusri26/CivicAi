import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  HardHat,
  LineChart,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PublicFooter, PublicNav } from "../../components/layout/PublicLayout";
import { Hero3D, Scene3D } from "../../components/three/Hero3D";
import { PHOTOS } from "../../lib/photos";
import { TiltCard } from "../../components/three/TiltCard";
import { api } from "../../lib/api";
import { buttonClasses, cx } from "../../lib/cx";

const STEPS = [
  { icon: Camera, title: "Report", text: "Describe the problem, add photos and pin the location — even without GPS.", tile: "from-brand-500 to-brand-700" },
  { icon: Sparkles, title: "Analyze", text: "AI suggests a category, priority and department. Staff always review it.", tile: "from-fuchsia-500 to-brand-600" },
  { icon: UserCheck, title: "Assign", text: "Administrators route the complaint to the right field worker.", tile: "from-amber-400 to-orange-500" },
  { icon: CheckCircle2, title: "Resolve", text: "The worker updates progress and uploads proof. You see every step.", tile: "from-mint-400 to-mint-600" },
];

const AUDIENCES = [
  {
    icon: Users,
    title: "For residents",
    accent: "from-brand-500 to-fuchsia-500",
    points: [
      "Report an issue in under two minutes",
      "Get a reference number you can track",
      "See who is handling it and what they did",
      "Rate the fix once it's resolved",
    ],
  },
  {
    icon: Building2,
    title: "For administrators",
    accent: "from-amber-400 to-rose-500",
    points: [
      "One queue with search, filters and priorities",
      "Assign and reassign with a recorded reason",
      "Department workload and resolution times",
      "CSV exports without residents' personal data",
    ],
  },
  {
    icon: HardHat,
    title: "For field workers",
    accent: "from-mint-400 to-sky-500",
    points: [
      "A phone-friendly task list ordered by urgency",
      "One-tap directions to the exact spot",
      "Progress notes and before/after photos",
      "Only the tasks assigned to you",
    ],
  },
];

const CATEGORIES = ["Potholes", "Garbage", "Water leaks", "Street lights", "Drainage", "Dead animals"];

const ISSUE_PHOTOS = [
  { label: "Potholes", department: "Roads", photo: PHOTOS.pothole, tag: "bg-amber-400 text-night-950" },
  { label: "Garbage", department: "Sanitation", photo: PHOTOS.garbage, tag: "bg-mint-400 text-night-950" },
  { label: "Water leaks", department: "Water", photo: PHOTOS.waterLeak, tag: "bg-sky-400 text-night-950" },
  { label: "Street lights", department: "Electricity", photo: PHOTOS.streetLights, tag: "bg-yellow-300 text-night-950" },
  { label: "Waterlogging", department: "Drainage", photo: PHOTOS.waterlogging, tag: "bg-brand-400 text-white" },
];

const FAQS = [
  {
    q: "Do I need an account to report an issue?",
    a: "Yes. A free account lets us send you updates and stops anonymous spam. Anyone with a reference number can check its status on the Track page without signing in.",
  },
  {
    q: "What if I don't want to share my location?",
    a: "Location sharing is optional. You can type an address and a nearby landmark instead.",
  },
  {
    q: "How is AI used, and can it make mistakes?",
    a: "When configured, Google Gemini reads the title and description and suggests a category, priority and department. It can be wrong, so administrators review and can correct every suggestion. If AI is unavailable, simple keyword rules are used and labelled as such.",
  },
  {
    q: "Who can see my complaint?",
    a: "You, the administrators handling it and the field worker assigned to it. While the work is open, the worker sees your name and phone (never your email), and you see theirs; phone numbers are hidden again once the work is done. The public Track page shows only the status and dates.",
  },
  {
    q: "Can I change or withdraw a complaint?",
    a: "Yes, until an administrator starts handling it. After that it's locked so the record stays accurate.",
  },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

function PublicStats() {
  const [stats, setStats] = useState<{ total: number; completed: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get("/public/stats")
      .then((res) => setStats(res.data.stats))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const items = stats
    ? [
        { label: "Issues reported", value: stats.total.toLocaleString() },
        { label: "Resolved", value: stats.completed.toLocaleString() },
        { label: "Resolution rate", value: `${Math.round((stats.completed / stats.total) * 100)}%` },
      ]
    : [];

  return (
    <section className="relative bg-white" aria-labelledby="stats-heading">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 id="stats-heading" className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Live from the platform
        </h2>
        {!stats ? (
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : stats.total === 0 ? (
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600">
            The pilot has just started. Real numbers will appear here as residents report issues.
          </p>
        ) : (
          <dl className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 p-6 text-center shadow-card">
                <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
                <dd className="mt-1 bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text font-display text-5xl font-bold text-transparent">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

// Glass status chips floating over the 3D city; clearly an illustration.
function FloatingChip({ className, dot, label, sub, delay }: { className: string; dot: string; label: string; sub: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{ opacity: { delay }, y: { delay, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
      className={cx(
        "pointer-events-none absolute hidden items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-white shadow-xl backdrop-blur-md sm:flex",
        className
      )}
      aria-hidden
    >
      <span className={cx("size-2.5 rounded-full", dot)} />
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[11px] text-white/70">{sub}</span>
      </span>
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const location = useLocation();
  const reportHref = user?.role === "citizen" ? "/citizen/new" : user ? "/login" : "/register";
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined;

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [location.hash]);

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-night-950">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" aria-hidden />
        <div className="pointer-events-none absolute -left-40 -top-40 size-[36rem] rounded-full bg-brand-600/40 blur-[120px]" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-40 size-[30rem] rounded-full bg-mint-500/25 blur-[120px]" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-[24rem] rounded-full bg-fuchsia-600/20 blur-[120px]" aria-hidden />

        <PublicNav dark />

        <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-24 lg:pt-14">
          <div className="min-w-0">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-mint-400/30 bg-mint-400/10 px-3 py-1 text-xs font-semibold text-mint-300"
            >
              <ShieldCheck className="size-3.5" /> Transparent civic issue management
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-6 text-[3.5rem] font-bold leading-[0.95] text-white sm:text-7xl lg:text-[5.5rem]"
            >
              Report.
              <br />
              Track.
              <br />
              <span className="text-gradient">Resolve.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl"
            >
              Helping communities report civic problems and track them transparently from submission to resolution.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to={reportHref}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-mint-400 px-7 text-base font-bold text-night-950 shadow-[0_10px_40px_-8px_rgb(62_232_187/0.7)] transition hover:-translate-y-0.5 hover:bg-mint-300"
              >
                Report an issue <ArrowRight className="size-5" />
              </Link>
              <Link
                to="/track"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                <Search className="size-5" /> Track a complaint
              </Link>
            </motion.div>
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Issue types you can report">
              {CATEGORIES.map((c) => (
                <li key={c} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-w-0">
            <Hero3D className="aspect-square w-full max-w-[38rem] lg:ml-auto" />
            <FloatingChip className="left-2 top-[18%]" dot="bg-amber-400" label="Pothole reported" sub="Pending review" delay={0.6} />
            <FloatingChip className="right-0 top-[44%]" dot="bg-brand-400" label="Street light" sub="Work in progress" delay={0.9} />
            <FloatingChip className="bottom-[14%] left-[12%]" dot="bg-mint-400" label="Garbage cleared" sub="Resolved with photo" delay={1.2} />
            <p className="mt-1 text-center text-[11px] text-slate-500 lg:text-right">Illustration</p>
          </div>
        </section>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8" aria-labelledby="how-heading">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">How it works</p>
          <h2 id="how-heading" className="mt-3 text-4xl font-bold sm:text-5xl">From pothole to fixed, in four visible steps</h2>
          <p className="mt-4 text-lg text-slate-600">Every complaint follows the same accountable path, and every step is recorded on its timeline.</p>
        </motion.div>
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <motion.li key={step.title} {...reveal} transition={{ duration: 0.5, delay: index * 0.08 }}>
              <TiltCard>
                <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-raised">
                  <span className="pointer-events-none absolute -right-3 -top-6 font-display text-[7rem] font-bold leading-none text-slate-100" aria-hidden>
                    {index + 1}
                  </span>
                  <span className={cx("relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg", step.tile)} style={{ transform: "translateZ(30px)" }}>
                    <step.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="relative mt-6 text-2xl font-bold">{step.title}</h3>
                  <p className="relative mt-2 text-slate-600">{step.text}</p>
                </div>
              </TiltCard>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Real issues gallery */}
      <section className="bg-slate-50 py-24" aria-labelledby="issues-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal} className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">What you can report</p>
              <h2 id="issues-heading" className="mt-3 text-4xl font-bold sm:text-5xl">Real problems on real streets</h2>
              <p className="mt-4 text-lg text-slate-600">If it's broken, blocked, leaking or dark, report it in a couple of minutes.</p>
            </div>
            <Link to={reportHref} className={buttonClasses("primary", "lg", "rounded-xl")}>
              Report one now <ArrowRight className="size-4" />
            </Link>
          </motion.div>
          <ul className="mt-12 grid auto-rows-[15rem] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ISSUE_PHOTOS.map((item, index) => (
              <motion.li key={item.label} {...reveal} transition={{ duration: 0.5, delay: index * 0.07 }} className={index === 0 ? "lg:col-span-2 lg:row-span-2" : ""}>
                <TiltCard depth={8}>
                  <figure className="group relative h-full overflow-hidden rounded-3xl bg-night-900 shadow-raised">
                    <img
                      src={item.photo.src}
                      alt={item.photo.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/30 to-transparent" aria-hidden />
                    <figcaption className="absolute inset-x-0 bottom-0 p-5" style={{ transform: "translateZ(40px)" }}>
                      <span className={cx("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", item.tag)}>{item.department}</span>
                      <p className="mt-2 font-display text-2xl font-bold text-white">{item.label}</p>
                    </figcaption>
                  </figure>
                </TiltCard>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3D street */}
      <section className="relative overflow-hidden bg-night-950" aria-labelledby="street-heading">
        <img src={PHOTOS.cityNight.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-night-950 via-night-950/70 to-night-950" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6 lg:px-8">
          <motion.p {...reveal} className="text-sm font-semibold uppercase tracking-[0.2em] text-mint-300">On the ground</motion.p>
          <motion.h2 {...reveal} id="street-heading" className="mx-auto mt-3 max-w-3xl text-4xl font-bold text-white sm:text-5xl">
            Every street, <span className="text-gradient">tracked until it's fixed</span>
          </motion.h2>
          <motion.p {...reveal} className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Reports become tasks, tasks become crews on site, and the pin turns green only when there's a photo of the finished work.
          </motion.p>
        </div>
        <Scene3D scene="road" className="relative mx-auto h-72 max-w-6xl sm:h-96" />
      </section>

      <PublicStats />

      {/* Audiences */}
      <section id="features" className="bg-slate-50 py-24" aria-labelledby="audiences-heading">
        <div className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">One platform, three roles</p>
            <h2 id="audiences-heading" className="mt-3 text-4xl font-bold sm:text-5xl">Built for everyone involved in a fix</h2>
          </motion.div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {AUDIENCES.map((audience, index) => (
              <motion.div key={audience.title} {...reveal} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <TiltCard depth={6}>
                  <div className="h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-raised">
                    <span className={cx("grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg", audience.accent)}>
                      <audience.icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-2xl font-bold">{audience.title}</h3>
                    <ul className="mt-5 space-y-3">
                      {audience.points.map((point) => (
                        <li key={point} className="flex gap-3 text-slate-700">
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-mint-600" aria-hidden />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="relative overflow-hidden bg-night-950 text-white" aria-labelledby="ai-heading">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute right-0 top-0 size-[30rem] rounded-full bg-brand-600/30 blur-[120px]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
          <motion.div {...reveal}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint-300">AI, used carefully</p>
            <h2 id="ai-heading" className="mt-3 text-4xl font-bold text-white sm:text-5xl">
              An assistant for triage — <span className="text-gradient">not a replacement for people</span>
            </h2>
            <p className="mt-5 text-lg text-slate-300">
              CivicAI uses Google Gemini to read new reports and suggest how to route them. Suggestions are checked against a
              strict schema, shown to staff with an explanation, and can be corrected in one click.
            </p>
          </motion.div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Bot, title: "Category & priority", text: "Suggested from the report text, with a short explanation." },
              { icon: Building2, title: "Department routing", text: "Mapped through rules administrators can edit." },
              { icon: Eye, title: "Always labelled", text: "You can see whether Gemini or the keyword fallback made a suggestion." },
              { icon: LineChart, title: "Measured, not assumed", text: "Admins see how often staff kept the AI's suggestion." },
            ].map((item, index) => (
              <motion.li
                key={item.title}
                {...reveal}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-brand-400/50 hover:bg-white/[0.07]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.text}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Worker workflow */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" aria-labelledby="worker-heading">
        <motion.div
          {...reveal}
          className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-fuchsia-700 p-8 text-white shadow-2xl sm:p-12 lg:grid-cols-2"
        >
          <img src={PHOTOS.roadCrew.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-20 mix-blend-luminosity" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-mint-400/30 blur-3xl" aria-hidden />
          <div className="relative min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint-300">Worker workflow</p>
            <h2 id="worker-heading" className="mt-3 text-4xl font-bold text-white">Assigned → In progress → Completed</h2>
            <p className="mt-4 text-lg text-brand-100">
              Field teams get a mobile task list. They start work on site, add notes as they go, and can only close a task after
              uploading a photo of the finished job.
            </p>
          </div>
          <ol className="relative space-y-3">
            {[
              { icon: ClipboardCheck, label: "Receive the task with photos and location" },
              { icon: MapPin, label: "Navigate to the spot with one tap" },
              { icon: Wrench, label: "Start work and post progress notes" },
              { icon: Camera, label: "Upload completion photos and close" },
            ].map((step, index) => (
              <li key={step.label} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="font-medium">{step.label}</span>
                <span className="ml-auto font-display text-sm text-white/50">0{index + 1}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-24 sm:px-6" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-center text-4xl font-bold">Frequently asked questions</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-card transition open:border-brand-300 open:shadow-raised [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-slate-900">
                {faq.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xl text-brand-700 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="relative scroll-mt-20 overflow-hidden bg-night-950" aria-labelledby="contact-heading">
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/30 blur-[140px]" aria-hidden />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="min-w-0">
            <h2 id="contact-heading" className="text-3xl font-bold text-white sm:text-5xl">
              Spotted a problem <span className="text-gradient">in your area?</span>
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-300">
              {supportEmail ? (
                <>
                  Questions about the pilot? Email{" "}
                  <a className="inline-flex items-center gap-1 font-semibold text-mint-300 underline" href={`mailto:${supportEmail}`}>
                    <Mail className="size-4" aria-hidden />
                    {supportEmail}
                  </a>
                </>
              ) : (
                "For emergencies, contact your local emergency services directly — CivicAI is for non-urgent civic issues."
              )}
            </p>
          </div>
          <Link to={reportHref} className={buttonClasses("inverse", "lg", "h-14 rounded-xl px-8 text-base glow-brand")}>
            Report an issue <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
