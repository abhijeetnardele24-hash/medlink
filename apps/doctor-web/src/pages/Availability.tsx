import type { FormEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle, 
  AlertCircle, Video, Smartphone, Users, RefreshCw 
} from 'lucide-react';
import { api } from '../lib/api';

interface Slot {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  supportedModes: string[];
  status: 'available' | 'booked' | 'blocked';
  createdAt: string;
}

export const Availability: React.FC = () => {
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [slotDuration, setSlotDuration] = useState<number>(30); // 30 mins, 45 mins, 60 mins, or entire block
  const [splitSlots, setSplitSlots] = useState<boolean>(true);
  const [selectedModes, setSelectedModes] = useState<string[]>(['video', 'audio', 'async_chat']);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMySlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await api.get('/doctors/me/availability');
      setSlots(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch availability slots', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    // Set default date to today's date in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);

    fetchMySlots();
  }, []);

  const handleToggleMode = (mode: string) => {
    if (selectedModes.includes(mode)) {
      if (selectedModes.length === 1) return;
      setSelectedModes(selectedModes.filter(m => m !== mode));
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
  };

  const handleGenerateSlots = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) {
      setMessage({ text: 'Please select a date first.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        throw new Error('End time must be strictly after start time');
      }

      if (splitSlots) {
        // Generate interval slots
        let current = new Date(startDateTime);
        const slotPromises = [];
        let count = 0;

        while (current.getTime() + slotDuration * 60000 <= endDateTime.getTime()) {
          const next = new Date(current.getTime() + slotDuration * 60000);
          slotPromises.push(
            api.post('/doctors/me/availability', {
              startsAt: current.toISOString(),
              endsAt: next.toISOString(),
              supportedModes: selectedModes,
            })
          );
          current = next;
          count++;
        }

        if (slotPromises.length === 0) {
          throw new Error('Time window is shorter than selected slot duration');
        }

        await Promise.all(slotPromises);
        setMessage({ 
          text: `Successfully published ${count} individual ${slotDuration}-minute consultation slots for ${date}!`, 
          type: 'success' 
        });
      } else {
        // Single chunk slot
        await api.post('/doctors/me/availability', {
          startsAt: startDateTime.toISOString(),
          endsAt: endDateTime.toISOString(),
          supportedModes: selectedModes,
        });

        setMessage({ 
          text: `Successfully published open window for ${date} from ${startTime} to ${endTime}!`, 
          type: 'success' 
        });
      }

      await fetchMySlots();
    } catch (err: any) {
      setMessage({ 
        text: err.response?.data?.error || err.message || 'Failed to generate availability slots.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to remove this open slot?')) return;
    setDeletingId(slotId);
    try {
      await api.delete(`/doctors/me/availability/${slotId}`);
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err: any) {
      alert('Failed to delete slot: ' + (err.response?.data?.error || 'Please try again.'));
    } finally {
      setDeletingId(null);
    }
  };

  const upcomingSlots = slots.filter(s => new Date(s.startsAt) >= new Date(Date.now() - 3600000));

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
            Manage Availability & Slots
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>
            Publish open consultation slots. Generated slots will automatically appear on the Patient Dashboard for instant booking.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Slot Generator Form */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '12px' }}>
              <CalendarIcon size={28} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Publish Open Slots</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Patients can book appointments during these hours.</p>
            </div>
          </div>

          {message.text && (
            <div style={{ 
              padding: '1rem 1.25rem', 
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              color: message.type === 'error' ? '#ef4444' : '#10b981',
              border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
              borderRadius: '10px', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.925rem'
            }}>
              {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleGenerateSlots}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label" htmlFor="date">Consultation Working Date</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <CalendarIcon size={18} />
                  </div>
                  <input 
                    id="date"
                    type="date" 
                    className="input-field" 
                    style={{ paddingLeft: '2.75rem', colorScheme: 'dark' }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="startTime">Window Start Time</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Clock size={18} />
                  </div>
                  <input 
                    id="startTime"
                    type="time" 
                    className="input-field" 
                    style={{ paddingLeft: '2.75rem', colorScheme: 'dark' }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="endTime">Window End Time</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Clock size={18} />
                  </div>
                  <input 
                    id="endTime"
                    type="time" 
                    className="input-field" 
                    style={{ paddingLeft: '2.75rem', colorScheme: 'dark' }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Slot Split Option */}
            <div style={{ background: 'var(--surface-hover)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Auto-Split into Appointment Slots</span>
                <input 
                  type="checkbox" 
                  checked={splitSlots} 
                  onChange={e => setSplitSlots(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
              </div>

              {splitSlots && (
                <div>
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Slot Duration</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[15, 30, 45].map(mins => (
                      <button
                        type="button"
                        key={mins}
                        onClick={() => setSlotDuration(mins)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: `1px solid ${slotDuration === mins ? 'var(--accent)' : 'var(--border)'}`,
                          background: slotDuration === mins ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
                          color: slotDuration === mins ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {mins} Minutes
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Supported Modes */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Allowed Consultation Modes</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'video', label: 'Video Consultation' },
                  { id: 'audio', label: 'Audio Consultation' },
                  { id: 'async_chat', label: 'Chat Only' }
                ].map(m => {
                  const isSelected = selectedModes.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => handleToggleMode(m.id)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '999px',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface-hover)',
                        color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.825rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '22px', height: '22px' }}></div>
              ) : (
                <><Plus size={18} /> Publish Open Slots</>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Published Slots List */}
        <div className="glass-panel" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Your Published Slots</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Active slots available for patients to book.</p>
            </div>
            <button onClick={fetchMySlots} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Refresh Slots">
              <RefreshCw size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loadingSlots ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
              </div>
            ) : upcomingSlots.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <CalendarIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>No Active Slots</p>
                <p style={{ fontSize: '0.825rem', margin: 0 }}>Use the form on the left to publish slots for patients.</p>
              </div>
            ) : (
              upcomingSlots.map(slot => {
                const startDate = new Date(slot.startsAt);
                const endDate = new Date(slot.endsAt);
                const isBooked = slot.status === 'booked';

                return (
                  <div 
                    key={slot.id} 
                    style={{ 
                      padding: '1rem', 
                      background: 'var(--surface-hover)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '999px', 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          background: isBooked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isBooked ? '#ef4444' : '#10b981'
                        }}>
                          {slot.status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        <Clock size={13} />
                        <span>
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {!isBooked && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingId === slot.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Cancel this slot"
                      >
                        {deletingId === slot.id ? (
                          <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
export default Availability;
