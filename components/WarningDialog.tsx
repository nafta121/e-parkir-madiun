
import React from 'react';
import { TriangleAlert } from 'lucide-react';

interface WarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  target: number;
  current: number;
}

export const WarningDialog: React.FC<WarningDialogProps> = ({ isOpen, onClose, onConfirm, target, current }) => {
  if (!isOpen) return null;

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 border-t-4 border-yellow-500 transition-colors">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <TriangleAlert className="text-yellow-600 dark:text-yellow-400 w-8 h-8" strokeWidth={3} />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Setoran Kurang!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
          Target setoran adalah <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(target)}</span>, 
          tapi input anda hanya <span className="font-bold text-red-600 dark:text-red-400">{formatRupiah(current)}</span>.
          <br/><br/>
          Apakah anda yakin ingin melanjutkan?
        </p>
        
        <div className="flex gap-3">
            <button
            onClick={onClose}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl active:scale-95 transition-all"
            >
            Perbaiki
            </button>
            <button
            onClick={onConfirm}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
            Ya, Simpan
            </button>
        </div>
      </div>
    </div>
  );
};
