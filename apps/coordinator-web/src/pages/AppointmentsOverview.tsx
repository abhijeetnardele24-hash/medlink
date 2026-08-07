import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Calendar, User, Search, RefreshCw, Clock } from 'lucide-react';
import { Appointment } from '../types';

export const AppointmentsOverview: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAppointments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await api.get('/admin/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = appointments.filter(a => 
    a.patient?.id.includes(search) || 
    a.doctor?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    a.concernCategory.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Appointments Overview</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Clinic-wide view of all appointments.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Search appointments..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }} 
            />
          </div>
          <button onClick={() => fetchAppointments(true)} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? "spinner" : ""} style={refreshing ? { border: 'none', animation: 'spin 1s linear infinite'} : {}} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>No Appointments Found</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(appt => (
            <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</span>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} color="var(--accent)" /> {new Date(appt.scheduledAt).toLocaleString()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doctor</span>
                  <span style={{ fontWeight: 500 }}>Dr. {appt.doctor?.fullName}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</span>
                  <span style={{ fontWeight: 500 }}>{appt.concernCategory}</span>
                </div>
              </div>
              
              <span style={{ 
                fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '12px', fontWeight: 600,
                background: appt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.1)',
                color: appt.status === 'confirmed' ? '#10b981' : 'white'
              }}>
                {appt.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
