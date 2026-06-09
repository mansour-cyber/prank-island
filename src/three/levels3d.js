/* ============================================================
   3D level / difficulty progression.
   Each level: collect all gems and reach the portal before the
   timer runs out, while dodging patrolling hazards. Difficulty
   ramps: more gems, less time, more hazards.
   ============================================================ */
export const LEVEL_NAMES = [
  'بستان البداية', 'تلال الجواهر', 'مرج النحل', 'وادي السرعة',
  'غابة الألغاز', 'هضبة الأبطال', 'قمة التحدي', 'جزيرة الأساطير',
];

export const TOTAL_LEVELS_3D = LEVEL_NAMES.length;

export function levelConfig(idx) {
  const gems = 5 + idx;                         // 5..12
  const hazards = Math.min(idx, 6);             // 0..6 patrolling hazards
  const time = Math.round(70 + gems * 1.5 - idx * 5); // gradually tighter
  const platforms = idx % 2 === 0 ? 3 : 4;
  return {
    index: idx,
    name: LEVEL_NAMES[idx] || `المرحلة ${idx + 1}`,
    gems, hazards, time, platforms,
    hazardSpeed: 1.6 + idx * 0.25,
  };
}

/* Stars from how much time was left (fraction). */
export function starsFor(timeLeft, timeMax) {
  const f = timeLeft / timeMax;
  if (f >= 0.55) return 3;
  if (f >= 0.3) return 2;
  return 1;
}
