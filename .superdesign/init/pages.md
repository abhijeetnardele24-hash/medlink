# Pages

## Coordinator Web Root

Entry: `apps/coordinator-web/src/App.tsx`

Dependencies:

- `apps/coordinator-web/src/App.css`
- `apps/coordinator-web/src/index.css`

Current state: Vite starter page. It will be replaced by an operational coordinator dashboard.

## Doctor Web Login

Entry: `apps/doctor-web/src/pages/Login.tsx`

Dependencies:

- `apps/doctor-web/src/lib/firebase.ts`
- `apps/doctor-web/src/index.css`

## Doctor Web Dashboard

Entry: `apps/doctor-web/src/pages/Dashboard.tsx`

Dependencies:

- `apps/doctor-web/src/contexts/AuthContext.tsx`
- `apps/doctor-web/src/lib/api.ts`
- `apps/doctor-web/src/types.ts`
- `apps/doctor-web/src/components/AppointmentCard.tsx`
- `apps/doctor-web/src/index.css`
