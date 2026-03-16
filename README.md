# 🏝️ جزيرة المقالب — Prank Island

A fun, colorful 2D browser game for children ages **7–15**.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## 🎮 About

The player arrives on a silly island where everything is playful and chaotic. Strange characters need help solving ridiculous problems across **30 short levels** in **6 themed zones**.

### Zones

| # | Zone | Theme |
|---|------|-------|
| 1 | 🏘️ قرية الفوضى | Village of Chaos |
| 2 | 🌳 غابة المقالب | Prank Forest |
| 3 | 🤖 مدينة الروبوتات | Broken Robot City |
| 4 | 🍔 مهرجان الطعام | Crazy Food Festival |
| 5 | 🏰 قلعة الضحك | Laugh Castle |
| 6 | 🎪 النهاية الكبرى | Final Showdown |

---

## 🕹️ Controls

| Action | Key |
|--------|-----|
| Move Left | `←` or `A` |
| Move Right | `→` or `D` |
| Jump | `Space` or `↑` |
| Interact / Click | Mouse click |

---

## 🚀 How to Run

**No build step. No server. No dependencies.**

Simply open `index.html` in any modern browser:

```bash
# Option 1 — just open the file
open j1/index.html

# Option 2 — use a local server (optional)
cd j1
python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## 📁 Project Structure

```
j1/
├── index.html          # Entry point
├── css/
│   └── style.css       # UI styling (child-friendly, colorful)
└── js/
    ├── main.js         # Game boot + game loop
    ├── levelManager.js # Level lifecycle (load/unload/reset)
    ├── levels.js       # All 30 level definitions
    ├── templates.js    # 8 reusable level templates
    ├── player.js       # Player controller + rendering
    ├── entities.js     # Platforms, items, obstacles, NPCs
    ├── ui.js           # Menu, HUD, popups
    ├── input.js        # Keyboard + mouse + touch input
    ├── audio.js        # Procedural sound effects (no files needed)
    └── save.js         # LocalStorage save/load
```

---

## 🧩 Level Types

| Template | Used For |
|----------|----------|
| `PlatformLevel` | Jump, collect, reach goal |
| `CollectLevel` | Gather items before time runs out |
| `ChaseLevel` | Chase or be chased by NPCs |
| `ChoiceLevel` | Pick the correct answer |
| `PuzzleLevel` | Drag & drop pieces to slots |
| `PatternLevel` | Simon-says style memory game |
| `EscapeLevel` | Run from chasers to safe zone |
| `BossLevel` | Multi-phase funny final encounter |

---

## 💾 Save System

Progress is saved automatically to `localStorage`:
- Unlocked levels
- Collected stars (⭐)
- Sound preference

---

## 🎨 Design Principles

- **Simple** — no overengineering, no unnecessary systems
- **Stable** — clean state management, safe resets, no memory leaks
- **Child-friendly** — no violence, no horror, no frustration
- **Fast** — short levels (30–90 sec), instant retry on failure
- **Funny** — silly characters, visual comedy, light humor
- **Zero dependencies** — pure HTML + CSS + JS

---

## 📜 License

MIT
