

import React, { useState, useCallback, useMemo } from 'react';
import { useCurrentShift, useStreetNames, useJukirList, useTodaysTransactions } from '../hooks/useParkingData';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Header, StreetSelector, JukirCard, InputModal } from '../components/UIComponents';
import { DailyRecap } from '../components/DailyRecap';
import { SuccessDialog } from '../components/SuccessDialog';
import { Jukir } from '../types';
import { Loader2, AlertCircle, MapPin, Wifi, WifiOff, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { currentShift, toggleShift } = useCurrentShift();
  const [selectedStreet, setSelectedStreet] = useState<string>('');
  const [selectedJukirForInput, setSelectedJukirForInput] = useState<Jukir | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const { signOut } = useAuth();
  
  const { isOnline, pendingCount, isSyncing, saveTransaction, syncNow } = useOfflineSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: streets, isLoading: loadingStreets } = useStreetNames();
  const { data: jukirs, isLoading: loadingJukirs, isError: errorJukirs } = useJukirList(selectedStreet, currentShift);
  const { data: todaysTransactions } = useTodaysTransactions();

  // TASK 1 & 4 (Improved): Create a memoized, sorted list of Jukirs with shift-specific validation
  const processedJukirs = useMemo(() => {
    if (!jukirs) return [];

    // Create a Set of composite keys "jukir_id-Shift" for fast O(1) lookups
    const paidJukirKeySet = new Set(
      todaysTransactions?.map(t => `${t.jukir_id}-${t.shift}`) ?? []
    );

    // Enrich jukir data with shift-specific payment status
    const enrichedJukirs = jukirs.map(jukir => ({
      ...jukir,
      // The check is now more precise: it checks both ID and Shift
      has_paid_today: paidJukirKeySet.has(`${jukir.id}-${jukir.shift}`),
    }));

    // Sort the enriched data: unpaid first, then paid
    enrichedJukirs.sort((a, b) => {
      // a.has_paid_today is boolean, converted to 0 (false) or 1 (true)
      return (a.has_paid_today ? 1 : 0) - (b.has_paid_today ? 1 : 0);
    });
    
    return enrichedJukirs;
  }, [jukirs, todaysTransactions]);

  const handleJukirSelect = useCallback((jukir: Jukir) => {
    // Prevent opening modal for jukirs who have already paid
    if (jukir.has_paid_today) return;
    setSelectedJukirForInput(jukir);
  }, []);

  const handleTransactionSubmit = useCallback(async (amount: number) => {
    if (!selectedJukirForInput) return;
    setIsSubmitting(true);
    try {
      await saveTransaction({
        jukir_id: String(selectedJukirForInput.id), // FIX: Convert ID to string
        jukir_name: selectedJukirForInput.jukir_name || 'Unknown',
        shift: currentShift,
        street_name: selectedStreet,
        location_name: selectedJukirForInput.location_name || 'Unknown', // ADDED: Pass location name
        amount: amount,
        image_file: null
      });
      setSelectedJukirForInput(null);
      setShowSuccess(true);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedJukirForInput, currentShift, selectedStreet, saveTransaction]);

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black flex flex-col font-sans transition-colors">
      <Header shift={currentShift} onToggleShift={toggleShift} onLogout={signOut} />

      <div className={`w-full px-4 h-12 flex items-center justify-between text-sm font-black shadow-inner transition-colors border-b-2 ${
          !isOnline 
            ? 'bg-red-600 text-white border-red-800' 
            : isSyncing 
              ? 'bg-yellow-400 text-black border-yellow-600 dark:bg-yellow-500 dark:border-yellow-700' 
              : 'bg-green-700 text-white border-green-900 dark:bg-green-800 dark:border-green-950'
        }`}>
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <> <WifiOff size={20} strokeWidth={3} /> <span className="tracking-tight">MODE OFFLINE</span> </>
          ) : isSyncing ? (
            <> <RefreshCw size={20} className="animate-spin" /> <span className="tracking-tight">MENGIRIM...</span> </>
          ) : (
            <> <Wifi size={20} strokeWidth={3} /> <span className="tracking-tight">SISTEM ONLINE</span> </>
          )}
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs">{pendingCount} DATA</span>
            {isOnline && !isSyncing && (
              <button onClick={syncNow} className="bg-white text-black px-3 py-1 rounded-lg text-xs font-black active:scale-95 transition-transform uppercase">
                SINKRON
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-950 shadow-md z-30 sticky top-[70px] transition-colors">
        <StreetSelector streets={streets} selectedStreet={selectedStreet} onSelect={setSelectedStreet} isLoading={loadingStreets} />
      </div>

      <DailyRecap />

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {!selectedStreet && (
          <div className="flex flex-col items-center justify-center mt-12 text-center">
            <MapPin size={80} className="mb-6 text-blue-200 dark:text-blue-900" strokeWidth={1} />
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-300 uppercase tracking-tight">Pilih Ruas Jalan</h2>
            <p className="text-gray-700 dark:text-gray-500 font-bold mt-2">Daftar Jukir akan muncul setelah Anda memilih lokasi tugas.</p>
          </div>
        )}

        {selectedStreet && loadingJukirs && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={48} strokeWidth={3} />
            <p className="text-gray-800 dark:text-gray-300 font-black">MEMUAT DATA JUKIR...</p>
          </div>
        )}

        {selectedStreet && errorJukirs && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <AlertCircle size={64} className="text-red-500 mb-4" />
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase">Gagal Memuat Data</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mt-2">
              Terjadi gangguan saat mengambil data Jukir. Silakan coba pilih ulang lokasi atau periksa koneksi internet Anda.
            </p>
          </div>
        )}

        {selectedStreet && !loadingJukirs && !errorJukirs && (!processedJukirs || processedJukirs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Info size={64} className="text-gray-300 mb-4" />
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-400 uppercase">Tidak Ada Jukir</h2>
            <p className="text-gray-600 dark:text-gray-500 text-sm font-bold mt-2">
              Tidak ditemukan Juru Parkir yang bertugas di ruas jalan ini pada shift <span className="text-blue-600">{currentShift}</span>.
            </p>
          </div>
        )}

        {selectedStreet && !loadingJukirs && !errorJukirs && processedJukirs && processedJukirs.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between px-2 py-2 mb-2 bg-gray-200 dark:bg-gray-800 rounded-lg transition-colors">
                <p className="text-xs text-gray-800 dark:text-gray-400 font-black uppercase tracking-widest">{processedJukirs.length} JUKIR DITEMUKAN</p>
                <span className="text-xs font-black text-blue-700 dark:text-blue-400">{currentShift.toUpperCase()}</span>
            </div>
            {processedJukirs.map((jukir) => (
              <JukirCard key={jukir.id} jukir={jukir} onInputClick={handleJukirSelect} />
            ))}
          </div>
        )}
      </main>

      <InputModal
        key={selectedJukirForInput ? selectedJukirForInput.id : 'closed'}
        isOpen={!!selectedJukirForInput}
        onClose={() => setSelectedJukirForInput(null)}
        jukir={selectedJukirForInput}
        onSubmit={handleTransactionSubmit}
        isSubmitting={isSubmitting}
      />

      <SuccessDialog isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
};
