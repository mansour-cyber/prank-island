/* ============================================================
   Character3D — cute low-poly character built from primitives,
   with procedural run / idle / jump animation (no rig needed).
   Group origin sits at the feet (y = 0 = ground).
   ============================================================ */
import * as THREE from 'three';

const SKIN = 0xffcc9c, SHIRT = 0xff7043, CAP = 0x42a5f5, SHOE = 0x5d4037, DARK = 0x3a2c28;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.75, metalness: opts.m ?? 0.0, emissive: opts.e ?? 0x000000, emissiveIntensity: opts.ei ?? 0 });
}

export class Character3D {
  constructor() {
    const g = new THREE.Group();
    this.root = g;

    // body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.42, 6, 16), mat(SHIRT));
    body.position.y = 0.86; body.castShadow = true;
    g.add(body); this.body = body;

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), mat(SKIN));
    head.position.y = 1.42; head.castShadow = true;
    g.add(head); this.head = head;

    // cap (dome + brim)
    const cap = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(CAP));
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.28), mat(CAP, { r: 0.6 }));
    brim.position.set(0, 0.02, 0.26);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(0x1976d2));
    btn.position.y = 0.31;
    cap.add(dome, brim, btn); cap.position.y = 1.56;
    cap.children.forEach((c) => (c.castShadow = true));
    g.add(cap); this.cap = cap;

    // eyes
    const eyeMat = mat(DARK, { r: 0.3 });
    const eyeGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.12, 1.45, 0.26);
    const eR = new THREE.Mesh(eyeGeo, eyeMat); eR.position.set(0.12, 1.45, 0.26);
    g.add(eL, eR);

    // limbs on pivots (so we can swing them)
    this.armL = this.makeLimb(g, -0.42, 1.12, SHIRT, 0.5);
    this.armR = this.makeLimb(g, 0.42, 1.12, SHIRT, 0.5);
    this.legL = this.makeLimb(g, -0.16, 0.56, SHOE, 0.52);
    this.legR = this.makeLimb(g, 0.16, 0.56, SHOE, 0.52);

    this.phase = 0;
    this.facing = 0; // yaw target
  }

  makeLimb(parent, x, y, color, len) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, len - 0.2, 4, 10), mat(color));
    limb.position.y = -len / 2; limb.castShadow = true;
    pivot.add(limb);
    parent.add(pivot);
    return pivot;
  }

  /* state: { moving, onGround, vy } */
  update(dt, state) {
    const moving = state.moving;
    const target = moving ? 9 : 0;
    // advance walk cycle
    this.phase += dt * (moving ? 10 : 3);
    const sw = Math.sin(this.phase);

    if (!state.onGround) {
      // jump/fall pose: arms up a bit, legs tucked
      this.armL.rotation.x = -2.2; this.armR.rotation.x = -2.2;
      this.legL.rotation.x = 0.5; this.legR.rotation.x = -0.3;
      this.body.position.y = 0.86;
    } else if (moving) {
      const amp = 1.1;
      this.armL.rotation.x = sw * amp; this.armR.rotation.x = -sw * amp;
      this.legL.rotation.x = -sw * amp; this.legR.rotation.x = sw * amp;
      this.body.position.y = 0.86 + Math.abs(Math.sin(this.phase * 2)) * 0.04;
    } else {
      // idle breathing
      const b = Math.sin(this.phase) * 0.5;
      this.armL.rotation.x = b * 0.15; this.armR.rotation.x = b * 0.15;
      this.legL.rotation.x = 0; this.legR.rotation.x = 0;
      this.body.position.y = 0.86 + Math.sin(this.phase) * 0.02;
      this.head.position.y = 1.42 + Math.sin(this.phase) * 0.01;
    }

    // squash on landing handled by caller via scale; smooth yaw toward facing
    let d = this.facing - this.root.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.root.rotation.y += d * Math.min(1, dt * 12);
  }

  celebrate(dt, t) {
    this.armL.rotation.x = -2.6 + Math.sin(t * 8) * 0.2;
    this.armR.rotation.x = -2.6 - Math.sin(t * 8) * 0.2;
  }
}
