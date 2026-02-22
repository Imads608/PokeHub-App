import type { AnimationEvent, AnimationScene } from '../types/animation.types';
import { DURATION } from './easing';
import { getMoveAnimation } from './move-registry';
import { genericPhysical, genericSpecial, genericStatus } from './generic-anims';

let popupCounter = 0;
function nextPopupId() {
  return `popup-${++popupCounter}`;
}

let effectCounter = 0;
function nextEffectId() {
  return `fx-${++effectCounter}`;
}

/**
 * Play a single animation event on the scene.
 * Resolves when the animation is complete.
 */
export async function playAnimationEvent(
  scene: AnimationScene,
  event: AnimationEvent
): Promise<void> {
  switch (event.type) {
    case 'move':
      return playMove(scene, event);

    case 'damage':
      return playDamage(scene, event);

    case 'heal':
      return playHeal(scene, event);

    case 'faint':
      return playFaint(scene, event);

    case 'switch-in':
      return playSwitchIn(scene, event);

    case 'switch-out':
      return playSwitchOut(scene, event);

    case 'boost':
    case 'unboost':
      return playBoost(scene, event);

    case 'status':
      return playStatus(scene, event);

    case 'supereffective':
      return playSuperEffective(scene);

    case 'crit':
      return playCrit(scene);

    case 'miss':
      return playMiss(scene);

    case 'resisted':
      // Subtle — no big visual, just a brief dim
      return scene.delay(100);

    case 'weather':
    case 'terrain':
      // Weather/terrain transitions handled by CSS in battlefield-bg.tsx
      return scene.delay(200);

    default:
      return scene.delay(100);
  }
}

// ── Move animation ──────────────────────────────────────────────────────

async function playMove(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'move' }>
) {
  const attacker = scene.getSprite(event.attacker);
  const defender = scene.getSprite(event.defender);
  if (!attacker || !defender) {
    await scene.delay(DURATION.MOVE);
    return;
  }

  // Check for a registered move animation (lazy-loaded)
  const moveAnim = await getMoveAnimation(event.moveName);
  if (moveAnim) {
    await moveAnim(scene, attacker, defender);
    return;
  }

  // Generic fallback — detect category from the move name
  // Since we don't have the dex here, use the generic physical as default
  await genericPhysical(scene, attacker, defender);
}

// ── Damage ──────────────────────────────────────────────────────────────

async function playDamage(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'damage' }>
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.DAMAGE);
    return;
  }

  // Flinch shake
  const shakeKeyframes = [0, -6, 6, -4, 4, -2, 0];
  for (const x of shakeKeyframes) {
    sprite.setTransform({ x });
    await scene.delay(DURATION.DAMAGE / shakeKeyframes.length);
  }
  sprite.setTransform({ x: 0 });

  // Damage popup
  const dmg = event.prevHp - event.newHp;
  if (dmg > 0) {
    const pct = Math.round((dmg / event.maxHp) * 100);
    scene.showPopup({
      id: nextPopupId(),
      text: `-${pct}%`,
      targetIdent: event.pokemon,
      color: '#ff4444',
      duration: DURATION.POPUP,
    });
  }
}

// ── Heal ────────────────────────────────────────────────────────────────

async function playHeal(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'heal' }>
) {
  const healed = event.newHp - event.prevHp;
  if (healed > 0) {
    const pct = Math.round((healed / event.maxHp) * 100);
    scene.showPopup({
      id: nextPopupId(),
      text: `+${pct}%`,
      targetIdent: event.pokemon,
      color: '#44cc44',
      duration: DURATION.POPUP,
    });
  }
  await scene.delay(DURATION.DAMAGE);
}

// ── Faint ───────────────────────────────────────────────────────────────

async function playFaint(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'faint' }>
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.FAINT);
    return;
  }

  // Drop downward + fade out
  sprite.setTransform({ y: 40, opacity: 0, scale: 0.8 });
  await scene.delay(DURATION.FAINT);
}

// ── Switch in ───────────────────────────────────────────────────────────

async function playSwitchIn(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'switch-in' }>
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.SWITCH_IN);
    return;
  }

  // Start from invisible/small, scale up to full
  sprite.setTransform({ scale: 0.3, opacity: 0, y: 10 });
  await scene.delay(50);
  sprite.setTransform({ scale: 1, opacity: 1, y: 0 });
  await scene.delay(DURATION.SWITCH_IN);
}

// ── Switch out ──────────────────────────────────────────────────────────

async function playSwitchOut(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'switch-out' }>
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.SWITCH_OUT);
    return;
  }

  sprite.setTransform({ scale: 0.3, opacity: 0 });
  await scene.delay(DURATION.SWITCH_OUT);
}

// ── Boost / Unboost ─────────────────────────────────────────────────────

async function playBoost(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'boost' | 'unboost' }>
) {
  const isPositive = event.type === 'boost';
  const color = isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  // Flash the overlay
  await scene.flashOverlay(color, DURATION.BOOST);

  const arrow = isPositive ? '\u2191' : '\u2193';
  scene.showPopup({
    id: nextPopupId(),
    text: `${arrow}${event.stat.toUpperCase()}`,
    targetIdent: event.pokemon,
    color: isPositive ? '#22c55e' : '#ef4444',
    duration: DURATION.POPUP,
  });
}

// ── Status ──────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  brn: 'rgba(249, 115, 22, 0.3)',
  par: 'rgba(234, 179, 8, 0.3)',
  psn: 'rgba(168, 85, 247, 0.3)',
  tox: 'rgba(126, 34, 206, 0.3)',
  slp: 'rgba(148, 163, 184, 0.3)',
  frz: 'rgba(56, 189, 248, 0.3)',
};

async function playStatus(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'status' }>
) {
  const color = statusColors[event.status] ?? 'rgba(148, 163, 184, 0.3)';
  await scene.flashOverlay(color, DURATION.STATUS);
}

// ── Super effective ─────────────────────────────────────────────────────

async function playSuperEffective(scene: AnimationScene) {
  await scene.shakeScreen(4, DURATION.SUPER_EFFECTIVE);
  await scene.flashOverlay('rgba(255, 255, 255, 0.2)', 100);
}

// ── Critical hit ────────────────────────────────────────────────────────

async function playCrit(scene: AnimationScene) {
  await scene.shakeScreen(6, DURATION.CRIT);
  await scene.flashOverlay('rgba(255, 200, 0, 0.25)', 100);
}

// ── Miss ────────────────────────────────────────────────────────────────

async function playMiss(scene: AnimationScene) {
  // Brief flash indicating nothing happened
  await scene.flashOverlay('rgba(128, 128, 128, 0.15)', 150);
}
