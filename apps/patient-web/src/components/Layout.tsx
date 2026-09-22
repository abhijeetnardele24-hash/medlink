import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HeartPulse, Calendar, Clock, User, LogOut, ShieldCheck, Package, ShoppingBag, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-[var(--border)] flex flex-col bg-[var(--bg-surface)]">
        
        <div className="py-8 px-6 flex items-center border-b border-[var(--border)]">
          <div>
            <h2 className="text-[1.75rem] font-black m-0 tracking-[0.12em] uppercase text-[var(--text-main)] font-['Inter',sans-serif]">
              Med<span className="font-light">Link</span>
            </h2>
            <p className="text-xs text-[var(--accent)] font-medium m-0 tracking-[0.05em] uppercase mt-1">Patient Portal</p>
          </div>
        </div>

        <nav className="py-8 px-4 flex-1 flex flex-col gap-2">
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
        </nav>

        <div className="py-8 px-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-4 mb-4 px-4">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-surface-elevated)] flex items-center justify-center">
              <User size={18} className="text-[var(--text-muted)]" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold whitespace-nowrap text-ellipsis">{user?.displayName || user?.email}</div>
              <div className="text-xs text-[var(--text-muted)]">Patient</div>
            </div>
          </div>
          
          <button onClick={logout} className="sidebar-link w-full border-none bg-transparent cursor-pointer text-[var(--danger)]">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="h-16 border-b border-[var(--border)] flex items-center justify-end px-8 bg-[var(--bg-surface)]">
          <NotificationCenter />
        </header>
        <div className="flex-1 p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
