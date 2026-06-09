/* Menu — animated title screen. */
import { WIDTH, HEIGHT, COLORS, FONT, TOTAL_LEVELS } from '../config.js';
import { buildBackground } from '../objects/Background.js';
import { makeButton } from '../objects/Button.js';
import { AudioManager } from '../core/AudioManager.js';
import { SaveManager } from '../core/SaveManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.audio = AudioManager;
    this.bg = buildBackground(this, 0);
    AudioManager.setMuted(!SaveManager.data.soundOn);

    // bobbing decorative sprites
    this.decor = [];
    const props = ['star', 'coin', 'watermelon', 'key', 'chicken'];
    props.forEach((f, i) => {
      const s = this.add.image(120 + i * 140, 150, 'atlas', f).setAlpha(0.9).setDepth(-50);
      s._base = s.y; s._ph = i * 0.7;
      this.decor.push(s);
    });

    // title
    const title = this.add.text(WIDTH / 2, 120, '🏝️ جزيرة المقالب', {
      fontFamily: FONT, fontSize: '46px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 162, 'Prank Island', {
      fontFamily: FONT, fontSize: '20px', color: '#7a6a60',
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 114, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // stars
    this.starsText = this.add.text(WIDTH / 2, 205, `⭐ ${SaveManager.totalStars()} / ${TOTAL_LEVELS}`, {
      fontFamily: FONT, fontSize: '22px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);

    // buttons
    makeButton(this, WIDTH / 2, 270, '🎮 ابدأ اللعب', { width: 260, onClick: () => this.play() });
    makeButton(this, WIDTH / 2, 338, '📋 اختيار المرحلة', { width: 260, fill: 0x66bb6a, hover: 0x7bc47f, onClick: () => this.scene.start('LevelSelect') });

    this.soundBtn = makeButton(this, WIDTH / 2 - 95, 408, this.soundLabel(), { width: 170, height: 48, fill: 0x90caf9, hover: 0xa6d4fb, fontSize: '18px', onClick: () => this.toggleSound() });

    makeButton(this, WIDTH / 2 + 95, 408, '🗑️ حذف التقدم', { width: 170, height: 48, fill: 0xef9a9a, hover: 0xf4b2b2, fontSize: '18px', onClick: () => this.resetProgress() });

    AudioManager.unlock();
  }

  soundLabel() { return AudioManager.muted ? '🔇 الصوت' : '🔊 الصوت'; }

  toggleSound() {
    const muted = AudioManager.toggleMute();
    SaveManager.setSound(!muted);
    this.soundBtn.labelText.setText(this.soundLabel());
  }

  resetProgress() {
    SaveManager.reset();
    this.starsText.setText(`⭐ 0 / ${TOTAL_LEVELS}`);
  }

  play() {
    const idx = Math.min(SaveManager.data.unlocked - 1, TOTAL_LEVELS - 1);
    this.scene.start('Game', { levelIdx: idx });
  }

  update(_, dms) {
    const dt = dms / 1000;
    this.bg.update(dt);
    const t = this.time.now / 1000;
    this.decor.forEach((s) => { s.y = s._base + Math.sin(t * 1.5 + s._ph) * 12; });
  }
}
