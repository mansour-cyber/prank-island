/* ============================================================
   GameScene — hosts one level. Builds the world & HUD, delegates
   level mechanics to a "mode" chosen by the level's type, and
   owns the intro/pause/win/fail flow.
   ============================================================ */
import { WIDTH, HEIGHT, GROUND_Y, COLORS, FONT, PHYSICS, TOTAL_LEVELS, zoneOf } from '../config.js';
import { buildBackground } from '../objects/Background.js';
import { makeButton } from '../objects/Button.js';
import { AudioManager } from '../core/AudioManager.js';
import { SaveManager } from '../core/SaveManager.js';
import { LEVELS } from '../data/levels.js';
import { PlatformMode } from '../modes/PlatformMode.js';
import { PuzzleMode } from '../modes/PuzzleMode.js';

const MODES = { platform: PlatformMode, collect: PlatformMode, chase: PlatformMode, puzzle: PuzzleMode };

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  init(data) { this.levelIdx = data.levelIdx ?? 0; }

  create() {
    this.audio = AudioManager;
    this.level = LEVELS[this.levelIdx];
    this.zone = zoneOf(this.levelIdx);
    this.groundY = this.level.config.groundY ?? GROUND_Y;
    this.state = 'intro';
    this.timeLeft = this.level.config.timer || 0;
    this.timerMax = this.timeLeft;

    this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);
    this.physics.world.gravity.y = PHYSICS.gravity;
    this.bg = buildBackground(this, this.zone);

    // input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.touch = { left: false, right: false, jump: false };
    this.controls = { left: false, right: false, up: false, down: false, jumpPressed: false };

    // build the level mode
    const ModeClass = MODES[this.level.type] || PlatformMode;
    this.mode = new ModeClass(this);
    this.mode.create();

    this.buildHUD();
    this.buildTouchControls();
    this.showIntro();

    this.physics.pause(); // resumes when the player starts the level
    this.events.on('shutdown', () => AudioManager.stopMusic());
  }

  /* ---------------- HUD ---------------- */
  buildHUD() {
    this.ui = this.add.container(0, 0).setDepth(1000);
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.28).fillRoundedRect(8, 8, WIDTH - 16, 40, 12);
    this.ui.add(bar);

    this.hudLevel = this.add.text(20, 28, `المرحلة ${this.levelIdx + 1}`, {
      fontFamily: FONT, fontSize: '18px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.hudObj = this.add.text(WIDTH / 2, 28, this.level.objective, {
      fontFamily: FONT, fontSize: '16px', color: '#fff', align: 'center', wordWrap: { width: 420 },
    }).setOrigin(0.5);
    this.hudStars = this.add.text(WIDTH - 120, 28, `⭐ ${SaveManager.totalStars()}`, {
      fontFamily: FONT, fontSize: '18px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.ui.add([this.hudLevel, this.hudObj, this.hudStars]);

    const pause = makeButton(this, WIDTH - 34, 28, '⏸️', { width: 40, height: 36, fill: 0xffffff, hover: 0xeeeeee, fontSize: '18px', onClick: () => this.pause() });
    this.ui.add(pause);

    // timer bar
    if (this.timerMax > 0) {
      this.timerBg = this.add.graphics();
      this.timerBar = this.add.graphics();
      this.ui.add([this.timerBg, this.timerBar]);
      this.drawTimer(1);
    }
    // collect counter
    if (this.mode.collectTarget > 0) {
      this.counter = this.add.text(WIDTH / 2, this.timerMax > 0 ? 86 : 66, '', {
        fontFamily: FONT, fontSize: '18px', color: '#fff', fontStyle: 'bold',
        backgroundColor: '#00000066', padding: { x: 10, y: 4 },
      }).setOrigin(0.5);
      this.ui.add(this.counter);
      this.updateCounter();
    }
  }

  drawTimer(ratio) {
    if (!this.timerBar) return;
    const x = 60, y = 56, w = WIDTH - 120, h = 8;
    this.timerBg.clear().fillStyle(0x000000, 0.3).fillRoundedRect(x, y, w, h, 4);
    const col = ratio > 0.3 ? 0x6abe4c : 0xef5350;
    this.timerBar.clear().fillStyle(col, 1).fillRoundedRect(x, y, Math.max(0, w * ratio), h, 4);
  }

  updateCounter() {
    if (this.counter) this.counter.setText(`${this.mode.collectCount} / ${this.mode.collectTarget}`);
  }

  /* ---------------- touch controls ---------------- */
  buildTouchControls() {
    if (!this.sys.game.device.input.touch) return;
    const mk = (x, label, onDown, onUp) => {
      const c = this.add.container(x, HEIGHT - 56).setDepth(1000).setAlpha(0.55);
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1).fillCircle(0, 0, 36);
      g.lineStyle(4, COLORS.panelEdge, 1).strokeCircle(0, 0, 36);
      const t = this.add.text(0, 0, label, { fontFamily: FONT, fontSize: '28px' }).setOrigin(0.5);
      c.add([g, t]); c.setSize(72, 72);
      c.setInteractive(new Phaser.Geom.Circle(0, 0, 36), Phaser.Geom.Circle.Contains);
      c.on('pointerdown', onDown); c.on('pointerup', onUp); c.on('pointerout', onUp);
      return c;
    };
    mk(70, '◀', () => (this.touch.left = true), () => (this.touch.left = false));
    mk(160, '▶', () => (this.touch.right = true), () => (this.touch.right = false));
    mk(WIDTH - 70, '⤒', () => (this.touch.jump = true), () => (this.touch.jump = false));
  }

  readControls() {
    const c = this.controls;
    c.left = this.cursors.left.isDown || this.wasd.A.isDown || this.touch.left;
    c.right = this.cursors.right.isDown || this.wasd.D.isDown || this.touch.right;
    c.up = this.cursors.up.isDown || this.wasd.W.isDown;
    c.down = this.cursors.down.isDown || this.wasd.S.isDown;
    const kbJump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.W);
    c.jumpPressed = kbJump || (this.touch.jump && !this._touchJumpPrev);
    this._touchJumpPrev = this.touch.jump;
  }

  /* ---------------- particles ---------------- */
  burst(x, y, count = 14, frame = 'sparkle') {
    const e = this.add.particles(x, y, 'atlas', {
      frame, speed: { min: 70, max: 240 }, angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 }, lifespan: 650, gravityY: 220, quantity: count, emitting: false,
    }).setDepth(900);
    e.explode(count, x, y);
    this.time.delayedCall(900, () => e.destroy());
  }

  /* ---------------- flow ---------------- */
  update(time, dms) {
    const dt = Math.min(dms / 1000, 0.05);
    this.bg.update(dt);
    if (this.state !== 'playing') return;

    this.readControls();
    this.mode.update(dt);

    if (this.timerMax > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.fail('انتهى الوقت!'); }
      this.drawTimer(this.timeLeft / this.timerMax);
    }
  }

  win() {
    if (this.state !== 'playing') return;
    this.state = 'won';
    this.physics.pause();
    this.mode.onEnd?.();
    this.audio.win(); this.audio.stopMusic();
    SaveManager.completeLevel(this.levelIdx);
    this.cameras.main.flash(250, 255, 255, 255);
    this.burst(WIDTH / 2, HEIGHT / 2, 28, 'star');
    this.time.delayedCall(650, () => this.showWin());
  }

  fail(msg) {
    if (this.state !== 'playing') return;
    this.state = 'failed';
    this.physics.pause();
    this.mode.onEnd?.();
    this.audio.fail(); this.audio.stopMusic();
    this.cameras.main.shake(220, 0.012);
    this.time.delayedCall(450, () => this.showFail(msg));
  }

  collect(x, y) { this.audio.collect(); this.burst(x, y, 10, 'sparkle'); this.updateCounter(); }

  /* ---------------- popups ---------------- */
  popup(lines, buttons, accent = COLORS.panel) {
    const layer = this.add.container(0, 0).setDepth(2000);
    const dim = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.45).setInteractive();
    const pw = 460, ph = 80 + lines.length * 42 + buttons.length * 64;
    const g = this.add.graphics();
    g.fillStyle(accent, 1).fillRoundedRect(WIDTH / 2 - pw / 2, HEIGHT / 2 - ph / 2, pw, ph, 22);
    g.lineStyle(5, COLORS.panelEdge, 1).strokeRoundedRect(WIDTH / 2 - pw / 2, HEIGHT / 2 - ph / 2, pw, ph, 22);
    layer.add([dim, g]);

    let y = HEIGHT / 2 - ph / 2 + 44;
    lines.forEach((ln, i) => {
      layer.add(this.add.text(WIDTH / 2, y, ln.text, {
        fontFamily: FONT, fontSize: ln.size || '24px', color: ln.color || COLORS.ink,
        fontStyle: i === 0 ? 'bold' : 'normal', align: 'center', wordWrap: { width: pw - 50 },
      }).setOrigin(0.5));
      y += 42;
    });
    y += 8;
    buttons.forEach((b) => {
      layer.add(makeButton(this, WIDTH / 2, y, b.label, { width: 300, height: 50, fill: b.fill, hover: b.hover, fontSize: '20px', onClick: () => { layer.destroy(); b.onClick(); } }));
      y += 64;
    });

    // entrance pop
    layer.setScale(0.8); layer.setAlpha(0);
    this.tweens.add({ targets: layer, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
    return layer;
  }

  showIntro() {
    this.popup(
      [{ text: `${this.level.emoji} ${this.level.title}` }, { text: this.level.objective, size: '18px', color: '#5a4a40' }],
      [{ label: '🎮 يلا نبدأ!', fill: 0xffb300, hover: 0xffc233, onClick: () => this.startPlaying() }],
    );
  }

  startPlaying() {
    this.state = 'playing';
    this.physics.resume();
    this.audio.startMusic();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.physics.pause();
    this._pausePopup = this.popup(
      [{ text: '⏸️ إيقاف مؤقت' }],
      [
        { label: '▶️ استمرار', fill: 0x66bb6a, hover: 0x7bc47f, onClick: () => this.resume() },
        { label: '🔄 إعادة', fill: 0xffb300, hover: 0xffc233, onClick: () => this.scene.restart({ levelIdx: this.levelIdx }) },
        { label: '🏠 القائمة', fill: 0xb0bec5, hover: 0xc2cdd4, onClick: () => this.scene.start('Menu') },
      ],
    );
  }

  resume() {
    this.state = 'playing';
    this.physics.resume();
  }

  showWin() {
    const last = this.levelIdx >= TOTAL_LEVELS - 1;
    const nextReady = !last && LEVELS[this.levelIdx + 1]?.ready;
    const buttons = [];
    if (nextReady) buttons.push({ label: 'المرحلة التالية ➡️', fill: 0x66bb6a, hover: 0x7bc47f, onClick: () => this.scene.start('Game', { levelIdx: this.levelIdx + 1 }) });
    buttons.push({ label: '🔄 إعادة', fill: 0xffb300, hover: 0xffc233, onClick: () => this.scene.restart({ levelIdx: this.levelIdx }) });
    buttons.push({ label: '🏠 القائمة', fill: 0xb0bec5, hover: 0xc2cdd4, onClick: () => this.scene.start('Menu') });
    this.popup(
      [{ text: '🎉 أحسنت!' }, { text: 'حصلت على نجمة الضحك! ⭐', size: '20px', color: '#5a4a40' }],
      buttons, 0xe8f7e0,
    );
  }

  showFail(msg) {
    this.popup(
      [{ text: '😅 حاول مرة ثانية!' }, ...(msg ? [{ text: msg, size: '18px', color: '#8a4a40' }] : [])],
      [
        { label: '🔄 حاول مرة ثانية', fill: 0xffb300, hover: 0xffc233, onClick: () => this.scene.restart({ levelIdx: this.levelIdx }) },
        { label: '🏠 القائمة', fill: 0xb0bec5, hover: 0xc2cdd4, onClick: () => this.scene.start('Menu') },
      ], 0xfdeaea,
    );
  }
}
