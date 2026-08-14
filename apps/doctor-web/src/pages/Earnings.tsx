import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DollarSign, TrendingUp, CreditCard, Download, PlusCircle, Building2, Smartphone } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'upi' | 'card';
  accountNumber?: string;
  upiId?: string;
  isDefault: boolean;
}

interface Transaction {
  amount: number;
  updatedAt: string;
}

interface PayoutTransaction {
  amount: number;
  updatedAt: string;
  status: string;
}

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  thisMonthEarnings: number;
  recentTransactions: Transaction[];
  recentPayouts: PayoutTransaction[];
  monthlyData: { name: string; amount: number }[];
}

export const Earnings: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<EarningsData | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Link Account Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState<'bank_account' | 'upi'>('bank_account');
  const [linkData, setLinkData] = useState({ name: '', accountNumber: '', ifscCode: '', upiId: '' });
  const [linking, setLinking] = useState(false);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchEarnings = async () => {
    try {
      const [resData, resMethods] = await Promise.all([
        api.get(`/doctors/${profile?.id}/earnings`),
        api.get(`/doctors/${profile?.id}/payout-methods`)
      ]);
      setData(resData.data);
      setPayoutMethods(resMethods.data.data);
      if (resMethods.data.data.length > 0) {
        setSelectedMethodId(resMethods.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch earnings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }
    fetchEarnings();
  }, [profile, authLoading]);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    try {
      await api.post(`/doctors/${profile?.id}/payout-methods`, {
        type: linkType,
        ...linkData
      });
      setShowLinkModal(false);
      setLinkData({ name: '', accountNumber: '', ifscCode: '', upiId: '' });
      await fetchEarnings();
    } catch (err) {
      alert('Failed to link account. Please check details.');
    } finally {
      setLinking(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || !selectedMethodId) return;
    if (amount > (data?.availableBalance || 0)) {
      alert('Amount exceeds available balance.');
      return;
    }

    setWithdrawing(true);
    try {
      await api.post(`/doctors/${profile?.id}/withdraw`, {
        amount,
        payoutMethodId: selectedMethodId
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await fetchEarnings();
      alert('Withdrawal initiated successfully!');
    } catch (err: any) {
      alert('Withdrawal failed. ' + (err.response?.data?.error || 'Please try again.'));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>;
  }

  if (!profile) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Please complete your doctor profile to view earnings.</div>;
  }

  if (!data) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load earnings data.</div>;
  }

  return (
    <div className="fade-in" style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <DollarSign color="var(--accent)" /> Earnings Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your revenue and real-time payouts securely.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowLinkModal(true)}>
            <PlusCircle size={18} /> Link Account
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowWithdrawModal(true)}
            disabled={data.availableBalance <= 0 || payoutMethods.length === 0}
            style={{ opacity: (data.availableBalance <= 0 || payoutMethods.length === 0) ? 0.5 : 1 }}
          >
            <Download size={18} /> Withdraw
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={32} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</p>
            <h2 style={{ fontSize: '2.25rem', margin: '0.25rem 0' }}>₹{data.availableBalance?.toLocaleString()}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Ready for withdrawal</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={32} color="var(--success)" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month's Revenue</p>
            <h2 style={{ fontSize: '2.25rem', margin: '0.25rem 0' }}>₹{data.thisMonthEarnings?.toLocaleString()}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total lifetime: ₹{data.totalEarnings?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Revenue Trends
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--text-muted)" /> Linked Accounts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {payoutMethods.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No accounts linked yet.</p>
              ) : (
                payoutMethods.map(method => (
                  <div key={method.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {method.type === 'upi' ? <Smartphone size={18} color="var(--accent)" /> : <Building2 size={18} color="var(--accent)" />}
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{method.type.toUpperCase()}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{method.upiId || `**** ${method.accountNumber?.slice(-4)}`}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, maxHeight: '300px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recentPayouts?.map((tx, idx) => (
                <div key={`p-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Withdrawal</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>-₹{tx.amount}</p>
                    <p style={{ fontSize: '0.75rem', color: tx.status === 'processed' ? 'var(--success)' : 'orange' }}>{tx.status}</p>
                  </div>
                </div>
              ))}
              {data.recentTransactions?.map((tx, idx) => (
                <div key={`e-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Consultation Fee</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>+₹{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'var(--bg-base)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Link Payout Account</h2>
            <form onSubmit={handleLinkAccount}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Account Type</label>
                <select className="input-field" value={linkType} onChange={(e) => setLinkType(e.target.value as any)}>
                  <option value="bank_account">Bank Account (IMPS/NEFT)</option>
                  <option value="upi">UPI ID</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Account Holder Name</label>
                <input required className="input-field" value={linkData.name} onChange={e => setLinkData({...linkData, name: e.target.value})} placeholder="As per bank records" />
              </div>

              {linkType === 'bank_account' ? (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="input-label">Account Number</label>
                    <input required className="input-field" value={linkData.accountNumber} onChange={e => setLinkData({...linkData, accountNumber: e.target.value})} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="input-label">IFSC Code</label>
                    <input required className="input-field" value={linkData.ifscCode} onChange={e => setLinkData({...linkData, ifscCode: e.target.value})} />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">UPI ID</label>
                  <input required className="input-field" value={linkData.upiId} onChange={e => setLinkData({...linkData, upiId: e.target.value})} placeholder="example@upi" />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={linking}>{linking ? 'Linking...' : 'Link Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'var(--bg-base)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Withdraw Funds</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Available Balance: <strong style={{ color: 'var(--text-main)' }}>₹{data.availableBalance?.toLocaleString()}</strong></p>
            
            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Amount (₹)</label>
                <input required type="number" min="100" max={data.availableBalance} className="input-field" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Minimum ₹100" />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Transfer To</label>
                <select className="input-field" value={selectedMethodId} onChange={e => setSelectedMethodId(e.target.value)}>
                  {payoutMethods.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.type.toUpperCase()} - {m.upiId || m.accountNumber?.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={withdrawing}>{withdrawing ? 'Processing...' : 'Withdraw Now'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
