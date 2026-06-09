/* ============================================================
   PuzzleMode — drag pieces onto their matching slots.
   Correct drop snaps & locks; wrong drop springs back.
   ============================================================ */
import { COLORS, FONT } from '../config.js';

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class PuzzleMode {
  constructor(scene) {
    this.scene = scene;
    this.cfg = scene.level.config;
    this.slots = [];
    this.placed = 0;
    this.collectCount = 0;
    this.collectTarget = (this.cfg.pieces || []).length;
  }

  create() {
    const s = this.scene, cfg = this.cfg;

    if (cfg.base) {
      s.add.image(cfg.base.x, cfg.base.y, 'atlas', cfg.base.frame).setDisplaySize(cfg.base.w, cfg.base.h).setDepth(0);
    }

    // slots (top-left anchored rects)
    const gfx = s.add.graphics().setDepth(1);
    cfg.slots.forEach((sl) => {
      const r = { x: sl.x - sl.w / 2, y: sl.y - sl.h / 2, w: sl.w, h: sl.h, accept: sl.accept, filled: false };
      this.slots.push(r);
      gfx.lineStyle(3, 0xffffff, 0.8);
      gfx.strokeRoundedRect(r.x, r.y, r.w, r.h, 8);
      if (sl.label) s.add.text(sl.x, r.y - 14, sl.label, { fontFamily: FONT, fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1);
    });

    // pieces
    this.pieces = cfg.pieces.map((p) => {
      const img = s.add.image(p.x, p.y, 'atlas', p.frame).setDisplaySize(p.w, p.h).setDepth(10);
      img._d = { accept: p.accept, origX: p.x, origY: p.y, w: p.w, h: p.h, placed: false };
      img.setInteractive({ draggable: true, useHandCursor: true });
      return img;
    });

    s.input.on('dragstart', (_, obj) => { if (!obj._d.placed && s.state === 'playing') { obj.setDepth(20); obj.setScale(obj.scaleX * 1.12); } });
    s.input.on('drag', (_, obj, dx, dy) => { if (!obj._d.placed && s.state === 'playing') { obj.x = dx; obj.y = dy; } });
    s.input.on('dragend', (_, obj) => this.onDrop(obj));
  }

  onDrop(obj) {
    const s = this.scene, d = obj._d;
    if (d.placed || s.state !== 'playing') return;
    obj.setScale(d.w / obj.width); // reset to display size scale
    const pr = { x: obj.x - d.w / 2, y: obj.y - d.h / 2, w: d.w, h: d.h };

    for (const slot of this.slots) {
      if (!slot.filled && slot.accept === d.accept && overlap(pr, slot)) {
        obj.x = slot.x + slot.w / 2; obj.y = slot.y + slot.h / 2;
        obj.setDepth(5); d.placed = true; slot.filled = true;
        this.placed++; this.collectCount++;
        s.collect(obj.x, obj.y);
        if (this.placed >= this.collectTarget) s.win();
        return;
      }
    }
    // wrong / missed → spring back
    s.audio.boop();
    s.tweens.add({ targets: obj, x: d.origX, y: d.origY, duration: 250, ease: 'Back.out' });
  }

  update() { /* fully event-driven */ }
  onEnd() { this.scene.input.off('dragstart'); this.scene.input.off('drag'); this.scene.input.off('dragend'); }
}
