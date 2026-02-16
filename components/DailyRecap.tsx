
import React from 'react';
import { Sun, Moon, Loader2, TrendingUp } from 'lucide-react';
import { useDailyRecap } from '../hooks/useParkingData';

export const DailyRecap: React.FC = () => {
  const { data, isLoading, error } = useDailyRecap();

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-4">
        <div className="bg-white dark:bg-gray-900 h-24 rounded-2xl shadow-sm border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center transition-colors">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
        </div>
      </div>
    );
  }

  if (error) return null;

  const totalPagi = data?.Pagi || 0;
  const totalMalam = data?.Malam || 0;
  const totalHariIni = totalPagi + totalMalam;

  return (
    <div className="px-4 pt-4">
      {/* RULE 1: High Contrast Solar Header */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl p-5 text-white shadow-xl mb-4 flex items-center justify-between border-l-8 border-blue-500 transition-colors">
        <div>
          <p className="text-blue-400 dark:text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">TOTAL HARI INI</p>
          <h2 className="text-4xl font-black tracking-tighter">{formatRupiah(totalHariIni)}</h2>
        </div>
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
          <TrendingUp className="text-white w-8 h-8" strokeWidth={3} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-md border-b-4 border-orange-500 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Sun size={18} className="text-orange-600 dark:text-orange-400" strokeWidth={3} />
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-400 uppercase tracking-wider">PAGI</span>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatRupiah(totalPagi)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-md border-b-4 border-indigo-700 dark:border-indigo-500 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Moon size={18} className="text-indigo-800 dark:text-indigo-400" strokeWidth={3} />
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-400 uppercase tracking-wider">MALAM</span>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatRupiah(totalMalam)}</p>
        </div>
      </div>
    </div>
  );
};
