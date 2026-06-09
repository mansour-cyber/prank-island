/* ============================================
   UI SYSTEM - Screen and HUD management
   ============================================ */
window.G = window.G || {};

G.ui = (() => {
  const screens = {};
  let currentScreen = 'menu';
  let selectedZone = 0;

  function $(id) { return document.getElementById(id); }

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
    currentScreen = name;
  }

  function updateStarsDisplay() {
    $('menu-stars').textContent = `⭐ ${G.save.totalStars()} / 30`;
  }

  function updateSoundBtn() {
    $('btn-sound').textContent = G.audio.muted ? '🔇 الصوت' : '🔊 الصوت';
  }

  function buildLevelGrid(zone) {
    selectedZone = zone;
    const grid = $('level-grid');
    grid.innerHTML = '';
    const start = zone * 5;

    // Zone tabs
    const tabs = $('zone-tabs');
    tabs.innerHTML = '';
    G.levels.ZONES.forEach((z, i) => {
      const btn = document.createElement('button');
      btn.className = 'zone-tab' + (i === zone ? ' active' : '');
      btn.textContent = `${z.emoji} ${z.name}`;
      btn.onclick = () => { G.audio.click(); buildLevelGrid(i); };
      tabs.appendChild(btn);
    });

    for (let i = 0; i < 5; i++) {
      const lvlIdx = start + i;
      const lvl = G.levels.LEVELS[lvlIdx];
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      const num = lvlIdx + 1;
      const unlocked = G.save.isUnlocked(num);
      const completed = G.save.hasCompleted(lvlIdx);

      if (completed) btn.classList.add('completed');
      else if (!unlocked) btn.classList.add('locked');

      btn.innerHTML = `<span>${lvl.emoji}</span><span>${num}</span>`;
      btn.onclick = () => {
        if (!unlocked) return;
        G.audio.click();
        G.levelManager.loadLevel(lvlIdx);
      };
      grid.appendChild(btn);
    }
  }

  return {
    init() {
      screens.menu = $('menu-screen');
      screens.select = $('select-screen');
      screens.hud = $('hud');
      screens.pause = $('pause-screen');
      screens.win = $('win-screen');
      screens.fail = $('fail-screen');
      screens.intro = $('intro-screen');

      updateStarsDisplay();
      G.audio.setMuted(!G.save.data.soundOn);
      updateSoundBtn();
      showScreen('menu');
    },

    showMenu() {
      G.audio.click();
      G.levelManager.unloadLevel();
      G.audio.stopBgMusic();
      updateStarsDisplay();
      showScreen('menu');
    },

    play() {
      G.audio.click();
      // Start from last unlocked level or first
      const lvlIdx = Math.min(G.save.data.unlocked - 1, 29);
      G.levelManager.loadLevel(lvlIdx);
    },

    showLevelSelect() {
      G.audio.click();
      buildLevelGrid(selectedZone);
      showScreen('select');
    },

    toggleSound() {
      const muted = G.audio.toggleMute();
      G.save.setSoundPref(!muted);
      updateSoundBtn();
    },

    resetProgress() {
      if (confirm('هل أنت متأكد؟ سيتم حذف كل التقدم!')) {
        G.save.reset();
        updateStarsDisplay();
        G.audio.click();
      }
    },

    showIntro(levelIdx) {
      const lvl = G.levels.LEVELS[levelIdx];
      const zoneIdx = Math.floor(levelIdx / 5);
      const zone = G.levels.ZONES[zoneIdx];
      $('intro-title').textContent = `${lvl.emoji} ${lvl.title}`;
      $('intro-text').textContent = lvl.objective;
      showScreen('intro');
      // Also show HUD behind
      screens.hud.classList.add('active');
    },

    startLevel() {
      G.audio.click();
      G.audio.startBgMusic();
      showScreen('hud');
      screens.hud.classList.add('active');
      G.levelManager.startPlaying();
    },

    showHUD(levelIdx) {
      const lvl = G.levels.LEVELS[levelIdx];
      const num = levelIdx + 1;
      $('hud-level').textContent = `المرحلة ${num}`;
      $('hud-objective').textContent = lvl.objective;
      $('hud-stars').textContent = `⭐ ${G.save.totalStars()}`;
    },

    setTimer(ratio) {
      const timerEl = $('hud-timer');
      const bar = $('timer-bar');
      if (ratio > 0) {
        timerEl.style.display = 'block';
        bar.style.width = (ratio * 100) + '%';
      } else {
        timerEl.style.display = 'none';
      }
    },

    pause() {
      G.audio.click();
      G.levelManager.pause();
      showScreen('pause');
      screens.hud.classList.add('active');
    },

    resume() {
      G.audio.click();
      G.levelManager.resume();
      showScreen('hud');
      screens.hud.classList.add('active');
    },

    retry() {
      G.audio.click();
      G.levelManager.retryLevel();
    },

    nextLevel() {
      G.audio.click();
      G.levelManager.goNextLevel();
    },

    showWin(msg) {
      $('win-title').textContent = '🎉 أحسنت!';
      $('win-msg').textContent = msg || 'حصلت على نجمة الضحك!';
      showScreen('win');
    },

    showFail(msg) {
      $('fail-title').textContent = '😅 حاول مرة ثانية!';
      $('fail-msg').textContent = msg || '';
      showScreen('fail');
    },

    get currentScreen() { return currentScreen; }
  };
})();
