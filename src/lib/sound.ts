import { useSoundStore } from '@/store/useSoundStore';

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (required by modern browsers after user interaction)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

type SoundType = 'open' | 'notification' | 'chat';

// Throttle logic to prevent chat spam
let lastChatSound = 0;
const CHAT_THROTTLE_MS = 2000;

export const playUITone = (type: SoundType) => {
    const isMuted = useSoundStore.getState().isMuted;
    if (isMuted) return;

    if (type === 'chat') {
        const now = Date.now();
        if (now - lastChatSound < CHAT_THROTTLE_MS) return;
        lastChatSound = now;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'open') {
            // Subtle ascending chime for page open
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // Up to A5
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.05, now + 0.05); // Very soft
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'notification') {
            // High-pitched soft pop for notifications
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'chat') {
            // Double pop for chat messages
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            
            // First pop
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
            // Second pop
            gainNode.gain.setValueAtTime(0.1, now + 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.warn('Audio playback failed', e);
    }
};

export const playAppOpenSound = () => {
    const store = useSoundStore.getState();
    if (!store.hasPlayedInitialSound) {
        // We defer it slightly to assure user interaction might have occurred (or won't block)
        setTimeout(() => {
            playUITone('open');
            store.setHasPlayedInitialSound(true);
        }, 500);
    }
};
