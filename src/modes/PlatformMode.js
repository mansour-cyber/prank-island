/* ============================================================
   PlatformMode — movement-based levels: 'platform', 'collect',
   'chase'. Player + platforms use Arcade physics; items,
   obstacles, NPCs and goals use lightweight manual motion +
   rectangle overlap (matches the original game's feel).
   ============================================================ */
import { WIDTH, HEIGHT, COLORS } from '../config.js';
import { Player } from '../objects/Player.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class PlatformMode {
  constructor(scene) {
    this.scene = scene;
    this.cfg = scene.level.config;
    this.type = scene.level.type;
    this.collectTarget = this.cfg.collectTarget || 0;
    this.collectCount = 0;
    this.items = [];
    this.obstacles = [];
    this.goal = null;
    this.npc = null;
  }

  create() {
    const s = this.scene, cfg = this.cfg;
    const gy = s.groundY;

    // platforms
    this.platforms = s.physics.add.staticGroup();
    if (!cfg.noGround) this.addPlatform(0, gy, WIDTH, HEIGHT - gy, 'ground');
    (cfg.platforms || []).forEach(([x, y, w, h]) => this.addPlatform(x, y, w, h, 'platform'));

    // decor (non-interactive)
    (cfg.decor || []).forEach((d) => s.add.image(d.x, d.y, 'atlas', d.frame).setDepth(-10));

    // player
    this.player = new Player(s, cfg.startX ?? 60, cfg.startY ?? 390);
    this.player.setGravityMode(this.type === 'collect' ? (cfg.useGravity !== false) : true);
    s.physics.add.collider(this.player, this.platforms);

    // items
    (cfg.items || []).forEach((it) => {
      const img = s.add.image(it.x, it.y, 'atlas', it.frame).setDisplaySize(it.w, it.h);
      img._d = { ...it, baseY: it.y, ph: Math.random() * 6.28, collected: false, vx: it.vx || 0, vy: it.vy || 0 };
      this.items.push(img);
    });

    // obstacles
    (cfg.obstacles || []).forEach((o) => {
      const img = s.add.image(o.x, o.y, 'atlas', o.frame).setDisplaySize(o.w, o.h);
      img._d = { vx: o.vx || 0, vy: o.vy || 0, w: o.w, h: o.h };
      this.obstacles.push(img);
    });

    // goal
    if (cfg.goal) {
      const g = cfg.goal;
      this.goal = s.add.image(g.x, g.y, 'atlas', g.frame).setDisplaySize(g.w, g.h);
      this.goal._d = { w: g.w, h: g.h };
      s.tweens.add({ targets: this.goal, alpha: 0.65, duration: 700, yoyo: true, repeat: -1 });
    }

    // npc (chase levels)
    if (cfg.npc) {
      const n = cfg.npc;
      this.npc = s.add.image(n.x, n.y, 'atlas', n.frame).setDisplaySize(n.w, n.h);
      this.npc._d = { w: n.w, h: n.h, speed: n.speed || 130, vx: 0, vy: 0 };
      s.tweens.add({ targets: this.npc, y: n.y - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.chasing = !!cfg.chasing;
    this.safeZone = cfg.safeZone || null;
    if (this.safeZone) this.drawSafeZone();
  }

  addPlatform(x, y, w, h, frame) {
    const ts = this.scene.add.tileSprite(x, y, w, h, 'atlas', frame).setOrigin(0, 0);
    this.scene.physics.add.existing(ts, true);
    ts.body.updateFromGameObject();
    this.platforms.add(ts);
    return ts;
  }

  drawSafeZone() {
    const z = this.safeZone, g = this.scene.add.graphics().setDepth(-5);
    g.fillStyle(0x66bb6a, 0.25).fillRoundedRect(z.x, z.y, z.w, z.h, 10);
    g.lineStyle(3, 0x4caf50, 1).strokeRoundedRect(z.x, z.y, z.w, z.h, 10);
  }

  playerRect() {
    const b = this.player.body;
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }

  update(dt) {
    const s = this.scene;
    this.player.drive(s.controls);
    if (this.player.hasFallen()) { s.fail('وقعت!'); return; }

    const pr = this.playerRect();

    // items
    for (const it of this.items) {
      const d = it._d;
      if (d.collected) continue;
      d.ph += dt * 3;
      if (d.vx) { it.x += d.vx * dt; if (it.x < 16 || it.x > WIDTH - 16) d.vx *= -1; }
      d.baseY += d.vy * dt;
      it.y = d.baseY + Math.sin(d.ph) * 3;
      const ir = { x: it.x - it.displayWidth / 2, y: it.y - it.displayHeight / 2, w: it.displayWidth, h: it.displayHeight };
      if (rectsOverlap(pr, ir)) {
        d.collected = true; it.setVisible(false);
        this.collectCount++;
        s.collect(it.x, it.y);
        this.checkWin();
      }
    }

    // obstacles
    for (const o of this.obstacles) {
      const d = o._d;
      o.x += d.vx * dt; o.y += d.vy * dt;
      if (o.x < 12 || o.x > WIDTH - 12) d.vx *= -1;
      if (o.y < 12 || o.y > HEIGHT - 12) d.vy *= -1;
      const orr = { x: o.x - o.displayWidth / 2, y: o.y - o.displayHeight / 2, w: o.displayWidth, h: o.displayHeight };
      if (rectsOverlap(pr, orr)) { s.fail('أوه!'); return; }
    }

    // chase / npc
    if (this.npc) { this.updateNpc(dt, pr); if (s.state !== 'playing') return; }

    // goal
    if (this.goal && this.canReachGoal()) {
      const gr = { x: this.goal.x - this.goal.displayWidth / 2, y: this.goal.y - this.goal.displayHeight / 2, w: this.goal.displayWidth, h: this.goal.displayHeight };
      if (rectsOverlap(pr, gr)) s.win();
    }

    // safe-zone win (chasing levels)
    if (this.safeZone && this.chasing) {
      const z = this.safeZone;
      if (pr.x + pr.w / 2 > z.x && pr.x + pr.w / 2 < z.x + z.w && pr.y + pr.h / 2 > z.y && pr.y + pr.h / 2 < z.y + z.h) s.win();
    }
  }

  canReachGoal() { return this.collectTarget === 0 || this.collectCount >= this.collectTarget; }

  checkWin() {
    this.scene.updateCounter();
    if (!this.goal && this.collectTarget > 0 && this.collectCount >= this.collectTarget) this.scene.win();
  }

  updateNpc(dt, pr) {
    const s = this.scene, d = this.npc._d;
    const px = pr.x + pr.w / 2, py = pr.y + pr.h / 2;
    const nx = this.npc.x, ny = this.npc.y;

    if (this.chasing) {
      const dx = px - nx, dy = py - ny, dist = Math.hypot(dx, dy);
      if (dist > 5) { this.npc.x += (dx / dist) * d.speed * dt; this.npc.y += (dy / dist) * d.speed * dt; }
      if (rectsOverlap(pr, this.npcRect())) { s.fail('أمسكوك!'); return; }
    } else {
      // npc flees from player
      const dx = nx - px, dy = ny - py, dist = Math.hypot(dx, dy);
      if (dist < 200 && dist > 5) { d.vx = (dx / dist) * d.speed; }
      else d.vx *= 0.94;
      this.npc.x += d.vx * dt;
      this.npc.x = Phaser.Math.Clamp(this.npc.x, 30, WIDTH - 30);
      this.npc.y = (s.groundY - d.h / 2) - 4;
      if (rectsOverlap(pr, this.npcRect())) {
        s.audio.funny();
        this.collectCount++;
        s.burst(this.npc.x, this.npc.y, 10, 'sparkle');
        if (this.collectCount >= this.collectTarget) { s.win(); }
        else { this.npc.x = Phaser.Math.Between(60, WIDTH - 60); s.updateCounter(); }
      }
    }
  }

  npcRect() {
    return { x: this.npc.x - this.npc.displayWidth / 2, y: this.npc.y - this.npc.displayHeight / 2, w: this.npc.displayWidth, h: this.npc.displayHeight };
  }

  onEnd() { /* stop any per-level loops if added later */ }
}
