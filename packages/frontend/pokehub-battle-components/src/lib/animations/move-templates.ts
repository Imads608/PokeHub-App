import type { MoveAnimFn, AnimationScene, SpriteHandle } from '../types/animation.types';
import type {
  MoveAnimConfig,
  ProjectileConfig,
  LungeConfig,
  AoeConfig,
  SelfBuffConfig,
  StatusEffectConfig,
} from '@pokehub/shared/pokemon-battle-types';
import { ACCEL, DURATION } from './easing';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Compute arena-relative center coordinates for attacker and defender */
function getPositions(
  scene: AnimationScene,
  attacker: SpriteHandle,
  defender: SpriteHandle
) {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  const arena = scene.arenaRef.current;
  if (!atkRect || !defRect || !arena) return null;

  const ar = arena.getBoundingClientRect();
  return {
    startX: atkRect.x + atkRect.width / 2 - ar.x,
    startY: atkRect.y + atkRect.height / 2 - ar.y,
    endX: defRect.x + defRect.width / 2 - ar.x,
    endY: defRect.y + defRect.height / 2 - ar.y,
    atkRect,
    defRect,
  };
}

// ── 1. Projectile ────────────────────────────────────────────────────────

export function projectile(config: ProjectileConfig): MoveAnimFn {
  const {
    sprite, tint, flash,
    size = 40, speed = 0.3, ease = ACCEL,
    recoil = 6, chargeUp = true,
  } = config;

  return async (scene, attacker, defender) => {
    const pos = getPositions(scene, attacker, defender);
    if (!pos) { await scene.delay(DURATION.MOVE); return; }

    if (chargeUp) {
      attacker.setTransform({ scale: 1.05 });
      await scene.delay(80);
      attacker.setTransform({ scale: 1 });
    }

    if (flash) scene.flashOverlay(flash, 200);

    await scene.showEffect({
      id: `tmpl-proj-${crypto.randomUUID()}`,
      sprite,
      startX: pos.startX, startY: pos.startY,
      endX: pos.endX, endY: pos.endY,
      width: size, height: size,
      transition: { duration: speed, ease },
      exit: 'explode',
      tint,
    });

    defender.setTransform({ x: pos.startX > pos.endX ? recoil : -recoil });
    await scene.delay(100);
    defender.setTransform({ x: 0 });
  };
}

// ── 2. Lunge (physical contact) ──────────────────────────────────────────

export function lunge(config?: LungeConfig): MoveAnimFn {
  const {
    distance = 0.35, hits = 1, flash = 'rgba(255,255,255,0.15)',
    scale = 1.1, recoil = 8,
  } = config ?? {};

  return async (scene, attacker, defender) => {
    const atkRect = attacker.getRect();
    const defRect = defender.getRect();
    if (!atkRect || !defRect) { await scene.delay(DURATION.MOVE); return; }

    const dx = (defRect.x - atkRect.x) * distance;
    const dy = (defRect.y - atkRect.y) * distance;

    for (let i = 0; i < hits; i++) {
      const offset = hits > 1 ? (i - Math.floor(hits / 2)) * 10 : 0;
      attacker.setTransform({ x: dx + offset, y: dy, scale });
      await scene.delay(80);
      await scene.flashOverlay(flash, 40);
      defender.setTransform({ x: hits > 1 ? (i - 1) * -(recoil / 2) : (dx > 0 ? -recoil : recoil) });
      await scene.delay(60);
    }

    attacker.setTransform({ x: 0, y: 0, scale: 1 });
    defender.setTransform({ x: 0 });
  };
}

// ── 3. AoE / screen effect ──────────────────────────────────────────────

export function aoe(config?: AoeConfig): MoveAnimFn {
  const {
    shake = 4, shakeDuration = 400,
    flash = 'rgba(255,255,255,0.15)', recoil = 4,
  } = config ?? {};

  return async (scene, _attacker, defender) => {
    await Promise.all([
      scene.shakeScreen(shake, shakeDuration),
      scene.flashOverlay(flash, shakeDuration - 100),
    ]);
    defender.setTransform({ y: recoil });
    await scene.delay(100);
    defender.setTransform({ y: 0 });
  };
}

// ── 4. Self-buff ─────────────────────────────────────────────────────────

export function selfBuff(config?: SelfBuffConfig): MoveAnimFn {
  const {
    flash = 'rgba(100,200,255,0.12)', pulses = 1,
    scale = 1.08, rotate = false,
  } = config ?? {};

  return async (scene, attacker) => {
    for (let i = 0; i < pulses; i++) {
      const rot = rotate ? (i % 2 === 0 ? -5 : 5) : 0;
      attacker.setTransform({ scale, rotate: rot });
      await scene.delay(120);
      attacker.setTransform({ scale: 1, rotate: 0 });
      await scene.delay(80);
    }
    await scene.flashOverlay(flash, 150);
  };
}

// ── 5. Status application ────────────────────────────────────────────────

export function statusEffect(config?: StatusEffectConfig): MoveAnimFn {
  const {
    flash = 'rgba(148,163,184,0.25)',
    defenderShrink = 0.97,
  } = config ?? {};

  return async (scene, _attacker, defender) => {
    await scene.flashOverlay(flash, 200);
    defender.setTransform({ scale: defenderShrink });
    await scene.delay(150);
    await scene.flashOverlay(flash, 100);
    defender.setTransform({ scale: 1 });
    await scene.delay(100);
  };
}

// ── Template resolver ────────────────────────────────────────────────────

/**
 * Resolve a server-delivered MoveAnimConfig to a MoveAnimFn.
 * Uses the discriminated union to narrow config types per template.
 */
export function resolveTemplate(entry: MoveAnimConfig): MoveAnimFn {
  switch (entry.template) {
    case 'projectile':   return projectile(entry.config);
    case 'lunge':        return lunge(entry.config);
    case 'aoe':          return aoe(entry.config);
    case 'selfBuff':     return selfBuff(entry.config);
    case 'statusEffect': return statusEffect(entry.config);
  }
}
