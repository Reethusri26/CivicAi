# Testing report

Date: 2026-10-23. Environment: Windows 11, Node 24, MongoDB 7 (in-memory via mongodb-memory-server).

## Automated: `cd server && npm test` — 40 / 40 passing

Also run with `TZ=Asia/Kolkata` to cover the timezone bug described below.

**Lifecycle (`tests/lifecycle.test.js`)**

- Citizen submits a complaint with 2 images → reference, category, priority, department, labelled rule-based AI
- Retried submission with the same `Idempotency-Key` returns the original (no duplicate)
- Evidence images: signed URL works; tampered or unsigned URL → 403
- Admin filters (status, category, search), reviews, assigns; reassignment without a reason → 400
- Worker sees the task and an assignment notification; another worker gets 404 on view and start
- Completing before starting → 409; completing without evidence → 400; full start → notes → complete
- Citizen sees status, the exact timeline sequence, worker name without email, public notes only, and 4 notifications
- Feedback accepted once; second attempt → 409
- Public tracking exposes no description, address or email
- Overview, analytics (including current-month trend bucket) and CSV export reflect the data; CSV has no citizen email

**Authorization:** 401 without a token on admin/worker/citizen APIs; 403 for wrong roles; citizens can't read others'
complaints; forged tokens rejected; no password hashes in responses; emails normalised; logout revokes the token;
deactivating a worker blocks their token and sign-in immediately.

**Validation:** weak password, duplicate email, identical message for unknown email vs. wrong password, address-or-location
rule, fake image content (magic-byte check), disallowed MIME type, regex characters in search, edit/withdraw locked after Pending.

**AI (`tests/ai.test.js`, Gemini client mocked):** valid output used with department mapping and prompt wrapping;
schema-invalid output, non-JSON output, HTTP 429 and timeout all fall back to rules with a reason; prompt-injection
attempt cannot produce a non-enum priority; rule classifier cases including multi-keyword scoring.

## Manual end-to-end in the browser

Run against `npm run dev:memory` + `npm run dev`, using the real UI:

| Step | Result |
| --- | --- |
| Citizen sign-in → empty dashboard with zero counts | ✅ |
| Submit empty form → three field errors | ✅ |
| Submit with 2 photos (double-clicked) → one complaint, reference shown, rule-based triage labelled | ✅ |
| Admin overview shows 1 pending, high priority | ✅ |
| Admin marks reviewed, assign dialog recommends Sanitation worker, assign | ✅ |
| Worker list shows task; directions link present; start work; add note | ✅ |
| "Mark as complete" disabled until a photo is added; confirm dialog; completed | ✅ |
| Citizen sees full timeline, notes, completion photo, 4 notifications; feedback saved and form hidden | ✅ |
| Evidence images render via signed URLs | ✅ |
| Layout checked at ~560 px (phone) and 1280 px (desktop) | ✅ |

## Bugs found and fixed during testing

1. **Rule classifier:** "Overflowing garbage" was classified as Drainage (first keyword hit won). Now scores all categories.
2. **Analytics trend:** in timezones ahead of UTC the current month was missing from the chart. Month buckets now computed in UTC.
3. **Login role tabs:** following `/login?role=worker` while already on the login page kept the previous tab selected.

## Not yet tested

- Live Gemini API calls (no key available during development)
- Production deployment on Render/Vercel/Atlas
- Real phones (only browser emulation), screen readers, and browsers other than Chromium
- Load/performance testing
- Frontend unit tests (none exist; the frontend is verified by type-check, lint, build and the manual run above)
