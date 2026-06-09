/* ============================================================
   Game3D — a polished low-poly 3D vertical slice (three.js).
   Cute character runs around a colourful island, collects glowing
   gems, dodges nothing scary, reaches the portal. Soft shadows,
   tone-mapped lighting, camera follow, particles, touch + keys.
   ============================================================ */
import * as THREE from 'three';
import { Character3D } from './Character3D.js';
import { AudioManager } from '../core/AudioManager.js';

const ISLAND_R = 17;
const GRAV = 22, SPEED = 6.2, JUMP = 9.2;

export class Game3D {
  constructor() {
    this.clock = new THREE.Clock();
    this.input = { x: 0, z: 0, jump: false, jumpEdge: false };
    this.coins = [];
    this.particles = [];
    this.collected = 0;
    this.state = 'play';
    this._initRenderer();
    this._initScene();
    this._initLights();
    this._buildWorld();
    this._initCharacter();
    this._initInput();
    window.addEventListener('resize', () => this._resize());
    this._resize();
    this.renderer.setAnimationLoop(() => this._frame());
  }

  _initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    r.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('app').appendChild(r.domElement);
    this.renderer = r;
  }

  _initScene() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x8fd3f4);
    s.fog = new THREE.Fog(0xbfeaff, 28, 60);
    this.scene = s;
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    this.camera.position.set(0, 8, 12);
    this.camOffset = new THREE.Vector3(0, 7.5, 11);
  }

  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0xbfeaff, 0x6a9b4a, 0.95));
    const sun = new THREE.DirectionalLight(0xfff4d6, 2.0);
    sun.position.set(12, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 24;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
  }

  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.85, metalness: opts.m ?? 0, emissive: opts.e ?? 0, emissiveIntensity: opts.ei ?? 0, flatShading: opts.flat ?? false });
  }

  _buildWorld() {
    // island base
    const island = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R - 2, 3, 48), this._mat(0x8d6e63, { r: 1 }));
    island.position.y = -1.5; island.receiveShadow = true;
    this.scene.add(island);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R, 0.4, 48), this._mat(0x7cc44c));
    grass.position.y = 0.0; grass.receiveShadow = true;
    this.scene.add(grass);

    this.platforms = []; // one-way float platforms
    const addPlat = (x, z, r, h, color = 0x9ccc65) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 0.6, 24), this._mat(color));
      m.position.set(x, h, z); m.castShadow = true; m.receiveShadow = true;
      this.scene.add(m);
      this.platforms.push({ x, z, r, top: h + 0.3 });
    };
    addPlat(-6, -4, 1.8, 1.6);
    addPlat(-2.5, -8, 1.6, 3.0);
    addPlat(3, -7, 1.7, 2.2, 0xffb74d);

    // decorative low-poly trees, rocks, clouds
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, rr = 9 + Math.random() * 6;
      this._tree(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    for (let i = 0; i < 6; i++) this._cloud((Math.random() - 0.5) * 40, 10 + Math.random() * 6, (Math.random() - 0.5) * 40);

    // collectibles (glowing gems) — some on platforms
    const gemSpots = [[2, 2], [-3, 3], [5, -2], [-6, -4, 1.9], [-2.5, -8, 3.3], [3, -7, 2.5], [7, 4], [-8, 2]];
    const colors = [0xff5da2, 0x5ad1ff, 0xffd23f, 0x9b5cff, 0x76ff7a];
    gemSpots.forEach((g, i) => this._gem(g[0], g[2] !== undefined ? g[2] : 0.0, g[1], colors[i % colors.length]));
    this.totalGems = this.coins.length;

    // goal portal
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.18, 16, 40), this._mat(0xffd23f, { e: 0xffa000, ei: 0.8, m: 0.3, r: 0.4 }));
    ring.position.set(0, 1.7, -12); ring.castShadow = true;
    this.scene.add(ring); this.goal = ring;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    glow.position.copy(ring.position); this.scene.add(glow); this.goalGlow = glow;

    // particle pool
    const pgeo = new THREE.OctahedronGeometry(0.12);
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(pgeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 }));
      m.visible = false; this.scene.add(m);
      this.particles.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
    }
  }

  _tree(x, z) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 1.4, 8), this._mat(0x8d5a35));
    trunk.position.y = 0.7; trunk.castShadow = true;
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), this._mat(0x5fa336, { flat: true }));
    leaves.position.y = 2.0; leaves.castShadow = true;
    t.add(trunk, leaves); t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI; t.scale.setScalar(0.8 + Math.random() * 0.5);
    this.scene.add(t);
  }

  _cloud(x, y, z) {
    const c = new THREE.Group();
    const m = this._mat(0xffffff, { r: 1 });
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + Math.random() * 0.6, 0), m);
      s.position.set((i - 1.5) * 0.9, Math.random() * 0.3, Math.random() * 0.4);
      c.add(s);
    }
    c.position.set(x, y, z); c.scale.setScalar(1.4);
    c._drift = 0.3 + Math.random() * 0.4;
    this.scene.add(c); (this.clouds ||= []).push(c);
  }

  _gem(x, y, z, color) {
    const g = new THREE.Group();
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), this._mat(color, { e: color, ei: 0.5, m: 0.2, r: 0.25, flat: true }));
    gem.castShadow = true;
    g.add(gem);
    g.position.set(x, y + 1.1, z);
    g._base = g.position.y; g._spin = Math.random() * 6;
    this.scene.add(g);
    this.coins.push({ obj: g, color, taken: false });
  }

  _initCharacter() {
    this.char = new Character3D();
    this.char.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(this.char.root);
    this.pos = new THREE.Vector3(0, 0, 6);
    this.vel = new THREE.Vector3();
    this.onGround = true;
    this.squash = 1;
    this.char.root.position.copy(this.pos);
  }

  _initInput() {
    // keyboard
    this.keys = {};
    addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      AudioManager.unlock();
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    // touch joystick
    const joy = document.getElementById('joy'), knob = document.getElementById('knob');
    if (joy) {
      let id = null, cx = 0, cy = 0;
      const start = (e) => { const t = e.changedTouches ? e.changedTouches[0] : e; id = t.identifier ?? 'm'; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; AudioManager.unlock(); move(e); };
      const move = (e) => {
        const t = [...(e.changedTouches || [e])].find((p) => (p.identifier ?? 'm') === id); if (!t) return;
        let dx = t.clientX - cx, dy = t.clientY - cy; const max = 46, d = Math.hypot(dx, dy);
        if (d > max) { dx = dx / d * max; dy = dy / d * max; }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        this.input.x = dx / max; this.input.z = dy / max;
      };
      const end = () => { id = null; knob.style.transform = 'translate(0,0)'; this.input.x = 0; this.input.z = 0; };
      joy.addEventListener('touchstart', start, { passive: true });
      joy.addEventListener('touchmove', move, { passive: true });
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
    const jumpEdge = this.input.jumpEdge || (this.keys['Space'] && !this._spacePrev) || (this.keys['ArrowUp'] && !this._upPrev && false);
    this._spacePrev = this.keys['Space'];
    this.input.jumpEdge = false;
    return { x, z, jump: jumpEdge };
  }

  burst(pos, color) {
    let n = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      p.mesh.position.copy(pos); p.mesh.material.color.set(color); p.mesh.material.emissive.set(color);
      p.mesh.visible = true; p.life = 0.6 + Math.random() * 0.3;
      p.vel.set((Math.random() - 0.5) * 6, 3 + Math.random() * 4, (Math.random() - 0.5) * 6);
      if (++n >= 12) break;
    }
  }

  _supportY(x, z, prevY) {
    let gy = 0.0; // island top
    for (const p of this.platforms) {
      const dx = x - p.x, dz = z - p.z;
      if (dx * dx + dz * dz <= p.r * p.r && prevY >= p.top - 0.15) gy = Math.max(gy, p.top);
    }
    return gy;
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // animate ambient stuff
    (this.clouds || []).forEach((c) => { c.position.x += c._drift * dt; if (c.position.x > 24) c.position.x = -24; });
    this.coins.forEach((c) => { if (!c.taken) { c.obj.rotation.y += dt * 2; c.obj.position.y = c.obj._base + Math.sin(t * 2 + c.obj._spin) * 0.18; } });
    if (this.goal) { this.goal.rotation.z += dt * 1.2; this.goalGlow.material.opacity = 0.4 + Math.sin(t * 3) * 0.15; }
    // particles
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt; p.vel.y -= 14 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 6; p.mesh.scale.setScalar(Math.max(0.01, p.life));
      if (p.life <= 0) p.mesh.visible = false;
    }

    if (this.state === 'play') this._updatePlay(dt);
    else if (this.state === 'win') this.char.celebrate(dt, t);

    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _updatePlay(dt) {
    const c = this._readControls();
    const len = Math.hypot(c.x, c.z);
    const moving = len > 0.12;

    // horizontal velocity (world-aligned, camera looks down -z)
    let mx = c.x, mz = c.z;
    if (len > 1) { mx /= len; mz /= len; }
    this.vel.x = mx * SPEED; this.vel.z = mz * SPEED;

    // jump
    if (c.jump && this.onGround) { this.vel.y = JUMP; this.onGround = false; this.squash = 0.7; AudioManager.jump(); }

    // gravity
    this.vel.y -= GRAV * dt;

    const prevY = this.pos.y;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;

    // clamp to island
    const horiz = Math.hypot(this.pos.x, this.pos.z);
    if (horiz > ISLAND_R - 1) { const s = (ISLAND_R - 1) / horiz; this.pos.x *= s; this.pos.z *= s; }

    // ground / platform support
    const gy = this._supportY(this.pos.x, this.pos.z, prevY);
    if (this.pos.y <= gy && this.vel.y <= 0) {
      if (!this.onGround && prevY - gy > 0.05) { this.squash = 0.7; this.burst(new THREE.Vector3(this.pos.x, gy + 0.1, this.pos.z), 0xffffff); }
      this.pos.y = gy; this.vel.y = 0; this.onGround = true;
    } else if (this.pos.y > gy + 0.02) {
      this.onGround = false;
    }

    // apply to character + facing
    this.char.root.position.copy(this.pos);
    if (moving) this.char.facing = Math.atan2(this.vel.x, this.vel.z);
    this.squash += (1 - this.squash) * Math.min(1, dt * 10);
    this.char.root.scale.set(1 + (1 - this.squash) * 0.5, this.squash, 1 + (1 - this.squash) * 0.5);
    this.char.update(dt, { moving, onGround: this.onGround });

    this._checkPickups();
  }

  _checkPickups() {
    const p = this.pos;
    for (const c of this.coins) {
      if (c.taken) continue;
      const o = c.obj.position;
      if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 + (o.y - (p.y + 1)) ** 2 < 1.4) {
        c.taken = true; c.obj.visible = false;
        this.collected++;
        AudioManager.collect();
        this.burst(o.clone(), c.color);
        this._hud();
      }
    }
    // goal
    const g = this.goal.position;
    if (this.collected >= this.totalGems && (g.x - p.x) ** 2 + (g.z - p.z) ** 2 < 2.2) this._win();
  }

  _hud() {
    const el = document.getElementById('stars');
    if (el) el.textContent = `💎 ${this.collected} / ${this.totalGems}`;
    if (this.collected === this.totalGems) {
      const toast = document.getElementById('toast');
      if (toast) { toast.textContent = '✨ اذهب إلى البوابة الذهبية!'; toast.classList.add('show'); }
    }
  }

  _win() {
    if (this.state === 'win') return;
    this.state = 'win';
    AudioManager.win();
    for (let i = 0; i < 3; i++) this.burst(new THREE.Vector3(this.pos.x, this.pos.y + 1 + i * 0.5, this.pos.z), 0xffd23f);
    const w = document.getElementById('win'); if (w) w.classList.add('show');
  }

  restart() {
    this.coins.forEach((c) => { c.taken = false; c.obj.visible = true; });
    this.collected = 0; this.state = 'play';
    this.pos.set(0, 0, 6); this.vel.set(0, 0, 0); this.onGround = true;
    this._hud();
    const toast = document.getElementById('toast'); if (toast) toast.classList.remove('show');
    const w = document.getElementById('win'); if (w) w.classList.remove('show');
  }

  _updateCamera(dt) {
    const desired = new THREE.Vector3(this.pos.x * 0.5, this.pos.y + this.camOffset.y, this.pos.z + this.camOffset.z);
    this.camera.position.lerp(desired, Math.min(1, dt * 3));
    this.camera.lookAt(this.pos.x * 0.6, this.pos.y + 1.2, this.pos.z - 1.5);
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
}
