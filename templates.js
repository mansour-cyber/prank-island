/* ============================================
   LEVEL TEMPLATES - Reusable level mechanics
   ============================================ */
window.G = window.G || {};

G.templates = (() => {
  const W = 800, H = 500;

  /* ========================================
     ZONE THEMES - colors per zone
     ======================================== */
  const ZONE_THEMES = [
    { bg1: '#87ceeb', bg2: '#e8f5e9', ground: '#8d6e63', accent: '#ff9800' }, // Village
    { bg1: '#2e7d32', bg2: '#1b5e20', ground: '#5d4037', accent: '#e040fb' }, // Forest
    { bg1: '#546e7a', bg2: '#37474f', ground: '#78909c', accent: '#00e5ff' }, // Robot City
    { bg1: '#ff8a65', bg2: '#ffcc02', ground: '#6d4c41', accent: '#f44336' }, // Food Fest
    { bg1: '#7e57c2', bg2: '#4a148c', ground: '#9e9e9e', accent: '#fdd835' }, // Castle
    { bg1: '#e91e63', bg2: '#880e4f', ground: '#616161', accent: '#76ff03' }, // Final
  ];

  function getTheme(levelIdx) {
    return ZONE_THEMES[Math.floor(levelIdx / 5)] || ZONE_THEMES[0];
  }

  function drawBg(ctx, theme) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.bg1);
    grad.addColorStop(1, theme.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGround(ctx, theme, groundY = 440) {
    ctx.fillStyle = theme.ground;
    G.ent.roundRect(ctx, 0, groundY, W, H - groundY, 0, theme.ground);
    ctx.fillStyle = '#66bb6a';
    ctx.fillRect(0, groundY, W, 5);
  }

  /* ========================================
     BASE TEMPLATE
     ======================================== */
  class BaseLevel {
    constructor(cfg) {
      this.cfg = cfg;
      this.theme = getTheme(cfg.index || 0);
      this.particles = new G.ent.Particles();
      this.timer = cfg.timer || 0;
      this.timeLeft = this.timer;
      this.won = false;
      this.lost = false;
      this.resultDelay = 0;
    }
    init() { /* override */ }
    update(dt) {
      this.particles.update(dt);
      if (this.timer > 0 && !this.won && !this.lost) {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.lose(); }
        G.ui.setTimer(this.timeLeft / this.timer);
      }
      if (this.resultDelay > 0) {
        this.resultDelay -= dt;
        if (this.resultDelay <= 0) {
          if (this.won) G.levelManager.win();
          else G.levelManager.fail(this.failMsg);
        }
      }
    }
    draw(ctx) {
      drawBg(ctx, this.theme);
      this.particles.draw(ctx);
    }
    win() {
      if (this.won || this.lost) return;
      this.won = true;
      this.resultDelay = 0.6;
      G.audio.win();
      this.particles.emit(400, 250, 30, '#fdd835', 150);
    }
    lose(msg) {
      if (this.won || this.lost) return;
      this.lost = true;
      this.resultDelay = 0.5;
      this.failMsg = msg || '';
      G.audio.fail();
    }
    cleanup() {
      this.particles.clear();
    }
  }

  /* ========================================
     PLATFORM LEVEL - jump & reach goal
     ======================================== */
  class PlatformLevel extends BaseLevel {
    constructor(cfg) {
      super(cfg);
      this.player = new G.Player(cfg.startX || 60, cfg.startY || 390);
      this.platforms = [];
      this.items = [];
      this.obstacles = [];
      this.goal = null;
      this.groundY = cfg.groundY || 440;
      this.collectCount = 0;
      this.collectTarget = cfg.collectTarget || 0;
    }
    init() {
      // Ground platform (skip if noGround)
      if (!this.cfg.noGround) {
        this.platforms.push(new G.ent.Platform(0, this.groundY, W, H - this.groundY));
      }
      // Add configured platforms
      if (this.cfg.platforms) {
        this.cfg.platforms.forEach(p => this.platforms.push(new G.ent.Platform(p[0], p[1], p[2], p[3], p[4])));
      }
      // Items
      if (this.cfg.items) {
        this.cfg.items.forEach(i => {
          const item = new G.ent.Item(i[0], i[1], i[2] || 28, i[3] || 28, i[4] || '⭐');
          if (i[5]) item.vx = i[5];
          if (i[6]) item.vy = i[6];
          this.items.push(item);
        });
      }
      // Obstacles
      if (this.cfg.obstacles) {
        this.cfg.obstacles.forEach(o => this.obstacles.push(new G.ent.Obstacle(o[0], o[1], o[2], o[3], o[4], o[5], o[6])));
      }
      // Goal
      if (this.cfg.goal) {
        this.goal = new G.ent.Goal(this.cfg.goal[0], this.cfg.goal[1], this.cfg.goal[2], this.cfg.goal[3], this.cfg.goal[4]);
      }
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost) return;
      const fell = this.player.update(dt, this.platforms, { x: 0, y: 0, w: W, h: H });
      if (fell === 'fell') { this.lose('وقعت!'); return; }

      // Items
      this.items.forEach(item => {
        item.update(dt);
        // Bounce items off edges
        if (item.vx && (item.x < 0 || item.x + item.w > W)) item.vx *= -1;
        if (item.vy && (item.y < 0 || item.y + item.h > this.groundY)) item.vy *= -1;
        if (!item.collected && G.ent.overlap(this.player, item)) {
          item.collected = true;
          this.collectCount++;
          G.audio.collect();
          this.particles.emit(item.x + 14, item.y + 14, 8, '#fdd835');
        }
      });

      // Obstacles
      this.obstacles.forEach(obs => {
        obs.update(dt);
        if (obs.active && G.ent.overlap(this.player, obs)) {
          this.lose('أوه!');
        }
        // Bounce obstacles within bounds
        if (obs.x < 0 || obs.x + obs.w > W) obs.vx *= -1;
        if (obs.y < 0 || obs.y + obs.h > H) obs.vy *= -1;
      });

      // Goal
      if (this.goal) {
        this.goal.update(dt);
        if (this.collectTarget > 0 && this.collectCount < this.collectTarget) {
          // Need to collect more
        } else if (G.ent.overlap(this.player, this.goal)) {
          this.win();
        }
      }

      // Auto-win if collect target met and no goal
      if (!this.goal && this.collectTarget > 0 && this.collectCount >= this.collectTarget) {
        this.win();
      }
    }
    draw(ctx) {
      super.draw(ctx);
      if (!this.cfg.noGround) {
        drawGround(ctx, this.theme, this.groundY);
        this.platforms.slice(1).forEach(p => p.draw(ctx));
      } else {
        this.platforms.forEach(p => p.draw(ctx));
      }
      this.items.forEach(i => i.draw(ctx));
      this.obstacles.forEach(o => o.draw(ctx));
      if (this.goal) this.goal.draw(ctx);
      this.player.draw(ctx);
      this.particles.draw(ctx);
      // Collect counter
      if (this.collectTarget > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        G.ent.roundRect(ctx, 350, 55, 100, 30, 8, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.collectCount} / ${this.collectTarget}`, 400, 74);
      }
    }
  }

  /* ========================================
     COLLECT LEVEL - free movement, collect items
     ======================================== */
  class CollectLevel extends PlatformLevel {
    constructor(cfg) {
      super(cfg);
      this.player.useGravity = cfg.useGravity !== undefined ? cfg.useGravity : true;
    }
  }

  /* ========================================
     CHASE LEVEL - chase or be chased
     ======================================== */
  class ChaseLevel extends PlatformLevel {
    constructor(cfg) {
      super(cfg);
      this.npc = null;
      this.chasing = cfg.chasing || false; // true = NPC chases player
      this.safeZone = cfg.safeZone || null;
    }
    init() {
      super.init();
      if (this.cfg.npc) {
        const n = this.cfg.npc;
        this.npc = new G.ent.NPC(n[0], n[1], n[2], n[3], n[4]);
        this.npc.speed = n[5] || 120;
      }
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost || !this.npc) return;

      // NPC movement
      if (this.chasing) {
        // NPC chases player
        const dx = this.player.cx - (this.npc.x + this.npc.w / 2);
        const dy = this.player.cy - (this.npc.y + this.npc.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          this.npc.vx = (dx / dist) * this.npc.speed;
          this.npc.vy = (dy / dist) * this.npc.speed;
        }
        this.npc.update(dt);
        if (G.ent.overlap(this.player, this.npc)) {
          this.lose('أمسكوك!');
        }
        // Check safe zone
        if (this.safeZone && G.ent.pointIn(this.player.cx, this.player.cy, this.safeZone)) {
          this.win();
        }
      } else {
        // Player chases NPC - NPC runs away
        const dx = this.npc.x - this.player.cx;
        const dy = this.npc.y - this.player.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 5) {
          this.npc.vx = (dx / dist) * this.npc.speed;
          this.npc.vy = (dy / dist) * this.npc.speed * 0.3;
        } else {
          this.npc.vx *= 0.95;
        }
        // Keep NPC in bounds
        if (this.npc.x < 10) this.npc.vx = Math.abs(this.npc.vx);
        if (this.npc.x > W - 50) this.npc.vx = -Math.abs(this.npc.vx);
        this.npc.y = Math.max(this.groundY - this.npc.h, Math.min(this.groundY - this.npc.h, this.npc.y));
        this.npc.update(dt);

        if (G.ent.overlap(this.player, this.npc)) {
          G.audio.funny();
          this.npc.active = false;
          this.collectCount++;
          if (this.collectCount >= this.collectTarget) this.win();
          else {
            // Respawn NPC elsewhere
            this.npc.x = Math.random() * (W - 100) + 50;
            this.npc.active = true;
          }
        }
      }
    }
    draw(ctx) {
      super.draw(ctx);
      if (this.npc) this.npc.draw(ctx);
      if (this.safeZone) {
        ctx.fillStyle = 'rgba(76,175,80,0.3)';
        G.ent.roundRect(ctx, this.safeZone.x, this.safeZone.y, this.safeZone.w, this.safeZone.h, 10, 'rgba(76,175,80,0.3)', '#4caf50');
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏠 منطقة آمنة', this.safeZone.x + this.safeZone.w / 2, this.safeZone.y - 8);
      }
    }
  }

  /* ========================================
     CHOICE LEVEL - click correct options
     ======================================== */
  class ChoiceLevel extends BaseLevel {
    constructor(cfg) {
      super(cfg);
      this.rounds = cfg.rounds || []; // [{question, options: [{label, emoji, correct}]}]
      this.currentRound = 0;
      this.options = [];
      this.score = 0;
      this.target = cfg.target || this.rounds.length;
      this.feedbackTimer = 0;
      this.npcEmoji = cfg.npcEmoji || '🤔';
      this.npcReaction = '';
    }
    init() {
      this.loadRound();
    }
    loadRound() {
      this.options = [];
      if (this.currentRound >= this.rounds.length) { this.win(); return; }
      const round = this.rounds[this.currentRound];
      const count = round.options.length;
      const totalW = count * 140 + (count - 1) * 20;
      const startX = (W - totalW) / 2;
      round.options.forEach((opt, i) => {
        this.options.push(new G.ent.ClickOption(
          startX + i * 160, 300, 140, 70, opt.label, opt.emoji, opt.correct
        ));
      });
      this.npcReaction = '';
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost) return;

      if (this.feedbackTimer > 0) {
        this.feedbackTimer -= dt;
        if (this.feedbackTimer <= 0) {
          this.currentRound++;
          this.loadRound();
        }
        return;
      }

      const mx = G.input.mouseX, my = G.input.mouseY;
      this.options.forEach(opt => { opt.hover = opt.checkClick(mx, my); });

      if (G.input.action()) {
        for (const opt of this.options) {
          if (opt.checkClick(mx, my) && !opt.clicked) {
            opt.clicked = true;
            opt.feedback = 1;
            opt.feedbackCorrect = opt.correct;
            if (opt.correct) {
              this.score++;
              G.audio.collect();
              this.npcReaction = '😄';
              this.particles.emit(opt.x + 70, opt.y + 35, 10, '#4caf50');
            } else {
              G.audio.funny();
              this.npcReaction = '😜';
              this.particles.emit(opt.x + 70, opt.y + 35, 8, '#ff5722');
            }
            this.feedbackTimer = 0.8;
            break;
          }
        }
      }
    }
    draw(ctx) {
      super.draw(ctx);

      // NPC
      ctx.font = '64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.npcReaction || this.npcEmoji, 400, 120);

      // Question
      if (this.currentRound < this.rounds.length) {
        const q = this.rounds[this.currentRound].question;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        G.ent.roundRect(ctx, 100, 170, 600, 50, 14, 'rgba(255,255,255,0.9)', '#90caf9');
        ctx.fillStyle = '#333';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(q, 400, 200);
      }

      // Options
      this.options.forEach(opt => opt.draw(ctx));

      // Score
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      G.ent.roundRect(ctx, 340, 410, 120, 35, 10, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.score} / ${this.target}`, 400, 432);

      this.particles.draw(ctx);
    }
  }

  /* ========================================
     PUZZLE LEVEL - drag items to correct slots
     ======================================== */
  class PuzzleLevel extends BaseLevel {
    constructor(cfg) {
      super(cfg);
      this.pieces = cfg.pieces || []; // [{emoji, x, y, targetX, targetY}]
      this.slots = cfg.slots || [];   // [{x, y, w, h, label}]
      this.placed = 0;
      this.target = cfg.target || this.pieces.length;
      this.dragging = null;
      this.dragOffX = 0;
      this.dragOffY = 0;
      this.pieceObjs = [];
      this.slotObjs = [];
    }
    init() {
      this.pieceObjs = this.pieces.map((p, i) => ({
        ...p, idx: i, w: p.w || 50, h: p.h || 50,
        placed: false, origX: p.x, origY: p.y
      }));
      this.slotObjs = this.slots.map(s => ({
        ...s, w: s.w || 60, h: s.h || 60, filled: false
      }));
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost) return;
      const mx = G.input.mouseX, my = G.input.mouseY;

      if (G.input.mouseDown) {
        if (this.dragging === null) {
          for (const p of this.pieceObjs) {
            if (!p.placed && G.ent.pointIn(mx, my, p)) {
              this.dragging = p;
              this.dragOffX = mx - p.x;
              this.dragOffY = my - p.y;
              break;
            }
          }
        }
        if (this.dragging) {
          this.dragging.x = mx - this.dragOffX;
          this.dragging.y = my - this.dragOffY;
        }
      } else if (this.dragging) {
        // Check drop on slot
        let snapped = false;
        for (const s of this.slotObjs) {
          if (!s.filled && s.acceptIdx === this.dragging.idx &&
              G.ent.overlap(this.dragging, s)) {
            this.dragging.x = s.x + (s.w - this.dragging.w) / 2;
            this.dragging.y = s.y + (s.h - this.dragging.h) / 2;
            this.dragging.placed = true;
            s.filled = true;
            this.placed++;
            snapped = true;
            G.audio.collect();
            this.particles.emit(s.x + s.w / 2, s.y + s.h / 2, 10, '#4caf50');
            if (this.placed >= this.target) this.win();
            break;
          }
        }
        if (!snapped) {
          // Return to original position
          this.dragging.x = this.dragging.origX;
          this.dragging.y = this.dragging.origY;
          G.audio.boop();
        }
        this.dragging = null;
      }
    }
    draw(ctx) {
      super.draw(ctx);
      // Draw slots
      this.slotObjs.forEach(s => {
        ctx.setLineDash([5, 5]);
        G.ent.roundRect(ctx, s.x, s.y, s.w, s.h, 10, 'rgba(255,255,255,0.3)', '#fff');
        ctx.setLineDash([]);
        if (s.label) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(s.label, s.x + s.w / 2, s.y + s.h + 16);
        }
      });
      // Draw pieces
      this.pieceObjs.forEach(p => {
        if (p.placed && !this.dragging) return;
        const scale = this.dragging === p ? 1.1 : 1;
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.scale(scale, scale);
        ctx.font = `${p.w - 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      });
      // Placed pieces (shown in slots)
      this.pieceObjs.forEach(p => {
        if (!p.placed) return;
        ctx.font = `${p.w - 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x + p.w / 2, p.y + p.h / 2);
      });
      // Counter
      G.ent.roundRect(ctx, 340, 455, 120, 30, 8, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.placed} / ${this.target}`, 400, 474);
      this.particles.draw(ctx);
    }
  }

  /* ========================================
     PATTERN LEVEL - Simon-says style
     ======================================== */
  class PatternLevel extends BaseLevel {
    constructor(cfg) {
      super(cfg);
      this.colors = cfg.colors || ['#f44336', '#4caf50', '#2196f3', '#fdd835'];
      this.emojis = cfg.emojis || ['🔴', '🟢', '🔵', '🟡'];
      this.sequence = [];
      this.playerSeq = [];
      this.showingPattern = false;
      this.showIdx = 0;
      this.showTimer = 0;
      this.roundNum = 0;
      this.maxRounds = cfg.maxRounds || 3;
      this.buttons = [];
      this.feedback = '';
      this.feedbackTimer = 0;
    }
    init() {
      const btnSize = 90;
      const gap = 20;
      const totalW = this.colors.length * btnSize + (this.colors.length - 1) * gap;
      const startX = (W - totalW) / 2;
      this.colors.forEach((c, i) => {
        this.buttons.push({ x: startX + i * (btnSize + gap), y: 280, w: btnSize, h: btnSize, color: c, emoji: this.emojis[i], lit: false, idx: i });
      });
      this.nextRound();
    }
    nextRound() {
      this.roundNum++;
      if (this.roundNum > this.maxRounds) { this.win(); return; }
      this.sequence.push(Math.floor(Math.random() * this.colors.length));
      this.playerSeq = [];
      this.showPattern();
    }
    showPattern() {
      this.showingPattern = true;
      this.showIdx = 0;
      this.showTimer = 0.5;
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost) return;

      if (this.feedbackTimer > 0) {
        this.feedbackTimer -= dt;
        if (this.feedbackTimer <= 0) this.feedback = '';
        return;
      }

      if (this.showingPattern) {
        this.showTimer -= dt;
        if (this.showTimer <= 0) {
          this.buttons.forEach(b => b.lit = false);
          if (this.showIdx < this.sequence.length) {
            this.buttons[this.sequence[this.showIdx]].lit = true;
            G.audio.playTone && G.audio.boop();
            this.showIdx++;
            this.showTimer = 0.6;
          } else {
            this.showingPattern = false;
          }
        }
        return;
      }

      // Player input
      if (G.input.action()) {
        const mx = G.input.mouseX, my = G.input.mouseY;
        for (const btn of this.buttons) {
          if (G.ent.pointIn(mx, my, btn)) {
            this.playerSeq.push(btn.idx);
            btn.lit = true;
            setTimeout(() => btn.lit = false, 200);
            G.audio.boop();

            const si = this.playerSeq.length - 1;
            if (this.playerSeq[si] !== this.sequence[si]) {
              this.feedback = '❌ خطأ!';
              this.feedbackTimer = 0.8;
              G.audio.funny();
              this.playerSeq = [];
              this.showPattern();
              return;
            }
            if (this.playerSeq.length === this.sequence.length) {
              this.feedback = '✅ صح!';
              this.feedbackTimer = 0.8;
              G.audio.collect();
              this.particles.emit(400, 250, 15, '#4caf50');
              setTimeout(() => this.nextRound(), 900);
            }
            break;
          }
        }
      }
    }
    draw(ctx) {
      super.draw(ctx);
      // Title
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.showingPattern ? '👀 شاهد النمط...' : '🎵 كرّر النمط!', 400, 100);
      // Round info
      ctx.font = '18px Arial';
      ctx.fillText(`الجولة ${this.roundNum} / ${this.maxRounds}`, 400, 140);
      // Buttons
      this.buttons.forEach(btn => {
        const alpha = btn.lit ? 1 : 0.5;
        ctx.globalAlpha = alpha;
        ctx.font = `${btn.w - 20}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        G.ent.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 16, btn.lit ? btn.color : '#444', btn.color);
        ctx.fillText(btn.emoji, btn.x + btn.w / 2, btn.y + btn.h / 2);
        ctx.globalAlpha = 1;
      });
      // Feedback
      if (this.feedback) {
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.feedback, 400, 230);
      }
      this.particles.draw(ctx);
    }
  }

  /* ========================================
     ESCAPE LEVEL - run to safe zone
     ======================================== */
  class EscapeLevel extends PlatformLevel {
    constructor(cfg) {
      super(cfg);
      this.chasers = [];
      this.safeZone = cfg.safeZone || { x: 700, y: 380, w: 80, h: 60 };
    }
    init() {
      super.init();
      if (this.cfg.chasers) {
        this.cfg.chasers.forEach(c => {
          const npc = new G.ent.NPC(c[0], c[1], c[2] || 32, c[3] || 32, c[4]);
          npc.speed = c[5] || 100;
          this.chasers.push(npc);
        });
      }
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost) return;
      this.chasers.forEach(ch => {
        const dx = this.player.cx - (ch.x + ch.w / 2);
        const dist = Math.abs(dx);
        if (dist > 5) {
          ch.vx = (dx > 0 ? 1 : -1) * ch.speed;
        }
        ch.y = this.groundY - ch.h;
        ch.update(dt);
        if (G.ent.overlap(this.player, ch)) this.lose('أمسكوك!');
      });
      if (G.ent.pointIn(this.player.cx, this.player.cy, this.safeZone)) this.win();
    }
    draw(ctx) {
      // Draw safe zone first
      ctx.fillStyle = 'rgba(76,175,80,0.3)';
      G.ent.roundRect(ctx, this.safeZone.x, this.safeZone.y, this.safeZone.w, this.safeZone.h, 10, 'rgba(76,175,80,0.3)', '#4caf50');
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏠 آمن', this.safeZone.x + this.safeZone.w / 2, this.safeZone.y - 6);
      super.draw(ctx);
      this.chasers.forEach(ch => ch.draw(ctx));
    }
  }

  /* ========================================
     BOSS LEVEL - multi-phase encounter
     ======================================== */
  class BossLevel extends BaseLevel {
    constructor(cfg) {
      super(cfg);
      this.player = new G.Player(cfg.startX || 100, cfg.startY || 390);
      this.platforms = [];
      this.groundY = cfg.groundY || 440;
      this.boss = null;
      this.phase = 0;
      this.phases = cfg.phases || 3;
      this.phaseTimer = 0;
      this.bossEmoji = cfg.bossEmoji || '👑';
      this.bossX = 600; this.bossY = 350;
      this.projectiles = [];
      this.hitZones = [];
      this.bossHP = cfg.phases || 3;
      this.phaseText = '';
    }
    init() {
      this.platforms.push(new G.ent.Platform(0, this.groundY, W, H - this.groundY));
      if (this.cfg.platforms) {
        this.cfg.platforms.forEach(p => this.platforms.push(new G.ent.Platform(p[0], p[1], p[2], p[3])));
      }
      this.startPhase();
    }
    startPhase() {
      this.projectiles = [];
      this.hitZones = [];
      this.phaseTimer = 0;
      this.phase++;
      if (this.phase > this.phases) { this.win(); return; }
      this.phaseText = `المرحلة ${this.phase}/${this.phases}`;
      // Spawn hit zone
      this.hitZones.push({
        x: this.bossX - 10, y: this.bossY + 20, w: 60, h: 40,
        emoji: '🎯', active: true
      });
    }
    update(dt) {
      super.update(dt);
      if (this.won || this.lost) return;
      this.player.update(dt, this.platforms, { x: 0, y: 0, w: W, h: H });
      this.phaseTimer += dt;

      // Boss projectiles
      if (this.phaseTimer > 1.5 && Math.random() < 0.02 * this.phase) {
        this.projectiles.push(new G.ent.Obstacle(
          this.bossX, this.bossY + 30, 24, 24,
          ['🥧', '🎪', '🎈', '💨'][Math.floor(Math.random() * 4)],
          -150 - Math.random() * 100, -50 + Math.random() * 100
        ));
      }

      this.projectiles.forEach(p => {
        p.update(dt);
        if (G.ent.overlap(this.player, p) && p.active) {
          p.active = false;
          G.audio.funny();
          this.particles.emit(this.player.cx, this.player.cy, 6, '#ff9800');
          // Push player back
          this.player.x -= 40;
          if (this.player.x < 0) this.player.x = 0;
        }
      });
      // Clean offscreen projectiles
      this.projectiles = this.projectiles.filter(p => p.x > -50 && p.x < W + 50 && p.y < H + 50);

      // Hit zones
      this.hitZones.forEach(hz => {
        if (hz.active && G.ent.overlap(this.player, hz)) {
          hz.active = false;
          this.bossHP--;
          G.audio.collect();
          this.particles.emit(hz.x + 30, hz.y + 20, 20, '#fdd835');
          if (this.bossHP <= 0) {
            this.win();
          } else {
            setTimeout(() => this.startPhase(), 800);
          }
        }
      });

      // Boss bobbing
      this.bossY = 340 + Math.sin(this.phaseTimer * 2) * 15;
    }
    draw(ctx) {
      super.draw(ctx);
      drawGround(ctx, this.theme, this.groundY);

      // Boss
      ctx.font = '72px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.bossEmoji, this.bossX + 20, this.bossY);
      // Boss name
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText('الملك فرفوش', this.bossX + 20, this.bossY - 50);
      // HP bar
      const hpW = 100;
      const hpRatio = this.bossHP / this.phases;
      G.ent.roundRect(ctx, this.bossX - 30, this.bossY - 40, hpW, 10, 4, '#555');
      G.ent.roundRect(ctx, this.bossX - 30, this.bossY - 40, hpW * hpRatio, 10, 4, '#f44336');

      // Hit zones
      this.hitZones.forEach(hz => {
        if (!hz.active) return;
        const pulse = Math.sin(this.phaseTimer * 5) * 5;
        ctx.font = `${30 + pulse}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(hz.emoji, hz.x + hz.w / 2, hz.y + hz.h / 2);
      });

      // Projectiles
      this.projectiles.forEach(p => p.draw(ctx));
      this.player.draw(ctx);
      this.particles.draw(ctx);

      // Phase text
      G.ent.roundRect(ctx, 320, 55, 160, 30, 8, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.phaseText + ` ❤️${this.bossHP}`, 400, 74);
    }
  }

  return {
    PlatformLevel,
    CollectLevel,
    ChaseLevel,
    ChoiceLevel,
    PuzzleLevel,
    PatternLevel,
    EscapeLevel,
    BossLevel,
    getTheme,
    drawBg,
    drawGround,
    ZONE_THEMES
  };
})();
