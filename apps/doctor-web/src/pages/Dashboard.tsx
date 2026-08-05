import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calendar, Clock, User as UserIcon, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-container" style={{ background: 'var(--bg-base)' }}>
      
      {/* Premium Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>MedLink</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Dr. {user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cardiologist</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={20} color="var(--text-muted)" />
            </div>
          </div>
          
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="main-content fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back, Doctor.</h1>
            <p style={{ color: 'var(--text-muted)' }}>Here is your schedule for today.</p>
          </div>
          <button className="btn btn-primary">
            <Calendar size={18} />
            <span>Manage Availability</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Today's Patients</div>
              <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                <UserIcon size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>12</div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Next Appointment</div>
              <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderRadius: '8px' }}>
                <Clock size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>10:30 AM</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Sarah Jenkins</div>
          </div>
        </div>

        {/* Appointments List placeholder */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Upcoming Appointments</h3>
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>API connection is ready! We will fetch your real appointments soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
};
