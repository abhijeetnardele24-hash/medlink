import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Availability: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setMessage({ text: 'Please select a date first.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // In a real app, this would hit POST /api/doctors/availability
      // But since we just want to stub it for the UI demo, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ text: `Successfully generated 30-minute slots for ${date} from ${startTime} to ${endTime}!`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to generate availability slots.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-base)' }}>
      {/* Premium Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Manage Availability</h2>
        </div>
      </header>

      <main className="main-content fade-in" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '2rem' }}>
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
                <><Plus size={18} /> Generate 30-Minute Slots</>
              )}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
};
