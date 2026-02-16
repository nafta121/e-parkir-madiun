
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, X, Check, Loader2, Sun, Moon, Banknote, Target, Navigation, LogOut, User, Volume2, VolumeX, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import { Jukir, ShiftType, StreetData } from '../types';
import { WarningDialog } from './WarningDialog';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useCollectorAssignments } from '../hooks/useParkingData';
import { useFeedback } from '../hooks/useFeedback';

// --- Shared Helpers ---
const formatRupiah = (angka: number | undefined | null) => {
  if (angka === undefined || angka === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

// --- Header Component ---
interface HeaderProps {
  shift: ShiftType;
  onToggleShift: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({ shift, onToggleShift, onLogout }) => {
  const isPagi = shift === 'Pagi';
  const now = new Date();
  const dateString = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const { isMuted, toggleMute } = useFeedback();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b-2 border-gray-200 dark:border-gray-800 shadow-md px-4 py-3 flex justify-between items-center min-h-[70px] transition-colors">
      <div>
        <h1 className="font-black text-xl text-gray-900 dark:text-white leading-tight tracking-tight">E-PARKIR</h1>
        <p className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">{dateString} • {timeString}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button onClick={toggleMute} className="h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 rounded-xl active:scale-95 transition-all">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button onClick={() => setIsDark(!isDark)} className="h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 rounded-xl active:scale-95 transition-all">
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button onClick={onToggleShift} className={`flex items-center gap-2 h-12 px-3 rounded-xl text-xs font-black transition-all border-2 active:scale-95 ${isPagi ? 'bg-yellow-100 text-yellow-900 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700' : 'bg-indigo-900 text-indigo-100 border-indigo-700 dark:bg-indigo-950 dark:border-indigo-800'}`}>
          {shift.toUpperCase()}
        </button>
        {onLogout && (
          <button onClick={onLogout} className="h-12 w-12 flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-950/30 border-2 border-red-100 dark:border-red-900/50 rounded-xl active:scale-95">
            <LogOut size={24} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </header>
  );
});

// [CLEANUP] Helper disederhanakan untuk hanya menggunakan `street_name` sesuai skema final.
const getStreetLabel = (item: StreetData): string => {
  return item.street_name || "Lokasi Kosong";
};

export const StreetSelector: React.FC<StreetSelectorProps> = React.memo(({ streets, selectedStreet, onSelect, isLoading }) => {
  const { detectLocation, loading: detecting } = useGeoLocation();
  const [detectedInfo, setDetectedInfo] = useState<{ raw: string, match: string | null } | null>(null);
  const { data: assignments, isLoading: loadingAssignments } = useCollectorAssignments();

  const streetNames = useMemo(() => {
    return (streets || []).map(getStreetLabel).filter(name => name !== "Lokasi Kosong");
  }, [streets]);

  const handleAutoDetect = useCallback(async () => {
    if (!streetNames.length) return;
    setDetectedInfo(null);
    try {
      const result = await detectLocation(streetNames);
      setDetectedInfo({ raw: result.detectedRawAddress || 'Tidak diketahui', match: result.matchedDbStreet });
      if (result.matchedDbStreet) onSelect(result.matchedDbStreet);
    } catch (err: any) {
      alert(err.message || "Gagal mendeteksi lokasi");
    }
  }, [streetNames, detectLocation, onSelect]);

  const assignedSet = useMemo(() => new Set(assignments?.map(a => a.ruas_jalan) || []), [assignments]);
  const myStreets = useMemo(() => (streets || []).filter(s => assignedSet.has(getStreetLabel(s))), [streets, assignedSet]);
  const otherStreets = useMemo(() => (streets || []).filter(s => !assignedSet.has(getStreetLabel(s))), [streets, assignedSet]);

  return (
    <div className="w-full bg-blue-600 dark:bg-blue-900 p-4 border-b-2 border-blue-800 dark:border-blue-950 shadow-lg transition-colors">
      <label className="block text-[10px] font-black text-blue-200 dark:text-blue-200 uppercase tracking-widest mb-2">PILIH RUAS JALAN TUGAS</label>
      {detectedInfo && (
        <div className="mb-3 bg-white dark:bg-gray-900 border-2 border-blue-400 dark:border-blue-800 rounded-xl p-3 flex items-start gap-3 shadow-sm animate-in zoom-in-95">
          <MapPin size={20} className="mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-gray-900 dark:text-white block font-black leading-tight">{detectedInfo.raw}</span>
            {detectedInfo.match ? <span className="text-green-700 dark:text-green-400 text-xs font-black mt-1 block">✓ COCOK: {detectedInfo.match}</span> : <span className="text-red-600 dark:text-red-400 text-xs font-black mt-1 block">✕ TIDAK COCOK</span>}
          </div>
          <button onClick={() => setDetectedInfo(null)} className="ml-auto p-2 -m-2 text-gray-400"><X size={20} /></button>
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select value={selectedStreet} onChange={(e) => onSelect(e.target.value)} disabled={isLoading || detecting || loadingAssignments} className="block w-full h-14 rounded-xl border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg shadow-xl appearance-none px-4">
            <option value="">-- PILIH LOKASI --</option>
            {myStreets.length > 0 && <optgroup label="⭐ TUGAS SAYA">{myStreets.map((s, idx) => <option key={`my-${idx}`} value={getStreetLabel(s)}>{getStreetLabel(s)}</option>)}</optgroup>}
            <optgroup label="📍 SEMUA JALAN">{otherStreets.map((s, idx) => <option key={`all-${idx}`} value={getStreetLabel(s)}>{getStreetLabel(s)}</option>)}</optgroup>
          </select>
          {(isLoading || loadingAssignments) && <div className="absolute right-4 top-4"><Loader2 className="animate-spin text-blue-600" size={24} /></div>}
        </div>
        <button onClick={handleAutoDetect} disabled={isLoading || detecting || !streets} className="h-14 w-14 flex-shrink-0 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 rounded-xl shadow-xl flex items-center justify-center active:scale-95 transition-all border-2 border-blue-500 dark:border-blue-700">
          {detecting ? <Loader2 className="animate-spin" size={24} /> : <Navigation size={28} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
});

interface StreetSelectorProps {
  streets: StreetData[] | undefined;
  selectedStreet: string;
  onSelect: (val: string) => void;
  isLoading: boolean;
}

interface JukirCardProps {
  jukir: Jukir;
  onInputClick: (jukir: Jukir) => void;
}

export const JukirCard: React.FC<JukirCardProps> = React.memo(({ jukir, onInputClick }) => {
  // [CLEANUP] Variabel disederhanakan untuk menggunakan skema final
  const labelLokasi = jukir.location_name || 'TANPA NAMA TITIK';
  const labelNama = jukir.jukir_name || 'TANPA NAMA JUKIR';
  const targetVal = jukir.target_amount || 0;
  const hasPaid = jukir.has_paid_today;

  return (
    <div className={`rounded-2xl shadow-md border-2 mb-4 overflow-hidden transition-all duration-300 ${hasPaid ? 'bg-gray-100 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 active:border-blue-500'}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 mb-1">
               <MapPin size={16} strokeWidth={3} className="flex-shrink-0" />
               <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-400">TITIK PARKIR</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
              {labelLokasi}
            </h3>
          </div>
          
          {targetVal > 0 && (
            <div className={`text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex-shrink-0 shadow-sm flex items-center gap-1.5 transition-colors ${hasPaid ? 'bg-gray-500' : 'bg-blue-600 dark:bg-blue-700'}`}>
              <Target size={14} strokeWidth={3} />
              <span>{formatRupiah(targetVal)}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onInputClick(jukir)}
          disabled={hasPaid}
          className={`w-full h-16 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg ${
            hasPaid
              ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 active:scale-95'
          }`}
        >
          {hasPaid ? (
            <><CheckCircle size={24} strokeWidth={2.5} /> SUDAH SETOR</>
          ) : (
            <><Banknote size={24} strokeWidth={2.5} /> INPUT SETORAN</>
          )}
        </button>
      </div>

      <div className={`px-4 py-3 border-t-2 flex items-center justify-between transition-colors ${hasPaid ? 'bg-gray-200 dark:bg-gray-800/50 border-gray-300 dark:border-gray-800' : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800'}`}>
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <User size={18} strokeWidth={2.5} />
          <span className="text-sm font-black">{String(labelNama).toUpperCase()}</span>
        </div>
        <div className="text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest border border-gray-300 dark:border-gray-700 px-2 py-0.5 rounded">
           {/* [CLEANUP] Menggunakan `shift` sebagai satu-satunya sumber data shift */}
           {jukir.shift || 'UMUM'}
        </div>
      </div>
    </div>
  );
});

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<any>;
  jukir: Jukir | null;
  isSubmitting: boolean;
}

export const InputModal: React.FC<InputModalProps> = React.memo(({ isOpen, onClose, onSubmit, jukir, isSubmitting }) => {
  const [amount, setAmount] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const { triggerSuccess, triggerError } = useFeedback();

  const quickAmounts = [5000, 10000, 20000, 30000, 40000, 50000];

  useEffect(() => {
    if (isOpen) { 
      setAmount(''); 
      setShowWarning(false); 
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const getNumericAmount = () => parseInt(amount.replace(/\D/g, '')) || 0;

  const performSubmit = async (val: number) => {
    try { await onSubmit(val); triggerSuccess(); } catch (err) { triggerError(); throw err; }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = getNumericAmount();
    if (!val) { triggerError(); return; }
    // [CLEANUP] Menggunakan `target_amount` sebagai satu-satunya sumber data target
    const target = jukir?.target_amount || 0;
    if (target > 0 && val < target) setShowWarning(true); else performSubmit(val);
  };

  if (!isOpen || !jukir) return null;

  // [CLEANUP] Menggunakan `target_amount` sebagai satu-satunya sumber data target
  const targetVal = jukir.target_amount || 0;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-2 transition-all animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-950 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-20 transition-colors max-h-[90vh] overflow-y-auto no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
            <button 
              onClick={onClose} 
              className="absolute -top-16 right-0 p-4 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all active:scale-90"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <div className="mb-4 border-b-2 border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                {/* [CLEANUP] Menggunakan `location_name` sebagai satu-satunya sumber data lokasi */}
                {jukir.location_name || 'TANPA NAMA TITIK'}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {/* [CLEANUP] Menghapus fallback chain */}
                <span className="bg-gray-800 dark:bg-gray-700 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight">{jukir.jukir_name}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{jukir.shift}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest">JUMLAH SETORAN (RP)</label>
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 dark:text-blue-400">
                    <Target size={14} />
                    <span>{targetVal > 0 ? `TARGET: ${formatRupiah(targetVal)}` : 'TARGET: BELUM DITENTUKAN'}</span>
                  </div>
                </div>

                <div className="relative bg-gray-50 dark:bg-black rounded-2xl border-4 border-gray-200 dark:border-gray-800 focus-within:border-blue-500 overflow-hidden transition-all shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-500 font-black text-2xl">Rp</span>
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={amount ? new Intl.NumberFormat('id-ID').format(getNumericAmount()) : ''} 
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} 
                    className="block w-full h-24 pl-16 pr-6 bg-transparent text-gray-900 dark:text-white text-5xl font-black tracking-tighter outline-none" 
                    placeholder="0" 
                    required 
                  />
                </div>

                <div className="mt-4 flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                  {targetVal > 0 && (
                    <button
                      key="btn-target"
                      type="button"
                      onClick={() => handleQuickAmount(targetVal)}
                      className="flex-shrink-0 bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 active:scale-95 transition-all border-b-4 border-blue-800"
                    >
                      <Zap size={14} fill="currentColor" />
                      SESUAI TARGET
                    </button>
                  )}
                  {quickAmounts.map((val) => (
                    <button
                      key={`btn-${val}`}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="flex-shrink-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl text-xs font-black shadow-md border-2 border-gray-200 dark:border-gray-700 active:scale-95 transition-all"
                    >
                      Rp {val / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || !amount} className="w-full h-20 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-800 transition-all border-b-8 border-green-800">
                {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : <><Check size={32} strokeWidth={3} /> SIMPAN DATA</>}
              </button>
            </form>
        </div>
      </div>
      <WarningDialog isOpen={showWarning} onClose={() => setShowWarning(false)} onConfirm={() => performSubmit(getNumericAmount())} target={targetVal} current={getNumericAmount()} />
    </>
  );
});
