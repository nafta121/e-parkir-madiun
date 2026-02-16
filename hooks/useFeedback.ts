import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * Singleton Audio Instances
 * Pre-loading outside the hook ensures we don't recreate the Audio objects 
 * on every render, which significantly reduces playback latency.
 */
const SUKSES_URL = supabase.storage.from('sound').getPublicUrl('sukses.mp3').data.publicUrl;
const GAGAL_URL = supabase.storage.from('sound').getPublicUrl('gagal.mp3').data.publicUrl;

const suksesAudio = new Audio(SUKSES_URL);
const gagalAudio = new Audio(GAGAL_URL);

// Initiate pre-fetch/cache
suksesAudio.load();
gagalAudio.load();

// Use a simple global variable to sync state across hook instances without full Context overhead
let globalMuted = localStorage.getItem('feedback_muted') === 'true';
const listeners: Array<(muted: boolean) => void> = [];

const notify = (muted: boolean) => {
  listeners.forEach(l => l(muted));
};

export const useFeedback = () => {
  const [isMuted, setIsMuted] = useState(globalMuted);

  useEffect(() => {
    const handler = (muted: boolean) => setIsMuted(muted);
    listeners.push(handler);
    return () => {
      const index = listeners.indexOf(handler);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const toggleMute = useCallback(() => {
    globalMuted = !globalMuted;
    localStorage.setItem('feedback_muted', String(globalMuted));
    setIsMuted(globalMuted);
    notify(globalMuted);
  }, []);

  /**
   * Helper to play sound with error handling and rapid-fire support
   */
  const playSound = (audio: HTMLAudioElement) => {
    if (globalMuted) return;

    try {
      // Reset to start in case it's already playing (rapid-fire clicks)
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Typically handles browser's autoplay policy (user must interact first)
          console.debug('Audio playback blocked or failed:', error);
        });
      }
    } catch (err) {
      console.error('Audio subsystem error:', err);
    }
  };

  const triggerSuccess = useCallback(() => {
    // Vibration: Single strong pulse
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    playSound(suksesAudio);
  }, []);

  const triggerError = useCallback(() => {
    // Vibration: Buzz-pause-buzz
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    playSound(gagalAudio);
  }, []);

  return { triggerSuccess, triggerError, isMuted, toggleMute };
};