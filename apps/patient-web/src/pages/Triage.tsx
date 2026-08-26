import React, { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, User, MapPin, Activity, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RecommendedDoctor {
  doctorId: string;
  fullName: string;
  speciality: string;
  matchScore: number;
}

export const Triage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [concern, setConcern] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [preferredMode, setPreferredMode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    suggestedSpeciality: string;
    explanation: string;
    recommendations: RecommendedDoctor[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concern) return;

    setLoading(true);
    try {
      const res = await api.post('/recommendations', {
        concernCategory: concern,
        preferredLanguage: preferredLanguage || undefined,
        preferredMode: preferredMode || undefined
      });
      setResults(res.data);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={32} color="var(--accent)" /> Intake & Routing
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Describe your symptoms or concerns, and our data-driven engine will recommend the best specialist for you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr 1fr' : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
        {/* Intake Form */}
        <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Patient Intake Form</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="form-group">
              <label className="form-label">What is your primary concern?</label>
              <select 
                className="form-input" 
                value={concern} 
                onChange={(e) => setConcern(e.target.value)}
                required
              >
                <option value="">Select a concern category...</option>
                <option value="skin concern">Skin Issues / Rash</option>
                <option value="fever">Fever / Infection</option>
                <option value="heart issue">Chest Pain / Heart</option>
                <option value="headache">Headache / Migraine</option>
                <option value="child health">Child Health</option>
                <option value="bone pain">Joint or Bone Pain</option>
                <option value="eye issue">Eye Problems</option>
                <option value="mental health">Mental Health</option>
                <option value="pregnancy">Pregnancy / Women's Health</option>
                <option value="other">Other / General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Language (Optional)</label>
              <select className="form-input" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
                <option value="">Any Language</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Consultation Mode (Optional)</label>
              <select className="form-input" value={preferredMode} onChange={(e) => setPreferredMode(e.target.value)}>
                <option value="">Any Mode</option>
                <option value="video">Video Call</option>
                <option value="audio">Audio Call</option>
                <option value="async_chat">Text Chat</option>
                <option value="offline">In-person</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.85rem' }} disabled={loading}>
              {loading ? 'Analyzing...' : 'Find Specialists'}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        {results && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} /> Recommended Speciality: {results.suggestedSpeciality}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{results.explanation}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Top Matches</h3>
              
              {results.recommendations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No specialists found matching your exact criteria. Please try broadening your search.
                </div>
              ) : (
                results.recommendations.map(doc => (
                  <div key={doc.doctorId} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <User size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.15rem 0', fontWeight: 700, fontSize: '1.05rem' }}>Dr. {doc.fullName}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{doc.speciality}</span>
                          <span>•</span>
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Match Score: {doc.matchScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/doctor/${doc.doctorId}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                      View Profile
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Triage;
