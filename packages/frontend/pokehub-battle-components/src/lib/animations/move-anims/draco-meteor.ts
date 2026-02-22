import type { MoveAnimFn } from '../../types/animation.types';

const dracoMeteor: MoveAnimFn = async (scene, _attacker, defender) => {
  // Purple flash + screen shake (meteors crashing)
  await scene.flashOverlay('rgba(120, 50, 200, 0.2)', 150);
  await scene.shakeScreen(6, 350);
  await scene.flashOverlay('rgba(200, 100, 50, 0.15)', 100);

  defender.setTransform({ y: 6 });
  await scene.delay(100);
  defender.setTransform({ y: 0 });
};

export default dracoMeteor;
