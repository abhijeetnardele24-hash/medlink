# Hardening and Stability (Section 3)

We have successfully addressed all previous issues:
- **1.4 Patient-side adaptive quality** is ported and surfaced in `Consultation.tsx`.
- **2.4 Notification backend & coordinator-web** are fixed.
- **Builds** for all 5 web apps and the backend API are passing cleanly. 
- **test-pharmacy.ts** has been run, and the whole-word strict reconciliation failure explicitly verified.

Moving on to **Section 3**, this plan focuses on securing the API, protecting against abuse, structuring API versioning, and improving WebRTC resilience.

## User Review Required

> [!IMPORTANT]
> - **API Versioning Strategy:** Changing to `/api/v1/...` requires updating the `VITE_API_URL` prefix or axios instances in all five frontends and mobile app. We propose applying versioning via an Express router prefix (`app.use('/v1', routes)`). Are you okay with us updating the global Axios configs across all frontends to point to `/v1`?
> - **CSP Rules:** The CSP rules will restrict where scripts/images can load from. We will whitelist our domains, Google fonts, and Firebase Auth domains. If there are any other third-party scripts (e.g., Razorpay, analytics) that should be allowed, let us know.

## Proposed Changes

### `services/api` (Backend Hardening)

#### [MODIFY] `package.json`
- Install `helmet` for security headers.
- Install `express-rate-limit` for rate limiting.

#### [MODIFY] `src/index.ts`
- Implement **Helmet** and configure a strong Content Security Policy (CSP), allowing WebRTC connections and Firebase.
- Implement **Global Rate Limiting** using `express-rate-limit` for standard API usage, with stricter limiters on auth, upload, and heavy endpoints.
- Configure **Request Size Limits** on file uploads (`express.json({ limit: '10mb' })`).
- Establish **API Versioning**: mount all existing routers under `/v1/` prefix.

### Frontend Apps (WebRTC Resilience & Versioning)

#### [MODIFY] `libs/api` (in all apps: patient, doctor, coordinator, pharmacy, landing)
- Update Axios `baseURL` configurations to point to the new `/v1` endpoint schema.

#### [MODIFY] `useWebRTC.ts` (in `doctor-web` & `patient-web`)
- Add **ICE Restart & Reconnection handling**: Monitor the `iceconnectionstatechange` event. If it drops to `disconnected` or `failed`, automatically trigger a `pc.restartIce()` and send a new offer through the signaling server to transparently re-establish the stream without user intervention.

## Verification Plan

### Automated Tests
- Run full typescript builds for all apps and the API to ensure no module resolution or strict typing errors were introduced.
- Run `test-pharmacy.ts` and `seed_medicines.ts` using the new `/v1` paths to ensure backwards compatibility is removed and the new paths are fully functional.

### Manual Verification
- Simulate a network interruption to verify WebRTC ICE restart fires automatically.
- Check headers using DevTools on API calls to verify `X-RateLimit-*` and CSP headers are present.
