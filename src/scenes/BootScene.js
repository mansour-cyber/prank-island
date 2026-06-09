/* Boot — minimal setup then hand off to Preload. */
import { COLORS } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    this.cameras.main.setBackgroundColor(COLORS.cream);
    this.scene.start('Preload');
  }
}
