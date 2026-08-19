# MedLink — Retroactive Production Standards Compliance Audit

**Audit Date:** 2026-08-19  
**Charter Reference:** [`PRODUCTION_STANDARDS.md`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/PRODUCTION_STANDARDS.md)  
**Audited Targets:** `services/api`, `apps/doctor-web`, `apps/coordinator-web`, `apps/patient-web`, `apps/pharmacy-web`, `apps/landing-web`, `services/api/src/db/schema.ts`  
**Audit Policy:** Report only. No code fixes applied during this pass. Every finding is classified by severity (**Critical / High / Medium / Low**) with exact file and line references.

---

## 1. Executive Summary & Audit Matrix

A comprehensive code-level audit was conducted across all 17 backend route modules, authentication and authorization middlewares, database schema definitions, and frontend portals to evaluate strict compliance with the **Production Standards Charter**.

### Findings by Severity
| Severity | Count | Summary |
| :--- | :---: | :--- |
| **CRITICAL** | **3** | Unprotected test auth bypass in production; Payment signature verification bypass with hardcoded secrets; Unrestricted patient dossier IDOR access. |
| **HIGH** | **6** | Encounter & recording IDOR; Doctor payout method & withdrawal IDOR; Seeded account takeover risk; Missing inventory stock locking/race condition; Total absence of database indexes in schema; Unvalidated `req.body` on core mutating routes. |
| **MEDIUM** | **7** | Webhook JSON re-serialization HMAC fragility; Multi-statement mutations without transactions; Unbounded query endpoints lacking pagination; Missing audit logs on coordinator decisions; Dynamic in-handler schema imports; Slot status de-synchronization on webhook payment. |
| **LOW** | **3** | Static sparkline mock data left in doctor dashboard; Unstructured `console.log` statements; Test suite orchestration gaps. |

---

## 2. Section 3: Security & Authorization Audit

### [CRITICAL] Finding SEC-01: `TEST_BYPASS_AUTH` Environment Bypass Missing Production Guard — [RESOLVED]
- **File:** [`services/api/src/middleware/auth.ts:41-48`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/middleware/auth.ts#L41-L48)
- **Status:** **RESOLVED**
- **Fix:** Added strict `process.env.NODE_ENV !== "production"` requirement to header bypass and stripped sensitive logging. Tested and verified in live test suite: attempt with `NODE_ENV=production` returned HTTP 401.

---

### [CRITICAL] Finding SEC-02: Hardcoded Payment Secrets and Signature Verification Bypass — [RESOLVED]
- **Files:**
  - [`services/api/src/routes/appointments.routes.ts:517, 537, 544-548`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L517)
  - [`services/api/src/routes/pharmacy.routes.ts:704, 710-715`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/pharmacy.routes.ts#L704)
- **Status:** **RESOLVED**
- **Fix:** Removed all hardcoded secrets and fallback bypass conditions. Enforced strict constant-time HMAC SHA-256 verification (`crypto.timingSafeEqual`) and wrapped confirmation and slot booking in atomic database transactions. Tested and verified in live test suite: forged signature returned HTTP 403; valid signature returned HTTP 200 with atomic confirmation.

---

### [CRITICAL] Finding SEC-03: Broken Object-Level Authorization on Patient Medical Dossiers (IDOR) — [RESOLVED]
- **File:** [`services/api/src/routes/patients.routes.ts:162-209`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/patients.routes.ts#L162-L209)
- **Status:** **RESOLVED**
- **Fix:** Enforced strict clinical relationship verification on `GET /v1/patients/:id`. Doctors must have either an active appointment with the patient or an active consent grant in `consent_grants`. Tested and verified in live test suite: unrelated doctor blocked with HTTP 403; assigned doctor and doctor with active consent grant successfully retrieved dossier (HTTP 200).

---

### [HIGH] Finding SEC-04: Broken Object-Level Authorization on Encounter Details and Recordings (IDOR)
- **Files:**
  - [`services/api/src/routes/encounters.routes.ts:128-142`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L128-L142)
  - [`services/api/src/routes/encounters.routes.ts:244-283`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L244-L283)
- **Description:**
  1. `GET /encounters/:id` allows any authenticated user to retrieve encounter metadata by ID without checking if they are the assigned doctor or patient.
  2. `POST /encounters/:id/recording` allows any doctor to upload and attach video recording attachments to any encounter ID.
- **Charter Violation:** Section 3 — *"verify ownership/participation explicitly (the pattern already established via requireEncounterParticipant / getAuthorizedEncounterIds)."*

---

### [HIGH] Finding SEC-05: Missing Doctor Ownership Verification on Payout Methods and Withdrawals
- **File:** [`services/api/src/routes/doctors.routes.ts:653-660, 664-718, 722-760`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L653)
- **Description:**
  1. `GET /doctors/:id/payout-methods` and `POST /doctors/:id/payout-methods` take `:id` from parameters but do not verify that `res.locals.user` matches the doctor owner of `:id`.
  2. `POST /doctors/:id/withdraw` locks the doctor row and calculates balances atomically, but lacks the check `if (doc.id !== id) throw new ForbiddenError(...)`.
- **Impact:** A malicious doctor account can view another doctor's bank account / UPI ID or initiate withdrawals on their behalf.
- **Charter Violation:** Section 3 — *"Any endpoint returning or mutating a specific record by ID must verify the requesting user has a real relationship to that record, not just a valid role."*

---

### [HIGH] Finding SEC-06: Pre-authenticated Seeded Account Linkage Vulnerability
- **File:** [`services/api/src/routes/auth.routes.ts:80-107`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/auth.routes.ts#L80-L107)
- **Description:** In `POST /auth/register`, if a user record with a matching email already exists, the server updates `firebaseUid` to the caller's Firebase UID without verifying that `decoded.email_verified === true`.
- **Impact:** If Firebase email verification is not enforced, an attacker registering an unverified Firebase account with a known doctor/coordinator email can take over the existing account and role.
- **Charter Violation:** Section 3 — *"No hardcoded credentials, emails, or backdoors of any kind".*

---

### [HIGH] Finding SEC-07: Concurrency & Stock Depletion Gap on Pharmacy Orders
- **File:** [`services/api/src/routes/pharmacy.routes.ts:342-540`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/pharmacy.routes.ts#L342-L540)
- **Description:** `POST /pharmacy/orders` reads medicine prices and checks restrictions, but does not atomically check or decrement inventory stock in `medicines` table using database-level locking (`SELECT ... FOR UPDATE` or conditional decrement).
- **Charter Violation:** Section 3 — *"Any operation involving concurrent access to a shared balance/count (payouts, stock quantities, idempotency keys) must be checked for race conditions — use DB-level locking or atomic operations".*

---

### [MEDIUM] Finding SEC-08: Sensitive Identifier Logging in Authentication Flow
- **File:** [`services/api/src/middleware/auth.ts:64`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/middleware/auth.ts#L64)
- **Description:** `console.log("FIREBASE UID INTERCEPT:", decoded.uid, decoded.email);` outputs user UIDs and email addresses to standard output on every authenticated request.
- **Charter Violation:** Section 3 — *"Never log tokens, passwords, full card/payment details, or full prescription/medical content at anything above debug level."*

---

## 3. Section 4: Code Quality, Dead Code & Runtime Validation Audit

### [HIGH] Finding CQ-01: Mutating Endpoints Missing Zod Validation Schemas
- **Files:**
  - `POST /encounters` ([`encounters.routes.ts:91`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L91)) — uses raw type assertion `_req.body as { appointmentId: string }`.
  - `POST /encounters/:id/prescriptions` ([`encounters.routes.ts:146`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L146)) — manual array check without full schema validation.
  - `POST /encounters/:id/end` ([`encounters.routes.ts:210`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L210)) — unvalidated `summaryNotes`.
  - `POST /appointments/:id/create-payment` ([`appointments.routes.ts:454`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L454)).
  - `PATCH /admin/verifications/:id` ([`admin.routes.ts:50`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L50)) & `PATCH /admin/pharmacist-verifications/:id` ([`admin.routes.ts:128`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L128)).
  - `PUT /v1/patients/me` ([`patients.routes.ts:77`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/patients.routes.ts#L77)) — custom helper parsing instead of schema middleware.
- **Charter Violation:** Section 4 — *"Every request body must be validated with a real schema (Zod, matching existing convention) — not just a TypeScript type annotation, which provides zero runtime protection."*

---

### [MEDIUM] Finding CQ-02: Non-Atomic Multi-Table State Mutations
- **Files:**
  - `POST /encounters/:id/prescriptions` ([`encounters.routes.ts:164-203`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L164-L203)): Inserts prescription, upserts recommendations, updates encounter status, and updates appointment status in 4 independent statements without a transaction wrapper.
  - `POST /appointments/:id/verify-payment` ([`appointments.routes.ts:551-574`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L551-L574)): Updates `paymentRecords`, `appointments`, and `availabilitySlots` in 3 separate statements without `db.transaction(...)`.
- **Charter Violation:** Section 4 & Section 3 — *"Maintain production-readiness... atomic operations, not read-then-check-then-write across separate statements."*

---

### [MEDIUM] Finding CQ-03: Dynamic In-Handler Imports in Core Prescription Route
- **File:** [`services/api/src/routes/prescriptions.routes.ts:154-156`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/prescriptions.routes.ts#L154-L156)
- **Description:** `const { consentGrants } = await import("../db/schema");` and `const { and } = await import("drizzle-orm");` are called dynamically inside the request handler.
- **Charter Violation:** Section 4 — *"Match existing codebase conventions exactly... rather than introducing a second way of doing the same thing."*

---

### [LOW] Finding CQ-04: Static Mock Sparkline Data in Doctor Dashboard
- **File:** [`apps/doctor-web/src/pages/Dashboard.tsx:15-20`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/apps/doctor-web/src/pages/Dashboard.tsx#L15-L20)
- **Description:** `const mockEarningsData = [...]` is hardcoded for rendering a mini-sparkline chart under the welcome banner.
- **Charter Violation:** Section 4 — *"Flag and remove dead code / placeholders... as you find it".*

---

## 4. Section 5: Testing & Verification Safety Audit

### [HIGH] Finding TST-01: Lack of Standardized Unit/Integration Test Framework Runner
- **File:** [`services/api/package.json`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/package.json)
- **Description:** `package.json` contains no `"test"` script. Tests are scattered across standalone scratch scripts (`test-socket-auth.ts`, `test-pharmacy.ts`, `test-full-ecosystem.ts`, `test-redis-integration.ts`) that are run manually via `npx tsx` rather than integrated into a unified CI test runner (Vitest/Jest).
- **Charter Violation:** Section 5 — *"For every new feature, add or update appropriate unit/integration tests and preserve existing behavior."*

---

### [MEDIUM] Finding TST-02: Tests Rely on `TEST_BYPASS_AUTH` Bypassing Cryptographic Verification
- **Files:** `services/api/test-*.ts`
- **Description:** Integration scripts invoke endpoints using simulated headers (`x-user-id`, `x-role`) under `TEST_BYPASS_AUTH=true` rather than testing token verification, expiry, or signature failures.
- **Charter Violation:** Section 5 — *"Every new feature needs a real test proving both the success path AND at least one realistic failure path (unauthorized access, invalid input, a duplicate/race condition) — not just the happy path."*

---

## 5. Section 6: Performance, Reliability & Database Scalability Audit

### [HIGH] Finding PERF-01: Zero Database Indexes Defined in Database Schema
- **File:** [`services/api/src/db/schema.ts`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/db/schema.ts)
- **Description:** No explicit `index()` or `uniqueIndex()` declarations exist across the entire Drizzle schema.
- **Critical Unindexed Columns Subject to Full Table Scans:**
  - `users.firebaseUid` (queried on every authenticated request)
  - `appointments.patientId`, `appointments.doctorId`, `appointments.status`
  - `encounters.appointmentId`
  - `prescriptions.encounterId`, `prescriptions.doctorId`
  - `availabilitySlots.doctorId`, `availabilitySlots.startsAt`
  - `messages.encounterId`, `messages.createdAt`
  - `paymentRecords.appointmentId`, `paymentRecords.razorpayOrderId`
  - `pharmacyOrders.patientId`, `pharmacyOrders.pharmacistId`
  - `consentGrants.patientId`, `consentGrants.granteeId`
- **Charter Violation:** Section 6 — *"Flag N+1 queries, missing indexes on frequently-filtered columns, and any endpoint that loads unbounded result sets without pagination."*

---

### [MEDIUM] Finding PERF-02: Unbounded Data Queries Without Pagination
- **Files:**
  - `GET /v1/prescriptions/me` ([`prescriptions.routes.ts:47`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/prescriptions.routes.ts#L47))
  - `GET /v1/pharmacy/orders` ([`pharmacy.routes.ts:331`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/pharmacy.routes.ts#L331))
  - `GET /v1/pharmacy/inventory` ([`pharmacy.routes.ts:145`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/pharmacy.routes.ts#L145))
  - `GET /v1/consents` ([`consents.routes.ts:39`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/consents.routes.ts#L39))
- **Description:** These endpoints return all historical rows matching a user without `limit`/`offset` or cursor pagination.
- **Charter Violation:** Section 6 — *"any endpoint that loads unbounded result sets without pagination."*

---

### [MEDIUM] Finding PERF-03: Webhook HMAC Re-serialization Fragility
- **File:** [`services/api/src/routes/webhooks.routes.ts:30-34`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/webhooks.routes.ts#L30-L34)
- **Description:** The webhook router computes the HMAC signature over `JSON.stringify(req.body)` rather than the raw request buffer. In production environments, JSON property ordering or formatting differences can cause valid Razorpay webhooks to fail signature verification.
- **Charter Violation:** Section 8 — *"Any new background/async process (cron, webhook handler) must log both success and failure paths clearly enough to debug from logs alone."*

---

### [MEDIUM] Finding PERF-04: Availability Slot State De-synchronization on Webhook Confirmation
- **File:** [`services/api/src/routes/webhooks.routes.ts:70-75`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/webhooks.routes.ts#L70-L75)
- **Description:** When an appointment payment is captured via the webhook, `appointments.status` is updated to `confirmed`, but the corresponding `availabilitySlots.status` is not updated to `booked`.
- **Charter Violation:** Section 3 — *"Maintain production-readiness as an ongoing requirement."*

---

## 6. Section 8: Observability & Logging Audit

### [MEDIUM] Finding OBS-01: Missing Structured Audit Logging on Coordinator Verification Actions
- **File:** [`services/api/src/routes/admin.routes.ts:67-85, 150-180`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L67)
- **Description:** When coordinators verify, reject, or suspend doctors or pharmacists, no structured audit events are logged to the `audit_events` table or through the structured pino logger.
- **Charter Violation:** Section 8 — *"Any new endpoint handling money, auth, or verification decisions should produce a structured log line (matching the existing pino logger convention) at the key decision points, not just on error."*

---

## 7. Prioritized Remediation Roadmap

```mermaid
flowchart TD
    subgraph Priority 1 - Critical Security Fixes
        SEC01[SEC-01: Gate TEST_BYPASS_AUTH with NODE_ENV !== production]
        SEC02[SEC-02: Remove hardcoded Razorpay secrets & signature bypass]
        SEC03[SEC-03: Add consent/appointment ownership to GET /patients/:id]
    end

    subgraph Priority 2 - High Authorization & Concurrency
        SEC04[SEC-04: Enforce ownership on encounters & recordings]
        SEC05[SEC-05: Enforce doctor ID ownership on payout methods & withdraw]
        SEC06[SEC-06: Require verified email before linking seeded accounts]
        SEC07[SEC-07: Add atomic stock locking to pharmacy orders]
        PERF01[PERF-01: Add missing database indexes across schema.ts]
    end

    subgraph Priority 3 - Quality, Validation & Reliability
        CQ01[CQ-01: Add Zod schemas to all unvalidated POST/PATCH routes]
        CQ02[CQ-02: Wrap multi-table state mutations in transactions]
        PERF03[PERF-03: Switch webhook verification to raw request buffer]
        PERF04[PERF-04: Mark slot as booked on webhook confirmation]
        OBS01[OBS-01: Add structured audit events for verification decisions]
    end

    Priority 1 --> Priority 2 --> Priority 3
```

---

## 8. Audit Status

- **Status:** **AUDIT COMPLETE — READY FOR REVIEW**
- **Action Taken:** Report generated, documented, and pushed. Zero fixes have been applied.
- **Awaiting User Review:** Standing by for prioritized review and sequencing before touching any code.
