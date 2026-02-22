import type { MoveAnimFn } from '../../types/animation.types';

const earthquake: MoveAnimFn = async (scene, _attacker, defender) => {
  // Screen shake + brown flash
  await Promise.all([
    scene.shakeScreen(8, 500),
    scene.flashOverlay('rgba(139, 90, 43, 0.2)', 400),
  ]);
  defender.setTransform({ y: 4 });
  await scene.delay(100);
  defender.setTransform({ y: 0 });
};

export default earthquake;
