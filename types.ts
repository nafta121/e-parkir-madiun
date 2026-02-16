
// --- Master Data Interfaces ---

/**
 * Represents a Jukir (Juru Parkir) and their assigned parking point.
 * Aligned with the 'parking_points' table.
 */
export interface Jukir {
  // --- Primary, Strict Properties (from parking_points table) ---
  id: number; // The primary key from the database is a number.
  jukir_name: string;
  street_name: string;
  location_name: string; // Specific parking point (e.g., "Depan Toko A")
  shift: 'Pagi' | 'Malam';
  target_amount: number;
  is_active?: boolean; // For Soft Delete feature

  // --- Dynamic/Derived Properties (not from DB table directly) ---
  has_paid_today?: boolean; 
  
  // --- Optional Legacy Properties (for backward compatibility with old RPCs) ---
  nama_jukir?: string;
  lokasi_parkir?: string;
  jenis_shift?: 'Pagi' | 'Malam';
  target_setoran?: number;
  "Nama Jukir"?: string;
  "Titik Parkir"?: string;
}

/**
 * Represents a street name entity.
 */
export interface StreetData {
  ruas_jalan?: string;
  street_name?: string;
  "Ruas Jalan"?: string;
  name?: string;
}

// --- Transaction-related Interfaces ---

export type ShiftType = 'Pagi' | 'Malam';

/**
 * Defines the shape of data required to submit a new transaction.
 */
export interface TransactionPayload {
  jukir_id: string; // Aligned with DB schema (text)
  jukir_name: string;
  shift: ShiftType;
  amount: number;
  street_name: string;
  location_name: string;
  image_file?: File | null;
}

/**
 * Represents a transaction record from the 'transactions' table.
 */
export interface Transaction {
  id: number;
  created_at: string;
  updated_at?: string; // Added property
  jukir_id: string; // Aligned with DB schema (text)
  jukir_name: string;
  shift: string;
  amount: number;
  street_name: string;
  location_name?: string; // Added property
  image_path: string | null;
  user_id?: string;
}

// --- User & Authentication Interfaces ---

/**
 * Defines the possible roles a user can have in the system.
 * Includes 'nonaktif' for soft-deleted users.
 */
export type UserRole = 'admin' | 'kolektor' | 'nonaktif';

/**
 * Represents a user profile from the 'profiles' table.
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at?: string;
}

// --- Analytics Interface ---

/**
 * Represents a row of aggregated analytics data for a collector.
 */
export interface AnalyticsRow {
  collector_name: string;
  total_today: number;
  total_1week: number;
  total_1month: number;
  total_3months: number;
  total_6months: number;
}
