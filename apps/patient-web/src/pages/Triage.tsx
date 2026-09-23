import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, User, ArrowRight, HeartPulse, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

export const Triage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    recommendationReason: string;
    speciality: string;
    data: any[];
  } | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const res = await api.get(`/doctors/recommend?query=${encodeURIComponent(query)}`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', margin: '0 auto 1.25rem' }}>
          <Stethoscope size={32} />
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Find the Right Doctor
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
          Describe your symptoms or health concern, and our engine will instantly match you with the appropriate specialist.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', background: 'var(--bg-surface)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="e.g. I have a severe headache and dizziness"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                fontSize: '1.1rem',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !query.trim()}
            style={{ padding: '0 2rem', fontSize: '1.1rem', fontWeight: 700, minWidth: '150px' }}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }} /> : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {result && (
        <div className="fade-in">
          <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> Recommended Speciality: {result.speciality}
            </h3>
            <p style={{ color: '#047857', margin: 0, fontWeight: 500 }}>
              {result.recommendationReason}
            </p>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--accent)" /> Available Specialists
          </h2>

          {result.data.length === 0 ? (
             <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
               <HeartPulse size={48} style={{ margin: '0 auto 1rem', opacity: 0.15 }} />
               <p>No verified doctors available in this speciality right now.</p>
             </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {result.data.map(doctor => (
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

                  <Link to={`/doctor/${doctor.id}`} className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Book Appointment <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
