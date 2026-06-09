/* ============================================================
   LEVEL DATA — data-driven level definitions.
   Zone 1 (indices 0–4) is the fully-playable vertical slice.
   Zones 2–6 carry metadata for the level-select UI and are
   flagged { ready:false } until ported.
   ============================================================ */
import { ZONE_THEMES } from '../config.js';

export const ZONES = ZONE_THEMES.map((z) => ({ name: z.name, emoji: z.emoji }));

/* Helpers to keep level configs terse */
const item = (x, y, frame, extra = {}) => ({ x, y, frame, w: 30, h: 30, ...extra });

export const LEVELS = [
  /* ===================== ZONE 1 — Village of Chaos ===================== */

  // 1. The Thief Chicken — chase & catch the chicken 3 times
  {
    title: 'الدجاجة اللصة', emoji: '🐔', ready: true,
    objective: 'اقبض على الدجاجة 3 مرات واسترجع المفتاح!',
    type: 'chase',
    config: {
      timer: 30, chasing: false, collectTarget: 3,
      startX: 60, startY: 390,
      npc: { frame: 'chicken', x: 600, y: 388, w: 44, h: 44, speed: 150 },
      obstacles: [
        { x: 200, y: 380, frame: 'egg', w: 28, h: 34, vx: 0, vy: -130 },
        { x: 400, y: 350, frame: 'egg', w: 28, h: 34, vx: 0, vy: -110 },
        { x: 600, y: 370, frame: 'egg', w: 28, h: 34, vx: 0, vy: -140 },
      ],
    },
  },

  // 2. The Runaway Shoes — collect 5 moving shoes before time runs out
  {
    title: 'الأحذية الهاربة', emoji: '👟', ready: true,
    objective: 'اجمع 5 أحذية قبل انتهاء الوقت!',
    type: 'collect',
    config: {
      timer: 25, collectTarget: 5, startX: 60, startY: 390,
      platforms: [[150, 360, 120, 16], [400, 320, 120, 16], [600, 370, 120, 16]],
      items: [
        item(110, 330, 'shoe', { w: 36, h: 30, vx: 70 }),
        item(250, 300, 'shoe', { w: 36, h: 30, vx: -60 }),
        item(420, 290, 'shoe', { w: 36, h: 30, vx: 80 }),
        item(560, 340, 'shoe', { w: 36, h: 30, vx: -70 }),
        item(700, 310, 'shoe', { w: 36, h: 30, vx: 55 }),
      ],
    },
  },

  // 3. Clown Face Fix — drag the face parts onto the clown
  {
    title: 'وجه المهرج', emoji: '🤡', ready: true,
    objective: 'رتّب أجزاء وجه المهرج في أماكنها!',
    type: 'puzzle',
    config: {
      base: { frame: 'clownhead', x: 400, y: 230, w: 200, h: 200 },
      pieces: [
        { frame: 'p_nose',  x: 110, y: 400, w: 48, h: 48, accept: 0 },
        { frame: 'p_mouth', x: 250, y: 400, w: 58, h: 38, accept: 1 },
        { frame: 'p_bow',   x: 390, y: 400, w: 60, h: 42, accept: 2 },
        { frame: 'p_eye',   x: 540, y: 400, w: 46, h: 46, accept: 3 },
      ],
      slots: [
        { x: 400, y: 235, w: 52, h: 52, accept: 0, label: 'الأنف' },
        { x: 400, y: 300, w: 60, h: 42, accept: 1, label: 'الفم' },
        { x: 400, y: 150, w: 62, h: 44, accept: 2, label: 'القبعة' },
        { x: 350, y: 205, w: 48, h: 48, accept: 3, label: 'العين' },
      ],
    },
  },

  // 4. Mud Jump — leap the mud pits to the door
  {
    title: 'قفز الوحل', emoji: '🟤', ready: true,
    objective: 'اقفز فوق حفر الوحل ووصّل للباب!',
    type: 'platform',
    config: {
      startX: 30, startY: 380, noGround: true,
      platforms: [[0, 440, 120, 60], [200, 440, 80, 60], [360, 440, 80, 60], [520, 440, 80, 60], [680, 440, 120, 60]],
      decor: [{ frame: 'mud', x: 160, y: 470 }, { frame: 'mud', x: 320, y: 470 }, { frame: 'mud', x: 480, y: 470 }, { frame: 'mud', x: 630, y: 470 }],
      goal: { frame: 'door', x: 728, y: 372, w: 48, h: 64 },
    },
  },

  // 5. Watermelon Cart — collect 3 melons, dodge rocks, reach the flag
  {
    title: 'عربة البطيخ', emoji: '🍉', ready: true,
    objective: 'اجمع 3 بطيخات وتجنب الصخور ووصّل للعلم!',
    type: 'collect',
    config: {
      startX: 30, startY: 390, collectTarget: 3,
      items: [item(150, 400, 'watermelon', { w: 40, h: 36 }), item(280, 400, 'watermelon', { w: 40, h: 36 }), item(470, 400, 'watermelon', { w: 40, h: 36 })],
      obstacles: [{ x: 360, y: 404, frame: 'rock', w: 36, h: 32, vx: 0, vy: 0 }, { x: 560, y: 404, frame: 'rock', w: 36, h: 32, vx: 0, vy: 0 }],
      goal: { frame: 'flag', x: 724, y: 378, w: 44, h: 58 },
    },
  },

  /* ===================== ZONES 2–6 — metadata only (coming soon) ===================== */
  ...zoneStubs([
    ['القرد والنظارات', '🐒'], ['الضفدع المغني', '🐸'], ['النحلة الزعلانة', '🐝'], ['البيت المقلوب', '🏚️'], ['شلال الفقاعات', '🫧'],
    ['الروبوت الكسول', '🤖'], ['مصنع الفقاعات', '🫧'], ['الأزرار المجنونة', '🔘'], ['الليزر المرح', '✨'], ['الروبوت العملاق', '🦾'],
    ['برج البيتزا', '🍕'], ['سباق الآيس كريم', '🍦'], ['مطر الكعك', '🧁'], ['الطباخ الغاضب', '👨‍🍳'], ['وحش الطعام', '🍔'],
    ['الفارس المرتبك', '🤺'], ['التنين النعسان', '🐉'], ['الكنز المخفي', '💎'], ['المرايا السحرية', '🪞'], ['ملك القلعة', '🤴'],
    ['الأراجيح الطائرة', '🎡'], ['خيمة الألغاز', '⛺'], ['المهرج الكبير', '🤡'], ['عجلة الحظ', '🎰'], ['الملك فرفوش', '👑'],
  ]),
];

function zoneStubs(list) {
  return list.map(([title, emoji]) => ({
    title, emoji, ready: false,
    objective: 'هذه المرحلة قيد التطوير — قريباً!',
    type: 'comingSoon', config: {},
  }));
}
