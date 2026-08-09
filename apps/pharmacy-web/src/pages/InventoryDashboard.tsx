
import { auth } from '../lib/firebase';
import { LogOut, Package } from 'lucide-react';
import type { UserProfile } from '../App';
import type { User } from 'firebase/auth';

export function InventoryDashboard({ user }: { user: User, profile: UserProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={24} color="var(--accent)" />
          <h2 style={{ margin: 0 }}>MedLink Seller Portal</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
          <button className="btn btn-secondary" onClick={() => auth.signOut()}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Inventory Dashboard</h1>
          <button className="btn btn-primary">Add Medicine</button>
        </div>
        
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Inventory management coming soon.</p>
        </div>
      </main>
    </div>
  );
}
