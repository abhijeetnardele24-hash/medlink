import React, { useState } from 'react';
import { History, Search, Filter, Download, PackageCheck, XCircle } from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';

// Mock historical data
const mockHistory = [
  { id: 'ORD-7291', date: '2026-08-16T14:30:00Z', patient: 'Rahul Sharma', total: 1250, status: 'dispensed', items: 3 },
  { id: 'ORD-7288', date: '2026-08-15T09:15:00Z', patient: 'Priya Patel', total: 850, status: 'dispensed', items: 2 },
  { id: 'ORD-7285', date: '2026-08-14T16:45:00Z', patient: 'Amit Kumar', total: 3200, status: 'cancelled', items: 5 },
  { id: 'ORD-7281', date: '2026-08-14T11:20:00Z', patient: 'Neha Gupta', total: 450, status: 'dispensed', items: 1 },
  { id: 'ORD-7279', date: '2026-08-13T18:05:00Z', patient: 'Suresh Iyer', total: 1800, status: 'dispensed', items: 4 },
];

export const OrderHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<typeof mockHistory[0] | null>(null);
  
  const filtered = mockHistory.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="text-teal-600" size={32} />
            Order History
          </h1>
          <p className="text-gray-500 mt-2">Comprehensive ledger of all fulfilled and cancelled prescriptions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Patient Name..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            <Filter size={18} /> Filter Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Patient</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{order.id}</td>
                  <td className="p-4 text-gray-600">{new Date(order.date).toLocaleString()}</td>
                  <td className="p-4 font-medium text-gray-800">{order.patient}</td>
                  <td className="p-4 text-gray-600">{order.items} medicines</td>
                  <td className="p-4 font-bold text-gray-900">₹{order.total}</td>
                  <td className="p-4">
                    {order.status === 'dispensed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <PackageCheck size={14} /> Fulfilled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <XCircle size={14} /> Cancelled
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="text-teal-600 font-medium hover:text-teal-800 text-sm"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    No orders match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedInvoiceOrder && (
        <InvoiceModal
          orderId={selectedInvoiceOrder.id}
          patientName={selectedInvoiceOrder.patient}
          total={selectedInvoiceOrder.total}
          date={selectedInvoiceOrder.date}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
