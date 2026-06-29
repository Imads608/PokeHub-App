'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BattleAudioManager } from './battle-audio-manager';

interface AudioContextValue {
  audio: BattleAudioManager;
  isUnlocked: boolean;
  isMuted: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  setMasterVolume: (v: number) => void;
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMute: () => void;
  unlock: () => Promise<void>;
}

const BattleAudioContext = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const ctx = useContext(BattleAudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return ctx;
}

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const managerRef = useRef<BattleAudioManager | null>(null);

  // Lazy-init the manager (avoid creating AudioContext during SSR)
  if (!managerRef.current && typeof window !== 'undefined') {
    managerRef.current = new BattleAudioManager();
  }

  const manager = managerRef.current!;

  // Reactive state mirrors for UI re-renders
  const [isMuted, setIsMuted] = useState(() => manager?.muted ?? false);
  const [masterVolume, setMasterVolumeState] = useState(
    () => manager?.masterVolume ?? 0.7
  );
  const [bgmVolume, setBgmVolumeState] = useState(
    () => manager?.bgmVolume ?? 0.5
  );
  const [sfxVolume, setSfxVolumeState] = useState(
    () => manager?.sfxVolume ?? 0.8
  );
  const [isUnlocked, setIsUnlocked] = useState(
    () => manager?.isUnlocked ?? false
  );

  // Dispose on unmount
  useEffect(() => {
    return () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, []);

  // Poll AudioContext state to detect unlock (happens after user gesture)
  useEffect(() => {
    if (isUnlocked) return;

    const interval = setInterval(() => {
      if (manager?.isUnlocked) {
        setIsUnlocked(true);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isUnlocked, manager]);

  const unlock = useCallback(async () => {
    await manager.resume();
    setIsUnlocked(manager.isUnlocked);
  }, [manager]);

  const setMasterVolume = useCallback(
    (v: number) => {
      manager.setMasterVolume(v);
      setMasterVolumeState(v);
    },
    [manager]
  );

  const setBgmVolume = useCallback(
    (v: number) => {
      manager.setBgmVolume(v);
      setBgmVolumeState(v);
    },
    [manager]
  );

  const setSfxVolume = useCallback(
    (v: number) => {
      manager.setSfxVolume(v);
      setSfxVolumeState(v);
    },
    [manager]
  );

  const toggleMute = useCallback(() => {
    const next = !manager.muted;
    manager.setMuted(next);
    setIsMuted(next);
  }, [manager]);

  const value: AudioContextValue = {
    audio: manager,
    isUnlocked,
    isMuted,
    masterVolume,
    bgmVolume,
    sfxVolume,
    setMasterVolume,
    setBgmVolume,
    setSfxVolume,
    toggleMute,
    unlock,
  };

  return (
    <BattleAudioContext.Provider value={value}>
      {children}
    </BattleAudioContext.Provider>
  );
}
