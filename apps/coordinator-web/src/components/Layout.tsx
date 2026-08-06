import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogOut, CheckSquare, Users, UserCog, Settings, Calendar, ListTodo } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <CheckSquare size={20} />, label: 'Verification Queue' },
    { path: '/tasks', icon: <ListTodo size={20} />, label: 'Task Queue' },
    { path: '/appointments', icon: <Calendar size={20} />, label: 'Appointments' },
    { path: '/doctors', icon: <UserCog size={20} />, label: 'Doctor Directory' },
    { path: '/patients', icon: <Users size={20} />, label: 'Patient Directory' },
    { path: '/settings', icon: <Settings size={20} />, label: 'System Settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Logo Area */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck color="white" size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>MedLink</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin Console</p>
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
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary-invert)' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
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
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coordinator</div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }} title="Log out">
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
