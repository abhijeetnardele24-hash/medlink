import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api } from './lib/api';
import './App.css';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { InventoryDashboard } from './pages/InventoryDashboard';

export interface UserProfile {
  id: string;
  role: string;
  profileStatus: 'active' | 'pending_verification' | 'suspended';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const res = await api.get('/auth/me');
          setProfile(res.data);
        } catch (err) {
          console.error('Failed to fetch profile', err);
          // If profile fails, it might mean the user exists in Firebase but not in our DB
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        <Route
          path="/onboarding"
          element={
            user && profile?.profileStatus === 'pending_verification' ? (
              <Onboarding />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : !profile ? (
              <Navigate to="/login" />
            ) : profile.profileStatus === 'pending_verification' ? (
              <Navigate to="/onboarding" />
            ) : (
              <InventoryDashboard user={user} profile={profile} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
