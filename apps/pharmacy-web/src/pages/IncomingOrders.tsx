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
    setSelectedOrder(order);
    setCart([]);
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

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-stretch justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="text-teal-600" /> Build Order for {selectedOrder.patientName}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Prescription Viewer */}
              {selectedOrder.attachmentUrl && (
                <div className="w-1/2 border-r bg-gray-100 flex flex-col relative">
                  <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-600 border">Prescription</div>
                  {selectedOrder.attachmentUrl.startsWith('data:image') || selectedOrder.attachmentUrl.match(/\\.(jpeg|jpg|gif|png)$/) ? (
                    <img src={selectedOrder.attachmentUrl} alt="Prescription" className="w-full h-full object-contain" />
                  ) : (
                    <iframe src={selectedOrder.attachmentUrl} className="w-full h-full" title="Prescription" />
                  )}
                </div>
              )}
              
              {/* Inventory & Cart */}
              <div className={`${selectedOrder.attachmentUrl ? 'w-1/2' : 'w-full'} flex flex-col bg-white`}>
                <div className="p-4 border-b">
                  <input 
                    type="text" 
                    placeholder="Search medicines..." 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredMeds.map(med => (
                    <div key={med.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg border">
                      <div>
                        <div className="font-medium text-sm">{med.name}</div>
                        <div className="text-xs text-gray-500">₹{med.price} • Stock: {med.stockQuantity}</div>
                      </div>
                      <button 
                        onClick={() => addToCart(med)}
                        disabled={med.stockQuantity <= 0}
                        className="p-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="h-1/3 border-t bg-gray-50 flex flex-col">
                  <div className="p-3 text-sm font-bold border-b text-gray-700">Order Items</div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cart.map(item => (
                      <div key={item.med.id} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                        <span className="truncate flex-1 font-medium">{item.med.name}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.med.id, -1)} className="p-1 bg-gray-100 rounded text-gray-600"><Minus size={14}/></button>
                          <span className="w-4 text-center font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.med.id, 1)} className="p-1 bg-gray-100 rounded text-gray-600"><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">Cart is empty</div>}
                  </div>
                  
                  <div className="p-4 border-t bg-white">
                    <div className="flex justify-between font-bold mb-3">
                      <span>Total</span>
                      <span className="text-teal-600">₹{total}</span>
                    </div>
                    <button 
                      onClick={handleSubmitBuild}
                      disabled={cart.length === 0 || submitting}
                      className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send Bill to Patient'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.filter(o => o.status !== 'pending_pharmacist_review').length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No processed orders.</td></tr>
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
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {o.status.replace('_', ' ').toUpperCase()}
                    </span>
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
