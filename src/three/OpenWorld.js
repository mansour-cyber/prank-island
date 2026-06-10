/* ============================================================
   OpenWorld — free-roam 3D town (three.js).
   Addresses kid feedback: closer camera + zoom, a bigger detailed
   world, enterable houses, a drivable car and a rideable camel,
   plus a simple flyable plane. Saudi-flavoured low-poly town.
   Reuses the animated GLB hero (Robot).
   ============================================================ */
import * as THREE from 'three';
import { Robot } from './Robot.js';
import { AudioManager } from '../core/AudioManager.js';
import { Profiles } from './profiles.js';

const HALF = 46;            // world half-size
const GRAV = 24, SPEED = 7, JUMP = 9.5;

export class OpenWorld {
  constructor(cb = {}) {
    this.cb = cb;
    this.clock = new THREE.Clock();
    this.input = { x: 0, z: 0, jump: false, jumpHeld: false, jumpEdge: false };
    this.solids = [];        // AABBs for collision {minx,maxx,minz,maxz}
    this.coins = [];
    this.vehicles = [];
    this.particles = [];
    this.mode = 'foot';      // foot | car | camel | plane
    this.vehicle = null;
    this.zoom = 1;
    this.coinCount = 0;

    this._initRenderer(); this._initScene(); this._initLights();
    this._buildGround(); this._buildTown(); this._buildVehicles(); this._scatterCoins(28);
    this._initInput();
    addEventListener('resize', () => this._resize()); this._resize();

    this.hero = new Robot();
    this.loaded = this.hero.load().then(() => {
      this.scene.add(this.hero.root);
      this.pos = new THREE.Vector3(0, 0, 8); this.vel = new THREE.Vector3();
      this.onGround = true; this.hero.root.position.copy(this.pos);
      this.target = this.hero.root;
    });
    this.renderer.setAnimationLoop(() => this._frame());
  }

  _initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    r.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('app').appendChild(r.domElement);
    this.renderer = r; this.canvas = r.domElement;
  }
  _initScene() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x9fd6f4);
    s.fog = new THREE.Fog(0xcdeafe, 55, 110);
    this.scene = s;
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);
    this.camera.position.set(0, 6, 12);
  }
  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0xdff1ff, 0x6f9b54, 1.0));
    const sun = new THREE.DirectionalLight(0xfff3d4, 2.1);
    sun.position.set(30, 44, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 60; Object.assign(sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 140 });
    sun.shadow.bias = -0.0004; this.scene.add(sun);
  }
  _mat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.9, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 0, flatShading: o.flat ?? false }); }

  _box(x, y, z, w, h, d, color, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this._mat(color, opts));
    m.position.set(x, y, z); m.castShadow = opts.cast !== false; m.receiveShadow = true;
    this.scene.add(m);
    if (opts.solid) this.solids.push({ minx: x - w / 2, maxx: x + w / 2, minz: z - d / 2, maxz: z + d / 2 });
    return m;
  }

  _buildGround() {
    const grass = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2, 1, HALF * 2), this._mat(0x86c659));
    grass.position.y = -0.5; grass.receiveShadow = true; this.scene.add(grass);
    // road cross
    const road = this._mat(0x6d6f73, { r: 1 });
    const rx = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2, 0.12, 8), road); rx.position.set(0, 0.02, 0); rx.receiveShadow = true; this.scene.add(rx);
    const rz = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, HALF * 2), road); rz.position.set(0, 0.02, 0); rz.receiveShadow = true; this.scene.add(rz);
    // road dashes
    for (let i = -HALF + 4; i < HALF; i += 6) {
      this._box(i, 0.1, 0, 2, 0.06, 0.5, 0xffe082, { cast: false });
      this._box(0, 0.1, i, 0.5, 0.06, 2, 0xffe082, { cast: false });
    }
  }

  _palm(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 3.4, 8), this._mat(0xae7c4f)); trunk.position.y = 1.7; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 5), this._mat(0x4fa83a, { flat: true }));
      f.position.set(0, 3.4, 0); f.rotation.z = Math.PI / 2.6; f.rotation.y = (i / 6) * Math.PI * 2; f.castShadow = true; g.add(f);
    }
    g.position.set(x, 0, z); this.scene.add(g);
    this.solids.push({ minx: x - 0.3, maxx: x + 0.3, minz: z - 0.3, maxz: z + 0.3 });
  }

  _lamp(x, z) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), this._mat(0x455a64)).translateY(1.5));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), this._mat(0xfff59d, { e: 0xffe082, ei: 0.7 })); head.position.y = 3; g.add(head);
    g.position.set(x, 0, z); g.children.forEach(c => c.castShadow = true); this.scene.add(g);
  }

  /* a house: box body + pyramid roof + door + windows.
     enterable -> hollow with wall segments (collision) and a door gap. */
  _house(x, z, color, enterable = false, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; this.scene.add(g);
    const W = 7, D = 7, H = 3.4, t = 0.3;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.82, 2.6, 4), this._mat(color === 0xffffff ? 0xc0563b : 0xb5482f, { flat: true }));
    roof.position.y = H + 1.3; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);

    const wallMat = this._mat(color);
    const addWall = (lx, lz, lw, ld) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(lw, H, ld), wallMat);
      m.position.set(lx, H / 2, lz); m.castShadow = true; m.receiveShadow = true; g.add(m);
      // world-space AABB (rotation 0 or 90 handled approximately via swap)
      const c = Math.cos(rot), s = Math.sin(rot);
      const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
      const ww = Math.abs(lw * c) + Math.abs(ld * s), wd = Math.abs(lw * s) + Math.abs(ld * c);
      this.solids.push({ minx: wx - ww / 2, maxx: wx + ww / 2, minz: wz - wd / 2, maxz: wz + wd / 2 });
    };
    if (enterable) {
      addWall(0, -D / 2, W, t);                 // back
      addWall(-W / 2, 0, t, D);                 // left
      addWall(W / 2, 0, t, D);                  // right
      addWall(-(W / 2 - 1.25), D / 2, 2.5, t);  // front-left
      addWall(W / 2 - 1.25, D / 2, 2.5, t);     // front-right
      // floor + simple furniture
      const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), this._mat(0xd7b899)); floor.position.y = 0.05; floor.receiveShadow = true; g.add(floor);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.4), this._mat(0x8e6fd8)); bed.position.set(-1.6, 0.4, -1.6); bed.castShadow = true; g.add(bed);
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.8, 12), this._mat(0xb98a5a)); table.position.set(1.6, 0.4, -1.4); table.castShadow = true; g.add(table);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), this._mat(0xfff3b0, { e: 0xffe082, ei: 0.8 })); lamp.position.set(1.6, 1.2, -1.4); g.add(lamp);
      // doormat marker
      const mat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 1), this._mat(0x66bb6a)); mat.position.set(0, 0.06, D / 2 + 0.4); g.add(mat);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat); body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.1), this._mat(0x6d4c41)); door.position.set(0, 1.1, D / 2 + 0.01); g.add(door);
      const win = this._mat(0x9fe0ff, { e: 0x4fc3f7, ei: 0.3 });
      for (const sx of [-2, 2]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), win); w.position.set(sx, 2, D / 2 + 0.01); g.add(w); }
      this.solids.push({ minx: x - W / 2, maxx: x + W / 2, minz: z - D / 2, maxz: z + D / 2 });
    }
  }

  _buildTown() {
    // houses around the cross, leaving roads clear
    const palette = [0xffd9a0, 0xffffff, 0xc8e6c9, 0xffe0b2, 0xd1c4e9, 0xb3e5fc];
    const spots = [
      [-16, -14, true, 0], [16, -14, false, 0], [-28, -14, false, 0], [28, -16, false, 0],
      [-16, 14, false, 0], [18, 16, true, 0], [-30, 14, false, 0], [30, 14, false, 0],
      [-16, -30, false, 0], [16, -30, false, 0], [-16, 30, false, 0], [16, 30, false, 0],
    ];
    spots.forEach((s, i) => this._house(s[0], s[1], palette[i % palette.length], s[2], s[3]));

    // palms + lamps along roads
    for (let i = -40; i <= 40; i += 10) { if (Math.abs(i) > 5) { this._palm(i, 6); this._palm(i, -6); this._palm(6, i); this._palm(-6, i); } }
    for (let i = -36; i <= 36; i += 18) { this._lamp(5, i); this._lamp(-5, i); }

    // central plaza fountain
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.6, 20), this._mat(0xb0bec5)); base.position.y = 0.3; base.receiveShadow = true; base.castShadow = true; this.scene.add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.3, 20), this._mat(0x4fc3f7, { e: 0x29b6f6, ei: 0.3 })); water.position.y = 0.6; this.scene.add(water);
    this.solids.push({ minx: -2.6, maxx: 2.6, minz: -2.6, maxz: 2.6 });
  }

  /* ---------------- vehicles ---------------- */
  _buildVehicles() {
    this.car = this._makeCar(-12, 2);
    this.camel = this._makeCamel(12, 4);
    this.plane = this._makePlane(0, -26);
    this.vehicles = [this.car, this.camel, this.plane];
  }

  _makeCar(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4), this._mat(0xe53935, { r: 0.5, m: 0.2 })); body.position.y = 0.7; body.castShadow = true; g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2), this._mat(0x90caf9, { r: 0.3, m: 0.3 })); cabin.position.set(0, 1.25, -0.1); cabin.castShadow = true; g.add(cabin);
    const wheels = [];
    for (const wx of [-1, 1]) for (const wz of [-1.3, 1.3]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 14), this._mat(0x222222)); w.rotation.z = Math.PI / 2; w.position.set(wx * 1.05, 0.45, wz); g.add(w); wheels.push(w);
    }
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'car', group: g, wheels, label: '🚗 اركب السيارة', heading: 0, speed: 12, camOff: new THREE.Vector3(0, 5.5, 10), seatY: 1.6 };
  }

  _makeCamel(x, z) {
    const g = new THREE.Group();
    const tan = this._mat(0xc9a06a, { flat: true });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.6, 6, 12), tan); body.rotation.z = Math.PI / 2; body.position.y = 1.7; body.castShadow = true; g.add(body);
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), tan); hump.position.set(0, 2.2, 0); hump.castShadow = true; g.add(hump);
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.2, 4, 8), tan); neck.position.set(0, 2.4, 1.3); neck.rotation.x = 0.7; neck.castShadow = true; g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.9), tan); head.position.set(0, 3.0, 1.9); head.castShadow = true; g.add(head);
    const legs = [];
    for (const lx of [-0.45, 0.45]) for (const lz of [-0.8, 0.9]) {
      const leg = new THREE.Group(); leg.position.set(lx, 1.4, lz);
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.2, 4, 6), tan); m.position.y = -0.7; m.castShadow = true; leg.add(m); g.add(leg); legs.push(leg);
    }
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'camel', group: g, legs, label: '🐪 اركب البعير', heading: 0, speed: 5.5, phase: 0, camOff: new THREE.Vector3(0, 6, 11), seatY: 2.9 };
  }

  _makePlane(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 3, 6, 12), this._mat(0xfafafa, { m: 0.2, r: 0.4 })); body.rotation.x = Math.PI / 2; body.position.y = 1.4; body.castShadow = true; g.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 1.2), this._mat(0xef5350)); wing.position.y = 1.5; wing.castShadow = true; g.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.8), this._mat(0xef5350)); tail.position.set(0, 1.7, -1.7); g.add(tail);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.8), this._mat(0xef5350)); fin.position.set(0, 2.0, -1.7); g.add(fin);
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), this._mat(0x333333)); prop.position.set(0, 1.4, 1.7); g.add(prop);
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'plane', group: g, prop, label: '✈️ اركب الطيارة', heading: 0, speed: 16, alt: 0, camOff: new THREE.Vector3(0, 7, 14), seatY: 1.6 };
  }

  _scatterCoins(n) {
    const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 18);
    const mat = this._mat(0xffd23f, { e: 0xffb300, ei: 0.5, m: 0.4, r: 0.3 });
    for (let i = 0; i < n; i++) {
      let x, z, ok = false, tries = 0;
      while (!ok && tries++ < 30) { x = (Math.random() - 0.5) * HALF * 1.7; z = (Math.random() - 0.5) * HALF * 1.7; ok = !this._hitSolid(x, z, 0.6); }
      const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.position.set(x, 1, z); m.castShadow = true; this.scene.add(m);
      this.coins.push({ obj: m, taken: false, ph: Math.random() * 6 });
    }
    // particle pool
    const pgeo = new THREE.OctahedronGeometry(0.12);
    for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(pgeo, new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 0.6 })); m.visible = false; this.scene.add(m); this.particles.push({ mesh: m, life: 0, vel: new THREE.Vector3() }); }
  }

  /* ---------------- collision ---------------- */
  _hitSolid(x, z, r) { for (const s of this.solids) { if (x + r > s.minx && x - r < s.maxx && z + r > s.minz && z - r < s.maxz) return s; } return null; }
  _resolve(p, r) {
    for (const s of this.solids) {
      if (p.x + r > s.minx && p.x - r < s.maxx && p.z + r > s.minz && p.z - r < s.maxz) {
        const dl = p.x + r - s.minx, dr = s.maxx - (p.x - r), dt = p.z + r - s.minz, db = s.maxz - (p.z - r);
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) p.x = s.minx - r; else if (m === dr) p.x = s.maxx + r; else if (m === dt) p.z = s.minz - r; else p.z = s.maxz + r;
      }
    }
    p.x = Math.max(-HALF + 1, Math.min(HALF - 1, p.x));
    p.z = Math.max(-HALF + 1, Math.min(HALF - 1, p.z));
  }

  /* ---------------- input ---------------- */
  _initInput() {
    this.keys = {};
    addEventListener('keydown', (e) => { this.keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); if (e.code === 'KeyE') this.interact(); AudioManager.unlock(); });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    const joy = document.getElementById('joy'), knob = document.getElementById('knob');
    if (joy) {
      let id = null, cx = 0, cy = 0;
      const start = (e) => { const t = e.changedTouches ? e.changedTouches[0] : e; id = t.identifier ?? 'm'; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; AudioManager.unlock(); mv(e); };
      const mv = (e) => { const t = [...(e.changedTouches || [e])].find((p) => (p.identifier ?? 'm') === id); if (!t) return; let dx = t.clientX - cx, dy = t.clientY - cy; const M = 46, d = Math.hypot(dx, dy); if (d > M) { dx = dx / d * M; dy = dy / d * M; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.input.x = dx / M; this.input.z = dy / M; };
      const end = () => { id = null; knob.style.transform = 'translate(0,0)'; this.input.x = 0; this.input.z = 0; };
      joy.addEventListener('touchstart', start, { passive: true }); joy.addEventListener('touchmove', mv, { passive: true }); joy.addEventListener('touchend', end); joy.addEventListener('touchcancel', end);
      joy.addEventListener('mousedown', (e) => { start(e); const mm = (ev) => mv(ev), mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); }; addEventListener('mousemove', mm); addEventListener('mouseup', mu); });
    }
    const jb = document.getElementById('jumpBtn');
    if (jb) {
      const press = (e) => { e.preventDefault(); if (!this.input.jumpHeld) this.input.jumpEdge = true; this.input.jumpHeld = true; AudioManager.unlock(); };
      const rel = () => { this.input.jumpHeld = false; };
      jb.addEventListener('touchstart', press, { passive: false }); jb.addEventListener('touchend', rel); jb.addEventListener('mousedown', press); jb.addEventListener('mouseup', rel);
    }
    document.getElementById('interactBtn')?.addEventListener('click', () => this.interact());
    document.getElementById('zoomIn')?.addEventListener('click', () => this._zoom(-0.2));
    document.getElementById('zoomOut')?.addEventListener('click', () => this._zoom(0.2));
    // wheel + pinch zoom
    this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this._zoom(e.deltaY > 0 ? 0.12 : -0.12); }, { passive: false });
    let pinch = 0;
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinch) this._zoom((pinch - d) * 0.01); pinch = d;
      }
    }, { passive: true });
    this.canvas.addEventListener('touchend', () => { pinch = 0; });
  }
  _zoom(d) { this.zoom = Math.max(0.55, Math.min(2.2, this.zoom + d)); }

  _readMove() {
    let x = this.input.x, z = this.input.z;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) x = -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) x = 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) z = -1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) z = 1;
    const jumpEdge = this.input.jumpEdge || (this.keys['Space'] && !this._sp); this._sp = this.keys['Space']; this.input.jumpEdge = false;
    const jumpHeld = this.input.jumpHeld || this.keys['Space'];
    return { x, z, jumpEdge, jumpHeld };
  }

  /* ---------------- interaction ---------------- */
  interact() {
    if (this.mode !== 'foot') { this._dismount(); return; }
    if (this._near) this._mount(this._near);
  }
  _mount(v) {
    this.mode = v.type; this.vehicle = v;
    this.hero.root.visible = v.type === 'camel'; // hero sits visibly on camel
    AudioManager.boop();
    this.cb.onInteract?.('انزل 🔻');
  }
  _dismount() {
    const v = this.vehicle; if (!v) return;
    const side = new THREE.Vector3(Math.cos(v.heading), 0, -Math.sin(v.heading)).multiplyScalar(2.4);
    this.pos.set(v.group.position.x + side.x, 0, v.group.position.z + side.z);
    this.vel.set(0, 0, 0); this.onGround = true;
    this.hero.root.visible = true; this.hero.root.position.copy(this.pos);
    this.mode = 'foot'; this.vehicle = null; this.target = this.hero.root;
    AudioManager.boop();
  }

  burst(p) { let n = 0; for (const q of this.particles) { if (q.life > 0) continue; q.mesh.position.copy(p); q.mesh.visible = true; q.life = 0.6; q.vel.set((Math.random() - 0.5) * 5, 3 + Math.random() * 3, (Math.random() - 0.5) * 5); if (++n >= 8) break; } }

  /* ---------------- loop ---------------- */
  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05); const t = this.clock.elapsedTime;
    this.hero?.update(dt);
    if (this.car) this.car.wheels.forEach(w => { if (this.mode === 'car') w.rotation.x += dt * 12; });
    if (this.plane) this.plane.prop.rotation.z += dt * (this.mode === 'plane' ? 40 : 6);
    this.coins.forEach(c => { if (!c.taken) { c.obj.rotation.z += dt * 3; c.obj.position.y = 1 + Math.sin(t * 2 + c.ph) * 0.15; } });
    for (const p of this.particles) { if (p.life <= 0) continue; p.life -= dt; p.vel.y -= 12 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.scale.setScalar(Math.max(0.01, p.life)); if (p.life <= 0) p.mesh.visible = false; }

    if (this.target) {
      if (this.mode === 'foot') this._updateFoot(dt);
      else this._updateVehicle(dt);
      this._proximity();
      this._coins();
      this._updateCamera(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _updateFoot(dt) {
    const c = this._readMove(); const len = Math.hypot(c.x, c.z); const moving = len > 0.14;
    let mx = c.x, mz = c.z; if (len > 1) { mx /= len; mz /= len; }
    this.vel.x = mx * SPEED; this.vel.z = mz * SPEED;
    if (c.jumpEdge && this.onGround) { this.vel.y = JUMP; this.onGround = false; this.hero.jump(); AudioManager.jump(); }
    this.vel.y -= GRAV * dt;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;
    if (this.pos.y <= 0) { this.pos.y = 0; this.vel.y = 0; this.onGround = true; }
    this._resolve(this.pos, 0.45);
    this.hero.root.position.copy(this.pos);
    if (moving) this.hero.facing = Math.atan2(this.vel.x, this.vel.z);
    this.hero.setLocomotion(moving, this.onGround);
  }

  _updateVehicle(dt) {
    const v = this.vehicle, c = this._readMove();
    const len = Math.hypot(c.x, c.z); const moving = len > 0.14;
    let mx = c.x, mz = c.z; if (len > 1) { mx /= len; mz /= len; }
    const g = v.group;
    if (v.type === 'plane') {
      g.position.x += mx * v.speed * dt; g.position.z += mz * v.speed * dt;
      if (c.jumpHeld) v.alt += 9 * dt; v.alt -= 5 * dt; v.alt = Math.max(0, Math.min(22, v.alt));
      g.position.y = v.alt;
      if (moving) { v.heading = Math.atan2(mx, mz); g.rotation.y = v.heading; g.rotation.z = -mx * 0.3; g.rotation.x = mz * 0.15; }
      else { g.rotation.z *= 0.9; g.rotation.x *= 0.9; }
    } else {
      g.position.x += mx * v.speed * dt; g.position.z += mz * v.speed * dt;
      this._resolve(g.position, 1.3);
      if (moving) { v.heading = Math.atan2(mx, mz); g.rotation.y = v.heading; }
      if (v.type === 'camel') { v.phase += dt * (moving ? 8 : 2); g.position.y = Math.abs(Math.sin(v.phase)) * 0.12; v.legs.forEach((lg, i) => lg.rotation.x = Math.sin(v.phase + i * 1.6) * (moving ? 0.5 : 0)); }
    }
    // hero sits on camel
    if (v.type === 'camel') { this.hero.root.position.set(g.position.x, g.position.y + 1.9, g.position.z); this.hero.root.rotation.y = v.heading; this.hero.setLocomotion(false, true); }
  }

  _proximity() {
    if (this.mode !== 'foot') { this.cb.onProximity?.('انزل 🔻'); return; }
    let best = null, bd = 22;
    for (const v of this.vehicles) { const dx = v.group.position.x - this.pos.x, dz = v.group.position.z - this.pos.z; const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = v; } }
    this._near = best;
    this.cb.onProximity?.(best ? best.label : null);
  }

  _coins() {
    const tp = this.target.position;
    for (const c of this.coins) {
      if (c.taken) continue; const o = c.obj.position;
      if ((o.x - tp.x) ** 2 + (o.z - tp.z) ** 2 < 1.7) { c.taken = true; c.obj.visible = false; this.coinCount++; AudioManager.collect(); this.burst(o.clone()); this.cb.onCoins?.(this.coinCount); }
    }
  }

  _updateCamera(dt) {
    const off = (this.vehicle?.camOff || new THREE.Vector3(0, 4.6, 7.5)).clone().multiplyScalar(this.zoom);
    const tp = this.target.position;
    const desired = new THREE.Vector3(tp.x + off.x, tp.y + off.y, tp.z + off.z);
    this.camera.position.lerp(desired, Math.min(1, dt * 4));
    this.camera.lookAt(tp.x, tp.y + 1.2, tp.z);
  }
  _resize() { const w = innerWidth, h = innerHeight; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
}
