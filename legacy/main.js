/* ============================================
   MAIN - Game boot and loop
   ============================================ */
window.G = window.G || {};

(function boot() {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = 800, H = 500;

  // Initialize systems
  G.input.init(canvas);
  G.ui.init();

  // Responsive canvas sizing
  function resize() {
    const maxW = window.innerWidth - 20;
    const maxH = window.innerHeight - 20;
    const scale = Math.min(maxW / W, maxH / H, 1.5);
    canvas.style.width = (W * scale) + 'px';
    canvas.style.height = (H * scale) + 'px';
    // Match UI layer size
    const uiLayer = document.getElementById('ui-layer');
    uiLayer.style.width = (W * scale) + 'px';
    uiLayer.style.height = (H * scale) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Menu background animation
  let menuPhase = 0;
  function drawMenuBg() {
    menuPhase += 0.01;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#e8f5e9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Floating emojis
    const emojis = ['🏝️', '🌴', '😂', '🎉', '⭐', '🐔', '🎈'];
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i < emojis.length; i++) {
      const x = 100 + i * 100;
      const y = 200 + Math.sin(menuPhase + i * 0.8) * 40;
      ctx.globalAlpha = 0.4;
      ctx.fillText(emojis[i], x, y);
    }
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, 440, W, 60);
    ctx.fillStyle = '#66bb6a';
    ctx.fillRect(0, 440, W, 6);
  }

  // Game loop
  let lastTime = 0;
  const MAX_DT = 0.05; // Cap delta time to prevent physics explosions

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;

    // Clear
    ctx.clearRect(0, 0, W, H);

    const screen = G.ui.currentScreen;
    const lmState = G.levelManager.state;

    if (lmState !== 'none') {
      // Level is active - update and draw
      G.levelManager.update(dt);
      G.levelManager.draw(ctx);
    } else {
      // Menu / level select background
      drawMenuBg();
    }

    // Clear input state at end of frame
    G.input.endFrame();

    requestAnimationFrame(gameLoop);
  }

  // Start the loop
  requestAnimationFrame(ts => {
    lastTime = ts;
    requestAnimationFrame(gameLoop);
  });

  // First interaction to unlock audio
  document.addEventListener('click', () => {
    if (!G.audio.muted) {
      try {
        const c = new (window.AudioContext || window.webkitAudioContext)();
        if (c.state === 'suspended') c.resume();
      } catch (e) {}
    }
  }, { once: true });

})();
