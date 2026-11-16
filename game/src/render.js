import { drawHUD } from './hud.js';
const TAU = Math.PI * 2;
const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function glow(ctx, x, y, radius, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,124,48,0)'); ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function forest(ctx, w, h, camera, time) {
  let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1c2930'); g.addColorStop(.5, '#3a4848'); g.addColorStop(1, '#252f2c'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  glow(ctx, w * .68, h * .37, Math.max(w, h) * .47, 'rgba(119,113,84,.14)');
  for (let layer = 0; layer < 3; layer++) {
    const spacing = [94, 125, 175][layer], shift = (camera.x * [0.1, .25, .48][layer]) % spacing;
    ctx.fillStyle = ['#263136', '#202a2b', '#141e20'][layer];
    for (let i = -2; i < w / spacing + 3; i++) {
      const seed = i + Math.floor(camera.x * [0.1, .25, .48][layer] / spacing), x = i * spacing - shift + rand(seed + layer * 91) * 50;
      const base = h * (.84 + layer * .065), trunk = 8 + layer * 8 + rand(seed + 77) * 12, top = h * (.05 + rand(seed + 24) * .25);
      ctx.beginPath(); ctx.moveTo(x - trunk, base); ctx.lineTo(x - trunk * .42, top); ctx.lineTo(x - trunk * .7, top - 65); ctx.lineTo(x + trunk * .25, top); ctx.lineTo(x + trunk, base); ctx.fill();
      ctx.lineWidth = 3 + layer * 2; ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(x, top + h * .28); ctx.lineTo(x - 28 - rand(seed) * 25, top + h * .14); ctx.moveTo(x, top + h * .38); ctx.lineTo(x + 35, top + h * .22); ctx.stroke();
    }
    const fog = ctx.createLinearGradient(0, h * .55, 0, h * .98); fog.addColorStop(0, 'rgba(109,125,122,0)'); fog.addColorStop(.65, `rgba(120,137,130,${.055 - layer * .014})`); fog.addColorStop(1, 'rgba(24,31,30,0)'); ctx.fillStyle = fog; ctx.fillRect(0, h * .55, w, h * .45);
  }
  ctx.fillStyle = '#101918'; ctx.beginPath(); ctx.moveTo(0, h * .91); for (let x = 0; x <= w + 25; x += 25) ctx.lineTo(x, h * .91 + Math.sin(x * .009 + camera.x * .002) * 7); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  for (let i = 0; i < 65; i++) {
    const x = ((rand(i + 10) * w + time * (3 + rand(i) * 5)) % (w + 20)) - 10, y = ((rand(i + 300) * h + time * (6 + rand(i + 30) * 10)) % (h + 20)) - 10;
    ctx.fillStyle = i % 9 === 0 ? 'rgba(255,182,98,.65)' : 'rgba(197,203,189,.25)'; ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.5 : .8, 0, TAU); ctx.fill();
  }
}
function flame(ctx, x, y, size, time) {
  glow(ctx, x, y, size * 4, 'rgba(255,124,37,.34)');
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(time * 5 + x) * .09); ctx.fillStyle = '#e76e2d'; ctx.beginPath(); ctx.moveTo(0, -size * 1.7); ctx.bezierCurveTo(size * .9, -size * .8, size, size * .3, 0, size * .6); ctx.bezierCurveTo(-size, size * .3, -size * .7, -size * .7, 0, -size * 1.7); ctx.fill(); ctx.fillStyle = '#ffd891'; ctx.beginPath(); ctx.ellipse(0, 0, size * .33, size * .6, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function figure(ctx, entity, camera, time, enemy) {
  if (!Number.isFinite(entity.x) || !Number.isFinite(entity.y)) return;
  const x = entity.x - camera.x, y = entity.y - camera.y, r = entity.radius || (enemy ? 16 : 14);
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = enemy ? '#293436' : '#7b7662'; ctx.strokeStyle = enemy ? '#70817b' : '#ecd0a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, r * .45, r * .75, r * 1.05, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -r * .65, r * .62, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = enemy ? '#efaa65' : '#f2d9ae'; ctx.shadowColor = enemy ? '#ff6c38' : '#ffe4b0'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(-r * .22, -r * .7, r * .10, r * .14, 0, 0, TAU); ctx.ellipse(r * .22, -r * .7, r * .10, r * .14, 0, 0, TAU); ctx.fill(); ctx.restore();
  if (!enemy) { const angle = Math.atan2(entity.aimY || 0, entity.aimX || 1); flame(ctx, x + Math.cos(angle) * r * 1.3, y + Math.sin(angle) * r * 1.3, r * .4, time); }
}
export function render(ctx, state = {}, particles) {
  const w = state.width || ctx.canvas.clientWidth || ctx.canvas.width, h = state.height || ctx.canvas.clientHeight || ctx.canvas.height;
  const time = Number.isFinite(state.time) ? state.time : 0, camera = { x: state.camera?.x || 0, y: state.camera?.y || 0 };
  ctx.save(); forest(ctx, w, h, camera, time);
  for (const p of state.platforms || []) { ctx.fillStyle = '#171d1a'; ctx.fillRect(p.x - camera.x, p.y - camera.y, p.width, p.height); ctx.fillStyle = '#72725b'; ctx.fillRect(p.x - camera.x, p.y - camera.y, p.width, 2); }
  for (const p of state.embers || state.pickups || []) if (Number.isFinite(p.x) && Number.isFinite(p.y)) flame(ctx, p.x - camera.x, p.y - camera.y, p.radius || 5, time);
  if (state.fire && Number.isFinite(state.fire.x) && Number.isFinite(state.fire.y)) flame(ctx, state.fire.x - camera.x, state.fire.y - camera.y, state.fire.radius || 18, time);
  for (const e of state.enemies || state.hollows || []) figure(ctx, e, camera, time, true);
  if (state.player) figure(ctx, state.player, camera, time, false);
  if (particles && typeof particles.draw === 'function') particles.draw(ctx, camera);
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .75); vignette.addColorStop(0, 'rgba(4,8,10,0)'); vignette.addColorStop(1, 'rgba(4,8,10,.7)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
  drawHUD(ctx, state, w, h); ctx.restore();
}
export default render;
