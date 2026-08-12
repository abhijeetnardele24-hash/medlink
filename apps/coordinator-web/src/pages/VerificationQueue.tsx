import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Check, X, RefreshCw, Users, Package } from 'lucide-react';

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
    educationBackground: string;
    experienceYears: number;
    isPartTime: boolean;
    contactNumber: string;
  };
}

interface PharmacistVerification {
  id: string;
  pharmacistId: string;
  status: 'pending_verification' | 'needs_correction' | 'verified' | 'rejected' | 'suspended';
  createdAt: string;
  pharmacist: {
    fullName: string;
    shopName: string;
    registeredAddress: string;
    contactNumber: string | null;
    drugLicenseNumber: string | null;
    drugLicenseDocumentUrl: string | null;
    pharmacyCouncilRegistrationNumber: string | null;
    licenseIssuingState: string | null;
    licenseExpiryDate: string | null;
  };
}

export const VerificationQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'pharmacists'>('doctors');
  const [verifications, setVerifications] = useState<DoctorVerification[]>([]);
  const [pharmacistVerifs, setPharmacistVerifs] = useState<PharmacistVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchQueue = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      if (activeTab === 'doctors') {
        const response = await api.get('/admin/verifications?status=pending_verification');
        setVerifications(response.data || []);
      } else {
        const response = await api.get('/admin/pharmacist-verifications?status=pending_verification');
        setPharmacistVerifs(response.data || []);
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
  }, [activeTab]);

  const handleAction = async (verificationId: string, action: 'verified' | 'rejected') => {
    setActionLoadingId(verificationId);
    try {
      if (activeTab === 'doctors') {
        await api.patch(`/admin/verifications/${verificationId}`, { status: action });
        setVerifications(prev => prev.filter(v => v.id !== verificationId));
      } else {
        await api.patch(`/admin/pharmacist-verifications/${verificationId}`, { status: action });
        setPharmacistVerifs(prev => prev.filter(v => v.id !== verificationId));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update verification status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Verification Queue</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Review and authorize new physician accounts.</p>
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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'doctors' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'doctors' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Users size={18} /> Doctors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pharmacists' ? 'active' : ''}`}
          onClick={() => setActiveTab('pharmacists')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'pharmacists' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'pharmacists' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Package size={18} /> Pharmacists
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : (activeTab === 'doctors' ? verifications.length : pharmacistVerifs.length) === 0 ? (
        <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Check size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Queue is Empty</h3>
          <p style={{ margin: 0 }}>All pending {activeTab} have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {activeTab === 'doctors' && verifications.map(v => (
            <div key={v.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>Dr. {v.doctor.fullName}</h4>
                  <p style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>{v.doctor.speciality}</p>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)', fontWeight: 600 }}>
                  NEEDS REVIEW
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', flex: 1, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Reg. Number</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)' }}>{v.doctor.registrationNumber}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Experience</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{v.doctor.experienceYears} Years</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Facility / Hospital</span>
                    <span style={{ fontSize: '0.95rem' }}>{v.doctor.facilityName || 'Independent Practice'}</span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Education Background</span>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--text-main)' }}>{v.doctor.educationBackground}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                  onClick={() => handleAction(v.id, 'rejected')}
                  disabled={actionLoadingId === v.id}
                >
                  {actionLoadingId === v.id ? 'Wait...' : <><X size={18} /> Reject</>}
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#10b981', color: '#022c22' }}
                  onClick={() => handleAction(v.id, 'verified')}
                  disabled={actionLoadingId === v.id}
                >
                  {actionLoadingId === v.id ? 'Wait...' : <><Check size={18} /> Authorize</>}
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'pharmacists' && pharmacistVerifs.map(v => (
            <div key={v.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>{v.pharmacist.shopName}</h4>
                  <p style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>{v.pharmacist.fullName}</p>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)', fontWeight: 600 }}>
                  NEEDS REVIEW
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', flex: 1, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Drug License No.</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)' }}>{v.pharmacist.drugLicenseNumber || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>State Council Reg No.</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{v.pharmacist.pharmacyCouncilRegistrationNumber || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Issuing State</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{v.pharmacist.licenseIssuingState || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Expiry Date</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{v.pharmacist.licenseExpiryDate ? new Date(v.pharmacist.licenseExpiryDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Registered Address</span>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{v.pharmacist.registeredAddress}</span>
                  </div>
                </div>
                {v.pharmacist.drugLicenseDocumentUrl && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <a href={v.pharmacist.drugLicenseDocumentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View License Document
                    </a>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                  onClick={() => handleAction(v.id, 'rejected')}
                  disabled={actionLoadingId === v.id}
                >
                  {actionLoadingId === v.id ? 'Wait...' : <><X size={18} /> Reject</>}
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#10b981', color: '#022c22' }}
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
    </div>
  );
};

