/* ============================================================
   Global constants & zone themes
   Base resolution kept at 800x500 so the original level
   coordinates port across 1:1. Scale.FIT handles responsiveness.
   ============================================================ */
export const WIDTH = 800;
export const HEIGHT = 500;
export const GROUND_Y = 440;

export const PHYSICS = {
  gravity: 900,
  speed: 220,
  jump: 360,
};

/* Per-zone visual theme (tint applied to shared art) */
export const ZONE_THEMES = [
  { name: 'قرية الفوضى',   emoji: '🏘️', sky: 0xbfeaff, hill: 0x9ccc65, accent: 0xff9800 },
  { name: 'غابة المقالب',  emoji: '🌳', sky: 0x9fd8a0, hill: 0x4caf50, accent: 0xe040fb },
  { name: 'مدينة الروبوتات', emoji: '🤖', sky: 0x9fb6c2, hill: 0x78909c, accent: 0x00e5ff },
  { name: 'مهرجان الطعام',  emoji: '🍔', sky: 0xffd1a3, hill: 0xff8a65, accent: 0xf44336 },
  { name: 'قلعة الضحك',    emoji: '🏰', sky: 0xc9b6ec, hill: 0x9e9e9e, accent: 0xfdd835 },
  { name: 'النهاية الكبرى', emoji: '🎪', sky: 0xf4a6c2, hill: 0x9c5a6e, accent: 0x76ff03 },
];

export const COLORS = {
  ink: '#3a2c28',
  cream: '#fff7ec',
  panel: 0xfff7ec,
  panelEdge: 0x3a2c28,
  good: 0x6abe4c,
  bad: 0xef5350,
  gold: 0xffd23f,
};

export const FONT = '"Tahoma", "Segoe UI", sans-serif';

export const TOTAL_LEVELS = 30;
export function zoneOf(levelIdx) { return Math.floor(levelIdx / 5); }
