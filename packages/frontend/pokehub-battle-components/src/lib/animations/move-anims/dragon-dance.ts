import type { MoveAnimFn } from '../../types/animation.types';

const dragonDance: MoveAnimFn = async (scene, attacker, _defender) => {
  // Pulse + rotate back and forth
  attacker.setTransform({ scale: 1.1, rotate: -5 });
  await scene.delay(120);
  attacker.setTransform({ scale: 1.12, rotate: 5 });
  await scene.delay(120);
  attacker.setTransform({ scale: 1.08, rotate: -3 });
  await scene.delay(100);

  await scene.flashOverlay('rgba(100, 80, 220, 0.15)', 100);
  attacker.setTransform({ scale: 1, rotate: 0 });
  await scene.delay(100);
};

export default dragonDance;
