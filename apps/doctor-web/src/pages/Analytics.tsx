import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Star } from 'lucide-react';

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalPatients: 0,
    consultationsCompleted: 0,
    averageRating: 0,
  });

  // Mock data for charts
  const revenueData = [
    { name: 'Mon', earnings: 4000 },
    { name: 'Tue', earnings: 3000 },
    { name: 'Wed', earnings: 2000 },
    { name: 'Thu', earnings: 2780 },
    { name: 'Fri', earnings: 1890 },
    { name: 'Sat', earnings: 2390 },
    { name: 'Sun', earnings: 3490 },
  ];

  const patientDemographics = [
    { ageGroup: '18-24', male: 40, female: 60 },
    { ageGroup: '25-34', male: 120, female: 140 },
    { ageGroup: '35-44', male: 80, female: 100 },
    { ageGroup: '45-54', male: 50, female: 40 },
    { ageGroup: '55+', male: 30, female: 20 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // We will fetch real stats here eventually
        // For now, setting some realistic demo numbers
        setStats({
          totalEarnings: 124500,
          totalPatients: 342,
          consultationsCompleted: 456,
          averageRating: 4.8,
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="text-gray-500 mt-2">Track your clinic's performance and patient metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Earnings</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +12.5% this month
            </p>
          </div>
          <div className="bg-teal-50 p-3 rounded-xl text-teal-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Patients</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalPatients}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +4.2% this month
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Consultations</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.consultationsCompleted}</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
              Based on all time
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Average Rating</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.averageRating}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              Top 5% of doctors
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
            <Star size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Earnings']}
                />
                <Area type="monotone" dataKey="earnings" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Patient Demographics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientDemographics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="male" name="Male" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="female" name="Female" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
