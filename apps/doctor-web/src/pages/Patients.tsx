import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Search, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient, Appointment } from '../types';

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app we'd have a specific /patients endpoint for doctors
    // Here we derive it from appointments for simplicity
    const fetchPatients = async () => {
      try {
        const res = await api.get('/appointments');
        const appts: Appointment[] = res.data.data || [];
        
        // Extract unique patients
        const unique = new Map<string, Patient>();
        appts.forEach((a) => {
          if (a.patient && !unique.has(a.patient.id)) {
            unique.set(a.patient.id, a.patient);
          }
        });
        
        setPatients(Array.from(unique.values()));
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users color="var(--accent)" /> My Patients
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>View your patient roster and medical histories.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input type="text" placeholder="Search patients..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : patients.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>No Patients Yet</h3>
          <p>You haven't seen any patients yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {patients.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="var(--text-muted)" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{p.fullName || 'Unknown'}</h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Patient ID: {p.id.substring(0, 8)}</div>
                </div>
              </div>
              <button onClick={() => navigate(`/patients/${p.id}`)} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
