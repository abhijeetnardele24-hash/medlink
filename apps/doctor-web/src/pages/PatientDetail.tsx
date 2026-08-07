import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { User, ArrowLeft, Calendar, FileText, Clock, Video, AlertCircle } from 'lucide-react';
import type { Patient, Appointment, Encounter } from '../types';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apptRes = await api.get('/appointments');
        const allAppts: Appointment[] = apptRes.data.data || [];
        const patientAppts = allAppts.filter((a) => a.patient?.id === id);
        setAppointments(patientAppts);

        if (patientAppts.length > 0) {
          setPatient(patientAppts[0].patient);
        }

        try {
          const encRes = await api.get('/encounters');
          const patientEncs: Encounter[] = (encRes.data.data || []).filter((e: Encounter) => 
            patientAppts.some((a) => a.id === e.appointmentId)
          );
          setEncounters(patientEncs);
        } catch { /* encounters might not exist */ }

      } catch (err) {
        console.error('Failed to fetch patient detail', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!patient) return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
      <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Patient not found</h3>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Patients
      </button>

      {/* Patient Header Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={36} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{patient.fullName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{patient.email}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>ID: {patient.id}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{appointments.length}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Appointments</div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: '#10b981' },
          { label: 'Completed', value: encounters.length, color: 'var(--accent)' },
          { label: 'Pending', value: appointments.filter(a => a.status === 'requested').length, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Appointments History */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--accent)" /> Appointment History
        </h2>
        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No appointments found for this patient.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointments.map((appt: Appointment) => (
              <div key={appt.id} style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{appt.concernCategory?.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={12} /> {new Date(appt.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: appt.status === 'confirmed' ? 'rgba(16,185,129,0.1)' : appt.status === 'requested' ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.06)',
                  color: appt.status === 'confirmed' ? '#10b981' : appt.status === 'requested' ? '#f59e0b' : 'var(--text-muted)'
                }}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
