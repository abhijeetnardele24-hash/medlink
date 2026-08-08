export interface Patient {
  id: string;
  userId: string;
  preferredLanguage: string;
  ageGroup: string | null;
  genderSelfDescribed: string | null;
  locationDistrict: string | null;
  consentTeleconsultation: boolean;
  consentGrantedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Included from joins sometimes
  email?: string;
  fullName?: string;
  lastSeen?: string;
  concern?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  contactNumber: string | null;
  speciality: string | null;
  registrationNumber: string | null;
  educationBackground: string | null;
  experienceYears: number | null;
  isPartTime: boolean | null;
  facilityName: string | null;
  languagesSpoken: string[];
  supportedModes: ('video' | 'audio' | 'async_chat' | 'offline')[];
  consultationFee: number;
  verificationStatus: 'draft' | 'pending_verification' | 'needs_correction' | 'verified' | 'rejected' | 'suspended';
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string | null;
  scheduledAt: string;
  status: 'draft' | 'queued_offline' | 'requested' | 'pending_doctor' | 'confirmed' | 'in_progress' | 'completed' | 'rescheduled' | 'rejected' | 'cancelled' | 'missed' | 'follow_up_needed';
  concernCategory: string;
  preferredMode: 'video' | 'audio' | 'async_chat' | 'offline' | null;
  patientNotes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations when joined
  patient?: Patient;
  doctor?: Doctor;
}

export interface Encounter {
  id: string;
  appointmentId: string;
  currentMode: 'video' | 'audio' | 'async_chat' | 'offline';
  status: 'waiting' | 'active' | 'ended' | 'abandoned';
  networkEventSummary: any | null;
  startedAt: string | null;
  endedAt: string | null;
  prescriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  encounterId: string;
  doctorId: string;
  medicinesJson: any; // Ideally an array of medicine objects
  instructionsText: string | null;
  status: 'draft' | 'issued' | 'amended' | 'revoked';
  issuedAt: string | null;
  version: number;
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
}
