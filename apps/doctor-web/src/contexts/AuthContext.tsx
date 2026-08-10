import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  profile: { id: string; verificationStatus: string; fullName?: string } | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ id: string; verificationStatus: string } | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true);
          const res = await api.get('/doctors/me', { headers: { Authorization: `Bearer ${idToken}` } });
          if (res.data) {
            setProfile(res.data ?? null);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!auth?.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const res = await api.get('/doctors/me', { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.data) {
        setProfile(res.data ?? null);
      }
    } catch {
      setProfile(null);
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const getToken = async () => {
    if (!auth?.currentUser) return null;
    return await auth.currentUser.getIdToken(true);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, getToken, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
