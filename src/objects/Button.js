/* ============================================================
   makeButton — rounded, juicy button (hover lift + press squash
   + click sound). Returns a Phaser container.
   ============================================================ */
import { COLORS, FONT } from '../config.js';

export function makeButton(scene, x, y, label, opts = {}) {
  const w = opts.width ?? 240;
  const h = opts.height ?? 56;
  const fill = opts.fill ?? 0xffb300;
  const fontSize = opts.fontSize ?? '22px';
  const textColor = opts.textColor ?? COLORS.ink;

  const c = scene.add.container(x, y);
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.18).fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 16);
  const g = scene.add.graphics();
  const draw = (color, lift = 0) => {
    g.clear();
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2 - lift, w, h, 16);
    g.lineStyle(4, COLORS.panelEdge, 1).strokeRoundedRect(-w / 2, -h / 2 - lift, w, h, 16);
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(-w / 2 + 6, -h / 2 - lift + 5, w - 12, 12, 8);
  };
  draw(fill);
  const txt = scene.add.text(0, 0, label, {
    fontFamily: FONT, fontSize, color: textColor, fontStyle: 'bold',
  }).setOrigin(0.5);

  c.add([shadow, g, txt]);
  c.labelText = txt;
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  c.input.cursor = 'pointer';

  c.on('pointerover', () => { draw(opts.hover ?? 0xffc233); txt.y = -2; });
  c.on('pointerout', () => { draw(fill); txt.y = 0; c.setScale(1); });
  c.on('pointerdown', () => { c.setScale(0.94); });
  c.on('pointerup', () => {
    c.setScale(1);
    scene.audio?.click();
    opts.onClick?.();
  });
  return c;
}
