
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRoleSafe = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error || !data) return 'kolektor';
      return data.role as UserRole;
    } catch (err) {
      return 'kolektor';
    }
  };

  // REFACTORED: Rely on onAuthStateChange as the single source of truth
  // This prevents race conditions on app load/refresh.
  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // A session exists, now we MUST fetch the role before we stop loading.
        const userRole = await fetchUserRoleSafe(session.user.id);
        setSession(session);
        setUser(session.user);
        setRole(userRole);
      } else {
        // No session, clear all user-related state.
        setSession(null);
        setUser(null);
        setRole(null);
      }
      
      // CRITICAL: Set loading to false only after all async operations (like role fetching) are complete.
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // State will be cleared automatically by the onAuthStateChange listener
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Gagal keluar dari sistem. Silakan coba lagi.");
      }
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    role,
    isAdmin: role === 'admin',
    loading,
    signOut,
  }), [session, user, role, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
