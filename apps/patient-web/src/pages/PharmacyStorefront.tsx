import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import './PharmacyStorefront.css';
import {
  ShoppingCart, Search, Package, Upload, X, Plus, Minus,
  FileText, Store, Shield, Star, Truck, ChevronRight, AlertCircle
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  price: number;
  stockQuantity: number;
  prescriptionTier: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  dosageForm?: string;
  manufacturer?: string;
  pharmacistId?: string;
  sellerName?: string;
  sellerShopName?: string;
  sellerAddress?: string;
}

interface CartItem extends Medicine {
  quantity: number;
}

const CATEGORIES = ['All', 'Antibiotics', 'Analgesics', 'Vitamins', 'Antacids', 'Antihistamines', 'Antidiabetics', 'Cardiac'];
const TIER_LABELS: Record<string, { label: string; color: string }> = {
  otc:        { label: 'OTC',         color: '#16a34a' },
  schedule_h: { label: 'Rx Required', color: '#d97706' },
  restricted: { label: 'In-Store Only',color: '#dc2626' },
};

export function PharmacyStorefront() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const rxId = searchParams.get('rxId');

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const searchTimeout = useRef<any>(null);

  const fetchMedicines = useCallback(async (searchVal = search, cat = activeCategory) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchVal.trim()) params.search = searchVal.trim();
      if (cat && cat !== 'All') params.category = cat;
      const res = await api.get('/medicines', { params });
      setMedicines(res.data.medicines || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines('', 'All');
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchMedicines(val, activeCategory), 350);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    fetchMedicines(search, cat);
  };

  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  const total = cart.reduce((a, c) => a + c.price * c.quantity, 0);

  const addToCart = (med: Medicine) => {
    if (med.prescriptionTier === 'restricted') {
      alert('This medicine is restricted and can only be purchased in-store.');
      return;
    }
    if (med.prescriptionTier === 'schedule_h' && !rxId) {
      alert('This medicine requires a prescription. Please use "Upload Prescription" above.');
      return;
    }
    setCart(prev => {
      const ex = prev.find(i => i.id === med.id);
      if (ex) return prev.map(i => i.id === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...med, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const handleCheckout = async () => {
    if (!address.trim()) { alert('Please enter your delivery address'); return; }
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      const payload = {
        deliveryAddress: address,
        items: cart.map(c => ({ medicineId: c.id, quantity: c.quantity })),
        prescriptionId: rxId || undefined,
        // No pharmacistId — backend auto-assigns
      };
      const res = await api.post('/pharmacy/orders', payload);
      
      // If Razorpay is configured, open payment
      if (res.data.razorpayOrderId && !res.data.razorpayOrderId.startsWith('test_order_')) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: res.data.amount,
          currency: res.data.currency,
          name: 'MedLink Pharmacy',
          description: 'Medicine Order',
          order_id: res.data.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await api.post(`/pharmacy/orders/${res.data.order.id}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              setOrderSuccess(true);
              setCart([]);
              setIsCartOpen(false);
              setAddress('');
            } catch (err) {
              alert('Payment verification failed. Please contact support.');
            }
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Test mode — show success directly
        setOrderSuccess(true);
        setCart([]);
        setIsCartOpen(false);
        setAddress('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) { alert('Please select a file'); return; }
    if (!address.trim()) { alert('Please enter your delivery address'); return; }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await api.post('/pharmacy/orders/upload', {
            attachmentUrl: reader.result,
            deliveryAddress: address,
            // No pharmacistId — backend auto-assigns
          });
          alert('✅ Prescription submitted! The pharmacist will review it and send you an order with pricing.');
          setIsUploadOpen(false);
          setUploadFile(null);
        } catch (err: any) {
          alert(err.response?.data?.error || 'Upload failed');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(uploadFile);
    } catch {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40, background: '#0f172a',
        padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ background: '#0ea5e9', borderRadius: '10px', padding: '6px 8px' }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>MedLink</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Pharmacy</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '520px', position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search medicines, generics, manufacturers..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 42px',
              borderRadius: '8px', border: '1px solid #334155',
              background: '#1e293b', color: 'white', fontSize: '0.9rem', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <button
            onClick={() => setIsUploadOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              background: '#312e81', color: '#a5b4fc', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 500
            }}
          >
            <Upload size={16} /> Upload Rx
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              position: 'relative', padding: '8px 16px', borderRadius: '8px',
              background: '#0ea5e9', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
            }}
          >
            <ShoppingCart size={18} />
            Cart
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#ef4444', color: 'white', borderRadius: '50%',
                width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Banner ── */}
      {rxId && (
        <div style={{ background: '#ecfdf5', borderBottom: '1px solid #6ee7b7', padding: '10px 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#059669" />
          <span style={{ color: '#065f46', fontSize: '0.875rem', fontWeight: 500 }}>
            Active prescription attached — you can now add Schedule H medicines to your cart.
          </span>
        </div>
      )}

      {/* ── Order Success Banner ── */}
      {orderSuccess && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '12px',
          margin: '1rem 1.5rem', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ background: '#059669', borderRadius: '50%', padding: '8px' }}>
            <Truck size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#064e3b' }}>Order placed successfully! 🎉</div>
            <div style={{ color: '#065f46', fontSize: '0.875rem' }}>Your pharmacist will confirm and ship your order. Check "Pharmacy Orders" to track it.</div>
          </div>
          <button onClick={() => setOrderSuccess(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
        </div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        {/* ── Category Tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap',
                background: activeCategory === cat ? '#0ea5e9' : '#e2e8f0',
                color: activeCategory === cat ? 'white' : '#475569',
                transition: 'all 0.15s'
              }}
            >{cat}</button>
          ))}
        </div>

        {/* ── Results count ── */}
        <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {loading ? 'Loading...' : `${medicines.length} product${medicines.length !== 1 ? 's' : ''} found`}
        </div>

        {/* ── Medicine Grid ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : medicines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#64748b' }}>No medicines found</div>
            <div style={{ marginTop: '0.5rem' }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {medicines.map(med => {
              const tier = TIER_LABELS[med.prescriptionTier] || TIER_LABELS.otc;
              const inCart = cart.find(i => i.id === med.id);
              return (
                <div key={med.id} style={{
                  background: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  display: 'flex', flexDirection: 'column'
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  {/* Image area */}
                  <div style={{ height: '160px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {med.imageUrl ? (
                      <img src={med.imageUrl} alt={med.name} style={{ maxHeight: '130px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Package size={48} color="#bae6fd" />
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{med.dosageForm || 'Tablet'}</div>
                      </div>
                    )}
                    {/* Tier badge */}
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: tier.color, color: 'white', fontSize: '0.65rem',
                      fontWeight: 700, padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.5px'
                    }}>{tier.label}</div>
                    {med.stockQuantity <= 5 && med.stockQuantity > 0 && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#fef3c7', color: '#92400e', fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}>
                        Only {med.stockQuantity} left
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '2px', lineHeight: 1.3 }}>{med.name}</div>
                    {med.genericName && <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '6px' }}>{med.genericName}</div>}
                    {med.manufacturer && <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '8px' }}>by {med.manufacturer}</div>}

                    {/* Seller badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px', background: '#f0fdf4', padding: '5px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      <Store size={12} color="#16a34a" />
                      <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 500 }}>Sold by: {med.sellerName || 'MedLink Marketplace'}</span>
                    </div>

                    {/* Price */}
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                      ₹{med.price}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: '4px' }}>/ unit</span>
                    </div>

                    {/* Add to cart */}
                    <div style={{ marginTop: 'auto' }}>
                      {med.stockQuantity <= 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '8px', background: '#f1f5f9', borderRadius: '8px' }}>Out of Stock</div>
                      ) : med.prescriptionTier === 'restricted' ? (
                        <div style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.8rem', padding: '8px', background: '#fef2f2', borderRadius: '8px', fontWeight: 500 }}>In-Store Only</div>
                      ) : inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0ea5e9', borderRadius: '8px', padding: '2px' }}>
                          <button onClick={() => updateQty(med.id, -1)} style={{ background: 'none', border: 'none', color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}>−</button>
                          <span style={{ color: 'white', fontWeight: 700 }}>{inCart.quantity}</span>
                          <button onClick={() => addToCart(med)} style={{ background: 'none', border: 'none', color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}>+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(med)}
                          style={{
                            width: '100%', padding: '9px', borderRadius: '8px',
                            background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '6px', transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#0ea5e9')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#0f172a')}
                        >
                          <ShoppingCart size={15} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cart Sidebar ── */}
      {isCartOpen && (
        <>
          <div onClick={() => setIsCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: '420px',
            background: 'white', zIndex: 51, display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
                <ShoppingCart color="#0ea5e9" size={22} /> Your Cart
                {cartCount > 0 && <span style={{ background: '#0ea5e9', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.8rem' }}>{cartCount} items</span>}
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={22} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <div style={{ fontWeight: 600, color: '#64748b' }}>Your cart is empty</div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Browse medicines and add them here</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ background: '#e0f2fe', borderRadius: '8px', padding: '10px', flexShrink: 0 }}>
                        <Package size={20} color="#0284c7" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '0.9rem' }}>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                        <span style={{ width: '24px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {/* Delivery info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  <Truck size={14} /> Free delivery on all medicine orders
                </div>

                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Delivery Address *</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your full address with pincode..."
                  rows={2}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                  <span>Subtotal ({cartCount} items)</span><span>₹{total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#16a34a', marginBottom: '12px' }}>
                  <span>Delivery</span><span>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <span>Total</span><span>₹{total}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !address.trim()}
                  style={{
                    width: '100%', padding: '13px', borderRadius: '10px',
                    background: checkoutLoading || !address.trim() ? '#94a3b8' : '#0ea5e9',
                    color: 'white', border: 'none', cursor: checkoutLoading || !address.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px'
                  }}
                >
                  {checkoutLoading ? 'Placing Order...' : <>Place Order · ₹{total} <ChevronRight size={18} /></>}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Upload Prescription Modal ── */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="#6366f1" size={22} />
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Upload Prescription</h2>
              </div>
              <button onClick={() => setIsUploadOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.25rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#0369a1', lineHeight: 1.5 }}>
                  Upload your doctor's prescription and we'll assign a verified pharmacist to review it, build your order, and ship it to your address.
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Prescription (Image or PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '10px', border: '2px dashed #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', background: '#f8fafc' }}
                />
                {uploadFile && <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px' }}>✓ {uploadFile.name}</div>}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Delivery Address *</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address with pincode..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setIsUploadOpen(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadFile || !address.trim()}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', background: isUploading || !uploadFile || !address.trim() ? '#94a3b8' : '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isUploading ? 'Uploading...' : 'Submit Prescription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
