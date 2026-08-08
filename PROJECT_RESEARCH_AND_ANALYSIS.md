# MedLink — Project Research and Detailed Analysis

> **Project title:** MedLink: An Adaptive Offline-First Telemedicine Platform with Intelligent Network-Aware Consultation Switching
>
> **Project area:** Telemedicine Systems, Mobile Application Development, Offline-First Computing, Healthcare Informatics
>
> **Document purpose:** Convert the submitted project synopsis into a clear, research-backed and buildable software plan.
> **Working assumption:** India-focused academic project. This document is a product and engineering plan, not medical or legal advice.

---

## 1. Executive summary

MedLink is a telemedicine system designed for rural and remote areas where mobile data is slow, intermittent, or unavailable. Unlike a video-only consultation platform, MedLink treats connectivity as a changing condition. It should begin a live consultation at the best viable mode and move the consultation to a lower-bandwidth mode when needed:

1. Video consultation when network quality is good.
2. Audio consultation when video quality is no longer acceptable.
3. Secure asynchronous text and image messaging when a real-time call cannot be sustained.
4. Offline capture when there is no usable internet, followed by safe synchronisation when the connection returns.

The core innovation is therefore **continuity of care under network failure**, rather than simply adding video calling to an appointment system. Patient records, consultation notes, prescriptions, appointment changes, messages and selected image attachments must remain available locally to authorised users. Changes made offline must be put into a durable sync queue and uploaded once connectivity is restored. The doctor dashboard must show the patient’s current consultation state and whether any data is waiting to sync.

This problem is well aligned with digital-health priorities: WHO describes digital health as a means to support equitable access, while also stressing security, privacy, interoperability and contextual design. Rural care settings may face both poor connectivity and unreliable electricity, which makes a lightweight, recoverable design essential rather than optional ([WHO digital-health strategy](https://iris.who.int/bitstream/handle/10665/344249/9789240020924-eng.pdf), [WHO electricity fact sheet](https://www.who.int/news-room/fact-sheets/detail/electricity-in-health-care-facilities)).

## 2. What the project paper proposes

The supplied synopsis defines these main requirements:

| Area | Requirement from the paper |
|---|---|
| Consultation | Automatically switch between video, audio, asynchronous messaging and offline modes based on live network conditions. |
| Offline-first records | Store patient records, appointments, prescriptions and consultation history locally; synchronise to a cloud database once connectivity returns. |
| Doctor experience | Provide a web dashboard with real-time visibility of each patient’s consultation mode/status. |
| Network intelligence | Monitor bandwidth and latency continuously and make mode decisions. |
| Security | Authenticate users and keep health information protected. |
| Proposed stack | Flutter mobile app, Node.js backend/API, PostgreSQL, Firebase Authentication, SQLite local storage, Provider/Riverpod, WebRTC, REST API, AWS/Firebase Storage. |

The paper’s literature survey highlights a useful gap: available telemedicine systems improve access but commonly assume continuous connectivity, concentrate on live video, and have limited offline support. Its cited Indian studies also identify poor internet connectivity, digital literacy, infrastructure gaps and limited continuity of service as practical barriers. MedLink should make that gap measurable through actual mode switching, queued offline writes, and successful synchronisation after reconnection.

## 3. Problem statement, users and boundaries

### 3.1 Problem statement

Patients in low-connectivity areas can lose access to care when a video call fails. Conventional apps often fail as a whole because appointment information, messages and notes depend on an active connection. Even when a patient and doctor can eventually reconnect, information entered during the interruption may be lost or duplicated.

MedLink must preserve the consultation context and health data while allowing communication to degrade gracefully. It must tell both people what is happening; an unexplained downgrade is a poor clinical and user experience.

### 3.2 Primary users

| User | Main needs |
|---|---|
| Patient | Register/login, view basic record, request appointment, join consultation, send message/photo, receive prescription, see clear offline and sync status. |
| Doctor | Review authorised patient history, manage appointments, conduct consultations, write notes/prescription, see current mode and pending changes. |
| Clinic coordinator/admin | Verify doctor profiles, manage appointment operations, create reminders, resolve booking issues and review operational/audit logs without routine access to clinical content. |

### 3.3 Confirmed platform strategy: mobile for patients, web for doctors

MedLink will be a **connected two-application system**, not two disconnected projects:

| User group | Primary application | Platform decision | Why this is appropriate |
|---|---|---|---|
| Patients and village/community users | MedLink Patient App | Flutter Android mobile application | A smartphone is more affordable, familiar and portable than a laptop. It can work over mobile data, retain data locally with SQLite and be used at home, at a local health centre or with a community health worker. Android is the first target because it is the practical priority for the project audience. |
| Doctor | MedLink Doctor Dashboard | Responsive React/TypeScript web application for laptop/desktop | A larger screen is more suitable for reviewing patient history, attached images, consultation notes, prescriptions, appointment lists and several active consultation statuses. It also fits a doctor’s normal work setting at a clinic or hospital. |
| Admin / Coordinator | Admin pages within the web dashboard | Web application | User verification, audit review and system management are administrative tasks better handled on a desktop screen. |
| Pharmacy / Patients | MedLink Pharmacy Portal | Web application | A separate React web application (`apps/pharmacy-web`) dedicated to browsing medicines, cart, checkout, and managing prescription-required orders. |

Doctors are not prevented from using a phone; the web dashboard should be responsive enough for emergency/basic viewing. However, the project will optimise the main doctor experience for a laptop or desktop. Likewise, patients are not expected to need a laptop for normal use.

The two applications communicate with the **same Node.js backend, PostgreSQL database, WebSocket signalling/status service and WebRTC consultation service**. Therefore an appointment created in the patient app appears on the doctor dashboard, a doctor’s prescription appears in the patient app, and both participants see the same encounter state.

```text
┌─────────────────────────────────┐          ┌─────────────────────────────────┐
│ Patient: Flutter Android app    │          │ Doctor: React web dashboard     │
│ - Appointment request           │          │ - Appointment queue             │
│ - Offline records/messages      │          │ - Patient history               │
│ - Video/audio/chat consultation │          │ - Notes and prescription        │
│ - Sync-status visibility        │          │ - Consultation/network status   │
└───────────────┬─────────────────┘          └─────────────────┬───────────────┘
                │                                              │
┌───────────────▼─────────────────┐                            │
│ Pharmacy: React web portal      │                            │
│ - Medicine marketplace          │                            │
│ - Cart and checkout (Razorpay)  │                            │
│ - Prescription attachment       │                            │
└───────────────┬─────────────────┘                            │
                │ REST API + WebSocket + WebRTC                │
                └───────────────────┬──────────────────────────┘
                                    │
                  ┌─────────────────▼─────────────────┐
                  │ MedLink shared backend             │
                  │ Node.js/TypeScript + PostgreSQL    │
                  │ auth, RBAC, sync, audit, signalling│
                  └───────────────────────────────────┘
```

#### End-to-end patient–doctor workflow

1. The patient opens the Flutter app, logs in, views locally available records and requests an appointment. If internet is unavailable, the request is saved in the encrypted local database and labelled **Pending sync**.
2. When connectivity returns, the patient app sends the queued request to the shared backend. The backend validates it and stores it in PostgreSQL.
3. The doctor’s web dashboard receives a real-time update and shows the appointment in the doctor’s queue. The doctor accepts, reschedules or rejects it; the patient sees the result in the mobile app.
4. At consultation time, the patient joins from the mobile app and the doctor joins from the laptop browser. Both applications enter the same `Encounter` and connect through WebRTC.
5. The patient app measures connection quality. If the network deteriorates, it proposes/executes a safe transition from video to audio, then to asynchronous chat, then to offline capture if connection is lost. The doctor dashboard sees the current mode and the reason for the change.
6. The doctor records notes and prepares a prescription from the dashboard. The patient receives the authorised record in the mobile app when online; otherwise it is downloaded during the next sync.
7. Every important update is versioned, audited and synchronised safely. Neither user needs to repeat the appointment just because the connection was interrupted.

#### MVP screens by application

| Patient mobile app (Flutter) | Doctor web dashboard (React) |
|---|---|
| Login/registration; language-friendly onboarding | Doctor login and profile |
| Home: next appointment, current sync/offline state | Appointment queue and day view |
| Appointment request/status | Patient search and authorised patient summary |
| Patient profile and selected health history | Patient history, encounters and attachments |
| Consultation room: video/audio/chat and network state | Consultation workspace: video/audio/chat, notes and network state |
| Offline message/record capture with pending-sync list | Notes, prescription create/finalise/amend |
| Prescription/history view and consent controls | Live consultation status and basic audit view |

#### Why this is the best research-backed choice

- It matches the actual access pattern: patient-side communication must be mobile-first and resilient to limited network/data access, while doctor-side clinical review benefits from a large screen and keyboard.
- It keeps the project realistic without duplicating all doctor features in a second mobile app.
- A shared API and common `Appointment`/`Encounter` data model prevent inconsistent data between the two interfaces.
- The patient app is where offline-first engineering has the greatest value; the doctor dashboard can still function well on normal clinic connectivity while accurately showing a patient’s connection/sync state.
- It gives a strong academic demonstration: one real workflow across mobile, web, backend, database, real-time communication and network-aware degradation.

### 3.4 Confirmed multi-role workflow: patient, doctor and coordinator

MedLink will include a third operational role: **Clinic Coordinator/Admin**. This makes the project closer to a real telemedicine service. The coordinator is responsible for the service operation around the consultation, while the doctor is responsible for clinical care and the patient controls their own health data.

The coordinator role must use **least-privilege access**. It should not become a back door to patient records. By default, a coordinator sees only what is needed to manage appointments: patient name/contact reference, doctor, speciality, slot, booking/payment state, reminder state and consultation attendance. Private chat, clinical notes, images, medical history and prescriptions remain unavailable unless a specifically authorised support/escalation policy is implemented and audited.

#### Roles and permission boundaries

| Role | Permitted actions | Restricted actions |
|---|---|---|
| Patient | Create/profile own account; state concern category; search doctors; select slot; consent; join consultation; view own authorised history/prescriptions; queue actions offline. | Cannot see other patients, doctor schedules beyond published slots, internal coordinator notes or unassigned doctor data. |
| Doctor | Create professional profile; manage availability; accept/reschedule appointments; view records for an authorised assigned patient; consult; create/finalise notes and prescriptions. | Cannot access records for unassigned patients or alter coordinator/admin audit logs. |
| Clinic Coordinator/Admin | Review doctor-verification requests; publish verified doctor profiles; manage speciality list; view appointment operations; assign reminder tasks; record call outcome; resolve non-clinical booking/payment issues. | Cannot routinely read diagnoses, consultation chat, attachments, medical history, clinical notes or prescription content. Cannot prescribe or make clinical decisions. |
| System recommendation engine | Rank suitable doctors/specialities from selected non-diagnostic inputs and return an explanation. | Does not diagnose, prescribe, make a booking, override availability, or take a decision away from patient/doctor. |
| Community Health Worker / Village Facilitator (future) | With patient consent, help a patient use the app/device at a health centre, enter permitted vitals and join the consultation. | Does not access data outside a consented encounter, prescribe, or make a clinical decision. |

Every role requires a separate account and backend-enforced role. The UI alone is never a security boundary: the API and database queries must check the authenticated user, role, relationship to the appointment/encounter and consent state.

#### Doctor verification workflow

1. A prospective doctor registers and enters name, speciality, professional-registration number, facility/clinic, language and availability.
2. The doctor uploads required proof documents through a protected upload flow. In the student demo, use only mock documents and synthetic doctor identities.
3. A coordinator reviews the request. The status is `pending_verification`, `needs_correction`, `verified`, `rejected` or `suspended`.
4. Only `verified` doctors appear in the patient doctor directory and can receive new booking requests.
5. Every decision records reviewer, timestamp, reason code and optional comment in an immutable audit event.

For a real Indian deployment, MedLink should verify against the appropriate official register or Healthcare Professionals Registry process rather than relying only on an internal upload. ABDM describes HPR as a verified professional registry, and its published process involves the relevant council verifiers. The academic demo should display **“Demo verified by MedLink”**, never a false government or licence-verification badge ([ABDM HPR](https://nhpr.abdm.gov.in/), [HPR FAQ](https://nhpr.abdm.gov.in/nhpr/v4/faq)).

#### AI-assisted speciality and doctor matching

The project should implement this safely as an **explainable recommendation engine**, not as a diagnosis bot. The patient selects structured information such as general concern category, preferred language, preferred time, consultation mode preference and optional location/clinic preference. The system maps a concern category to a speciality and ranks only verified doctors who have compatible availability.

```text
Patient submits concern: "skin concern"
Preferences: Hindi, evening, audio/chat acceptable
        │
        ▼
POST /recommendations
        │
        ▼
Suggested speciality: Dermatology
        │
        ▼
Rank verified doctors by: speciality match + availability + language
                           + consultation-mode support + low-bandwidth suitability
        │
        ▼
Return ranked list with explanation: "Suggested because you selected a skin concern,
Hindi and an evening appointment. This is not a medical diagnosis."
Event logged in `recommendationEvents` table.
```

Initial implementation: use a transparent rules-and-score table in the backend. This is free, testable and easy to explain in a viva. A later version may use an AI/LLM only to convert free-text descriptions into a suggested non-diagnostic category, subject to consent, privacy review, validation and human oversight. WHO’s AI-for-health guidance requires human autonomy, safety, transparency, explainability and accountability; the patient chooses the final doctor and the doctor makes all medical decisions ([WHO guidance](https://www.who.int/publications/i/item/9789240029200)).

Example score, deliberately visible in the system design:

```text
doctor_score = 50 × speciality_match
             + 20 × availability_match
             + 15 × language_match
             + 10 × preferred_mode_match
             +  5 × low_bandwidth_support
```

This is a starting formula, not clinical evidence. The interface must state why a suggestion is shown, offer doctor-directory search without AI, and avoid using protected health data to train any model.

#### Appointment, payment and reminder workflow

```text
Patient searches/selects doctor
      ↓
Chooses an available slot and confirms consent
      ↓
Booking request created (offline queue if needed)
      ↓
Optional demo payment state: FREE_DEMO / PENDING / SUCCESS / FAILED / REFUNDED
      ↓
Doctor accepts or proposes another slot
      ↓
Appointment confirmed → coordinator reminder task created
      ↓
Automated in-app reminder; coordinator calls only for escalation/missed confirmation
      ↓
Patient and doctor join the same encounter
      ↓
Consultation completed / missed / cancelled → auditable status
```

The booking is **not** final merely because a patient pays or selects a slot; the doctor must be available and accept, and the backend must prevent two people from receiving the same slot. For the demo, payment is a simulated state only—no UPI/card details, real gateway, bank information or real charges. Real payment integration is future scope because it brings transaction fees, security duties and refund/dispute requirements.

The coordinator dashboard should use a task queue rather than requiring a manual call for every appointment. Automatic in-app reminders are first; a human call is created only when a patient or doctor has not confirmed, a consultation is approaching, the patient has a known connectivity issue, or an appointment was missed. The coordinator logs `attempted`, `reached`, `confirmed`, `rescheduled` or `no_response`, together with time and staff member. This makes follow-up measurable and auditable.

#### Complete end-to-end service workflow

1. **Doctor onboarding:** doctor registers → coordinator verifies demo credentials → verified doctor profile becomes searchable.
2. **Patient onboarding:** patient registers on the Android app, gives privacy/teleconsultation consent and completes a minimal profile. Patient identity is self-declared in the demo; do not ask for Aadhaar or real health data.
3. **Discovery:** patient searches by speciality/name or uses the explainable recommendation flow. The system always presents the explanation and a manual search alternative.
4. **Booking:** patient selects doctor and published slot, confirms the request and receives `pending_doctor_confirmation`. Offline requests stay in the device outbox until safely synchronised.
5. **Confirmation:** doctor accepts/reschedules/rejects. The system atomically reserves the accepted slot and informs the patient. The coordinator sees the operational status only.
6. **Preparation:** in-app reminders notify patient and doctor; coordinator handles exception tasks. The patient can check network state before joining.
7. **Consultation:** both join one encounter. Video automatically degrades to audio, asynchronous chat, or offline capture as connectivity changes; the coordinator can see attendance/mode status but not clinical content.
8. **After consultation:** doctor finalises notes/prescription; patient receives an authorised copy on the app or during later sync. Coordinator sees only completion/missed/cancelled status.
9. **Audit and quality:** access, verification, booking, reminder, consent and sync events are logged. Clinical content remains segregated from operational logs.

### 3.5 Explicit scope for the student-project MVP

The first version should support a simulated clinical workflow, not make independent clinical decisions. It should not diagnose, triage emergencies, generate prescriptions automatically, process real money, or promise national health-system integration. A simulated payment status is permitted for demonstrating the booking workflow. Real deployment would require clinical, legal, payment, hosting, security and operational approvals beyond this project.

**Recommended MVP definition:** one patient and one doctor can authenticate, create/request an appointment, join a WebRTC call, see a network-status indicator, move to audio or chat, create a consultation note/prescription, use the app offline for selected record updates, and later synchronise those updates without duplicates.

## 4. Objectives translated into measurable outcomes

| Original objective | Engineering interpretation | Evidence of completion |
|---|---|---|
| Adaptive consultations | A state machine selects and presents video, audio, chat or offline states. | Test with simulated good/poor/no network; system produces an explained transition. |
| Offline-first healthcare data | Local database is the primary write target; server sync is eventual. | Create/update a record offline, restart app, reconnect and verify one server copy. |
| Network-aware doctor dashboard | Doctor sees consultation state, approximate network tier and last sync time. | Dashboard changes after a patient transition; no sensitive telemetry is exposed unnecessarily. |
| Secure access | Strong authentication, role checks, encrypted transport, encrypted local data, audited sensitive actions. | Patient cannot access another patient; unauthorised API requests are rejected. |
| Reliable synchronisation | Idempotent operations, retry/backoff and deterministic conflicts. | Repeated sync request does not create duplicate appointments/messages/notes. |

## 5. Research implications and design principles

### 5.1 Offline-first is an architecture, not a cache

“Offline support” must not only mean showing a previously downloaded screen. MedLink needs local, durable records and a persistent operation queue. A patient should be able to enter an appointment request or message without internet; the application saves it locally immediately and marks it **Pending sync**. The server is updated later.

The resulting pattern is:

```text
User action → validate locally → write encrypted SQLite transaction
            → append outbox operation → update UI immediately
            → network available? → authenticate + send operation → mark acknowledged
                                  ↘ retry safely with backoff when it fails
```

This is better than attempting to write directly to the API and displaying an error when it fails. It prevents loss of entered information and makes the offline state visible.

### 5.2 Health data requires privacy by design

Medical information is sensitive. In the Indian context, the Digital Personal Data Protection Act, 2023 regulates processing of digital personal data, and ABDM guidance emphasises consent-based sharing, privacy by design and a federated model ([DPDP Act, official text](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf), [ABDM Health Data Management Policy](https://abdm.gov.in/static/media/health_management_policy_bac9429a79.80f74bc3e039c00acd4f.pdf)). This MVP should demonstrate those principles without claiming compliance certification.

Minimum project safeguards:

- Use Firebase Authentication only for identity; verify Firebase ID tokens in Node.js on every protected API request.
- Store role and authorisation decisions on the backend; never rely only on a Flutter screen hiding a button.
- Encrypt traffic with HTTPS/WSS; never put health data in URLs, console logs or push-notification text.
- Encrypt the local database and keep its key in platform secure storage. If full database encryption cannot be implemented in the first demo, store only a minimal, non-production data set locally and document the limitation.
- Use server-side role-based access control: patient, doctor and admin. A patient can access only their own data; a doctor can access only patients with an authorised appointment/care relationship.
- Record audit events for login, record view, record export, prescription creation and consent changes. Audit logs should avoid storing the full clinical note.
- Ask explicit consent before sharing a record or attachment with a doctor; show what is shared, why, and for how long.

### 5.3 Interoperability is valuable, but should be staged

FHIR (Fast Healthcare Interoperability Resources) is an HL7 standard for electronic exchange of healthcare information. Its resource model makes it a suitable target model for future interoperability, not a requirement to implement a full FHIR server in the MVP ([HL7 FHIR overview](https://hl7.org/fhir/overview.html)).

Use FHIR-inspired internal entities initially: `Patient`, `Practitioner`, `Appointment`, `Encounter`, `Observation`, `MedicationRequest`/Prescription and `DocumentReference`. Keep stable UUIDs and timestamps so future mapping is practical. Avoid claiming ABDM or FHIR compliance unless the relevant official APIs, profiles, security controls and testing have actually been completed.

### 5.4 WebRTC needs signalling and a relay plan

WebRTC gives the application real-time audio/video media transport, but it does not provide the full product by itself. MedLink needs:

- a signalling channel (Socket.IO/WebSocket via the Node backend) to exchange offers, answers and ICE candidates;
- STUN for discovering public connectivity; and
- TURN relay infrastructure for calls that cannot connect peer-to-peer because of NAT/firewall restrictions. WebRTC’s own documentation notes TURN is commonly used to establish peer connectivity ([WebRTC peer connections](https://webrtc.org/getting-started/peer-connections), [TURN overview](https://webrtc.org/getting-started/turn-server)).

For a college demonstration, a correctly configured coturn instance can be used. A production launch would need protected TURN credentials, capacity estimates, monitoring and regional relay deployment.

## 6. Recommended system architecture

```text
 ┌─────────────────────────────┐        ┌────────────────────────────────┐
 │ Patient mobile app          │        │ Doctor web dashboard           │
 │ Flutter / Android           │        │ React + TypeScript             │
 │ SQLite outbox + sync worker │        │ appointments, care workspace   │
 └──────────────┬──────────────┘        └───────────────┬────────────────┘
                │ REST / HTTPS, WebSocket / WSS, WebRTC │
 ┌──────────────▼──────────────┐        ┌───────────────▼────────────────┐
 │ Coordinator web console     │        │ Community facilitator app      │
 │ React + TypeScript          │        │ Future: limited consent access │
 │ verification, tasks, status │        │ only; can join patient support │
 └──────────────┬──────────────┘        └───────────────┬────────────────┘
                └───────────────────────┬────────────────┘
                                        │
                     ┌──────────────────▼──────────────────┐
                     │       MedLink backend (Node.js)      │
                     │ REST API + WebSocket signalling      │
                     │ authentication / RBAC / consent      │
                     │ appointment + availability service   │
                     │ doctor verification + task service   │
                     │ matching/recommendation service      │
                     │ offline sync + conflict processor    │
                     │ audit-log and notification service   │
                     └─────┬─────────────┬─────────────┬────┘
                           │             │             │
            ┌──────────────▼───┐ ┌───────▼───────┐ ┌──▼──────────────────┐
            │ PostgreSQL       │ │ Object storage │ │ Firebase Auth       │
            │ canonical data:  │ │ attachments,   │ │ identity only;      │
            │ users, records,  │ │ encrypted /    │ │ Node verifies token │
            │ slots, tasks,    │ │ access-checked │ └─────────────────────┘
            │ audit, operations│ └───────────────┘
            └──────────────────┘

 Patient device  ───────── WebRTC media ───────── Doctor browser
                   (STUN/TURN relay when required)
```

### Architecture responsibilities

| Component | Responsibility | Must not be responsible for |
|---|---|---|
| Patient Flutter app | Patient-facing offline-first experience, local outbox, network measurement and consultation controls. | Final authorisation decisions or direct database writes. |
| Doctor web dashboard | Clinical workspace, availability management and consultation actions. | Verifying own doctor account or accessing unassigned patients. |
| Coordinator web console | Doctor verification, appointment operations, reminder tasks and non-clinical support. | Reading clinical content by default or prescribing. |
| Recommendation service | Explainable speciality/doctor ranking from structured inputs. | Diagnosis, autonomous care or unexplainable black-box booking decisions. |
| Appointment service | Slot publication, atomic reservation, status transitions and scheduling conflict checks. | Holding/card-processing real payment data. |
| Notification/task service | In-app reminders, coordinator escalation tasks and delivery history. | Exposing medical details in notifications. |
| Sync service | Idempotent queued-operation processing, version checks and conflict responses. | Silently overwriting clinical records. |
| Audit service | Immutable, minimally necessary evidence of security/operational actions. | Saving full clinical content in a broadly accessible log. |

### Key architectural decisions

1. **PostgreSQL is the canonical shared record store.** SQLite is each device’s local replica/cache plus outbox. Firebase Authentication does not replace the application database.
2. **The backend owns authorisation and sync.** Direct client writes to the PostgreSQL database are not permitted.
3. **Object storage holds attachments, not SQLite/PostgreSQL blobs.** The database stores attachment metadata, checksum, owner and an access-controlled object key.
4. **WebRTC media is separate from the REST API.** REST is for normal data; WebSocket is for signalling/status; TURN may carry relayed audio/video.
5. **Firebase Storage versus AWS S3: choose one for the MVP.** Mixing both adds avoidable complexity. Firebase Storage is simpler alongside Firebase Auth; S3 is a good choice if the Node/PostgreSQL backend will be AWS-hosted.
6. **Use TypeScript on the backend.** It reduces schema and API contract mistakes. Use a migration tool/ORM such as Prisma or Drizzle, but do not let an ORM replace database constraints.

## 7. Consultation mode switching design

### 7.1 Use a state machine, not scattered `if` conditions

```text
PRE-CALL → VIDEO ↔ AUDIO ↔ ASYNC_CHAT ↔ OFFLINE
              │       │         │             │
              └───────┴─────────┴─────────────┘
                   transition only after confirmed condition

Every state → ENDED
```

Important rule: a network downgrade must not silently terminate the clinical context. The active encounter ID, participant identity, time and previous messages remain available across all states. The app gives the user an explanation and a clear action: “Video is unstable. Switching to audio in 10 seconds. Continue video / Switch now.”

### 7.2 Signals to collect

Network thresholds differ by device, codec and route, so do not treat the following as clinical-grade constants. Use them as initial demo thresholds, log anonymous/consented quality metrics, and tune after device testing.

| Signal | Source | Why it matters |
|---|---|---|
| Connection type / online state | Flutter connectivity plugin + reachability check | Distinguishes no network from a connected-but-captive/failed network. |
| Round-trip time (RTT) | WebRTC `getStats()` | High delay makes conversation difficult. |
| Jitter | WebRTC stats | High variation causes choppy audio/video. |
| Packet loss | WebRTC stats | Direct indicator of media failure. |
| Available outgoing bitrate | WebRTC candidate-pair/outbound stats | Predicts video viability. |
| Reconnection failures | signalling/WebRTC events | Detects a failed session faster than simple bandwidth checks. |
| Sync success and age | local sync worker | Shows whether health records are safely uploaded. |

### 7.3 Suggested initial policy

Sample over a rolling 10–15 second window, require several bad samples before degrading, and use stronger recovery conditions before upgrading. This hysteresis prevents rapid video/audio/video flapping.

| Decision | Initial trigger for 10–15 seconds | Action |
|---|---|---|
| Video → Audio | sustained loss above ~5%, jitter above ~80 ms, RTT above ~500 ms, or video bitrate below ~300 kbps | Notify both parties; renegotiate with video disabled while preserving the audio session if possible. |
| Audio → Async chat | loss above ~10%, RTT above ~1 s, repeated ICE/media disconnect, or audio unintelligible | Keep encounter open; send system event; enable text/image notes. |
| Async chat → Offline | reachability fails after retries | Store new content locally; show pending-sync count and a reconnect action. |
| Audio → Video | stable for at least 30–60 seconds with loss below ~2%, jitter below ~30 ms and enough bitrate | Ask users before enabling camera to avoid surprise data use. |

The policy must include a **manual override**, except where connection is physically impossible. A doctor may prefer audio for clinical safety; a patient may prefer chat due to data cost/privacy. Always display the current state and timestamp of the last successful connection.

## 8. Offline data and synchronisation strategy

### 8.1 Local tables / entities

Suggested local SQLite tables: `users`, `patients`, `appointments`, `encounters`, `messages`, `prescriptions`, `attachments`, `sync_outbox`, `sync_cursor`, and `local_audit_events`. Each synchronised record needs:

```text
id (UUID) | server_version | updated_at | created_at | updated_by | sync_status
```

`sync_outbox` should include `operation_id` (UUID), entity type, entity ID, operation type, JSON payload, base server version, retry count, next-attempt time and last error code. Do not delete the operation until the server has acknowledged its exact `operation_id`.

### 8.2 Sync protocol

1. On app start, login, connectivity recovery or manual retry, obtain a valid token.
2. Upload pending operations in timestamp order, in small batches.
3. Backend checks caller identity/role, validates payload, checks idempotency by `operation_id`, applies a transaction, writes an audit event, and returns record version/acknowledgement.
4. App marks acknowledged operations complete only after a valid acknowledgement.
5. App pulls server changes since `sync_cursor`, upserts them locally and advances the cursor atomically.
6. Attachments upload separately using resumable/chunked transfer when practical; their metadata operation references the final object/checksum.
7. On failure, retry with exponential backoff and jitter. Never spin continuously on a weak battery/network.

### 8.3 Conflict rules by entity

There is no single safe “last write wins” rule for every medical entity.

| Entity | Recommended conflict approach |
|---|---|
| Chat message | Append-only; UUID makes duplicates detectable. Do not overwrite. |
| Consultation note | Immutable amendment/version after signing. Show both versions and author/times; require doctor review. |
| Prescription | Once issued, create corrected/revoked replacement rather than silently editing. |
| Appointment | Server validates state transition; return a conflict for a stale cancellation/reschedule. |
| Demographic fields | Version check; latest value can win only with audit history and visible conflict indicator. |
| Attachment | Immutable object with checksum; new upload creates a new attachment version. |

For the MVP, deliberately demonstrate one conflict: edit the same appointment on two offline devices, sync both, reject the stale update with a useful “appointment changed on another device” resolution screen. This makes the offline-first claim credible.

## 9. Core data model (server-side)

| Entity | Essential fields |
|---|---|
| User | `id`, Firebase UID, role, profile status, created/disabled timestamps |
| Patient | `id`, user ID, basic demographic details, consent settings |
| Doctor | `id`, user ID, registration/verification fields, specialty |
| DoctorVerification | `id`, doctor ID, status, submitted documents metadata, reviewer ID, decision time, reason code |
| AvailabilitySlot | `id`, doctor ID, start/end time, consultation modes, capacity, slot status, version |
| Appointment | `id`, patient ID, doctor ID, scheduled time, status, reason, version |
| PaymentRecord (demo) | `id`, appointment ID, `FREE_DEMO`/`PENDING`/`SUCCESS`/`FAILED`/`REFUNDED`, reference, updated time; never store card/UPI details |
| ReminderTask | `id`, appointment ID, assigned coordinator ID, task type, due time, outcome, attempt count |
| Encounter | `id`, appointment ID, start/end time, current mode, network event summary, status |
| Message | `id`, encounter ID, sender ID, body/attachment reference, created time, delivery state |
| Prescription | `id`, encounter ID, doctor ID, structured medicines/instructions, status, issued time, version |
| Attachment | `id`, owner, encounter ID, storage key, content type, byte size, checksum, scan status |
| ConsentGrant | `id`, patient ID, purpose, grantee/role, scope, granted/revoked time, status |
| RecommendationEvent | `id`, patient ID (optional), selected category/preferences, suggested speciality, ranked doctor IDs, explanation/version; no free-text clinical record by default |
| SyncOperation | `operation_id`, actor ID, received timestamp, outcome — retained for idempotency/audit |
| AuditEvent | actor, action, resource type/ID, timestamp, outcome, minimally necessary metadata |

Use database foreign keys, `NOT NULL`, check constraints and indexes on foreign keys, appointment schedule, encounter status, operation ID and audit timestamp. These constraints matter even when the UI and API validate inputs.

### Appointment and verification state machines

```text
Doctor verification:
DRAFT → PENDING_VERIFICATION → VERIFIED → SUSPENDED
                │                  │
                ├→ NEEDS_CORRECTION┘
                └→ REJECTED

Appointment:
DRAFT/QUEUED_OFFLINE → REQUESTED → PENDING_DOCTOR → CONFIRMED → IN_PROGRESS → COMPLETED
                                          │               │              │
                                          ├→ RESCHEDULED ─┘              └→ FOLLOW_UP_NEEDED
                                          ├→ REJECTED
                                          ├→ CANCELLED
                                          └→ MISSED
```

Only permitted actors may make each transition. For example, the patient can request/cancel an appointment under defined conditions, the doctor can accept/reschedule/reject it, and the coordinator can create a reminder task but cannot turn an unverified doctor into a `VERIFIED` profile without leaving an audit record. The backend validates the current state and version inside a database transaction so two booking actions cannot reserve the same slot.

## 10. API and real-time contract outline

| Interface | Example endpoints/events |
|---|---|
| Authentication | Firebase login in client; `Authorization: Bearer <ID token>` to backend |
| Doctor directory and matching | `GET /doctors`, `GET /specialities`, `POST /recommendations/doctor-match`; returns explanation and only verified doctors |
| Doctor verification | `POST /doctor-verifications`, `GET /admin/doctor-verifications`, `PATCH /admin/doctor-verifications/:id`; admin actions are audited |
| Availability | `GET/POST /doctors/me/availability`, `PATCH /availability/:id`; patient only sees published slots |
| Appointments | `GET/POST /appointments`, `PATCH /appointments/:id` with `If-Match`/version |
| Demo payment and coordinator tasks | `PATCH /appointments/:id/payment-status`, `GET/POST/PATCH /coordinator/tasks`; no real payment payload is accepted |
| Consent | `POST /consents`, `GET /consents`, `POST /consents/:id/revoke`; record sharing requires active scope-specific consent |
| Encounter | `POST /encounters`, `PATCH /encounters/:id/mode`, `POST /encounters/:id/end` |
| Messages | `GET /encounters/:id/messages`, `POST /encounters/:id/messages` |
| Sync | `POST /sync/push`, `GET /sync/pull?cursor=...` |
| Attachments | `POST /attachments/upload-intent`, upload direct to protected storage, `POST /attachments/complete` |
| Signalling | Socket rooms per encounter; `offer`, `answer`, `ice-candidate`, `mode-change`, `call-ended` |
| Dashboard | authenticated subscription to only authorised encounters; doctor gets assigned clinical status, coordinator gets minimal operational status |

Do not transmit patient records through the WebRTC signalling channel. Signalling data should be limited to connection negotiation and limited session status.

## 11. Security, safety and ethical requirements

### Must-have for the demo

- Server-side authentication, role checks and ownership checks on every endpoint/socket room.
- Secure secrets management (`.env` locally, never commit keys); add `.env.example` with placeholders only.
- Passwordless/OTP provider controls handled by Firebase; backend verifies token issuer/audience/expiry through Firebase Admin SDK.
- HTTPS in deployed environments; secure WebSocket; protected TURN credentials with short expiry where available.
- Input validation (for example Zod/DTOs), file type/size limit, content checksum and malware scanning plan for uploads.
- Rate limiting for authentication-adjacent and upload/sync endpoints.
- No medical data in analytics, crash reports, logs or notification previews.
- Record consent/revocation events; make account/data removal requirements a documented future-work item.

### Clinical-safety UX

- Add a persistent warning that MedLink is not for emergencies; display local emergency instructions/number based on deployment locale.
- Never present the switching algorithm as a diagnosis or recommendation.
- Before a call changes mode, show the cause in plain language and preserve the ability to exchange urgent text.
- Label unsynchronised data clearly: **Saved on this device — not yet sent to the clinic**.
- Require review/confirmation before a doctor finalises a prescription; use immutable amendments after finalisation.

## 12. Development roadmap suitable for daily GitHub pushes

Each day should end in a small, runnable and documented increment. Commit messages can use `feat:`, `fix:`, `docs:`, `test:`, `chore:`. Do not push `.env`, Firebase service-account JSON, test patient data, recordings, build folders or API keys.

| Milestone | Deliverable | Suggested commits |
|---|---|---|
| 0. Repository foundation | README, architecture diagram, contribution guide, `.gitignore`, licence decision, issue board | `docs: add project research and MVP scope` |
| 1. Backend foundation | TypeScript Node API, Docker/local PostgreSQL, migrations, health check, lint/test setup | `feat(api): add typed server and database migration` |
| 2. Identity and roles | Firebase Auth integration, token verification, user/role schema, protected `/me` | `feat(auth): enforce Firebase token and role checks` |
| 3. Flutter foundation | App navigation, authenticated session, design system, API client, state management | `feat(mobile): add authenticated app shell` |
| 4. Clinical records | Appointment/encounter/message CRUD with validation and basic dashboard views | `feat(records): add appointment and encounter workflow` |
| 5. Offline core | SQLite schema, repository layer, outbox, pending-sync UI, reconnect worker | `feat(sync): queue record changes while offline` |
| 6. WebRTC baseline | Signalling server, one-to-one audio/video, TURN configuration documentation | `feat(call): enable one-to-one WebRTC consultation` |
| 7. Adaptive mode logic | Stats collector, state machine, manual override, doctor status events | `feat(network): add adaptive consultation mode switching` |
| 8. Attachments/prescriptions | Safe upload flow, prescription finalisation/amendment, offline metadata queue | `feat(clinical): add prescription and attachment workflow` |
| 9. Hardening/demo | Error states, accessibility, audit log, tests, seeded synthetic demo data, deployment guide | `test: cover offline sync and access-control scenarios` |

## 13. Test and evaluation plan

### Functional test cases

| Scenario | Expected result |
|---|---|
| Patient creates appointment with no network | Local confirmation and pending-sync indicator; request reaches server after reconnection once only. |
| Video network deteriorates | Both participants are notified; call transitions to audio without losing encounter context. |
| Audio disconnects fully | Encounter remains open; chat accepts messages locally and queues them. |
| App closes before sync | Pending data survives restart and synchronises later. |
| Duplicate push due to retry | Backend returns original result; no duplicate record/message. |
| Patient changes URL/ID to another patient record | Backend returns 403/404; no data disclosed. |
| Stale appointment update | Clear conflict response and resolution UI; no silent overwrite. |
| Doctor finalises prescription | Immutable issued version and audit event; correction creates an amendment. |

### Evaluation metrics

- **Mode-switch latency:** time from sustained bad network signal to visible/audio state transition.
- **Call continuity rate:** share of induced network degradations where an encounter continues in another mode rather than ending.
- **Sync reliability:** acknowledged operations / queued operations; count of duplicates or lost operations must be zero in controlled tests.
- **Sync recovery time:** time from restored network to outbox empty.
- **Data consistency:** conflicts detected/resolved; no unreported overwrites.
- **Usability:** task completion rate for appointment, offline message and reconnection; short SUS-style feedback survey.
- **Security checks:** unauthorised request rejection rate; confirmed absence of PII/PHI in logs.

Use Android Emulator network controls, browser DevTools throttling and physical-device tests with Wi-Fi/mobile-data toggles. Simulate latency, loss and disconnections; normal Wi-Fi-only testing cannot demonstrate the project’s main contribution.

## 14. Major risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| WebRTC fails behind NAT | A direct call may not establish even when both users have internet. | Configure and test TURN early; include relay credentials/monitoring plan. |
| Scope becomes too large | Mobile app, web dashboard, backend, sync and calls are significant together. | Build text + offline sync before video; deliver vertical slices, not separate unfinished layers. |
| Data loss in offline flow | Health record integrity is central. | Transactional local writes, persistent outbox, idempotency keys, conflict tests and backups. |
| Incorrect conflict resolution | Silent overwrite can be clinically unsafe. | Immutable clinical records and explicit version-conflict UI. |
| Privacy leak | Health data exposure damages users and project credibility. | Least privilege, encryption, test data only, log scrubbing and secret hygiene. |
| Network flapping | Constant switches frustrate users. | Rolling windows, hysteresis, cooldowns and manual override. |
| Power loss/low battery | Rural constraints can include interrupted electricity. | Persist each action immediately, minimise background work and support recovery after restart. |

## 15. Decisions to make before coding

1. **Confirmed:** the first release is a patient Flutter Android app plus a doctor React/TypeScript web dashboard. Both roles use the same backend and data model.
2. Choose exactly one attachment store: Firebase Storage or AWS S3.
3. Choose PostgreSQL as the canonical database; do not also introduce Firestore unless there is a specific requirement.
4. Confirm whether “prescription” is only a formatted academic-demo record, not a legally valid e-prescription.
5. Decide whether the project will use mock/synthetic data only. This is strongly recommended.
6. Define the minimum supported Android version and whether the first demo needs iOS/web support.

## 16. Proposed success statement

MedLink is successful as a semester project when a patient and doctor can complete a simulated consultation despite deliberately degraded connectivity; the application automatically changes from video to audio/chat/offline with a clear user explanation; locally captured clinical data survives an app restart and synchronises exactly once on reconnection; and authorisation prevents one user from viewing another patient’s data.

## 17. References

1. World Health Organization. [Global strategy on digital health 2020–2025](https://iris.who.int/bitstream/handle/10665/344249/9789240020924-eng.pdf). The WHO strategy emphasises equity, interoperability, privacy, security and contextualised digital health design.
2. World Health Organization. [Electricity in health-care facilities](https://www.who.int/news-room/fact-sheets/detail/electricity-in-health-care-facilities). Supports the design assumption that remote care environments may also have reliability constraints beyond mobile data.
3. Ministry of Electronics and Information Technology, Government of India. [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf).
4. Ayushman Bharat Digital Mission. [Health Data Management Policy](https://abdm.gov.in/static/media/health_management_policy_bac9429a79.80f74bc3e039c00acd4f.pdf). Consent, federated architecture and privacy-by-design context for an India-oriented system.
5. HL7. [FHIR overview](https://hl7.org/fhir/overview.html). Background on interoperable, resource-based health-information exchange.
6. WebRTC. [Getting started with peer connections](https://webrtc.org/getting-started/peer-connections) and [TURN server](https://webrtc.org/getting-started/turn-server). Technical background for browser/mobile real-time communication and NAT traversal.

---

### Source note from the supplied project paper

The paper’s literature table includes the following studies as context for the project’s research gap: *Reimagining India’s National Telemedicine Service to Improve Access to Care* (2024); *Improving the Effectiveness of Telemedicine in Rural Communities: Reflecting on Client and Provider Experience of eSanjeevani in Jharkhand* (2023); and *A Cross-Sectional Study on Utilization and Barriers of eSanjeevani Telemedicine Services in Rural Areas of South India* (2024). Before final report submission, verify the exact bibliographic details, DOI/URL and quoted findings from the original papers; the project paper’s table alone is not sufficient as a formal citation source.
