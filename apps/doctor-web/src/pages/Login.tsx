import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-base) 0%, #1e1b4b 100%)' }}>
      
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'var(--primary)', filter: 'blur(150px)', borderRadius: '50%', opacity: 0.15, top: '-10%', left: '-10%' }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--secondary)', filter: 'blur(150px)', borderRadius: '50%', opacity: 0.1, bottom: '-10%', right: '-10%' }}></div>

      <div className="glass-panel fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <Stethoscope size={40} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MedLink Doctor Portal
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to manage your appointments</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </div>
              <input 
                id="email"
                type="email" 
                className="input-field" 
                placeholder="doctor@medlink.com"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="password">Password</label>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>Forgot?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input 
                id="password"
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
