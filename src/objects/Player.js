/* ============================================================
   Player — Arcade-physics character with frame animations.
   Frames in player.png: 0 idle, 1-4 run, 5 jump, 6 fall,
   7 cheer, 8 hurt.
   ============================================================ */
import { PHYSICS, HEIGHT } from '../config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(26, 42);
    this.body.setOffset((64 - 26) / 2, (64 - 42) / 2 + 6);
    this.setCollideWorldBounds(true);
    this.body.onWorldBounds = false;

    this.useGravity = true;
    this.frozen = false;
    this.facing = 1;
    this._makeAnims(scene);
    this.play('idle');
  }

  _makeAnims(scene) {
    const a = scene.anims;
    if (a.exists('idle')) return;
    a.create({ key: 'idle', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });
    a.create({ key: 'run', frames: a.generateFrameNumbers('player', { frames: [1, 2, 3, 4] }), frameRate: 12, repeat: -1 });
    a.create({ key: 'jump', frames: [{ key: 'player', frame: 5 }], frameRate: 1 });
    a.create({ key: 'fall', frames: [{ key: 'player', frame: 6 }], frameRate: 1 });
    a.create({ key: 'cheer', frames: [{ key: 'player', frame: 7 }], frameRate: 1 });
    a.create({ key: 'hurt', frames: [{ key: 'player', frame: 8 }], frameRate: 1 });
  }

  setGravityMode(useGravity) {
    this.useGravity = useGravity;
    this.body.setAllowGravity(useGravity);
  }

  /* controls: { left, right, up, down, jumpPressed } */
  drive(controls) {
    if (this.frozen) { this.setVelocity(0, 0); return; }
    const onGround = this.body.blocked.down || this.body.touching.down;

    // horizontal
    let vx = 0;
    if (controls.left)  { vx = -PHYSICS.speed; this.facing = -1; }
    if (controls.right) { vx = PHYSICS.speed;  this.facing = 1; }
    this.setVelocityX(vx);
    this.setFlipX(this.facing === -1);

    if (this.useGravity) {
      if (controls.jumpPressed && onGround) {
        this.setVelocityY(-PHYSICS.jump);
        this.scene.audio.jump();
      }
      // animation state
      if (!onGround) this.play(this.body.velocity.y < 0 ? 'jump' : 'fall', true);
      else if (vx !== 0) this.play('run', true);
      else this.play('idle', true);
    } else {
      // free top-down movement
      let vy = 0;
      if (controls.up) vy = -PHYSICS.speed;
      if (controls.down) vy = PHYSICS.speed;
      this.setVelocityY(vy);
      this.play(vx !== 0 || vy !== 0 ? 'run' : 'idle', true);
    }
  }

  hasFallen() { return this.y > HEIGHT + 60; }

  celebrate() { this.frozen = true; this.setVelocity(0, 0); this.play('cheer'); }
  hurt() { this.frozen = true; this.setVelocity(0, 0); this.play('hurt'); }
}
