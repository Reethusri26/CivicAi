# API reference

Base URL: `${API_ORIGIN}/api`. JSON in and out unless noted. Authenticated routes need
`Authorization: Bearer <token>`. Errors look like `{ "success": false, "message": "...", "details"?: [...] }`.

| Status | Meaning |
| --- | --- |
| 400 | Validation failed (`details` lists fields) |
| 401 | Not signed in, token expired or revoked |
| 403 | Signed in but wrong role / action not permitted |
| 404 | Not found **or not yours** |
| 409 | Not allowed in the current state (e.g. completing before starting) |
| 429 | Rate limited |

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/public/stats` | `{ total, completed }` aggregates only |
| GET | `/public/track/:reference` | Status, category, department and dated milestones. No description, address, photos or people |
| GET | `/files/:id?exp=&sig=` | Signed evidence image (URLs come from complaint responses) |

## Auth (`/auth`)

| Method | Path | Body |
| --- | --- | --- |
| POST | `/register` | `fullName, email, password, phone?` → `{ token, user }` (citizen) |
| POST | `/login` | `email, password, role: citizen\|worker\|admin` → `{ token, user }` |
| GET | `/me` | Current account |
| PATCH | `/me` | `name?, phone?` (workers: phone only) |
| POST | `/change-password` | `currentPassword, newPassword` → new token; other sessions revoked |
| POST | `/logout` | Revokes all tokens for the account |

Legacy aliases: `POST /admin/login`, `POST /worker/login`.

Passwords: ≥ 8 chars with a letter and a number. Auth endpoints: 20 requests / 15 min / IP.

## Citizen (`/complaints`, role `citizen`)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/` | `multipart/form-data`: `title, description, category? ("auto"), address?, landmark?, latitude?, longitude?, images[] (≤5, JPEG/PNG/WebP, ≤5 MB)`. Address or coordinates required. Send `Idempotency-Key` to make retries safe |
| GET | `/` | `?status=&q=&page=&limit=` |
| GET | `/stats` | Counts by status for the caller |
| GET | `/:id` | Full detail (internal notes excluded) |
| PUT | `/:id` | Edit while `Pending` |
| DELETE | `/:id` | Withdraw while `Pending` |
| POST | `/:id/feedback` | `rating 1–5, comment?` once, when `Completed` |

## Worker (`/worker`, role `worker`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/tasks` | `?status=` — only tasks assigned to the caller, ordered In Progress → Assigned → Completed, then priority |
| GET | `/tasks/:id` | 404 unless assigned to the caller |
| POST | `/tasks/:id/start` | `Assigned → In Progress` |
| POST | `/tasks/:id/notes` | `text, visibleToCitizen?` |
| POST | `/tasks/:id/evidence` | multipart `images[]`, only while In Progress |
| POST | `/tasks/:id/complete` | multipart `images[]?, note?`; requires ≥ 1 evidence photo overall |

## Admin (`/admin`, role `admin`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/overview` | Counts, open high priority, resolution rate, average resolution hours |
| GET | `/analytics` | By status/category/priority, 6-month trend, department workload, worker performance, resolution by category, insights |
| GET | `/ai-evaluation` | Agreement between AI suggestion and admin-confirmed values, per source |
| GET | `/reports/complaints.csv` | `?status=&from=&to=` CSV without citizen personal data |
| GET | `/complaints` | `?status&priority&category&department&worker(id\|unassigned)&from&to&q&sort(newest\|oldest\|priority\|updated)&page&limit` |
| GET | `/complaints/:id` | Full detail incl. citizen contact |
| PATCH | `/complaints/:id` | `category?, priority?, department?` |
| POST | `/complaints/:id/review` | `Pending → Reviewed` |
| POST | `/complaints/:id/assign` | `workerId, reason?` (reason required when reassigning) |
| POST | `/complaints/:id/apply-ai` | Copy the stored suggestion into the live fields |
| POST | `/complaints/:id/reanalyze` | Re-run Gemini/rules |
| POST | `/complaints/:id/notes` | `text, visibleToCitizen?` |
| GET/POST | `/workers` | List with workload / create `name, email, password, department, phone?` |
| PATCH | `/workers/:id` | `name?, department?, phone?, isActive?` (deactivation revokes sessions) |
| POST | `/workers/:id/reset-password` | `password` |
| GET/POST | `/departments` | List with counts / create `name, description?, categories[]` |
| PUT/DELETE | `/departments/:id` | Delete refused while workers belong to it |

## Notifications (any signed-in role)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/notifications` | Latest 30 + unread count |
| POST | `/notifications/read` | `ids?` — omit to mark all read |
