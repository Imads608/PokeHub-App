import type { MoveAnimFn } from '../../types/animation.types';

const knockOff: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  if (!atkRect || !defRect) { await scene.delay(500); return; }

  const dx = (defRect.x - atkRect.x) * 0.3;
  const dy = (defRect.y - atkRect.y) * 0.3;

  // Quick lunge
  attacker.setTransform({ x: dx, y: dy, scale: 1.05 });
  await scene.delay(120);

  // Slash impact
  await scene.flashOverlay('rgba(100, 50, 150, 0.15)', 80);
  defender.setTransform({ x: dx > 0 ? -10 : 10 });
  await scene.delay(150);

  attacker.setTransform({ x: 0, y: 0, scale: 1 });
  defender.setTransform({ x: 0 });
};

export default knockOff;
