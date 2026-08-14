import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, BookOpen, Stethoscope, Briefcase, Phone, MapPin, 
  Edit3, Check, X, Award, Globe, DollarSign, ShieldCheck, 
  Save, AlertCircle 
} from 'lucide-react';
import { api } from '../lib/api';

interface DoctorProfile {
  id?: string;
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
  consultationFee: number;
  isPartTime: boolean;
}

const AVAILABLE_SPECIALITIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics',
  'Gynecology',
  'Psychiatry',
  'ENT Specialist',
  'Ophthalmology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine'
];

const AVAILABLE_LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 
  'Telugu', 'Kannada', 'Bengali', 'Malayalam', 'Punjabi'
];

const CONSULTATION_MODES = [
  { id: 'video', label: 'Video Call' },
  { id: 'audio', label: 'Audio Call' },
  { id: 'async_chat', label: 'Async Chat' },
  { id: 'offline', label: 'In-Person Clinic' }
];

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<DoctorProfile>({
    fullName: '',
    speciality: 'General Practice',
    facilityName: '',
    languagesSpoken: ['English', 'Hindi'],
    supportedModes: ['video', 'audio', 'async_chat'],
    verificationStatus: 'verified',
    bio: '',
    contactNumber: '',
    registrationNumber: '',
    educationBackground: '',
    experienceYears: 5,
    consultationFee: 500,
    isPartTime: false,
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/doctors/me');
      const data = response.data;
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        speciality: data.speciality || 'General Practice',
        facilityName: data.facilityName || '',
        languagesSpoken: data.languagesSpoken && data.languagesSpoken.length > 0 ? data.languagesSpoken : ['English', 'Hindi'],
        supportedModes: data.supportedModes && data.supportedModes.length > 0 ? data.supportedModes : ['video', 'audio'],
        verificationStatus: data.verificationStatus || 'verified',
        bio: data.bio || '',
        contactNumber: data.contactNumber || '',
        registrationNumber: data.registrationNumber || '',
        educationBackground: data.educationBackground || '',
        experienceYears: data.experienceYears ?? 5,
        consultationFee: data.consultationFee ?? 500,
        isPartTime: Boolean(data.isPartTime),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleLanguage = (lang: string) => {
    setFormData(prev => {
      const exists = prev.languagesSpoken.includes(lang);
      if (exists) {
        return { ...prev, languagesSpoken: prev.languagesSpoken.filter(l => l !== lang) };
      } else {
        return { ...prev, languagesSpoken: [...prev.languagesSpoken, lang] };
      }
    });
  };

  const handleToggleMode = (mode: string) => {
    setFormData(prev => {
      const exists = prev.supportedModes.includes(mode);
      if (exists) {
        if (prev.supportedModes.length === 1) return prev; // Keep at least one
        return { ...prev, supportedModes: prev.supportedModes.filter(m => m !== mode) };
      } else {
        return { ...prev, supportedModes: [...prev.supportedModes, mode] };
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.patch('/doctors/me', formData);
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      </div>
    );
  }

  const doc = profile || formData;

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Header with Edit Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>View and manage your professional practice details.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            padding: '0.4rem 0.9rem', 
            borderRadius: '999px', 
            fontSize: '0.825rem', 
            fontWeight: 600,
            background: doc.verificationStatus === 'verified' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: doc.verificationStatus === 'verified' ? '#10b981' : '#f59e0b',
            border: `1px solid ${doc.verificationStatus === 'verified' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            textTransform: 'uppercase'
          }}>
            <ShieldCheck size={16} /> {doc.verificationStatus || 'VERIFIED'}
          </div>

          <button 
            onClick={() => setIsEditing(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
          >
            <Edit3 size={17} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Check size={20} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Main Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Avatar & Quick Info Card */}
        <div className="glass-panel" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 'fit-content' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '2px solid var(--accent)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
          }}>
            <User size={54} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>Dr. {doc.fullName || 'Doctor'}</h2>
          <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>{doc.speciality || 'General Practice'}</p>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', background: 'var(--surface-hover)', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            <DollarSign size={16} color="#10b981" /> ₹{doc.consultationFee || 500} / consultation
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              <Phone size={17} color="var(--accent)" /> 
              <span>{doc.contactNumber || 'Contact not added'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              <MapPin size={17} color="var(--accent)" /> 
              <span>{doc.facilityName || 'Independent Clinic / Online'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              <Stethoscope size={17} color="var(--accent)" /> 
              <span>{doc.experienceYears || 5} Years Clinical Experience</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Professional Background */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              <BookOpen size={20} color="var(--accent)" /> Professional Background
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Education / Degrees</label>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.educationBackground || 'MBBS, MD - General Medicine'}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Medical License / Registration No.</label>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--accent)' }}>{doc.registrationNumber || 'MCI-2024-DOC998'}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Employment Type</label>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.isPartTime ? 'Part-Time Practice' : 'Full-Time Practice'}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Experience</label>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.experienceYears || 5} Years</div>
              </div>
            </div>
          </div>

          {/* Practice & Consultation Details */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              <Briefcase size={20} color="var(--accent)" /> Practice Details & Consultation Modes
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>Languages Spoken</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {doc.languagesSpoken && doc.languagesSpoken.length > 0 ? (
                  doc.languagesSpoken.map(lang => (
                    <span key={lang} style={{ padding: '0.35rem 0.85rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '0.825rem', fontWeight: 600 }}>
                      {lang}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>English, Hindi</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>Supported Consultation Modes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {doc.supportedModes && doc.supportedModes.length > 0 ? (
                  doc.supportedModes.map(mode => (
                    <span key={mode} style={{ padding: '0.35rem 0.85rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '999px', fontSize: '0.825rem', fontWeight: 600 }}>
                      {mode.replace('_', ' ').toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Video Call, Audio Call, Async Chat</span>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>About / Bio</label>
              <p style={{ lineHeight: 1.6, margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {doc.bio || 'Dedicated healthcare professional delivering comprehensive patient-centered care and telehealth consultations.'}
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(15, 23, 42, 0.65)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 999999, 
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '780px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            padding: '2.5rem', 
            background: '#ffffff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '20px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            color: '#111827'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={22} color="var(--accent)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#111827' }}>Edit Professional Profile</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0 0', fontSize: '0.875rem' }}>Update your clinical info, consultation fees, and practice details.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(false)} 
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Row 1: Name & Speciality */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name (with Title)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.fullName} 
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                    placeholder="e.g. Dr. Aarav Sharma"
                    required 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Speciality</label>
                  <select 
                    className="input-field"
                    value={formData.speciality} 
                    onChange={e => setFormData({ ...formData, speciality: e.target.value })}
                  >
                    {AVAILABLE_SPECIALITIES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Phone & Facility */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">Contact Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.contactNumber} 
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} 
                    placeholder="e.g. +91 98765 43210" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Facility / Clinic Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.facilityName} 
                    onChange={e => setFormData({ ...formData, facilityName: e.target.value })} 
                    placeholder="e.g. Apollo Telehealth Clinic" 
                  />
                </div>
              </div>

              {/* Row 3: Fee & Experience & Employment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">Consultation Fee (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.consultationFee} 
                    onChange={e => setFormData({ ...formData, consultationFee: Number(e.target.value) })} 
                    placeholder="500" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Experience (Years)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.experienceYears} 
                    onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) })} 
                    placeholder="5" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Practice Type</label>
                  <select 
                    className="input-field"
                    value={formData.isPartTime ? 'part_time' : 'full_time'} 
                    onChange={e => setFormData({ ...formData, isPartTime: e.target.value === 'part_time' })}
                  >
                    <option value="full_time">Full-Time Practice</option>
                    <option value="part_time">Part-Time Practice</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Registration Number & Education */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">Medical Registration / License No.</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.registrationNumber} 
                    onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} 
                    placeholder="e.g. MCI-2024-DOC998" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Education Background / Degrees</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.educationBackground} 
                    onChange={e => setFormData({ ...formData, educationBackground: e.target.value })} 
                    placeholder="e.g. MBBS, MD - Internal Medicine" 
                  />
                </div>
              </div>

              {/* Languages Spoken (Selectable Chips) */}
              <div>
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Languages Spoken</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {AVAILABLE_LANGUAGES.map((lang: string) => {
                    const isSelected = formData.languagesSpoken.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => handleToggleLanguage(lang)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '999px',
                          border: `1.5px solid ${isSelected ? '#2563eb' : '#e5e7eb'}`,
                          background: isSelected ? '#eff6ff' : '#f9fafb',
                          color: isSelected ? '#2563eb' : '#4b5563',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Supported Consultation Modes */}
              <div>
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Supported Consultation Modes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CONSULTATION_MODES.map((mode: { id: string; label: string }) => {
                    const isSelected = formData.supportedModes.includes(mode.id);
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => handleToggleMode(mode.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '10px',
                          border: `1.5px solid ${isSelected ? '#2563eb' : '#e5e7eb'}`,
                          background: isSelected ? '#eff6ff' : '#f9fafb',
                          color: isSelected ? '#2563eb' : '#4b5563',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Biography */}
              <div className="input-group">
                <label className="input-label">Professional Bio / Clinical Summary</label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  value={formData.bio} 
                  onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                  placeholder="Share a brief overview of your clinical focus, expertise, and patient approach..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}
                  disabled={saving}
                >
                  {saving ? (
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  ) : (
                    <><Save size={18} /> Save Changes</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
export default Profile;
