import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Search, User, Calendar, Mail, RefreshCw } from 'lucide-react';
import { Patient, Appointment } from '../types';

export const PatientsDirectory: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPatients = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Derive patient list from all appointments
      const res = await api.get('/admin/appointments');
      const appts: Appointment[] = res.data || [];
      const unique = new Map<string, Patient>();
      appts.forEach((a) => {
        if (a.patient && !unique.has(a.patient.id)) {
          unique.set(a.patient.id, { ...a.patient, lastSeen: a.scheduledAt, concern: a.concernCategory });
        }
      });
      setPatients(Array.from(unique.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = patients.filter(p =>
    (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users color="var(--primary)" size={32} /> Patient Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>
            {patients.length} registered patients
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.75rem 1rem', gap: '0.5rem' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '220px', fontSize: '0.9rem' }}
            />
          </div>
          <button onClick={() => fetchPatients(true)} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {search ? 'No matches found' : 'No Patients Yet'}
          </h3>
          <p>{search ? 'Try a different search term.' : 'Patients will appear here once appointments are created.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.15rem' }}>{p.fullName || 'Unknown'}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {p.id?.substring(0, 12)}...</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                {p.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} /> {p.email}
                  </div>
                )}
                {p.lastSeen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} /> Last appt: {new Date(p.lastSeen).toLocaleDateString()}
                  </div>
                )}
                {p.concern && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {p.concern.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
