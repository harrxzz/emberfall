// Outside-game, headless simulation tests. Run: node --test tests/simulation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame } from '../game/src/flame.js';

const DT = 1 / 60;
const MAX_TICKS = 180 * 60 + 2;

// Deliberately uses only game state and public controls, never mutates the world.
function caretaker() {
  let phase = 'gather';
  return game => {
    const { player: p, flame: f } = game;
    if (p.carried >= 3 || (p.carried && f.energy < 48)) phase = 'return';
    if (phase === 'return' && !p.carried) phase = 'gather';
    const target = phase === 'return' ? f : game.embers.filter(e => e.active)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] ?? f;
    const danger = game.hollows.some(h => Math.hypot(h.x - p.x, h.y - p.y) < 96);
    return { moveX: target.x - p.x, moveY: target.y - p.y,
      deposit: phase === 'return', ward: danger && game.wardEnergy > 5 };
  };
}

function simulate(options, policy) {
  const game = createGame(options);
  let ticks = 0, depositActions = 0, wardTicks = 0;
  while (game.status === 'playing' && ticks < MAX_TICKS) {
    const input = policy(game);
    const carriedBefore = game.player.carried;
    if (input.ward && game.wardEnergy > 0) wardTicks++;
    updateGame(game, input, DT);
    if (input.deposit && game.player.carried < carriedBefore) depositActions++;
    ticks++;
  }
  assert.notEqual(game.status, 'playing', 'simulation must terminate within tick limit');
  // Include all state except RNG closure; RNG continuation is checked separately below.
  const { random, ...state } = game;
  return { state, rngNext: random(), ticks, depositActions, wardTicks };
}

test('default unattended fire dies before the win deadline, deterministically', () => {
  const first = simulate({ seed: 1 }, () => ({}));
  const repeat = simulate({ seed: 1 }, () => ({}));
  assert.deepEqual(first, repeat);
  assert.equal(first.state.status, 'lost');
  assert.equal(first.state.flame.energy, 0);
  assert.ok(first.state.elapsed < first.state.duration);
  assert.ok(first.state.spawned > 0);
  console.log(`  neglect: lost at ${first.state.elapsed.toFixed(2)}s; ${first.state.spawned} hollows spawned`);
});

test('caretaker wins repeatably with default gameplay settings', () => {
  // Vary only the random seed; all gameplay settings are the shipped defaults.
  for (const seed of [1, 3, 5, 6, 9, 10]) {
    const options = { seed };
    const first = simulate(options, caretaker());
    const repeat = simulate(options, caretaker());
    assert.deepEqual(first, repeat, `seed ${seed}: replay differs`);
    assert.equal(first.state.status, 'won', `seed ${seed}`);
    assert.equal(first.state.elapsed, 180);
    assert.ok(first.state.flame.energy > 0);
    assert.ok(first.depositActions > 0 && first.wardTicks > 0 && first.state.spawned > 0);
    const frozen = structuredClone(first.state);
    const game = createGame(options);
    // Verify terminal update is inert on the actual simulation state, not a clone.
    Object.assign(game, first.state);
    updateGame(game, { moveX: 1, ward: true, deposit: true }, DT);
    const { random, ...after } = game;
    assert.deepEqual(after, frozen);
    console.log(`  default seed ${seed}: won at ${first.state.elapsed}s, energy ${first.state.flame.energy.toFixed(1)}, deposits ${first.depositActions}, ward ticks ${first.wardTicks}`);
  }
});

test('a caretaker who wards intermittently survives a meaningful run', () => {
  const care = caretaker();
  const result = simulate({}, game => {
    const input = care(game);
    return { ...input, ward: Math.floor(game.elapsed / 15) % 2 === 0 && input.ward };
  });
  assert.ok(['lost', 'won'].includes(result.state.status));
  assert.ok(result.depositActions > 0 && result.wardTicks > 0);
  assert.ok(result.state.elapsed >= 120 && result.state.elapsed <= 240,
    `run lasted ${result.state.elapsed}s`);
  console.log(`  intermittent ward: ${result.state.status} at ${result.state.elapsed.toFixed(2)}s, deposits ${result.depositActions}`);
});


test('automatic deposits, ward removals and score are counted exactly', () => {
  const game = createGame({ emberCount: 0, firstSpawn: 999 });
  game.player.carried = 3;
  game.hollows.push({ x: game.player.x + 5, y: game.player.y, radius: 12, speed: 0, damage: 0, health: 1 });
  updateGame(game, { ward: true }, DT);
  assert.equal(game.player.carried, 0);
  assert.equal(game.fed, 3);
  assert.equal(game.warded, 1);
  assert.equal(game.score, 350 + Math.floor(game.elapsed * 2));
  updateGame(game, {}, 0.5);
  assert.equal(game.fed, 3);
  assert.equal(game.warded, 1);
  assert.equal(game.score, game.fed * 100 + game.warded * 50 + Math.floor(game.elapsed * 2));
});
