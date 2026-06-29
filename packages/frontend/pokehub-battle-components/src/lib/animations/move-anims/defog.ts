import type { MoveAnimFn } from '../../types/animation.types';

const defog: MoveAnimFn = async (scene, _attacker, _defender) => {
  // Wind clearing effect — light gray flash
  await scene.flashOverlay('rgba(200, 210, 220, 0.2)', 300);
  await scene.delay(200);
  await scene.flashOverlay('rgba(200, 210, 220, 0.1)', 200);
};

export default defog;
