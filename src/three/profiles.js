/* ============================================================
   Profiles & Heroes leaderboard (localStorage).
   A simple, account-free "login": kids pick or create a name.
   Progress + stars are stored per profile; the leaderboard ranks
   them. (Local to the device — perfect for a family device; a
   global online board can be added later behind the same API.)
   ============================================================ */
const KEY = 'prankIsland3D_v1';

function read() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || typeof d !== 'object') return { profiles: {}, current: null };
    d.profiles ||= {}; return d;
  } catch { return { profiles: {}, current: null }; }
}
function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

function blank(name) {
  return { name, stars: 0, best: {}, unlocked: 1, levelsCompleted: 0, bestScore: 0,
    coins: 0, owned: [], equipped: { color: 'default', hat: 'none' }, lastGift: 0, createdAt: Date.now() };
}

/* fill in fields that older profiles may miss */
function norm(p) {
  if (!p) return p;
  p.coins ??= 0; p.owned ??= []; p.equipped ??= { color: 'default', hat: 'none' };
  p.equipped.color ??= 'default'; p.equipped.hat ??= 'none'; p.lastGift ??= 0;
  return p;
}

export const Profiles = {
  all() { return Object.values(read().profiles); },

  current() {
    const d = read();
    return d.current ? norm(d.profiles[d.current]) || null : null;
  },

  login(rawName) {
    const name = String(rawName || '').trim().slice(0, 14);
    if (!name) return null;
    const d = read();
    const key = name.toLowerCase();
    if (!d.profiles[key]) d.profiles[key] = blank(name);
    else d.profiles[key].name = name; // keep latest casing
    d.current = key;
    write(d);
    return d.profiles[key];
  },

  logout() { const d = read(); d.current = null; write(d); },

  remove(name) {
    const d = read(); const key = String(name).toLowerCase();
    delete d.profiles[key];
    if (d.current === key) d.current = null;
    write(d);
  },

  /* Record a finished level: keep best stars per level, update totals. */
  recordWin(levelIdx, stars, score) {
    const d = read(); if (!d.current) return;
    const p = d.profiles[d.current]; if (!p) return;
    const prev = p.best[levelIdx] || 0;
    if (stars > prev) { p.stars += stars - prev; p.best[levelIdx] = stars; }
    p.levelsCompleted = Object.keys(p.best).length;
    if (levelIdx + 2 > p.unlocked) p.unlocked = levelIdx + 2;
    p.bestScore = Math.max(p.bestScore || 0, score || 0);
    write(d);
    return p;
  },

  addCoins(n) {
    const d = read(); if (!d.current) return 0;
    const p = norm(d.profiles[d.current]); if (!p) return 0;
    p.coins += n; write(d); return p.coins;
  },

  coins() { return this.current()?.coins || 0; },

  /* buy an item if affordable & not owned; auto-equip into its slot */
  buy(id, price, slot) {
    const d = read(); if (!d.current) return { ok: false };
    const p = norm(d.profiles[d.current]); if (!p) return { ok: false };
    if (p.owned.includes(id)) { p.equipped[slot] = id; write(d); return { ok: true, owned: true, coins: p.coins }; }
    if (p.coins < price) return { ok: false, reason: 'coins' };
    p.coins -= price; p.owned.push(id); p.equipped[slot] = id; write(d);
    return { ok: true, coins: p.coins };
  },

  equip(slot, id) {
    const d = read(); if (!d.current) return;
    const p = norm(d.profiles[d.current]); if (!p) return;
    p.equipped[slot] = id; write(d);
  },

  owns(id) { return !!this.current()?.owned.includes(id); },
  equipped() { return this.current()?.equipped || { color: 'default', hat: 'none' }; },

  /* hourly 500 gift; returns {amount, waitSec} */
  giftStatus() {
    const p = this.current(); if (!p) return { amount: 0, waitSec: 0 };
    const elapsed = Date.now() - (p.lastGift || 0);
    const period = 3600 * 1000;
    if (!p.lastGift || elapsed >= period) return { amount: 500, waitSec: 0, ready: true };
    return { amount: 0, waitSec: Math.ceil((period - elapsed) / 1000), ready: false };
  },
  claimGift() {
    const s = this.giftStatus(); if (!s.ready) return 0;
    const d = read(); const p = norm(d.profiles[d.current]);
    p.coins += 500; p.lastGift = Date.now(); write(d);
    return 500;
  },

  leaderboard() {
    return this.all().sort((a, b) =>
      b.stars - a.stars ||
      b.levelsCompleted - a.levelsCompleted ||
      b.bestScore - a.bestScore ||
      a.createdAt - b.createdAt,
    );
  },
};
