import { useState } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { LogOut, FileText } from 'lucide-react';

export function Onboarding() {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Assuming a verification endpoint will be built
      await api.post('/pharmacy/verify', { licenseNumber });
      setSuccess(true);
      // Force reload to update app state to pending_verification dashboard
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Pharmacist Onboarding</h2>
        <button className="btn btn-secondary" onClick={() => auth.signOut()}>
          <LogOut size={20} />
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#e0e7ff', borderRadius: '50%', marginBottom: '1rem' }}>
              <FileText size={32} color="var(--accent)" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Verify Your Pharmacy</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Please provide your pharmacy license details to complete registration.</p>
          </div>

          {success ? (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              Verification submitted! Waiting for coordinator approval.
            </div>
          ) : (
            <>
              {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>License Number</label>
                <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="input-field" required placeholder="e.g. PH-12345678" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Verification'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
