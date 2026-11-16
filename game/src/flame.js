import { clamp, distanceSquared, createRandom } from './utils.js';
import { createPlayer, updatePlayer } from './player.js';
import { createEmbers, updateEmbers } from './embers.js';
import { createHollow, updateHollows } from './hollow.js';

export function createFlame(options = {}) {
  return { x: options.x ?? 0, y: options.y ?? 0, radius: options.radius ?? 30,
    energy: options.energy ?? 100, maxEnergy: options.maxEnergy ?? 100,
    decay: options.decay ?? 0.8, depositValue: options.depositValue ?? 16 };
}

export function depositEmbers(player, flame, range = 22) {
  if (distanceSquared(player, flame) > (flame.radius + player.radius + range) ** 2) return 0;
  const count = player.carried;
  player.carried = 0;
  flame.energy = clamp(flame.energy + count * flame.depositValue, 0, flame.maxEnergy);
  return count;
}

export function updateFlame(flame, dt, damage = 0) {
  flame.energy = clamp(flame.energy - flame.decay * dt - damage, 0, flame.maxEnergy);
}

// Self-contained game simulation. All time values are seconds.
export function createGame(options = {}) {
  const bounds = options.bounds ?? { minX: -500, minY: -350, maxX: 500, maxY: 350 };
  const random = createRandom(options.seed ?? 1);
  const flame = createFlame(options.flame);
  const player = createPlayer({ x: flame.x, y: flame.y + 60, ...options.player });
  return { bounds, random, flame, player, embers: createEmbers(options.emberCount ?? 30, bounds, random, { x: flame.x, y: flame.y, radius: 90 }),
    hollows: [], elapsed: 0, duration: options.duration ?? 180, status: 'playing',
    wardEnergy: 100, maxWardEnergy: 100, wardActive: false, spawnIn: options.firstSpawn ?? 5,
    spawned: 0, fed: 0, warded: 0, score: 0, settings: { ...options } };
}

// Fixed simulation ticks ensure render frame rate does not affect the result.
// Caller should use a fixed-step accumulator, e.g. 1/60 second.
export function updateGame(game, input = {}, dt = 1 / 60) {
  if (game.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return game;
  dt = Math.min(dt, game.duration - game.elapsed);
  updatePlayer(game.player, input, dt, game.bounds);
  updateEmbers(game.embers, game.player, dt, game.settings);
  game.fed += depositEmbers(game.player, game.flame);
  game.wardActive = !!input.ward && game.wardEnergy > 0;
  game.wardEnergy = clamp(game.wardEnergy + (game.wardActive ? -25 : 12) * dt, 0, game.maxWardEnergy);
  game.spawnIn -= dt;
  while (game.spawnIn <= 0) {
    const angle = game.random() * Math.PI * 2;
    const b = game.bounds, f = game.flame;
    // Spawn on map boundary rather than outside the visible world.
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const tx = dx > 0 ? (b.maxX - f.x) / dx : dx < 0 ? (b.minX - f.x) / dx : Infinity;
    const ty = dy > 0 ? (b.maxY - f.y) / dy : dy < 0 ? (b.minY - f.y) / dy : Infinity;
    const distance = Math.min(tx, ty);
    game.hollows.push(createHollow(f.x + dx * distance, f.y + dy * distance, { speed: 38 + Math.min(25, game.elapsed / 12) }));
    game.spawned++;
    game.spawnIn += Math.max(0.8, 5 - game.elapsed / 50);
  }
  const beforeWard = game.hollows.length;
  const damage = updateHollows(game.hollows, game.player, game.flame, dt, game.wardActive, game.settings);
  game.warded += beforeWard - game.hollows.length;
  updateFlame(game.flame, dt, damage);
  game.elapsed += dt;
  if (game.flame.energy <= 0) game.status = 'lost';
  else if (game.elapsed >= game.duration - 1e-9) { game.elapsed = game.duration; game.status = 'won'; }
  game.score = game.fed * 100 + game.warded * 50 + Math.floor(game.elapsed * 2);
  return game;
}
