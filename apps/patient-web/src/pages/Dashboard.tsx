import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePatientDashboard } from '../hooks/usePatientDashboard';
import { 
  HeartPulse, Calendar, Clock, MapPin, User, Stethoscope, 
  ArrowRight, Video, CheckCircle, AlertCircle, Activity,
  DollarSign, Zap, Search
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { syncDb } from '../lib/sync/SyncDB';
import { syncManager } from '../lib/sync/SyncManager';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { doctors, appointments, openSlots, loading, now } = usePatientDashboard();
  
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const outboxItems = useLiveQuery(() => syncDb.outbox.toArray(), []);
  const pendingCount = outboxItems?.filter(i => i.status === 'pending' || i.status === 'failed_error').length || 0;
  const syncingCount = outboxItems?.filter(i => i.status === 'syncing').length || 0;
  const conflictCount = outboxItems?.filter(i => i.status === 'failed_conflict').length || 0;



  const upcomingAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'requested');
  const patientName = user?.displayName || user?.email?.split('@')[0] || 'Patient';

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={14} /> },
    requested: { label: 'Pending Request', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={14} /> },
    rejected: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={14} /> },
    in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Activity size={14} /> },
    completed: { label: 'Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: <CheckCircle size={14} /> },
    cancelled: { label: 'Cancelled', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: <AlertCircle size={14} /> },
  };

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Sync Banner */}
      <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.9rem',
        backgroundColor: !isOnline ? '#fffbeb' : conflictCount > 0 ? '#fef2f2' : syncingCount > 0 ? '#eff6ff' : pendingCount > 0 ? '#fffbeb' : '#ecfdf5',
        color: !isOnline ? '#b45309' : conflictCount > 0 ? '#b91c1c' : syncingCount > 0 ? '#1d4ed8' : pendingCount > 0 ? '#b45309' : '#047857',
        border: `1px solid ${!isOnline ? '#fde68a' : conflictCount > 0 ? '#fca5a5' : syncingCount > 0 ? '#bfdbfe' : pendingCount > 0 ? '#fde68a' : '#a7f3d0'}`
      }}>
        {!isOnline ? <><AlertCircle size={18} /> 🟠 Offline - Changes saved locally</> : 
         conflictCount > 0 ? <><AlertCircle size={18} /> ⚠ Sync Failed - Some items conflicted</> :
         syncingCount > 0 ? <><Activity size={18} className="animate-spin" /> 🔄 Syncing...</> :
         pendingCount > 0 ? <><Clock size={18} /> 🟠 Online - Pending sync...</> :
         <><CheckCircle size={18} /> 🟢 Online - Synced</>}
      </div>

      {/* Welcome Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Welcome back, {patientName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>How are you feeling today?</p>
        </div>
        <Link to="/triage" style={{ 
          background: 'var(--accent)', 
          color: 'white', 
          padding: '0.75rem 1.5rem', 
          borderRadius: '8px', 
          fontWeight: 600, 
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
        }}>
          Book a Consultation
        </Link>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Appointments', value: appointments.length, icon: <Calendar size={22} color="var(--accent)" />, accent: 'var(--accent)', action: () => navigate('/history') },
          { label: 'Upcoming', value: upcomingAppts.length, icon: <Clock size={22} color="#10b981" />, accent: '#10b981', action: () => document.getElementById('section-upcoming')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'Open Slots Now', value: openSlots.length, icon: <Zap size={22} color="#f59e0b" />, accent: '#f59e0b', action: () => document.getElementById('section-slots')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'Doctors Available', value: doctors.length, icon: <Stethoscope size={22} color="#6366f1" />, accent: '#6366f1', action: () => document.getElementById('section-doctors')?.scrollIntoView({ behavior: 'smooth' }) },
        ].map(stat => (
          <div 
            key={stat.label} 
            className="glass-panel" 
            onClick={stat.action}
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
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

      {/* Appointments Section */}
      <div id="section-upcoming" style={{ marginBottom: '3rem', scrollMarginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={22} color="var(--accent)" /> Your Appointments
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : upcomingAppts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Calendar size={56} style={{ margin: '0 auto 1.25rem', opacity: 0.15 }} />
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No upcoming consultations</h3>
            <p style={{ marginBottom: '1.5rem' }}>Book a consultation with a doctor to get started.</p>
            <Link to="/triage" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
              Book Consultation
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {upcomingAppts.map(appt => {
              const cfg = statusConfig[appt.status] || statusConfig['requested'];
              const date = new Date(appt.scheduledAt);
              const scheduledAtDate = new Date(appt.scheduledAt);
              const endsAtDate = appt.endsAt ? new Date(appt.endsAt) : new Date(scheduledAtDate.getTime() + 30 * 60000);
              const isBefore = now < scheduledAtDate;
              const isAfter = now > endsAtDate;
              const isDuring = !isBefore && !isAfter;
              
              let headerLabel = 'UPCOMING CONSULTATION';
              let displayStatus = { ...cfg };
              let isPastAndConfirmed = false;
              
              if (isAfter) {
                headerLabel = 'PAST CONSULTATION';
                if (appt.status === 'confirmed' || appt.status === 'requested') {
                  displayStatus = { ...cfg, label: 'Ended' };
                  isPastAndConfirmed = true;
                }
              } else if (isDuring || appt.status === 'in_progress') {
                headerLabel = 'LIVE CONSULTATION';
                if (appt.status === 'confirmed') {
                  displayStatus = { ...cfg, label: 'In Progress' };
                }
              }

              return (
                <div key={appt.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: `3px solid ${displayStatus.color}`, opacity: isAfter ? 0.7 : 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{headerLabel}</span>
                    {appt.syncStatus === 'pending_push' && (
                      <span style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>Saved Offline</span>
                    )}
                    {appt.syncStatus === 'failed_conflict' && (
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>Sync Failed (Conflict)</span>
                    )}
                  </div>
                  
                  {appt.doctor ? (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        Dr. {appt.doctor.fullName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                        {appt.doctor.speciality}
                      </div>
                    </div>
                  ) : (
                     <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                        {appt.syncStatus === 'pending_push' ? 'Waiting for connection...' : 'Assigning Doctor...'}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, marginBottom: '1.25rem' }}>
                    <Calendar size={16} color="var(--accent)" />
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, marginBottom: '1.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span> 
                    <span style={{ color: displayStatus.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {displayStatus.icon} {displayStatus.label}
                    </span>
                  </div>

                  {appt.status === 'confirmed' && (
                    <div className="flex flex-col items-center mt-4">
                      {isBefore && (
                         <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.5rem' }}>
                           Starts at {scheduledAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                      )}
                      
                      {isDuring || appt.preferredMode === 'async_chat' ? (
                        <button onClick={() => navigate(`/consultation/${appt.id}${appt.preferredMode === 'async_chat' ? '?mode=async' : ''}`)} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontWeight: 700 }}>
                          {appt.preferredMode === 'async_chat' ? <Activity size={18} /> : <Video size={18} />} 
                          {appt.preferredMode === 'async_chat' ? 'Open Chat' : 'Join Consultation'}
                        </button>
                      ) : isAfter ? (
                        <button disabled className="btn" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontWeight: 700, backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed', border: 'none' }}>
                          <Video size={18} /> Ended
                        </button>
                      ) : (
                        <button onClick={() => navigate(`/consultation/${appt.id}`)} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontWeight: 700 }}>
                          <Video size={18} /> Join Consultation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Quick Action Cards Grid */}
      <div id="section-slots" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '3rem', scrollMarginTop: '2rem' }}>
        {/* Card 1: Find a Doctor */}
        <div className="glass-panel" style={{ padding: '1.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
              <Activity size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Smart Intake & Routing
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Enter your symptoms and our recommendation engine will find the perfect specialist for you.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/triage')}
            className="btn btn-primary"
            style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <Search size={18} /> Find Recommended Doctors
          </button>
        </div>
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
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-surface)' 
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



      {/* Doctors Section */}
      <div id="section-doctors" style={{ scrollMarginTop: '2rem' }}>
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
