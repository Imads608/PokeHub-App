import type { MoveAnimFn } from '../../types/animation.types';

const surf: MoveAnimFn = async (scene, _attacker, defender) => {
  // Wide blue wave flash across arena
  await scene.flashOverlay('rgba(60, 150, 255, 0.25)', 300);
  await scene.shakeScreen(4, 200);

  defender.setTransform({ x: -8 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });
};

export default surf;
