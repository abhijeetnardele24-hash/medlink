import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api } from './lib/api';
import './App.css';
import { Package, Activity, LogOut } from 'lucide-react';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { IncomingOrders } from './pages/IncomingOrders';
import { OrderDetail } from './pages/OrderDetail';

export interface UserProfile {
  id: string;
  role: string;
  profileStatus: 'active' | 'pending_verification' | 'suspended';
}

function Layout({ user, profile, children }: { user: User, profile: UserProfile, children: React.ReactNode }) {
  const location = useLocation();
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-teal-700">MedLink Pharmacy</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/orders" className={`flex items-center gap-2 p-3 rounded-lg ${location.pathname.includes('/orders') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Activity size={20} /> Incoming Orders
          </Link>
          <Link to="/inventory" className={`flex items-center gap-2 p-3 rounded-lg ${location.pathname.includes('/inventory') ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Package size={20} /> Inventory
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-2 p-3 rounded-lg text-red-600 hover:bg-red-50 w-full">
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
          // Sign out so they can try again cleanly
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
                  <Route path="/inventory" element={<InventoryDashboard user={user} profile={profile} />} />
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
