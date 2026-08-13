import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FileText, ArrowLeft, Package, Plus, Minus, CheckCircle } from 'lucide-react';

interface OrderDetail {
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

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<{med: Medicine, quantity: number}[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchMedicines();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get('/pharmacy/orders/incoming');
      const found = res.data.find((o: any) => o.id === id);
      setOrder(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/inventory');
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    }
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

  const updateQuantity = (medId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.med.id === medId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleSubmitBuild = async () => {
    if (!order || cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/pharmacy/orders/${order.id}/build`, {
        items: cart.map(c => ({ medicineId: c.med.id, quantity: c.quantity }))
      });
      alert('Order built successfully. Patient has been notified to pay.');
      navigate('/orders');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to build order');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDispense = async () => {
    if (!order) return;
    try {
      await api.patch(`/pharmacy/orders/${order.id}/dispense`);
      alert("Order marked as dispensed.");
      navigate('/orders');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispense order');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  if (!order) return <div className="p-12 text-center text-gray-500">Order not found.</div>;

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const total = cart.reduce((acc, item) => acc + (item.med.price * item.quantity), 0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-teal-600" /> Order Details
          </h1>
          <p className="text-gray-500">Patient: {order.patientName} | Status: {order.status.replace('_', ' ').toUpperCase()}</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden rounded-xl shadow-lg border border-gray-200">
        {/* Prescription Viewer */}
        <div className={`${order.attachmentUrl ? 'w-1/2' : 'hidden'} border-r bg-gray-100 flex flex-col relative`}>
          <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-gray-700 border shadow-sm">Prescription Attachment</div>
          {order.attachmentUrl && (
            order.attachmentUrl.startsWith('data:image') || order.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
              <img src={order.attachmentUrl} alt="Prescription" className="w-full h-full object-contain p-4" />
            ) : (
              <iframe src={order.attachmentUrl} className="w-full h-full" title="Prescription" />
            )
          )}
        </div>
        
        {/* Actions Area */}
        <div className={`${order.attachmentUrl ? 'w-1/2' : 'w-full'} flex flex-col bg-white`}>
          {order.status === 'pending_pharmacist_review' ? (
            <>
              <div className="p-4 border-b bg-gray-50">
                <input 
                  type="text" 
                  placeholder="Search medicines..." 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredMeds.map(med => (
                  <div key={med.id} className="flex justify-between items-center p-3 hover:bg-teal-50 rounded-lg border transition-colors">
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{med.name}</div>
                      <div className="text-xs text-gray-500 mt-1">₹{med.price} • Stock: {med.stockQuantity}</div>
                    </div>
                    <button 
                      onClick={() => addToCart(med)}
                      disabled={med.stockQuantity <= 0}
                      className="p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 disabled:opacity-50 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="h-1/3 border-t flex flex-col bg-gray-50">
                <div className="p-3 text-sm font-bold border-b text-gray-700 flex justify-between">
                  <span>Order Items</span>
                  <span className="text-teal-600">{cart.length} items</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {cart.map(item => (
                    <div key={item.med.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border text-sm shadow-sm">
                      <span className="truncate flex-1 font-medium">{item.med.name}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.med.id, -1)} className="p-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"><Minus size={14}/></button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.med.id, 1)} className="p-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">Cart is empty. Select medicines to build the order.</div>}
                </div>
                
                <div className="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between font-bold mb-3 text-lg">
                    <span>Total Amount</span>
                    <span className="text-teal-600">₹{total}</span>
                  </div>
                  <button 
                    onClick={handleSubmitBuild}
                    disabled={cart.length === 0 || submitting}
                    className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {submitting ? 'Sending...' : 'Send Bill to Patient'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <CheckCircle size={64} className="text-teal-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Built Successfully</h2>
              <p className="text-gray-600 mb-6 max-w-md">The patient has been notified and needs to complete payment. Order total: <span className="font-bold text-gray-900">₹{order.totalAmount}</span></p>
              
              {order.status === 'paid' && (
                <button 
                  onClick={handleDispense}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold shadow-md transition-all"
                >
                  Mark as Dispensed
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
