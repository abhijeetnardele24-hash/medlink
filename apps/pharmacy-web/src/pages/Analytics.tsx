import React from 'react';
import { BarChart3, TrendingUp, PackageMinus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const inventoryData = [
  { name: 'Paracetamol', stock: 400, sold: 240 },
  { name: 'Amoxicillin', stock: 300, sold: 139 },
  { name: 'Cetirizine', stock: 200, sold: 980 },
  { name: 'Ibuprofen', stock: 278, sold: 390 },
  { name: 'Azithromycin', stock: 189, sold: 480 },
];

export const Analytics: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="text-teal-600" size={32} />
          Business Analytics
        </h1>
        <p className="text-gray-500 mt-2">Deep insights into your pharmacy operations and inventory turnover.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fastest Moving Medicine</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Cetirizine 10mg</h3>
            <p className="text-sm text-emerald-600 mt-1">980 units sold this week</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <PackageMinus size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Critical Low Stock</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Azithromycin 500mg</h3>
            <p className="text-sm text-red-500 mt-1">Only 189 units remaining</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory Turnover (Stock vs Sold)</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
