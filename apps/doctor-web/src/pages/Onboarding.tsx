import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Building2, GraduationCap, Briefcase, FileBadge, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const Onboarding: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // If they are already pending or verified, kick them out of onboarding
  useEffect(() => {
    if (profile && profile.verificationStatus !== 'draft') {
      navigate('/');
    }
  }, [profile, navigate]);

  const [formData, setFormData] = useState({
    hospital: '',
    isPartTime: false,
    speciality: '',
    education: '',
    experience: '',
    registration: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/doctors/me/profile', {
        facilityName: formData.hospital,
        isPartTime: formData.isPartTime,
        speciality: formData.speciality,
        educationBackground: formData.education,
        experienceYears: parseInt(formData.experience) || 0,
        registrationNumber: formData.registration,
        // Send default required fields for profile completion
        fullName: profile?.fullName || user?.displayName || '',
        languagesSpoken: ['English'],
        supportedModes: ['video', 'audio']
      });

      // Force a reload to get the new status
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit application');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!profile) return null;

  return (
    <div className="app-container" style={{ background: '#f3f4f6' }}>
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '4rem 1rem' }}>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{ width: '100%', maxWidth: '700px', background: '#ffffff', padding: '3rem' }}
        >
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Complete Your Application</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Welcome to MedLink, Dr. {profile.fullName || user?.displayName}. To ensure the highest quality of care, we require all practitioners to verify their credentials.
            </p>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="var(--accent)" /> Professional Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="input-label">Primary Hospital / Clinic</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} required className="input-field" style={{ paddingLeft: '2.75rem' }} placeholder="Apollo Hospital" />
                </div>
              </div>
              
              <div>
                <label className="input-label">Speciality</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="speciality" value={formData.speciality} onChange={handleChange} required className="input-field" style={{ paddingLeft: '2.75rem' }} placeholder="Cardiology" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input type="checkbox" name="isPartTime" id="isPartTime" checked={formData.isPartTime} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              <div>
                <label htmlFor="isPartTime" style={{ fontWeight: 600, display: 'block' }}>I will be working part-time on MedLink</label>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Check this if you are balancing this with your primary hospital practice.</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={20} color="var(--accent)" /> Qualifications & Experience
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Educational Background</label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="education" value={formData.education} onChange={handleChange} required className="input-field" style={{ paddingLeft: '2.75rem' }} placeholder="MBBS, MD Cardiology (AIIMS)" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              <div>
                <label className="input-label">Years of Experience</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="number" name="experience" value={formData.experience} onChange={handleChange} required min="0" className="input-field" style={{ paddingLeft: '2.75rem' }} placeholder="10" />
                </div>
              </div>
              
              <div>
                <label className="input-label">Medical Registration No.</label>
                <div style={{ position: 'relative' }}>
                  <FileBadge size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="registration" value={formData.registration} onChange={handleChange} required className="input-field" style={{ paddingLeft: '2.75rem' }} placeholder="MCI-123456" />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                By submitting, you consent to background verification by our administration team. This process usually takes 24-48 hours.
              </p>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem' }}>
                {loading ? <div className="spinner"></div> : 'Submit Application'}
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </div>
  );
};
