import type { MoveAnimFn } from '../../types/animation.types';

const willOWisp: MoveAnimFn = async (scene, _attacker, defender) => {
  await scene.flashOverlay('rgba(100, 80, 200, 0.15)', 150);
  await scene.delay(100);
  await scene.flashOverlay('rgba(180, 100, 255, 0.12)', 150);
  defender.setTransform({ x: -3 });
  await scene.delay(80);
  defender.setTransform({ x: 3 });
  await scene.delay(80);
  defender.setTransform({ x: 0 });
};

export default willOWisp;
