import React from 'react';
import { Users } from 'lucide-react';

export const PatientsDirectory: React.FC = () => {
  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Patient Directory</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>View registered patients.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Users size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Coming Soon</h3>
        <p style={{ margin: 0 }}>The Patient directory is currently under construction.</p>
      </div>
    </div>
  );
};
