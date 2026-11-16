// Small, bounded particle system; simulation time is in seconds.
export class ParticleSystem {
  constructor(limit = 500) { this.items = []; this.limit = limit; }
  emit(x, y, options = {}) {
    const { count = 8, color = '#ffb75b', speed = 45, life = 1, size = 3, spread = Math.PI * 2, gravity = -12 } = options;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const velocity = speed * (0.3 + Math.random() * 0.7);
      const duration = life * (0.55 + Math.random() * 0.65);
      this.items.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: duration, duration, size: size * (0.5 + Math.random()), color, gravity });
    }
    if (this.items.length > this.limit) this.items.splice(0, this.items.length - this.limit);
  }
  update(dt) {
    dt = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, 0.1));
    for (const p of this.items) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; p.life -= dt; }
    this.items = this.items.filter(p => p.life > 0);
  }
  draw(ctx, camera = {}) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.duration); ctx.fillStyle = p.color;
      ctx.shadowColor = p.color; ctx.shadowBlur = p.size * 5;
      ctx.beginPath(); ctx.arc(p.x - (camera.x || 0), p.y - (camera.y || 0), p.size * Math.max(0.2, p.life / p.duration), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  clear() { this.items.length = 0; }
}
export default ParticleSystem;
