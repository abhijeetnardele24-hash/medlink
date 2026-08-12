import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

import { api } from '../lib/api';
import './PharmacyStorefront.css';
import { ShoppingCart, Search, Package, Upload, ArrowLeft } from 'lucide-react';

interface Pharmacist {
  id: string;
  fullName: string;
  shopName: string;
  registeredAddress: string;
  drugLicenseNumber?: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  price: number;
  stockQuantity: number;
  prescriptionTier: string;
  category: string;
  description?: string;
  imageUrl?: string;
  dosageForm?: string;
  manufacturer?: string;
}

interface CartItem extends Medicine {
  quantity: number;
}

export function PharmacyStorefront() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const rxId = searchParams.get('rxId');
  
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [selectedPharmacist, setSelectedPharmacist] = useState<Pharmacist | null>(null);
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPharmacists();
  }, []);

  useEffect(() => {
    if (selectedPharmacist) {
      fetchMedicines();
    }
  }, [search, selectedPharmacist]);

  const fetchPharmacists = async () => {
    try {
      const res = await api.get('/pharmacy/pharmacists');
      setPharmacists(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMedicines = async () => {
    if (!selectedPharmacist) return;
    try {
      const res = await api.get(`/medicines?search=${search}&pharmacistId=${selectedPharmacist.id}`);
      setMedicines(res.data.medicines);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (med: Medicine) => {
    if (med.prescriptionTier === 'restricted') {
      alert("This medicine is restricted and cannot be sold online according to regulations.");
      return;
    }
    if (med.prescriptionTier === 'schedule_h' && !rxId) {
      alert("This medicine requires a prescription. Please use the Upload Prescription feature.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id);
      if (existing) {
        return prev.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...med, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!address) {
      alert("Please enter a delivery address");
      return;
    }
    if (cart.length === 0 || !selectedPharmacist) return;

    setLoading(true);
    try {
      const payload = {
        prescriptionId: rxId || undefined,
        pharmacistId: selectedPharmacist.id,
        deliveryAddress: address,
        items: cart.map(c => ({ medicineId: c.id, quantity: c.quantity }))
      };

      const res = await api.post('/pharmacy/orders', payload);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyIdHere",
        amount: res.data.amount,
        currency: res.data.currency,
        name: "MedLink Pharmacy",
        description: "Order Payment",
        order_id: res.data.razorpayOrderId,
        handler: function () {
          alert("Payment successful! Order placed.");
          setCart([]);
          setIsCartOpen(false);
          setAddress('');
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
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPrescription = async () => {
    if (!uploadFile) {
      alert("Please select a file to upload");
      return;
    }
    if (!address) {
      alert("Please enter a delivery address");
      return;
    }
    if (!selectedPharmacist) return;

    setIsUploading(true);
    try {
      // In a real app, upload to Firebase Storage or S3 and get the URL
      // Here we'll simulate it by reading as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        await api.post('/pharmacy/orders/upload', {
          pharmacistId: selectedPharmacist.id,
          attachmentUrl: base64data,
          deliveryAddress: address
        });
        
        alert("Prescription uploaded! The pharmacist will review and send you a checkout link.");
        setIsUploadOpen(false);
        setUploadFile(null);
      };
      reader.readAsDataURL(uploadFile);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedPharmacist) {
    return (
      <div className="storefront-container p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Select a Pharmacy</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacists.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPharmacist(p)}>
              <h2 className="text-xl font-semibold text-teal-700">{p.shopName}</h2>
              {p.drugLicenseNumber && <div className="inline-block mt-2 mb-1 bg-gray-50 text-gray-500 text-xs px-2 py-1 rounded border border-gray-200">DL: {p.drugLicenseNumber}</div>}
              <p className="text-gray-600">{p.fullName}</p>
              <p className="text-sm text-gray-500 mt-1">{p.registeredAddress}</p>
            </div>
          ))}
          {pharmacists.length === 0 && (
            <p className="col-span-full text-gray-500">No verified pharmacies available.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="storefront-container relative">
      <header className="storefront-header bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedPharmacist(null); setCart([]); }} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-teal-700 flex items-center gap-2">
              <Package className="text-teal-600" />
              <div>
                <div>{selectedPharmacist.shopName}</div>
                {selectedPharmacist.drugLicenseNumber && (
                  <div className="text-xs font-normal text-teal-600 mt-0.5">DL No: {selectedPharmacist.drugLicenseNumber}</div>
                )}
              </div>
            </h1>
          </div>
          
          <div className="flex-1 max-w-xl mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search medicines..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Upload size={20} />
              <span className="hidden sm:inline">Upload Prescription</span>
            </button>
            
            <button 
              className="relative p-2 text-gray-600 hover:text-teal-600 transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cart.reduce((a,c) => a + c.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {rxId && (
          <div className="mb-6 bg-teal-50 border border-teal-200 text-teal-800 px-4 py-3 rounded-lg flex items-center gap-3">
            <Package size={20} />
            You are browsing medicines with an active prescription ({rxId.substring(0,8)}...). You can add prescription items to your cart.
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {medicines.map(med => (
            <div key={med.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-48 bg-gray-50 flex items-center justify-center p-4">
                {med.imageUrl ? (
                  <img src={med.imageUrl} alt={med.name} className="max-h-full object-contain" />
                ) : (
                  <Package size={48} className="text-gray-300" />
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 leading-tight">{med.name}</h3>
                  <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded font-medium">
                    ₹{med.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{med.genericName || med.category}</p>
                
                {med.prescriptionTier === 'restricted' && (
                  <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100 mb-3 font-medium text-center">Restricted: In-Store Only</p>
                )}
                {med.prescriptionTier === 'schedule_h' && !rxId && (
                  <p className="text-xs text-amber-600 mb-3 font-medium">Prescription Required</p>
                )}
                
                <button 
                  onClick={() => addToCart(med)}
                  disabled={med.stockQuantity <= 0 || med.prescriptionTier === 'restricted'}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  {med.prescriptionTier === 'restricted' ? 'Unavailable Online' : med.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Upload Prescription Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Upload Prescription</h2>
              <p className="text-gray-600 mb-6">Upload your prescription and our pharmacist will review it and build an order for you.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Image/PDF</label>
                  <input 
                    type="file" 
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full p-2 border rounded-lg"
                    accept="image/*,application/pdf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <textarea 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                    rows={3}
                    placeholder="Enter your full delivery address..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadPrescription}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {isUploading ? 'Uploading...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsCartOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transform transition-transform">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-teal-600" /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  Your cart is empty
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-teal-600 font-semibold mt-1">₹{item.price} x {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-sm hover:underline mt-1">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <textarea 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                    rows={2}
                    placeholder="Enter delivery address..."
                  />
                </div>
                <div className="flex justify-between items-center mb-4 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-teal-600">₹{total}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 font-semibold shadow-lg shadow-teal-600/30 transition-all"
                >
                  {loading ? 'Processing...' : 'Checkout & Pay'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
