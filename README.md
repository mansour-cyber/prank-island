# 🏝️ جزيرة المقالب — Prank Island

A fun, colorful 2D web game for children ages **7–15**, now rebuilt on a
professional **Phaser 3** engine with real PNG sprite assets, physics,
animations, particles and smooth scene transitions.

![Phaser](https://img.shields.io/badge/Phaser-3.80-8e44ad)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)

---

## 🎮 About

The player lands on a silly island where strange characters need help with
ridiculous problems across **30 short levels** in **6 themed zones**.

> **Status:** Zone 1 (levels 1–5) is the fully-playable, polished vertical
> slice on the new engine. Zones 2–6 appear in the menu and are being ported
> level-by-level on the same data-driven architecture.

### Zones
| # | Zone | Theme |
|---|------|-------|
| 1 | 🏘️ قرية الفوضى | Village of Chaos — **playable** |
| 2 | 🌳 غابة المقالب | Prank Forest |
| 3 | 🤖 مدينة الروبوتات | Broken Robot City |
| 4 | 🍔 مهرجان الطعام | Crazy Food Festival |
| 5 | 🏰 قلعة الضحك | Laugh Castle |
| 6 | 🎪 النهاية الكبرى | Final Showdown |

---

## 🕹️ Controls

| Action | Key | Touch |
|--------|-----|-------|
| Move | `←/→` or `A/D` | on-screen ◀ ▶ |
| Jump | `Space` / `↑` / `W` | on-screen ⤒ |
| Drag puzzle pieces | Mouse / finger | — |

---

## 🚀 Run it

Requires **Node 18+**.

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
```

Build a static production bundle:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build
```

> The game loads PNG assets, so it must be served over HTTP (use `npm run dev`),
> not opened from `file://` directly.

---

## 🎨 Assets

All art is **generated procedurally** into cohesive PNG spritesheets + a Phaser
texture atlas — no external/licensed packs, fully owned and consistent.

```bash
npm run assets     # regenerates public/assets/ (player.png, atlas.png, backgrounds)
```

Source: `scripts/gen-assets.mjs` (uses `@napi-rs/canvas`).

---

## 📁 Project Structure

```
index.html              # Vite entry
public/assets/          # generated PNG art + atlas.json
scripts/
  gen-assets.mjs        # asset generator
  verify.mjs            # headless smoke test (Playwright)
src/
  main.js               # Phaser game config + scene list
  config.js             # constants & zone themes
  core/
    SaveManager.js      # localStorage progress (back-compatible)
    AudioManager.js     # procedural Web Audio SFX + music
  objects/
    Player.js           # animated arcade-physics character
    Background.js       # parallax sky/hills/clouds
    Button.js           # reusable juicy button
  scenes/
    BootScene, PreloadScene, MenuScene,
    LevelSelectScene, GameScene
  modes/
    PlatformMode.js     # platform / collect / chase levels
    PuzzleMode.js       # drag-and-drop puzzle levels
  data/
    levels.js           # data-driven level definitions
legacy/                 # the original vanilla-canvas version (preserved)
```

---

## 🧩 Level Types

| Mode | Used For | Status |
|------|----------|--------|
| `platform` | Jump & reach the goal | ✅ |
| `collect` | Gather items (timed) | ✅ |
| `chase` | Catch a fleeing NPC | ✅ |
| `puzzle` | Drag pieces to slots | ✅ |
| pattern / escape / choice / boss | Zones 2–6 | 🔜 |

---

## ✅ Verify

```bash
npm run build && npm run preview &   # serve on :4173
node scripts/verify.mjs              # boots the game, checks for runtime
                                     # errors, writes screenshots to verify-shots/
```

---

## 📜 License
MIT
