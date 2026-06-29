import type { MoveAnimFn } from '../../types/animation.types';

const roost: MoveAnimFn = async (scene, attacker, _defender) => {
  // Landing — scale down slightly then back up
  attacker.setTransform({ scale: 0.95, y: 4 });
  await scene.flashOverlay('rgba(100, 220, 100, 0.15)', 200);
  await scene.delay(250);
  attacker.setTransform({ scale: 1, y: 0 });
  await scene.delay(150);
};

export default roost;
