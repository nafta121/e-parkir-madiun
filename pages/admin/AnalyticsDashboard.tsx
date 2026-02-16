
import React from 'react';
import { useCollectorAnalytics } from '../../hooks/useParkingData';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';

// Helpers outside component
const formatIDR = (val: number) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);

export const AnalyticsDashboard: React.FC = () => {
  // [REFACTOR] Mengganti useEffect dan useState dengan satu panggilan hook React Query
  const { data, isLoading, error } = useCollectorAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
        <span className="ml-3 text-gray-500 font-medium">Memuat Analisa Performa...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-200">
        <AlertCircle size={20} />
        <div>
          <p className="font-bold">Gagal memuat data</p>
          {/* Menggunakan error.message dari objek error React Query */}
          <p className="text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
          <TrendingUp className="text-blue-700" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Analisa Performa Kolektor</h2>
          <p className="text-sm text-gray-500">Monitoring setoran realtime berdasarkan periode waktu.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Kolektor</th>
                <th className="px-6 py-4 text-right bg-blue-50 text-blue-800 border-l border-blue-100">Hari Ini</th>
                <th className="px-6 py-4 text-right">7 Hari</th>
                <th className="px-6 py-4 text-right">1 Bulan</th>
                <th className="px-6 py-4 text-right hidden sm:table-cell">3 Bulan</th>
                <th className="px-6 py-4 text-right hidden lg:table-cell">6 Bulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.map((row, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-gray-900 sticky left-0 bg-white group-hover:bg-blue-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-gray-100">
                    {row.collector_name || 'Tanpa Nama'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/30 group-hover:bg-blue-100/30 border-l border-blue-100">
                    {formatIDR(row.total_today)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700">{formatIDR(row.total_1week)}</td>
                  <td className="px-6 py-4 text-right text-gray-700">{formatIDR(row.total_1month)}</td>
                  <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">{formatIDR(row.total_3months)}</td>
                  <td className="px-6 py-4 text-right text-gray-500 hidden lg:table-cell">{formatIDR(row.total_6months)}</td>
                </tr>
              ))}
              
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center gap-2">
                       <AlertCircle size={24} className="opacity-50" />
                       <p>Belum ada data transaksi yang tercatat.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
