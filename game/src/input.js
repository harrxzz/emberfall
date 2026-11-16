// Browser input adapter; call destroy() when the game is unmounted.
export function createInput(target = window) {
  const keys = new Set();
  let mouse = null, mouseWard = false;
  const move = e => { mouse = { x: e.clientX, y: e.clientY }; };
  const pointerDown = e => { if (e.button === 0 && e.target?.tagName === "CANVAS") { move(e); mouseWard = true; } };
  const pointerUp = e => { if (e.button === 0) mouseWard = false; };
  const watched = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyE']);
  const down = event => { if (watched.has(event.code)) { keys.add(event.code); event.preventDefault(); } };
  const up = event => { keys.delete(event.code); if (watched.has(event.code)) event.preventDefault(); };
  const blur = () => { keys.clear(); mouseWard = false; };
  target.addEventListener('pointermove', move); target.addEventListener('pointerdown', pointerDown); target.addEventListener('pointerup', pointerUp);
  target.addEventListener('keydown', down); target.addEventListener('keyup', up); target.addEventListener('blur', blur);
  return {
    sample() { return { moveX: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
      moveY: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')),
      ward: keys.has('Space') || mouseWard, mouse, deposit: keys.has('KeyE') }; },
    destroy() { target.removeEventListener('pointermove', move); target.removeEventListener('pointerdown', pointerDown); target.removeEventListener('pointerup', pointerUp); target.removeEventListener('keydown', down); target.removeEventListener('keyup', up); target.removeEventListener('blur', blur); keys.clear(); }
  };
}
