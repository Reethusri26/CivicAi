import {
  BookOpen,
  Building2,
  ChevronDown,
  HardHat,
  KeyRound,
  LifeBuoy,
  Mail,
  Search,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/Badges";
import { TiltCard } from "../../components/three/TiltCard";
import { STATUSES } from "../../lib/constants";
import { cx } from "../../lib/cx";
import type { Role, Status } from "../../lib/types";

interface Topic {
  q: string;
  a: ReactNode;
}

interface Guide {
  label: string;
  icon: typeof UserRound;
  gradient: string;
  steps: string[];
  topics: Topic[];
}

const GUIDES: Record<Role, Guide> = {
  citizen: {
    label: "Residents",
    icon: UserRound,
    gradient: "from-brand-500 to-fuchsia-500",
    steps: [
      "Sign in and tap Report an issue.",
      "Add a short title and describe what you see.",
      "Add up to 5 photos — they help the team a lot.",
      "Share your location or type the address, then submit.",
      "Keep the reference number. You'll get notified at every step.",
    ],
    topics: [
      { q: "How do I report an issue?", a: "Go to Report an issue (the + button). Fill in the title and description, add photos, and either share your location or type the address. Press Submit complaint — you'll see a reference number like CIV-261023-ABC123." },
      { q: "Which category should I choose?", a: "If you're not sure, leave it on “Let CivicAI suggest a category”. The system suggests one and staff check it." },
      { q: "Why does it ask for my location?", a: "So the field team can find the exact spot. It's optional — if you deny permission, just type the address and a nearby landmark." },
      { q: "How do I track my complaint?", a: <>Open it from My complaints to see its timeline, notes and photos. Anyone can also check the status with the reference number on the <Link to="/track" className="font-semibold text-brand-700 underline">Track a complaint</Link> page.</> },
      { q: "Can I change or withdraw a complaint?", a: "Yes, while it is still Pending. Open it and use Edit or Withdraw. Once staff start handling it, it's locked so the record stays accurate." },
      { q: "How do I give feedback?", a: "When the work is completed you'll get a notification. Open the complaint, choose 1–5 stars and optionally add a comment. You can rate each complaint once." },
      { q: "Who can see my details?", a: "Administrators see your contact details. While the work is open, the assigned field worker sees your name and phone (never your email), and you can see the worker's name, department and phone. Phones are hidden again once the work is completed. The public tracking page shows only status and dates." },
    ],
  },
  worker: {
    label: "Field workers",
    icon: HardHat,
    gradient: "from-amber-400 to-orange-600",
    steps: [
      "Open My tasks — the most urgent work is at the top.",
      "Open a task and tap Get directions.",
      "On site, tap Start work. The resident is notified.",
      "Add notes as you go (tick Internal for staff-only notes).",
      "Upload at least one photo of the finished work, then Mark as complete.",
    ],
    topics: [
      { q: "Why can't I see a task?", a: "You only see tasks an administrator has assigned to you. If you expected one, ask your administrator to check the assignment." },
      { q: "How are tasks ordered?", a: "In progress first, then assigned, then completed. Within each group, High priority comes before Medium and Low." },
      { q: "Why is “Mark as complete” greyed out?", a: "A completion photo is required. Add at least one photo of the finished work and the button becomes available." },
      { q: "What's the difference between a note and an internal note?", a: "Normal notes are shown to the resident. Tick “Internal note” for anything only staff should see." },
      { q: "A task was moved to someone else", a: "Administrators can reassign tasks with a reason. You'll get a notification and the task disappears from your list." },
      { q: "Using CivicAI on a phone", a: "Add the site to your home screen from your browser menu for one-tap access. The task list and photo upload are designed for phones." },
    ],
  },
  admin: {
    label: "Administrators",
    icon: Building2,
    gradient: "from-mint-400 to-sky-500",
    steps: [
      "Check Overview for new and high-priority complaints.",
      "Open a complaint, read it and look at the photos.",
      "Check the AI suggestion; apply it or set category, priority and department yourself.",
      "Mark it reviewed, then Assign a worker (matching-department workers are listed first).",
      "Follow progress, read the completion photos and the resident's feedback.",
    ],
    topics: [
      { q: "How do I add a field worker?", a: "Go to Workers → Add worker. Enter name, email, department and a starting password, then share the login with the worker privately." },
      { q: "A worker forgot their password", a: "Workers → Password next to their name. Set a new one and share it privately. They're signed out everywhere." },
      { q: "How do I remove a worker?", a: "Workers → Edit → untick “Account active”. They're signed out immediately and their task history is kept." },
      { q: "How do departments and categories work?", a: "Each category (e.g. Pothole) is routed to one department (e.g. Roads). Change this in Departments; new complaints use the new rules." },
      { q: "What does the AI suggestion mean?", a: "If Gemini is configured it suggests a category, priority and department with an explanation. Otherwise keyword rules are used and labelled “Rule-based fallback”. It's a suggestion — you decide." },
      { q: "Reassigning a complaint", a: "Open it and click Reassign. A reason is required and recorded on the timeline. Both workers are notified." },
      { q: "Exporting data", a: "Reports → Download CSV (opens in Excel/Sheets; residents' contact details are excluded) or Print / save as PDF for a summary." },
    ],
  },
};

const STATUS_HELP: Record<Status, string> = {
  Pending: "Submitted and waiting for review.",
  Reviewed: "Checked by the operations team; waiting for a worker.",
  Assigned: "A field worker has been given the task.",
  "In Progress": "The worker has started on site.",
  Completed: "Work finished, with a photo of the result.",
};

function Accordion({ topics, query }: { topics: Topic[]; query: string }) {
  const filtered = topics.filter((t) => `${t.q} ${typeof t.a === "string" ? t.a : ""}`.toLowerCase().includes(query.toLowerCase()));
  if (!filtered.length) return <p className="py-6 text-center text-sm text-slate-500">No help topics match “{query}”.</p>;
  return (
    <div className="space-y-3">
      {filtered.map((topic) => (
        <details key={topic.q} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card open:border-brand-300 open:shadow-raised [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
            {topic.q}
            <ChevronDown className="size-5 shrink-0 text-brand-600 transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="mt-3 text-sm leading-relaxed text-slate-600">{topic.a}</div>
        </details>
      ))}
    </div>
  );
}

export default function HelpPage({ role }: { role?: Role }) {
  const [tab, setTab] = useState<Role>(role || "citizen");
  const [query, setQuery] = useState("");
  const guide = GUIDES[tab];
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined;

  const allMatches = useMemo(
    () => (query ? (Object.keys(GUIDES) as Role[]).filter((r) => r !== tab && GUIDES[r].topics.some((t) => t.q.toLowerCase().includes(query.toLowerCase()))) : []),
    [query, tab]
  );

  return (
    <div className={cx("mx-auto max-w-5xl", !role && "px-4 py-12 sm:px-6")}>
      <section className="relative overflow-hidden rounded-3xl bg-night-950 p-8 text-white shadow-raised sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]" aria-hidden />
        <div className={cx("pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br opacity-50 blur-3xl", guide.gradient)} aria-hidden />
        <div className="relative">
          <span className={cx("grid size-14 place-items-center rounded-2xl bg-gradient-to-br shadow-lg", guide.gradient)}>
            <LifeBuoy className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 font-hero text-4xl font-bold text-white sm:text-5xl">Help centre</h1>
          <p className="mt-2 max-w-xl text-slate-300">Step-by-step guides and answers to common questions.</p>
          <label className="relative mt-6 block max-w-xl">
            <span className="sr-only">Search help</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help, e.g. password, photo, assign"
              className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-mint-400 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {!role && (
        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5" role="tablist" aria-label="Help for">
          {(Object.keys(GUIDES) as Role[]).map((r) => {
            const Icon = GUIDES[r].icon;
            return (
              <button
                key={r}
                role="tab"
                aria-selected={tab === r}
                onClick={() => setTab(r)}
                className={cx(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:flex-row sm:justify-center sm:text-sm",
                  tab === r ? "bg-white text-brand-700 shadow" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="size-4" aria-hidden /> {GUIDES[r].label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="quick-start">
          <h2 id="quick-start" className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="size-5 text-brand-600" aria-hidden /> Quick start for {guide.label.toLowerCase()}
          </h2>
          <ol className="mt-4 space-y-3">
            {guide.steps.map((step, index) => (
              <li key={step}>
                <TiltCard depth={6}>
                  <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                    <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br font-hero text-sm font-bold text-white", guide.gradient)}>
                      {index + 1}
                    </span>
                    <p className="pt-1.5 text-sm text-slate-700">{step}</p>
                  </div>
                </TiltCard>
              </li>
            ))}
          </ol>

          <h2 className="mt-10 text-xl font-bold">What the statuses mean</h2>
          <dl className="mt-4 space-y-2.5">
            {STATUSES.map((status) => (
              <div key={status} className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <dt className="w-28 shrink-0"><StatusBadge status={status} /></dt>
                <dd className="text-sm text-slate-600">{STATUS_HELP[status]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="faq-topics">
          <h2 id="faq-topics" className="text-xl font-bold">Common questions</h2>
          <div className="mt-4">
            <Accordion topics={guide.topics} query={query} />
          </div>
          {allMatches.length > 0 && !role && (
            <p className="mt-3 text-sm text-slate-500">
              Also found in:{" "}
              {allMatches.map((r) => (
                <button key={r} onClick={() => setTab(r)} className="mr-2 font-semibold text-brand-700 underline">{GUIDES[r].label}</button>
              ))}
            </p>
          )}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="size-5 text-brand-600" aria-hidden /> Passwords</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Use the eye button next to a password box to show or hide what you've typed.</li>
              <li>Your browser or phone will offer to save your password after you sign in — choose Save to sign in faster next time.</li>
              <li>Change your password any time from Profile (or Settings for admins).</li>
              <li>Forgotten it? Workers: ask your administrator. Residents: contact support below.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 p-5 text-white shadow-raised">
            <h3 className="flex items-center gap-2 font-semibold"><Mail className="size-5" aria-hidden /> Still need help?</h3>
            <p className="mt-1 text-sm text-brand-100">
              {supportEmail ? (
                <>Email <a href={`mailto:${supportEmail}`} className="font-semibold text-white underline">{supportEmail}</a> and include your complaint reference if you have one.</>
              ) : (
                "Contact your municipal office or pilot coordinator. For emergencies, call your local emergency services."
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
