import type { MoveAnimFn } from '../../types/animation.types';

const iceBeam: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  const arena = scene.arenaRef.current;
  if (!atkRect || !defRect || !arena) { await scene.delay(600); return; }

  const arenaRect = arena.getBoundingClientRect();

  scene.flashOverlay('rgba(130, 200, 255, 0.2)', 250);
  await scene.showEffect({
    id: 'icebeam-fx',
    sprite: 'icicle',
    startX: atkRect.x + atkRect.width / 2 - arenaRect.x,
    startY: atkRect.y + atkRect.height / 2 - arenaRect.y,
    endX: defRect.x + defRect.width / 2 - arenaRect.x,
    endY: defRect.y + defRect.height / 2 - arenaRect.y,
    width: 36, height: 36,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    exit: 'explode',
    tint: '#88ccff',
  });

  defender.setTransform({ x: -4 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });
};

export default iceBeam;
