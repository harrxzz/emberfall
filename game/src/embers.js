import { distanceSquared } from './utils.js';

export function createEmbers(count, bounds, random, exclusion = { x: 0, y: 0, radius: 90 }) {
  const embers = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    // Bounded retries also work on very small maps.
    for (let attempt = 0; attempt < 12; attempt++) {
      x = bounds.minX + random() * (bounds.maxX - bounds.minX);
      y = bounds.minY + random() * (bounds.maxY - bounds.minY);
      if (distanceSquared({ x, y }, exclusion) >= exclusion.radius ** 2) break;
    }
    embers.push({ id: i, x, y, active: true, respawnIn: 0 });
  }
  return embers;
}

export function updateEmbers(embers, player, dt, options = {}) {
  const pickupRadius = (options.pickupRadius ?? 18) + player.radius;
  const respawnSeconds = options.respawnSeconds ?? 12;
  let collected = 0;
  for (const ember of embers) {
    if (!ember.active) {
      ember.respawnIn -= dt;
      if (ember.respawnIn <= 0) { ember.active = true; ember.respawnIn = 0; }
    }
    if (ember.active && player.carried < player.capacity && distanceSquared(ember, player) <= pickupRadius ** 2) {
      ember.active = false; ember.respawnIn = respawnSeconds;
      player.carried++; collected++;
    }
  }
  return collected;
}
