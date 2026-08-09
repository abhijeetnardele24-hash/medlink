import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      
      await api.post('/auth/register', {
        idToken: token,
        role: 'pharmacist',
        displayName: fullName,
        contactNumber,
        shopName,
        registeredAddress
      });
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Signup failed');
      // If our API failed, delete the firebase user to maintain sync
      if (auth.currentUser && err.response) {
        await auth.currentUser.delete();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '2rem 0' }}>
      <form onSubmit={handleSignup} style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Package size={32} color="var(--accent)" />
          <h2 style={{ margin: 0 }}>MedLink Pharmacy</h2>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Create your Seller Portal account</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contact Number</label>
            <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="input-field" required />
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required minLength={6} />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Pharmacy/Shop Name</label>
          <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} className="input-field" required />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Registered Address</label>
          <textarea value={registeredAddress} onChange={e => setRegisteredAddress(e.target.value)} className="input-field" required rows={2}></textarea>
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
        <p style={{ textAlign: 'center', margin: 0, fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
