import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HeartPulse, LogOut, Calendar, Clock, Video, User } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <Calendar size={20} />, label: 'Appointments' },
    { path: '/availability', icon: <Clock size={20} />, label: 'Availability' },
    { path: '/profile', icon: <User size={20} />, label: 'My Profile' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Logo Area */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse color="white" size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>MedLink</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Practitioner</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary-invert)' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? 'var(--shadow-md)' : 'none'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Dr. {profile?.fullName || 'User'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile?.speciality || 'Physician'}</div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem', border: 'none' }} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};
