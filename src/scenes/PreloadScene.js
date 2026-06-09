/* Preload — load all art with a friendly progress bar. */
import { WIDTH, HEIGHT, COLORS, FONT } from '../config.js';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    const cx = WIDTH / 2, cy = HEIGHT / 2;
    this.add.text(cx, cy - 70, '🏝️ جزيرة المقالب', {
      fontFamily: FONT, fontSize: '34px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy - 34, 'جاري التحميل...', {
      fontFamily: FONT, fontSize: '18px', color: '#7a6a60',
    }).setOrigin(0.5);

    const bw = 360, bh = 26;
    const frame = this.add.graphics();
    frame.lineStyle(4, 0x3a2c28, 1).strokeRoundedRect(cx - bw / 2, cy, bw, bh, 13);
    const bar = this.add.graphics();
    this.load.on('progress', (p) => {
      bar.clear().fillStyle(COLORS.good, 1)
        .fillRoundedRect(cx - bw / 2 + 4, cy + 4, (bw - 8) * p, bh - 8, 9);
    });

    this.load.setPath('assets');
    this.load.spritesheet('player', 'player.png', { frameWidth: 64, frameHeight: 64 });
    this.load.atlas('atlas', 'atlas.png', 'atlas.json');
    this.load.image('bg_sky', 'bg_sky.png');
    this.load.image('bg_hills', 'bg_hills.png');
  }

  create() {
    this.scene.start('Menu');
  }
}
