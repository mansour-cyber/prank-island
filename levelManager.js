/* ============================================
   LEVEL MANAGER - Level lifecycle management
   ============================================ */
window.G = window.G || {};

G.levelManager = (() => {
  let currentLevel = null;  // template instance
  let currentIdx = -1;
  let state = 'none'; // none, intro, playing, paused, won, failed

  function cleanupCurrent() {
    if (currentLevel) {
      currentLevel.cleanup();
      currentLevel = null;
    }
    state = 'none';
    G.ui.setTimer(-1);
  }

  return {
    get state() { return state; },
    get currentIdx() { return currentIdx; },
    get level() { return currentLevel; },

    loadLevel(idx) {
      cleanupCurrent();
      currentIdx = idx;
      const lvlDef = G.levels.LEVELS[idx];
      if (!lvlDef) return;

      currentLevel = lvlDef.create();
      currentLevel.init();
      state = 'intro';
      G.ui.showHUD(idx);
      G.ui.showIntro(idx);
    },

    startPlaying() {
      state = 'playing';
    },

    unloadLevel() {
      cleanupCurrent();
      currentIdx = -1;
    },

    pause() {
      if (state === 'playing') state = 'paused';
    },

    resume() {
      if (state === 'paused') state = 'playing';
    },

    retryLevel() {
      if (currentIdx >= 0) this.loadLevel(currentIdx);
    },

    goNextLevel() {
      const next = currentIdx + 1;
      if (next < 30) {
        this.loadLevel(next);
      } else {
        G.ui.showMenu();
      }
    },

    win() {
      if (state !== 'playing') return;
      state = 'won';
      G.save.completeLevel(currentIdx);
      G.audio.stopBgMusic();
      G.ui.showWin();
    },

    fail(msg) {
      if (state !== 'playing') return;
      state = 'failed';
      G.audio.stopBgMusic();
      G.ui.showFail(msg);
    },

    update(dt) {
      if (state === 'playing' && currentLevel) {
        currentLevel.update(dt);
      }
    },

    draw(ctx) {
      if (currentLevel && (state === 'playing' || state === 'paused' || state === 'won' || state === 'failed' || state === 'intro')) {
        currentLevel.draw(ctx);
      }
    }
  };
})();
