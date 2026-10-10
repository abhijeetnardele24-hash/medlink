import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { syncDb } from '../lib/sync/SyncDB';
import { useLiveQuery } from 'dexie-react-hooks';

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
  endsAt?: string;
  status: string;
  concernCategory: string;
  doctor?: { fullName: string; speciality: string };
  syncStatus?: 'synced' | 'pending_push' | 'failed_conflict';
}

export const usePatientDashboard = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [serverAppointments, setServerAppointments] = useState<Appointment[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Subscribe to local outbox for pending appointments
  const pendingOutbox = useLiveQuery(
    () => syncDb.outbox.where({ entityType: 'appointment' }).toArray(),
    []
  );

  useEffect(() => {
    let isMounted = true;
    
    const interval = setInterval(() => {
      if (isMounted) setNow(new Date());
    }, 10000);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        if (navigator.onLine) {
          const [docRes, apptRes, slotRes] = await Promise.all([
            api.get('/doctors').catch(() => ({ data: { data: [] } })),
            api.get('/appointments').catch(() => ({ data: { data: [] } })),
            api.get('/doctors/open-slots').catch(() => ({ data: { data: [] } }))
          ]);
          
          if (isMounted) {
            setDoctors(docRes.data?.data || []);
            setOpenSlots(slotRes.data?.data || []);
            
            const fetchedAppts = apptRes.data?.data || [];
            setServerAppointments(fetchedAppts);

            // Cache to IndexedDB
            const cachePayloads = fetchedAppts.map((a: any) => ({
              id: a.id,
              scheduledAt: a.scheduledAt,
              endsAt: a.endsAt,
              status: a.status,
              concernCategory: a.concernCategory,
              doctor: a.doctor,
              syncStatus: 'synced'
            }));
            await syncDb.appointments_cache.clear();
            await syncDb.appointments_cache.bulkPut(cachePayloads);

            const fetchedDoctors = docRes.data?.data || [];
            await syncDb.doctors_cache.clear();
            await syncDb.doctors_cache.bulkPut(fetchedDoctors);
          }
        } else {
          // Offline mode: load from cache
          if (isMounted) {
            const cachedAppts = await syncDb.appointments_cache.toArray();
            setServerAppointments(cachedAppts);

            const cachedDoctors = await syncDb.doctors_cache.toArray();
            setDoctors(cachedDoctors);
            // Can't cache open slots dynamically easily, so leave empty offline for now or assume offline booking handles it differently
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch data', err);
        // Fallback to cache
        if (isMounted) {
          const cachedAppts = await syncDb.appointments_cache.toArray();
          setServerAppointments(cachedAppts);
          const cachedDoctors = await syncDb.doctors_cache.toArray();
          setDoctors(cachedDoctors);
          // Don't set error if we have cache
          if (cachedAppts.length === 0) {
            setError('Failed to load dashboard data and no offline data available.');
          }
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
      clearInterval(interval);
    };
  }, []);

  // Merge server appointments with pending outbox operations
  const appointments = [...serverAppointments];
  if (pendingOutbox) {
    pendingOutbox.forEach(entry => {
      if (entry.action === 'CREATE') {
        const payload = entry.payload;
        appointments.push({
          id: entry.id,
          scheduledAt: payload.scheduledAt || new Date().toISOString(),
          status: 'requested',
          concernCategory: payload.concernCategory || 'general',
          syncStatus: entry.status === 'failed_conflict' ? 'failed_conflict' : 'pending_push',
          doctor: { fullName: 'Pending Sync...', speciality: 'N/A' }
        });
      }
    });
  }

  // Sort appointments by date
  appointments.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return {
    doctors,
    appointments,
    openSlots,
    loading,
    error,
    now,
  };
};
