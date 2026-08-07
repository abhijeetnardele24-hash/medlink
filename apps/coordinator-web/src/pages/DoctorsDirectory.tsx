import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, UserX } from 'lucide-react';
import type { Doctor } from '../types';

export const DoctorsDirectory: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // We'll fetch from the public doctors route, which only returns verified ones
        // In a real app, an admin route like /admin/doctors would return all of them including suspended.
        const res = await api.get('/doctors');
        if (res.data && res.data.data) {
          setDoctors(res.data.data.map((d: Doctor) => ({ ...d, verificationStatus: 'verified' })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(d => 
    d.fullName.toLowerCase().includes(search.toLowerCase()) || 
    (d.speciality ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Doctors Directory</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Manage all verified practitioners on the platform.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name or speciality..." 
            className="input-field"
            style={{ paddingLeft: '3rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : filteredDoctors.length === 0 ? (
        <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No doctors found.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Doctor Name</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Speciality</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Facility</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor, i) => (
                <tr key={doctor.id} style={{ borderBottom: i === filteredDoctors.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Dr. {doctor.fullName}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{doctor.speciality}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{doctor.facilityName || 'Independent'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      Active
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', border: 'none' }} title="Suspend Doctor">
                      <UserX size={18} color="#ef4444" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
