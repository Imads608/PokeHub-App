import type { MoveAnimFn } from '../../types/animation.types';

const closeCombat: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  if (!atkRect || !defRect) { await scene.delay(600); return; }

  const dx = (defRect.x - atkRect.x) * 0.35;
  const dy = (defRect.y - atkRect.y) * 0.35;

  // 3 rapid lunges at different angles
  for (let i = 0; i < 3; i++) {
    const offsetX = dx + (i - 1) * 12;
    attacker.setTransform({ x: offsetX, y: dy, scale: 1.05 });
    await scene.delay(80);
    await scene.flashOverlay('rgba(255, 255, 255, 0.1)', 40);
    defender.setTransform({ x: (i - 1) * -6 });
    await scene.delay(60);
  }

  attacker.setTransform({ x: 0, y: 0, scale: 1 });
  defender.setTransform({ x: 0 });
};

export default closeCombat;
