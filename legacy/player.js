/* ============================================
   PLAYER - Main character controller
   ============================================ */
window.G = window.G || {};

G.Player = class Player {
  constructor(x, y) {
    this.x = x || 100;
    this.y = y || 350;
    this.w = 30;
    this.h = 36;
    this.vx = 0;
    this.vy = 0;
    this.speed = 220;
    this.jumpForce = -360;
    this.gravity = 900;
    this.onGround = false;
    this.facingRight = true;
    this.state = 'idle'; // idle, run, jump, celebrate, fail
    this.animPhase = 0;
    this.color = '#ff7043';
    this.hatColor = '#42a5f5';
    this.useGravity = true;
    this.frozen = false;
    this.visible = true;
  }

  update(dt, platforms, bounds) {
    if (this.frozen) return;
    this.animPhase += dt * 8;

    const inp = G.input;

    // Horizontal movement
    this.vx = 0;
    if (inp.left()) { this.vx = -this.speed; this.facingRight = false; }
    if (inp.right()) { this.vx = this.speed; this.facingRight = true; }

    // Gravity
    if (this.useGravity) {
      this.vy += this.gravity * dt;
      // Jump
      if (inp.jump() && this.onGround) {
        this.vy = this.jumpForce;
        this.onGround = false;
        G.audio.jump();
      }
    } else {
      // Free movement (no gravity)
      this.vy = 0;
      if (inp.up()) this.vy = -this.speed;
      if (inp.down()) this.vy = this.speed;
    }

    // Apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Platform collision
    this.onGround = false;
    if (platforms && this.useGravity) {
      for (const p of platforms) {
        if (G.ent.overlap(this, p)) {
          // Landing on top
          if (this.vy > 0 && this.y + this.h - this.vy * dt <= p.y + 4) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.onGround = true;
          }
          // Hitting bottom
          else if (this.vy < 0 && this.y - this.vy * dt >= p.y + p.h - 4) {
            this.y = p.y + p.h;
            this.vy = 0;
          }
          // Side collision
          else if (this.vx > 0) {
            this.x = p.x - this.w;
          } else if (this.vx < 0) {
            this.x = p.x + p.w;
          }
        }
      }
    }

    // Bounds
    const b = bounds || { x: 0, y: 0, w: 800, h: 500 };
    if (this.x < b.x) this.x = b.x;
    if (this.x + this.w > b.x + b.w) this.x = b.x + b.w - this.w;
    if (this.y < b.y) this.y = b.y;

    // Fall into pit detection
    if (this.useGravity && this.y > b.y + b.h + 50) {
      return 'fell';
    }

    // State
    if (!this.onGround && this.useGravity) this.state = 'jump';
    else if (Math.abs(this.vx) > 10) this.state = 'run';
    else this.state = 'idle';

    return null;
  }

  draw(ctx) {
    if (!this.visible) return;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dir = this.facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(dir, 1);

    // Body bounce
    const bounce = this.state === 'run' ? Math.sin(this.animPhase) * 2 : 0;
    const squish = this.state === 'jump' ? 0.9 : 1;

    ctx.translate(0, bounce);
    ctx.scale(1, squish);

    // Body
    G.ent.roundRect(ctx, -this.w / 2, -this.h / 2 + 4, this.w, this.h - 4, 8, this.color, '#d84315');

    // Hat
    ctx.fillStyle = this.hatColor;
    G.ent.roundRect(ctx, -this.w / 2 - 2, -this.h / 2 - 6, this.w + 4, 14, 6, this.hatColor, '#1565c0');

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(4, -4, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-6, -4, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(5, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-5, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.state === 'celebrate') {
      ctx.arc(0, 4, 6, 0, Math.PI);
    } else if (this.state === 'fail') {
      ctx.arc(0, 10, 5, Math.PI, 0);
    } else {
      ctx.arc(0, 4, 5, 0.1, Math.PI - 0.1);
    }
    ctx.stroke();

    // Legs
    const legPhase = this.state === 'run' ? Math.sin(this.animPhase) * 5 : 0;
    ctx.fillStyle = '#5d4037';
    G.ent.roundRect(ctx, -8, this.h / 2 - 4, 7, 8 + legPhase, 3, '#5d4037');
    G.ent.roundRect(ctx, 2, this.h / 2 - 4, 7, 8 - legPhase, 3, '#5d4037');

    ctx.restore();
  }

  reset(x, y) {
    this.x = x || 100;
    this.y = y || 350;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.frozen = false;
    this.visible = true;
    this.state = 'idle';
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
};
