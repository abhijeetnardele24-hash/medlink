import { useState, useEffect } from 'react';
import { User, BookOpen, Stethoscope, Briefcase, Phone, MapPin } from 'lucide-react';
import { api } from '../lib/api';

interface DoctorProfile {
  fullName: string;
  speciality: string;
  facilityName: string;
  languagesSpoken: string[];
  supportedModes: string[];
  verificationStatus: string;
  bio: string;
  contactNumber: string;
  registrationNumber: string;
  educationBackground: string;
  experienceYears: number;
  isPartTime: boolean;
}

export const Profile = () => {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/doctors/me');
        setProfile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>View your professional information and status.</p>
        </div>
        <div style={{ 
          padding: '0.5rem 1rem', 
          borderRadius: '999px', 
          fontSize: '0.875rem', 
          fontWeight: 600,
          background: profile.verificationStatus === 'verified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color: profile.verificationStatus === 'verified' ? '#6ee7b7' : '#fcd34d',
          border: `1px solid ${profile.verificationStatus === 'verified' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
          textTransform: 'uppercase'
        }}>
          {profile.verificationStatus.replace('_', ' ')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Column: Avatar & Quick Info */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: 'var(--surface-border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '2px solid var(--primary)'
          }}>
            <User size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Dr. {profile.fullName}</h2>
          <p style={{ color: 'var(--primary)', fontWeight: 500, margin: '0 0 1.5rem 0' }}>{profile.speciality}</p>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginTop: '1rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <Phone size={18} /> <span>{profile.contactNumber}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <MapPin size={18} /> <span>{profile.facilityName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <Stethoscope size={18} /> <span>{profile.experienceYears} Years Exp.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="var(--primary)" /> Professional Background
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Education</label>
                <div style={{ fontWeight: 500 }}>{profile.educationBackground}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Registration Number</label>
                <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{profile.registrationNumber}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Employment Type</label>
                <div style={{ fontWeight: 500 }}>{profile.isPartTime ? 'Part-Time' : 'Full-Time'}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="var(--primary)" /> Practice Details
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Languages Spoken</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.languagesSpoken.map(lang => (
                  <span key={lang} style={{ padding: '0.25rem 0.75rem', background: 'var(--surface-hover)', borderRadius: '999px', fontSize: '0.875rem' }}>
                    {lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Supported Consultation Modes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.supportedModes.map(mode => (
                  <span key={mode} style={{ padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', borderRadius: '999px', fontSize: '0.875rem' }}>
                    {mode.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {profile.bio && (
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Biography</label>
                <p style={{ lineHeight: 1.6, margin: 0, color: 'var(--text-main)' }}>{profile.bio}</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
