'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  AnimationEvent,
  AnimationScene,
  SpriteHandle,
} from '../types/animation.types';
import { DURATION } from '../animations/easing';
import { playAnimationEvent } from '../animations/state-anims';

interface UseAnimationQueueOptions {
  scene: AnimationScene | null;
  /** If false, animations are skipped and events resolve instantly */
  enabled?: boolean;
  /** Called after each animation event completes — use to apply state changes incrementally */
  onEventComplete?: () => void;
  /** Called when animations are skipped — use to flush all remaining state changes */
  onSkip?: () => void;
}

export interface AnimationQueueAPI {
  isAnimating: boolean;
  currentEvent: AnimationEvent | null;
  enqueue: (events: AnimationEvent[]) => Promise<void>;
  skipAll: () => void;
}

/**
 * Sequential animation queue.
 *
 * Events are processed one at a time. Each event triggers a visual animation
 * (move, damage, faint, etc.) and resolves after its duration. The queue
 * can be skipped at any time to instantly resolve all pending animations.
 */
export function useAnimationQueue({
  scene,
  enabled = true,
  onEventComplete,
  onSkip,
}: UseAnimationQueueOptions): AnimationQueueAPI {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<AnimationEvent | null>(null);

  const skipRef = useRef(false);
  const processingRef = useRef(false);

  const enqueue = useCallback(
    async (events: AnimationEvent[]) => {
      if (events.length === 0) return;

      // When disabled (off-screen, unmounted), skip animations and flush state
      if (!enabled || !scene) {
        onSkip?.();
        return;
      }

      // Prevent re-entrant calls
      if (processingRef.current) return;
      processingRef.current = true;
      skipRef.current = false;
      setIsAnimating(true);

      try {
        for (const event of events) {
          if (skipRef.current) break;

          setCurrentEvent(event);
          await playAnimationEvent(scene, event);
          onEventComplete?.();
        }
      } finally {
        if (skipRef.current) {
          onSkip?.();
        }
        setCurrentEvent(null);
        setIsAnimating(false);
        processingRef.current = false;
        skipRef.current = false;
      }
    },
    [scene, enabled, onEventComplete, onSkip]
  );

  const skipAll = useCallback(() => {
    skipRef.current = true;
  }, []);

  return { isAnimating, currentEvent, enqueue, skipAll };
}

/**
 * Get the base duration for an animation event type.
 * Used when no specific move animation is registered.
 */
export function getEventDuration(event: AnimationEvent): number {
  switch (event.type) {
    case 'move':
      return DURATION.MOVE;
    case 'damage':
      return DURATION.DAMAGE;
    case 'heal':
      return DURATION.DAMAGE;
    case 'faint':
      return DURATION.FAINT;
    case 'switch-out':
      return DURATION.SWITCH_OUT;
    case 'switch-in':
      return DURATION.SWITCH_IN;
    case 'boost':
    case 'unboost':
      return DURATION.BOOST;
    case 'status':
      return DURATION.STATUS;
    case 'supereffective':
      return DURATION.SUPER_EFFECTIVE;
    case 'crit':
      return DURATION.CRIT;
    case 'weather':
    case 'terrain':
      return DURATION.WEATHER;
    case 'resisted':
    case 'miss':
      return 150;
    default:
      return 200;
  }
}
