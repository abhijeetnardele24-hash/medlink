import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Activity, FileHeart, Droplet, Ruler, Scale } from 'lucide-react';

interface HealthProfileData {
  id: string;
  bloodGroup: string | null;
  height: string | null;
  weight: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  gender: string | null;
  dateOfBirth: string | null;
}

export const HealthProfile: React.FC = () => {
  const [profile, setProfile] = useState<HealthProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    bloodGroup: "",
    height: "",
    weight: "",
    allergies: "",
    chronicConditions: "",
    gender: "",
    dateOfBirth: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/patients/me');
        if (res.data.data) {
          setProfile(res.data.data);
          setFormData({
            bloodGroup: res.data.data.bloodGroup || "",
            height: res.data.data.height || "",
            weight: res.data.data.weight || "",
            allergies: res.data.data.allergies || "",
            chronicConditions: res.data.data.chronicConditions || "",
            gender: res.data.data.gender || "",
            dateOfBirth: res.data.data.dateOfBirth ? res.data.data.dateOfBirth.split('T')[0] : ""
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await api.put('/patients/me', formData);
      setSuccessMsg("Health profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity color="white" size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Health Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal health information</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="form-input">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Droplet size={16} color="#ef4444" /> Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-input">
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ruler size={16} /> Height (cm)</label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 175" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scale size={16} /> Weight (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 70" className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileHeart size={16} /> Allergies</label>
            <textarea 
              name="allergies" 
              value={formData.allergies} 
              onChange={handleChange} 
              placeholder="List any drug or food allergies (or leave blank if none)" 
              className="form-input" 
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> Chronic Conditions</label>
            <textarea 
              name="chronicConditions" 
              value={formData.chronicConditions} 
              onChange={handleChange} 
              placeholder="e.g. Hypertension, Diabetes, Asthma" 
              className="form-input" 
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: '150px' }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
