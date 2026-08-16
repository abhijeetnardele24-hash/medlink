import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ShieldCheck, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface ConsentGrant {
  id: string;
  granteeId: string;
  purpose: string;
  scope: string;
  status: string;
  grantedAt: string;
  expiresAt: string | null;
}

export const Consents: React.FC = () => {
  const [consents, setConsents] = useState<ConsentGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGrant, setNewGrant] = useState({
    granteeId: '',
    purpose: 'medical_records',
    scope: 'all_history',
    expiresAt: ''
  });

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consents');
      setConsents(res.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await api.post(`/consents/${id}/revoke`);
      // Update local state instead of refetching everything
      setConsents(consents.map(c => c.id === id ? { ...c, status: 'revoked' } : c));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revoke consent');
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrant.granteeId) return alert('Doctor ID is required');

    try {
      const payload: any = {
        granteeId: newGrant.granteeId,
        purpose: newGrant.purpose,
        scope: newGrant.scope,
      };
      if (newGrant.expiresAt) {
        payload.expiresAt = new Date(newGrant.expiresAt).toISOString();
      }

      await api.post('/consents', payload);
      setIsModalOpen(false);
      setNewGrant({ granteeId: '', purpose: 'medical_records', scope: 'all_history', expiresAt: '' });
      fetchConsents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to grant consent');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Data Consents</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck color="var(--primary)" /> Data Consents
        </h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Grant Access
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--danger)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {consents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ margin: 0, fontSize: '1.1rem' }}>You haven't granted data access to any doctors yet.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg-base)' }}>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doctor ID</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scope</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consents.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontWeight: 500 }}>{c.granteeId.split('-')[0]}...</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>{c.purpose.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>{c.scope.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.85rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: c.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9',
                      color: c.status === 'active' ? '#10b981' : '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    {c.status === 'active' && (
                      <button 
                        onClick={() => handleRevoke(c.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.9rem' }}
                      >
                        <Trash2 size={16} /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Grant Access</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleGrant} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Doctor ID (UUID)</label>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={newGrant.granteeId}
                  onChange={e => setNewGrant({...newGrant, granteeId: e.target.value})}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Purpose</label>
                <select className="input-field" value={newGrant.purpose} onChange={e => setNewGrant({...newGrant, purpose: e.target.value})}>
                  <option value="medical_records">Medical Records Review</option>
                  <option value="consultation">Active Consultation</option>
                  <option value="second_opinion">Second Opinion</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Scope</label>
                <select className="input-field" value={newGrant.scope} onChange={e => setNewGrant({...newGrant, scope: e.target.value})}>
                  <option value="all_history">Full Medical History</option>
                  <option value="prescriptions_only">Prescriptions Only</option>
                  <option value="recent_30_days">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Expires At (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="input-field" 
                  value={newGrant.expiresAt}
                  onChange={e => setNewGrant({...newGrant, expiresAt: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                Grant Access
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
