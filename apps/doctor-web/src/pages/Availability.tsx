import type { FormEvent } from 'react';
import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { api } from '../lib/api';

export const Availability = () => {
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleGenerateSlots = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) {
      setMessage({ text: 'Please select a date first.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Calculate startsAt and endsAt ISO strings
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      // Generate a 30-min slot. In a real app we'd loop and generate multiple.
      // For this demo, we'll just create a single chunk slot from start to end.
      await api.post('/doctors/me/availability', {
        startsAt: startDateTime.toISOString(),
        endsAt: endDateTime.toISOString(),
        supportedModes: ['video', 'audio', 'async_chat']
      });
      
      setMessage({ text: `Successfully generated availability for ${date} from ${startTime} to ${endTime}!`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || err.message || 'Failed to generate availability. Are you verified by the coordinator?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Manage Availability</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Publish open slots for patients to book.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <CalendarIcon size={32} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Publish Open Slots</h3>
            <p style={{ color: 'var(--text-muted)' }}>Patients can only book appointments during the slots you generate here.</p>
          </div>
        </div>

        {message.text && (
          <div style={{ 
            padding: '1rem', 
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: message.type === 'error' ? '#fca5a5' : '#6ee7b7',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
            borderRadius: '8px', 
            marginBottom: '2rem' 
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleGenerateSlots}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label" htmlFor="date">Working Date</label>
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
              <label className="input-label" htmlFor="startTime">Start Time</label>
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
              <label className="input-label" htmlFor="endTime">End Time</label>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
            ) : (
              <><Plus size={18} /> Generate Open Slot</>
            )}
          </button>
        </form>
      </div>

    </div>
  );
};
