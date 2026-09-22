# MedLink

> **An adaptive, offline-first telemedicine and clinical intelligence platform for reliable consultations in low-connectivity environments.**

MedLink connects patients directly with verified medical practitioners through a resilient architecture. Designed around a foundational principle: network instability or total connection loss must never disrupt clinical care continuity or compromise patient consultation data.

The platform governs the entire digital health encounter lifecycle: verified practitioner discovery, explainable specialty routing, appointment scheduling, WebRTC video/audio consultation with local composite recording, real-time clinical decision support (CDSS), ambient clinical note documentation, offline-first data capture, secure outbox synchronization, e-prescriptions, and operational follow-up.

---

## Repository Workspace Structure

```text
medlink/
├── apps/
│   ├── patient-web/         React + TypeScript + PWA Patient Telehealth Portal
│   ├── doctor-web/          React + TypeScript Clinical Workspace & Tele-Clinic
│   └── landing-web/         React + TypeScript Public Landing & Architecture Gateway
├── services/
│   └── api/                 Node.js + Express 5 + TypeScript Backend Service
├── infra/                   Docker, TURN, and infrastructure deployment files
└── docs/                    Architecture decision records (ADRs) & system specifications
```

---

## 1. Product Architecture

MedLink operates as a focused doctor-patient distributed system. Both portals interface with a centralized, canonical PostgreSQL data store, common authorization model, and real-time encounter lifecycle. All media (voice/images) is encoded as Base64 strings directly into PostgreSQL to guarantee atomic data consistency during offline synchronization without relying on complex external cloud storage buckets.

```mermaid
flowchart TB
    subgraph Clients["Client Application Layer"]
        PA["Patient Web Portal<br/>(React / PWA)<br/>Offline Cache & Sync Outbox"]
        DW["Doctor Web Dashboard<br/>(React + TypeScript)<br/>Clinical Workspace & Tele-Clinic"]
    end

    subgraph CoreServices["Application & Services Boundary"]
        API["MedLink Core API<br/>(Node.js + Express 5 + TypeScript)<br/>REST API & Schema Validation"]
        WSS["Realtime Signalling & Event Bus<br/>(Socket.IO)<br/>WebRTC Signalling & State Sync"]
        CDSS["Clinical Intelligence Engine<br/>Ambient Documentation & Safety CDSS"]
    end

    subgraph Infrastructure["Data & Communication Infrastructure"]
        AUTH["Identity Provider<br/>(Firebase Auth OIDC / JWT Verification)"]
        DB[("PostgreSQL Primary Database<br/>Canonical Data Store (Neon)")]
        RTC["WebRTC Media Plane<br/>STUN / TURN Relays"]
    end

    PA -->|HTTPS REST, WSS| API
    DW -->|HTTPS REST, WSS| API

    API <--> WSS
    API --> CDSS
    API --> AUTH
    API --> DB

    PA <-->|Encrypted Real-Time Audio/Video/Data| RTC
    DW <-->|Encrypted Real-Time Audio/Video/Data| RTC
    WSS <-->|Signalling Negotiation| RTC
```

### Application Technical Responsibilities

| Application / Service | Technical Responsibility |
|---|---|
| **Patient Web Portal** | Responsive appointment booking, local offline outbox, diagnostic lab report visualization, real-time triage, WebRTC video/audio/chat controls, and prescription history. |
| **Doctor Web Dashboard** | Operational appointment queue, availability slot management, authorized EHR review, WebRTC consultation room with composite recording and whiteboard, ambient clinical note drafting, CDSS safety-checked e-prescriptions. |
| **Core API Service** | Token verification, role-based access control (RBAC), consent enforcement, request validation, transaction-safe booking, offline sync processing, WebRTC signaling, and audit logging. |
| **PostgreSQL Canonical Store** | Single source of truth for users, credentials, appointments, encounters, records, Base64 media attachments, verification decisions, and audit metadata. |
| **WebRTC Media Plane** | Low-latency audio/video media transport, STUN/TURN NAT traversal, screen share streams, and collaborative data channels. |

---

## 2. Adaptive Consultation & Network Degradation Engine

The consultation engine continuously monitors connection reachability, WebRTC round-trip time (RTT), packet loss, jitter, and bandwidth availability. The system dynamically negotiates communication modes to maintain consultation continuity without loss of encounter context.

```mermaid
stateDiagram-v2
    [*] --> PreCall : Device Setup & ICE Negotiation
    
    PreCall --> VideoConsultation : High Bandwidth (< 150ms RTT, < 2% Loss)
    
    state VideoConsultation {
        [*] --> HD_Video : Stable Connection
        HD_Video --> LowRes_Video : Minor Packet Loss
    }
    
    VideoConsultation --> AudioConsultation : Sustained Jitter / Packet Loss > 5%
    AudioConsultation --> VideoConsultation : Stable Network Restored (User Confirmed)
    
    AudioConsultation --> AsyncChat : Severe Packet Loss > 15% / Media Dropped
    AsyncChat --> AudioConsultation : Reachability Restored
    
    AsyncChat --> OfflineCapture : Total Reachability Loss
    OfflineCapture --> AsyncChat : Connectivity Re-established (Outbox Flushed)
```

### Network Adaptation Policy Matrix

| Transition | Trigger Condition | System Behavior |
|---|---|---|
| **Video → Audio** | Sustained packet loss > 5%, RTT > 300ms, or video bitrate failure | Drops video tracks, renegotiates audio-only profile, and notifies both participants with a plain-language banner. |
| **Audio → Async Chat** | Media connection timeout or recurring disconnects | Preserves encounter context, transitions UI to encrypted real-time chat, and supports text/image exchange. |
| **Chat → Offline** | Total reachability failure after exponential backoff retries | Stores messages, appointments, and prescriptions in local encrypted IndexedDB/SQLite outbox with pending-sync status. |
| **Offline → Online** | Network reachability detected | Authenticates connection, replays outbox queue with idempotency keys, and resolves conflicts on the server. |
| **Audio → Video** | Sustained network stability for > 15 seconds | Displays non-intrusive prompt allowing participants to restore video stream without sudden bandwidth spikes. |

---

## 3. Clinical Encounter, Ambient Documentation & CDSS Lifecycle

MedLink separates raw consultation dialogue, clinical notes, decision support checks, and issued prescriptions into discrete, audited phases.

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    actor Doctor
    participant DW as Doctor Workspace
    participant API as Core API
    participant CDSS as Safety & Scribe Engine
    participant DB as PostgreSQL Store

    Patient->>Doctor: Live WebRTC Telehealth Consultation
    Doctor->>DW: Enable Ambient Clinical Scribe
    DW->>CDSS: Stream Consultation Audio / Dialogue
    CDSS-->>DW: Structured SOAP Notes (Subjective, Objective, Assessment, Plan) + ICD-10 Codes
    Doctor->>DW: Review & Refine SOAP Notes
    Doctor->>DW: Add Medications to Prescription Pad
    DW->>CDSS: Evaluate Drug-Drug Interactions & Allergy Conflicts
    CDSS-->>DW: Real-Time CDSS Safety Status (Safe / Caution / Contraindication Alert)
    Doctor->>DW: Sign & Finalize Prescription
    DW->>API: Submit Encrypted Clinical Encounter Summary & Rx
    API->>DB: Persist Immutable Encounter Record & Audit Trail
    API-->>Patient: Deliver Authorized Clinical Summary & Downloadable PDF Prescription
```

---

## 4. Offline-First Synchronization Protocol

The client employs a local-first write pattern using a `SyncManager`. Data mutations (like creating prescriptions or booking offline appointments) are committed locally inside an IndexedDB/SQLite outbox before network dispatch is attempted.

```mermaid
flowchart TD
    A[User Action / Record Creation] --> B[Local Input Validation]
    B --> C[Write to Local Encrypted Database]
    C --> D[Append to Persistent Sync Outbox Queue<br/>UUID Idempotency Key]
    D --> E[Immediate UI Update: 'Offline: Queued for Sync']
    E --> F{Network Online?}
    F -- No --> G[Wait for Connectivity Broadcast]
    G --> F
    F -- Yes --> H[Dispatch Authenticated Batch Sync Request]
    H --> I{Server Validation & Idempotency Check}
    I -- Conflict Detected --> J[Return Conflict Status]
    I -- Success --> K[Database Transaction Committed]
    K --> L[Server Acknowledges Operation UUIDs]
    L --> M[Client Purges Outbox Queue]
```

---

## 5. Access Control & Domain Boundaries

MedLink strictly separates clinical care visibility. Every API request is verified at the controller level; interface visibility is never used as an authorization boundary.

| Domain Entity | Patient | Assigned Doctor | Privacy & Governance Rule |
|---|---|---|---|
| **Appointment Operations** | View / Request | View / Manage | Patients book slots, doctors manage their queues. |
| **Draft Clinical Notes** | No Access | Create / Edit (Pre-final) | Doctor working document; never exposed before finalization. |
| **Final Clinical Summary** | View / Download | Author / View | Immutable once finalized; corrections require an explicit amendment. |
| **Prescription Records** | View / Download | Author / Amend | Generated based on strict CDSS evaluations. |
| **Diagnostic Lab Reports** | View / Upload | View (With Consent) | Access is time- and encounter-scoped under patient consent. |
| **Audit Logs** | No Access | No Access | Append-only audit events capturing actor ID, timestamp, and IP hash. |

---

## 6. DevSecOps, Continuous Delivery & Observability

```mermaid
flowchart LR
    DEV[Developer Workstation] -->|Git Push| GH[GitHub Repository]
    GH -->|Trigger Webhook| CI[CI Pipeline<br/>Lint, Typecheck, Test Suite]
    CI -->|Quality Gate Passed| BUILD[Build Artifacts<br/>Vite Production Bundles]
```

### Security & Release Governance Standards
- **Zero Raw Credentials**: No storage of raw card numbers, CVVs, banking credentials, or payment secrets.
- **DTLS-SRTP Encryption**: Direct peer-to-peer encryption for audio, video, and data channels.
- **Base64 Media Encapsulation**: Files are stored securely inside Postgres rather than public-facing object buckets.
- **Immutable Clinical Audit**: All prescription authorizations and diagnostic record views generate auditable event records.
- **Automated Verification**: Release pipelines enforce static type safety, route schema validation, and test suite execution prior to deployment.
