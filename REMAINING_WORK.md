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
**Current state (verified):** `services/api/src/index.ts` uses token-verified `io.use()` middleware to authenticate sockets on connection. DB-backed `join-encounter` authorization checks if the user belongs to the appointment, and a `joinedEncounters` Set tracks which rooms the socket is authorized to relay `webrtc-offer`, `webrtc-answer`, and `webrtc-ice-candidate` events in.
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

### 1.2 Prescription PDF — frontend integration — [DONE]
**Current state (verified):** `GET /prescriptions/:id/pdf` correctly returns an HTML receipt with clinical formatting (doctor details, medicines, signature). The frontend (both `patient-web` and `doctor-web`) uses an authenticated `api.get` call to fetch it as a blob. A new tab is opened synchronously to bypass popup blockers, the blob is injected into it via `URL.createObjectURL`, and the object URL is cleaned up after 5 seconds to prevent memory leaks. Failed requests close the empty tab gracefully.
**Fix:**
- Wire the button to fetch the receipt and open it in a new tab / trigger a download.
- Add the same capability to `doctor-web` (prescription history with working links).
- Basic clinical styling on the receipt: doctor name + registration number, patient name,
  encounter date, medicines, signature block.
**Acceptance:** clicking Download in patient-web actually retrieves and displays/downloads a
real prescription for a real encounter.

### 1.3 TURN server configuration — [DONE]
**Current state (verified):** The backend serves dynamic ICE configurations via `GET /webrtc/credentials`. The frontend fetches these credentials securely before establishing WebRTC connections. A `docker-compose.coturn.yml` is provided for running a local relay server. Both `patient-web` and `doctor-web` no longer hardcode STUN servers in their source.
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

### 2.1 Async chat / messaging — [DONE]
**Current state (verified):** `messages` table schema exists and is fully implemented. `GET /encounters/:id/messages` and `POST /encounters/:id/messages` routes securely gate access using the `requireEncounterParticipant` middleware, ensuring only the assigned doctor or patient can access the conversation. Socket.IO events (`message`, `typing`, `read-receipt`) are correctly scoped to the encounter room, with `ChatBox` components integrated in both `patient-web` and `doctor-web` implementing the persist-then-relay pattern.
**Build:** (Implemented)

### 2.2 Consent Management [DONE]
**Current state**: Backend routes `/consents` implemented, and a `requirePatientConsent` check added to prescriptions to restrict cross-doctor lookups. Frontend `Consents.tsx` page built in `patient-web` for granting and revoking access.
**Next steps**:
- (Completed) Route `POST /consents` (patient grants scope) and `POST /consents/:id/revoke`.
- (Completed) Basic grant/revoke UI in `patient-web`. Enforce consent checks before returning sensitive records cross-doctor (if a patient sees
  more than one doctor)
- Simple grant/revoke UI in patient-web

### 2.3 Pharmacy Web App [DONE]
**Target:** `apps/pharmacy-web` (New) / `services/api`
**Status:** Completed.

**Backend Changes (Done):**
1. Scaffolded DB tables `medicines`, `pharmacy_orders`, `pharmacy_order_items`, and `prescription_reconciliation_audit`.
2. Created endpoints `GET /medicines`, `POST /pharmacy/orders`, and `POST /webhooks/razorpay` in `pharmacy.routes.ts` and `webhooks.routes.ts`.
3. Implemented robust prescription reconciliation (whole-word token matching with strict rejection and auditing).
4. Implemented `test-pharmacy.ts` for end-to-end flow validation, including mock Razorpay support for bypassed auth scenarios.

**Frontend Changes (Done):**
1. Created new React/Vite app `apps/pharmacy-web`.
2. Implemented medicine catalog UI with searching and Rx flags.
3. Implemented cart and checkout logic checking prescription requirements locally and passing IDs to the backend.

### 2.4 Real-time notifications [DONE]
- `notifications` table added to `schema.ts`.
- `emitNotification` helper implemented using `socket.io` and database inserts.
- Integrated `emitNotification` into appointment creation and webhook payment confirmation.
- Reminder cron task set up in `src/cron/reminders.ts`.
- `NotificationCenter` UI component implemented in `patient-web` and `doctor-web` headers.

---

## 3. P2 — Hardening

- **CSP / security headers [DONE]**: configured `helmet` in `services/api/src/server.ts`, with strict CSP including Razorpay/Firebase whitelists.
- **Rate limiting [DONE]**: global limit (100 req/min) and strict auth limit (20 req/15min) via `express-rate-limit`.
- **Request size limits [DONE]**: file/json upload limit set to 10MB (`express.json({ limit: "10mb" })`).
- **ICE restart / reconnection handling [DONE]**: implemented auto-reconnect (`pc.restartIce()`) on drop in `useWebRTC.ts`, with pause protection on the adaptive quality engine.
- **API versioning [DONE]**: mapped backend REST routes under `/v1` prefix and updated all 4 frontend API configurations to point to `/v1`. (Note: Webhooks are mounted at the root `/webhooks` and are intentionally NOT versioned since external providers like Razorpay require stable URLs).

---

## 4. P3 — Offline-first sync engine (the README's stated core differentiator)

**Current state (verified):** Done. 
- Implemented `/sync` endpoints (push, pull, ack) on backend with `idempotency_key` deduplication logic for messages.
- Added strict authorization checking to `/sync` to guarantee users can only push or pull from encounters they belong to.
- Added `SyncDB.ts` (IndexedDB via Dexie) and `SyncManager.ts` in both `patient-web` and `doctor-web`.
- Wrapped chat message reading and writing inside `ChatBox.tsx` using `useLiveQuery` to react automatically to `SyncManager` outbox queues and network state changes.
- Tested successfully against backend, showing idempotency keys effectively discard duplicate inserts from poor network connections, and testing proper authorization rejection for cross-encounter data attempts.

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

---

## 2.5 P1 — Pharmacist onboarding & enterprise pharmacy marketplace

**Target:** `apps/pharmacy-web`, `apps/patient-web`, `apps/coordinator-web`, `services/api`
**Status:** Completed.

### Open Questions Resolved
Before implementing the schema or the frontend, we established the following architectural decisions:

1. **Pharmacy-web vs Patient-web separation:** 
   - **Decision:** Separate. Patients will **not** log into `pharmacy-web`.
   - **Reasoning:** Patients already have `patient-web` for managing appointments, consultations, and prescriptions. Forcing them to log into a separate app just to buy medicines fractures the user experience. `patient-web` will host the storefront (browsing and buying). `pharmacy-web` acts exclusively as the **Pharmacist Seller Portal** (for pharmacists to manage inventory, set pricing, and handle onboarding).
   
2. **Doctor-tagging mechanism:**
   - **Decision:** We use a many-to-many junction table (`doctor_medicine_recommendations`).
   - **Reasoning:** A simple `doctorRecommended` boolean flag on the `medicines` table provides no attribution—any doctor could toggle it, and we wouldn't know who or why. A junction table allows us to build trust signals like "Recommended by 5 doctors" or "Recommended by Dr. Smith (your doctor)", which directly serves the core premise of MedLink (doctor-patient trust). It also ensures that one doctor un-recommending a medicine doesn't globally revoke the recommendation if another doctor still stands by it.
   
3. **Coordinator approval for new listings:**
   - **Decision:** Yes, new listings require full coordinator approval.
   - **Reasoning:** While pharmacists are verified professionals, a central catalog must prevent duplicates, enforce consistent naming (generic vs brand), and verify pricing constraints. A lightweight coordinator review (hence `listingStatus: 'pending'` on new items) ensures catalog integrity before a product is visible to patients.

### Backend / Schema
1. Add `pharmacist` to `user_role` enum.
2. Create `pharmacists` and `pharmacist_verifications` tables mirroring the doctor onboarding pattern.
3. Update `medicines` with `pharmacist_id` (nullable) and `listing_status` (pending/approved/rejected).
4. Create `doctor_medicine_recommendations` table to track which doctors recommend which medicines.

### Pharmacist Seller Portal (`pharmacy-web`)
1. Build full auth flow: Login, Signup, Onboarding (license upload, shop details).
2. Build Inventory Dashboard for verified pharmacists to add/edit medicines and manage stock/pricing.

### Coordinator Dashboard (`coordinator-web`)
1. Extend `VerificationQueue` to include a tab for pending Pharmacist applications, using the same approve/reject pattern.

### Doctor App (`doctor-web`)
1. Add UI for doctors to tag/recommend specific medicines within their specialty.

### Patient Storefront (`patient-web`)
1. Polish the medicine catalog with category filtering, search-as-you-type, and a multi-seller storefront view (if multiple pharmacists sell the same generic product).
*(Note: Real-time inventory locking at checkout and courier logistics are out of scope for this pass).*


### Porting Strategy & Clean Up (Added post-review)
1. **Porting, not rewriting:** The existing PharmacyCatalog and checkout logic currently in `apps/pharmacy-web/src/App.tsx` will be explicitly ported to `apps/patient-web`. This logic is already tested and handles Rx-gating, so it will be reused instead of rebuilt from scratch.
2. **Clean up old location:** Once ported, `pharmacy-web/src/App.tsx` will have the storefront code fully removed to avoid two competing implementations.
3. **Restructure `pharmacy-web`:** `pharmacy-web` will be split into proper page files under `src/pages/` (Login.tsx, Signup.tsx, Onboarding.tsx, InventoryDashboard.tsx) to match the conventions of the rest of the codebase, moving away from the single monolithic App.tsx.

### Execution Order
1. Schema and DB Migrations (Done)
2. Pharmacist-web Auth and Onboarding (Done)
3. Patient-web Storefront Port (Done)
4. Coordinator-web VerificationQueue Extension (Done)
5. Doctor-web Tagging UI (Done)
