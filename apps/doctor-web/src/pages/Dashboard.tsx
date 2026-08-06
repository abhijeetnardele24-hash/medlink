import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Calendar, RefreshCw, Clock, Video, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<any[]>([]);
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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');
  const requests = appointments.filter(a => a.status === 'requested');

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Doctor Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Manage your incoming requests and daily schedule.</p>
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

      {/* Requests Section */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Incoming Requests ({requests.length})</h2>
      {!loading && requests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {requests.map(appt => (
            <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #eab308' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--primary)" />
                    {appt.patient?.fullName || 'Unknown Patient'}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{appt.concernCategory}</p>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                  Requested
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Clock size={18} color="var(--text-muted)" />
                <span style={{ fontWeight: 500 }}>{new Date(appt.scheduledAt).toLocaleString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleAction(appt.id, 'confirm', appt.version)} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: '#000' }}>Accept</button>
                <button onClick={() => handleAction(appt.id, 'reject', appt.version)} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem', color: '#fca5a5' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Section */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Upcoming Appointments</h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : upcomingAppointments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>No Upcoming Appointments</h3>
          <p>You have a clear schedule. Make sure your availability is up to date.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {upcomingAppointments.map(appt => (
            <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--primary)" />
                    {appt.patient?.fullName || 'Unknown Patient'}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{appt.concernCategory}</p>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  Confirmed
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Clock size={18} color="var(--text-muted)" />
                <span style={{ fontWeight: 500 }}>{new Date(appt.scheduledAt).toLocaleString()}</span>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem' }}
                onClick={() => navigate(`/consultation/${appt.id}`)}
              >
                <Video size={18} /> Join Consultation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
