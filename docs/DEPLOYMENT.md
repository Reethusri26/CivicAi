# Deployment and pilot launch

Current references: frontend `https://civic-ai-jet.vercel.app`, API `https://civicai-backend-lz1n.onrender.com`.
**This version has not been deployed yet** — the steps below are what needs to happen.

## ⚠️ Do this first: retire the default accounts

The previous version created `admin@civicai.com` / `admin123` and `worker@civicai.com` / `worker123` on every start,
and its admin and worker APIs required no authentication. Assume the production database has been readable by anyone.

1. Deploy this version (it no longer seeds those accounts, and blocks those two passwords in production).
2. Reset the admin password: `npm run admin:create -- --email admin@civicai.com` with production `MONGODB_URI` set.
3. In Admin → Workers, reset or deactivate `worker@civicai.com`.
4. Rotate `JWT_SECRET` (signs everyone out) and the MongoDB Atlas database user's password.

## 1. MongoDB Atlas

1. Database Access → a user with `readWrite` on the `civicai` database only.
2. Network Access → allow Render's outbound IPs (or `0.0.0.0/0` with a strong password for the free tier).
3. Copy the `mongodb+srv://…/civicai` connection string.

Existing data is compatible: legacy fields (`image`, `workerNotes`, old department names) are read and mapped automatically.
Old complaints have no `reference`; they still appear everywhere but cannot be tracked publicly.

## 2. Render (API)

Either use the Blueprint in [`render.yaml`](../render.yaml) or set manually: root directory `server`,
build `npm ci --omit=dev`, start `npm start`, health check `/api/health`, Node 22.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas string |
| `JWT_SECRET` | 48+ random bytes: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `CORS_ORIGINS` | `https://civic-ai-jet.vercel.app` (comma-separate extra origins) |
| `GEMINI_API_KEY` | Optional, from Google AI Studio |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Only for the very first start on an empty database; remove afterwards |

Verify: `curl https://<api>/api/health` → `{"success":true,"status":"ok"}`.

## 3. Vercel (frontend)

Root directory `client`, framework Vite. [`client/vercel.json`](../client/vercel.json) adds SPA rewrites (so refreshing
`/citizen` works) and security headers.

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://civicai-backend-lz1n.onrender.com` (no `/api`, no trailing slash) |
| `VITE_SUPPORT_EMAIL` | Optional |

## 4. Gemini

1. Create a key in Google AI Studio; set `GEMINI_API_KEY` on Render only (never in Vercel).
2. Submit 10–20 real-looking test reports; confirm admin detail shows the **Gemini** badge, not "Rule-based fallback".
3. Only then consider `GEMINI_ANALYZE_IMAGES=true`, and spot-check results with photos.

## Smoke test after deploying

1. Register a citizen, submit a complaint with 2 photos → reference shown.
2. Track the reference on `/track` while signed out.
3. Admin: review, assign a worker. Worker: start, add a note, upload a photo, complete.
4. Citizen: see completion photos, timeline and notifications; leave feedback.
5. Admin: overview, analytics, CSV export.
6. Confirm `GET https://<api>/api/admin/complaints` without a token returns 401.

## Pilot-launch checklist

- [ ] Default accounts retired and secrets rotated (above)
- [ ] Production smoke test passed
- [ ] Departments and category routing reviewed with the partner organisation
- [ ] Real worker accounts created; workers have tried the mobile flow on their own phones
- [ ] Gemini verified live, or a decision recorded to pilot with the rule-based fallback
- [ ] Privacy notice and terms reviewed by the operating organisation; support contact set (`VITE_SUPPORT_EMAIL`)
- [ ] Render plan chosen (free tier sleeps; the first request after idle is slow)
- [ ] Atlas backups enabled (M10+ has continuous backup; M0 needs periodic `mongodump`)
- [ ] Someone owns monitoring: Render logs + uptime check on `/api/health`
- [ ] Feedback channel for pilot users and a weekly review of complaints, feedback ratings and AI agreement
