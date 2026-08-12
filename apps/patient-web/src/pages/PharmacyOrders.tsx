import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ShoppingBag, CheckCircle, Clock, CreditCard, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PharmacyOrder {
  id: string;
  totalAmount: number;
  status: string;
  attachmentUrl?: string;
  createdAt: string;
  pharmacistName: string;
  razorpayOrderId?: string;
}

export const PharmacyOrders: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pharmacy/orders');
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch pharmacy orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (order: PharmacyOrder) => {
    if (!order.razorpayOrderId) {
      alert("Order does not have a payment mandate yet.");
      return;
    }
    
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyIdHere",
      amount: order.totalAmount * 100, // paise
      currency: "INR",
      name: "MedLink Pharmacy",
      description: "Order Payment",
      order_id: order.razorpayOrderId,
      handler: function () {
        alert("Payment successful! The pharmacy will prepare your order.");
        fetchOrders(); // Refresh status
      },
      prefill: {
        name: "Patient",
        email: "patient@example.com",
      },
      theme: {
        color: "#0f766e"
      }
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending_pharmacist_review':
        return <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Reviewing</span>;
      case 'pending_payment':
        return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CreditCard size={12}/> Needs Payment</span>;
      case 'paid':
        return <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Paid & Preparing</span>;
      case 'out_for_delivery':
      case 'delivered':
        return <span className="text-teal-600 bg-teal-50 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> {status.replace('_', ' ').toUpperCase()}</span>;
      default:
        return <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <ShoppingBag className="text-teal-600" /> My Pharmacy Orders
        </h1>
        <p className="text-gray-500 mt-1">Track your orders and pay for pharmacist-built orders from uploaded prescriptions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Yet</h3>
          <p className="text-gray-500">You haven't placed any pharmacy orders or uploaded prescriptions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{order.pharmacistName}</h3>
                  {getStatusDisplay(order.status)}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  {order.attachmentUrl && <p className="text-indigo-600 flex items-center gap-1"><Activity size={14}/> Prescription Uploaded</p>}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 min-w-[120px]">
                <div className="text-lg font-bold text-gray-900">
                  ₹{order.totalAmount}
                </div>
                
                {order.status === 'pending_payment' && (
                  <button 
                    onClick={() => handlePay(order)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium w-full shadow-sm"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
