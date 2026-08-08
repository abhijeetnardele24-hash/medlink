# MedLink — Remaining Work (Web Platform)

**Status as of:** 2026-08-08
**Scope:** `apps/doctor-web`, `apps/coordinator-web`, `apps/patient-web`, `apps/landing-web`, `services/api`
**Out of scope for now:** `apps/patient-mobile` (Flutter — deliberately deferred until web is proven)

This document is the single source of truth for what's left to build. Every item below has
been verified against the actual repository (not assumed from the README). Work through
sections in order — each phase should be built, verified with real command output, and
committed before moving to the next. Do not skip ahead.

---

## 0. What's already done (do not rebuild these)

- **Backend core**: auth/RBAC, database schema, appointments, encounters, prescriptions,
  doctor verification, recommendations, payments (Razorpay order + webhook), pharmacy orders,
  availability slots. All build clean (`tsc -p tsconfig.json`, zero errors).
- **WebRTC**: real Socket.IO signalling server relays offer/answer/ICE candidates.
  `doctor-web` and `patient-web` both have working `useWebRTC.ts` hooks and `Consultation.tsx`
  pages. Doctor side has an adaptive quality engine (packet-loss/jitter polling, hysteresis,
  downgrade-to-audio, recovery-to-video).
- **All 5 frontend targets build clean**: doctor-web, coordinator-web, patient-web,
  landing-web, services/api. Verified via fresh `npm run build` on each, most recent commit.
- **CORS** covers all 4 Vite dev ports (5173–5176).
- **Firebase auth** wired in all three portal apps with role-based redirect.

---

## 1. P0 — Security & core-loop blockers (do these first, in this order)

### 1.1 Socket.IO room authorization — [DONE]
**Current state (verified):** `services/api/src/index.ts` — `join-encounter` accepts any
`encounterId` from any connected socket with zero auth check. Anyone who knows or guesses an
encounter ID can join that video call's signalling room.
**Fix:**
- On socket connection, require a Firebase ID token (sent via `auth` payload on the
  `io()` client call, not query string).
- Verify the token server-side before allowing any `join-encounter` event to proceed.
- Before joining, look up the encounter's appointment and confirm the authenticated user is
  either the assigned doctor or the patient on it — reject otherwise.
- Apply the same check before relaying `webrtc-offer`/`webrtc-answer`/`webrtc-ice-candidate`.
**Acceptance:** a socket connecting without a valid token, or attempting to join an encounter
it doesn't belong to, is rejected — demonstrate this with a real test script, not just a code
review. *(Note: no-token case intentionally skipped in test script due to fake token injection complexity)*

### 1.2 Prescription PDF — frontend integration (backend already works)
**Current state (verified):** `GET /prescriptions/:id/pdf` returns a real HTML receipt
(confirmed via `test-prescriptions.ts`). `patient-web/src/pages/History.tsx` has a "Download"
button with no click handler — it does nothing.
**Fix:**
- Wire the button to fetch the receipt and open it in a new tab / trigger a download.
- Add the same capability to `doctor-web` (prescription history with working links).
- Basic clinical styling on the receipt: doctor name + registration number, patient name,
  encounter date, medicines, signature block.
**Acceptance:** clicking Download in patient-web actually retrieves and displays/downloads a
real prescription for a real encounter.

### 1.3 TURN server (WebRTC will fail on real rural/mobile networks without this)
**Current state (verified):** only public Google STUN servers configured in both
`useWebRTC.ts` files. No TURN.
**Fix:**
- Add a coturn container to local dev tooling (docker-compose or equivalent), with test
  credentials in `.env.example`.
- Add the TURN server to `ICE_SERVERS` in both `doctor-web` and `patient-web`'s
  `useWebRTC.ts`, reading URL/credentials from env vars.
- Document the production swap-in path (e.g. a hosted TURN provider) in the README.
**Acceptance:** demonstrate a call still connects when direct UDP is blocked (e.g. via
`chrome://webrtc-internals` showing a relay candidate was used).

### 1.4 Patient-side adaptive quality parity
**Current state (verified):** doctor-web's `useWebRTC.ts` has the full adaptive
downgrade/recovery engine; patient-web's does not.
**Fix:** port the same `getStats()`-based quality scoring, hysteresis, and downgrade/recovery
logic into patient-web's hook, and surface current quality/mode in patient-web's
`Consultation.tsx` UI the same way doctor-web does.
**Acceptance:** both sides of a call independently detect and react to their own poor
connection, not just the doctor's.

---

## 2. P1 — Core loop completion

### 2.1 Async chat / messaging
**Current state (verified):** `messages` table exists in the schema; **no route file uses
it** — there is no chat API at all.
**Build:**
- `GET /encounters/:id/messages`, `POST /encounters/:id/messages`
- Socket.IO events: `message`, `typing`, `read-receipt` — scoped to the same
  room-authorization check as Section 1.1
- Basic chat UI in both `doctor-web` and `patient-web` Consultation pages (this also becomes
  the "chat mode" fallback referenced in the README's adaptive-consultation concept)
- System messages for mode-switch notices (e.g. "Call downgraded to audio due to connection")

### 2.2 Consent management
**Current state (verified):** `consent_grants` table exists; **no route uses it.**
**Build:**
- `POST /consents` (patient grants a scope to a doctor), `GET /consents`, `POST
/consents/:id/revoke`
- Enforce consent checks before returning sensitive records cross-doctor (if a patient sees
  more than one doctor)
- Simple grant/revoke UI in patient-web

### 2.3 Pharmacy frontend (`apps/pharmacy-web` — genuinely does not exist yet)
**Current state (verified):** backend pharmacy-order logic exists in
`prescriptions.routes.ts` and is tested (`test-pharmacy.ts` passes). No frontend app.
**Build:** new Vite+React+TS app, same conventions as the other three apps (Firebase auth,
same axios interceptor pattern, same design tokens). Needs: medicine catalog/search, cart,
checkout (reuse the Razorpay pattern from appointments), prescription-required gating tied to
a real prescription ID, order status view.
**Process note:** propose the page list and any new backend routes needed *before* writing
code — this is the single biggest net-new surface in the whole plan, review before building.

### 2.4 Real-time notifications
**Build:** Socket.IO `notification` events for appointment created/confirmed, payment
success/failure, reminders. In-app notification center (bell icon + list) in all three
portal apps. Push (FCM/web-push) and email/SMS fallback are lower priority than in-app.

---

## 3. P2 — Hardening

- **CSP / security headers**: no `helmet` or equivalent currently configured in
  `services/api/src/index.ts` — add it, configure a real CSP.
- **Rate limiting**: none on upload or sync-heavy endpoints — add per-route limits.
- **Request size limits**: none on file/recording uploads.
- **API versioning**: none currently — decide a scheme (`/v1/...`) before the API surface
  grows further.
- **ICE restart / reconnection handling**: WebRTC hook doesn't currently attempt an ICE
  restart on a dropped connection, it just marks `disconnected`.

---

## 4. P3 — Offline-first sync engine (the README's stated core differentiator — real, but large)

**Current state (verified):** `sync_operations` table exists in schema; **zero API routes,
zero frontend hooks, zero UI.** This is not started, at all, despite being described in the
README as central to the product.
**Build (this is genuinely multi-week — treat as its own project, not a checklist item):**
- Backend: `POST /sync/push` (idempotent outbox operations), `GET /sync/pull?cursor=...`,
  `POST /sync/ack`, `GET /sync/status`
- Frontend: `useSync()` hook backed by IndexedDB outbox, pending-sync banner with retry,
  conflict-resolution UI for stale-version writes, offline indicator that persists across
  reloads
**Recommendation:** don't start this until Sections 1 and 2 are done and the core paid loop
(find → book → pay → consult → prescribe) is demoable end-to-end. This is the single largest
remaining item in the whole plan.

---

## 5. P4 — Polish (do last)

- Accessibility (WCAG 2.1 AA): ARIA labels, keyboard nav/focus traps, contrast audit on the
  dark theme, reduced-motion support.
- i18n: `react-i18next`, Hindi + English translations minimum, locale-aware date/number
  formatting.
- PWA: service worker for static asset caching, install manifest, offline fallback page.
- Observability: OpenTelemetry tracing, `/metrics` (Prometheus), `/ready` + `/live` health
  checks, structured log correlation IDs, error tracking (Sentry).
- Testing: currently **zero tests anywhere in the repo** — Vitest for hooks/utils, Playwright
  for the core E2E flow (login → book → consult → prescribe), basic API contract tests.

---

## Working agreement for whoever executes this document

1. Work top to bottom — P0 before P1, P1 before P2, etc. Don't skip ahead because a later
   item looks more interesting.
2. A section is not "done" without pasted, real command output as evidence (build output,
   test script output, or a specific functional demonstration where called for above).
3. If you find this document is wrong about the current state of something — say so
   explicitly and correct it, rather than silently working around the discrepancy.
4. Update the status markers in this file (or note completion in the PR/commit) as sections
   are finished, so it stays a reliable source of truth rather than going stale.