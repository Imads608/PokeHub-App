import type { MoveAnimFn } from '../../types/animation.types';

const calmMind: MoveAnimFn = async (scene, attacker, _defender) => {
  attacker.setTransform({ scale: 1.05 });
  await scene.flashOverlay('rgba(100, 180, 255, 0.12)', 250);
  await scene.delay(200);
  attacker.setTransform({ scale: 1 });
};

export default calmMind;
