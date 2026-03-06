import type { AnimationEvent, AnimationScene } from '../types/animation.types';
import type { BattleAudioManager } from '../audio/battle-audio-manager';
import {
  STATE_SFX,
  getMoveSfxUrl,
  getCryUrl,
} from '../audio/sound-catalog';
import { DURATION } from './easing';
import { getMoveAnimation } from './move-registry';
import { genericPhysical, genericSpecial, genericStatus } from './generic-anims';
import { Dex } from '@pkmn/dex';

/**
 * Play a single animation event on the scene.
 * Resolves when the animation is complete.
 */
export async function playAnimationEvent(
  scene: AnimationScene,
  event: AnimationEvent,
  audio?: BattleAudioManager
): Promise<void> {
  switch (event.type) {
    case 'move':
      return playMove(scene, event, audio);

    case 'damage':
      return playDamage(scene, event, audio);

    case 'heal':
      return playHeal(scene, event);

    case 'faint':
      return playFaint(scene, event, audio);

    case 'switch-in':
      return playSwitchIn(scene, event, audio);

    case 'switch-out':
      return playSwitchOut(scene, event, audio);

    case 'boost':
    case 'unboost':
      return playBoost(scene, event, audio);

    case 'status':
      return playStatus(scene, event, audio);

    case 'supereffective':
      return playSuperEffective(scene, audio);

    case 'crit':
      return playCrit(scene);

    case 'miss':
      return scene.delay(100);

    case 'resisted':
      void audio?.playSfx(STATE_SFX.resisted);
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
  event: Extract<AnimationEvent, { type: 'move' }>,
  audio?: BattleAudioManager
) {
  const attacker = scene.getSprite(event.attacker);
  const defender = scene.getSprite(event.defender);
  if (!attacker || !defender) {
    await scene.delay(DURATION.MOVE);
    return;
  }

  // Run move SFX and visual animation in parallel, wait for both to finish
  const sfxPromise = audio?.playSfx(getMoveSfxUrl(event.moveName)) ?? Promise.resolve();

  const moveAnim = await getMoveAnimation(event.moveName);
  let animPromise: Promise<void>;
  if (moveAnim) {
    animPromise = moveAnim(scene, attacker, defender);
  } else {
    const category = Dex.moves.get(event.moveName)?.category;
    if (category === 'Special') {
      animPromise = genericSpecial(scene, attacker, defender);
    } else if (category === 'Status') {
      animPromise = genericStatus(scene, attacker, defender);
    } else {
      animPromise = genericPhysical(scene, attacker, defender);
    }
  }

  await Promise.all([sfxPromise, animPromise]);

  // Brief pause after move animation before the hit sound / damage plays
  await scene.delay(250);
}

// ── Damage ──────────────────────────────────────────────────────────────

async function playDamage(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'damage' }>,
  audio?: BattleAudioManager
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.DAMAGE);
    return;
  }

  if (!event.skipHitSfx) {
    void audio?.playSfx(STATE_SFX.damage);
  }

  // Play modifier effect (super effective / resisted) in parallel with hit flash
  let modifierPromise: Promise<void> | undefined;
  if (event.modifier === 'supereffective') {
    void audio?.playSfx(STATE_SFX.supereffective);
    modifierPromise = scene.shakeScreen(4, DURATION.SUPER_EFFECTIVE);
  } else if (event.modifier === 'resisted') {
    void audio?.playSfx(STATE_SFX.resisted);
  }

  // Flinch: blink white and shake
  const flinchPromise = (async () => {
    sprite.setTransform({ x: -6, brightness: 5 });
    await scene.delay(80);
    sprite.setTransform({ x: 6, brightness: 1 });
    await scene.delay(80);
    sprite.setTransform({ x: -4, brightness: 5 });
    await scene.delay(80);
    sprite.setTransform({ x: 4, brightness: 1 });
    await scene.delay(80);
    sprite.setTransform({ x: -2, brightness: 3 });
    await scene.delay(60);
    sprite.setTransform({ x: 0, brightness: 1 });
    await scene.delay(200);
  })();

  await Promise.all([flinchPromise, modifierPromise].filter(Boolean));

  // Damage popup
  const dmg = event.prevHp - event.newHp;
  if (dmg > 0) {
    const pct = Math.round((dmg / event.maxHp) * 100);
    scene.showPopup({
      id: crypto.randomUUID(),
      text: `-${pct}%`,
      sprite,
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
      id: crypto.randomUUID(),
      text: `+${pct}%`,
      sprite: scene.getSprite(event.pokemon),
      color: '#44cc44',
      duration: DURATION.POPUP,
    });
  }
  await scene.delay(DURATION.DAMAGE);
}

// ── Faint ───────────────────────────────────────────────────────────────

async function playFaint(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'faint' }>,
  audio?: BattleAudioManager
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.FAINT);
    return;
  }

  void audio?.playSfx(STATE_SFX.faint);

  // Drop downward + fade out
  sprite.setTransform({ y: 40, opacity: 0, scale: 0.8 });
  await scene.delay(DURATION.FAINT);
}

// ── Switch in ───────────────────────────────────────────────────────────

async function playSwitchIn(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'switch-in' }>,
  audio?: BattleAudioManager
) {
  // The sprite is already mounted (state applied before animation).
  // Wait a frame for React to render and register the sprite.
  await scene.delay(50);

  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.SWITCH_IN);
    return;
  }

  void audio?.playSfx(STATE_SFX.switchIn);

  // Start invisible
  sprite.setTransform({ scale: 0, opacity: 0, y: 20 });
  await scene.delay(50);

  // White flash as Pokemon materializes
  scene.flashOverlay('rgba(255, 255, 255, 0.25)', 200);

  // Play the Pokemon's cry — resolve base species so regional forms
  // (e.g. "Weezing-Galar") map to the base cry file ("weezing")
  const species = Dex.species.get(event.species);
  const cryId = Dex.species.get(species.baseSpecies).id || species.id;
  void audio?.playSfx(getCryUrl(cryId));

  // Grow into position with slight overshoot
  sprite.setTransform({ scale: 1.15, opacity: 1, y: -5 });
  await scene.delay(300);

  // Settle to resting position
  sprite.setTransform({ scale: 1, opacity: 1, y: 0 });
  await scene.delay(DURATION.SWITCH_IN - 400);
}

// ── Switch out ──────────────────────────────────────────────────────────

async function playSwitchOut(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'switch-out' }>,
  audio?: BattleAudioManager
) {
  const sprite = scene.getSprite(event.pokemon);
  if (!sprite) {
    await scene.delay(DURATION.SWITCH_OUT);
    return;
  }

  void audio?.playSfx(STATE_SFX.switchOut);

  // Red flash as Pokemon is recalled
  scene.flashOverlay('rgba(239, 68, 68, 0.2)', 200);

  // Shrink and fade out
  sprite.setTransform({ scale: 0.6, opacity: 0.5, y: -10 });
  await scene.delay(200);

  sprite.setTransform({ scale: 0, opacity: 0, y: -20 });
  await scene.delay(DURATION.SWITCH_OUT - 200);
}

// ── Boost / Unboost ─────────────────────────────────────────────────────

async function playBoost(
  scene: AnimationScene,
  event: Extract<AnimationEvent, { type: 'boost' | 'unboost' }>,
  audio?: BattleAudioManager
) {
  const isPositive = event.type === 'boost';
  const color = isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  void audio?.playSfx(isPositive ? STATE_SFX.boost : STATE_SFX.unboost);

  // Flash the overlay
  await scene.flashOverlay(color, DURATION.BOOST);

  const arrow = isPositive ? '\u2191' : '\u2193';
  scene.showPopup({
    id: crypto.randomUUID(),
    text: `${arrow}${event.stat.toUpperCase()}`,
    sprite: scene.getSprite(event.pokemon),
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
  event: Extract<AnimationEvent, { type: 'status' }>,
  audio?: BattleAudioManager
) {
  void audio?.playSfx(STATE_SFX.status);
  const color = statusColors[event.status] ?? 'rgba(148, 163, 184, 0.3)';
  await scene.flashOverlay(color, DURATION.STATUS);
}

// ── Super effective ─────────────────────────────────────────────────────

async function playSuperEffective(
  scene: AnimationScene,
  audio?: BattleAudioManager
) {
  void audio?.playSfx(STATE_SFX.supereffective);
  await scene.shakeScreen(4, DURATION.SUPER_EFFECTIVE);
  await scene.flashOverlay('rgba(255, 255, 255, 0.2)', 100);
}

// ── Critical hit ────────────────────────────────────────────────────────

async function playCrit(
  scene: AnimationScene,
) {
  await scene.shakeScreen(6, DURATION.CRIT);
  await scene.flashOverlay('rgba(255, 200, 0, 0.25)', 100);
}

