// Replays use the same fixed-step simulation and inputs as interactive play.
import { createGame, updateGame } from './flame.js';
const STEP = 1 / 60;
export function stageShot(name, seed = 1) {
  const game = createGame({ seed });
  if (name === 'start') return { game, mode: 'menu' };
  if (name === 'play') {
    // Gather and offer with real controls; keep carried embers and approaching
    // hollows in the frame rather than fabricating a screenshot state.
    let phase = 'gather';
    for (let tick = 0; tick < 60 * 20 && game.status === 'playing'; tick++) {
      const p = game.player;
      if (p.carried >= 3) phase = 'return';
      if (phase === 'return' && !p.carried) phase = 'gather';
      const target = phase === 'return' ? game.flame : game.embers.filter(e => e.active)
        .sort((a, b) => Math.hypot(a.x-p.x, a.y-p.y) - Math.hypot(b.x-p.x, b.y-p.y))[0] ?? game.flame;
      const danger = game.hollows.some(h => Math.hypot(h.x-p.x, h.y-p.y) < 100);
      updateGame(game, { moveX: target.x-p.x, moveY: target.y-p.y,
        deposit: phase === 'return', ward: danger && game.wardEnergy > 5 }, STEP);
    }
    return { game, mode: game.status === 'playing' ? 'playing' : 'gameover' };
  }
  // A real caretaker run, replayed through the public simulation controls.
  let phase = 'gather';
  for (let tick = 0; tick < 60 * 181 && game.status === 'playing'; tick++) {
    const p = game.player;
    if (p.carried >= 3 || (p.carried && game.flame.energy < 48)) phase = 'return';
    if (phase === 'return' && !p.carried) phase = 'gather';
    const target = phase === 'return' ? game.flame : game.embers.filter(e => e.active)
      .sort((a,b) => Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0] ?? game.flame;
    const danger = game.hollows.some(h => Math.hypot(h.x-p.x,h.y-p.y) < 96);
    updateGame(game, {moveX:target.x-p.x, moveY:target.y-p.y, ward:danger && game.wardEnergy > 5}, STEP);
  }
  return { game, mode: game.status === 'won' ? 'victory' : 'gameover' };
}
