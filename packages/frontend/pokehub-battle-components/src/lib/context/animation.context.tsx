'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  AnimationEvent,
  AnimationScene,
  EffectSpriteConfig,
  PopupConfig,
  SpriteHandle,
} from '../types/animation.types';

// ── Context value ───────────────────────────────────────────────────────

interface AnimationContextValue {
  /** Register a sprite handle for animation targeting */
  registerSprite: (ident: string, handle: SpriteHandle) => void;
  /** Unregister a sprite */
  unregisterSprite: (ident: string) => void;
  /** Active effect sprites to render */
  effects: EffectSpriteConfig[];
  /** Active popups to render */
  popups: PopupConfig[];
  /** Flash overlay state */
  flashColor: string | null;
  /** Screen shake offset */
  shakeOffset: { x: number; y: number };
  /** The animation scene — used by processPendingEvents to play animations */
  scene: AnimationScene;
  /** The arena ref — components read this for positioning */
  arenaRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the arena is mounted and visible */
  isMounted: boolean;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

export function useAnimationContext() {
  const ctx = useContext(AnimationContext);
  if (!ctx) {
    throw new Error('useAnimationContext must be used within AnimationProvider');
  }
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────

interface AnimationProviderProps {
  children: React.ReactNode;
}

export function AnimationProvider({
  children,
}: AnimationProviderProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const spritesRef = useRef<Map<string, SpriteHandle>>(new Map());
  const [effects, setEffects] = useState<EffectSpriteConfig[]>([]);
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(true);

  // Track page visibility for off-screen handling
  useEffect(() => {
    setIsMounted(true);

    const handleVisibility = () => {
      setIsMounted(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      setIsMounted(false);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Sprite registration
  const registerSprite = useCallback((ident: string, handle: SpriteHandle) => {
    spritesRef.current.set(ident, handle);
  }, []);

  const unregisterSprite = useCallback((ident: string) => {
    spritesRef.current.delete(ident);
  }, []);

  // Build the AnimationScene that animation functions use
  const sceneRef = useRef<AnimationScene | null>(null);

  const getSprite = useCallback((ident: string) => {
    return spritesRef.current.get(ident) ?? null;
  }, []);

  const showEffect = useCallback((config: EffectSpriteConfig) => {
    setEffects((prev) => [...prev, config]);
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const showPopup = useCallback((config: PopupConfig) => {
    setPopups((prev) => [...prev, config]);
    // Auto-remove after duration
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== config.id));
    }, config.duration ?? 800);
  }, []);

  const shakeScreen = useCallback(
    async (intensity = 4, duration = 300) => {
      const steps = Math.floor(duration / 50);
      for (let i = 0; i < steps; i++) {
        const decay = 1 - i / steps;
        setShakeOffset({
          x: (Math.random() - 0.5) * intensity * 2 * decay,
          y: (Math.random() - 0.5) * intensity * 2 * decay,
        });
        await new Promise((r) => setTimeout(r, 50));
      }
      setShakeOffset({ x: 0, y: 0 });
    },
    []
  );

  const flashOverlay = useCallback(
    async (color: string, duration = 200) => {
      setFlashColor(color);
      await new Promise((r) => setTimeout(r, duration));
      setFlashColor(null);
    },
    []
  );

  const delay = useCallback(
    (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    []
  );

  // Build scene object (stable reference via ref)
  sceneRef.current = {
    arenaRef,
    getSprite,
    showEffect,
    removeEffect,
    showPopup,
    shakeScreen,
    flashOverlay,
    delay,
  };

  // Create a stable scene wrapper that delegates to the ref
  const stableScene = useRef<AnimationScene>({
    arenaRef,
    getSprite: (...args) => sceneRef.current!.getSprite(...args),
    showEffect: (...args) => sceneRef.current!.showEffect(...args),
    removeEffect: (...args) => sceneRef.current!.removeEffect(...args),
    showPopup: (...args) => sceneRef.current!.showPopup(...args),
    shakeScreen: (...args) => sceneRef.current!.shakeScreen(...args),
    flashOverlay: (...args) => sceneRef.current!.flashOverlay(...args),
    delay: (...args) => sceneRef.current!.delay(...args),
  }).current;

  const value: AnimationContextValue = {
    registerSprite,
    unregisterSprite,
    effects,
    popups,
    flashColor,
    shakeOffset,
    scene: stableScene,
    arenaRef,
    isMounted,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}
