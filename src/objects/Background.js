/* ============================================================
   Parallax background: tinted sky + rolling hills + drifting
   clouds. Shared by Menu, Level-Select and Game scenes.
   Returns { update(camScrollX) } for optional parallax.
   ============================================================ */
import { WIDTH, HEIGHT, ZONE_THEMES } from '../config.js';

export function buildBackground(scene, zoneIndex = 0, opts = {}) {
  const theme = ZONE_THEMES[zoneIndex] || ZONE_THEMES[0];

  const sky = scene.add.image(WIDTH / 2, HEIGHT / 2, 'bg_sky').setDepth(-100);
  sky.setDisplaySize(WIDTH, HEIGHT).setTint(theme.sky);

  // drifting clouds
  const clouds = [];
  const cloudCount = opts.clouds ?? 4;
  for (let i = 0; i < cloudCount; i++) {
    const c = scene.add.image(Phaser.Math.Between(0, WIDTH), Phaser.Math.Between(40, 160), 'atlas', 'cloud')
      .setDepth(-90).setAlpha(0.9).setScale(Phaser.Math.FloatBetween(0.7, 1.2));
    c._spd = Phaser.Math.FloatBetween(6, 16);
    clouds.push(c);
  }

  // hills (two strips for depth)
  const hillFar = scene.add.image(WIDTH / 2, HEIGHT - 60, 'bg_hills').setDepth(-80)
    .setDisplaySize(WIDTH + 40, 200).setTint(theme.hill).setAlpha(0.6);
  const hillNear = scene.add.image(WIDTH / 2, HEIGHT - 30, 'bg_hills').setDepth(-70)
    .setDisplaySize(WIDTH + 80, 240).setTint(theme.hill);

  return {
    theme,
    update(dt) {
      for (const c of clouds) {
        c.x += c._spd * dt;
        if (c.x - c.displayWidth > WIDTH) c.x = -c.displayWidth;
      }
    },
    destroy() {
      sky.destroy(); hillFar.destroy(); hillNear.destroy();
      clouds.forEach((c) => c.destroy());
    },
  };
}
