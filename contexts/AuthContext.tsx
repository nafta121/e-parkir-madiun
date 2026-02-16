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

  // REFACTORED: Ambil sesi awal dengan fitur Auto-Recovery (Self-Healing)
  useEffect(() => {
    let isMounted = true;

    // Fungsi sapu jagat untuk menghapus token Supabase yang korup secara otomatis
    const clearCorruptedStorage = () => {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
            console.warn("♻️ [AUTO-RECOVERY] Data sesi lama yang rusak telah dibersihkan otomatis.");
          }
        });
      } catch (e) {
        console.error("Gagal membersihkan storage:", e);
      }
    };

    // Fail-safe timer: Jika 3 detik tidak ada respon, hapus paksa token lama
    const emergencyStop = setTimeout(() => {
      if (isMounted) {
        console.error("⏱️ [FAIL-SAFE] Supabase tidak merespons. Memaksa pembersihan sesi...");
        clearCorruptedStorage();
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    }, 3000);

    const initializeAuth = async () => {
      try {
        setLoading(true);
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
        // Jika Supabase melemparkan error (karena token kedaluwarsa/rusak), tangkap di sini!
        console.error("🚨 Error inisialisasi sesi, melakukan auto-recovery:", error);
        clearCorruptedStorage(); // Jalankan pembersihan otomatis
        if (isMounted) {
          setSession(null);
          setUser(null);
          setRole(null);
        }
      } finally {
        // Matikan loading dan timer darurat
        if (isMounted) {
          clearTimeout(emergencyStop);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
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

    return () => {
      isMounted = false;
      clearTimeout(emergencyStop);
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
