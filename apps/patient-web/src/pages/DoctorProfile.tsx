import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { syncManager } from '../lib/sync/SyncManager';
import { User, MapPin, Clock, ArrowLeft, CalendarPlus, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Doctor {
  id: string;
  fullName: string;
  speciality: string;
  facilityName: string | null;
  languagesSpoken: string[];
  consultationFee: number;
  bio: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  supportedModes: string[];
  status: string;
}

export const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSlot, setSelectedSlot] = useState<string>(searchParams.get('slotId') || '');
  const [concern, setConcern] = useState('general_consultation');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRes = await api.get(`/doctors/${id}`);
        setDoctor(docRes.data);

        const slotRes = await api.get(`/doctors/${id}/availability`);
        const availableSlots = slotRes.data.data || [];
        setSlots(availableSlots);

        const slotParam = searchParams.get('slotId');
        if (slotParam && availableSlots.some((s: any) => s.id === slotParam)) {
          setSelectedSlot(slotParam);
        } else if (availableSlots.length > 0) {
          setSelectedSlot(availableSlots[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch doctor", err);
        setError('Failed to load doctor profile. They might not be verified yet.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, searchParams]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const slot = slots.find((s: Slot) => s.id === selectedSlot);
      const payload = {
        doctorId: id,
        slotId: selectedSlot,
        scheduledAt: slot?.startsAt,
        concernCategory: concern,
        preferredMode: 'video'
      };

      if (!navigator.onLine) {
        // Offline: Enqueue appointment and bypass payment gateway
        await syncManager.enqueueOperation('appointment', 'CREATE', payload);
        setBookingSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1800);
        return;
      }

      // Online: Direct API call
      const apptRes = await api.post('/appointments', payload);
      const appointmentId = apptRes.data.id;

      // Create Payment Order (Mocking the process for testing)
      // This bypasses Razorpay entirely and uses our mock endpoint
      
      // We simulate a short delay for the fake payment processing
      setTimeout(async () => {
        try {
          await api.post(`/appointments/${appointmentId}/mock-payment`);
          setBookingSuccess(true);
          setTimeout(() => {
            navigate('/');
          }, 1800);
        } catch (verifyErr) {
          console.error(verifyErr);
          setError('Mock Payment verification failed.');
          setBooking(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to book appointment.');
      setBooking(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

  if (error && !doctor) return (
    <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}><ArrowLeft size={18} /> Back</button>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto', color: '#ef4444' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {bookingSuccess && (
        <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#10b981', borderRadius: '16px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle2 size={28} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Payment Successful & Appointment Confirmed!</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Redirecting you to your patient dashboard...</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel" 
          style={{ padding: '2.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={40} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dr. {doctor?.fullName}</h1>
              <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{doctor?.speciality}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {doctor?.facilityName || 'Independent Practice'}</span>
              </div>
            </div>
            
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{t('booking.consultationFee')}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{doctor?.consultationFee}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Fake Payment: ₹1 (Testing)</div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('booking.about')}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{doctor?.bio || 'Verified medical professional providing consultations on MedLink.'}</p>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('booking.languagesSpoken')}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {doctor?.languagesSpoken?.map((lang: string) => (
                <span key={lang} style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-surface-elevated)', borderRadius: '16px', fontSize: '0.875rem' }}>{lang}</span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel" 
          style={{ padding: '2.5rem' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarPlus size={24} color="var(--accent)" /> {t('booking.bookAppointment')}
          </h2>

          <form onSubmit={handleBook}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">{t('booking.selectReason')}</label>
              <select className="input-field" value={concern} onChange={(e) => setConcern(e.target.value)} required>
                <option value="general_consultation">General Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="prescription_renewal">Prescription Renewal</option>
                <option value="second_opinion">Second Opinion</option>
                <option value="urgent_care">Urgent Care</option>
              </select>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label className="input-label">{t('booking.availableTimeSlots')}</label>
              {slots.length === 0 ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-surface-elevated)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('booking.noSlots')}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {slots.map((slot: Slot) => {
                    const isSelected = selectedSlot === slot.id;
                    const dateObj = new Date(slot.startsAt);
                    return (
                      <div 
                        key={slot.id} 
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedSlot(slot.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSlot(slot.id); } }}
                        style={{ 
                          padding: '1rem', 
                          border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface)',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text-main)', marginBottom: '0.25rem' }}>
                          {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          <Clock size={14} />
                          <span>{dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sparkles size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Mock Payment Enabled:</strong> Clicking confirm will simulate a ₹1 payment instantly without opening Razorpay.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}
              disabled={booking || !selectedSlot}
            >
              {booking ? <div className="spinner"></div> : 'Proceed to Pay ₹1 & Confirm Booking'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
export default DoctorProfile;
