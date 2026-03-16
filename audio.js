/* ============================================
   AUDIO SYSTEM - Procedural Sound Effects
   ============================================ */
window.G = window.G || {};

G.audio = (() => {
  let ctx = null;
  let muted = false;
  let bgMusic = null;
  let bgGain = null;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playTone(freq, duration, type = 'square', vol = 0.15, ramp = true) {
    if (muted) return;
    try {
      const c = ensureCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(vol, c.currentTime);
      if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (e) { /* silent fail */ }
  }

  function playNotes(notes, interval = 0.12) {
    if (muted) return;
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n[0], n[1] || 0.15, n[2] || 'square', n[3] || 0.12), i * interval * 1000);
    });
  }

  return {
    get muted() { return muted; },

    setMuted(v) {
      muted = v;
      if (bgGain && ctx) bgGain.gain.setValueAtTime(v ? 0 : 0.04, ctx.currentTime);
    },

    toggleMute() {
      this.setMuted(!muted);
      return muted;
    },

    click() { playTone(800, 0.06, 'square', 0.08); },

    jump() { playTone(400, 0.12, 'square', 0.1); setTimeout(() => playTone(600, 0.1, 'square', 0.08), 50); },

    collect() { playNotes([[880, 0.08], [1100, 0.08], [1320, 0.12]], 0.06); },

    win() { playNotes([[523, 0.15], [659, 0.15], [784, 0.15], [1047, 0.3]], 0.15); },

    fail() { playNotes([[400, 0.2, 'sawtooth'], [300, 0.2, 'sawtooth'], [200, 0.4, 'sawtooth']], 0.18); },

    funny() { playNotes([[300, 0.08, 'triangle'], [500, 0.08, 'triangle'], [200, 0.15, 'sawtooth']], 0.08); },

    boop() { playTone(250, 0.1, 'triangle', 0.1); },

    startBgMusic() {
      if (bgMusic) return;
      try {
        const c = ensureCtx();
        bgGain = c.createGain();
        bgGain.gain.setValueAtTime(muted ? 0 : 0.04, c.currentTime);
        bgGain.connect(c.destination);

        // Simple looping melody using oscillators
        const playBgLoop = () => {
          const melody = [262, 330, 392, 330, 262, 294, 330, 294];
          let t = c.currentTime;
          melody.forEach(freq => {
            const osc = c.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            const noteGain = c.createGain();
            noteGain.gain.setValueAtTime(1, t);
            noteGain.gain.exponentialRampToValueAtTime(0.3, t + 0.4);
            osc.connect(noteGain);
            noteGain.connect(bgGain);
            osc.start(t);
            osc.stop(t + 0.45);
            t += 0.5;
          });
          bgMusic = setTimeout(playBgLoop, melody.length * 500);
        };
        playBgLoop();
      } catch (e) { /* silent fail */ }
    },

    stopBgMusic() {
      if (bgMusic) { clearTimeout(bgMusic); bgMusic = null; }
    },

    stopAll() {
      this.stopBgMusic();
    }
  };
})();
