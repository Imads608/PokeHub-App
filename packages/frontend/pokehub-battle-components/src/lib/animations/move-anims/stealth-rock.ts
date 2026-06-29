import type { MoveAnimFn } from '../../types/animation.types';

const stealthRock: MoveAnimFn = async (scene, _attacker, _defender) => {
  await scene.shakeScreen(3, 200);
  await scene.flashOverlay('rgba(139, 119, 101, 0.18)', 250);
  await scene.delay(150);
};

export default stealthRock;
