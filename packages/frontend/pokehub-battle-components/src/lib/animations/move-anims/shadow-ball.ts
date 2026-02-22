import type { MoveAnimFn } from '../../types/animation.types';

const shadowBall: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  const arena = scene.arenaRef.current;
  if (!atkRect || !defRect || !arena) { await scene.delay(600); return; }

  const arenaRect = arena.getBoundingClientRect();

  scene.showEffect({
    id: 'shadowball-fx',
    sprite: 'shadowball',
    startX: atkRect.x + atkRect.width / 2 - arenaRect.x,
    startY: atkRect.y + atkRect.height / 2 - arenaRect.y,
    endX: defRect.x + defRect.width / 2 - arenaRect.x,
    endY: defRect.y + defRect.height / 2 - arenaRect.y,
    width: 44, height: 44,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    exit: 'explode',
    tint: '#8844cc',
  });

  await scene.delay(300);
  await scene.flashOverlay('rgba(100, 50, 150, 0.15)', 100);

  defender.setTransform({ x: 6 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });
  scene.removeEffect('shadowball-fx');
};

export default shadowBall;
