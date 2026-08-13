import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  recentTransactions: { amount: number; updatedAt: string }[];
  monthlyData: { name: string; amount: number }[];
}

export const Earnings: React.FC = () => {
  const { profile } = useAuth();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    
    const fetchEarnings = async () => {
      try {
        const res = await api.get(`/doctors/${profile.id}/earnings`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch earnings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [profile]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-gray-500">Failed to load earnings data.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <DollarSign className="text-indigo-600" /> Earnings Dashboard
        </h1>
        <p className="text-gray-500">Track your consultation revenue and payment history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <DollarSign size={32} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Earnings</p>
            <h2 className="text-3xl font-bold text-gray-900">₹{data.totalEarnings.toLocaleString()}</h2>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={32} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">This Month</p>
            <h2 className="text-3xl font-bold text-gray-900">₹{data.thisMonthEarnings.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" /> Monthly Revenue
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
            <CreditCard size={20} className="text-gray-400" /> Recent Transactions
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {data.recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent transactions</p>
            ) : (
              data.recentTransactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                      <TrendingUp size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">Consultation Fee</p>
                      <p className="text-xs text-gray-500">{new Date(tx.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="font-bold text-green-600">
                    +₹{tx.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
