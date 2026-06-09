/* Level Select — zone tabs + a grid of levels. */
import { WIDTH, HEIGHT, COLORS, FONT } from '../config.js';
import { buildBackground } from '../objects/Background.js';
import { makeButton } from '../objects/Button.js';
import { AudioManager } from '../core/AudioManager.js';
import { SaveManager } from '../core/SaveManager.js';
import { ZONES, LEVELS } from '../data/levels.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }
  init(data) { this.zone = data?.zone ?? 0; }

  create() {
    this.audio = AudioManager;
    this.bg = buildBackground(this, this.zone);
    this.add.text(WIDTH / 2, 44, 'اختيار المرحلة', {
      fontFamily: FONT, fontSize: '34px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.gridLayer = this.add.container(0, 0);
    this.buildTabs();
    this.buildGrid();

    makeButton(this, WIDTH / 2, HEIGHT - 38, '⬅️ رجوع', { width: 180, height: 46, fill: 0xb0bec5, hover: 0xc2cdd4, fontSize: '18px', onClick: () => this.scene.start('Menu') });
  }

  buildTabs() {
    const n = ZONES.length, gap = 8, tw = (WIDTH - 60 - gap * (n - 1)) / n;
    ZONES.forEach((z, i) => {
      const x = 30 + i * (tw + gap) + tw / 2;
      const active = i === this.zone;
      const c = this.add.container(x, 95);
      const g = this.add.graphics();
      g.fillStyle(active ? 0xffb300 : 0xfff7ec, 1).fillRoundedRect(-tw / 2, -22, tw, 44, 10);
      g.lineStyle(3, COLORS.panelEdge, 1).strokeRoundedRect(-tw / 2, -22, tw, 44, 10);
      const t = this.add.text(0, 0, z.emoji, { fontFamily: FONT, fontSize: '22px' }).setOrigin(0.5);
      c.add([g, t]); c.setSize(tw, 44);
      c.setInteractive(new Phaser.Geom.Rectangle(-tw / 2, -22, tw, 44), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerup', () => { if (i !== this.zone) { AudioManager.click(); this.scene.restart({ zone: i }); } });
    });
    this.add.text(WIDTH / 2, 138, ZONES[this.zone].name, {
      fontFamily: FONT, fontSize: '22px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  buildGrid() {
    const start = this.zone * 5;
    const cols = 5, cw = 130, gap = 14;
    const totalW = cols * cw + (cols - 1) * gap;
    const x0 = (WIDTH - totalW) / 2 + cw / 2;
    const y = 250;

    for (let i = 0; i < 5; i++) {
      const idx = start + i;
      const lvl = LEVELS[idx];
      const num = idx + 1;
      const unlocked = SaveManager.isUnlocked(num);
      const completed = SaveManager.hasCompleted(idx);
      const playable = unlocked && lvl.ready;
      const x = x0 + i * (cw + gap);

      const card = this.add.container(x, y);
      const g = this.add.graphics();
      const base = completed ? 0xc8e6c9 : playable ? 0xfff7ec : 0xd7d2cb;
      g.fillStyle(base, 1).fillRoundedRect(-cw / 2, -70, cw, 140, 16);
      g.lineStyle(4, COLORS.panelEdge, 1).strokeRoundedRect(-cw / 2, -70, cw, 140, 16);
      card.add(g);

      card.add(this.add.text(0, -44, lvl.emoji, { fontFamily: FONT, fontSize: '40px' }).setOrigin(0.5));
      card.add(this.add.text(0, 2, lvl.title, {
        fontFamily: FONT, fontSize: '15px', color: COLORS.ink, fontStyle: 'bold',
        align: 'center', wordWrap: { width: cw - 16 },
      }).setOrigin(0.5));
      card.add(this.add.text(0, 44, `${num}`, { fontFamily: FONT, fontSize: '18px', color: '#7a6a60', fontStyle: 'bold' }).setOrigin(0.5));

      if (completed) card.add(this.add.image(cw / 2 - 18, -54, 'atlas', 'star').setScale(0.7));
      if (!unlocked) card.add(this.add.image(0, 12, 'atlas', 'lock').setScale(1.1).setAlpha(0.85));
      else if (!lvl.ready) card.add(this.add.text(0, 58, 'قريباً', { fontFamily: FONT, fontSize: '13px', color: '#b0651e', fontStyle: 'bold' }).setOrigin(0.5));

      if (playable) {
        card.setSize(cw, 140);
        card.setInteractive(new Phaser.Geom.Rectangle(-cw / 2, -70, cw, 140), Phaser.Geom.Rectangle.Contains);
        card.input.cursor = 'pointer';
        card.on('pointerover', () => card.setScale(1.05));
        card.on('pointerout', () => card.setScale(1));
        card.on('pointerup', () => { AudioManager.click(); this.scene.start('Game', { levelIdx: idx }); });
      } else {
        card.setAlpha(unlocked ? 0.95 : 0.7);
      }
    }
  }

  update(_, dms) { this.bg.update(dms / 1000); }
}
