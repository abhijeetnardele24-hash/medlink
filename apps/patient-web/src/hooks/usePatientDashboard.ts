import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Doctor {
  id: string;
  fullName: string;
  speciality: string;
  facilityName: string | null;
  languagesSpoken: string[];
  bio: string | null;
}

export interface OpenSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  supportedModes: string[];
  status: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  consultationFee?: number;
  facilityName?: string | null;
}

export interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  concernCategory: string;
  doctor?: { fullName: string; speciality: string };
}

export const usePatientDashboard = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [docRes, apptRes, slotRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/appointments'),
          api.get('/doctors/open-slots').catch(() => ({ data: { data: [] } }))
        ]);
        
        if (isMounted) {
          setDoctors(docRes.data.data || []);
          setAppointments(apptRes.data.data || []);
          setOpenSlots(slotRes.data.data || []);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch data', err);
        if (isMounted) {
          setError('Failed to load dashboard data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    doctors,
    appointments,
    openSlots,
    loading,
    error,
  };
};
