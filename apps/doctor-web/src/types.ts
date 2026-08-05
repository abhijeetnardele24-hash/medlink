export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string | null;
  scheduledAt: string;
  status: 'requested' | 'pending_doctor' | 'confirmed' | 'in_progress' | 'completed' | 'rescheduled' | 'rejected' | 'cancelled' | 'missed';
  concernCategory: string;
  preferredMode: 'video' | 'audio' | 'async_chat' | 'offline';
  patientNotes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
