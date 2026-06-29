import { DURATION } from '../animations/easing';
import type { AnimationEvent } from '../types/animation.types';
import type { Battle } from '@pkmn/client';
import type { LogFormatter } from '@pkmn/view';
import type { PendingProtocolEvent, InternalEvent } from './battle-state-reducer';
import { STATE_CHANGING_EVENTS } from './battle-state-reducer';

/** Function signature for playing a single animation event */
export type PlayAnimationFn = (event: AnimationEvent) => Promise<void>;

export interface ProcessPendingDeps {
  battle: Battle;
  formatter: LogFormatter;
  pending: PendingProtocolEvent[];
  skipRef: { current: boolean };
  rawDispatch: (event: InternalEvent) => void;
}

/**
 * Process all pending protocol events in a single sequential loop.
 *
 * For each event:
 *   - Moves: log appears before animation with LOG_READ pause
 *   - Switch/drag: log appears, LOG_READ pause, switch-out animation,
 *     battle.add() + re-render, switch-in animation
 *   - Consequences: animation first, battle.add() + re-render,
 *     LOG_READ pause, then log
 *
 * All intermediate dispatches set turnProcessing: true.
 * The caller (useCallback wrapper) handles the re-entrancy guard and
 * final dispatch with turnProcessing: false.
 */
export async function processPendingEvents(
  deps: ProcessPendingDeps,
  playAnimation?: PlayAnimationFn
): Promise<string[]> {
  const { battle, formatter, pending, skipRef, rawDispatch } = deps;
  const logLines: string[] = [];

  while (pending.length > 0) {
    const event = pending.shift()!;
    const cmd = String(event.args[0]);

    // When an effectiveness event (supereffective/resisted) is followed by a
    // damage event, merge them so the SFX + screen shake play in parallel with
    // the hit flash instead of sequentially.
    if (
      (event.animEvent?.type === 'supereffective' || event.animEvent?.type === 'resisted') &&
      pending[0]?.animEvent?.type === 'damage'
    ) {
      const damageEvent = pending[0].animEvent;
      damageEvent.modifier = event.animEvent.type;
      damageEvent.skipHitSfx = true;

      // Apply state for this effectiveness event but skip its standalone animation
      battle.add(event.args, event.kwArgs);
      const html = formatter.formatHTML(event.args, event.kwArgs);
      if (html) logLines.push(html);
      continue;
    }

    // Suppress the move SFX when the move doesn't connect (missed, failed,
    // immune, no target) — playing the launch sound feels off when nothing
    // happened.
    if (event.animEvent?.type === 'move' && pending[0]?.animEvent?.type === 'move-failed') {
      event.animEvent.skipSfx = true;
    }

    // Rule and tier lines aren't formatted by @pkmn/view's LogFormatter —
    // generate log HTML for them directly.
    if (cmd === 'rule') {
      const ruleText = String(event.args[1] ?? '');
      logLines.push(`<small>${ruleText}</small>`);
      battle.add(event.args, event.kwArgs);
      continue;
    }
    if (cmd === 'tier') {
      const tierText = String(event.args[1] ?? '');
      logLines.push(`<h2>${tierText}</h2>`);
      battle.add(event.args, event.kwArgs);
      continue;
    }

    // Moves: log appears before animation so the player reads what's happening.
    // Switch/drag: handled separately (needs state before animation for sprite mount).
    // Consequences (damage, faint, etc.): log appears after animation.
    const isSwitchEvent = cmd === 'switch' || cmd === 'drag';
    const isActionStarter = cmd === 'move';

    const html = formatter.formatHTML(event.args, event.kwArgs);

    if (isActionStarter) {
      if (html) logLines.push(html);
    }

    // Switch/drag needs special ordering:
    //   1. Animate old Pokemon out (sprite exists before battle.add)
    //   2. battle.add() — old sprite unmounts, new sprite mounts
    //   3. Animate new Pokemon in (sprite exists after battle.add)
    if (isSwitchEvent && playAnimation && !skipRef.current) {
      // Flush log (including switch log line) before animation
      if (html) logLines.push(html);
      if (logLines.length > 0) {
        rawDispatch({
          type: '_BATTLE_UPDATED',
          logLines: [...logLines],
          turnProcessing: true,
        });
        logLines.length = 0;
      }

      await new Promise((r) => setTimeout(r, DURATION.LOG_READ));

      // Animate old Pokemon out (if one exists on this side)
      const sideId = String(event.args[1]).startsWith('p1') ? 'p1' : 'p2';
      const currentActive = battle[sideId]?.active[0];
      if (currentActive && !currentActive.fainted) {
        await playAnimation({
          type: 'switch-out',
          pokemon: `${sideId}a: ${currentActive.name}`,
        });
      }

      // Apply state — old sprite unmounts, new sprite mounts
      battle.add(event.args, event.kwArgs);
      rawDispatch({
        type: '_BATTLE_UPDATED',
        logLines: [...logLines],
        turnProcessing: true,
      });
      logLines.length = 0;

      // Animate new Pokemon in
      await playAnimation(event.animEvent!);
    } else if (isSwitchEvent) {
      // No animation (skipped or off-screen) — just apply state
      if (html) logLines.push(html);
      battle.add(event.args, event.kwArgs);
      rawDispatch({
        type: '_BATTLE_UPDATED',
        logLines: [...logLines],
        turnProcessing: true,
      });
      logLines.length = 0;
    } else {
      if (event.animEvent && playAnimation && !skipRef.current) {
        if (logLines.length > 0) {
          rawDispatch({
            type: '_BATTLE_UPDATED',
            logLines: [...logLines],
            turnProcessing: true,
          });
          logLines.length = 0;
        }

        if (isActionStarter) {
          await new Promise((r) => setTimeout(r, DURATION.LOG_READ));
        }
        await playAnimation(event.animEvent);
      }

      battle.add(event.args, event.kwArgs);

      if (cmd === 'request' && battle.request?.side?.id) {
        formatter.perspective = battle.request.side.id;
      }

      if (STATE_CHANGING_EVENTS.has(cmd)) {
        rawDispatch({
          type: '_BATTLE_UPDATED',
          logLines: [...logLines],
          turnProcessing: true,
        });
        logLines.length = 0;
      }
    }

    // Consequence log lines (damage, heal, etc.) appear after the
    // state change so the player sees the HP bar drop first.
    // Switch events handle their own log lines above — skip them here.
    if (!isActionStarter && !isSwitchEvent && html) {
      logLines.push(html);
      if (event.animEvent && playAnimation && !skipRef.current) {
        await new Promise((r) => setTimeout(r, DURATION.LOG_READ));
      }
      rawDispatch({
        type: '_BATTLE_UPDATED',
        logLines: [...logLines],
        turnProcessing: true,
      });
      logLines.length = 0;
    }
  }

  // Return any remaining log lines to the caller
  // (final dispatch with turnProcessing: false is handled by the hook wrapper)
  return logLines;
}
