import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { api } from '../lib/api';
import './PharmacyStorefront.css';
import { ShoppingCart, Search, LogOut, Package, CreditCard } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  price: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  category: string;
}

interface CartItem extends Medicine {
  quantity: number;
}

export function PharmacyStorefront() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const rxId = searchParams.get('rxId');
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  const fetchMedicines = async () => {
    try {
      const res = await api.get(`/medicines?search=${search}`);
      setMedicines(res.data.medicines);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (med: Medicine) => {
    if (med.requiresPrescription && !rxId) {
      alert("This medicine requires a prescription. Please access the pharmacy from your prescription receipt.");
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
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const payload = {
        prescriptionId: rxId || undefined,
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
        },
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: "#423FDE"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={32} color="var(--accent)" />
          <h1 style={{ margin: 0 }}>MedLink Pharmacy</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {rxId && (
            <span style={{ padding: '0.5rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontWeight: 600 }}>
              Prescription Attached
            </span>
          )}
          <button 
            aria-label={`Open cart with ${cart.length} items`}
            aria-expanded={isCartOpen}
            className="btn btn-secondary" 
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart size={20} />
            <span style={{ marginLeft: '0.5rem' }}>{cart.length}</span>
          </button>
          <button aria-label="Log out" className="btn btn-secondary" style={{ display: 'none' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="search"
          aria-label="Search medicines"
          placeholder="Search medicines..." 
          className="input-field" 
          style={{ paddingLeft: '3rem', maxWidth: '400px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="medicine-grid">
        {medicines.map(med => (
          <div key={med.id} className="medicine-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>{med.name}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{med.genericName}</p>
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--accent)' }}>₹{med.price}</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <span className="pill-badge" style={{ background: 'var(--bg-surface-elevated)' }}>{med.category}</span>
              {med.requiresPrescription && (
                <span className="pill-badge" style={{ background: '#fef2f2', color: '#ef4444', marginLeft: '0.5rem' }}>Rx Required</span>
              )}
            </div>

            <button 
              aria-label={`Add ${med.name} to cart`}
              className="btn btn-primary" 
              style={{ marginTop: 'auto', width: '100%' }}
              onClick={() => addToCart(med)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Your Cart</h2>
          <button aria-label="Close cart" className="btn btn-secondary" onClick={() => setIsCartOpen(false)} style={{ padding: '0.5rem' }}>✕</button>
        </div>

        {cart.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Your cart is empty</p>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.name}</h4>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      ₹{item.price} x {item.quantity}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                    <button aria-label={`Remove ${item.name} from cart`} className="focus-ring" onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', outline: 'none' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Delivery Address</label>
                <textarea 
                  id="deliveryAddress"
                  aria-label="Delivery Address"
                  className="input-field" 
                  rows={3} 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full delivery address"
                />
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleCheckout}
                disabled={loading}
              >
                <CreditCard size={20} />
                {loading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


