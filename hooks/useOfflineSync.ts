

import { useState, useEffect, useCallback } from 'react';
import { useSubmitTransaction } from './useParkingData';
import { TransactionPayload, ShiftType } from '../types';

interface OfflineTransaction {
  id: string;
  timestamp: number;
  payload: {
    jukir_id: string | number;
    jukir_name: string;
    shift: ShiftType;
    amount: number;
    street_name: string;
    location_name?: string;
    imageBase64: string | null;
    imageName: string | null;
  };
}

// Helpers outside hook to avoid re-creation
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// STABILITY: Replaced buggy `fetch` logic with robust `atob` implementation for Data URI conversion.
// This prevents "Failed to fetch" errors and ensures reliable offline->online image sync.
const base64ToFile = (base64: string, fileName: string): File => {
  try {
    const arr = base64.split(',');
    if (arr.length < 2) throw new Error("Invalid Base64 string");
    
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not determine MIME type from Base64 string");
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  } catch (error) {
    console.error("Error converting Base64 to File:", error);
    // Return a dummy empty file to prevent a crash, though the upload will likely fail.
    return new File([], fileName); 
  }
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const submitMutation = useSubmitTransaction();

  // 2. SYNC PROCESS (Defined before useEffect to be used in it)
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    const queueStr = localStorage.getItem('offline_transactions');
    if (!queueStr) return;

    let queue: OfflineTransaction[] = [];
    try {
      queue = JSON.parse(queueStr);
    } catch (e) {
      console.error("Could not parse offline queue, clearing.", e);
      localStorage.removeItem('offline_transactions');
      return;
    }
    
    if (queue.length === 0) return;

    setIsSyncing(true);
    const failedItems: OfflineTransaction[] = [];

    for (const item of queue) {
      try {
        let imageFile: File | null = null;
        if (item.payload.imageBase64 && item.payload.imageName) {
          imageFile = base64ToFile(item.payload.imageBase64, item.payload.imageName);
        }

        const payload: TransactionPayload = {
          jukir_id: String(item.payload.jukir_id),
          jukir_name: item.payload.jukir_name,
          shift: item.payload.shift,
          street_name: item.payload.street_name,
          location_name: item.payload.location_name || '', // Pass location name
          amount: item.payload.amount,
          image_file: imageFile
        };

        await submitMutation.mutateAsync(payload);

      } catch (error) {
        console.error(`Failed to sync item ${item.id}`, error);
        failedItems.push(item);
      }
    }

    localStorage.setItem('offline_transactions', JSON.stringify(failedItems));
    setPendingCount(failedItems.length);
    setIsSyncing(false);

    if (failedItems.length > 0) {
      console.warn(`Sync complete. ${failedItems.length} items failed and remain in queue.`);
    }
  }, [submitMutation, isSyncing]);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      updateStatus();
      syncNow();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', updateStatus);

    try {
      const queue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }

    // Initial sync check on component mount
    if (navigator.onLine) {
      syncNow();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', updateStatus);
    };
  }, [syncNow]);

  // 1. SAVE TRANSACTION
  const saveTransaction = useCallback(async (data: TransactionPayload) => {
    if (navigator.onLine) {
      return submitMutation.mutateAsync(data);
    } else {
      try {
        let imageBase64 = null;
        if (data.image_file) {
          imageBase64 = await fileToBase64(data.image_file);
        }

        const offlineItem: OfflineTransaction = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          payload: {
            jukir_id: Number(data.jukir_id),
            jukir_name: data.jukir_name,
            shift: data.shift,
            amount: data.amount,
            street_name: data.street_name,
            location_name: data.location_name, // Save location name
            imageBase64: imageBase64,
            imageName: data.image_file?.name || null
          }
        };

        const currentQueue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
        currentQueue.push(offlineItem);
        
        try {
          localStorage.setItem('offline_transactions', JSON.stringify(currentQueue));
          setPendingCount(currentQueue.length);
          return Promise.resolve({ status: 'offline-saved' });
        } catch (e) {
          console.error("Offline save error:", e);
          alert("Gagal menyimpan data offline. Memori HP penuh atau foto terlalu besar.");
          throw new Error("Quota Exceeded");
        }

      } catch (err) {
        console.error("Error preparing for offline save:", err);
        throw err;
      }
    }
  }, [submitMutation]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveTransaction,
    syncNow
  };
};
