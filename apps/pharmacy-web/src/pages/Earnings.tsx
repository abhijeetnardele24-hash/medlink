import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', earnings: 4000 },
  { name: 'Tue', earnings: 3000 },
  { name: 'Wed', earnings: 5000 },
  { name: 'Thu', earnings: 2780 },
  { name: 'Fri', earnings: 6890 },
  { name: 'Sat', earnings: 8390 },
  { name: 'Sun', earnings: 3490 },
];

export const Earnings: React.FC = () => {
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
    </div>
  );
};
