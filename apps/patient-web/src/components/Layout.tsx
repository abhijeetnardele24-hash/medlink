  import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HeartPulse, Calendar, Clock, User, LogOut, ShieldCheck, Package, ShoppingBag, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
        
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-main)', fontFamily: '"Inter", sans-serif' }}>
              Med<span style={{ fontWeight: 300 }}>Link</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.25rem' }}>Patient Portal</p>
          </div>
        </div>

        <nav style={{ padding: '2rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Calendar size={20} /> Appointments
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Clock size={20} /> Appt History
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <User size={20} /> Health Profile
          </NavLink>
          <NavLink to="/medical-records" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} /> Medical Records
          </NavLink>
          <NavLink to="/consents" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={20} /> Consents
          </NavLink>
          <NavLink to="/pharmacy" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Package size={20} /> Pharmacy
          </NavLink>
          <NavLink to="/pharmacy-orders" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={20} /> Pharmacy Orders
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
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '64px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem', background: 'var(--bg-surface)' }}>
          <NotificationCenter />
        </header>
        <div style={{ flex: 1, padding: '0' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
