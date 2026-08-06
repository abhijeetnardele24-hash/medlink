import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Server, Bell, Database, Check, AlertTriangle } from 'lucide-react';

export const Settings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveDoctors, setAutoApproveDoctors] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>System Settings</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Configure platform rules and administrative preferences.</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={18} /> Save Configurations
        </button>
      </div>

      {savedMessage && (
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          color: '#6ee7b7', 
          border: '1px solid rgba(16, 185, 129, 0.2)', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} /> Settings successfully saved and applied to the cluster.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Verification Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
              <Shield size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Onboarding Rules</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoApproveDoctors}
                onChange={(e) => setAutoApproveDoctors(e.target.checked)}
                style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Auto-Approve Doctors</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Automatically approve doctors from known partner institutions without manual review.</div>
              </div>
            </label>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
              <Server size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Platform Health</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>PostgreSQL Database</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Connected
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Firebase Auth</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Connected
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>WebRTC Video Service</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Active
              </span>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1', border: maintenanceMode ? '1px solid rgba(245, 158, 11, 0.3)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px' }}>
              <AlertTriangle size={24} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: maintenanceMode ? '#fcd34d' : undefined }}>Danger Zone</h3>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <input 
              type="checkbox" 
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', accentColor: '#f59e0b' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: maintenanceMode ? '#fcd34d' : undefined }}>Enable Maintenance Mode</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>This will immediately lock out all patients and doctors from the platform. Active consultations will be gracefully terminated.</div>
            </div>
          </label>
        </div>

      </div>
    </div>
  );
};
