const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
function bar(ctx, x, y, width, value, color, label) {
  ctx.fillStyle = 'rgba(9,12,16,.75)'; ctx.fillRect(x, y, width, 7);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillRect(x, y, width * clamp(value), 7); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(226,209,175,.3)'; ctx.strokeRect(x + .5, y + .5, width - 1, 6);
  ctx.fillStyle = '#eee3ca'; ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'left'; ctx.fillText(`${label}  ${Math.round(clamp(value) * 100)}%`, x, y - 6);
}
export function drawHUD(ctx, state = {}, width, height) {
  const w = width || state.width || ctx.canvas.clientWidth || ctx.canvas.width;
  const h = height || state.height || ctx.canvas.clientHeight || ctx.canvas.height;
  const mode = state.mode || state.screen || 'playing';
  ctx.save();
  if (mode !== 'menu') {
    const player = state.player || {}; const health = state.health ?? player.health; const maxHealth = state.maxHealth ?? player.maxHealth ?? 100;
    const flame = state.flame ?? player.flame; const maxFlame = state.maxFlame ?? 100;
    if (health != null) bar(ctx, 26, 36, Math.min(160, w * .3), health / maxHealth, '#ca6a59', 'VITALITY');
    if (flame != null) bar(ctx, 26, 67, Math.min(160, w * .3), flame / maxFlame, '#f4a950', 'FLAME');
    ctx.textAlign = 'right'; ctx.fillStyle = '#ded0b5'; ctx.font = '15px Georgia, serif';
    if (state.score != null && mode === 'playing') { ctx.fillText(`Score  ${state.score}`, w - 200, 27); ctx.font = '12px Georgia, serif'; ctx.fillText(`Fed ${state.fed}   ·   Warded ${state.warded}`, w - 200, 47); ctx.fillText(`Night ${Math.floor(state.night / 60)}:${String(Math.floor(state.night % 60)).padStart(2, '0')}   ·   Best ${state.highScore}`, w - 200, 64); }
    if (state.wave != null) { ctx.fillStyle = '#a9aba7'; ctx.font = '12px Georgia, serif'; ctx.fillText(`Wave ${state.wave}`, w - 26, 53); }
  }
  if (mode !== 'playing') {
    ctx.fillStyle = 'rgba(6,9,12,.68)'; ctx.fillRect(0, 0, w, h);
    const titles = { menu: 'EMBERFALL', paused: 'The fire waits', gameover: 'The flame went quiet', victory: 'The forest remembers' };
    const title = state.title || titles[mode] || mode;
    const subtitle = state.subtitle || ({ menu: 'A light against the hollow dark', paused: 'Paused', gameover: 'Even ash holds a memory of fire.', victory: 'A spark remains.' }[mode] || '');
    const prompt = state.prompt ?? ({ menu: 'Press enter to begin', paused: 'Press escape to return', gameover: 'Press enter to try again', victory: 'Press enter to continue' }[mode] || '');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e9cfaa'; ctx.shadowColor = '#d06c35'; ctx.shadowBlur = 24;
    ctx.font = `${Math.max(26, Math.min(64, w * .085))}px Georgia, serif`; ctx.fillText(title, w / 2, h * .39, w - 40); ctx.shadowBlur = 0;
    const ended = mode === 'gameover' || mode === 'victory';
    ctx.fillStyle = '#aaa9a1'; ctx.font = 'italic 16px Georgia, serif';
    if (!ended) ctx.fillText(subtitle, w / 2, h * .39 + 45, w - 40);
    if (ended) {
      const y = h * .39 + 39;
      ctx.fillStyle = '#f4c58a'; ctx.font = 'bold 19px Georgia, serif';
      ctx.fillText(`Score ${state.score}   ·   Best ${Math.max(state.highScore, state.score)}`, w / 2, y, w - 30);
      ctx.fillStyle = '#e2d5bd'; ctx.font = '14px Georgia, serif';
      ctx.fillText(`Fed ${state.fed}   ·   Warded ${state.warded}   ·   Night ${Math.floor(state.night / 60)}:${String(Math.floor(state.night % 60)).padStart(2, '0')}`, w / 2, y + 25, w - 30);
      if (state.newHighScore) { ctx.fillStyle = '#ffd28c'; ctx.fillText('NEW HIGH SCORE', w / 2, y + 50, w - 30); }
    }
    ctx.fillStyle = '#e5b77d'; ctx.font = '13px Georgia, serif'; if (!ended) ctx.fillText(state.message || prompt, w / 2, h * .59, w - 40);
    ctx.strokeStyle = 'rgba(226,180,118,.45)'; ctx.beginPath(); ctx.moveTo(w / 2 - 55, ended ? h * .63 : h * .57); ctx.lineTo(w / 2 + 55, ended ? h * .63 : h * .57); ctx.stroke();
  }
  ctx.restore();
}
export default drawHUD;
