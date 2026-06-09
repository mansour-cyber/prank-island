/* ============================================
   INPUT SYSTEM - Keyboard + Mouse/Touch
   ============================================ */
window.G = window.G || {};

G.input = (() => {
  const keys = {};
  const justPressed = {};
  let mouseX = 0, mouseY = 0;
  let mouseDown = false;
  let mouseClicked = false;
  let canvas = null;

  function onKeyDown(e) {
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
    // Prevent scrolling for game keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function getCanvasPos(clientX, clientY) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 500 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function onMouseMove(e) {
    const p = getCanvasPos(e.clientX, e.clientY);
    mouseX = p.x; mouseY = p.y;
  }

  function onMouseDown(e) {
    mouseDown = true;
    mouseClicked = true;
    const p = getCanvasPos(e.clientX, e.clientY);
    mouseX = p.x; mouseY = p.y;
  }

  function onMouseUp() { mouseDown = false; }

  function onTouchStart(e) {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      const p = getCanvasPos(t.clientX, t.clientY);
      mouseX = p.x; mouseY = p.y;
      mouseDown = true;
      mouseClicked = true;
    }
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      const p = getCanvasPos(t.clientX, t.clientY);
      mouseX = p.x; mouseY = p.y;
    }
  }

  function onTouchEnd() { mouseDown = false; }

  return {
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get mouseDown() { return mouseDown; },

    init(cvs) {
      canvas = cvs;
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('touchstart', onTouchStart, { passive: true });
      canvas.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
    },

    isDown(code) { return !!keys[code]; },

    left() { return keys['ArrowLeft'] || keys['KeyA']; },
    right() { return keys['ArrowRight'] || keys['KeyD']; },
    up() { return keys['ArrowUp'] || keys['KeyW']; },
    down() { return keys['ArrowDown'] || keys['KeyS']; },
    jump() { return justPressed['Space'] || justPressed['ArrowUp'] || justPressed['KeyW']; },
    action() { return justPressed['KeyE'] || justPressed['Enter'] || mouseClicked; },

    /* Call at end of each frame */
    endFrame() {
      Object.keys(justPressed).forEach(k => delete justPressed[k]);
      mouseClicked = false;
    }
  };
})();
