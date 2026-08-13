import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FileText, CheckCircle, Package, Plus, Minus, CreditCard, Activity } from 'lucide-react';

interface IncomingOrder {
  id: string;
  totalAmount: number;
  status: string;
  attachmentUrl?: string;
  createdAt: string;
  patientName: string;
}

interface Medicine {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  category: string;
}

export const IncomingOrders: React.FC = () => {
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IncomingOrder | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<{med: Medicine, quantity: number}[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchMedicines();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pharmacy/orders/incoming');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/medicines'); // This needs pharmacistId in query? The API endpoint for GET /medicines allows it but doesn't require it. For pharmacy web, it's better to fetch ALL inventory or their own. Since this is pharmacy web, we want their inventory.
      // We will filter on client for now or pass pharmacistId
      // Actually, we can just use the global list for hackathon if no auth filtering is active, but we should probably fetch the auth user's meds
      // Let's assume the pharmacy-web's inventory page uses GET /inventory
      const res2 = await api.get('/inventory');
      setMedicines(res2.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuild = (order: IncomingOrder) => {
    // Navigate to the full page OrderDetail instead of opening a modal
    window.location.href = `/orders/${order.id}`;
  };

  const addToCart = (med: Medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.med.id === med.id);
      if (existing) {
        return prev.map(item => item.med.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { med, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.med.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleSubmitBuild = async () => {
    if (!selectedOrder || cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/pharmacy/orders/${selectedOrder.id}/build`, {
        items: cart.map(c => ({ medicineId: c.med.id, quantity: c.quantity }))
      });
      alert('Order built successfully. Patient has been notified to pay.');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to build order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispense = async (orderId: string) => {
    try {
      await api.patch(`/pharmacy/orders/${orderId}/dispense`);
      alert("Order marked as dispensed.");
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispense order');
    }
  };

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const total = cart.reduce((acc, item) => acc + (item.med.price * item.quantity), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-teal-600" /> Incoming Prescriptions
        </h1>
        <p className="text-gray-500">Review uploaded prescriptions and build orders for your patients.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
      ) : orders.filter(o => o.status === 'pending_pharmacist_review').length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle size={48} className="mx-auto text-teal-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">All Caught Up</h3>
          <p className="text-gray-500">No pending prescriptions to review right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.filter(o => o.status === 'pending_pharmacist_review').map(order => (
            <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.patientName}</h3>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">Pending Review</span>
              </div>
              
              {order.attachmentUrl && (
                <div className="mb-4 bg-gray-50 rounded-lg p-2 border flex items-center gap-2">
                  <FileText className="text-indigo-500" size={20} />
                  <a href={order.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 font-medium hover:underline flex-1 truncate">
                    View Prescription
                  </a>
                </div>
              )}
              
              <button 
                onClick={() => handleBuild(order)}
                className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
              >
                Review & Build Order
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Order build modal removed in favor of OrderDetail page */}
      
      {/* Other Orders (Processed) */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="text-gray-400" /> Processed Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 text-left text-sm">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.filter(o => o.status !== 'pending_pharmacist_review').length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No processed orders.</td></tr>
              )}
              {orders.filter(o => o.status !== 'pending_pharmacist_review').map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-medium">{o.patientName}</td>
                  <td className="p-4 text-sm font-bold">₹{o.totalAmount}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      o.status === 'pending_payment' ? 'bg-blue-100 text-blue-800' :
                      o.status === 'paid' ? 'bg-green-100 text-green-800' :
                      o.status === 'dispensed' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {o.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {o.status === 'paid' && (
                      <button 
                        onClick={() => handleDispense(o.id)}
                        className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded hover:bg-teal-700 font-medium"
                      >
                        Dispense
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
