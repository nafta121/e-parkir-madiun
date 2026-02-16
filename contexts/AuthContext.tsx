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

  // REFACTORED: Ambil sesi awal secara manual, lalu dengarkan perubahannya
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        // 1. Ambil sesi secara aktif saat pertama kali load / reload
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          const userRole = await fetchUserRoleSafe(session.user.id);
          if (isMounted) {
            setSession(session);
            setUser(session.user);
            setRole(userRole);
          }
        }
      } catch (error) {
        console.error("Error pada inisialisasi sesi:", error);
      } finally {
        // Apapun yang terjadi (sukses/gagal/kosong), WAJIB matikan loading
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Jalankan pengambilan sesi awal
    initializeAuth();

    // 2. Pasang pendengar untuk event selanjutnya (seperti saat user klik Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Agar tidak loading terus saat token refresh
        const userRole = await fetchUserRoleSafe(session.user.id);
        if (isMounted) {
          setSession(session);
          setUser(session.user);
          setRole(userRole);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    });

    // Bersihkan listener saat komponen dibongkar (mencegah memory leak)
    return () => {
      isMounted = false;
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
