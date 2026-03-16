/* ============================================
   SAVE SYSTEM - LocalStorage persistence
   ============================================ */
window.G = window.G || {};

G.save = (() => {
  const KEY = 'prankIsland_v1';

  function defaultData() {
    return {
      stars: [],        // array of completed level indices (0-29)
      unlocked: 1,      // highest unlocked level number (1-based)
      soundOn: true
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      const d = JSON.parse(raw);
      // Validate
      if (!Array.isArray(d.stars)) d.stars = [];
      if (typeof d.unlocked !== 'number' || d.unlocked < 1) d.unlocked = 1;
      if (typeof d.soundOn !== 'boolean') d.soundOn = true;
      return d;
    } catch (e) {
      return defaultData();
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* storage full or blocked */ }
  }

  let data = load();

  return {
    get data() { return data; },

    totalStars() { return data.stars.length; },

    hasCompleted(levelIdx) { return data.stars.includes(levelIdx); },

    isUnlocked(levelNum) { return levelNum <= data.unlocked; },

    completeLevel(levelIdx) {
      if (!data.stars.includes(levelIdx)) {
        data.stars.push(levelIdx);
      }
      const nextLevel = levelIdx + 2; // levelIdx is 0-based, unlocked is 1-based
      if (nextLevel > data.unlocked) data.unlocked = nextLevel;
      // Cap at 30
      if (data.unlocked > 30) data.unlocked = 30;
      write(data);
    },

    setSoundPref(on) {
      data.soundOn = on;
      write(data);
    },

    reset() {
      data = defaultData();
      write(data);
    },

    reload() {
      data = load();
    }
  };
})();
