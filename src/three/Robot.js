/* ============================================================
   Robot — professional animated GLB character (RobotExpressive,
   CC0 by Tomás Laulhé / Don McCurdy). Skeletal animations:
   Idle, Running, Jump, Wave, Death, Dance...
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Robot {
  constructor() {
    this.root = new THREE.Group();
    this.ready = false;
    this.facing = 0;
    this.current = null;
    this.actions = {};
  }

  async load(url = 'assets/models/RobotExpressive.glb') {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // normalise size: scale so the model is ~1.7 units tall, feet at y=0
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3(); box.getSize(size);
    const s = 1.7 / size.y;
    model.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(model);
    model.position.y -= box2.min.y; // feet to 0
    this.root.add(model);

    this.mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      this.actions[clip.name] = this.mixer.createAction
        ? this.mixer.createAction(clip)
        : this.mixer.clipAction(clip);
    }
    // one-shot jump
    if (this.actions.Jump) { this.actions.Jump.setLoop(THREE.LoopOnce); this.actions.Jump.clampWhenFinished = true; }
    this.play('Idle', 0);
    this.ready = true;
    return this;
  }

  play(name, fade = 0.25) {
    const next = this.actions[name];
    if (!next || this.current === next) return;
    next.reset().fadeIn(fade).play();
    if (this.current) this.current.fadeOut(fade);
    this.current = next;
  }

  jump() {
    const j = this.actions.Jump; if (!j) return;
    j.reset().setEffectiveTimeScale(1.4).play();
    if (this.current && this.current !== j) this.current.fadeOut(0.1);
    this.current = j;
    this._jumpUntil = this.mixer.time + (j.getClip().duration / 1.4);
  }

  setLocomotion(moving, onGround) {
    if (!this.ready) return;
    if (this._jumpUntil && this.mixer.time < this._jumpUntil && onGround === false) return;
    this.play(moving ? 'Running' : 'Idle');
  }

  emote(name) { this.play(name, 0.2); }

  update(dt) {
    if (!this.ready) return;
    this.mixer.update(dt);
    let d = this.facing - this.root.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.root.rotation.y += d * Math.min(1, dt * 14);
  }
}
