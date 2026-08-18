import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

const data = [
  { name: 'Mon', earnings: 4000 },
  { name: 'Tue', earnings: 3000 },
  { name: 'Wed', earnings: 5000 },
  { name: 'Thu', earnings: 2780 },
  { name: 'Fri', earnings: 6890 },
  { name: 'Sat', earnings: 8390 },
  { name: 'Sun', earnings: 3490 },
];

const mockLedger = [
  { id: 'TXN-90214', date: '2026-08-16T14:30:00Z', grossAmount: 1250, status: 'settled', type: 'Payout' },
  { id: 'TXN-90213', date: '2026-08-15T09:15:00Z', grossAmount: 850, status: 'settled', type: 'Payout' },
  { id: 'TXN-90212', date: '2026-08-14T11:20:00Z', grossAmount: 450, status: 'settled', type: 'Payout' },
  { id: 'TXN-90211', date: '2026-08-13T18:05:00Z', grossAmount: 1800, status: 'settled', type: 'Payout' },
  { id: 'TXN-90210', date: '2026-08-12T10:10:00Z', grossAmount: 3200, status: 'settled', type: 'Payout' },
];

export const Earnings: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<typeof mockLedger[0] | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="text-teal-600" size={32} />
          Earnings & Financials
        </h1>
        <p className="text-gray-500 mt-2">Track your pharmacy revenue, payouts, and financial growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Revenue (This Month)</p>
          <div className="flex items-end gap-4">
            <h2 className="text-4xl font-bold text-gray-900">₹1,24,500</h2>
            <span className="flex items-center text-sm font-medium text-emerald-600 mb-1">
              <ArrowUpRight size={16} /> +12.5%
            </span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-2">Pending Payouts</p>
          <div className="flex items-end gap-4">
            <h2 className="text-4xl font-bold text-gray-900">₹18,200</h2>
            <span className="flex items-center text-sm font-medium text-gray-400 mb-1">
              Settles in 2 days
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-2">Average Order Value</p>
          <div className="flex items-end gap-4">
            <h2 className="text-4xl font-bold text-gray-900">₹850</h2>
            <span className="flex items-center text-sm font-medium text-red-500 mb-1">
              <ArrowDownRight size={16} /> -2.1%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Revenue Overview (Last 7 Days)</h3>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`₹${value}`, 'Earnings']}
              />
              <Area type="monotone" dataKey="earnings" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Detailed Settlement Ledger</h3>
          <p className="text-sm text-gray-500">Click on any gross amount to view platform deductions and final settlement.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Transaction ID</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Gross Amount</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockLedger.map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{txn.id}</td>
                  <td className="p-4 text-gray-600">{new Date(txn.date).toLocaleString()}</td>
                  <td className="p-4 text-gray-600">{txn.type}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Settled
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900 text-right">₹{txn.grossAmount.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedTransaction(txn)}
                      className="inline-flex items-center gap-1 text-teal-600 font-medium hover:text-teal-800 text-sm bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Breakdown <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};
