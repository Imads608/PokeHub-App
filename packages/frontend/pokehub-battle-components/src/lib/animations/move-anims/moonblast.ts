import type { MoveAnimFn } from '../../types/animation.types';

const moonblast: MoveAnimFn = async (scene, attacker, defender) => {
  // Pink glow on attacker
  attacker.setTransform({ scale: 1.06 });
  await scene.flashOverlay('rgba(255, 150, 200, 0.18)', 200);
  attacker.setTransform({ scale: 1 });

  await scene.delay(100);

  // Impact on defender
  await scene.flashOverlay('rgba(255, 180, 220, 0.12)', 100);
  defender.setTransform({ x: -6 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });
};

export default moonblast;
