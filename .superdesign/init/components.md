# Components

## Coordinator Web

No shared UI primitive components exist yet in `apps/coordinator-web`. The current app is a single Vite starter page implemented in `apps/coordinator-web/src/App.tsx` with global CSS in `apps/coordinator-web/src/index.css` and page CSS in `apps/coordinator-web/src/App.css`.

## Doctor Web Shared Components

### `apps/doctor-web/src/components/AppointmentCard.tsx`

Reusable appointment summary card used by the doctor dashboard.

```tsx
import type { Appointment } from '../types';
import { Video, Phone, MessageSquare, WifiOff, Clock, User, Check, X } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onAccept?: (id: string, version: number) => void;
  onReject?: (id: string, version: number) => void;
  loadingId?: string | null;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onReject,
  loadingId
}) => {
  const isActionLoading = loadingId === appointment.id;
  const date = new Date(appointment.scheduledAt);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const getModeIcon = () => {
    switch (appointment.preferredMode) {
      case 'video': return <Video size={16} />;
      case 'audio': return <Phone size={16} />;
      case 'async_chat': return <MessageSquare size={16} />;
      case 'offline': return <WifiOff size={16} />;
      default: return <Video size={16} />;
    }
  };

  return <div className="glass-panel">Appointment card UI</div>;
};
```

### `apps/doctor-web/src/components/ProtectedRoute.tsx`

Authentication guard that redirects anonymous users to `/login`.

```tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```
