import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundState {
  isMuted: boolean;
  hasPlayedInitialSound: boolean;
  toggleMute: () => void;
  setHasPlayedInitialSound: (played: boolean) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      isMuted: false, // Default is sound ON but subtle
      hasPlayedInitialSound: false,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setHasPlayedInitialSound: (played) => set({ hasPlayedInitialSound: played }),
    }),
    {
      name: 'clarity-sound-storage',
      // We don't want to persist `hasPlayedInitialSound` across refresh completely if we want them to hear it per session, 
      // but let's just use sessionStorage for that instead of persiting it.
      partialize: (state) => ({ isMuted: state.isMuted }), // Only persist isMuted
    }
  )
);
