import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { ShieldCheck, LogOut, Check, X, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DoctorVerification {
  id: string;
  doctorId: string;
  status: 'pending_verification' | 'needs_correction' | 'verified' | 'rejected' | 'suspended';
  createdAt: string;
  doctor: {
    fullName: string;
    speciality: string;
    registrationNumber: string;
    facilityName: string | null;
  };
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [verifications, setVerifications] = useState<DoctorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchQueue = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/verifications?status=pending_verification');
      if (response.data) {
        setVerifications(response.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch verification queue. Are you an authorized coordinator?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (verificationId: string, action: 'verified' | 'rejected') => {
    setActionLoadingId(verificationId);
    try {
      await api.patch(`/admin/verifications/${verificationId}`, { status: action });
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update verification status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>MedLink Coordinator</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>{user?.email}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System Administrator</div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="main-content fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Doctor Verification Queue</h1>
            <p style={{ color: 'var(--text-muted)' }}>Review and authorize new physician accounts.</p>
          </div>
          <button onClick={() => fetchQueue(true)} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? "spinner" : ""} style={refreshing ? { border: 'none', animation: 'spin 1s linear infinite'} : {}} />
            {!refreshing && <span>Refresh Queue</span>}
          </button>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
        ) : verifications.length === 0 ? (
          <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Check size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Queue is Empty</h3>
            <p>All pending doctor registrations have been reviewed.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {verifications.map(v => (
              <div key={v.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Dr. {v.doctor.fullName}</h4>
                    <p style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.875rem' }}>{v.doctor.speciality}</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    Needs Review
                  </span>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '120px' }}>Reg. Number:</span>
                    <span style={{ fontWeight: 500 }}>{v.doctor.registrationNumber}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '120px' }}>Facility:</span>
                    <span>{v.doctor.facilityName || 'Independent Practice'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '0.75rem', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={() => handleAction(v.id, 'rejected')}
                    disabled={actionLoadingId === v.id}
                  >
                    {actionLoadingId === v.id ? 'Wait...' : <><X size={18} /> Reject</>}
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '0.75rem', background: '#10b981' }}
                    onClick={() => handleAction(v.id, 'verified')}
                    disabled={actionLoadingId === v.id}
                  >
                    {actionLoadingId === v.id ? 'Wait...' : <><Check size={18} /> Authorize</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
