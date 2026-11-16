// Small, dependency-free deterministic math helpers.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export function createRandom(seed = 1) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function normalized(x, y) {
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
