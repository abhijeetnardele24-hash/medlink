import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Appointment } from '../types';
import { AppointmentCard } from '../components/AppointmentCard';
import { LogOut, Calendar, Clock, User as UserIcon, Activity, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchAppointments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await api.get('/appointments?limit=50');
      if (response.data && Array.isArray(response.data.data)) {
        setAppointments(response.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch appointments. Ensure the backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAction = async (id: string, version: number, action: 'confirm' | 'reject') => {
    setActionLoadingId(id);
    try {
      await api.patch(`/appointments/${id}`, { action, version });
      // Remove or update from local state
      setAppointments(prev => prev.map(appt => 
        appt.id === id ? { ...appt, status: action === 'confirm' ? 'confirmed' : 'rejected', version: version + 1 } : appt
      ));
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 409) {
        alert('This appointment was updated elsewhere. Refreshing list...');
        fetchAppointments(true);
      } else {
        alert(err.response?.data?.error || 'Failed to update appointment.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const requestedAppointments = appointments.filter(a => a.status === 'requested');
  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');

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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Physician</div>
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => fetchAppointments(true)} className="btn btn-secondary" disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? "spinner" : ""} style={refreshing ? { border: 'none', animation: 'spin 1s linear infinite'} : {}} />
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/availability')}>
              <Calendar size={18} />
              <span>Manage Availability</span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Incoming Requests Column */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              New Requests 
              {requestedAppointments.length > 0 && (
                <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '99px' }}>
                  {requestedAppointments.length}
                </span>
              )}
            </h3>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
            ) : requestedAppointments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Check size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>You're all caught up!</p>
              </div>
            ) : (
              requestedAppointments.map(appt => (
                <AppointmentCard 
                  key={appt.id} 
                  appointment={appt} 
                  onAccept={(id, version) => handleAction(id, version, 'confirm')}
                  onReject={(id, version) => handleAction(id, version, 'reject')}
                  loadingId={actionLoadingId}
                />
              ))
            )}
          </div>

          {/* Upcoming Schedule Column */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              Confirmed Schedule
            </h3>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>No confirmed appointments yet.</p>
              </div>
            ) : (
              upcomingAppointments.map(appt => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
