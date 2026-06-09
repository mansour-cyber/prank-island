/* ============================================================
   3D flow controller: login → menu → level → result → board.
   ============================================================ */
import { Game3D } from './Game3D.js';
import { Profiles } from './profiles.js';
import { levelConfig, TOTAL_LEVELS_3D } from './levels3d.js';
import { AudioManager } from '../core/AudioManager.js';

const $ = (id) => document.getElementById(id);
const screens = ['s-loading', 's-login', 's-menu', 's-intro', 's-win', 's-lose', 's-board'];
function show(id) {
  screens.forEach((s) => $(s).classList.toggle('show', s === id));
  document.body.classList.toggle('playing', id === null);
}
let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

let curLevel = 0;

const game = new Game3D({
  onHud({ level, name, gems, total, time }) {
    $('hud-level').textContent = name || `المرحلة ${level}`;
    $('hud-gems').textContent = `💎 ${gems}/${total}`;
    const tEl = $('hud-time'); tEl.textContent = `⏱ ${time}`;
    tEl.classList.toggle('low', time <= 10);
  },
  onWin({ stars, score }) {
    AudioManager.stopMusic();
    Profiles.recordWin(curLevel, stars, score);
    $('win-stars').textContent = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
    $('win-score').textContent = `النقاط: ${score}`;
    $('btn-next').style.display = curLevel + 1 < TOTAL_LEVELS_3D ? 'block' : 'none';
    show('s-win');
  },
  onLose(reason) {
    AudioManager.stopMusic();
    $('lose-why').textContent = reason || '';
    show('s-lose');
  },
  onToast: toast,
});
window.game3d = game;

/* ---------- screen builders ---------- */
function renderLogin() {
  const chips = $('profile-chips'); chips.innerHTML = '';
  Profiles.all().sort((a, b) => b.stars - a.stars).slice(0, 8).forEach((p) => {
    const c = document.createElement('button');
    c.className = 'chip'; c.textContent = `${p.name} (⭐${p.stars})`;
    c.onclick = () => { AudioManager.unlock(); Profiles.login(p.name); openMenu(); };
    chips.appendChild(c);
  });
  show('s-login');
}

function openMenu() {
  const p = Profiles.current();
  if (!p) return renderLogin();
  $('menu-hi').textContent = `مرحباً ${p.name} 👋`;
  $('menu-stars').textContent = `⭐ ${p.stars} نجمة • وصلت للمرحلة ${Math.min(p.unlocked, TOTAL_LEVELS_3D)}`;
  AudioManager.stopMusic();
  show('s-menu');
}

function openIntro(idx) {
  curLevel = idx;
  const cfg = levelConfig(idx);
  $('intro-name').textContent = `${idx + 1}. ${cfg.name}`;
  $('intro-obj').textContent = `اجمع ${cfg.gems} جواهر${cfg.hazards ? ' وتجنّب النحل' : ''} ووصّل للبوابة خلال ${cfg.time} ثانية!`;
  show('s-intro');
}

function startLevel(idx) {
  curLevel = idx;
  show(null); // playing
  game.loadLevel(levelConfig(idx));
  AudioManager.startMusic();
}

function openBoard(returnTo) {
  const list = $('lb-list'); list.innerHTML = '';
  const me = Profiles.current();
  const rows = Profiles.leaderboard();
  if (!rows.length) list.innerHTML = '<p>لا يوجد أبطال بعد — كن الأول! 🌟</p>';
  const medals = ['🥇', '🥈', '🥉'];
  rows.slice(0, 12).forEach((p, i) => {
    const li = document.createElement('li');
    if (me && p.name === me.name) li.className = 'me';
    li.innerHTML = `<span class="rank">${medals[i] || (i + 1)}</span><span class="nm">${escapeHtml(p.name)}</span><span class="sc">⭐${p.stars} • ${p.levelsCompleted} مراحل</span>`;
    list.appendChild(li);
  });
  $('btn-board-back').onclick = () => { AudioManager.click(); returnTo(); };
  show('s-board');
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------- wire buttons ---------- */
$('btn-login').onclick = () => { AudioManager.unlock(); const ok = Profiles.login($('name-input').value); if (ok) openMenu(); else $('name-input').focus(); };
$('name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-login').click(); });

$('btn-play').onclick = () => { AudioManager.click(); const p = Profiles.current(); openIntro(Math.min((p?.unlocked || 1) - 1, TOTAL_LEVELS_3D - 1)); };
$('btn-board').onclick = () => { AudioManager.click(); openBoard(openMenu); };
$('btn-switch').onclick = () => { AudioManager.click(); Profiles.logout(); $('name-input').value = ''; renderLogin(); };

$('btn-go').onclick = () => { AudioManager.click(); startLevel(curLevel); };

$('btn-next').onclick = () => { AudioManager.click(); openIntro(curLevel + 1); };
$('btn-retry').onclick = () => { AudioManager.click(); startLevel(curLevel); };
$('btn-win-board').onclick = () => { AudioManager.click(); openBoard(openMenu); };
$('btn-win-menu').onclick = () => { AudioManager.click(); openMenu(); };
$('btn-lose-retry').onclick = () => { AudioManager.click(); startLevel(curLevel); };
$('btn-lose-menu').onclick = () => { AudioManager.click(); openMenu(); };

const unlock = () => { AudioManager.unlock(); removeEventListener('pointerdown', unlock); };
addEventListener('pointerdown', unlock);

/* ---------- boot ---------- */
game.loaded.then(() => {
  if (Profiles.current()) openMenu(); else renderLogin();
}).catch((e) => {
  $('s-loading').querySelector('p').textContent = 'تعذّر تحميل النموذج 😢 — حدّث الصفحة.';
  console.error(e);
});
