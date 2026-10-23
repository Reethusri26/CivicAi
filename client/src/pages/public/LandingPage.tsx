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
import { api } from "../../lib/api";
import { buttonClasses } from "../../lib/cx";

const STEPS = [
  { icon: Camera, title: "Report", text: "Describe the problem, add photos and pin the location — even without GPS." },
  { icon: Sparkles, title: "Analyze", text: "AI suggests a category, priority and department. Staff always review it." },
  { icon: UserCheck, title: "Assign", text: "Administrators route the complaint to the right field worker." },
  { icon: CheckCircle2, title: "Resolve", text: "The worker updates progress and uploads proof. You see every step." },
];

const AUDIENCES = [
  {
    icon: Users,
    title: "For residents",
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
    points: [
      "A phone-friendly task list ordered by urgency",
      "One-tap directions to the exact spot",
      "Progress notes and before/after photos",
      "Only the tasks assigned to you",
    ],
  },
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
    a: "You, the administrators handling it and the field worker assigned to it. Workers see your name but not your contact details. The public Track page shows only the status and dates.",
  },
  {
    q: "Can I change or withdraw a complaint?",
    a: "Yes, until an administrator starts handling it. After that it's locked so the record stays accurate.",
  },
];

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

  return (
    <section className="border-y border-slate-200 bg-slate-50" aria-labelledby="stats-heading">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="stats-heading" className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
          Live from the platform
        </h2>
        {!stats ? (
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-4">
            <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
          </div>
        ) : stats.total === 0 ? (
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-600">
            The pilot has just started. Real numbers will appear here as residents report issues.
          </p>
        ) : (
          <dl className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <dt className="text-sm text-slate-600">Issues reported</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-slate-900">{stats.total.toLocaleString()}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <dt className="text-sm text-slate-600">Resolved</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-slate-900">{stats.completed.toLocaleString()}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <dt className="text-sm text-slate-600">Resolution rate</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-slate-900">
                {Math.round((stats.completed / stats.total) * 100)}%
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

// Illustration of the product, clearly marked as an example.
function HeroIllustration() {
  const rows = [
    { label: "Submitted", time: "09:12", done: true },
    { label: "Reviewed", time: "09:40", done: true },
    { label: "Assigned to Roads team", time: "10:05", done: true },
    { label: "Work in progress", time: "Now", done: false },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -inset-6 rounded-[2rem] bg-brand-500/20 blur-3xl" />
      <div className="relative rounded-2xl border border-white/10 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500">CIV-EXAMPLE</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Example</span>
        </div>
        <p className="mt-1 font-display text-lg font-bold text-slate-900">Pothole near the bus stop</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">In Progress</span>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">High priority</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="size-3.5" /> Main Road, Ward 12
        </div>
        <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4">
          {rows.map((row) => (
            <li key={row.label} className="relative">
              <span className={`absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-white ${row.done ? "bg-brand-600" : "animate-pulse bg-blue-500"}`} />
              <div className="flex justify-between text-sm">
                <span className="text-slate-800">{row.label}</span>
                <span className="text-xs text-slate-400">{row.time}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-900">
          <span className="font-semibold">AI suggestion:</span> Pothole · High priority · Roads department
        </div>
      </div>
    </div>
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
      <div className="relative overflow-hidden bg-night-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden
        />
        <PublicNav dark />
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200"
            >
              <ShieldCheck className="size-3.5" /> Transparent civic issue management
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-5 text-5xl font-extrabold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
            >
              Report.
              <br />
              Track.
              <br />
              <span className="text-brand-300">Resolve.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-6 max-w-xl text-lg text-slate-300"
            >
              Helping communities report civic problems and track them transparently from submission to resolution.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={reportHref} className={buttonClasses("inverse", "lg")}>
                Report an issue <ArrowRight className="size-4" />
              </Link>
              <Link to="/track" className={buttonClasses("ghost", "lg", "text-white ring-1 ring-inset ring-white/25 hover:bg-white/10")}>
                <Search className="size-4" /> Track a complaint
              </Link>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <HeroIllustration />
          </motion.div>
        </section>
      </div>

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="how-heading">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">How it works</p>
          <h2 id="how-heading" className="mt-2 text-3xl font-bold sm:text-4xl">From pothole to fixed, in four visible steps</h2>
          <p className="mt-3 text-slate-600">Every complaint follows the same accountable path, and every step is recorded on its timeline.</p>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-sm text-slate-400">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{step.text}</p>
              {index < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-5 top-1/2 hidden size-5 -translate-y-1/2 text-slate-300 lg:block" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </section>

      <PublicStats />

      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="audiences-heading">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">One platform, three roles</p>
          <h2 id="audiences-heading" className="mt-2 text-3xl font-bold sm:text-4xl">Built for everyone involved in a fix</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div key={audience.title} className="rounded-2xl border border-slate-200 p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <audience.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-bold">{audience.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {audience.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-night-900 text-white" aria-labelledby="ai-heading">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-brand-300">AI, used carefully</p>
            <h2 id="ai-heading" className="mt-2 text-3xl font-bold text-white sm:text-4xl">An assistant for triage — not a replacement for people</h2>
            <p className="mt-4 text-slate-300">
              CivicAI uses Google Gemini to read new reports and suggest how to route them. Suggestions are checked against a
              strict schema, shown to staff with an explanation, and can be corrected in one click.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Bot, title: "Category & priority", text: "Suggested from the report text, with a short explanation." },
              { icon: Building2, title: "Department routing", text: "Mapped through rules administrators can edit." },
              { icon: Eye, title: "Always labelled", text: "You can see whether Gemini or the keyword fallback made a suggestion." },
              { icon: LineChart, title: "Measured, not assumed", text: "Admins see how often staff kept the AI's suggestion." },
            ].map((item) => (
              <li key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <item.icon className="size-5 text-brand-300" aria-hidden />
                <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="worker-heading">
        <div className="grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-brand-700">Worker workflow</p>
            <h2 id="worker-heading" className="mt-2 text-3xl font-bold">Assigned → In progress → Completed</h2>
            <p className="mt-3 text-slate-600">
              Field teams get a mobile task list. They start work on site, add notes as they go, and can only close a task after
              uploading a photo of the finished job.
            </p>
          </div>
          <ol className="space-y-3">
            {[
              { icon: ClipboardCheck, label: "Receive the task with photos and location" },
              { icon: MapPin, label: "Navigate to the spot with one tap" },
              { icon: Wrench, label: "Start work and post progress notes" },
              { icon: Camera, label: "Upload completion photos and close" },
            ].map((step) => (
              <li key={step.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
                <step.icon className="size-5 text-brand-600" aria-hidden />
                <span className="text-sm font-medium text-slate-800">{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-20 sm:px-6" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-center text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                {faq.q}
                <span className="text-xl text-slate-400 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-brand-600" aria-labelledby="contact-heading">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 id="contact-heading" className="text-2xl font-bold text-white sm:text-3xl">Spotted a problem in your area?</h2>
            <p className="mt-2 text-brand-100">
              {supportEmail ? (
                <>
                  Questions about the pilot? Email{" "}
                  <a className="inline-flex items-center gap-1 font-semibold text-white underline" href={`mailto:${supportEmail}`}>
                    <Mail className="size-4" aria-hidden />
                    {supportEmail}
                  </a>
                </>
              ) : (
                "For emergencies, contact your local emergency services directly — CivicAI is for non-urgent civic issues."
              )}
            </p>
          </div>
          <Link to={reportHref} className={buttonClasses("inverse", "lg")}>
            Report an issue <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
