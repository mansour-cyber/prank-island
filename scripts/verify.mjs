/* Headless smoke test: boots the game, starts a few levels,
   captures console/page errors and screenshots. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });

async function waitScene(key) {
  await page.waitForFunction(
    (k) => window.game && window.game.scene.isActive(k),
    key, { timeout: 8000 },
  );
}

async function startLevel(idx) {
  await page.evaluate((i) => {
    const sm = window.game.scene;
    ['Menu', 'LevelSelect', 'Game'].forEach((k) => { if (sm.isActive(k)) sm.stop(k); });
    sm.start('Game', { levelIdx: i });
  }, idx);
  await waitScene('Game');
  await page.waitForTimeout(900); // let intro render
}

try {
  await waitScene('Menu');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/1-menu.png` });

  // Level select
  await page.evaluate(() => { window.game.scene.stop('Menu'); window.game.scene.start('LevelSelect', { zone: 0 }); });
  await waitScene('LevelSelect');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/2-select.png` });

  const levels = [
    [0, '3-chase'], [1, '4-collect'], [2, '5-puzzle'], [3, '6-platform'], [4, '7-cart'],
  ];
  for (const [idx, name] of levels) {
    await startLevel(idx);
    await page.screenshot({ path: `${SHOTS}/${name}-intro.png` });
    // dismiss intro: start playing via scene API
    await page.evaluate(() => {
      const g = window.game.scene.getScene('Game');
      // close the intro popup container (depth 2000) then play
      g.children.list.filter((o) => o.depth === 2000).forEach((o) => o.destroy());
      g.startPlaying();
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/${name}-play.png` });
  }
} catch (e) {
  errors.push('script: ' + e.message);
}

await browser.close();

console.log('\n=== VERIFY RESULT ===');
if (errors.length) { console.log('ERRORS:\n' + errors.join('\n')); process.exit(1); }
else console.log('No console/page errors. Screenshots in ' + SHOTS + '/');
