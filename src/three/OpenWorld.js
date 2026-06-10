/* ============================================================
   OpenWorld — free-roam Saudi-flavoured low-poly town (three.js).
   Features: closer follow camera + zoom that tracks the hero AND
   any vehicle (car / scooter / camel / plane); coin economy;
   clothing/hat shop; hourly gift; and a parkour climb challenge
   with checkpoints + respawn-on-fall.
   ============================================================ */
import * as THREE from 'three';
import { Robot } from './Robot.js';
import { AudioManager } from '../core/AudioManager.js';
import { Profiles } from './profiles.js';

const HALF = 48;
const GRAV = 24, SPEED = 7, JUMP = 9.8;

export const SKINS = {
  default: { name: 'الأصلي', price: 0 },
  blue: { name: 'أزرق', price: 80, color: 0x42a5f5 },
  green: { name: 'أخضر', price: 120, color: 0x66bb6a },
  pink: { name: 'وردي', price: 150, color: 0xff5da2 },
  gold: { name: 'ذهبي', price: 350, color: 0xffd23f },
};
export const HATS = {
  none: { name: 'بدون', price: 0 },
  cap: { name: 'كاب', price: 100 },
  crown: { name: 'تاج', price: 450 },
  party: { name: 'حفلة', price: 200 },
};

export class OpenWorld {
  constructor(cb = {}) {
    this.cb = cb;
    this.clock = new THREE.Clock();
    this.input = { x: 0, z: 0, jumpHeld: false, jumpEdge: false };
    this.solids = []; this.platforms = []; this.coins = []; this.vehicles = []; this.particles = [];
    this.interactables = [];
    this.mode = 'foot'; this.vehicle = null; this.zoom = 1;
    this.pk = { active: false, start: new THREE.Vector3(), checkpoint: new THREE.Vector3(), top: 0 };

    this._initRenderer(); this._initScene(); this._initLights();
    this._buildGround(); this._buildTown(); this._buildShop(); this._buildVehicles();
    this._buildParkour(); this._scatterCoins();
    this._initInput();
    addEventListener('resize', () => this._resize()); this._resize();

    this.hero = new Robot();
    this.loaded = this.hero.load().then(() => {
      this.scene.add(this.hero.root);
      this.heroMeshes = [];
      this.hero.root.traverse((o) => { if (o.isMesh && o.material) { o.material = o.material.clone(); this.heroMeshes.push({ m: o, c: o.material.color.clone() }); } });
      this.pos = new THREE.Vector3(0, 0, 10); this.vel = new THREE.Vector3(); this.onGround = true;
      this.hero.root.position.copy(this.pos); this.target = this.hero.root;
      this.applyLook(Profiles.equipped());
    });
    this.renderer.setAnimationLoop(() => this._frame());
  }

  _initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15; r.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('app').appendChild(r.domElement); this.renderer = r; this.canvas = r.domElement;
  }
  _initScene() {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x9fd6f4); s.fog = new THREE.Fog(0xcdeafe, 60, 120);
    this.scene = s; this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 320); this.camera.position.set(0, 6, 12);
  }
  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0xdff1ff, 0x6f9b54, 1.0));
    const sun = new THREE.DirectionalLight(0xfff3d4, 2.1); sun.position.set(34, 48, 20); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); const d = 64; Object.assign(sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 150 }); sun.shadow.bias = -0.0004;
    this.scene.add(sun);
  }
  _mat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.9, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 0, flatShading: o.flat ?? false }); }

  _buildGround() {
    const grass = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2, 1, HALF * 2), this._mat(0x86c659)); grass.position.y = -0.5; grass.receiveShadow = true; this.scene.add(grass);
    const road = this._mat(0x6d6f73, { r: 1 });
    const rx = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2, 0.12, 8), road); rx.position.y = 0.02; rx.receiveShadow = true; this.scene.add(rx);
    const rz = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, HALF * 2), road); rz.position.y = 0.02; rz.receiveShadow = true; this.scene.add(rz);
    for (let i = -HALF + 4; i < HALF; i += 6) { this._flat(i, 0, 2, 0.5, 0xffe082); this._flat(0, i, 0.5, 2, 0xffe082); }
  }
  _flat(x, z, w, d, c) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), this._mat(c)); m.position.set(x, 0.1, z); this.scene.add(m); }

  _palm(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 3.4, 8), this._mat(0xae7c4f)); trunk.position.y = 1.7; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 5), this._mat(0x4fa83a, { flat: true })); f.position.y = 3.4; f.rotation.z = Math.PI / 2.6; f.rotation.y = (i / 6) * Math.PI * 2; f.castShadow = true; g.add(f); }
    g.position.set(x, 0, z); this.scene.add(g);
    this.solids.push({ minx: x - 0.3, maxx: x + 0.3, minz: z - 0.3, maxz: z + 0.3 });
  }
  _lamp(x, z) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), this._mat(0x455a64)).translateY(1.5));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), this._mat(0xfff59d, { e: 0xffe082, ei: 0.7 })); head.position.y = 3; g.add(head);
    g.position.set(x, 0, z); g.children.forEach(c => c.castShadow = true); this.scene.add(g);
  }

  _house(x, z, color, enterable = false) {
    const g = new THREE.Group(); g.position.set(x, 0, z); this.scene.add(g);
    const W = 7, D = 7, H = 3.4, t = 0.3;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.82, 2.6, 4), this._mat(0xb5482f, { flat: true })); roof.position.y = H + 1.3; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    const wm = this._mat(color);
    const wall = (lx, lz, lw, ld) => { const m = new THREE.Mesh(new THREE.BoxGeometry(lw, H, ld), wm); m.position.set(lx, H / 2, lz); m.castShadow = true; m.receiveShadow = true; g.add(m); this.solids.push({ minx: x + lx - lw / 2, maxx: x + lx + lw / 2, minz: z + lz - ld / 2, maxz: z + lz + ld / 2 }); };
    if (enterable) {
      wall(0, -D / 2, W, t); wall(-W / 2, 0, t, D); wall(W / 2, 0, t, D);
      wall(-(W / 2 - 1.25), D / 2, 2.5, t); wall(W / 2 - 1.25, D / 2, 2.5, t);
      const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), this._mat(0xd7b899)); floor.position.y = 0.05; floor.receiveShadow = true; g.add(floor);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.4), this._mat(0x8e6fd8)); bed.position.set(-1.6, 0.4, -1.6); bed.castShadow = true; g.add(bed);
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.8, 12), this._mat(0xb98a5a)); table.position.set(1.6, 0.4, -1.4); table.castShadow = true; g.add(table);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wm); body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.1), this._mat(0x6d4c41)); door.position.set(0, 1.1, D / 2 + 0.01); g.add(door);
      const win = this._mat(0x9fe0ff, { e: 0x4fc3f7, ei: 0.3 });
      for (const sx of [-2, 2]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), win); w.position.set(sx, 2, D / 2 + 0.01); g.add(w); }
      this.solids.push({ minx: x - W / 2, maxx: x + W / 2, minz: z - D / 2, maxz: z + D / 2 });
    }
  }

  _buildTown() {
    const palette = [0xffd9a0, 0xffffff, 0xc8e6c9, 0xffe0b2, 0xd1c4e9, 0xb3e5fc];
    const spots = [[-16, -14, true], [16, -14, false], [-30, -14, false], [30, -16, false], [-16, 14, false], [-30, 14, false], [-16, -30, false], [16, -30, false], [-16, 30, false], [16, 30, false]];
    spots.forEach((s, i) => this._house(s[0], s[1], palette[i % palette.length], s[2]));
    for (let i = -42; i <= 42; i += 10) { if (Math.abs(i) > 5) { this._palm(i, 6); this._palm(i, -6); this._palm(6, i); this._palm(-6, i); } }
    for (let i = -36; i <= 36; i += 18) { this._lamp(5, i); this._lamp(-5, i); }
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.6, 20), this._mat(0xb0bec5)); base.position.y = 0.3; base.receiveShadow = true; base.castShadow = true; this.scene.add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.3, 20), this._mat(0x4fc3f7, { e: 0x29b6f6, ei: 0.3 })); water.position.y = 0.6; this.scene.add(water);
    this.solids.push({ minx: -2.6, maxx: 2.6, minz: -2.6, maxz: 2.6 });
  }

  _buildShop() {
    const x = 18, z = 16, g = new THREE.Group(); g.position.set(x, 0, z); this.scene.add(g);
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 5), this._mat(0xff8a65)); body.position.y = 1.7; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const awn = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.4, 1.6), this._mat(0xffffff)); awn.position.set(0, 3.0, 2.8); g.add(awn);
    for (let i = -3; i <= 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 1.6), this._mat(i % 2 ? 0xe53935 : 0xffffff)); st.position.set(i * 0.5, 3.0, 2.8); g.add(st); }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 0.9, 0.2), this._mat(0xffd23f, { e: 0xffb300, ei: 0.4 })); sign.position.set(0, 3.9, 0); g.add(sign);
    this.solids.push({ minx: x - 3, maxx: x + 3, minz: z - 2.5, maxz: z + 2.5 });
    this.shop = { type: 'shop', group: g, label: '🛍️ المتجر (افتح)' };
    this.interactables.push(this.shop);
  }

  _buildVehicles() {
    this.car = this._makeCar(-12, 2);
    this.scooter = this._makeScooter(10, 2);
    this.camel = this._makeCamel(14, -4);
    this.plane = this._makePlane(0, -30);
    this.vehicles = [this.car, this.scooter, this.camel, this.plane];
    this.interactables.push(...this.vehicles);
  }
  _makeCar(x, z) {
    const g = new THREE.Group();
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4), this._mat(0xe53935, { r: 0.5, m: 0.2 })), { castShadow: true }).translateY(0.7));
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2), this._mat(0x90caf9, { r: 0.3, m: 0.3 })), { castShadow: true }).translateY(1.25).translateZ(-0.1));
    const wheels = [];
    for (const wx of [-1, 1]) for (const wz of [-1.3, 1.3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 14), this._mat(0x222)); w.rotation.z = Math.PI / 2; w.position.set(wx * 1.05, 0.45, wz); g.add(w); wheels.push(w); }
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'car', group: g, wheels, label: '🚗 اركب السيارة', heading: 0, speed: 13, camOff: new THREE.Vector3(0, 5.5, 10), seatY: 1.6 };
  }
  _makeScooter(x, z) {
    const g = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 1.8), this._mat(0x26c6da, { m: 0.2 })); deck.position.y = 0.5; deck.castShadow = true; g.add(deck);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), this._mat(0x37474f)); stem.position.set(0, 1.1, 0.8); stem.rotation.x = -0.2; g.add(stem);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), this._mat(0x37474f)); bar.position.set(0, 1.65, 0.7); g.add(bar);
    const wheels = [];
    for (const wz of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 14), this._mat(0x222)); w.rotation.z = Math.PI / 2; w.position.set(0, 0.32, wz); g.add(w); wheels.push(w); }
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'scooter', group: g, wheels, label: '🛴 اركب السكوتر', heading: 0, speed: 10, camOff: new THREE.Vector3(0, 4.6, 8), seatY: 1.1, ride: true };
  }
  _makeCamel(x, z) {
    const g = new THREE.Group(); const tan = this._mat(0xc9a06a, { flat: true });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.6, 6, 12), tan); body.rotation.z = Math.PI / 2; body.position.y = 1.7; body.castShadow = true; g.add(body);
    g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), tan), { castShadow: true }).translateY(2.2));
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.2, 4, 8), tan); neck.position.set(0, 2.4, 1.3); neck.rotation.x = 0.7; neck.castShadow = true; g.add(neck);
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.9), tan), { castShadow: true }).translateY(3.0).translateZ(1.9));
    const legs = [];
    for (const lx of [-0.45, 0.45]) for (const lz of [-0.8, 0.9]) { const leg = new THREE.Group(); leg.position.set(lx, 1.4, lz); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.2, 4, 6), tan); m.position.y = -0.7; m.castShadow = true; leg.add(m); g.add(leg); legs.push(leg); }
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'camel', group: g, legs, label: '🐪 اركب البعير', heading: 0, speed: 6, phase: 0, camOff: new THREE.Vector3(0, 6, 11), seatY: 1.9, ride: true };
  }
  _makePlane(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 3, 6, 12), this._mat(0xfafafa, { m: 0.2, r: 0.4 })); body.rotation.x = Math.PI / 2; body.position.y = 1.4; body.castShadow = true; g.add(body);
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 1.2), this._mat(0xef5350)), { castShadow: true }).translateY(1.5));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.8), this._mat(0xef5350)).translateY(1.7).translateZ(-1.7));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.8), this._mat(0xef5350)).translateY(2.0).translateZ(-1.7));
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), this._mat(0x333)); prop.position.set(0, 1.4, 1.7); g.add(prop);
    g.position.set(x, 0, z); this.scene.add(g);
    return { type: 'plane', group: g, prop, label: '✈️ اركب الطيارة', heading: 0, speed: 16, alt: 0, camOff: new THREE.Vector3(0, 7, 14), seatY: 1.6, ride: true };
  }

  /* ---------- parkour ---------- */
  _addPlatform(x, y, z, w, d, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), this._mat(color, { flat: true }));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; this.scene.add(m);
    this.platforms.push({ minx: x - w / 2, maxx: x + w / 2, minz: z - d / 2, maxz: z + d / 2, top: y + 0.3 });
    return m;
  }
  _buildParkour() {
    const bx = 30, bz = 30;
    // sign
    const g = new THREE.Group(); g.position.set(bx, 0, bz - 8); this.scene.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8), this._mat(0x6d4c41)); post.position.y = 1.2; g.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.16), this._mat(0x43a047, { e: 0x2e7d32, ei: 0.3 })); board.position.y = 2.2; g.add(board);
    g.children.forEach(c => c.castShadow = true);
    this.parkourSign = { type: 'parkour', group: g, label: '🏁 تحدي التسلّق' };
    this.interactables.push(this.parkourSign);

    // ascending steps (require jumps); colourful
    const cols = [0x9ccc65, 0xffb74d, 0x4fc3f7, 0xba68c8, 0xef5350, 0xfff176];
    this.pkSteps = [];
    let x = bx, z = bz, y = 1.6;
    for (let i = 0; i < 9; i++) {
      this._addPlatform(x, y, z, 3, 3, cols[i % cols.length]);
      this.pkSteps.push(new THREE.Vector3(x, y + 0.3, z));
      // zig-zag with gaps
      if (i % 2 === 0) z -= 3.4; else x -= 3.4;
      y += 1.7;
    }
    this.pk.start.copy(this.pkSteps[0]);
    // top reward chest
    const top = this.pkSteps[this.pkSteps.length - 1];
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), this._mat(0xffd23f, { e: 0xffb300, ei: 0.5, m: 0.3 }));
    chest.position.set(top.x, top.y + 0.8, top.z); chest.castShadow = true; this.scene.add(chest); this.pkChest = chest;
  }

  /* ---------- coins (fewer + valuable, some need parkour/jumps) ---------- */
  _coinMesh(x, y, z, value, color) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(value > 5 ? 0.5 : 0.35, value > 5 ? 0.5 : 0.35, 0.08, 18), this._mat(color, { e: color, ei: 0.5, m: 0.4, r: 0.3 }));
    m.rotation.x = Math.PI / 2; m.position.set(x, y, z); m.castShadow = true; this.scene.add(m);
    this.coins.push({ obj: m, taken: false, ph: Math.random() * 6, value, base: y });
  }
  _scatterCoins() {
    // scattered small coins (harder: fewer + spread far)
    let placed = 0, tries = 0;
    while (placed < 14 && tries++ < 200) {
      const x = (Math.random() - 0.5) * HALF * 1.85, z = (Math.random() - 0.5) * HALF * 1.85;
      if (this._hitSolid(x, z, 0.7)) continue;
      this._coinMesh(x, 1, z, 5, 0xffd23f); placed++;
    }
    // valuable coins on rooftops / parkour steps (need jumps/climb)
    this._coinMesh(-16, 5.2, 14, 25, 0x80d8ff);   // on a roof-height
    this._coinMesh(16, 5.2, -30, 25, 0x80d8ff);
    this.pkSteps?.forEach((s, i) => { if (i % 3 === 1) this._coinMesh(s.x, s.y + 1.0, s.z, 25, 0xff8a65); });
    // particle pool
    const pgeo = new THREE.OctahedronGeometry(0.12);
    for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(pgeo, new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 0.6 })); m.visible = false; this.scene.add(m); this.particles.push({ mesh: m, life: 0, vel: new THREE.Vector3() }); }
  }

  /* ---------- collision / support ---------- */
  _hitSolid(x, z, r) { for (const s of this.solids) if (x + r > s.minx && x - r < s.maxx && z + r > s.minz && z - r < s.maxz) return s; return null; }
  _resolve(p, r) {
    for (const s of this.solids) if (p.x + r > s.minx && p.x - r < s.maxx && p.z + r > s.minz && p.z - r < s.maxz) {
      const dl = p.x + r - s.minx, dr = s.maxx - (p.x - r), dt = p.z + r - s.minz, db = s.maxz - (p.z - r), m = Math.min(dl, dr, dt, db);
      if (m === dl) p.x = s.minx - r; else if (m === dr) p.x = s.maxx + r; else if (m === dt) p.z = s.minz - r; else p.z = s.maxz + r;
    }
    p.x = Math.max(-HALF + 1, Math.min(HALF - 1, p.x)); p.z = Math.max(-HALF + 1, Math.min(HALF - 1, p.z));
  }
  _supportY(x, z, prevY) {
    let gy = 0;
    for (const p of this.platforms) if (x > p.minx && x < p.maxx && z > p.minz && z < p.maxz && prevY >= p.top - 0.25) gy = Math.max(gy, p.top);
    return gy;
  }

  /* ---------- customization ---------- */
  applyLook(eq) {
    if (!this.heroMeshes) return;
    const skin = SKINS[eq?.color] || SKINS.default;
    this.heroMeshes.forEach(({ m, c }) => m.material.color.copy(skin.color !== undefined ? new THREE.Color(skin.color) : c));
    if (this.hatMesh) { this.hero.root.remove(this.hatMesh); this.hatMesh = null; }
    const id = eq?.hat || 'none';
    if (id !== 'none') { this.hatMesh = this._makeHat(id); this.hero.root.add(this.hatMesh); }
  }
  _makeHat(id) {
    const g = new THREE.Group(); g.position.y = 1.72;
    if (id === 'cap') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), this._mat(0xe53935)); const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), this._mat(0xc62828)); b.position.set(0, 0.02, 0.4); g.add(c, b); }
    else if (id === 'crown') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.4, 8), this._mat(0xffd23f, { e: 0xffb300, ei: 0.5, m: 0.4 })); for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), this._mat(0xffd23f, { e: 0xffb300, ei: 0.5, m: 0.4 })); sp.position.set(Math.cos(i / 8 * 6.28) * 0.42, 0.3, Math.sin(i / 8 * 6.28) * 0.42); g.add(sp); } g.add(c); }
    else if (id === 'party') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 16), this._mat(0xab47bc, { e: 0x8e24aa, ei: 0.3 })); c.position.y = 0.4; const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this._mat(0xfff176)); ball.position.y = 0.9; g.add(c, ball); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  /* ---------- input ---------- */
  _initInput() {
    this.keys = {};
    addEventListener('keydown', (e) => { this.keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); if (e.code === 'KeyE') this.interact(); AudioManager.unlock(); });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    const joy = document.getElementById('joy'), knob = document.getElementById('knob');
    if (joy) {
      let id = null, cx = 0, cy = 0;
      const start = (e) => { const t = e.changedTouches ? e.changedTouches[0] : e; id = t.identifier ?? 'm'; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; AudioManager.unlock(); mv(e); };
      const mv = (e) => { const t = [...(e.changedTouches || [e])].find((p) => (p.identifier ?? 'm') === id); if (!t) return; let dx = t.clientX - cx, dy = t.clientY - cy; const M = 46, dd = Math.hypot(dx, dy); if (dd > M) { dx = dx / dd * M; dy = dy / dd * M; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.input.x = dx / M; this.input.z = dy / M; };
      const end = () => { id = null; knob.style.transform = 'translate(0,0)'; this.input.x = 0; this.input.z = 0; };
      joy.addEventListener('touchstart', start, { passive: true }); joy.addEventListener('touchmove', mv, { passive: true }); joy.addEventListener('touchend', end); joy.addEventListener('touchcancel', end);
      joy.addEventListener('mousedown', (e) => { start(e); const mm = (ev) => mv(ev), mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); }; addEventListener('mousemove', mm); addEventListener('mouseup', mu); });
    }
    const jb = document.getElementById('jumpBtn');
    if (jb) { const press = (e) => { e.preventDefault(); if (!this.input.jumpHeld) this.input.jumpEdge = true; this.input.jumpHeld = true; AudioManager.unlock(); }; const rel = () => { this.input.jumpHeld = false; }; jb.addEventListener('touchstart', press, { passive: false }); jb.addEventListener('touchend', rel); jb.addEventListener('mousedown', press); jb.addEventListener('mouseup', rel); }
    document.getElementById('interactBtn')?.addEventListener('click', () => this.interact());
    document.getElementById('zoomIn')?.addEventListener('click', () => this._zoom(-0.2));
    document.getElementById('zoomOut')?.addEventListener('click', () => this._zoom(0.2));
    this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this._zoom(e.deltaY > 0 ? 0.12 : -0.12); }, { passive: false });
    let pinch = 0;
    this.canvas.addEventListener('touchmove', (e) => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) this._zoom((pinch - d) * 0.01); pinch = d; } }, { passive: true });
    this.canvas.addEventListener('touchend', () => { pinch = 0; });
  }
  _zoom(d) { this.zoom = Math.max(0.55, Math.min(2.4, this.zoom + d)); }
  _readMove() {
    let x = this.input.x, z = this.input.z;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) x = -1; if (this.keys['ArrowRight'] || this.keys['KeyD']) x = 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) z = -1; if (this.keys['ArrowDown'] || this.keys['KeyS']) z = 1;
    const jumpEdge = this.input.jumpEdge || (this.keys['Space'] && !this._sp); this._sp = this.keys['Space']; this.input.jumpEdge = false;
    const jumpHeld = this.input.jumpHeld || this.keys['Space'];
    return { x, z, jumpEdge, jumpHeld };
  }

  /* ---------- interaction ---------- */
  interact() {
    if (this.pk.active && this.mode === 'foot') return this._endParkour(true);
    if (this.mode !== 'foot') return this._dismount();
    const n = this._near; if (!n) return;
    if (n.type === 'shop') return this.cb.onShop?.();
    if (n.type === 'parkour') return this._startParkour();
    this._mount(n);
  }
  _mount(v) { this.mode = v.type; this.vehicle = v; this.target = v.group; this.hero.root.visible = !!v.ride && v.type !== 'plane' && v.type !== 'car'; AudioManager.boop(); this.cb.onProximity?.('انزل 🔻'); }
  _dismount() {
    const v = this.vehicle; if (!v) return;
    const side = new THREE.Vector3(Math.cos(v.heading), 0, -Math.sin(v.heading)).multiplyScalar(2.6);
    this.pos.set(v.group.position.x + side.x, 0, v.group.position.z + side.z); this.vel.set(0, 0, 0); this.onGround = true;
    this.hero.root.visible = true; this.hero.root.position.copy(this.pos); this.mode = 'foot'; this.vehicle = null; this.target = this.hero.root; AudioManager.boop();
  }
  _startParkour() {
    this.pk.active = true; this.pk.checkpoint.copy(this.pk.start); this.pk.top = this.pk.start.y;
    this.pos.copy(this.pk.start); this.vel.set(0, 0, 0); this.onGround = true; this.target = this.hero.root;
    this.cb.onToast?.('تسلّق للأعلى! لو طحت ترجع لآخر نقطة 🧗'); AudioManager.boop();
  }
  _endParkour(byUser) {
    this.pk.active = false; this.pk.top = 0;
    this.pos.set(this.parkourSign.group.position.x, 0, this.parkourSign.group.position.z + 2.5); this.vel.set(0, 0, 0);
    if (byUser) this.cb.onToast?.('خرجت من التحدي');
  }

  burst(p, color = 0xffd23f) { let n = 0; for (const q of this.particles) { if (q.life > 0) continue; q.mesh.material.color.set(color); q.mesh.material.emissive.set(color); q.mesh.position.copy(p); q.mesh.visible = true; q.life = 0.6; q.vel.set((Math.random() - 0.5) * 5, 3 + Math.random() * 3, (Math.random() - 0.5) * 5); if (++n >= 10) break; } }

  /* ---------- loop ---------- */
  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05); const t = this.clock.elapsedTime;
    this.hero?.update(dt);
    [this.car, this.scooter].forEach(v => v?.wheels.forEach(w => { if (this.vehicle === v) w.rotation.x += dt * 12; }));
    if (this.plane) this.plane.prop.rotation.z += dt * (this.vehicle === this.plane ? 40 : 6);
    this.coins.forEach(c => { if (!c.taken) { c.obj.rotation.z += dt * 3; c.obj.position.y = c.base + Math.sin(t * 2 + c.ph) * 0.15; } });
    if (this.pkChest) { this.pkChest.rotation.y += dt * 1.5; this.pkChest.position.y = this.pkSteps[this.pkSteps.length - 1].y + 0.8 + Math.sin(t * 2) * 0.1; }
    for (const p of this.particles) { if (p.life <= 0) continue; p.life -= dt; p.vel.y -= 12 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.scale.setScalar(Math.max(0.01, p.life)); if (p.life <= 0) p.mesh.visible = false; }

    if (this.target) {
      if (this.mode === 'foot') this._updateFoot(dt); else this._updateVehicle(dt);
      this._proximity(); this._coins(); this._updateCamera(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _updateFoot(dt) {
    const c = this._readMove(); const len = Math.hypot(c.x, c.z); const moving = len > 0.14;
    let mx = c.x, mz = c.z; if (len > 1) { mx /= len; mz /= len; }
    this.vel.x = mx * SPEED; this.vel.z = mz * SPEED;
    if (c.jumpEdge && this.onGround) { this.vel.y = JUMP; this.onGround = false; this.hero.jump(); AudioManager.jump(); }
    this.vel.y -= GRAV * dt;
    const prevY = this.pos.y;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;
    const gy = this._supportY(this.pos.x, this.pos.z, prevY);
    if (this.pos.y <= gy && this.vel.y <= 0) {
      if (!this.onGround && prevY - gy > 0.4) this.burst(new THREE.Vector3(this.pos.x, gy + 0.1, this.pos.z), 0xffffff);
      this.pos.y = gy; this.vel.y = 0; this.onGround = true;
      if (this.pk.active && gy > this.pk.top + 0.1) { this.pk.top = gy; this.pk.checkpoint.set(this.pos.x, gy, this.pos.z); } // checkpoint
    } else if (this.pos.y > gy + 0.02) this.onGround = false;
    this._resolve(this.pos, 0.45);
    // parkour fall -> respawn at checkpoint
    if (this.pk.active && this.pos.y <= 0.06 && this.pk.top > 1) { this.pos.copy(this.pk.checkpoint); this.vel.set(0, 0, 0); AudioManager.fail(); this.cb.onToast?.('حاول مرة ثانية! 💪'); }
    this.hero.root.position.copy(this.pos);
    if (moving) this.hero.facing = Math.atan2(this.vel.x, this.vel.z);
    this.hero.setLocomotion(moving, this.onGround);
    // chest
    if (this.pk.active && this.pkChest) { const d = this.pkChest.position; if ((d.x - this.pos.x) ** 2 + (d.z - this.pos.z) ** 2 + (d.y - (this.pos.y + 1)) ** 2 < 2.2) { const total = Profiles.addCoins(300); this.burst(d.clone()); AudioManager.win(); this.cb.onCoins?.(total); this.cb.onToast?.('🏆 أكملت التحدي! +300 🪙'); this._endParkour(false); } }
  }

  _updateVehicle(dt) {
    const v = this.vehicle, c = this._readMove(); const len = Math.hypot(c.x, c.z); const moving = len > 0.14;
    let mx = c.x, mz = c.z; if (len > 1) { mx /= len; mz /= len; } const g = v.group;
    if (v.type === 'plane') {
      g.position.x += mx * v.speed * dt; g.position.z += mz * v.speed * dt;
      if (c.jumpHeld) v.alt += 9 * dt; v.alt -= 5 * dt; v.alt = Math.max(0, Math.min(24, v.alt)); g.position.y = v.alt;
      if (moving) { v.heading = Math.atan2(mx, mz); g.rotation.y = v.heading; g.rotation.z = -mx * 0.3; g.rotation.x = mz * 0.15; } else { g.rotation.z *= 0.9; g.rotation.x *= 0.9; }
    } else {
      g.position.x += mx * v.speed * dt; g.position.z += mz * v.speed * dt; this._resolve(g.position, 1.2);
      if (moving) { v.heading = Math.atan2(mx, mz); g.rotation.y = v.heading; }
      if (v.type === 'camel') { v.phase += dt * (moving ? 8 : 2); g.position.y = Math.abs(Math.sin(v.phase)) * 0.12; v.legs.forEach((lg, i) => lg.rotation.x = Math.sin(v.phase + i * 1.6) * (moving ? 0.5 : 0)); }
    }
    if (v.ride && v.type !== 'plane' && v.type !== 'car') { this.hero.root.position.set(g.position.x, g.position.y + v.seatY, g.position.z); this.hero.root.rotation.y = v.heading; this.hero.setLocomotion(false, true); }
  }

  _proximity() {
    if (this.pk.active) { this.cb.onProximity?.('🏁 خروج'); return; }
    if (this.mode !== 'foot') { this.cb.onProximity?.('انزل 🔻'); return; }
    let best = null, bd = 26;
    for (const it of this.interactables) { const dx = it.group.position.x - this.pos.x, dz = it.group.position.z - this.pos.z; const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = it; } }
    this._near = best; this.cb.onProximity?.(best ? best.label : null);
  }

  _coins() {
    const tp = this.target.position;
    for (const c of this.coins) { if (c.taken) continue; const o = c.obj.position; if ((o.x - tp.x) ** 2 + (o.z - tp.z) ** 2 + (o.y - (tp.y + 1)) ** 2 < 2.0) { c.taken = true; c.obj.visible = false; const total = Profiles.addCoins(c.value); AudioManager.collect(); this.burst(o.clone(), c.value > 5 ? 0x80d8ff : 0xffd23f); this.cb.onCoins?.(total); } }
  }

  _updateCamera(dt) {
    const off = (this.vehicle?.camOff || new THREE.Vector3(0, 4.6, 7.8)).clone().multiplyScalar(this.zoom);
    const tp = this.target.position;
    this.camera.position.lerp(new THREE.Vector3(tp.x + off.x, tp.y + off.y, tp.z + off.z), Math.min(1, dt * 4));
    this.camera.lookAt(tp.x, tp.y + 1.2, tp.z);
  }
  _resize() { const w = innerWidth, h = innerHeight; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
}
