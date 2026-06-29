import type { MoveAnimFn } from '../../types/animation.types';

const thunderbolt: MoveAnimFn = async (scene, _attacker, defender) => {
  // Yellow flash
  await scene.flashOverlay('rgba(255, 230, 0, 0.25)', 100);
  await scene.delay(50);
  await scene.flashOverlay('rgba(255, 230, 0, 0.15)', 80);

  // Defender shakes vertically
  const shakes = [0, -8, 8, -6, 4, -2, 0];
  for (const y of shakes) {
    defender.setTransform({ y });
    await scene.delay(40);
  }
  defender.setTransform({ y: 0 });
};

export default thunderbolt;
