import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Activity, FileHeart, Droplet, Ruler, Scale, 
  Phone, MapPin, AlertCircle, CheckCircle2, Shield, 
  Pill, Scissors, HeartPulse, Cigarette, Wine, Utensils, 
  FileText, Sparkles, Save 
} from 'lucide-react';

interface PatientProfileData {
  id?: string;
  fullName?: string;
  email?: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  height?: number | string | null;
  weight?: number | string | null;
  allergies?: string[] | string | null;
  chronicConditions?: string[] | string | null;
  currentMedications?: string[] | string | null;
  pastSurgeries?: string[] | string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  address?: string | null;
  smokingStatus?: string | null;
  alcoholStatus?: string | null;
  dietPreference?: string | null;
  abhaId?: string | null;
  insurancePolicyNumber?: string | null;
  locationDistrict?: string | null;
}

export const HealthProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    height: "",
    weight: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    pastSurgeries: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    address: "",
    smokingStatus: "",
    alcoholStatus: "",
    dietPreference: "",
    abhaId: "",
    insurancePolicyNumber: "",
    locationDistrict: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/patients/me');
        if (res.data.data) {
          const d: PatientProfileData = res.data.data;
          setFormData({
            fullName: d.fullName || user?.displayName || "",
            gender: d.gender || "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : "",
            bloodGroup: d.bloodGroup || "",
            height: d.height ? String(d.height) : "",
            weight: d.weight ? String(d.weight) : "",
            allergies: Array.isArray(d.allergies) ? d.allergies.join(', ') : (d.allergies || ""),
            chronicConditions: Array.isArray(d.chronicConditions) ? d.chronicConditions.join(', ') : (d.chronicConditions || ""),
            currentMedications: Array.isArray(d.currentMedications) ? d.currentMedications.join(', ') : (d.currentMedications || ""),
            pastSurgeries: Array.isArray(d.pastSurgeries) ? d.pastSurgeries.join(', ') : (d.pastSurgeries || ""),
            emergencyContactName: d.emergencyContactName || "",
            emergencyContactPhone: d.emergencyContactPhone || "",
            address: d.address || "",
            smokingStatus: d.smokingStatus || "",
            alcoholStatus: d.alcoholStatus || "",
            dietPreference: d.dietPreference || "",
            abhaId: d.abhaId || "",
            insurancePolicyNumber: d.insurancePolicyNumber || "",
            locationDistrict: d.locationDistrict || "",
          });
        }
      } catch (err) {
        console.error('Failed to fetch patient health profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Live BMI Calculation
  const heightM = Number(formData.height) ? Number(formData.height) / 100 : 0;
  const weightKg = Number(formData.weight) || 0;
  const bmi = (heightM > 0 && weightKg > 0) ? (weightKg / (heightM * heightM)).toFixed(1) : null;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: '#f59e0b' };
    if (val < 24.9) return { label: 'Normal Weight', color: '#10b981' };
    if (val < 29.9) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obese', color: '#ef4444' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.put('/patients/me', {
        ...formData,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
      });

      setSuccessMsg("Your complete health dossier was saved securely to the database!");
      if (res.data.data) {
        const d = res.data.data;
        setFormData(prev => ({
          ...prev,
          fullName: d.fullName || prev.fullName,
        }));
      }
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error('Failed to update patient profile', err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Failed to save health profile. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1050px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(37,99,235,0.2)' }}>
          <Activity color="white" size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>Comprehensive Health Dossier</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>
            Your complete medical history, biometric vitals, and emergency details shared securely with your consulting doctors.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#10b981', borderRadius: '14px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <CheckCircle2 size={22} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '14px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <AlertCircle size={22} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Section 1: Demographics & Contact */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
            <User size={20} color="var(--accent)" /> 1. Personal & Contact Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Full Name</label>
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                placeholder="e.g. Rahul Sharma" 
                className="form-input" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                value={user?.email || "patient@medlink.com"} 
                disabled 
                className="form-input" 
                style={{ opacity: 0.7, cursor: 'not-allowed' }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="form-input" required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Non-Binary</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Date of Birth</label>
              <input 
                type="date" 
                name="dateOfBirth" 
                value={formData.dateOfBirth} 
                onChange={handleChange} 
                className="form-input" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-input" required>
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>City / District</label>
              <input 
                type="text" 
                name="locationDistrict" 
                value={formData.locationDistrict} 
                onChange={handleChange} 
                placeholder="e.g. Mumbai Suburban" 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Full Residential Address</label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                placeholder="Flat 402, Sunshine Heights, Andheri West" 
                className="form-input" 
              />
            </div>
          </div>
        </div>

        {/* Section 2: Biometrics & BMI */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
            <HeartPulse size={20} color="#10b981" /> 2. Biometric Vitals & BMI
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Ruler size={16} color="var(--accent)" /> Height (cm)
              </label>
              <input 
                type="number" 
                name="height" 
                value={formData.height} 
                onChange={handleChange} 
                placeholder="e.g. 175" 
                className="form-input" 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Scale size={16} color="var(--accent)" /> Weight (kg)
              </label>
              <input 
                type="number" 
                name="weight" 
                value={formData.weight} 
                onChange={handleChange} 
                placeholder="e.g. 70" 
                className="form-input" 
              />
            </div>

            {/* Live BMI Display Card */}
            <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calculated Body Mass Index</div>
              {bmi ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{bmi}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getBmiCategory(Number(bmi)).color }}>
                    {getBmiCategory(Number(bmi)).label}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enter height & weight</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Clinical & Medical History */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
            <FileHeart size={20} color="#ef4444" /> 3. Medical History & Current Regimen
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} color="#ef4444" /> Known Allergies (Drugs, Food, Environmental)
              </label>
              <textarea 
                name="allergies" 
                value={formData.allergies} 
                onChange={handleChange} 
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Shellfish (comma separated)" 
                className="form-input" 
                style={{ minHeight: '90px', resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={15} color="#f59e0b" /> Chronic Conditions & Long-Term Illnesses
              </label>
              <textarea 
                name="chronicConditions" 
                value={formData.chronicConditions} 
                onChange={handleChange} 
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, Hypothyroidism" 
                className="form-input" 
                style={{ minHeight: '90px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Pill size={15} color="var(--accent)" /> Current Daily Medications & Dosages
              </label>
              <textarea 
                name="currentMedications" 
                value={formData.currentMedications} 
                onChange={handleChange} 
                placeholder="e.g. Metformin 500mg (1-0-1), Telmisartan 40mg (1-0-0)" 
                className="form-input" 
                style={{ minHeight: '90px', resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Scissors size={15} color="#6366f1" /> Past Surgeries & Major Hospitalizations
              </label>
              <textarea 
                name="pastSurgeries" 
                value={formData.pastSurgeries} 
                onChange={handleChange} 
                placeholder="e.g. Appendectomy (2020), Knee Arthroscopy (2023)" 
                className="form-input" 
                style={{ minHeight: '90px', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Contacts & Lifestyle */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
            <Phone size={20} color="#6366f1" /> 4. Emergency Contacts & Lifestyle
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Emergency Contact Person & Relation</label>
              <input 
                type="text" 
                name="emergencyContactName" 
                value={formData.emergencyContactName} 
                onChange={handleChange} 
                placeholder="e.g. Sunita Sharma (Spouse)" 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Emergency Contact Phone</label>
              <input 
                type="text" 
                name="emergencyContactPhone" 
                value={formData.emergencyContactPhone} 
                onChange={handleChange} 
                placeholder="e.g. +91 98765 43210" 
                className="form-input" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Smoking Status</label>
              <select name="smokingStatus" value={formData.smokingStatus} onChange={handleChange} className="form-input">
                <option value="">Select</option>
                <option value="Non-Smoker">Non-Smoker</option>
                <option value="Occasional">Occasional Smoker</option>
                <option value="Regular">Regular Smoker</option>
                <option value="Former Smoker">Former Smoker (Quit)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Alcohol Intake</label>
              <select name="alcoholStatus" value={formData.alcoholStatus} onChange={handleChange} className="form-input">
                <option value="">Select</option>
                <option value="Never">Never / Teetotaler</option>
                <option value="Socially">Social / Occasional</option>
                <option value="Regular">Regular</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Diet Preference</label>
              <select name="dietPreference" value={formData.dietPreference} onChange={handleChange} className="form-input">
                <option value="">Select</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Eggitarian">Eggitarian</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Government Identifiers & Insurance */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
            <Shield size={20} color="var(--accent)" /> 5. Ayushman Bharat (ABHA) & Insurance Identifiers
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>ABHA Health ID (Ayushman Bharat)</label>
              <input 
                type="text" 
                name="abhaId" 
                value={formData.abhaId} 
                onChange={handleChange} 
                placeholder="e.g. 91-1234-5678-9012 or user@abdm" 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Health Insurance Policy Number</label>
              <input 
                type="text" 
                name="insurancePolicyNumber" 
                value={formData.insurancePolicyNumber} 
                onChange={handleChange} 
                placeholder="e.g. HDFC-ERGO-MED-89104" 
                className="form-input" 
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={saving} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2.5rem', fontSize: '1.05rem', fontWeight: 700 }}
          >
            {saving ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              <><Save size={20} /> Save Complete Health Profile</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
export default HealthProfile;
