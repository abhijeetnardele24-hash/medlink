import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FileText, Download, Calendar, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { syncDb } from '../lib/sync/SyncDB';

interface Encounter {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string;
  appointment: {
    concernCategory: string;
    doctor: {
      fullName: string;
      speciality: string;
    };
  };
  prescriptionId?: string;
}

export const History: React.FC = () => {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (navigator.onLine) {
          const res = await api.get('/encounters');
          const past = res.data.data.filter((e: any) => e.status === 'ended');
          setEncounters(past);
          await syncDb.encounters_cache.clear();
          await syncDb.encounters_cache.bulkPut(past);
        } else {
          const cached = await syncDb.encounters_cache.toArray();
          setEncounters(cached);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
        const cached = await syncDb.encounters_cache.toArray();
        setEncounters(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownload = async (prescriptionId?: string) => {
    if (!prescriptionId) return;
    
    // Open a blank tab synchronously to avoid popup blockers
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      console.error("Popup blocked");
      return;
    }

    try {
      const res = await api.get(`/prescriptions/${prescriptionId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      
      newWindow.location.href = url;
      
      // Revoke the object URL after a short delay so the new tab has time to load it
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (err) {
      newWindow.close();
      console.error("Failed to download prescription", err);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity color="var(--accent)" /> Medical History
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>View your past consultations, clinical notes, and prescriptions.</p>
        <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.15)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
          <strong>Note:</strong> Your newly booked, upcoming appointments are shown on your <Link to="/" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Main Dashboard (Appointments tab)</Link>. They will only appear here in History <em>after</em>{' '}the doctor has completed the consultation.
        </div>
      </div>

      {isOffline && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.9rem', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
          <AlertCircle size={18} /> 🟠 Offline - Showing locally cached consultation history
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
      ) : encounters.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No past history found</h3>
          <p>Your completed consultations and prescriptions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {encounters.map(encounter => (
            <div key={encounter.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{encounter.appointment.concernCategory.replace('_', ' ').toUpperCase()}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    <Calendar size={14} />
                    {new Date(encounter.startedAt).toLocaleDateString()} with Dr. {encounter.appointment.doctor.fullName} ({encounter.appointment.doctor.speciality})
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', background: 'var(--bg-surface-elevated)' }}>
                  Completed
                </span>
              </div>
              
              <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} color="var(--accent)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Prescription & Notes</span>
                  </div>
                  {encounter.prescriptionId ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Prescription Available <CheckCircle size={14} />
                      </span>
                      <button onClick={() => handleDownload(encounter.prescriptionId)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                        <Download size={14} style={{ marginRight: '0.25rem' }} /> Download PDF
                      </button>
                      <button onClick={() => handleDownload(encounter.prescriptionId)} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                        View Prescription
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Not available</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
