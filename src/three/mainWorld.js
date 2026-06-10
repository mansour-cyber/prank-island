/* Open-world controller: HUD, shop, hourly gift, customization. */
import { OpenWorld, SKINS, HATS } from './OpenWorld.js';
import { Profiles } from './profiles.js';
import { AudioManager } from './../core/AudioManager.js';

const $ = (id) => document.getElementById(id);
if (!Profiles.current()) Profiles.login('ضيف');   // ensure a profile so coins persist

let toastTimer;
function toast(msg, ms = 3200) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function setCoins(n) { const v = `🪙 ${n}`; $('coins').textContent = v; $('shop-bal').textContent = v; }

const world = new OpenWorld({
  onProximity(label) { const b = $('interactBtn'); if (label) { b.textContent = label; b.classList.add('show'); } else b.classList.remove('show'); },
  onCoins(total) { setCoins(total); },
  onToast: toast,
  onShop() { openShop(); },
});
window.world = world;

/* ---------------- shop ---------------- */
function itemCard(id, def, slot, swatchColor) {
  const eq = Profiles.equipped()[slot] === id;
  const owned = id === 'default' || id === 'none' || Profiles.owns(id);
  const sw = swatchColor != null ? `<div class="sw" style="background:#${swatchColor.toString(16).padStart(6, '0')}"></div>` : `<div class="sw" style="background:#eee">${slot === 'hat' ? '🎩' : ''}</div>`;
  let btn;
  if (eq) btn = `<button class="eq" disabled>ملبوس ✓</button>`;
  else if (owned) btn = `<button class="owned" data-act="equip" data-slot="${slot}" data-id="${id}">ارتدِ</button>`;
  else btn = `<button data-act="buy" data-slot="${slot}" data-id="${id}" data-price="${def.price}">🪙 ${def.price}</button>`;
  return `<div class="item"><div class="t">${def.name}</div>${sw}${btn}</div>`;
}
function renderShop() {
  setCoins(Profiles.coins());
  $('shop-colors').innerHTML = Object.entries(SKINS).map(([id, d]) => itemCard(id, d, 'color', d.color)).join('');
  $('shop-hats').innerHTML = Object.entries(HATS).map(([id, d]) => itemCard(id, d, 'hat', null)).join('');
  document.querySelectorAll('#s-shop [data-act]').forEach((b) => b.onclick = () => {
    const { act, slot, id, price } = b.dataset;
    if (act === 'equip') { Profiles.equip(slot, id); AudioManager.boop(); }
    else { const r = Profiles.buy(id, +price, slot); if (!r.ok) { toast('🪙 فلوسك ما تكفي — اجمع أكثر!'); return; } AudioManager.collect(); }
    world.applyLook(Profiles.equipped()); renderShop();
  });
}
function openShop() { renderShop(); $('s-shop').classList.add('show'); }
$('shop-close').onclick = () => { AudioManager.click(); $('s-shop').classList.remove('show'); };

/* ---------------- hourly gift ---------------- */
function refreshGift() {
  const s = Profiles.giftStatus();
  $('giftBtn').classList.toggle('show', !!s.ready);
}
$('giftBtn').onclick = () => {
  const amt = Profiles.claimGift();
  if (amt) { setCoins(Profiles.coins()); toast(`🎁 حصلت على ${amt} عملة! تعال بعد ساعة للمزيد`); AudioManager.win(); }
  refreshGift();
};
setInterval(refreshGift, 20000);

/* ---------------- boot ---------------- */
world.loaded.then(() => {
  $('s-loading').classList.remove('show');
  setCoins(Profiles.coins());
  refreshGift();
  toast('تجوّل بحرية! اقترب من 🚗🛴🐪✈️ أو 🛍️ أو 🏁 واضغط الزر الأخضر', 5200);
});

const unlock = () => { AudioManager.unlock(); removeEventListener('pointerdown', unlock); };
addEventListener('pointerdown', unlock);
