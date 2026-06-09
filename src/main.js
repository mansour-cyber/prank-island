/* ============================================================
   جزيرة المقالب — Prank Island (Phaser 3 edition)
   Game bootstrap & scene registration.
   ============================================================ */
import Phaser from 'phaser';
import { WIDTH, HEIGHT } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { AudioManager } from './core/AudioManager.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#bfeaff',
  scale: {
    parent: 'game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
    expandParent: true,
  },
  render: { antialias: true, pixelArt: false, roundPixels: true },
  input: { activePointers: 3 },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, MenuScene, LevelSelectScene, GameScene],
};

const game = new Phaser.Game(config);
window.game = game; // handy for debugging & automated checks

// Unlock WebAudio on first user gesture (browser autoplay policy).
const unlock = () => { AudioManager.unlock(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

export default game;
