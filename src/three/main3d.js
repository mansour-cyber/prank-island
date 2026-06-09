/* Entry for the 3D vertical slice. */
import { Game3D } from './Game3D.js';
import { AudioManager } from '../core/AudioManager.js';

const game = new Game3D();
window.game3d = game;

document.getElementById('btn-restart')?.addEventListener('click', () => { AudioManager.click(); game.restart(); });

// first gesture unlocks audio
const unlock = () => { AudioManager.unlock(); removeEventListener('pointerdown', unlock); };
addEventListener('pointerdown', unlock);
