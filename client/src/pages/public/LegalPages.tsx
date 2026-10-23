import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "../../lib/cx";

function Prose({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:text-slate-700 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-slate-700">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-slate-500">
        This is a pilot-stage notice. The operating organisation should review it with legal counsel before public launch.
      </p>
      {children}
    </article>
  );
}

export function PrivacyPage() {
  return (
    <Prose title="Privacy notice">
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and, optionally, a phone number.</li>
        <li>Complaint details: the title, description, photos, address and, if you choose to share it, your device location.</li>
        <li>Activity records: status changes and notes added by staff while handling your complaint.</li>
      </ul>
      <h2>How it is used</h2>
      <p>
        Your information is used only to handle your complaint and keep you informed. Complaint text (and, if enabled by the
        operator, the first photo) may be sent to Google's Gemini API to suggest a category and priority.
      </p>
      <h2>Who can see it</h2>
      <ul>
        <li>Administrators can see your complaint and contact details.</li>
        <li>The assigned field worker sees your name, the complaint, photos and location — not your email or phone.</li>
        <li>The public tracking page shows only the reference, category, department, status and dates.</li>
      </ul>
      <h2>Storage and security</h2>
      <p>
        Data is stored in MongoDB Atlas. Photos are not publicly accessible; they are served through short-lived signed links
        to authorised users only. Passwords are stored as one-way hashes.
      </p>
      <h2>Your choices</h2>
      <p>You can edit or withdraw a complaint until staff start handling it, and update your profile at any time.</p>
    </Prose>
  );
}

export function TermsPage() {
  return (
    <Prose title="Terms of use">
      <h2>Purpose</h2>
      <p>CivicAI is for reporting non-urgent civic issues such as potholes, garbage, water leaks and street lights.</p>
      <h2>Not for emergencies</h2>
      <p>Do not use CivicAI to report emergencies. Contact your local emergency services directly.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Submit accurate reports and only photos you have the right to share.</li>
        <li>Don't upload images that identify people unnecessarily or contain offensive content.</li>
        <li>Accounts that submit abusive or spam reports may be suspended.</li>
      </ul>
      <h2>AI suggestions</h2>
      <p>Automated classifications are suggestions to help staff. They may be inaccurate and are reviewed by people.</p>
      <h2>No guarantee of resolution time</h2>
      <p>Resolution depends on the responsible department's capacity. Timelines shown are records of what has happened, not commitments.</p>
    </Prose>
  );
}

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className={buttonClasses("primary", "md", "mt-6")}>Back to home</Link>
    </div>
  );
}
