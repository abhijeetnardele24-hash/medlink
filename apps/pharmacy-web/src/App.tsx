import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api } from './lib/api';
import './App.css';
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

function PharmacyCatalog({ user }: { user: User }) {
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
          email: user.email,
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
          <button className="btn btn-secondary" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
            <span style={{ marginLeft: '0.5rem' }}>{cart.length}</span>
          </button>
          <button className="btn btn-secondary" onClick={() => signOut(auth)}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
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
          <button className="btn btn-secondary" onClick={() => setIsCartOpen(false)} style={{ padding: '0.5rem' }}>✕</button>
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
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <form onSubmit={handleLogin} style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>MedLink Pharmacy</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <PharmacyCatalog user={user} /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
