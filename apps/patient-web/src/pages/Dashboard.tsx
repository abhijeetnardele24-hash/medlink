import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { HeartPulse, LogOut, Calendar, Clock, MapPin, User, Stethoscope, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface Doctor {
  id: string;
  fullName: string;
  speciality: string;
  facilityName: string | null;
  languagesSpoken: string[];
  bio: string | null;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  concernCategory: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch verified doctors
        const docRes = await api.get('/doctors');
        setDoctors(docRes.data.data);

        // Fetch patient's appointments
        const apptRes = await api.get('/appointments');
        setAppointments(apptRes.data.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="app-container" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>MedLink</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>{user?.displayName || user?.email}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient</div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="main-content fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Appointments Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} color="var(--accent)" /> Your Appointments
          </h2>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner"></div></div>
          ) : appointments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p>You have no upcoming appointments.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Book a consultation with a specialist below.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {appointments.map(appt => (
                <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)' }}>{appt.concernCategory.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', background: 'var(--bg-surface-elevated)', textTransform: 'capitalize' }}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    <Clock size={16} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>{new Date(appt.scheduledAt).toLocaleString()}</span>
                  </div>
                  {appt.status === 'confirmed' && (
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }}>
                      Join Consultation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctors Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={24} color="var(--accent)" /> Find a Specialist
          </h2>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner"></div></div>
          ) : doctors.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No verified doctors available at the moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {doctors.map(doctor => (
                <div key={doctor.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} color="var(--text-muted)" />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Dr. {doctor.fullName}</h3>
                      <p style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 500 }}>{doctor.speciality}</p>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <MapPin size={14} />
                      <span>{doctor.facilityName || 'Independent Practice'}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {doctor.bio || 'No bio provided.'}
                    </p>
                  </div>

                  <Link to={`/doctor/${doctor.id}`} className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none' }}>
                    View Profile <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
