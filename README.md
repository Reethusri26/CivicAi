# CivicAI

**Report. Track. Resolve.** — a civic issue management platform that connects residents who report problems
(potholes, garbage, leaks, street lights) with the administrators who route them and the field workers who fix them.

Every complaint gets a reference number and a visible timeline from submission to the photo of the finished work.

| Portal | Who | What they can do |
| --- | --- | --- |
| Citizen | Residents | Register, report issues with photos and location, track status, receive notifications, rate the fix |
| Admin | Operations staff | Review, classify, assign/reassign, manage workers and departments, analytics, CSV/PDF reports |
| Worker | Field staff | Mobile task list, directions, start work, progress notes, completion photos, complete |

Developed by Reethu Sri.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Chart.js, Axios, Framer Motion, lucide icons
- **Backend:** Node.js (≥20), Express 5, MongoDB Atlas via Mongoose, JWT, bcrypt, Multer, zod, helmet, express-rate-limit
- **AI:** Google Gemini via `@google/genai` (optional), with a labelled keyword-rule fallback
- **File storage:** MongoDB GridFS (evidence photos), served through short-lived signed URLs
- **Hosting:** Vercel (frontend), Render (API), MongoDB Atlas (database)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design and the reasoning behind these choices.

## Quick start (local, no database needed)

```bash
cd server && npm install
npm run dev:memory        # API on :5000 with an in-memory MongoDB and demo accounts
```

```bash
cd client && npm install
npm run dev               # Web app on :5173
```

`dev:memory` prints demo accounts (admin, three workers, one citizen) that share one local-only password. Nothing is persisted.

To run against a real database instead, copy `server/.env.example` to `server/.env`, fill it in, and run `npm run dev`.

## Tests

```bash
cd server && npm test     # 40 API integration tests, including the full complaint lifecycle
cd client && npm run lint && npm run build
```

> On Windows, if the project lives in a very long path, the test MongoDB binary may fail to start. Set
> `MONGOMS_DOWNLOAD_DIR` to a short folder such as `%USERPROFILE%\.cache\mongodb-binaries`.

See [docs/TESTING.md](docs/TESTING.md) for what is covered and what was verified manually.

## Configuration

| Where | File | Notes |
| --- | --- | --- |
| API | [`server/.env.example`](server/.env.example) | `MONGODB_URI`, `JWT_SECRET` required; Gemini, admin bootstrap and CORS optional |
| Web | [`client/.env.example`](client/.env.example) | `VITE_API_URL` required in production |

There are **no hardcoded accounts**. Create the first admin with `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first start, or:

```bash
cd server && npm run admin:create -- --email you@example.org --name "Your Name"
```

Workers are created by an admin from **Admin → Workers**.

## Deployment

Step-by-step instructions, environment variables, and the pilot-launch checklist are in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API endpoints are documented in [docs/API.md](docs/API.md).

## Known limitations

- Gemini integration is implemented and tested against a mocked client; it has **not** yet been run against the live
  Gemini API in this codebase. Without `GEMINI_API_KEY` the rule-based fallback is used and labelled as such.
- Notifications are in-app only (polled every 60 s). Email/push are not implemented.
- GridFS keeps photos in the same Atlas cluster; the free tier's 512 MB will fill after a few thousand photos.
- No password-reset-by-email yet; admins reset worker passwords, citizens change their own while signed in (or use Google sign-in once configured).
- Google sign-in is built and tested with a simulated Google verifier; it needs a real OAuth Client ID (see DEPLOYMENT.md) before it appears.
- The JWT is stored in `localStorage` (see the threat-model note in ARCHITECTURE.md).
- Privacy notice and terms are pilot drafts and need review by the operating organisation.
