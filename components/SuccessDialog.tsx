
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-gray-950 w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200 transition-colors">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600 dark:text-green-400 w-14 h-14" strokeWidth={3} />
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight uppercase">BERHASIL!</h2>
        <p className="text-gray-800 dark:text-gray-300 font-bold mb-8 leading-snug">
          Data setoran parkir telah terkirim dan tersimpan di server.
        </p>
        
        <button
          onClick={onClose}
          className="w-full h-20 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all text-2xl uppercase tracking-wider dark:shadow-green-950/20"
        >
          SELESAI
        </button>
      </div>
    </div>
  );
};
