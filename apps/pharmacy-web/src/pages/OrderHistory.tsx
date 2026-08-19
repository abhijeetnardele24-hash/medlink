import React, { useEffect, useState } from 'react';
import { History, Search, Filter, Download, PackageCheck, XCircle } from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';
import { api } from '../lib/api';

export const OrderHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/pharmacy/orders/incoming');
      // Filter for dispensed or cancelled
      const historyOrders = res.data.filter((o: any) => o.status === 'dispensed' || o.status === 'cancelled');
      setOrders(historyOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.patientName.toLowerCase().includes(searchTerm.toLowerCase())
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
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    No orders match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{order.id}</td>
                    <td className="p-4 text-gray-600">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-medium text-gray-800">{order.patientName}</td>
                    <td className="p-4 font-bold text-gray-900">₹{order.totalAmount}</td>
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
                        onClick={() => setSelectedInvoiceOrder({
                          id: order.id,
                          patient: order.patientName,
                          total: order.totalAmount,
                          date: order.createdAt
                        })}
                        className="text-teal-600 font-medium hover:text-teal-800 text-sm"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))
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
