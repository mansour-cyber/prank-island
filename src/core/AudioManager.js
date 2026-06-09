/* ============================================================
   AudioManager — procedural Web Audio SFX + background music.
   Zero audio files: everything is synthesised, so it stays
   lightweight and works offline. Richer than the legacy version
   (filtered tones, soft envelopes, gentle looping melody).
   ============================================================ */
class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.musicTimer = null;
    this.musicGain = null;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  unlock() { try { this._ensure(); } catch {} }

  setMuted(v) {
    this.muted = v;
    if (this.master) this.master.gain.value = v ? 0 : 0.5;
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  _tone(freq, dur, type = 'square', vol = 0.15, when = 0) {
    if (this.muted) return;
    try {
      const c = this._ensure();
      const t = c.currentTime + when;
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 3500;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(filt); filt.connect(gain); gain.connect(this.master);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch {}
  }

  _seq(notes, gap = 0.1) {
    notes.forEach((n, i) => this._tone(n[0], n[1] || 0.14, n[2] || 'square', n[3] || 0.13, i * gap));
  }

  click()   { this._tone(760, 0.06, 'square', 0.08); }
  jump()    { this._tone(420, 0.1, 'square', 0.1); this._tone(660, 0.1, 'square', 0.08, 0.05); }
  collect() { this._seq([[880, 0.07], [1180, 0.07], [1480, 0.12]], 0.05); }
  win()     { this._seq([[523, 0.13], [659, 0.13], [784, 0.13], [1047, 0.3, 'triangle']], 0.13); }
  fail()    { this._seq([[420, 0.18, 'sawtooth'], [300, 0.18, 'sawtooth'], [200, 0.36, 'sawtooth']], 0.16); }
  funny()   { this._seq([[300, 0.08, 'triangle'], [520, 0.08, 'triangle'], [200, 0.16, 'sawtooth']], 0.08); }
  boop()    { this._tone(260, 0.1, 'triangle', 0.1); }
  tone(f)   { this._tone(f, 0.18, 'sine', 0.12); }

  startMusic() {
    if (this.musicTimer) return;
    try {
      const c = this._ensure();
      this.musicGain = c.createGain();
      this.musicGain.gain.value = 0.06;
      this.musicGain.connect(this.master);
      const melody = [262, 330, 392, 330, 294, 349, 392, 440];
      const bass = [131, 0, 165, 0, 147, 0, 175, 0];
      const loop = () => {
        let t = c.currentTime;
        melody.forEach((f, i) => {
          if (f) this._voice(f, t, 0.42, 'triangle', 0.8);
          if (bass[i]) this._voice(bass[i], t, 0.42, 'sine', 0.6);
          t += 0.34;
        });
        this.musicTimer = setTimeout(loop, melody.length * 340);
      };
      loop();
    } catch {}
  }

  _voice(freq, t, dur, type, vol) {
    const c = this.ctx;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  stopMusic() {
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }
}

export const AudioManager = new Audio();
