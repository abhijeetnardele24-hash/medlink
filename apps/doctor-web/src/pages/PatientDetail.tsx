import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  User, ArrowLeft, Calendar, Clock, Video, AlertCircle, 
  Download, HeartPulse, Droplet, Ruler, Scale, Phone, 
  MapPin, Pill, Scissors, Shield, Activity, FileHeart 
} from 'lucide-react';
import type { Appointment, Encounter } from '../types';

interface PatientFullProfile {
  id: string;
  fullName: string;
  email: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  height?: number | null;
  weight?: number | null;
  allergies?: string[] | null;
  chronicConditions?: string[] | null;
  currentMedications?: string[] | null;
  pastSurgeries?: string[] | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  address?: string | null;
  smokingStatus?: string | null;
  alcoholStatus?: string | null;
  dietPreference?: string | null;
  abhaId?: string | null;
  insurancePolicyNumber?: string | null;
  locationDistrict?: string | null;
}

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientFullProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, apptRes, encRes] = await Promise.all([
          api.get(`/patients/${id}`).catch(() => null),
          api.get('/appointments').catch(() => ({ data: { data: [] } })),
          api.get('/encounters').catch(() => ({ data: { data: [] } })),
        ]);

        if (patientRes?.data?.data) {
          setPatient(patientRes.data.data);
        }

        const allAppts: Appointment[] = apptRes?.data?.data || [];
        const patientAppts = allAppts.filter((a) => a.patient?.id === id || a.patientId === id);
        setAppointments(patientAppts);

        if (!patientRes?.data?.data && patientAppts.length > 0 && patientAppts[0].patient) {
          setPatient(patientAppts[0].patient as any);
        }

        const patientEncs: Encounter[] = (encRes?.data?.data || []).filter((e: Encounter) => 
          patientAppts.some((a) => a.id === e.appointmentId)
        );
        setEncounters(patientEncs);

      } catch (err) {
        console.error('Failed to fetch patient detail', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleDownload = async (prescriptionId: string) => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;

    try {
      const res = await api.get(`/prescriptions/${prescriptionId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
      newWindow.location.href = url;
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err) {
      newWindow.close();
      console.error("Failed to download prescription", err);
    }
  };

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

  // BMI Calculation
  const heightM = patient.height ? patient.height / 100 : 0;
  const weightKg = patient.weight || 0;
  const bmi = (heightM > 0 && weightKg > 0) ? (weightKg / (heightM * heightM)).toFixed(1) : null;

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Patients Roster
      </button>

      {/* Patient Header Card */}
      <div className="glass-panel" style={{ padding: '2.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(37,99,235,0.2)' }}>
            <User size={38} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>{patient.fullName}</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span>{patient.email}</span>
              {patient.gender && <span>· Gender: <strong>{patient.gender}</strong></span>}
              {patient.dateOfBirth && <span>· DOB: <strong>{new Date(patient.dateOfBirth).toLocaleDateString()}</strong></span>}
              {patient.bloodGroup && <span style={{ color: '#ef4444', fontWeight: 700 }}>· Blood: {patient.bloodGroup}</span>}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: 'monospace' }}>
              Patient ID: {patient.id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>{appointments.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Appointments</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{encounters.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultations</div>
          </div>
        </div>
      </div>

      {/* Clinical Dossier Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Left Column: Biometrics & Vitals */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <HeartPulse size={18} color="#10b981" /> Biometric Vitals & BMI
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.85rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Height</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{patient.height ? `${patient.height} cm` : 'Not recorded'}</div>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Weight</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{patient.weight ? `${patient.weight} kg` : 'Not recorded'}</div>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>BMI Metric</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: bmi ? '#2563eb' : 'inherit' }}>{bmi || 'N/A'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Location / District:</span>
              <span style={{ fontWeight: 600 }}>{patient.locationDistrict || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Residential Address:</span>
              <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{patient.address || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
              <span style={{ fontWeight: 600 }}>{patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || 'No phone'})` : 'Not added'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>ABHA Health ID:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>{patient.abhaId || 'Not linked'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Allergies, Conditions & Meds */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <FileHeart size={18} color="#ef4444" /> Allergies & Medical History
          </h3>

          {/* Allergies Alert */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              Known Allergies
            </div>
            {patient.allergies && patient.allergies.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {patient.allergies.map(a => (
                  <span key={a} style={{ padding: '0.25rem 0.65rem', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No known drug or food allergies recorded.</span>
            )}
          </div>

          {/* Chronic Conditions */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              Chronic Conditions
            </div>
            {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {patient.chronicConditions.map(c => (
                  <span key={c} style={{ padding: '0.25rem 0.65rem', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None recorded.</span>
            )}
          </div>

          {/* Current Medications */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              Current Medications
            </div>
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {patient.currentMedications.map(m => (
                  <span key={m} style={{ padding: '0.25rem 0.65rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                    💊 {m}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No current medications logged.</span>
            )}
          </div>

        </div>

      </div>

      {/* Appointment History Timeline */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--accent)" /> Consultation & Appointment History
        </h2>
        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No appointments found for this patient.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointments.sort((a,b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map((appt: Appointment) => {
              const enc = encounters.find(e => e.appointmentId === appt.id);
              return (
                <div key={appt.id} style={{ padding: '1.25rem', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={22} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {appt.concernCategory?.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                        <Clock size={13} /> {new Date(appt.scheduledAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {enc && enc.prescriptionId && (
                      <button 
                        onClick={() => handleDownload(enc.prescriptionId!)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Download size={14} /> Prescription
                      </button>
                    )}
                    <span style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: appt.status === 'confirmed' ? 'rgba(16,185,129,0.15)' : appt.status === 'completed' ? 'rgba(37,99,235,0.15)' : 'rgba(245,158,11,0.15)',
                      color: appt.status === 'confirmed' ? '#10b981' : appt.status === 'completed' ? 'var(--accent)' : '#f59e0b'
                    }}>
                      {appt.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default PatientDetail;
