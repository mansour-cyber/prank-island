/* ============================================================
   SaveManager — localStorage persistence
   Backwards compatible with the legacy 'prankIsland_v1' key so
   existing players keep their progress after the upgrade.
   ============================================================ */
import { TOTAL_LEVELS } from '../config.js';

const KEY = 'prankIsland_v1';

function defaults() {
  return { stars: [], unlocked: 1, soundOn: true };
}

class Save {
  constructor() { this.data = this.load(); }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const d = JSON.parse(raw);
      if (!Array.isArray(d.stars)) d.stars = [];
      if (typeof d.unlocked !== 'number' || d.unlocked < 1) d.unlocked = 1;
      if (typeof d.soundOn !== 'boolean') d.soundOn = true;
      return d;
    } catch { return defaults(); }
  }

  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {}
  }

  totalStars() { return this.data.stars.length; }
  hasCompleted(idx) { return this.data.stars.includes(idx); }
  isUnlocked(levelNum) { return levelNum <= this.data.unlocked; }

  completeLevel(idx) {
    if (!this.data.stars.includes(idx)) this.data.stars.push(idx);
    const next = idx + 2; // idx 0-based, unlocked 1-based
    if (next > this.data.unlocked) this.data.unlocked = next;
    if (this.data.unlocked > TOTAL_LEVELS) this.data.unlocked = TOTAL_LEVELS;
    this.write();
  }

  setSound(on) { this.data.soundOn = on; this.write(); }

  reset() { this.data = defaults(); this.write(); }
}

export const SaveManager = new Save();
