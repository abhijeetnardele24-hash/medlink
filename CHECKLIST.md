# Pre-Push Build & Verification Checklist

> **CRITICAL HARD RULE**: Before opening a pull request or pushing any commit to `main`, you MUST execute and pass a full production build on `services/api` and all 5 frontend applications under `apps/`. Every target must exit with code `0` and zero TypeScript or bundling errors.

---

## The 6 Mandatory Build Targets

Run `npm run build` in each of the following directory targets and confirm zero errors before pushing:

1. **`services/api`** (Backend API & WebSocket Server)
   ```bash
   cd services/api && npm run build
   ```
2. **`apps/patient-web`** (Patient Portal & Telemedicine WebApp)
   ```bash
   cd apps/patient-web && npm run build
   ```
3. **`apps/doctor-web`** (Doctor Consultation & Clinical Portal)
   ```bash
   cd apps/doctor-web && npm run build
   ```
4. **`apps/coordinator-web`** (Staff & Verification Coordinator Portal)
   ```bash
   cd apps/coordinator-web && npm run build
   ```
5. **`apps/pharmacy-web`** (Pharmacist Seller & Inventory Portal)
   ```bash
   cd apps/pharmacy-web && npm run build
   ```
6. **`apps/landing-web`** (Marketing & Public Landing Page)
   ```bash
   cd apps/landing-web && npm run build
   ```

---

## Monorepo One-Liner Verification Command (PowerShell)

From the workspace root, verify all 6 targets sequentially:

```powershell
npm --prefix services/api run build; npm --prefix apps/patient-web run build; npm --prefix apps/doctor-web run build; npm --prefix apps/coordinator-web run build; npm --prefix apps/pharmacy-web run build; npm --prefix apps/landing-web run build
```

---

## Pre-Push Verification Protocol

- [ ] **1. Clean TypeScript Build**: All 6 targets compile with zero TS diagnostics.
- [ ] **2. Schema & Route Integrity**: No unapproved or broken endpoints mounted.
- [ ] **3. Auth & Context Conventions**: Proper middleware (`authenticate`, `requireRole`) and context objects (`res.locals.user`).
- [ ] **4. Assets & Meta Integrity**: Public assets (e.g. `og-image.png`, `favicon.svg`) exist and resolve properly.
- [ ] **5. Clean Git State**: No orphaned lockfiles (`.git/index.lock`), stale files, or untracked temporary artifacts.
