import { Link } from 'react-router-dom';
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
      case 'video': return <Video size={16} aria-label="Video consultation" />;
      case 'audio': return <Phone size={16} aria-label="Audio consultation" />;
      case 'async_chat': return <MessageSquare size={16} aria-label="Chat consultation" />;
      case 'offline': return <WifiOff size={16} aria-label="Offline consultation" />;
      default: return <Video size={16} aria-label="Video consultation" />;
    }
  };

  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      requested: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      confirmed: 'bg-green-500/20 text-green-500 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    };

    const styles = statusColors[appointment.status] || 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    
    return (
      <span className={`text-xs px-2 py-1 rounded-xl capitalize border ${styles}`}>
        {appointment.status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            <User size={24} className="text-gray-400" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-0.5">Patient ID: {appointment.patientId.substring(0, 8)}...</h4>
            <div className="flex gap-3 text-gray-500 text-sm">
              <span className="flex items-center gap-1">
                <Clock size={14} /> {dateString}, {timeString}
              </span>
              <span className="flex items-center gap-1">
                {getModeIcon()} <span className="capitalize">{appointment.preferredMode?.replace('_', ' ') ?? 'N/A'}</span>
              </span>
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="bg-gray-50 p-4 rounded-xl mb-4 text-sm border border-gray-100">
        <div className="font-semibold mb-1 text-teal-600">
          {appointment.concernCategory}
        </div>
        <p className="text-gray-600">
          {appointment.patientNotes || 'No additional notes provided by the patient.'}
        </p>
      </div>

      {appointment.status === 'requested' && onAccept && onReject && (
        <div className="flex gap-3 justify-end">
          <button 
            className="px-4 py-2 text-sm font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            onClick={() => onReject(appointment.id, appointment.version)}
            disabled={isActionLoading}
            aria-label="Decline Appointment"
          >
            {isActionLoading ? 'Wait...' : <><X size={16} /> Decline</>}
          </button>
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            onClick={() => onAccept(appointment.id, appointment.version)}
            disabled={isActionLoading}
            aria-label="Accept Appointment"
          >
            {isActionLoading ? 'Processing...' : <><Check size={16} /> Accept Appointment</>}
          </button>
        </div>
      )}

      {appointment.status === 'confirmed' && (
        <div className="flex justify-end mt-4">
          <Link 
            to={`/consultation/${appointment.id}`}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 no-underline"
            aria-label="Start Consultation"
          >
            <Video size={16} /> Start Consultation
          </Link>
        </div>
      )}
    </div>
  );
};
