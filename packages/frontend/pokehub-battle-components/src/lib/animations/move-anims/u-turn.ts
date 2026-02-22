import type { MoveAnimFn } from '../../types/animation.types';

const uTurn: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  if (!atkRect || !defRect) { await scene.delay(500); return; }

  const dx = (defRect.x - atkRect.x) * 0.6;
  const dy = (defRect.y - atkRect.y) * 0.6;

  // Dash through defender
  attacker.setTransform({ x: dx, y: dy, scale: 1.1 });
  await scene.delay(150);
  await scene.flashOverlay('rgba(144, 238, 144, 0.15)', 60);

  // Overshoot past defender
  attacker.setTransform({ x: dx * 1.3, y: dy * 1.3, opacity: 0.6 });
  await scene.delay(100);

  // Slide back
  attacker.setTransform({ x: 0, y: 0, scale: 1, opacity: 1 });
  await scene.delay(200);
};

export default uTurn;
