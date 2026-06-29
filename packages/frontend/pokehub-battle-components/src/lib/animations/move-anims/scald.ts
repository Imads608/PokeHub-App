import type { MoveAnimFn } from '../../types/animation.types';

const scald: MoveAnimFn = async (scene, attacker, defender) => {
  attacker.setTransform({ scale: 1.04 });
  await scene.delay(100);
  attacker.setTransform({ scale: 1 });

  await scene.flashOverlay('rgba(100, 180, 255, 0.18)', 250);

  defender.setTransform({ x: -5 });
  await scene.delay(80);
  defender.setTransform({ x: 5 });
  await scene.delay(80);
  defender.setTransform({ x: 0 });
};

export default scald;
