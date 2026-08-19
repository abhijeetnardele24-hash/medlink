# MedLink — Full Platform Integration & Data-Layer Audit

**Audit Date:** 2026-08-19  
**Auditor:** Antigravity IDE Pair  
**Scope:** `apps/doctor-web`, `apps/coordinator-web`, `apps/patient-web`, `apps/pharmacy-web`, `apps/landing-web`, `services/api`  
**Standard:** Verified line-by-line against source code, router mount points in `server.ts`, and database schemas in Drizzle (`schema.ts`).

---

## Executive Summary

| Application | Total Pages/Modules | Connected | Partially Connected | Not Connected / Mocked / 404 |
| :--- | :---: | :---: | :---: | :---: |
| **`apps/patient-web`** | 10 pages + 5 components | 8 | 2 | 0 |
| **`apps/doctor-web`** | 11 pages + 5 components | 8 | 1 | 2 |
| **`apps/coordinator-web`** | 8 pages | 7 | 0 | 1 |
| **`apps/pharmacy-web`** | 8 pages | 0 | 1 | 7 |
| **`apps/landing-web`** | 1 page | 1 (Gateway) | 0 | 0 |
| **`services/api` (Backend)** | 14 route files | 13 | 1 (Route Mount Mismatch) | 0 |

---

## 1. Module Audit: `apps/patient-web`

### 1.1 Dashboard (`src/pages/Dashboard.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/doctors` -> [`services/api/src/routes/doctors.routes.ts:50`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L50) (DB table: `doctors`, filtered by `verificationStatus = 'verified'`)
  - `GET /v1/appointments` -> [`services/api/src/routes/appointments.routes.ts:16`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L16) (DB table: `appointments`, joined with `doctors`)
  - `GET /v1/doctors/open-slots` -> [`services/api/src/routes/doctors.routes.ts:528`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L528) (DB table: `doctor_availability`)
- **Data Writes:** None on mount (triggers navigation to booking and triage modal).

### 1.2 Doctor Profile & Booking (`src/pages/DoctorProfile.tsx`)
- **Status:** `PARTIALLY CONNECTED`
- **Data Reads:**
  - `GET /v1/doctors/:id` -> [`doctors.routes.ts:127`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L127) (DB table: `doctors`) — **CONNECTED**
  - `GET /v1/doctors/:id/availability` -> [`doctors.routes.ts:408`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L408) (DB table: `doctor_availability`) — **CONNECTED**
  - `GET /v1/doctors/:id/reviews` (via `PatientReviews.tsx:38`) — **NOT CONNECTED (404)**: Route was intentionally removed from backend.
- **Data Writes:**
  - `POST /v1/appointments` -> [`appointments.routes.ts:83`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L83) (DB table: `appointments`) — **CONNECTED**
  - `POST /v1/appointments/:id/create-payment` -> [`appointments.routes.ts:168`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L168) (Razorpay Orders API + DB table: `payment_records`) — **CONNECTED**
  - `POST /v1/appointments/:id/verify-payment` -> [`appointments.routes.ts:223`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L223) (HMAC SHA-256 validation + DB table: `payment_records`) — **CONNECTED**
  - `POST /v1/doctors/:id/reviews` (via `PatientReviews.tsx:53`) — **NOT CONNECTED (404)**: Route removed from backend.

### 1.3 Consultation Room (`src/pages/Consultation.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/encounters/:id` -> [`encounters.routes.ts:17`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L17) (DB tables: `encounters`, `appointments`, `doctors`, `patients`)
  - `POST /v1/webrtc/credentials` -> [`webrtc.routes.ts:10`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/webrtc.routes.ts#L10) (Dynamic TURN/STUN credentials)
  - `GET /v1/encounters/:id/messages` -> [`encounters.routes.ts:98`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L98) (DB table: `messages`)
- **Data Writes:**
  - `POST /v1/encounters/:id/messages` -> [`encounters.routes.ts:51`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L51) (DB table: `messages`)
  - Socket.IO signalling (`join-encounter`, `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`) gated server-side via token middleware and appointment participant verification in [`src/index.ts`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/index.ts).

### 1.4 Patient Health Profile (`src/pages/HealthProfile.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/patients/me` -> [`patients.routes.ts:32`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/patients.routes.ts#L32) (DB table: `patients`, `users`)
- **Data Writes:**
  - `PATCH /v1/patients/me` -> [`patients.routes.ts:79`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/patients.routes.ts#L79) (DB table: `patients` — blood group, allergies, medications, emergency contacts, insurance).

### 1.5 Medical Records & Prescriptions (`src/pages/MedicalRecords.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/prescriptions/me` -> [`prescriptions.routes.ts:16`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/prescriptions.routes.ts#L16) (DB table: `prescriptions`, joined with `doctors`)
  - `GET /v1/prescriptions/:id/pdf` -> [`prescriptions.routes.ts:100`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/prescriptions.routes.ts#L100) (Formatted clinical HTML blob with consent & auth verification)
- **Data Writes:**
  - `POST /v1/ai/lab-report/analyze` -> [`ai.routes.ts:153`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/ai.routes.ts#L153) (Gemini / Heuristic structured clinical lab report parser).

### 1.6 Consent Management (`src/pages/Consents.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/consents` -> [`consents.routes.ts:11`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/consents.routes.ts#L11) (DB table: `consent_grants`)
- **Data Writes:**
  - `POST /v1/consents` -> [`consents.routes.ts:31`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/consents.routes.ts#L31) (DB table: `consent_grants`)
  - `POST /v1/consents/:id/revoke` -> [`consents.routes.ts:58`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/consents.routes.ts#L58) (DB table: `consent_grants`)

### 1.7 Pharmacy Storefront (`src/pages/PharmacyStorefront.tsx`)
- **Status:** `PARTIALLY CONNECTED (ROUTER MOUNT DEFECT)`
- **Data Reads:**
  - `GET /v1/medicines` -> [`medicines.routes.ts:21`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/medicines.routes.ts#L21) (DB table: `medicines`) — **CONNECTED**
- **Data Writes:**
  - `POST /v1/pharmacy/orders` -> [`server.ts:150`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/server.ts#L150) + [`pharmacy.routes.ts:342`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/pharmacy.routes.ts#L342) (DB tables: `pharmacy_orders`, `pharmacy_order_items`, `prescription_reconciliation_audit`) — **CONNECTED**
  - `POST /v1/pharmacy/orders/:id/verify-payment` -> Frontend calls `/pharmacy/orders/${id}/verify-payment`. Backend `pharmacy.routes.ts` defines `router.post("/orders/:orderId/verify-payment")` inside router mounted at `/pharmacy/orders`. Effective backend URL is `/v1/pharmacy/orders/orders/:id/verify-payment`. — **NOT CONNECTED (404)**
  - `POST /v1/pharmacy/orders/upload` -> Frontend calls `/pharmacy/orders/upload`. Effective backend URL is `/v1/pharmacy/orders/orders/upload`. — **NOT CONNECTED (404)**

### 1.8 Pharmacy Orders (`src/pages/PharmacyOrders.tsx`)
- **Status:** `PARTIALLY CONNECTED (ROUTER MOUNT DEFECT)`
- **Data Reads:**
  - `GET /v1/pharmacy/orders` -> [`pharmacy.routes.ts:303`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/pharmacy.routes.ts#L303) (DB table: `pharmacy_orders`) — **CONNECTED**
- **Data Writes:**
  - `POST /v1/pharmacy/complaints` -> Frontend calls `/pharmacy/complaints`. Effective backend URL is `/v1/pharmacy/orders/complaints`. — **NOT CONNECTED (404)**

---

## 2. Module Audit: `apps/doctor-web`

### 2.1 Doctor Dashboard (`src/pages/Dashboard.tsx`)
- **Status:** `CONNECTED (WITH LOCAL SPARKLINE MOCK)`
- **Data Reads:**
  - `GET /v1/appointments` -> [`appointments.routes.ts:16`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L16) (DB table: `appointments`) — **CONNECTED**
  - `GET /v1/doctors/me/messages/unread` -> [`doctors.routes.ts:544`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L544) (DB table: `messages`) — **CONNECTED**
  - `mockEarningsData` (lines 15–20): Static array used exclusively for aesthetic mini-sparkline under Welcome banner.
- **Data Writes:**
  - `PATCH /v1/appointments/:id` -> [`appointments.routes.ts:121`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L121) (Triage Accept/Decline, DB table: `appointments`) — **CONNECTED**

### 2.2 Doctor Earnings & Settlements (`src/pages/Earnings.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/doctors/:id/earnings` -> [`doctors.routes.ts:579`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L579) (DB tables: `payment_records`, `payout_records`, `appointments`)
  - `GET /v1/doctors/:id/payout-methods` -> [`doctors.routes.ts:653`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L653) (DB table: `doctor_payout_methods`)
- **Data Writes:**
  - `POST /v1/doctors/:id/payout-methods` -> [`doctors.routes.ts:664`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L664) (DB table: `doctor_payout_methods`)
  - `POST /v1/doctors/:id/withdraw` -> [`doctors.routes.ts:709`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L709) (DB table: `payout_records`)

### 2.3 Doctor Consultation & Prescription Modal (`src/pages/Consultation.tsx` & `PrescribeModal.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/encounters/:id` -> [`encounters.routes.ts:17`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L17) (DB tables: `encounters`, `appointments`, `patients`)
  - `GET /v1/medicines?search=...` -> [`medicines.routes.ts:21`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/medicines.routes.ts#L21) (DB table: `medicines`)
  - `POST /v1/ai/safety/ddi-check` -> [`ai.routes.ts:192`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/ai.routes.ts#L192) (Drug-Drug Interaction AI checker)
- **Data Writes:**
  - `POST /v1/encounters/:id/prescriptions` -> [`encounters.routes.ts:146`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L146) (DB tables: `prescriptions`, `doctor_medicine_recommendations`)
  - `POST /v1/encounters/:id/complete` -> [`encounters.routes.ts:80`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L80) (DB table: `encounters`)

### 2.4 Doctor Availability Manager (`src/pages/Availability.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/doctors/me/availability` -> [`doctors.routes.ts:441`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L441) (DB table: `doctor_availability`)
- **Data Writes:**
  - `POST /v1/doctors/me/availability` -> [`doctors.routes.ts:503`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L503) (DB table: `doctor_availability`)
  - `DELETE /v1/doctors/me/availability/:slotId` -> [`doctors.routes.ts:470`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L470) (DB table: `doctor_availability`)

### 2.5 Doctor Profile (`src/pages/Profile.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/doctors/me` -> [`doctors.routes.ts:167`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L167) (DB table: `doctors`, `users`)
- **Data Writes:**
  - `PATCH /v1/doctors/me` -> [`doctors.routes.ts:241`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L241) (DB table: `doctors`)

### 2.6 Patients Roster & Patient Detail (`src/pages/Patients.tsx` & `PatientDetail.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/appointments` -> [`appointments.routes.ts:16`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/appointments.routes.ts#L16)
  - `GET /v1/patients/:id` -> [`patients.routes.ts:162`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/patients.routes.ts#L162) (DB tables: `patients`, `users`)
  - `GET /v1/encounters` -> [`encounters.routes.ts:17`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/encounters.routes.ts#L17)

### 2.7 Doctor Reviews (`src/pages/Reviews.tsx`)
- **Status:** `NOT CONNECTED (404)`
- **Detail:** Calls `GET /v1/doctors/:id/reviews` and `PATCH /v1/doctors/reviews/:id/reply`. These endpoints were reverted and removed from the backend. The page will 404 on API requests.

### 2.8 Doctor Analytics (`src/pages/Analytics.tsx`)
- **Status:** `NOT CONNECTED (MOCK DATA)`
- **Detail:** Hardcoded stats `totalEarnings: 124500, totalPatients: 342, consultationsCompleted: 456, averageRating: 4.8` (lines 43–47) and static chart arrays `revenueData` and `patientDemographics`. No backend API is invoked.

---

## 3. Module Audit: `apps/coordinator-web`

### 3.1 Verification Queue (`src/pages/VerificationQueue.tsx` & `Dashboard.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/admin/verifications?status=pending_verification` -> [`admin.routes.ts:60`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L60) (DB tables: `doctor_verifications`, `doctors`)
  - `GET /v1/admin/pharmacist-verifications?status=pending_verification` -> [`admin.routes.ts:114`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L114) (DB tables: `pharmacist_verifications`, `pharmacists`)
- **Data Writes:**
  - `PATCH /v1/admin/verifications/:id` -> [`admin.routes.ts:86`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L86) (DB tables: `doctor_verifications`, `doctors`)
  - `PATCH /v1/admin/pharmacist-verifications/:id` -> [`admin.routes.ts:140`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L140) (DB tables: `pharmacist_verifications`, `pharmacists`, `pharmacist_verification_history`)

### 3.2 Appointments Overview (`src/pages/AppointmentsOverview.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/admin/appointments` -> [`admin.routes.ts:197`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L197) (DB tables: `appointments`, `doctors`, `patients`, `users`)

### 3.3 Doctors & Patients Directories (`src/pages/DoctorsDirectory.tsx` & `PatientsDirectory.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/doctors` -> [`doctors.routes.ts:50`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/doctors.routes.ts#L50) (DB table: `doctors`)
  - `GET /v1/admin/appointments` -> [`admin.routes.ts:197`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L197) (Derives patient registry from appointments)

### 3.4 Platform Analytics (`src/pages/Analytics.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/admin/analytics` -> [`admin.routes.ts:304`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L304) (Aggregates live count of `patients`, `doctors`, `pharmacists`, and status breakdowns of `appointments` from Postgres).

### 3.5 Task Queue (`src/pages/Tasks.tsx`)
- **Status:** `CONNECTED`
- **Data Reads:**
  - `GET /v1/admin/tasks` -> [`admin.routes.ts:231`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L231) (DB table: `reminder_tasks`, joined with `doctors`)
- **Data Writes:**
  - `PATCH /v1/admin/tasks/:id` -> [`admin.routes.ts:269`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/admin.routes.ts#L269) (DB table: `reminder_tasks`)

### 3.6 Settings (`src/pages/Settings.tsx`)
- **Status:** `NOT CONNECTED (LOCAL STATE ONLY)`
- **Detail:** Toggles `maintenanceMode` and `autoApproveDoctors` locally in React state without persisting to any backend endpoint.

---

## 4. Module Audit: `apps/pharmacy-web`

### 4.1 Pharmacist Onboarding (`src/pages/Onboarding.tsx`)
- **Status:** `NOT CONNECTED (ROUTING 404)`
- **Detail:** Calls `POST /v1/pharmacy/verify`. In `services/api/src/server.ts:150`, `pharmacyRouter` is mounted at `/pharmacy/orders`, so the real route is at `/v1/pharmacy/orders/verify`. Calling `/v1/pharmacy/verify` returns 404.

### 4.2 Inventory Dashboard (`src/pages/InventoryDashboard.tsx`)
- **Status:** `PARTIALLY CONNECTED`
- **Data Reads:**
  - `GET /v1/pharmacy/inventory` -> Calls `/v1/pharmacy/inventory`, which 404s because the backend route is `/v1/pharmacy/orders/inventory`. — **NOT CONNECTED (404)**
- **Data Writes:**
  - `POST /v1/medicines` -> [`medicines.routes.ts:121`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/routes/medicines.routes.ts#L121) (DB table: `medicines`, sets `listingStatus = 'pending'`) — **CONNECTED**

### 4.3 Incoming Orders & Dispense (`src/pages/IncomingOrders.tsx` & `OrderDetail.tsx`)
- **Status:** `NOT CONNECTED (ROUTING 404)`
- **Data Reads:**
  - `GET /v1/pharmacy/orders/incoming` -> Backend route in `pharmacy.routes.ts:157` is defined as `router.get("/orders/incoming")` under mount `/pharmacy/orders`, making the effective path `/v1/pharmacy/orders/orders/incoming` (Double `/orders`). Returns 404.
  - `GET /v1/pharmacy/inventory` -> Returns 404 (mounted at `/v1/pharmacy/orders/inventory`).
- **Data Writes:**
  - `POST /v1/pharmacy/orders/:id/build` -> Returns 404 (effective backend path is `/v1/pharmacy/orders/orders/:id/build`).
  - `PATCH /v1/pharmacy/orders/:id/dispense` -> Returns 404 (effective backend path is `/v1/pharmacy/orders/orders/:id/dispense`).

### 4.4 Order History (`src/pages/OrderHistory.tsx`)
- **Status:** `NOT CONNECTED (ROUTING 404)`
- **Detail:** Calls `GET /v1/pharmacy/orders/incoming` which returns 404 due to the double `/orders` path.

### 4.5 Pharmacy Earnings & Settlements (`src/pages/Earnings.tsx`)
- **Status:** `NOT CONNECTED (MOCK DATA)`
- **Detail:** Uses static `const mockLedger = [...]` with `TXN-90214`, hardcoded `₹1,24,500` numbers and static area charts. No backend API is invoked.

### 4.6 Business Analytics (`src/pages/Analytics.tsx`)
- **Status:** `NOT CONNECTED (MOCK DATA)`
- **Detail:** Uses static `inventoryData` and `pipelineData` arrays. No backend API is invoked.

### 4.7 Pharmacy Settings (`src/pages/Settings.tsx`)
- **Status:** `NOT CONNECTED (MOCK DATA)`
- **Detail:** Local prototype UI with hardcoded values (`MH-PH-2023-8911`). No backend API is invoked.

---

## 5. Module Audit: `apps/landing-web`

### 5.1 Landing Page & Navigation Gateway (`src/App.tsx`)
- **Status:** `CONNECTED (PORTAL GATEWAY)`
- **Detail:** Static marketing and interactive architecture diagrams. Direct links route users to the 4 portals:
  - `VITE_PATIENT_URL` (`http://localhost:5176`)
  - `VITE_DOCTOR_URL` (`http://localhost:5174`)
  - `VITE_ADMIN_URL` (`http://localhost:5175`)
  - `VITE_PHARMACY_URL` (`http://localhost:5177`)
- No dynamic data fetching is required; all external routing is configured.

---

## 6. Environment & Infrastructure Audit

1. **PostgreSQL Database:**
   - Real remote Neon Cloud Postgres pooler instance active in [`services/api/.env`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/.env#L2) (`ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech`). All schemas synchronized via Drizzle.
2. **Firebase Auth:**
   - Real Firebase Project `medlink-f0762` shared across all `.env` files.
3. **Socket.IO Realtime & Signalling:**
   - Socket server configured in [`services/api/src/index.ts`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/index.ts) with `@socket.io/redis-adapter` and automatic in-memory fallback.
4. **Client API Configuration:**
   - All 4 portal apps (`patient-web`, `doctor-web`, `coordinator-web`, `pharmacy-web`) have `api.ts` pointing to `VITE_API_URL + '/v1'`, attaching Firebase Bearer ID tokens automatically on every request.

---

## 7. Prioritized Remediation Roadmap

### Tier 1: Core-Loop Blockers (Must Be Fixed First)

1. **Fix Pharmacy Router Mount Point & Route Prefixes in `services/api`:**
   - **Issue:** In [`server.ts:150`](file:///c:/Users/Abhijeet%20Nardele/OneDrive/Desktop/Edi%20project%20sem%205/services/api/src/server.ts#L150), `v1Router.use("/pharmacy/orders", pharmacyRouter)` creates broken paths for `/pharmacy/verify`, `/pharmacy/inventory`, and double-nested paths like `/pharmacy/orders/orders/incoming`.
   - **Resolution:** Mount `pharmacyRouter` at `v1Router.use("/pharmacy", pharmacyRouter)` and standardize internal route prefixes (`/verify`, `/inventory`, `/orders`, `/orders/incoming`, `/orders/:id/build`, `/orders/:id/dispense`, `/orders/:id/verify-payment`, `/complaints`).
   - **Impact:** Instantly unblocks pharmacist onboarding, inventory viewing, order building, dispensing, payment verification, and prescription uploads.

2. **Clean up Reverted Doctor Reviews Call Sites:**
   - **Issue:** `apps/doctor-web/src/pages/Reviews.tsx` and `apps/patient-web/src/components/PatientReviews.tsx` (mounted in `DoctorProfile.tsx`) call `GET/POST /doctors/:id/reviews` which 404s since the unapproved reviews backend was reverted.
   - **Resolution:** Either unmount/hide the reviews tab/section from the UI or submit a proper design plan for the reviews system before building the backend endpoints.

---

### Tier 2: Polish & Secondary Feature Gaps (Non-Blocking)

3. **`apps/pharmacy-web/src/pages/Earnings.tsx`:**
   - Wire settlement ledger to real `payment_records` / pharmacy orders DB data rather than static `mockLedger`.
4. **`apps/doctor-web/src/pages/Analytics.tsx` & `apps/pharmacy-web/src/pages/Analytics.tsx`:**
   - Replace static demo charts with real DB aggregations (similar to `coordinator-web/src/pages/Analytics.tsx`).
5. **`apps/coordinator-web/src/pages/Settings.tsx` & `apps/pharmacy-web/src/pages/Settings.tsx`:**
   - Connect settings toggle buttons to a backend configuration table or mark explicitly as read-only prototype view.
