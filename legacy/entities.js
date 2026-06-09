/* ============================================
   ENTITIES - Reusable game objects
   ============================================ */
window.G = window.G || {};

G.ent = (() => {

  /* --- Helper: draw rounded rect --- */
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  /* --- AABB collision --- */
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function pointIn(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  /* --- Platform --- */
  class Platform {
    constructor(x, y, w, h, color = '#8d6e63') {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.color = color;
    }
    draw(ctx) {
      roundRect(ctx, this.x, this.y, this.w, this.h, 6, this.color, '#5d4037');
      // Grass top
      ctx.fillStyle = '#66bb6a';
      roundRect(ctx, this.x, this.y, this.w, 6, 3, '#66bb6a');
    }
  }

  /* --- Collectible Item --- */
  class Item {
    constructor(x, y, w, h, emoji, type = 'item') {
      this.x = x; this.y = y; this.w = w || 28; this.h = h || 28;
      this.emoji = emoji || '⭐';
      this.type = type;
      this.collected = false;
      this.bobPhase = Math.random() * Math.PI * 2;
      this.vx = 0; this.vy = 0;
    }
    update(dt) {
      this.bobPhase += dt * 3;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    draw(ctx) {
      if (this.collected) return;
      const bob = Math.sin(this.bobPhase) * 3;
      ctx.font = `${this.w}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, this.x + this.w / 2, this.y + this.h / 2 + bob);
    }
  }

  /* --- Moving Obstacle --- */
  class Obstacle {
    constructor(x, y, w, h, emoji, vx = 0, vy = 0) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.emoji = emoji || '💥';
      this.vx = vx; this.vy = vy;
      this.startX = x; this.startY = y;
      this.active = true;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    draw(ctx) {
      if (!this.active) return;
      ctx.font = `${Math.max(this.w, this.h)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, this.x + this.w / 2, this.y + this.h / 2);
    }
  }

  /* --- NPC --- */
  class NPC {
    constructor(x, y, w, h, emoji, name = '') {
      this.x = x; this.y = y; this.w = w || 36; this.h = h || 36;
      this.emoji = emoji || '🐔';
      this.name = name;
      this.vx = 0; this.vy = 0;
      this.active = true;
      this.phase = 0;
    }
    update(dt) {
      this.phase += dt * 2;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    draw(ctx) {
      if (!this.active) return;
      const bob = Math.sin(this.phase) * 2;
      ctx.font = `${this.w}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, this.x + this.w / 2, this.y + this.h / 2 + bob);
    }
  }

  /* --- Goal zone --- */
  class Goal {
    constructor(x, y, w, h, emoji = '🚪') {
      this.x = x; this.y = y; this.w = w || 40; this.h = h || 50;
      this.emoji = emoji;
      this.phase = 0;
    }
    update(dt) { this.phase += dt * 2; }
    draw(ctx) {
      const glow = Math.sin(this.phase) * 0.3 + 0.7;
      ctx.globalAlpha = glow;
      ctx.font = `${this.h}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, this.x + this.w / 2, this.y + this.h / 2);
      ctx.globalAlpha = 1;
    }
  }

  /* --- Clickable Button/Option --- */
  class ClickOption {
    constructor(x, y, w, h, label, emoji, correct = false) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.label = label;
      this.emoji = emoji || '';
      this.correct = correct;
      this.clicked = false;
      this.hover = false;
      this.feedback = 0; // >0 means showing feedback
      this.feedbackCorrect = false;
    }
    checkClick(mx, my) {
      return pointIn(mx, my, this);
    }
    draw(ctx) {
      let bg = this.hover ? '#e3f2fd' : '#fff';
      let border = '#90caf9';
      if (this.feedback > 0) {
        bg = this.feedbackCorrect ? '#c8e6c9' : '#ffcdd2';
        border = this.feedbackCorrect ? '#4caf50' : '#ef5350';
      }
      roundRect(ctx, this.x, this.y, this.w, this.h, 12, bg, border);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = this.emoji ? this.emoji + ' ' + this.label : this.label;
      ctx.fillText(text, this.x + this.w / 2, this.y + this.h / 2);
    }
  }

  /* --- Particle effects --- */
  class Particles {
    constructor() { this.particles = []; }
    emit(x, y, count, color, speed = 100) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.5 + Math.random());
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0.5 + Math.random() * 0.5,
          color: color || `hsl(${Math.random() * 360}, 80%, 60%)`,
          size: 3 + Math.random() * 4
        });
      }
    }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    draw(ctx) {
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    clear() { this.particles = []; }
  }

  return { Platform, Item, Obstacle, NPC, Goal, ClickOption, Particles, roundRect, overlap, pointIn };
})();
