# Contributing to MedLink

Thank you for contributing to MedLink — a production-grade telehealth platform built to demonstrate secure, adaptive, offline-first telemedicine engineering.

Every contribution must protect patient privacy, preserve traceability, and move a clearly defined project outcome forward.

---

## Working Agreement

- Use synthetic/demo data **only**. Never commit real patient data, recordings, credentials, API keys, or any PII.
- Each change must be scoped to **one** issue or one independently verifiable outcome.
- Do not claim ABDM, FHIR, HIPAA, or payment compliance unless it has been formally implemented and verified.
- Preserve the `patient → doctor → coordinator` permission boundaries defined in the README.
- All code must pass the CI gate (`doctor-web`, `coordinator-web`, `services/api`) before merging.

---

## Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New user-facing feature |
| `fix/` | Bug fix or regression correction |
| `refactor/` | Code restructure, no behaviour change |
| `perf/` | Performance improvement |
| `security/` | Security patch or hardening |
| `test/` | Test additions or corrections |
| `docs/` | Documentation only |
| `ci/` | CI/CD pipeline changes |
| `chore/` | Dependency updates, tooling, non-functional |
| `build/` | Build system changes |

Examples:
```
feat/razorpay-payment-integration
fix/webrtc-quality-recovery-leg
security/recording-url-ownership-check
ci/add-monorepo-build-gate
```

---

## Commit Convention — Conventional Commits

Every commit **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short imperative summary in present tense>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | A new feature or user-facing capability |
| `fix` | A bug fix or incorrect behaviour correction |
| `refactor` | Code restructure without behaviour change |
| `perf` | Performance improvement (no feature change) |
| `security` | Security hardening, auth checks, data sanitisation |
| `test` | Adding or fixing tests |
| `docs` | Documentation only (README, ADR, comments) |
| `ci` | CI/CD workflow changes |
| `build` | Build configuration (vite, tsconfig, webpack) |
| `chore` | Dependency bumps, tooling, config not affecting code |
| `revert` | Reverts a previous commit |

### Scopes (for this monorepo)

| Scope | Package |
|-------|---------|
| `api` | `services/api` |
| `doctor-web` | `apps/doctor-web` |
| `coordinator-web` | `apps/coordinator-web` |
| `auth` | Authentication / Firebase / JWT |
| `webrtc` | Video consultation engine |
| `payments` | Razorpay integration |
| `db` | Database schema / Drizzle ORM |
| `storage` | Firebase Storage / GCS |
| `types` | Shared TypeScript interfaces |
| `ci` | GitHub Actions |
| `infra` | Infrastructure / Docker |

---

## Commit Message Examples

### Simple (one-liner)
```
feat(api): add GET /encounters endpoint scoped to requesting doctor
fix(doctor-web): correct port default from 5000 to 3000 in api.ts
security(api): add ownership check on recording-url signed URL endpoint
perf(webrtc): throttle getStats polling to 2 s interval to reduce CPU load
refactor(types): replace all `any` typings with strict domain interfaces
ci(workflows): add monorepo build gate covering all three workspaces
chore(coordinator-web): remove unused lucide-react icon imports
docs(contributing): add conventional commit standard and branch guide
```

### With body (for significant changes)
```
feat(webrtc): implement adaptive quality degradation with recovery

Implements a hysteresis-based connection quality state machine in
useWebRTC.ts. Polls RTCPeerConnection.getStats() every 2 s and tracks
packet loss, jitter, and RTT against configurable thresholds.

- Downgrades to `audio-only` by disabling local video tracks when
  qualityScore reaches 0 after sustained poor metrics
- Recovers to `good` by re-enabling video tracks when qualityScore
  climbs back above the recovery threshold
- Exposes `connectionQuality: 'good' | 'poor' | 'audio-only'` to
  Consultation.tsx for real-time UI feedback

Why this matters: rural clinics in India frequently experience bandwidth
drops mid-call. This prevents the consultation from failing silently.

Closes #42
```

```
security(api): enforce ownership on GET /encounters/:id/recording-url

Any authenticated user could previously obtain a signed GCS URL for
any encounter recording by ID. This patch adds an inner join against
the appointments table and throws ForbiddenError if the requesting
user is neither the assigned doctor nor the patient on the appointment.

- Adds JOIN: encounters → appointments to resolve doctorId + patientId
- Adds guard: userId !== doctorId && userId !== patientId → 403
- Signed URL expiry unchanged at 15 minutes (v4)

Security classification: Broken Object-Level Authorization (BOLA/IDOR)
```

```
fix(coordinator-web): resolve 11 TypeScript build errors across 6 files

tsc -b was failing with TS6133 (unused imports) and TS18047 (null
safety) errors introduced during the type-safety audit pass.

Changes:
- Dashboard.tsx: remove unused FileText, navigate
- DoctorsDirectory.tsx: remove UserCheck, MoreVertical; add `?? ''`
  null guard on d.speciality
- Settings.tsx: remove Bell, Database
- Signup.tsx: remove unused api import and userCredential variable
- Tasks.tsx: remove ClipboardList

Build: coordinator-web ✓ 2064 modules transformed, 0 errors
```

---

## Commit Body Format (for complex changes)

```
<type>(<scope>): <summary>

Why:
<problem statement or business/technical motivation>

What changed:
- <specific change 1>
- <specific change 2>
- <specific change 3>

Validation:
- <how this was verified: build output, manual test, etc.>

Breaking changes: <none | describe if any>
Closes #<issue-number>
```

---

## Pull Request Quality

A PR must contain **one coherent** feature, fix, or improvement. Include:

- Linked issue number
- Summary of what changed and **why**
- Build evidence (`npm run build` output or CI link)
- Privacy/security impact assessment
- Follow-up issues if scope was deferred

Keep generated files, dependency lock changes, and unrelated formatting out of feature PRs.

---

## Daily Development Workflow

1. Create or select a GitHub Issue with a clear acceptance criterion.
2. Branch from `main` using the naming convention above.
3. Make small, atomic commits as work progresses — each commit should be independently comprehensible.
4. Run `npm run build` locally in the affected workspace before pushing.
5. Push — CI gate runs automatically across all three workspaces.
6. Open a PR to `main`, link the issue, and merge only when CI is green.
7. Update `README.md` / `PROJECT_RESEARCH_AND_ANALYSIS.md` whenever architecture, data handling, or scope changes.

---

## Monorepo Structure

```
apps/
  doctor-web/         React 19 + Vite — Doctor dashboard & video consultation
  coordinator-web/    React 19 + Vite — Coordinator verification portal
services/
  api/                Node.js + Express + Drizzle ORM + PostgreSQL backend
infra/                Docker, deployment, environment configs
docs/                 Architecture decision records, research notes
.github/
  workflows/          CI/CD — build gates for all three workspaces
```

---

## CI / Green Tick Requirements

The following checks must pass on every push to `main`:

| Check | Command |
|-------|---------|
| TypeScript (doctor-web) | `tsc -b --noEmit` |
| Build (doctor-web) | `npm run build` |
| TypeScript (coordinator-web) | `tsc -b --noEmit` |
| Build (coordinator-web) | `npm run build` |
| TypeScript (api) | `npm run typecheck` |
| Build (api) | `npm run build` |

A red CI job means the branch is **not mergeable**. Fix the errors, push again.
