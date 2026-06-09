/* ============================================================
   ASSET GENERATOR — Prank Island
   Renders a cohesive set of PNG spritesheets + a Phaser texture
   atlas (JSONHash) using @napi-rs/canvas. Output: public/assets/
   Run with: npm run assets
   ============================================================ */
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'assets');
mkdirSync(OUT, { recursive: true });

/* ---------- palette (cohesive, kid-friendly) ---------- */
const C = {
  ink: '#3a2c28',          // soft dark outline
  skin: '#ffcc9c', skinSh: '#f0a878',
  shirt: '#ff7043', shirtSh: '#e64a19',
  cap: '#42a5f5', capSh: '#1976d2',
  shoe: '#5d4037',
  grass: '#7cc44c', grassSh: '#5fa336',
  dirt: '#b07a4f', dirtSh: '#8d5a35',
  gold: '#ffd23f', goldSh: '#f5a623',
  white: '#ffffff',
};

/* ---------- drawing helpers ---------- */
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function outlined(ctx, fill, lw = 3, stroke = C.ink) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke();
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
function star(ctx, cx, cy, outer, inner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* ============================================================
   CHARACTER SPRITESHEET
   9 frames @ 64x64: idle, run1..4, jump, fall, cheer, hurt
   ============================================================ */
function drawCharacter(ctx, cx, cy, pose) {
  // pose: {legL, legR, armL, armR, bodyY, expr, squash}
  const sq = pose.squash || 1;
  ctx.save();
  ctx.translate(cx, cy + (pose.bodyY || 0));
  ctx.scale(1, sq);

  // shadow
  ctx.save();
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, 26 / sq, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // legs
  ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  const lp = pose.legL || 0, rp = pose.legR || 0;
  ctx.fillStyle = C.cap;
  rr(ctx, -9, 10, 7, 14 + lp, 3); outlined(ctx, C.shirtSh, 3);
  rr(ctx, 2, 10, 7, 14 + rp, 3); outlined(ctx, C.shirtSh, 3);
  // shoes
  rr(ctx, -11, 22 + lp, 11, 6, 3); outlined(ctx, C.shoe, 3);
  rr(ctx, 1, 22 + rp, 11, 6, 3); outlined(ctx, C.shoe, 3);

  // arms (behind body)
  const al = pose.armL || 0, ar = pose.armR || 0;
  ctx.save(); ctx.translate(-11, -2); ctx.rotate(al);
  rr(ctx, -3, 0, 6, 14, 3); outlined(ctx, C.shirt, 3); ctx.restore();
  ctx.save(); ctx.translate(11, -2); ctx.rotate(ar);
  rr(ctx, -3, 0, 6, 14, 3); outlined(ctx, C.shirt, 3); ctx.restore();
  // hands
  ctx.save(); ctx.translate(-11, -2); ctx.rotate(al);
  circle(ctx, 0, 15, 3.5); outlined(ctx, C.skin, 2.5); ctx.restore();
  ctx.save(); ctx.translate(11, -2); ctx.rotate(ar);
  circle(ctx, 0, 15, 3.5); outlined(ctx, C.skin, 2.5); ctx.restore();

  // body / shirt
  rr(ctx, -11, -4, 22, 18, 7); outlined(ctx, C.shirt, 3);
  // shirt highlight
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff';
  rr(ctx, -8, -2, 7, 12, 3); ctx.fill(); ctx.restore();

  // head
  circle(ctx, 0, -16, 12); outlined(ctx, C.skin, 3);
  // cap
  ctx.beginPath();
  ctx.arc(0, -18, 12.5, Math.PI, 0); ctx.closePath();
  outlined(ctx, C.cap, 3);
  rr(ctx, -13, -19, 18, 4, 2); outlined(ctx, C.capSh, 2.5); // brim
  // cap button
  circle(ctx, 0, -27, 2); ctx.fillStyle = C.capSh; ctx.fill();

  // face
  const e = pose.expr || 'idle';
  ctx.fillStyle = C.ink;
  if (e === 'hurt') {
    // x eyes
    ctx.lineWidth = 2; ctx.strokeStyle = C.ink;
    for (const ex of [-5, 5]) {
      ctx.beginPath(); ctx.moveTo(ex - 2.5, -17); ctx.lineTo(ex + 2.5, -13);
      ctx.moveTo(ex + 2.5, -17); ctx.lineTo(ex - 2.5, -13); ctx.stroke();
    }
  } else {
    circle(ctx, -5, -15, 2.2); ctx.fill();
    circle(ctx, 5, -15, 2.2); ctx.fill();
    // eye shine
    ctx.fillStyle = '#fff'; circle(ctx, -4.2, -15.8, 0.8); ctx.fill();
    circle(ctx, 5.8, -15.8, 0.8); ctx.fill();
    ctx.fillStyle = C.ink;
  }
  // cheeks
  ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff8a80';
  circle(ctx, -7, -11, 2.2); ctx.fill(); circle(ctx, 7, -11, 2.2); ctx.fill();
  ctx.restore();
  // mouth
  ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.beginPath();
  if (e === 'cheer') { ctx.arc(0, -11, 4, 0.1, Math.PI - 0.1); }
  else if (e === 'hurt') { ctx.arc(0, -8, 3, Math.PI + 0.2, -0.2); }
  else { ctx.arc(0, -11, 3.5, 0.2, Math.PI - 0.2); }
  ctx.stroke();

  ctx.restore();
}

function buildCharacter() {
  const FS = 64, frames = [
    { expr: 'idle' },
    { expr: 'idle', legL: 0, legR: 4, armL: 0.2, armR: -0.2 },   // run1
    { expr: 'idle', legL: 3, legR: 0, armL: -0.3, armR: 0.3 },   // run2
    { expr: 'idle', legL: 0, legR: 4, armL: 0.2, armR: -0.2, bodyY: -1 }, // run3
    { expr: 'idle', legL: 3, legR: 0, armL: -0.3, armR: 0.3 },   // run4
    { expr: 'idle', legL: -2, legR: -2, armL: -1.4, armR: 1.4, bodyY: -2, squash: 1.05 }, // jump
    { expr: 'idle', legL: 5, legR: 5, armL: -0.6, armR: 0.6 },   // fall
    { expr: 'cheer', armL: -2.4, armR: 2.4, bodyY: -1 },          // cheer
    { expr: 'hurt', legL: 2, legR: 2, armL: 0.5, armR: -0.5 },    // hurt
  ];
  const cv = createCanvas(FS * frames.length, FS);
  const ctx = cv.getContext('2d');
  frames.forEach((p, i) => drawCharacter(ctx, i * FS + FS / 2, FS / 2 + 4, p));
  writeFileSync(join(OUT, 'player.png'), cv.toBuffer('image/png'));
  console.log('  player.png', `${cv.width}x${cv.height}`);
}

/* ============================================================
   PROP / ITEM / ENEMY / UI SPRITES  ->  atlas.png + atlas.json
   ============================================================ */
const sprites = [];
const def = (name, w, h, draw) => sprites.push({ name, w, h, draw });

/* --- platforms / terrain --- */
def('platform', 110, 30, (ctx, w, h) => {
  rr(ctx, 1, 6, w - 2, h - 7, 8); outlined(ctx, C.dirt, 3);
  rr(ctx, 1, 1, w - 2, 12, 7); outlined(ctx, C.grass, 3);
  ctx.fillStyle = C.grassSh;
  for (let x = 8; x < w - 8; x += 16) { circle(ctx, x, 5, 2); ctx.fill(); }
});
def('ground', 64, 64, (ctx, w, h) => {
  rr(ctx, 1, 10, w - 2, h - 11, 6); outlined(ctx, C.dirt, 3);
  rr(ctx, 1, 1, w - 2, 16, 6); outlined(ctx, C.grass, 3);
  ctx.fillStyle = C.dirtSh;
  circle(ctx, 18, 34, 3); ctx.fill(); circle(ctx, 44, 46, 3.5); ctx.fill();
});
def('mud', 80, 40, (ctx, w, h) => {
  rr(ctx, 2, 8, w - 4, h - 9, 10); outlined(ctx, '#6d4c41', 3);
  ctx.fillStyle = '#8d6e63';
  for (let i = 0; i < 4; i++) { circle(ctx, 14 + i * 18, 18 + (i % 2) * 6, 4); ctx.fill(); }
  // bubbles
  ctx.fillStyle = '#a1887f'; circle(ctx, 24, 14, 3); ctx.fill(); circle(ctx, 52, 20, 2.5); ctx.fill();
});

/* --- goals --- */
def('door', 56, 74, (ctx, w, h) => {
  rr(ctx, 2, 6, w - 4, h - 7, 10); outlined(ctx, '#a1623c', 4);
  rr(ctx, 9, 13, w - 18, h - 20, 7); outlined(ctx, '#c98a5e', 3);
  circle(ctx, w - 16, h / 2, 3.5); outlined(ctx, C.gold, 2.5); // knob
  // arch shine
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff';
  rr(ctx, 13, 18, 8, h - 30, 4); ctx.fill(); ctx.restore();
});
def('flag', 50, 70, (ctx, w, h) => {
  ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(10, h - 4); ctx.stroke();
  ctx.fillStyle = '#9e9e9e'; circle(ctx, 10, h - 4, 5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13, 8); ctx.lineTo(w - 4, 18); ctx.lineTo(13, 30); ctx.closePath();
  outlined(ctx, '#f44336', 3);
  // checker
  ctx.fillStyle = '#fff';
  ctx.fillRect(20, 14, 6, 6); ctx.fillRect(32, 18, 6, 5);
});

/* --- collectibles --- */
def('star', 48, 48, (ctx, w, h) => {
  star(ctx, w / 2, h / 2, 20, 9); outlined(ctx, C.gold, 3.5);
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
  star(ctx, w / 2 - 3, h / 2 - 4, 8, 3.5); ctx.fill(); ctx.restore();
});
def('star_off', 48, 48, (ctx, w, h) => {
  star(ctx, w / 2, h / 2, 20, 9); outlined(ctx, '#cfd3d8', 3.5, '#9aa0a6');
});
def('coin', 42, 42, (ctx, w, h) => {
  circle(ctx, w / 2, h / 2, 18); outlined(ctx, C.gold, 3);
  circle(ctx, w / 2, h / 2, 12); outlined(ctx, C.goldSh, 2.5);
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; circle(ctx, w / 2 - 5, h / 2 - 6, 3); ctx.fill();
});
def('key', 46, 46, (ctx, w, h) => {
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.6);
  circle(ctx, -8, 0, 8); outlined(ctx, C.gold, 3);
  circle(ctx, -8, 0, 3.5); ctx.fillStyle = '#fff'; ctx.fill();
  rr(ctx, 0, -3, 18, 6, 2); outlined(ctx, C.gold, 3);
  rr(ctx, 14, 0, 4, 7, 1); outlined(ctx, C.gold, 2.5);
  ctx.restore();
});
def('shoe', 50, 40, (ctx, w, h) => {
  ctx.beginPath();
  ctx.moveTo(6, 26); ctx.lineTo(6, 14); ctx.quadraticCurveTo(8, 8, 18, 9);
  ctx.lineTo(26, 12); ctx.quadraticCurveTo(44, 14, 44, 26); ctx.lineTo(6, 26); ctx.closePath();
  outlined(ctx, '#ff5252', 3);
  rr(ctx, 4, 25, 42, 7, 3); outlined(ctx, '#fff', 2.5); // sole
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(18, 12); ctx.lineTo(22, 22); ctx.moveTo(25, 13); ctx.lineTo(28, 22); ctx.stroke();
});
def('watermelon', 50, 46, (ctx, w, h) => {
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 20, Math.PI, 0); ctx.closePath();
  outlined(ctx, '#66bb6a', 3);
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 15, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = '#ef5350'; ctx.fill();
  ctx.fillStyle = C.ink;
  for (const dx of [-8, 0, 8]) { circle(ctx, w / 2 + dx, h / 2 - 6, 1.6); ctx.fill(); }
  ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w / 2 - 20, h / 2); ctx.lineTo(w / 2 + 20, h / 2); ctx.stroke();
});
def('egg', 38, 46, (ctx, w, h) => {
  ctx.beginPath(); ctx.ellipse(w / 2, h / 2 + 2, 13, 17, 0, 0, Math.PI * 2); ctx.closePath();
  outlined(ctx, '#fff8e1', 3);
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(w / 2 - 4, h / 2 - 4, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
});
def('rock', 46, 40, (ctx, w, h) => {
  ctx.beginPath();
  ctx.moveTo(6, 32); ctx.lineTo(12, 14); ctx.lineTo(24, 8); ctx.lineTo(38, 16);
  ctx.lineTo(40, 32); ctx.closePath();
  outlined(ctx, '#90a4ae', 3);
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath(); ctx.moveTo(14, 16); ctx.lineTo(24, 11); ctx.lineTo(22, 22); ctx.closePath(); ctx.fill();
});

/* --- enemy --- */
def('chicken', 58, 56, (ctx, w, h) => {
  // body
  circle(ctx, w / 2, h / 2 + 4, 17); outlined(ctx, '#fff', 3);
  // head
  circle(ctx, w / 2 + 8, h / 2 - 12, 10); outlined(ctx, '#fff', 3);
  // comb
  ctx.fillStyle = '#ef5350';
  circle(ctx, w / 2 + 6, h / 2 - 22, 3); ctx.fill();
  circle(ctx, w / 2 + 11, h / 2 - 23, 3); ctx.fill();
  // beak
  ctx.beginPath(); ctx.moveTo(w / 2 + 17, h / 2 - 12); ctx.lineTo(w / 2 + 24, h / 2 - 10);
  ctx.lineTo(w / 2 + 17, h / 2 - 7); ctx.closePath(); outlined(ctx, '#ffb300', 2.5);
  // eye
  ctx.fillStyle = C.ink; circle(ctx, w / 2 + 10, h / 2 - 13, 2); ctx.fill();
  // wing
  ctx.fillStyle = '#eeeeee';
  ctx.beginPath(); ctx.ellipse(w / 2 - 3, h / 2 + 4, 8, 11, -0.3, 0, Math.PI * 2); outlined(ctx, '#eeeeee', 2.5);
  // legs
  ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(w / 2 - 4, h / 2 + 20); ctx.lineTo(w / 2 - 4, h - 3);
  ctx.moveTo(w / 2 + 6, h / 2 + 20); ctx.lineTo(w / 2 + 6, h - 3); ctx.stroke();
});

/* --- clown puzzle (level 3) --- */
def('clownhead', 130, 130, (ctx, w, h) => {
  circle(ctx, w / 2, h / 2, 56); outlined(ctx, '#fff3e0', 4);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffcc80';
  circle(ctx, w / 2 - 30, h / 2 - 12, 20); ctx.fill('evenodd'); circle(ctx, w / 2 + 30, h / 2 - 12, 20); ctx.fill(); ctx.restore();
});
def('p_nose', 48, 48, (ctx, w, h) => {
  circle(ctx, w / 2, h / 2, 18); outlined(ctx, '#ff5252', 3);
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; circle(ctx, w / 2 - 5, h / 2 - 5, 5); ctx.fill();
});
def('p_mouth', 58, 38, (ctx, w, h) => {
  ctx.beginPath(); ctx.arc(w / 2, 8, 22, 0.15, Math.PI - 0.15); ctx.closePath();
  outlined(ctx, '#e53935', 3);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(w / 2, 10, 14, 0.2, Math.PI - 0.2); ctx.fill();
});
def('p_bow', 60, 42, (ctx, w, h) => {
  ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(6, 6); ctx.lineTo(6, h - 6); ctx.closePath();
  outlined(ctx, '#ab47bc', 3);
  ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w - 6, 6); ctx.lineTo(w - 6, h - 6); ctx.closePath();
  outlined(ctx, '#ab47bc', 3);
  circle(ctx, w / 2, h / 2, 6); outlined(ctx, '#8e24aa', 3);
});
def('p_eye', 46, 46, (ctx, w, h) => {
  circle(ctx, w / 2, h / 2, 18); outlined(ctx, '#fff', 3);
  ctx.fillStyle = '#42a5f5'; circle(ctx, w / 2 + 2, h / 2, 8); ctx.fill();
  ctx.fillStyle = C.ink; circle(ctx, w / 2 + 2, h / 2, 4); ctx.fill();
  ctx.fillStyle = '#fff'; circle(ctx, w / 2 + 4, h / 2 - 2, 1.6); ctx.fill();
});

/* --- scenery --- */
def('cloud', 130, 66, (ctx, w, h) => {
  ctx.fillStyle = '#fff';
  circle(ctx, 36, 40, 24); ctx.fill();
  circle(ctx, 70, 30, 28); ctx.fill();
  circle(ctx, 100, 42, 22); ctx.fill();
  rr(ctx, 24, 40, 84, 22, 11); ctx.fill();
});
def('bush', 96, 58, (ctx, w, h) => {
  ctx.fillStyle = C.grass;
  circle(ctx, 26, 38, 20); ctx.fill(); circle(ctx, 52, 28, 24); ctx.fill();
  circle(ctx, 76, 38, 20); ctx.fill();
  ctx.fillStyle = C.grassSh; rr(ctx, 10, 40, 78, 16, 8); ctx.fill();
});
def('tree', 104, 134, (ctx, w, h) => {
  ctx.fillStyle = C.dirt; rr(ctx, w / 2 - 9, h - 50, 18, 50, 6); outlined(ctx, C.dirtSh, 3);
  ctx.fillStyle = C.grass;
  circle(ctx, w / 2 - 22, 50, 28); outlined(ctx, C.grassSh, 3);
  circle(ctx, w / 2 + 22, 50, 28); outlined(ctx, C.grassSh, 3);
  circle(ctx, w / 2, 34, 32); outlined(ctx, C.grassSh, 3);
});

/* --- fx + ui --- */
def('particle', 16, 16, (ctx, w, h) => {
  const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
def('sparkle', 28, 28, (ctx, w, h) => {
  star(ctx, w / 2, h / 2, 13, 3, 4); ctx.fillStyle = '#fff'; ctx.fill();
});
def('lock', 40, 44, (ctx, w, h) => {
  rr(ctx, 6, 18, w - 12, h - 22, 6); outlined(ctx, '#90a4ae', 3);
  ctx.beginPath(); ctx.arc(w / 2, 18, 9, Math.PI, 0); ctx.lineWidth = 4; ctx.strokeStyle = '#607d8b'; ctx.stroke();
  ctx.fillStyle = C.ink; circle(ctx, w / 2, 30, 3); ctx.fill();
});

/* --- shelf-pack the sprites into an atlas --- */
function buildAtlas() {
  const PAD = 2, MAXW = 1024;
  const items = [...sprites].sort((a, b) => b.h - a.h);
  let x = PAD, y = PAD, shelfH = 0, atlasW = 0;
  const placed = [];
  for (const s of items) {
    if (x + s.w + PAD > MAXW) { x = PAD; y += shelfH + PAD; shelfH = 0; }
    placed.push({ ...s, x, y });
    x += s.w + PAD; shelfH = Math.max(shelfH, s.h); atlasW = Math.max(atlasW, x);
  }
  const atlasH = y + shelfH + PAD;
  const W2 = 1 << Math.ceil(Math.log2(atlasW));
  const H2 = 1 << Math.ceil(Math.log2(atlasH));
  const cv = createCanvas(W2, H2);
  const ctx = cv.getContext('2d');
  const frames = {};
  for (const p of placed) {
    ctx.save(); ctx.translate(p.x, p.y); p.draw(ctx, p.w, p.h); ctx.restore();
    frames[p.name] = {
      frame: { x: p.x, y: p.y, w: p.w, h: p.h },
      rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: p.w, h: p.h },
      sourceSize: { w: p.w, h: p.h },
    };
  }
  writeFileSync(join(OUT, 'atlas.png'), cv.toBuffer('image/png'));
  writeFileSync(join(OUT, 'atlas.json'), JSON.stringify({
    frames, meta: { app: 'prank-island-gen', image: 'atlas.png', size: { w: W2, h: H2 }, scale: '1' },
  }, null, 0));
  console.log('  atlas.png', `${W2}x${H2}`, `(${placed.length} frames)`);
}

/* ============================================================
   BACKGROUNDS (parallax layers, per-zone tinting later)
   ============================================================ */
const BW = 1280, BH = 720;
function buildSky() {
  const cv = createCanvas(BW, BH); const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, BH);
  g.addColorStop(0, '#8fd3f4'); g.addColorStop(0.55, '#bfeaff'); g.addColorStop(1, '#eafbe7');
  ctx.fillStyle = g; ctx.fillRect(0, 0, BW, BH);
  // sun
  const sg = ctx.createRadialGradient(BW - 200, 150, 20, BW - 200, 150, 160);
  sg.addColorStop(0, 'rgba(255,236,160,0.95)'); sg.addColorStop(1, 'rgba(255,236,160,0)');
  ctx.fillStyle = sg; circle(ctx, BW - 200, 150, 160); ctx.fill();
  ctx.fillStyle = '#fff4c2'; circle(ctx, BW - 200, 150, 54); ctx.fill();
  writeFileSync(join(OUT, 'bg_sky.png'), cv.toBuffer('image/png'));
  console.log('  bg_sky.png', `${BW}x${BH}`);
}
function buildHills() {
  const cv = createCanvas(BW, 360); const ctx = cv.getContext('2d');
  // far hills
  ctx.fillStyle = '#aed581';
  ctx.beginPath(); ctx.moveTo(0, 360);
  for (let x = 0; x <= BW; x += 40) ctx.lineTo(x, 200 + Math.sin(x / 130) * 50);
  ctx.lineTo(BW, 360); ctx.closePath(); ctx.fill();
  // near hills
  ctx.fillStyle = '#9ccc65';
  ctx.beginPath(); ctx.moveTo(0, 360);
  for (let x = 0; x <= BW; x += 40) ctx.lineTo(x, 260 + Math.cos(x / 90) * 40);
  ctx.lineTo(BW, 360); ctx.closePath(); ctx.fill();
  writeFileSync(join(OUT, 'bg_hills.png'), cv.toBuffer('image/png'));
  console.log('  bg_hills.png', `${BW}x360`);
}

/* ---------- run ---------- */
console.log('Generating assets -> public/assets/');
buildCharacter();
buildAtlas();
buildSky();
buildHills();
console.log('Done.');
