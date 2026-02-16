

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Jukir, ShiftType, StreetData, TransactionPayload, Transaction, UserProfile, UserRole, AnalyticsRow } from '../types';

// Hook 1: Current Shift Logic
export const useCurrentShift = () => {
  const [currentShift, setCurrentShift] = useState<ShiftType>('Pagi');

  useEffect(() => {
    const checkShift = () => {
      const hour = new Date().getHours();
      // Updated Shift Logic: Pagi is 07:00 to 17:59
      if (hour >= 7 && hour < 18) {
        setCurrentShift((prev) => prev !== 'Pagi' ? 'Pagi' : prev);
      } else {
        setCurrentShift((prev) => prev !== 'Malam' ? 'Malam' : prev);
      }
    };

    checkShift();
    const interval = setInterval(checkShift, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleShift = useCallback(() => {
    setCurrentShift((prev) => (prev === 'Pagi' ? 'Malam' : 'Pagi'));
  }, []);

  return { currentShift, toggleShift, setCurrentShift };
};

// Hook 2: Get All Streets
export const useStreetNames = () => {
  return useQuery({
    queryKey: ['streets'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_ruas_jalan');
      if (error) throw error;
      return data as StreetData[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Hook 3: Get Jukirs by Street and Shift (with Data Normalization)
export const useJukirList = (street: string, shift: ShiftType) => {
  return useQuery({
    queryKey: ['jukirs', street, shift],
    queryFn: async (): Promise<Jukir[]> => {
      if (!street) return [];
      const { data, error } = await supabase.rpc('get_jukir_by_ruas_jalan', {
        target_jalan: street,
        filter_shift: shift,
      });

      if (error) throw error;

      // STABILITY & PERFORMANCE: Normalize inconsistent data structures at the source.
      // This ensures the rest of the app deals with a clean, predictable model.
      if (!data) return [];
      
      return data.map((item: any) => ({
        id: item.id,
        jukir_name: item.nama_jukir || item.jukir_name || item['Nama Jukir'] || 'N/A',
        location_name: item.lokasi_parkir || item.location_name || item['Titik Parkir'] || 'N/A',
        shift: item.jenis_shift || item.shift,
        street_name: street, // Ensure street_name is consistently populated
        target_setoran: item.target_setoran || item.target_amount || 0,
        target_amount: item.target_setoran || item.target_amount || 0,
      }));
    },
    enabled: !!street,
    staleTime: 1000 * 60,
  });
};

// --- PARKING POINTS (JUKIR MASTER) HOOKS ---

export const useParkingPoints = () => {
  return useQuery({
    queryKey: ['parking-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parking_points')
        .select('*')
        .order('jukir_name', { ascending: true });
      if (error) throw error;
      return data as any[];
    }
  });
};

export const useSaveParkingPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await supabase
          .from('parking_points')
          .update(payload)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('parking_points')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-points'] });
    }
  });
};

export const useToggleParkingPointStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: number, is_active: boolean }) => {
      const { error } = await supabase
        .from('parking_points')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-points'] });
    }
  });
};

// --- TRANSACTION HOOKS ---

// New Hook: Get transactions for the current user for today
export const useTodaysTransactions = () => {
  return useQuery({
    queryKey: ['todays-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.toISOString();
      
      today.setHours(23, 59, 59, 999);
      const endOfDay = today.toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('jukir_id, shift') // Fetch shift for accurate checking
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);
      
      if (error) {
        console.error("Error fetching today's transactions:", error);
        return [];
      }
      return data as { jukir_id: string; shift: string; }[];
    },
    staleTime: 1000 * 60, // Refetch every minute
  });
};


export const useSubmitTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TransactionPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let imagePath = null;
      if (payload.image_file) {
        const fileExt = payload.image_file.name.split('.').pop() || 'jpg';
        // SECURITY: Add random element to prevent theoretical filename collisions
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${payload.jukir_id}.${fileExt}`;
        const filePath = `uploads/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('evidence').upload(filePath, payload.image_file);
        if (uploadError) {
          console.error("Upload Error:", uploadError);
          // Don't throw, but log it. Transaction can still proceed without image.
        } else {
           imagePath = filePath;
        }
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
            jukir_id: payload.jukir_id,
            jukir_name: payload.jukir_name,
            shift: payload.shift,
            amount: payload.amount,
            street_name: payload.street_name,
            location_name: payload.location_name,
            image_path: imagePath,
            user_id: user.id
          }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all relevant queries after a transaction is submitted
      queryClient.invalidateQueries({ queryKey: ['daily-recap'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] }); 
      queryClient.invalidateQueries({ queryKey: ['filtered-total'] });
      queryClient.invalidateQueries({ queryKey: ['todays-transactions'] });
      // [MODIFIKASI]: Invalidate analytics data for real-time dashboard updates
      queryClient.invalidateQueries({ queryKey: ['collector-analytics'] });
    }
  });
};

export const useDailyRecap = () => {
  return useQuery({
    queryKey: ['daily-recap'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_daily_recap');
      if (error) {
        console.error("Failed to fetch daily recap:", error);
        return { Pagi: 0, Malam: 0 }; // Stability: return default on error
      }
      const result = { Pagi: 0, Malam: 0 };
      if (data) {
        data.forEach((row: any) => {
          if (row.shift_type === 'Pagi') result.Pagi = Number(row.total_amount);
          if (row.shift_type === 'Malam') result.Malam = Number(row.total_amount);
        });
      }
      return result;
    }
  });
};

// --- AREA ASSIGNMENT HOOKS ---

export const useCollectorAssignments = (userId?: string) => {
  return useQuery({
    queryKey: ['assignments', userId || 'me'],
    queryFn: async () => {
      let targetId = userId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        targetId = user.id;
      }
      const { data, error } = await supabase.from('collector_assignments').select('id, ruas_jalan').eq('user_id', targetId);
      if (error) throw error;
      return data as { id: number, ruas_jalan: string }[];
    },
    enabled: !!userId, // Only run if a userId is provided
  });
};

export const useAllAssignments = () => {
  return useQuery({
    queryKey: ['all-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collector_assignments')
        .select('id, ruas_jalan, profiles(id, full_name)')
        .order('ruas_jalan', { ascending: true });
      if (error) throw error;
      
      // Type assertion for better type safety in components
      return data as {
        id: number;
        ruas_jalan: string;
        profiles: { id: string; full_name: string | null; } | null
      }[];
    }
  });
};

export const useAssignStreet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, streetName }: { userId: string, streetName: string }) => {
      const { error } = await supabase.from('collector_assignments').insert([{ user_id: userId, ruas_jalan: streetName }]);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
    }
  });
};

export const useUnassignStreet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ streetName, userId }: { streetName: string, userId: string }) => {
      const { error } = await supabase.rpc('unassign_collector_street', {
        target_user_id: userId,
        target_street: streetName
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
    }
  });
};

export const useReassignStreet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, newUserId }: { assignmentId: number, newUserId: string }) => {
      const { error } = await supabase
        .from('collector_assignments')
        .update({ user_id: newUserId })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both views for data consistency
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] }); // Invalidate all assignment queries
      alert('Penugasan berhasil dipindahkan!');
    },
    onError: (err: any) => {
      alert(`Gagal memindahkan tugas: ${err.message || 'Kesalahan Server'}`);
    }
  });
};

// --- ADMIN HOOKS (OPTIMIZED) ---

// OPTIMIZED for PAGINATION & SELECTIVE COLUMNS
export const useAdminTransactions = (dateFilter: string, collectorId: string | undefined, page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['admin-transactions', dateFilter, collectorId, page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('transactions')
        .select('id, created_at, jukir_name, street_name, amount, shift, image_path, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Server-side Filtering
      if (dateFilter) {
        const startOfDay = `${dateFilter}T00:00:00Z`;
        const endOfDay = `${dateFilter}T23:59:59Z`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }
      if (collectorId && collectorId !== 'all') {
        query = query.eq('user_id', collectorId);
      }

      const { data, error, count } = await query;
      if (error) {
        console.error('Fetch Error:', error);
        throw error;
      }
      
      const typedData = data as (Transaction & { profiles?: { full_name: string } })[];
      return { data: typedData, count };
    }
  });
};

// OPTIMIZATION 4: Dedicated hook for server-side aggregation
export const useFilteredTotal = (dateFilter: string, collectorId?: string) => {
  return useQuery({
    queryKey: ['filtered-total', dateFilter, collectorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_filtered_transactions_total', {
        date_filter: dateFilter,
        collector_id_filter: collectorId === 'all' ? null : collectorId
      });
      if (error) throw error;
      return data as number;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    }
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });
};

// [BARU] Hook untuk data Analisa Performa Kolektor
export const useCollectorAnalytics = () => {
  return useQuery({
    queryKey: ['collector-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_collector_analytics');
      if (error) throw error;
      return data as AnalyticsRow[];
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });
};
