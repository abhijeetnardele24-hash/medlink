import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
  HeartPulse, Calendar, Clock, MapPin, User, Stethoscope, 
  ArrowRight, Video, CheckCircle, AlertCircle, Sparkles, 
  DollarSign, Zap 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface Doctor {
  id: string;
  fullName: string;
  speciality: string;
  facilityName: string | null;
  languagesSpoken: string[];
  bio: string | null;
}

interface OpenSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  supportedModes: string[];
  status: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  consultationFee?: number;
  facilityName?: string | null;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  concernCategory: string;
  doctor?: { fullName: string; speciality: string };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, apptRes, slotRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/appointments'),
          api.get('/doctors/open-slots').catch(() => ({ data: { data: [] } }))
        ]);
        setDoctors(docRes.data.data || []);
        setAppointments(apptRes.data.data || []);
        setOpenSlots(slotRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'requested');
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={14} /> },
    requested: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={14} /> },
    rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={14} /> },
  };

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Welcome Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Here's your telehealth overview and open doctor slots for today.</p>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { label: 'Total Appointments', value: appointments.length, icon: <Calendar size={22} color="var(--accent)" />, accent: 'var(--accent)' },
          { label: 'Upcoming', value: upcomingAppts.length, icon: <Clock size={22} color="#10b981" />, accent: '#10b981' },
          { label: 'Open Slots Now', value: openSlots.length, icon: <Zap size={22} color="#f59e0b" />, accent: '#f59e0b' },
          { label: 'Doctors Available', value: doctors.length, icon: <Stethoscope size={22} color="#6366f1" />, accent: '#6366f1' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 700, lineHeight: 1, color: stat.accent }}>{stat.value}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Available Doctor Slots Section (NEW) */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={22} color="#f59e0b" /> Open Consultation Slots (Instant Booking)
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Verified doctors with open slots ready for immediate consultation.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : openSlots.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>No open slots published at this moment</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>You can browse all doctors below and request an appointment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {openSlots.map(slot => {
              const startDate = new Date(slot.startsAt);
              const endDate = new Date(slot.endsAt);
              const isToday = startDate.toDateString() === new Date().toDateString();

              return (
                <div 
                  key={slot.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    border: '1px solid rgba(245, 158, 11, 0.25)', 
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(37, 99, 235, 0.03))' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.15rem 0' }}>Dr. {slot.doctorName}</h3>
                      <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{slot.doctorSpeciality}</p>
                    </div>
                    <span style={{ 
                      padding: '0.25rem 0.65rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      background: isToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)', 
                      color: isToday ? '#10b981' : 'var(--accent)' 
                    }}>
                      {isToday ? 'TODAY' : startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <Clock size={15} color="var(--accent)" />
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {slot.consultationFee && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      <DollarSign size={14} color="#10b981" /> ₹{slot.consultationFee} Consultation Fee
                    </div>
                  )}

                  <div style={{ marginTop: 'auto' }}>
                    <Link 
                      to={`/doctor/${slot.doctorId}?slotId=${slot.id}`} 
                      className="btn btn-primary" 
                      style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
                    >
                      Book This Slot <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions Strip */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(99,102,241,0.05))', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5L3 13l7.5-7.5"/><path d="M14 3v8h8"/><path d="M3 13h18l-7.5 7.5"/><path d="M3 13v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Pharmacy Storefront</h2>
              <p style={{ color: 'var(--text-muted)' }}>Order medicines directly with your digital prescriptions.</p>
            </div>
          </div>
          <Link to="/pharmacy" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            Shop Medicines <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Appointments Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={22} color="var(--accent)" /> Your Appointments
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : upcomingAppts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={56} style={{ margin: '0 auto 1.25rem', opacity: 0.15 }} />
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No upcoming appointments</h3>
            <p style={{ marginBottom: '1.5rem' }}>Browse our specialist doctors or book an open slot above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {upcomingAppts.map(appt => {
              const cfg = statusConfig[appt.status] || statusConfig['requested'];
              return (
                <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: `3px solid ${cfg.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {appt.concernCategory.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {appt.doctor && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={14} /> Dr. {appt.doctor.fullName} · {appt.doctor.speciality}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    <Clock size={14} />
                    {new Date(appt.scheduledAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {appt.status === 'confirmed' && (
                    <button onClick={() => navigate(`/consultation/${appt.id}`)} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <Video size={16} /> Join Video Consultation
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctors Section */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Stethoscope size={22} color="var(--accent)" /> All Specialist Doctors
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : doctors.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <HeartPulse size={48} style={{ margin: '0 auto 1rem', opacity: 0.15 }} />
            <p>No verified doctors available at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {doctors.map(doctor => (
              <div key={doctor.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={26} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.15rem' }}>Dr. {doctor.fullName}</h3>
                    <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>{doctor.speciality}</p>
                  </div>
                </div>

                <div style={{ flex: 1, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <MapPin size={13} /> {doctor.facilityName || 'Independent Practice'}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {doctor.bio || 'Verified specialist available for consultations.'}
                  </p>
                </div>

                {doctor.languagesSpoken?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {doctor.languagesSpoken.slice(0, 3).map(lang => (
                      <span key={lang} style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                <Link to={`/doctor/${doctor.id}`} className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Book Appointment <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
