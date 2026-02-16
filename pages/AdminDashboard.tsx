
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminTransactions, useAdminUsers, useFilteredTotal } from '../hooks/useParkingData';
import { Header } from '../components/UIComponents';
import { UserManagement } from './admin/UserManagement';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { AreaManagement } from './admin/AreaManagement';
import { JukirManagement } from './admin/JukirManagement';
import { Loader2, DollarSign, Users, BarChart3, Map, BadgeCheck, Filter, Calendar, RotateCcw, User, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// DRY Principle: Extracted Tailwind classes for tab buttons
const tabButtonBase = "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap";
const tabButtonActive = "bg-blue-100 text-blue-700 shadow-sm";
const tabButtonInactive = "text-gray-600 hover:bg-gray-100";

const adminTabs = [
  { id: 'transactions', label: 'Data Transaksi', icon: DollarSign },
  { id: 'analytics', label: 'Analisa', icon: BarChart3 },
  { id: 'jukir', label: 'Master Jukir', icon: BadgeCheck },
  { id: 'area', label: 'Penugasan', icon: Map },
  { id: 'users', label: 'User', icon: Users },
];

export const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'analytics' | 'area' | 'jukir'>('transactions');
  
  // PERFORMANCE: Memoize the empty function to prevent Header re-renders.
  const handleToggleShift = useCallback(() => {}, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header shift="Pagi" onToggleShift={handleToggleShift} onLogout={signOut} />
      
      <div className="bg-white shadow px-4 py-2 border-b flex gap-2 overflow-x-auto no-scrollbar">
        {adminTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`${tabButtonBase} ${activeTab === tab.id ? tabButtonActive : tabButtonInactive}`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 overflow-auto">
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'area' && <AreaManagement />}
        {activeTab === 'jukir' && <JukirManagement />}
      </main>
    </div>
  );
};

// --- Child Component: TransactionsTab (OPTIMIZED) ---

// Formatting helpers outside component for performance
const formatRupiah = (val: number | null | undefined) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

// REFACTORED: Enhanced date formatting for professional look
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'Asia/Jakarta'
  };
  // Format and replace dot separator for time with a colon for consistency
  const formatted = new Intl.DateTimeFormat('id-ID', options).format(d).replace(/\./g, ':');
  return `${formatted} WIB`;
};

const getTodayString = () => new Date().toISOString().split('T')[0];

// DRY Principle: Extracted table cell classes
const thClass = "px-4 py-3";
const tdClass = "px-4 py-3";
const ITEMS_PER_PAGE = 25; // Define page size constant

const TransactionsTab: React.FC = () => {
  // 1. State Management
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0); // For pagination

  // 2. Data Fetching with comprehensive state from react-query
  const { data: users, isError: usersError } = useAdminUsers();
  // Call optimized hook with pagination
  const { data: queryResult, isLoading, isError: transactionsError } = useAdminTransactions(selectedDate, selectedCollectorId, currentPage, ITEMS_PER_PAGE);
  // Call new optimized hook for total calculation
  const { data: total } = useFilteredTotal(selectedDate, selectedCollectorId);

  // Extract data and count from query result
  const transactions = queryResult?.data;
  const totalCount = queryResult?.count ?? 0;

  // 3. Memoized Derived Data for Performance Optimization
  const kolektorList = useMemo(() => {
    // [MODIFIKASI]: Filter diubah untuk menyertakan kolektor aktif dan nonaktif
    // Ini penting agar admin bisa melihat riwayat transaksi dari user yang sudah di-soft-delete.
    return users?.filter(u => u.role === 'kolektor' || u.role === 'nonaktif') ?? [];
  }, [users]);
  
  const displayDate = useMemo(() => selectedDate === getTodayString() 
    ? "HARI INI" 
    : new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  , [selectedDate]);
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 4. Handlers & Effects
  const handleReset = useCallback(() => {
    setSelectedDate(getTodayString());
    setSelectedCollectorId('all');
    setCurrentPage(0); // Reset page on filter reset
  }, []);
  
  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedDate, selectedCollectorId]);

  // 5. UI/UX: Graceful Error Handling
  if (usersError || transactionsError) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-xl flex items-start gap-4 border-2 border-red-200">
        <AlertCircle size={40} strokeWidth={2.5} className="flex-shrink-0" />
        <div>
          <h3 className="font-black text-lg">Gagal Memuat Data</h3>
          <p className="text-sm font-semibold mt-1">
            Terjadi kesalahan saat mengambil data dari server. Silakan coba muat ulang halaman atau hubungi administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700 font-bold text-sm uppercase tracking-wide">
          <Filter size={18} />
          <span>Filter Data</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-auto">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold text-gray-700"
            />
          </div>

          <div className="relative flex-1 sm:w-auto">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={selectedCollectorId}
              onChange={(e) => setSelectedCollectorId(e.target.value)}
              className="pl-10 pr-8 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold text-gray-700 appearance-none bg-white"
            >
              <option value="all">Semua Kolektor</option>
              {kolektorList.map(k => (
                <option key={k.id} value={k.id}>
                  {k.full_name || k.email}
                  {k.role === 'nonaktif' ? ' (Nonaktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            title="Reset ke Hari Ini"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div>
          <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">TOTAL PENERIMAAN ({displayDate})</p>
          <h2 className="text-3xl font-bold">{formatRupiah(total)}</h2>
          <p className="text-blue-200 text-xs mt-2">
            Dari {totalCount} transaksi
            {selectedCollectorId !== 'all' && ' • Filter Kolektor Aktif'}
          </p>
        </div>
      </div>

      {/* DATA TABLE WRAPPER */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12 gap-3 text-gray-500">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="font-semibold">Memuat Transaksi...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
                <tr>
                  <th className={thClass}>Waktu</th>
                  <th className={thClass}>Kolektor</th>
                  <th className={thClass}>Jukir</th>
                  <th className={thClass}>Ruas Jalan</th>
                  <th className={`${thClass} text-right`}>Nominal</th>
                  <th className={`${thClass} text-center`}>Shift</th>
                  <th className={`${thClass} text-center`}>Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions?.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className={`${tdClass} text-gray-500 whitespace-nowrap font-mono text-xs`}>
                      {formatDate(trx.created_at)}
                    </td>
                    <td className={`${tdClass} text-gray-800 font-semibold`}>
                      {trx.profiles?.full_name ?? 'Kolektor Anonim'}
                    </td>
                    <td className={`${tdClass} font-medium text-gray-900`}>{trx.jukir_name ?? 'Tidak diketahui'}</td>
                    <td className={`${tdClass} text-gray-700 font-medium`}>
                       {trx.street_name ?? 'Lokasi tidak diketahui'}
                    </td>
                    <td className={`${tdClass} text-right font-bold text-green-600 font-mono`}>
                      {formatRupiah(trx.amount)}
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        trx.shift === 'Pagi' 
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {trx.shift}
                      </span>
                    </td>
                    <td className={`${tdClass} text-center`}>
                       {trx.image_path ? (
                         <a 
                          href={`https://bjznjmrtvnccuzxebzjv.supabase.co/storage/v1/object/public/evidence/${trx.image_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-bold"
                         >
                           FOTO
                         </a>
                       ) : (
                         <span className="text-gray-300">-</span>
                       )}
                    </td>
                  </tr>
                ))}
                
                {(!transactions || transactions.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Filter size={32} className="opacity-20" />
                        <p className="font-semibold">Tidak ada transaksi ditemukan</p>
                        <p className="text-xs">Coba ubah tanggal atau filter kolektor.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* PAGINATION CONTROLS */}
        {totalCount > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50/50 flex items-center justify-between text-xs font-semibold text-gray-600">
            <div>
              Menampilkan <span className="font-bold">{currentPage * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold">{Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)}</span> dari <span className="font-bold">{totalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="h-8 w-8 flex items-center justify-center rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <span>Halaman <span className="font-bold">{currentPage + 1}</span> dari {totalPages}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages} className="h-8 w-8 flex items-center justify-center rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
