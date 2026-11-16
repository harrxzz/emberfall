// Procedural audio: call start() from a user gesture to satisfy autoplay rules.
export class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambient = [];
    this.enabled = true;
    this.starting = null;
  }

  async start() {
    if (!this.enabled) return false;
    if (this.starting) return this.starting;
    this.starting = this._start();
    try { return await this.starting; } finally { this.starting = null; }
  }

  async _start() {
    try {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) return false;
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.context.destination);
        this.ambient = [];
      }
      const c = this.context;
      if (c.state !== 'running') await c.resume();
      if (c.state !== 'running' || !this.enabled) return false;
      if (!this.ambient.length) this._ambience();
      return true;
    } catch (_) { return false; }
  }

  _ambience() {
    const c = this.context;
    const drone = c.createOscillator();
    const droneGain = c.createGain();
    drone.type = 'sine'; drone.frequency.value = 55;
    droneGain.gain.value = 0.075;
    drone.connect(droneGain); droneGain.connect(this.master); drone.start();
    const noise = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const r = Math.random() * 2 - 1;
      data[i] = r * 0.13 + (Math.random() < 0.002 ? r * 0.8 : 0);
    }
    const source = c.createBufferSource(); source.buffer = noise; source.loop = true;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650;
    const gain = c.createGain(); gain.gain.value = 0.14;
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start();
    const wind = c.createBufferSource(); wind.buffer = noise; wind.loop = true;
    const windFilter = c.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 320; windFilter.Q.value = 0.35;
    const windGain = c.createGain(); windGain.gain.value = 0.11;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.09;
    const lfoGain = c.createGain(); lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain); lfoGain.connect(windGain.gain);
    wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(this.master);
    wind.start(); lfo.start();
    this.ambient = [drone, source, wind, lfo];
  }

  // One-shots are deliberately no-ops until start() succeeds.
  chime() { this._tone(880, 1320, 0.65, 0.12, 'sine'); }
  ward() { this._tone(150, 45, 0.28, 0.25, 'triangle'); }
  thud() { this.ward(); }

  _tone(from, to, duration, volume, type) {
    const c = this.context;
    if (!this.enabled || !c || c.state !== 'running') return;
    const t = c.currentTime;
    const osc = c.createOscillator(); const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain); gain.connect(this.master);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    osc.start(t); osc.stop(t + duration + 0.01);
  }

  setMuted(muted) {
    this.enabled = !muted;
    if (this.master && this.context && this.context.state !== 'closed') {
      this.master.gain.setValueAtTime(muted ? 0 : 0.35, this.context.currentTime);
    }
  }

  async stop() {
    const c = this.context;
    this.context = null; this.master = null; this.ambient = [];
    if (c && c.state !== 'closed') {
      try { await c.close(); } catch (_) { /* Audio is optional. */ }
    }
  }
}

export const audio = new GameAudio();
export default audio;
