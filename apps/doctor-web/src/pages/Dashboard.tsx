import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Calendar, RefreshCw, Clock, Video, User, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Appointment } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (id: string, action: string, version: number) => {
    try {
      await api.patch(`/appointments/${id}`, { action, version });
      fetchAppointments(true);
    } catch (err) {
      console.error(err);
      setError('Failed to update appointment.');
    }
  };

  const fetchAppointments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await api.get('/appointments');
      if (response.data) {
        setAppointments(response.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');
  const requests = appointments.filter(a => a.status === 'requested');
  const uniquePatients = new Set(appointments.map(a => a.patient?.id)).size;
  const firstName = user?.displayName?.split(' ')[0] || 'Doctor';

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
            Welcome back, Dr. {firstName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => fetchAppointments(true)} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/availability')}>
            <Calendar size={16} /> Manage Availability
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { label: 'Pending Requests', value: requests.length, icon: <AlertCircle size={20} />, color: '#f59e0b' },
          { label: 'Upcoming Today', value: upcomingAppointments.length, icon: <Clock size={20} />, color: 'var(--accent)' },
          { label: 'Total Patients', value: uniquePatients, icon: <Users size={20} />, color: '#6366f1' },
          { label: 'All Appointments', value: appointments.length, icon: <TrendingUp size={20} />, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Incoming Requests */}
      {!loading && requests.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={22} color="#f59e0b" /> Incoming Requests ({requests.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {requests.map(appt => (
              <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: '3px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} color="var(--accent)" />
                      {appt.patient?.fullName || 'Unknown Patient'}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {appt.concernCategory?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
                    Requested
                  </span>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} /> {new Date(appt.scheduledAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => handleAction(appt.id, 'confirm', appt.version)} className="btn btn-primary" style={{ flex: 1, padding: '0.65rem', background: '#10b981', fontSize: '0.9rem' }}>
                    <CheckCircle size={15} /> Accept
                  </button>
                  <button onClick={() => handleAction(appt.id, 'reject', appt.version)} className="btn btn-secondary" style={{ flex: 1, padding: '0.65rem', color: '#fca5a5', fontSize: '0.9rem' }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={22} color="var(--accent)" /> Upcoming Appointments
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={64} style={{ margin: '0 auto 1.25rem', opacity: 0.15 }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Clear Schedule</h3>
            <p>You have no upcoming appointments. Make sure your availability is up to date.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {upcomingAppointments.map(appt => (
              <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} color="var(--accent)" /> {appt.patient?.fullName || 'Unknown Patient'}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {appt.concernCategory?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600 }}>
                    Confirmed
                  </span>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} /> {new Date(appt.scheduledAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                  onClick={() => navigate(`/consultation/${appt.id}`)}
                >
                  <Video size={16} /> Join Consultation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
