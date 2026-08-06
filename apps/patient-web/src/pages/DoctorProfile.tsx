import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { User, MapPin, Clock, ArrowLeft, CalendarPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Doctor {
  id: string;
  fullName: string;
  speciality: string;
  facilityName: string | null;
  languagesSpoken: string[];
  bio: string | null;
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
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [concern, setConcern] = useState('general_consultation');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRes = await api.get(`/doctors/${id}`);
        setDoctor(docRes.data);

        const slotRes = await api.get(`/doctors/${id}/availability`);
        setSlots(slotRes.data.data);
      } catch (err) {
        console.error("Failed to fetch doctor", err);
        setError('Failed to load doctor profile. They might not be verified yet.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const slot = slots.find(s => s.id === selectedSlot);
      await api.post('/appointments', {
        doctorId: id,
        slotId: selectedSlot,
        scheduledAt: slot?.startsAt,
        concernCategory: concern,
        preferredMode: 'video'
      });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to book appointment.');
      setBooking(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

  if (error || !doctor) return (
    <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}><ArrowLeft size={18} /> Back</button>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto', color: '#ef4444' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="app-container" style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1.5rem', border: 'none' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel" 
          style={{ padding: '2.5rem', marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={40} color="var(--text-muted)" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dr. {doctor.fullName}</h1>
              <p style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '1.125rem', marginBottom: '0.75rem' }}>{doctor.speciality}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {doctor.facilityName || 'Independent Practice'}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>About</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{doctor.bio || 'No bio provided.'}</p>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Languages Spoken</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {doctor.languagesSpoken.map(lang => (
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
            <CalendarPlus size={24} color="var(--accent)" /> Book Appointment
          </h2>

          <form onSubmit={handleBook}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Select Reason for Visit</label>
              <select className="input-field" value={concern} onChange={(e) => setConcern(e.target.value)} required>
                <option value="general_consultation">General Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="prescription_renewal">Prescription Renewal</option>
                <option value="second_opinion">Second Opinion</option>
                <option value="urgent_care">Urgent Care</option>
              </select>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label className="input-label">Available Time Slots</label>
              {slots.length === 0 ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-surface-elevated)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No available slots found for this doctor.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {slots.map(slot => {
                    const isSelected = selectedSlot === slot.id;
                    const dateObj = new Date(slot.startsAt);
                    return (
                      <div 
                        key={slot.id} 
                        onClick={() => setSelectedSlot(slot.id)}
                        style={{ 
                          padding: '1rem', 
                          border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface)',
                          transition: 'all 0.2s'
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

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem' }}
              disabled={booking || !selectedSlot}
            >
              {booking ? <div className="spinner"></div> : 'Confirm Booking'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
