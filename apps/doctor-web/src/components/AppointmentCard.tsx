import React from 'react';
import { Appointment } from '../types';
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

  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      requested: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };

    const styles = statusColors[appointment.status] || 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    
    return (
      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', textTransform: 'capitalize', border: '1px solid', backgroundColor: 'rgba(59, 130, 246, 0.1)' }} className={styles}>
        {appointment.status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', transition: 'all 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="var(--text-muted)" />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.1rem' }}>Patient ID: {appointment.patientId.substring(0, 8)}...</h4>
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> {dateString}, {timeString}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {getModeIcon()} <span style={{ textTransform: 'capitalize' }}>{appointment.preferredMode.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
        <div style={{ fontWeight: 500, marginBottom: '0.25rem', color: 'var(--primary)' }}>
          {appointment.concernCategory}
        </div>
        <p style={{ color: 'var(--text-muted)' }}>
          {appointment.patientNotes || 'No additional notes provided by the patient.'}
        </p>
      </div>

      {appointment.status === 'requested' && onAccept && onReject && (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => onReject(appointment.id, appointment.version)}
            disabled={isActionLoading}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            {isActionLoading ? 'Wait...' : <><X size={16} /> Decline</>}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => onAccept(appointment.id, appointment.version)}
            disabled={isActionLoading}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#10b981' }}
          >
            {isActionLoading ? 'Processing...' : <><Check size={16} /> Accept Appointment</>}
          </button>
        </div>
      )}
    </div>
  );
};
