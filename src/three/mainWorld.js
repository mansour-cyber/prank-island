/* Open-world flow controller. */
import { OpenWorld } from './OpenWorld.js';
import { Profiles } from './profiles.js';
import { AudioManager } from '../core/AudioManager.js';

const $ = (id) => document.getElementById(id);
let coins = (Profiles.current()?.coins) || 0;

const world = new OpenWorld({
  onProximity(label) {
    const b = $('interactBtn');
    if (label) { b.textContent = label; b.classList.add('show'); }
    else b.classList.remove('show');
  },
  onCoins() { coins++; $('coins').textContent = `🪙 ${coins}`; Profiles.addCoins(1); },
});
window.world = world;

let toastTimer;
function toast(msg, ms = 3500) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }

world.loaded.then(() => {
  $('s-loading').classList.remove('show');
  document.body.classList.add('playing');
  $('coins').textContent = `🪙 ${coins}`;
  toast('تجوّل بحرية! اقترب من 🚗 أو 🐪 أو ✈️ واضغط زر الركوب 🟢', 5000);
});

const unlock = () => { AudioManager.unlock(); removeEventListener('pointerdown', unlock); };
addEventListener('pointerdown', unlock);
