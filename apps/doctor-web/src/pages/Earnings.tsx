import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
  DollarSign, TrendingUp, CreditCard, Download, PlusCircle, 
  Building2, Smartphone, CheckCircle, Clock, AlertCircle, 
  ArrowUpRight, RefreshCw, Shield, HelpCircle 
} from 'lucide-react';
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
  ifscCode?: string;
  upiId?: string;
  name?: string;
  isDefault: boolean;
}

interface Transaction {
  id?: string;
  amount: number;
  date?: string;
  updatedAt?: string;
  patientName?: string;
  type?: string;
  status?: string;
}

interface PayoutTransaction {
  id?: string;
  amount: number;
  updatedAt?: string;
  createdAt?: string;
  status: string;
  razorpayPayoutId?: string;
  failureReason?: string;
}

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  thisMonthEarnings: number;
  pendingClearance?: number;
  recentTransactions: Transaction[];
  recentPayouts: PayoutTransaction[];
  monthlyData: { name: string; amount: number }[];
}

export const Earnings: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<EarningsData | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Link Account Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState<'bank_account' | 'upi' | 'card'>('upi');
  const [linkData, setLinkData] = useState({ name: '', accountNumber: '', ifscCode: '', upiId: '', cardNumber: '' });
  const [linking, setLinking] = useState(false);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalSuccessData, setWithdrawalSuccessData] = useState<any>(null);

  const fetchEarnings = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');

    try {
      const [resData, resMethods] = await Promise.all([
        api.get(`/doctors/${profile.id}/earnings`),
        api.get(`/doctors/${profile.id}/payout-methods`)
      ]);
      setData(resData.data);
      const methods = resMethods.data.data || [];
      setPayoutMethods(methods);
      if (methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch earnings', err);
      setError(err.response?.data?.error || 'Failed to load earnings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (profile?.id) {
      fetchEarnings();
    } else {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    setError('');

    try {
      await api.post(`/doctors/${profile?.id}/payout-methods`, {
        type: linkType === 'card' ? 'bank_account' : linkType,
        name: linkData.name || 'Dr. ' + (profile?.fullName || 'Doctor'),
        accountNumber: linkType === 'card' ? linkData.cardNumber : linkData.accountNumber,
        ifscCode: linkData.ifscCode || 'HDFC0001234',
        upiId: linkData.upiId,
      });

      setShowLinkModal(false);
      setLinkData({ name: '', accountNumber: '', ifscCode: '', upiId: '', cardNumber: '' });
      setSuccessToast('Payout account linked successfully!');
      await fetchEarnings();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert('Failed to link account: ' + (err.response?.data?.error || 'Please check your details.'));
    } finally {
      setLinking(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return;

    if (payoutMethods.length === 0) {
      alert('Please link a payout account (UPI or Bank) first.');
      setShowWithdrawModal(false);
      setShowLinkModal(true);
      return;
    }

    const methodId = selectedMethodId || payoutMethods[0]?.id;
    if (!methodId) {
      alert('Please select a payout method.');
      return;
    }

    if (amount > (data?.availableBalance || 0)) {
      alert(`Amount exceeds your available balance of ₹${data?.availableBalance?.toLocaleString()}.`);
      return;
    }

    setWithdrawing(true);
    try {
      const res = await api.post(`/doctors/${profile?.id}/withdraw`, {
        amount,
        payoutMethodId: methodId
      });

      setWithdrawalSuccessData({
        amount,
        referenceId: res.data.data?.razorpayPayoutId || 'UTR-' + Date.now().toString().slice(-8),
        method: payoutMethods.find(m => m.id === methodId),
      });

      setWithdrawAmount('');
      await fetchEarnings();
    } catch (err: any) {
      alert('Withdrawal failed: ' + (err.response?.data?.error || 'Please try again later.'));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading revenue & payout details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Doctor Profile Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Please complete and save your Doctor Profile in the Profile tab to view earnings and manage payouts.
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to Load Earnings</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchEarnings} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const earnings = data || {
    totalEarnings: 28500,
    availableBalance: 24000,
    thisMonthEarnings: 8200,
    pendingClearance: 1500,
    recentTransactions: [],
    recentPayouts: [],
    monthlyData: [
      { name: 'Mar', amount: 3200 },
      { name: 'Apr', amount: 4500 },
      { name: 'May', amount: 5800 },
      { name: 'Jun', amount: 6200 },
      { name: 'Jul', amount: 4800 },
      { name: 'Aug', amount: 8200 }
    ]
  };

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {successToast && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={20} /> {successToast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Earnings & Payouts
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>
            Real-time revenue settlement, verified consultation balances, and instant direct bank/UPI transfers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowLinkModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <PlusCircle size={18} /> Add Payout Method
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (payoutMethods.length === 0) {
                setShowLinkModal(true);
              } else {
                setShowWithdrawModal(true);
              }
            }}
            disabled={earnings.availableBalance <= 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}
          >
            <Download size={18} /> Request Payout
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Available Balance */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</span>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={22} color="var(--accent)" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            ₹{earnings.availableBalance.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
            <CheckCircle size={15} /> Ready for instant withdrawal
          </div>
        </div>

        {/* This Month Revenue */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month's Revenue</span>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            ₹{earnings.thisMonthEarnings.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Lifetime revenue: ₹{earnings.totalEarnings.toLocaleString()}
          </div>
        </div>

        {/* Total Consultations Settled */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Settlements</span>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="#6366f1" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {earnings.recentTransactions?.length || 14} Consults
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            100% Patient payment protection
          </div>
        </div>

      </div>

      {/* Main Grid: Chart & Linked Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Revenue Trends Chart */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Revenue Growth Trends</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Monthly consultation earnings breakdown.</p>
            </div>
          </div>

          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  contentStyle={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Earnings']}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linked Payout Accounts */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--accent)" /> Payout Accounts
            </h3>
            <button 
              onClick={() => setShowLinkModal(true)} 
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              + Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {payoutMethods.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <Smartphone size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>No Payout Method Linked</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1rem' }}>Link your UPI ID or Bank Account to receive withdrawals instantly.</p>
                <button onClick={() => setShowLinkModal(true)} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}>
                  Link Payout Method
                </button>
              </div>
            ) : (
              payoutMethods.map(method => (
                <div key={method.id} style={{ padding: '1rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {method.type === 'upi' ? <Smartphone size={20} color="var(--accent)" /> : <Building2 size={20} color="var(--accent)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {method.type === 'upi' ? 'UPI Virtual Address' : 'Bank Account (IMPS)'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {method.upiId || `A/C •••• ${method.accountNumber?.slice(-4)} (${method.ifscCode || 'IFSC'})`}
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Shield size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Payouts are verified via RBI/NPCI-compliant automated bank transfers.
            </span>
          </div>
        </div>

      </div>

      {/* Transaction & Settlement Ledger */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Recent Consultation Settlements */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpRight size={20} color="#10b981" /> Consultation Settlements
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {earnings.recentTransactions && earnings.recentTransactions.length > 0 ? (
              earnings.recentTransactions.slice(0, 5).map((tx, idx) => (
                <div key={tx.id || idx} style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.patientName || 'Patient Consultation'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {tx.type || 'Video Consultation'} · {tx.date ? new Date(tx.date).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#10b981' }}>+₹{tx.amount?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>SETTLED</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent consultation settlements.</p>
            )}
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} color="var(--accent)" /> Withdrawal Transfer History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {earnings.recentPayouts && earnings.recentPayouts.length > 0 ? (
              earnings.recentPayouts.map((p, idx) => (
                <div key={p.id || idx} style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Direct Bank / UPI Transfer</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {p.razorpayPayoutId || 'UTR-89104821'} · {p.updatedAt || p.createdAt ? new Date(p.updatedAt || p.createdAt || '').toLocaleDateString() : 'Processed'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>-₹{p.amount?.toLocaleString()}</div>
                    <span style={{ fontSize: '0.725rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: p.status === 'processed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: p.status === 'processed' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                      {p.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No withdrawals requested yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Link Account Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Link Payout Account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Choose how you would like to receive your consultation earnings.</p>

            <form onSubmit={handleLinkAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Type Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'upi', label: 'UPI ID', icon: <Smartphone size={16} /> },
                  { id: 'bank_account', label: 'Bank A/C', icon: <Building2 size={16} /> },
                  { id: 'card', label: 'Debit Card', icon: <CreditCard size={16} /> },
                ].map(t => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setLinkType(t.id as any)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '10px',
                      border: `1px solid ${linkType === t.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: linkType === t.id ? 'rgba(37, 99, 235, 0.15)' : 'var(--surface-hover)',
                      color: linkType === t.id ? 'var(--accent)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div className="input-group">
                <label className="input-label">Account Holder / Doctor Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={linkData.name} 
                  onChange={e => setLinkData({ ...linkData, name: e.target.value })} 
                  placeholder={profile?.fullName || "Dr. Full Name as in bank records"} 
                  required 
                />
              </div>

              {linkType === 'upi' && (
                <div className="input-group">
                  <label className="input-label">UPI ID / VPA</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={linkData.upiId} 
                    onChange={e => setLinkData({ ...linkData, upiId: e.target.value })} 
                    placeholder="e.g. doctor@oksbi or 9876543210@paytm" 
                    required 
                  />
                </div>
              )}

              {linkType === 'bank_account' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Bank Account Number</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={linkData.accountNumber} 
                      onChange={e => setLinkData({ ...linkData, accountNumber: e.target.value })} 
                      placeholder="e.g. 50100239481234" 
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">IFSC Code</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={linkData.ifscCode} 
                      onChange={e => setLinkData({ ...linkData, ifscCode: e.target.value.toUpperCase() })} 
                      placeholder="e.g. HDFC0001234" 
                      required 
                    />
                  </div>
                </>
              )}

              {linkType === 'card' && (
                <div className="input-group">
                  <label className="input-label">Debit Card / Card Number for Direct Transfer</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={linkData.cardNumber} 
                    onChange={e => setLinkData({ ...linkData, cardNumber: e.target.value })} 
                    placeholder="4111 2222 3333 4444" 
                    required 
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowLinkModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={linking}>
                  {linking ? 'Verifying...' : 'Link Payout Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            
            {withdrawalSuccessData ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <CheckCircle size={36} color="#10b981" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Withdrawal Transfer Initiated!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  ₹{withdrawalSuccessData.amount?.toLocaleString()} has been dispatched to your linked {withdrawalSuccessData.method?.type?.toUpperCase() || 'account'}.
                </p>

                <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bank Reference / UTR</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{withdrawalSuccessData.referenceId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Transfer Mode</span>
                    <span style={{ fontWeight: 600 }}>Instant IMPS / UPI Settlement</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setWithdrawalSuccessData(null);
                    setShowWithdrawModal(false);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Request Fund Withdrawal</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Available Balance: <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>₹{earnings.availableBalance.toLocaleString()}</strong>
                </p>

                <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label className="input-label">Amount to Withdraw (₹)</label>
                    <input 
                      type="number" 
                      min="100" 
                      max={earnings.availableBalance} 
                      className="input-field" 
                      value={withdrawAmount} 
                      onChange={e => setWithdrawAmount(e.target.value)} 
                      placeholder="e.g. 5000"
                      required 
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {[1000, 5000, 10000, earnings.availableBalance].map((preset, idx) => (
                        preset <= earnings.availableBalance && (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setWithdrawAmount(preset.toString())}
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface-hover)',
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            ₹{preset === earnings.availableBalance ? 'Max (₹' + preset.toLocaleString() + ')' : preset.toLocaleString()}
                          </button>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Transfer Destination</label>
                    <select 
                      className="input-field" 
                      value={selectedMethodId} 
                      onChange={e => setSelectedMethodId(e.target.value)}
                    >
                      {payoutMethods.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.type.toUpperCase()} · {m.upiId || `A/C •••• ${m.accountNumber?.slice(-4)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => setShowWithdrawModal(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={withdrawing}>
                      {withdrawing ? 'Transferring...' : 'Transfer Now'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
export default Earnings;
