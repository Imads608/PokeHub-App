import type { MoveAnimFn } from '../../types/animation.types';

const swordsDance: MoveAnimFn = async (scene, attacker, _defender) => {
  // 3 pulses (scale up → down)
  for (let i = 0; i < 3; i++) {
    attacker.setTransform({ scale: 1.15 });
    await scene.delay(100);
    attacker.setTransform({ scale: 1 });
    await scene.delay(80);
  }
  await scene.flashOverlay('rgba(220, 60, 60, 0.12)', 100);
};

export default swordsDance;
