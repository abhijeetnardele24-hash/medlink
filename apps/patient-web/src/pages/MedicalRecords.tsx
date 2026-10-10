import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  FileText,
  Download,
  Calendar,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { syncDb } from '../lib/sync/SyncDB';

interface Prescription {
  id: string;
  issuedAt: string;
  doctorName: string;
  doctorSpeciality: string;
}

export const MedicalRecords: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
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
    const fetchRecords = async () => {
      try {
        if (navigator.onLine) {
          const res = await api.get('/prescriptions/me');
          const data = res.data.data || [];
          setPrescriptions(data);
          await syncDb.prescriptions_cache.clear();
          await syncDb.prescriptions_cache.bulkPut(data);
        } else {
          const cached = await syncDb.prescriptions_cache.toArray();
          setPrescriptions(cached);
        }
      } catch (err) {
        console.error('Failed to fetch medical records', err);
        const cached = await syncDb.prescriptions_cache.toArray();
        setPrescriptions(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download prescription', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Health Records & Prescriptions</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Access and download your official clinical prescriptions</p>
          </div>
        </div>
      </div>
      
      {isOffline && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.9rem', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
          <AlertCircle size={18} /> 🟠 Offline - Showing locally cached prescriptions
        </div>
      )}

      {/* Prescriptions List */}
      <div>
        {prescriptions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={56} style={{ margin: '0 auto 1.25rem', opacity: 0.15 }} />
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No medical records yet</h3>
            <p>Your prescriptions and consultation records will appear here after your consultation.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {prescriptions.map(rx => (
              <div key={rx.id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(66,63,222,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Stethoscope size={22} color="var(--accent)" />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>Dr. {rx.doctorName}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>{rx.doctorSpeciality}</div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <Calendar size={16} /> 
                    {new Date(rx.issuedAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <FileText size={16} /> 
                    Rx ID: {rx.id.substring(0, 8).toUpperCase()}
                  </div>
                </div>

                <button 
                  onClick={() => handleDownload(rx.id)} 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem' }}
                >
                  <Download size={16} /> Download Official PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
