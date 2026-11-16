import { createGame, updateGame } from './flame.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { ParticleSystem } from './particles.js';
import { audio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const primary = document.querySelector('#primary'), pauseButton = document.querySelector('#pause'), muteButton = document.querySelector('#mute'), stats = document.querySelector('#stats'), help = document.querySelector('#help'), mobile = document.querySelector('#mobile');
const input = createInput(window), particles = new ParticleSystem();
const params = new URLSearchParams(location.search), seed = Number(params.get('seed')) || 1, shot = params.get('shot');
let game = createGame({seed}), mode = 'menu', muted = false, accumulator = 0, last = 0, width = 0, height = 0, dpr = 1;
const touch = {up:false,down:false,left:false,right:false,ward:false,deposit:false};
const STEP = 1/60;
const HIGH_KEY = 'emberfall.highScore';
let highScore = 0, newHighScore = false, aim = null;
try { highScore = Math.max(0, Number(localStorage.getItem(HIGH_KEY)) || 0); } catch (_) {}
function recordHighScore() {
  newHighScore = game.score > highScore;
  if (newHighScore) { highScore = game.score; try { localStorage.setItem(HIGH_KEY, String(highScore)); } catch (_) {} }
}
function resize() { width = window.innerWidth; height = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); canvas.style.width = width+'px'; canvas.style.height = height+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); }
function ui() {
  const overlay = mode !== 'playing';
  primary.hidden = !overlay;
  primary.textContent = mode === 'menu' ? 'Light the fire' : mode === 'paused' ? 'Resume' : 'Try again';
  pauseButton.hidden = mode !== 'playing' && mode !== 'paused';
  pauseButton.textContent = mode === 'paused' ? 'Resume' : 'Pause';
  stats.hidden = mode !== 'playing'; help.hidden = overlay; mobile.classList.toggle('playing', mode === 'playing');
  const remaining = Math.max(0, Math.ceil(game.duration-game.elapsed));
  stats.innerHTML = `WARD <b>${Math.ceil(game.wardEnergy)}%</b> &nbsp; · &nbsp; CARRIED <b>${game.player.carried}/${game.player.capacity}</b> &nbsp; · &nbsp; DAWN <b>${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}</b>`;
}
function begin() { audio.start(); if (mode === 'paused') mode = 'playing'; else { game = createGame({seed}); newHighScore = false; particles.clear(); mode = 'playing'; } accumulator = 0; last = 0; ui(); }
function togglePause() { if (mode === 'playing') mode='paused'; else if (mode === 'paused') mode='playing'; else return; accumulator=0; last=0; ui(); }
primary.addEventListener('click',begin); pauseButton.addEventListener('click',togglePause);
muteButton.addEventListener('click',()=>{muted=!muted; audio.setMuted(muted); if (!muted) audio.start(); muteButton.textContent=muted?'Sound off':'Sound on'; muteButton.setAttribute('aria-pressed', String(muted)); muteButton.setAttribute('aria-label', muted?'Unmute audio':'Mute audio');});
window.addEventListener('keydown',e=>{ if(e.repeat)return; if(e.code==='Escape'){e.preventDefault();togglePause();} else if(e.code==='Enter' && mode!=='playing'){e.preventDefault();begin();} });
for (const button of mobile.querySelectorAll('button')) { const key=button.dataset.move || button.dataset.action; const clear=()=>{touch[key]=false;}; button.addEventListener('pointerdown',e=>{e.preventDefault();touch[key]=true;button.setPointerCapture(e.pointerId);audio.start();}); button.addEventListener('pointerup',clear);button.addEventListener('pointercancel',clear);button.addEventListener('lostpointercapture',clear); }
window.addEventListener('blur',()=>{Object.keys(touch).forEach(k=>touch[k]=false); if(mode==='playing' && !shot)togglePause();});
window.addEventListener('resize',resize); window.addEventListener('pagehide',()=>{input.destroy();audio.stop();});
function tick() {
  const keys=input.sample(); if (keys.mouse) aim = keys.mouse; const control={moveX:Math.max(-1,Math.min(1,keys.moveX+Number(touch.right)-Number(touch.left))), moveY:Math.max(-1,Math.min(1,keys.moveY+Number(touch.down)-Number(touch.up))),ward:keys.ward||touch.ward,deposit:keys.deposit||touch.deposit};
  const carried=game.player.carried, energy=game.flame.energy, ward=game.wardActive;
  updateGame(game,control,STEP); particles.update(STEP);
  if(game.player.carried>carried || (game.player.carried<carried)){audio.chime();particles.emit(game.player.x,game.player.y,{count:8});}
  if(!ward && game.wardActive)audio.ward();
  if(game.flame.energy < energy-0.2 && Math.random()<.1) particles.emit(game.flame.x,game.flame.y,{count:2,color:'#e46c46'});
  if(game.status!=='playing'){recordHighScore();mode=game.status==='won'?'victory':'gameover';ui();}
}
function draw() {
  const camera={x:game.player.x-width/2,y:game.player.y-height/2};
  const state={width,height,camera,time:game.elapsed,player:{...game.player, aimX:aim ? aim.x-width/2 : game.player.facingX, aimY:aim ? aim.y-height/2 : game.player.facingY},embers:game.embers.filter(e=>e.active),hollows:game.hollows,fire:game.flame,flame:game.flame.energy,maxFlame:game.flame.maxEnergy,score:game.score,fed:game.fed,warded:game.warded,night:game.elapsed,highScore,newHighScore,mode,
    subtitle:mode==='menu'?'Gather embers. Defend the flame. Survive until dawn.':undefined,
    prompt:mode==='menu'?'':undefined};
  render(ctx,state,particles);
  if(game.wardActive && mode==='playing'){ctx.save();ctx.strokeStyle='rgba(255,198,114,.6)';ctx.lineWidth=2;ctx.shadowBlur=18;ctx.shadowColor='#ffb45b';ctx.beginPath();ctx.arc(game.player.x-camera.x,game.player.y-camera.y,85,0,Math.PI*2);ctx.stroke();ctx.restore();}
  ui();
}
function frame(now) { if(!last)last=now; const delta=Math.min((now-last)/1000,.25);last=now; if(mode==='playing'){accumulator+=delta;while(accumulator>=STEP && mode==='playing'){tick();accumulator-=STEP;}} draw();requestAnimationFrame(frame); }
resize();
if (['start','play','end'].includes(shot)) { ({game,mode}=stageShot(shot,seed)); if (shot === 'end') { newHighScore = game.score > highScore; } draw(); window.__shotReady=true; } else { draw();requestAnimationFrame(frame); }
