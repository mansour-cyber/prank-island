/* ============================================================
   Game3D — 3D gameplay engine (three.js).
   Challenge loop: collect every gem and reach the golden portal
   before the timer ends, while dodging patrolling hazards.
   Uses an animated GLB hero, soft shadows, follow camera,
   particles. UI is driven through callbacks (see main3d.js).
   ============================================================ */
import * as THREE from 'three';
import { Robot } from './Robot.js';
import { AudioManager } from '../core/AudioManager.js';
import { starsFor } from './levels3d.js';

const ISLAND_R = 17;
const GRAV = 22, SPEED = 6.4, JUMP = 9.4;

export class Game3D {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.clock = new THREE.Clock();
    this.input = { x: 0, z: 0, jump: false, jumpEdge: false };
    this.particles = [];
    this.dynamic = new THREE.Group();
    this.state = 'idle';
    this.gems = []; this.hazards = []; this.platforms = [];

    this._initRenderer();
    this._initScene();
    this._initLights();
    this._buildStaticWorld();
    this._initInput();
    addEventListener('resize', () => this._resize());
    this._resize();

    this.char = new Robot();
    this.loaded = this.char.load().then(() => {
      this.scene.add(this.char.root);
      this.pos = new THREE.Vector3(0, 0, 6);
      this.vel = new THREE.Vector3();
      this.onGround = true; this.squash = 1;
      this.char.root.position.copy(this.pos);
    });

    this.renderer.setAnimationLoop(() => this._frame());
  }

  /* ---------- setup ---------- */
  _initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    r.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('app').appendChild(r.domElement);
    this.renderer = r;
  }
  _initScene() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x8fd3f4);
    s.fog = new THREE.Fog(0xbfeaff, 30, 64);
    s.add(this.dynamic);
    this.scene = s;
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    this.camera.position.set(0, 9, 13);
    this.camOffset = new THREE.Vector3(0, 7.8, 11.5);
  }
  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0xbfeaff, 0x6a9b4a, 1.0));
    const sun = new THREE.DirectionalLight(0xfff4d6, 2.1);
    sun.position.set(12, 22, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 24; Object.assign(sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 64 });
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
  }
  _mat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 0, flatShading: o.flat ?? false }); }

  _buildStaticWorld() {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R - 2, 3, 48), this._mat(0x8d6e63, { r: 1 }));
    base.position.y = -1.5; base.receiveShadow = true; this.scene.add(base);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R, 0.4, 48), this._mat(0x7cc44c));
    grass.receiveShadow = true; this.scene.add(grass);

    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, rr = 10 + Math.random() * 5; this._tree(Math.cos(a) * rr, Math.sin(a) * rr); }
    this.clouds = [];
    for (let i = 0; i < 6; i++) this._cloud((Math.random() - 0.5) * 44, 11 + Math.random() * 6, (Math.random() - 0.5) * 44);

    const pgeo = new THREE.OctahedronGeometry(0.12);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(pgeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 }));
      m.visible = false; this.scene.add(m);
      this.particles.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
    }
  }
  _tree(x, z) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 1.4, 8), this._mat(0x8d5a35)); trunk.position.y = 0.7; trunk.castShadow = true;
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), this._mat(0x5fa336, { flat: true })); leaves.position.y = 2.0; leaves.castShadow = true;
    t.add(trunk, leaves); t.position.set(x, 0, z); t.rotation.y = Math.random() * Math.PI; t.scale.setScalar(0.8 + Math.random() * 0.5);
    this.scene.add(t);
  }
  _cloud(x, y, z) {
    const c = new THREE.Group(); const m = this._mat(0xffffff, { r: 1 });
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + Math.random() * 0.6, 0), m); s.position.set((i - 1.5) * 0.9, Math.random() * 0.3, Math.random() * 0.4); c.add(s); }
    c.position.set(x, y, z); c.scale.setScalar(1.4); c._drift = 0.3 + Math.random() * 0.4;
    this.scene.add(c); this.clouds.push(c);
  }

  /* ---------- level lifecycle ---------- */
  clearDynamic() {
    this.dynamic.clear();
    this.gems = []; this.hazards = []; this.platforms = [];
    this.goal = null; this.goalGlow = null;
  }

  loadLevel(cfg) {
    this.clearDynamic();
    this.cfg = cfg;
    this.timeMax = cfg.time; this.timeLeft = cfg.time;
    this.collected = 0; this.totalGems = cfg.gems;

    // platforms
    const pColors = [0x9ccc65, 0xffb74d, 0x80deea, 0xce93d8];
    for (let i = 0; i < cfg.platforms; i++) {
      const a = Math.random() * Math.PI * 2, rr = 4 + Math.random() * 8;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = 1.4 + Math.random() * 2.2, r = 1.5 + Math.random() * 0.6;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.6, 24), this._mat(pColors[i % pColors.length]));
      m.position.set(x, h, z); m.castShadow = true; m.receiveShadow = true; this.dynamic.add(m);
      this.platforms.push({ x, z, r, top: h + 0.3 });
    }

    // gems (some on platforms)
    const gemColors = [0xff5da2, 0x5ad1ff, 0xffd23f, 0x9b5cff, 0x76ff7a, 0xff9248];
    for (let i = 0; i < cfg.gems; i++) {
      let x, z, y = 0;
      if (i < this.platforms.length) { const p = this.platforms[i]; x = p.x; z = p.z; y = p.top; }
      else { const a = Math.random() * Math.PI * 2, rr = 2 + Math.random() * (ISLAND_R - 4); x = Math.cos(a) * rr; z = Math.sin(a) * rr; }
      this._gem(x, y, z, gemColors[i % gemColors.length]);
    }

    // hazards (patrolling bees)
    for (let i = 0; i < cfg.hazards; i++) {
      const a = Math.random() * Math.PI * 2, cr = 3 + Math.random() * 9;
      const cx = Math.cos(a) * cr, cz = Math.sin(a) * cr;
      if (cx * cx + cz * cz < 9) { i--; continue; } // keep clear of spawn-ish center
      this._hazard(cx, cz, 1.6 + Math.random() * 1.8, cfg.hazardSpeed * (Math.random() < 0.5 ? 1 : -1));
    }

    // portal
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.18, 16, 40), this._mat(0xffd23f, { e: 0xffa000, ei: 0.8, m: 0.3, r: 0.4 }));
    ring.position.set(0, 1.7, -13); ring.castShadow = true; this.dynamic.add(ring); this.goal = ring;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    glow.position.copy(ring.position); this.dynamic.add(glow); this.goalGlow = glow;

    // reset player
    this.pos.set(0, 0, 7); this.vel.set(0, 0, 0); this.onGround = true;
    this.char.root.position.copy(this.pos); this.char.facing = Math.PI; this.char.root.rotation.y = Math.PI;
    this.char.emote('Idle');
    this.invuln = 1.4;
    this.state = 'play';
    this._hud();
  }

  _gem(x, y, z, color) {
    const g = new THREE.Group();
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), this._mat(color, { e: color, ei: 0.5, m: 0.2, r: 0.25, flat: true }));
    gem.castShadow = true; g.add(gem);
    g.position.set(x, y + 1.1, z); g._base = g.position.y; g._spin = Math.random() * 6;
    this.dynamic.add(g); this.gems.push({ obj: g, color, taken: false });
  }

  _hazard(cx, cz, r, spd) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), this._mat(0xffca28, { e: 0x6d4c00, ei: 0.2 }));
    body.castShadow = true;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 20), this._mat(0x3a2c28)); stripe.rotation.x = Math.PI / 2;
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    const wL = wing.clone(); wL.position.set(-0.32, 0.2, 0); const wR = wing.clone(); wR.position.set(0.32, 0.2, 0);
    g.add(body, stripe, wL, wR);
    g.position.set(cx + r, 1.1, cz);
    this.dynamic.add(g);
    this.hazards.push({ obj: g, cx, cz, r, ang: 0, spd, y: 1.0 + Math.random() * 0.6 });
  }

  /* ---------- input ---------- */
  _initInput() {
    this.keys = {};
    addEventListener('keydown', (e) => { this.keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); AudioManager.unlock(); });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    const joy = document.getElementById('joy'), knob = document.getElementById('knob');
    if (joy) {
      let id = null, cx = 0, cy = 0;
      const start = (e) => { const t = e.changedTouches ? e.changedTouches[0] : e; id = t.identifier ?? 'm'; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; AudioManager.unlock(); move(e); };
      const move = (e) => { const t = [...(e.changedTouches || [e])].find((p) => (p.identifier ?? 'm') === id); if (!t) return; let dx = t.clientX - cx, dy = t.clientY - cy; const max = 46, d = Math.hypot(dx, dy); if (d > max) { dx = dx / d * max; dy = dy / d * max; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.input.x = dx / max; this.input.z = dy / max; };
      const end = () => { id = null; knob.style.transform = 'translate(0,0)'; this.input.x = 0; this.input.z = 0; };
      joy.addEventListener('touchstart', start, { passive: true }); joy.addEventListener('touchmove', move, { passive: true });
      joy.addEventListener('touchend', end); joy.addEventListener('touchcancel', end);
      joy.addEventListener('mousedown', (e) => { start(e); const mm = (ev) => move(ev), mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); }; addEventListener('mousemove', mm); addEventListener('mouseup', mu); });
    }
    const jb = document.getElementById('jumpBtn');
    if (jb) {
      const press = (e) => { e.preventDefault(); if (!this.input.jump) this.input.jumpEdge = true; this.input.jump = true; AudioManager.unlock(); };
      const rel = () => { this.input.jump = false; };
      jb.addEventListener('touchstart', press, { passive: false }); jb.addEventListener('touchend', rel);
      jb.addEventListener('mousedown', press); jb.addEventListener('mouseup', rel);
    }
  }
  _readControls() {
    let x = this.input.x, z = this.input.z;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) x = -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) x = 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) z = -1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) z = 1;
    const jump = this.input.jumpEdge || (this.keys['Space'] && !this._sp);
    this._sp = this.keys['Space']; this.input.jumpEdge = false;
    return { x, z, jump };
  }

  burst(pos, color) {
    let n = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      p.mesh.position.copy(pos); p.mesh.material.color.set(color); p.mesh.material.emissive.set(color);
      p.mesh.visible = true; p.life = 0.6 + Math.random() * 0.3;
      p.vel.set((Math.random() - 0.5) * 6, 3 + Math.random() * 4, (Math.random() - 0.5) * 6);
      if (++n >= 14) break;
    }
  }

  _supportY(x, z, prevY) {
    let gy = 0.0;
    for (const p of this.platforms) { const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz <= p.r * p.r && prevY >= p.top - 0.15) gy = Math.max(gy, p.top); }
    return gy;
  }

  /* ---------- loop ---------- */
  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    (this.clouds || []).forEach((c) => { c.position.x += c._drift * dt; if (c.position.x > 26) c.position.x = -26; });
    this.gems.forEach((c) => { if (!c.taken) { c.obj.rotation.y += dt * 2; c.obj.position.y = c.obj._base + Math.sin(t * 2 + c.obj._spin) * 0.18; } });
    if (this.goal) { this.goal.rotation.z += dt * 1.2; this.goalGlow.material.opacity = 0.4 + Math.sin(t * 3) * 0.15; }
    for (const p of this.particles) { if (p.life <= 0) continue; p.life -= dt; p.vel.y -= 14 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.rotation.x += dt * 6; p.mesh.scale.setScalar(Math.max(0.01, p.life)); if (p.life <= 0) p.mesh.visible = false; }

    this.char?.update(dt);

    if (this.state === 'play') this._updatePlay(dt, t);
    else if (this.state === 'win') { this.char?.emote('Wave'); }
    else if (this.state === 'lose') { this.char?.emote('Death'); }

    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _updatePlay(dt, t) {
    if (!this.char?.ready) return;
    // timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this._hud(); return this._lose('انتهى الوقت!'); }
    this._hud();
    if (this.invuln > 0) this.invuln -= dt;

    // hazards
    for (const h of this.hazards) {
      h.ang += h.spd * dt;
      h.obj.position.set(h.cx + Math.cos(h.ang) * h.r, h.y + Math.sin(t * 3 + h.cx) * 0.15, h.cz + Math.sin(h.ang) * h.r);
      h.obj.rotation.y = -h.ang;
      if (this.invuln <= 0) {
        const dx = h.obj.position.x - this.pos.x, dz = h.obj.position.z - this.pos.z, dy = h.obj.position.y - (this.pos.y + 0.9);
        if (dx * dx + dz * dz + dy * dy < 1.1) return this._lose('اصطدمت بالنحلة!');
      }
    }

    // movement
    const c = this._readControls();
    const len = Math.hypot(c.x, c.z); const moving = len > 0.14;
    let mx = c.x, mz = c.z; if (len > 1) { mx /= len; mz /= len; }
    this.vel.x = mx * SPEED; this.vel.z = mz * SPEED;
    if (c.jump && this.onGround) { this.vel.y = JUMP; this.onGround = false; this.squash = 0.7; this.char.jump(); AudioManager.jump(); }
    this.vel.y -= GRAV * dt;

    const prevY = this.pos.y;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;
    const horiz = Math.hypot(this.pos.x, this.pos.z);
    if (horiz > ISLAND_R - 1) { const s = (ISLAND_R - 1) / horiz; this.pos.x *= s; this.pos.z *= s; }

    const gy = this._supportY(this.pos.x, this.pos.z, prevY);
    if (this.pos.y <= gy && this.vel.y <= 0) {
      if (!this.onGround && prevY - gy > 0.05) { this.squash = 0.75; this.burst(new THREE.Vector3(this.pos.x, gy + 0.1, this.pos.z), 0xffffff); }
      this.pos.y = gy; this.vel.y = 0; this.onGround = true;
    } else if (this.pos.y > gy + 0.02) this.onGround = false;

    this.char.root.position.copy(this.pos);
    if (moving) this.char.facing = Math.atan2(this.vel.x, this.vel.z);
    this.squash += (1 - this.squash) * Math.min(1, dt * 10);
    this.char.root.scale.set(1 + (1 - this.squash) * 0.4, this.squash, 1 + (1 - this.squash) * 0.4);
    this.char.setLocomotion(moving, this.onGround);

    this._checkPickups();
  }

  _checkPickups() {
    const p = this.pos;
    for (const c of this.gems) {
      if (c.taken) continue;
      const o = c.obj.position;
      if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 + (o.y - (p.y + 1)) ** 2 < 1.5) {
        c.taken = true; c.obj.visible = false; this.collected++;
        AudioManager.collect(); this.burst(o.clone(), c.color); this._hud();
        if (this.collected === this.totalGems) this.cb.onToast?.('✨ اذهب إلى البوابة الذهبية!');
      }
    }
    const g = this.goal.position;
    if (this.collected >= this.totalGems && (g.x - p.x) ** 2 + (g.z - p.z) ** 2 < 2.4) this._win();
  }

  _win() {
    if (this.state !== 'play') return;
    this.state = 'win';
    const stars = starsFor(this.timeLeft, this.timeMax);
    const score = this.collected * 100 + Math.round(this.timeLeft * 10);
    AudioManager.win();
    for (let i = 0; i < 3; i++) this.burst(new THREE.Vector3(this.pos.x, this.pos.y + 1 + i * 0.5, this.pos.z), 0xffd23f);
    this.cb.onWin?.({ stars, score, timeLeft: Math.ceil(this.timeLeft) });
  }
  _lose(reason) {
    if (this.state !== 'play') return;
    this.state = 'lose';
    AudioManager.fail();
    this.cb.onLose?.(reason);
  }

  _hud() { this.cb.onHud?.({ level: (this.cfg?.index ?? 0) + 1, name: this.cfg?.name, gems: this.collected, total: this.totalGems, time: Math.ceil(this.timeLeft) }); }

  _updateCamera(dt) {
    const px = this.pos?.x ?? 0, py = this.pos?.y ?? 0, pz = this.pos?.z ?? 0;
    const desired = new THREE.Vector3(px * 0.5, py + this.camOffset.y, pz + this.camOffset.z);
    this.camera.position.lerp(desired, Math.min(1, dt * 3));
    this.camera.lookAt(px * 0.6, py + 1.2, pz - 1.5);
  }
  _resize() { const w = innerWidth, h = innerHeight; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
}
