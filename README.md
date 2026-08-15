# MedLink

> **An adaptive, offline-first enterprise telemedicine and clinical intelligence platform for reliable consultations in low-connectivity and rural environments.**

MedLink connects patients with verified medical practitioners through a resilient, multi-portal architecture. Designed around a foundational principle: network instability or total connection loss must never disrupt clinical care continuity or compromise patient consultation data.

The platform governs the entire digital health encounter lifecycle: verified practitioner discovery, explainable specialty routing, appointment scheduling, WebRTC video/audio consultation with local composite recording, real-time clinical decision support (CDSS), ambient clinical note documentation, offline-first data capture, secure outbox synchronization, e-prescriptions, and operational follow-up.

---

<div align="center">
  <img src="docs/assets/architecture_live.svg" alt="MedLink Live Distributed Architecture & Media Topology" width="100%" />
</div>

---

## Repository Workspace Structure

```text
medlink/
├── apps/
│   ├── patient-web/         React + TypeScript + PWA Patient Telehealth Portal
│   ├── doctor-web/          React + TypeScript Clinical Workspace & Tele-Clinic
│   ├── coordinator-web/     React + TypeScript Verification & Administration Console
│   ├── pharmacy-web/        React + TypeScript Pharmacy & Medicine Marketplace
│   └── landing-web/         React + TypeScript Public Landing & Architecture Gateway
├── services/
│   └── api/                 Node.js + Express 5 + TypeScript Backend Service
├── infra/                   Docker, TURN, and infrastructure deployment files
└── docs/                    Architecture decision records (ADRs) & system specifications
```

---

## 1. Product Architecture

MedLink operates as a unified, multi-application distributed system. Every portal interfaces with a centralized, canonical PostgreSQL data store, common authorization model, and real-time encounter lifecycle.

```mermaid
flowchart TB
    subgraph Clients["Client Application Layer"]
        PA["Patient Web Portal<br/>(React / PWA)<br/>Offline Cache & Sync Outbox"]
        DW["Doctor Web Dashboard<br/>(React + TypeScript)<br/>Clinical Workspace & Tele-Clinic"]
        CW["Coordinator Console<br/>(React + TypeScript)<br/>Verification & Scheduling Operations"]
        PW["Pharmacy Portal<br/>(React + TypeScript)<br/>Medicine Marketplace & Orders"]
    end

    subgraph CoreServices["Application & Services Boundary"]
        API["MedLink Core API<br/>(Node.js + Express 5 + TypeScript)<br/>REST API & Schema Validation"]
        WSS["Realtime Signalling & Event Bus<br/>(Socket.IO)<br/>WebRTC Signalling & State Sync"]
        CDSS["Clinical Intelligence Engine<br/>Ambient Documentation & Safety CDSS"]
    end

    subgraph Infrastructure["Data & Communication Infrastructure"]
        AUTH["Identity Provider<br/>(Firebase Auth OIDC / JWT Verification)"]
        DB[("PostgreSQL Primary Database<br/>Canonical Data Store (Neon)")]
        STORE[("Protected Object Storage<br/>Encrypted Attachments & Reports")]
        RTC["WebRTC Media Plane<br/>STUN / TURN Relays"]
    end

    PA -->|HTTPS REST, WSS| API
    DW -->|HTTPS REST, WSS| API
    CW -->|HTTPS REST, WSS| API
    PW -->|HTTPS REST, WSS| API

    API <--> WSS
    API --> CDSS
    API --> AUTH
    API --> DB
    API --> STORE

    PA <-->|Encrypted Real-Time Audio/Video/Data| RTC
    DW <-->|Encrypted Real-Time Audio/Video/Data| RTC
    WSS <-->|Signalling Negotiation| RTC
```

### Application Technical Responsibilities

| Application / Service | Technical Responsibility |
|---|---|
| **Patient Web Portal** | Responsive appointment booking, local offline outbox, diagnostic lab report visualization, real-time triage, WebRTC video/audio/chat controls, prescription history, and pharmacy ordering. |
| **Doctor Web Dashboard** | Operational appointment queue, availability slot management, authorized EHR review, WebRTC consultation room with composite recording and whiteboard, ambient clinical note drafting, CDSS safety-checked e-prescriptions. |
| **Coordinator Console** | Doctor and pharmacist profile verification, availability administration, appointment operations, reminder task queue, booking exceptions, and audit visibility. |
| **Pharmacy Web Portal** | Pharmacist onboarding, inventory catalog management, prescription-based dispensing, and order fulfillment tracking. |
| **Core API Service** | Token verification, role-based access control (RBAC), consent enforcement, request validation, transaction-safe booking, sync processing, WebRTC signaling, and audit logging. |
| **PostgreSQL Canonical Store** | Single source of truth for users, credentials, appointments, encounters, records, tasks, verification decisions, and audit metadata. |
| **WebRTC Media Plane** | Low-latency audio/video media transport, STUN/TURN NAT traversal, screen share streams, and collaborative data channels. |

---

## 2. Technical Reference Production Architecture

The diagram below represents the production-target deployment topology incorporating network zones, edge security, private application runtimes, and isolated data tiers.

```mermaid
flowchart TB
    subgraph ClientLayer["Client Layer"]
        PA["Patient App"]
        DW["Doctor Dashboard"]
        CW["Coordinator Console"]
        PW["Pharmacy Portal"]
    end

    subgraph EdgeBoundary["Public Edge & Trust Boundary"]
        DNS["DNS & TLS Termination"]
        WAF["WAF & Rate Limiting"]
        CDN["Static Asset CDN"]
        GW["API Gateway & Reverse Proxy<br/>(HTTPS + WSS Termination)"]
    end

    subgraph SecurityBoundary["Identity & Access Boundary"]
        IDP["Identity Provider<br/>(OIDC / Firebase Auth)"]
        RBAC["Authorisation Engine<br/>(RBAC + Ownership + Consent Scope)"]
        VAULT["Secrets Management<br/>(TURN Credentials, Database Keys)"]
    end

    subgraph PrivateRuntime["Private Application Network"]
        API["Core API Service<br/>(Node.js / Express 5)"]
        SIG["Signalling Service<br/>(Socket.IO Engine)"]
        SYNC["Sync Worker<br/>(Idempotency & Outbox Reconciliation)"]
        CDSS_SRV["Clinical Decision Support Engine<br/>(DDI & Allergy Analysis)"]
        SCHED["Scheduler & Reminder Worker"]
    end

    subgraph DataBoundary["Private Data Boundary"]
        PG[("PostgreSQL Primary Store<br/>(Encrypted at Rest)")]
        REPLICA[("PostgreSQL Read Replica")]
        REDIS[("Redis Cache<br/>(Presence, Rate Limits, State)")]
        STORE[("Encrypted Object Storage<br/>(Clinical Attachments & Reports)")]
    end

    subgraph MediaPlane["Real-Time Media Plane"]
        STUN["STUN Service"]
        TURN["TURN Relay Server<br/>(coturn)"]
    end

    ClientLayer --> DNS --> WAF --> GW
    CDN -.-> ClientLayer
    GW --> API
    GW --> SIG

    ClientLayer -->|OIDC Token Request| IDP
    API -->|Verify ID Token| IDP
    API --> RBAC
    API --> VAULT
    SIG --> VAULT

    API --> PG
    API --> REDIS
    API --> STORE
    SIG --> REDIS
    SYNC --> PG
    CDSS_SRV --> PG
    SCHED --> PG

    PG -. Replication .-> REPLICA

    PA <-->|Direct P2P Media| STUN
    DW <-->|Direct P2P Media| STUN
    PA <-->|Relayed Media When NAT Blocked| TURN
    DW <-->|Relayed Media When NAT Blocked| TURN
    SIG -->|SDP Offers, Answers, ICE Candidates| PA
    SIG -->|SDP Offers, Answers, ICE Candidates| DW
```

---

## 3. Adaptive Consultation & Network Degradation Engine

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
| **Chat → Offline** | Total reachability failure after exponential backoff retries | Stores messages and clinical notes in local encrypted SQLite outbox with pending-sync status. |
| **Offline → Online** | Network reachability detected | Authenticates connection, replays outbox queue with idempotency keys, and pulls server updates. |
| **Audio → Video** | Sustained network stability for > 15 seconds | Displays non-intrusive prompt allowing participants to restore video stream without sudden bandwidth spikes. |

---

## 4. Clinical Encounter, Ambient Documentation & CDSS Lifecycle

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

## 5. Offline-First Synchronization Protocol

The patient client employs a local-first write pattern. Data mutations are committed locally inside an encrypted store before network dispatch is attempted.

```mermaid
flowchart TD
    A[User Action / Record Creation] --> B[Local Input Validation]
    B --> C[Write to Local Encrypted SQLite Database]
    C --> D[Append to Persistent Sync Outbox Queue<br/>UUID Idempotency Key + Version Timestamp]
    D --> E[Immediate UI Update: 'Saved Locally / Pending Sync']
    E --> F{Network Online?}
    F -- No --> G[Wait for Connectivity Broadcast]
    G --> F
    F -- Yes --> H[Dispatch Authenticated Batch Sync Request]
    H --> I{Server Validation & Idempotency Check}
    I -- Conflict Detected --> J[Apply Deterministic Version / Amendment Rule]
    I -- Success --> K[Database Transaction Committed]
    K --> L[Server Acknowledges Operation UUIDs]
    L --> M[Client Purges Outbox Queue & Updates Sync Cursor]
```

---

## 6. Access Control & Domain Boundaries

MedLink strictly separates clinical care, platform operations, and pharmacy distribution. Every API request is verified at the controller level; interface visibility is never used as an authorization boundary.

| Domain Entity | Patient | Assigned Doctor | Clinic Coordinator | Pharmacist | Privacy & Governance Rule |
|---|---|---|---|---|---|
| **Appointment Operations** | View / Request | View / Manage | View / Manage | No Access | Coordinator views operational metadata only. |
| **Draft Clinical Notes** | No Access | Create / Edit (Pre-final) | No Access | No Access | Doctor working document; never exposed before finalization. |
| **Final Clinical Summary** | View / Download | Author / View | No Access | No Access | Immutable once finalized; corrections require an explicit amendment. |
| **Prescription Records** | View / Download | Author / Amend | No Access | View (If Assigned) | Pharmacist accesses only prescriptions directed to their dispensing queue. |
| **Diagnostic Lab Reports** | View / Upload | View (With Consent) | No Access | No Access | Access is time- and encounter-scoped under patient consent. |
| **Audit Logs** | No Access | No Access | View Operational Logs | No Access | Append-only audit events capturing actor ID, timestamp, and IP hash. |

---

## 7. DevSecOps, Continuous Delivery & Observability

```mermaid
flowchart LR
    DEV[Developer Workstation] -->|Git Push| GH[GitHub Repository]
    GH -->|Trigger Webhook| CI[CI Pipeline<br/>Lint, Typecheck, Test Suite]
    CI -->|Quality Gate Passed| BUILD[Build Artifacts<br/>Vite Production Bundles + Docker Images]
    BUILD --> REG[Container & Package Registry]
    REG --> CD[Deployment Pipeline<br/>Staging → Verification → Production]
    CD --> RUNTIME[Production Runtime Network]
    RUNTIME --> OBS[Observability Stack<br/>Pino Structured Logging + Metrics]
    OBS --> AUDIT[Security Audit & Compliance Review]
```

### Security & Release Governance Standards
- **Zero Raw Credentials**: No storage of raw card numbers, CVVs, banking credentials, or payment secrets.
- **DTLS-SRTP Encryption**: Direct peer-to-peer encryption for audio, video, and data channels.
- **Immutable Clinical Audit**: All prescription authorizations, doctor verifications, and diagnostic record views generate auditable event records.
- **Automated Verification**: Release pipelines enforce static type safety, route schema validation, and test suite execution prior to deployment.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
