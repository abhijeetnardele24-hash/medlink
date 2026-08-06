# Routes

## Coordinator Web

Framework: React with Vite.

Current route handling: no router installed. The root route `/` renders `apps/coordinator-web/src/App.tsx`.

Planned page for this task:

- `/`: coordinator operations dashboard for verification, doctor matching, appointment queue, call reminders, and network-aware consultation monitoring.

## Doctor Web

Framework: React with Vite and React Router.

Router config: `apps/doctor-web/src/App.tsx`.

- `/login`: `apps/doctor-web/src/pages/Login.tsx`
- `/`: `apps/doctor-web/src/pages/Dashboard.tsx`, protected
- `/availability`: `apps/doctor-web/src/pages/Availability.tsx`, protected
- `/consultation/:id`: `apps/doctor-web/src/pages/Consultation.tsx`, protected
