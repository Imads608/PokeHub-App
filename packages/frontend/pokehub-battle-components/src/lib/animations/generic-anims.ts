import type { AnimationScene, SpriteHandle } from '../types/animation.types';
import { DURATION } from './easing';

/**
 * Generic Physical move animation.
 * Attacker lunges toward defender → impact flash → return.
 */
export async function genericPhysical(
  scene: AnimationScene,
  attacker: SpriteHandle,
  defender: SpriteHandle
): Promise<void> {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  if (!atkRect || !defRect) {
    await scene.delay(DURATION.MOVE);
    return;
  }

  // Calculate lunge direction
  const dx = (defRect.x - atkRect.x) * 0.35;
  const dy = (defRect.y - atkRect.y) * 0.35;

  // Lunge forward
  attacker.setTransform({ x: dx, y: dy, scale: 1.1 });
  await scene.delay(150);

  // Impact flash on defender
  await scene.flashOverlay('rgba(255, 255, 255, 0.15)', 80);
  defender.setTransform({ x: dx > 0 ? -8 : 8 });
  await scene.delay(100);

  // Return to position
  attacker.setTransform({ x: 0, y: 0, scale: 1 });
  defender.setTransform({ x: 0 });
  await scene.delay(200);
}

/**
 * Generic Special move animation.
 * Energy orb fires from attacker to defender.
 */
export async function genericSpecial(
  scene: AnimationScene,
  attacker: SpriteHandle,
  defender: SpriteHandle
): Promise<void> {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  const arena = scene.arenaRef.current;
  if (!atkRect || !defRect || !arena) {
    await scene.delay(DURATION.MOVE);
    return;
  }

  const arenaRect = arena.getBoundingClientRect();
  const startX = atkRect.x + atkRect.width / 2 - arenaRect.x;
  const startY = atkRect.y + atkRect.height / 2 - arenaRect.y;
  const endX = defRect.x + defRect.width / 2 - arenaRect.x;
  const endY = defRect.y + defRect.height / 2 - arenaRect.y;

  // Attacker glows briefly
  attacker.setTransform({ scale: 1.05 });
  await scene.delay(100);
  attacker.setTransform({ scale: 1 });

  // Fire energy ball
  const id = `generic-special-${Date.now()}`;
  scene.showEffect({
    id,
    sprite: 'energyball',
    startX,
    startY,
    endX,
    endY,
    width: 40,
    height: 40,
    transition: { duration: 0.35, ease: [0, 0, 0.2, 1] },
    exit: 'explode',
  });

  await scene.delay(400);

  // Impact on defender
  defender.setTransform({ x: startX > endX ? 6 : -6 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });

  scene.removeEffect(id);
}

/**
 * Generic Status move animation.
 * Glow/pulse effect on the attacker.
 */
export async function genericStatus(
  scene: AnimationScene,
  attacker: SpriteHandle,
  _defender: SpriteHandle
): Promise<void> {
  // Pulse glow
  attacker.setTransform({ scale: 1.08 });
  await scene.flashOverlay('rgba(100, 200, 255, 0.12)', 200);
  await scene.delay(200);
  attacker.setTransform({ scale: 1 });
  await scene.delay(200);
}
