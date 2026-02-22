import type { MoveAnimFn } from '../../types/animation.types';

const toxic: MoveAnimFn = async (scene, _attacker, defender) => {
  await scene.flashOverlay('rgba(160, 50, 220, 0.2)', 200);
  defender.setTransform({ scale: 0.97 });
  await scene.delay(150);
  await scene.flashOverlay('rgba(160, 50, 220, 0.1)', 100);
  defender.setTransform({ scale: 1 });
  await scene.delay(100);
};

export default toxic;
