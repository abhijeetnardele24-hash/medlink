import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HeartPulse, Calendar, Clock, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
        
        <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>MedLink</h2>
        </div>

        <nav style={{ padding: '2rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Calendar size={20} /> Appointments
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Clock size={20} /> Medical History
          </NavLink>
        </nav>

        <div style={{ padding: '2rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '0 1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--text-muted)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.displayName || user?.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient</div>
            </div>
          </div>
          
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>
    </div>
  );
};
