# 🎨 Design — Figma source

The landing page (`/index.html`) was designed in **Figma** and implemented to match.

## Figma file
- **جزيرة المقالب — Landing Page**
- https://www.figma.com/design/hYsO8rxjSiFoCtru2TS5A3
- fileKey: `hYsO8rxjSiFoCtru2TS5A3`

## Regenerating the design

[`figma-landing.js`](./figma-landing.js) is **Figma Plugin API** code that builds
the whole landing page as an editable, auto-layout frame (header, hero, mode
cards, features, zones, how-to, CTA, footer) in the game's palette with an
Arabic font (Cairo → Tajawal → Noto Sans Arabic fallback).

Run it either way:
- **Figma MCP** — pass the file body as the `code` argument of `use_figma`
  against the file key above.
- **Figma plugin console** — paste into a scratch plugin and run.

> Pushing into Figma via the MCP consumes plan tool-call quota; on the Starter
> plan you may hit a rate limit — just retry once it resets.

## Design tokens (shared with `index.html`)

| Token | Hex | Use |
|-------|-----|-----|
| ink | `#3a2c28` | text, borders |
| cream | `#fff7ec` | page background |
| gold | `#ffd23f` | primary CTA |
| sky / sky2 | `#bfeaff` / `#9fd6f4` | hero gradient |
| green | `#6abe4c` | 2D mode |
| purple | `#ab47bc` | 3D mode |
| blue | `#5aa9e6` | open-world mode |
