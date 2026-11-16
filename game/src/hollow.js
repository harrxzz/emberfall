import { distanceSquared, normalized } from './utils.js';

export function createHollow(x, y, options = {}) {
  return { x, y, radius: options.radius ?? 12, speed: options.speed ?? 38,
    damage: options.damage ?? 1.2, health: options.health ?? 100, warded: false };
}

// Hollows seek the flame; a ward repels and damages nearby hollows.
export function updateHollows(hollows, player, flame, dt, ward, options = {}) {
  const wardRadius = options.wardRadius ?? 150;
  const wardDamage = options.wardDamage ?? 300;
  const wardPush = options.wardPush ?? 40;
  let flameDamage = 0;
  for (let i = hollows.length - 1; i >= 0; i--) {
    const hollow = hollows[i];
    hollow.warded = !!ward && distanceSquared(hollow, player) <= (wardRadius + hollow.radius) ** 2;
    if (hollow.warded) {
      const d = normalized(hollow.x - player.x, hollow.y - player.y);
      hollow.x += (d.x || (d.y ? 0 : 1)) * wardPush * dt;
      hollow.y += d.y * wardPush * dt;
      hollow.health -= wardDamage * dt;
      if (hollow.health <= 0) { hollows.splice(i, 1); continue; }
    } else {
      const d = normalized(flame.x - hollow.x, flame.y - hollow.y);
      hollow.x += d.x * hollow.speed * dt; hollow.y += d.y * hollow.speed * dt;
    }
    if (distanceSquared(hollow, flame) <= (flame.radius + hollow.radius) ** 2) flameDamage += hollow.damage * dt;
  }
  return flameDamage;
}
