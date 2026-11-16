import { clamp, normalized } from './utils.js';

export function createPlayer(options = {}) {
  return { x: options.x ?? 0, y: options.y ?? 0, speed: options.speed ?? 125,
    radius: options.radius ?? 10, carried: 0, capacity: options.capacity ?? 5,
    health: options.health ?? 100, maxHealth: options.health ?? 100, facingX: 0, facingY: 1 };
}

// input is an object with moveX/moveY in [-1,1]. dt is seconds.
export function updatePlayer(player, input, dt, bounds) {
  const x = clamp(Number(input.moveX) || 0, -1, 1);
  const y = clamp(Number(input.moveY) || 0, -1, 1);
  const direction = normalized(x, y);
  if (direction.x || direction.y) {
    player.facingX = direction.x; player.facingY = direction.y;
    player.x += direction.x * player.speed * dt;
    player.y += direction.y * player.speed * dt;
  }
  if (bounds) {
    player.x = clamp(player.x, bounds.minX + player.radius, bounds.maxX - player.radius);
    player.y = clamp(player.y, bounds.minY + player.radius, bounds.maxY - player.radius);
  }
}
