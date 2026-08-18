import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api } from './lib/api';
import './App.css';
import { Package, Activity, LogOut, DollarSign, History, BarChart3, Settings as SettingsIcon } from 'lucide-react';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { IncomingOrders } from './pages/IncomingOrders';
import { OrderDetail } from './pages/OrderDetail';
import { Earnings } from './pages/Earnings';
import { Analytics } from './pages/Analytics';
import { OrderHistory } from './pages/OrderHistory';
import { Settings } from './pages/Settings';

export interface UserProfile {
  id: string;
  role: string;
  profileStatus: 'active' | 'pending_verification' | 'suspended';
}

function Layout({ user, profile, children }: { user: User, profile: UserProfile, children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleLogout = () => {
    auth.signOut();
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        fetchNotifications();
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
    if (notif.metadataJson?.orderId) {
      navigate(`/orders/${notif.metadataJson.orderId}`);
    } else {
      navigate('/orders');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-[0.12em] uppercase text-gray-900" style={{ fontFamily: '"Inter", sans-serif', margin: 0, lineHeight: 1 }}>
              Med<span className="font-light">Link</span>
            </h1>
            <p className="text-xs text-teal-600 font-medium tracking-wider uppercase mt-1 mb-0">Pharmacy</p>
          </div>
          
          <button className="relative p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            
            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-3 border-b text-sm font-bold text-gray-900 text-left flex justify-between items-center">
                Notifications
                {unreadCount > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{unreadCount} new</span>}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 text-sm text-left border-b cursor-pointer transition-colors ${notif.isRead ? 'text-gray-500 hover:bg-gray-50' : 'bg-teal-50/30 text-gray-800 hover:bg-teal-50/60'}`}
                    >
                      <span className={`block font-medium ${notif.isRead ? 'text-gray-700' : 'text-teal-700'}`}>{notif.title}</span>
                      {notif.message}
                      <span className="block text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
              <Link to="/orders" className="block p-3 text-center text-xs text-teal-600 font-medium hover:bg-gray-50 rounded-b-xl">
                View Orders
              </Link>
            </div>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link to="/orders" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname.includes('/orders') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Activity size={20} /> Active Orders
          </Link>
          <Link to="/inventory" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname.includes('/inventory') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Package size={20} /> Inventory
          </Link>
          <div className="my-4 border-t border-gray-100"></div>
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Enterprise</p>
          <Link to="/history" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname.includes('/history') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <History size={20} /> Order History
          </Link>
          <Link to="/earnings" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname.includes('/earnings') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <DollarSign size={20} /> Earnings
          </Link>
          <Link to="/analytics" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname.includes('/analytics') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <BarChart3 size={20} /> Analytics
          </Link>
          <div className="my-4 border-t border-gray-100"></div>
          <Link to="/settings" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname.includes('/settings') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <SettingsIcon size={20} /> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 w-full transition-colors font-medium">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const res = await api.get('/auth/me');
          setProfile(res.data);
          setProfileError(null);
        } catch (err: any) {
          console.error('Failed to fetch profile', err);
          setProfile(null);
          if (err?.response?.status === 404 || err?.response?.status === 403) {
            setProfileError('Account not found in database. Please sign up first or contact support.');
          } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
            setProfileError('Cannot connect to server. Make sure the backend is running on port 3005.');
          } else {
            setProfileError('Login failed: ' + (err?.response?.data?.error || err.message));
          }
          await auth.signOut();
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={(!user || !profile) ? <Login profileError={profileError} /> : <Navigate to="/orders" />} />
        <Route path="/signup" element={(!user || !profile) ? <Signup /> : <Navigate to="/orders" />} />
        <Route
          path="/onboarding"
          element={
            user && profile?.profileStatus === 'pending_verification' ? (
              <Onboarding />
            ) : (
              <Navigate to="/orders" />
            )
          }
        />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            (!user || !profile) ? (
              <Navigate to="/login" state={{ error: profileError }} />
            ) : profile.profileStatus === 'pending_verification' ? (
              <Navigate to="/onboarding" />
            ) : (
              <Layout user={user} profile={profile}>
                <Routes>
                  <Route path="/orders" element={<IncomingOrders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/history" element={<OrderHistory />} />
                  <Route path="/inventory" element={<InventoryDashboard user={user} profile={profile} />} />
                  <Route path="/earnings" element={<Earnings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/orders" replace />} />
                </Routes>
              </Layout>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
