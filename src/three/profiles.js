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
  return { name, stars: 0, best: {}, unlocked: 1, levelsCompleted: 0, bestScore: 0, createdAt: Date.now() };
}

export const Profiles = {
  all() { return Object.values(read().profiles); },

  current() {
    const d = read();
    return d.current ? d.profiles[d.current] || null : null;
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

  leaderboard() {
    return this.all().sort((a, b) =>
      b.stars - a.stars ||
      b.levelsCompleted - a.levelsCompleted ||
      b.bestScore - a.bestScore ||
      a.createdAt - b.createdAt,
    );
  },
};
