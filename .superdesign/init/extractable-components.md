# Extractable Components

## AppointmentCard

- Source: `apps/doctor-web/src/components/AppointmentCard.tsx`
- Category: basic
- Description: Appointment card with patient identifier, time, preferred consultation mode, status, and accept/reject actions.
- Extractable props: appointment, loadingId
- Hardcoded: lucide icon names, status labels, inline CSS using global tokens

## ProtectedRoute

- Source: `apps/doctor-web/src/components/ProtectedRoute.tsx`
- Category: layout
- Description: Authenticated route guard with loading spinner and redirect.
- Extractable props: none
- Hardcoded: `/login` redirect path
