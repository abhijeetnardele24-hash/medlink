import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PackageMinus, Clock, CheckCircle2, Truck, Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { api } from '../lib/api';

interface AnalyticsProps {
  profile?: any;
}

export const Analytics: React.FC<AnalyticsProps> = ({ profile }) => {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<any>({
    pipelineData: [],
    inventoryData: []
  });

  const fetchAnalytics = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/pharmacy/analytics');
      setAnalytics(res.data.data.analytics);
    } catch (err: any) {
      console.error('Failed to fetch pharmacy analytics', err);
      setError(err.response?.data?.error || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [profile?.id]);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Required</h2>
          <p className="text-gray-500">Please complete your Pharmacy Profile to view your analytics.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchAnalytics} className="btn btn-primary inline-flex items-center gap-2">
            <RefreshCw size={16} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const pendingReview = analytics.pipelineData.find((d: any) => d.stage === 'Received')?.count || 0;
  const processing = analytics.pipelineData.find((d: any) => d.stage === 'Processing')?.count || 0;
  const shipped = analytics.pipelineData.find((d: any) => d.stage === 'Shipped')?.count || 0;

  const topSelling = analytics.inventoryData.length > 0 ? analytics.inventoryData[0] : null;
  const lowStock = analytics.inventoryData.slice().sort((a: any, b: any) => a.stock - b.stock)[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="text-teal-600" size={32} />
          Business Analytics
        </h1>
        <p className="text-gray-500 mt-2">Deep insights into your pharmacy operations, inventory turnover, and fulfillment pipeline.</p>
      </div>

      {/* PIPELINE METRICS */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pipeline Metrics (Today)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Inbox size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingReview}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <h3 className="text-2xl font-bold text-gray-900">{processing}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Shipped</p>
              <h3 className="text-2xl font-bold text-gray-900">{shipped}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Processing</p>
              <h3 className="text-2xl font-bold text-gray-900">2h 15m</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PIPELINE FUNNEL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Order Fulfillment Funnel (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.pipelineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#423FDE" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#423FDE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="stage" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#423FDE" strokeWidth={3} fillOpacity={1} fill="url(#colorFunnel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INVENTORY ALERTS */}
        <div className="flex flex-col gap-6">
          {topSelling && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex items-center gap-4">
              <div className="p-4 bg-teal-50 rounded-xl text-teal-600">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fastest Moving Medicine</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{topSelling.name}</h3>
                <p className="text-sm text-emerald-600 mt-1">{topSelling.sold} units sold this week</p>
              </div>
            </div>
          )}

          {lowStock && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex items-center gap-4">
              <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
                <PackageMinus size={32} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Critical Low Stock</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{lowStock.name}</h3>
                <p className="text-sm text-red-500 mt-1">Only {lowStock.stock} units remaining</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory Turnover (Stock vs Sold)</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.inventoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="stock" name="Current Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sold" name="Units Sold" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
