# Architecture

```
 Browser (Vercel)                       API (Render, Node/Express)                    MongoDB Atlas
┌───────────────────────┐   HTTPS    ┌──────────────────────────────────────┐      ┌────────────────────────┐
│ React SPA             │  Bearer    │ helmet · CORS allowlist · rate limit │      │ users / admins /       │
│  /         landing    │  JWT       │ authenticate → authorize(role)       │      │ workers                │
│  /citizen  resident   ├───────────►│ zod validation                       ├─────►│ complaints (+timeline, │
│  /worker   field team │            │ controllers → services               │      │   notes, ai, feedback) │
│  /admin    operations │◄───────────┤ central error handler                │      │ departments            │
│                       │  JSON      │                                      │      │ notifications          │
│ <img> signed file URL ├───────────►│ GET /api/files/:id?exp&sig  ─────────┼─────►│ evidence.files/chunks  │
└───────────────────────┘            │                                      │      │   (GridFS)             │
                                     │ ai/analyzeComplaint ──► Gemini API   │      └────────────────────────┘
                                     │         └─(fails)──► ai/rules.js     │
                                     └──────────────────────────────────────┘
```

## Backend layout (`server/src`)

| Folder | Responsibility |
| --- | --- |
| `config/` | Environment loading/validation, DB connection, constants (categories, statuses, default departments) |
| `models/` | Mongoose schemas with indexes on status, citizen, assigned worker, category, department, priority, createdAt |
| `middleware/` | `authenticate`/`authorize`, Multer upload limits + magic-byte image check, zod `validate`, rate limits, error handler |
| `controllers/` | Thin HTTP handlers per area (auth, citizen complaints, admin, worker, misc) |
| `services/` | Business logic: workflow transitions + serialization, GridFS storage, notifications, analytics, departments |
| `ai/` | Gemini client with schema validation and timeout; keyword fallback; orchestration |
| `utils/` | Tokens, schemas, CSV, errors, admin bootstrap |

## Complaint workflow

```
Pending ──review──► Reviewed ──assign──► Assigned ──start──► In Progress ──complete──► Completed
   └──────────────assign──────────────────┘   ▲  reassign (reason required)  │
                                             └────────────────────────────────┘
```

Transitions are enforced server-side in `services/complaintService.js` (`assertTransition`). Every transition appends a
timeline entry and emits notifications. Completion requires at least one evidence photo. Citizens may edit or withdraw
only while `Pending`; feedback is accepted once, only when `Completed`.

## Authorization model

- Three account collections (`User` = citizen, `Admin`, `Worker`), kept from the original design to preserve existing data.
- JWT payload: `{ sub, role, tv }`. On every request the account is loaded from the database, so deactivation and
  logout (which increments `tokenVersion`) take effect immediately.
- Workers are identified only by their token; task queries always filter on `assignedWorker = req.user.id`.
- Citizens' queries always filter on `citizen = req.user.id`. Missing/foreign records return 404 (no existence leak).
- Responses are shaped per role by `serializeComplaint`: workers never see citizen email/phone; citizens never see
  internal notes or worker contact details; nobody receives password hashes.
- Frontend route guards are UX only.

**Token storage.** The SPA (Vercel) and API (Render) are on different sites, so an httpOnly cookie would need
`SameSite=None` plus CSRF protection. For the pilot the token is kept in `localStorage` with a 1-day expiry, server-side
revocation, a strict CSP-friendly SPA with no third-party scripts, and no `dangerouslySetInnerHTML`. Moving the API to a
subdomain of the frontend (e.g. `api.civicai.example`) would allow switching to `SameSite=Lax` httpOnly cookies.

## Storage decision: GridFS

The previous version wrote uploads to the Render container disk, which is wiped on every deploy. Options considered:
Firebase Storage, Cloudinary/S3, or GridFS. GridFS was chosen for the pilot because it needs no new provider, account or
credentials, keeps evidence under the same access control and backups as complaint data, and works on Render's free tier.
Trade-off: it consumes Atlas storage (512 MB on M0). `services/storageService.js` is the only module that touches storage,
so moving to S3/Cloud Storage later is a contained change.

Files are never public. The API returns URLs signed with HMAC-SHA256 that expire after one hour, only inside responses
the caller is authorised to see.

## AI design

- `ai/gemini.js` sends the title/description (and optionally the first photo when `GEMINI_ANALYZE_IMAGES=true`) with a
  system instruction marking report text as untrusted data, `responseMimeType: application/json`, and an enum-constrained
  `responseSchema`. The reply is re-validated with zod; anything else is rejected.
- Timeouts (`GEMINI_TIMEOUT_MS`), rate limits, invalid output, missing key and API errors all fall back to `ai/rules.js`,
  and the stored result records `source: "rules"` plus the reason.
- `department` is derived from the editable Department mapping, not from the model.
- Confidence is the model's self-reported estimate, displayed as such, and never shown for rule results.
- Admins can apply, override or re-run suggestions. `GET /api/admin/ai-evaluation` reports how often staff kept the
  suggestion — agreement with staff, not accuracy.

## Firebase / Firestore / Cloud Run

Not adopted. MongoDB already serves as the single source of truth; adding Firestore would create a second one, and the
in-app notification polling is adequate at pilot scale. Firebase Cloud Messaging would be the natural next step for push
notifications. The API is a plain Node service and can be containerised for Cloud Run without code changes if hosting
moves to Google Cloud.

## Cost at pilot scale

| Service | Tier | Cost |
| --- | --- | --- |
| Vercel | Hobby | Free (non-commercial); Pro needed for an organisation |
| Render | Free web service | Free; sleeps after inactivity (first request ~30–60 s). Starter (~US$7/mo) avoids this |
| MongoDB Atlas | M0 | Free, 512 MB shared |
| Gemini API | Pay-as-you-go | One short request per complaint; small at pilot volume — check current pricing |
