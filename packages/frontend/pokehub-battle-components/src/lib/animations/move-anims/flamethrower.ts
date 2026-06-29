import type { MoveAnimFn } from '../../types/animation.types';

const flamethrower: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  const arena = scene.arenaRef.current;
  if (!atkRect || !defRect || !arena) { await scene.delay(600); return; }

  const arenaRect = arena.getBoundingClientRect();
  const startX = atkRect.x + atkRect.width / 2 - arenaRect.x;
  const startY = atkRect.y + atkRect.height / 2 - arenaRect.y;
  const endX = defRect.x + defRect.width / 2 - arenaRect.x;
  const endY = defRect.y + defRect.height / 2 - arenaRect.y;

  // Attacker glows orange
  attacker.setTransform({ scale: 1.05 });
  await scene.delay(80);

  // Fire stream
  attacker.setTransform({ scale: 1 });
  scene.flashOverlay('rgba(255, 100, 0, 0.12)', 200);
  await scene.showEffect({
    id: 'flamethrower-fx',
    sprite: 'fireball',
    startX, startY,
    endX, endY,
    width: 48, height: 48,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    exit: 'explode',
    tint: '#ff6600',
  });

  defender.setTransform({ x: startX > endX ? 6 : -6 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });
};

export default flamethrower;
