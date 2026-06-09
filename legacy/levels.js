/* ============================================
   LEVELS - All 30 level definitions
   ============================================ */
window.G = window.G || {};

G.levels = (() => {
  const W = 800, H = 500;

  /* Zone metadata */
  const ZONES = [
    { name: 'قرية الفوضى', nameEn: 'Village of Chaos', emoji: '🏘️' },
    { name: 'غابة المقالب', nameEn: 'Prank Forest', emoji: '🌳' },
    { name: 'مدينة الروبوتات', nameEn: 'Robot City', emoji: '🤖' },
    { name: 'مهرجان الطعام', nameEn: 'Food Festival', emoji: '🍔' },
    { name: 'قلعة الضحك', nameEn: 'Laugh Castle', emoji: '🏰' },
    { name: 'النهاية الكبرى', nameEn: 'Final Showdown', emoji: '🎪' },
  ];

  /* Level configs - each returns a template instance */
  const LEVELS = [

    // ============ ZONE 1: Village of Chaos ============

    // 1. The Thief Chicken
    {
      title: 'الدجاجة اللصة', emoji: '🐔',
      objective: 'اقبض على الدجاجة واسترجع المفتاح!',
      create() {
        return new G.templates.ChaseLevel({
          index: 0, timer: 30, chasing: false,
          npc: [600, 400, 36, 36, '🐔', 140],
          collectTarget: 3,
          groundY: 440, startX: 60, startY: 390,
          obstacles: [
            [200, 380, 24, 24, '🥚', 0, -120],
            [400, 350, 24, 24, '🥚', 0, -100],
            [600, 370, 24, 24, '🥚', 0, -130],
          ]
        });
      }
    },

    // 2. The Runaway Shoes
    {
      title: 'الأحذية الهاربة', emoji: '👟',
      objective: 'اجمع 5 أحذية قبل انتهاء الوقت!',
      create() {
        const items = [];
        for (let i = 0; i < 5; i++) {
          items.push([100 + i * 140, 300 + Math.random() * 80, 32, 32, '👟', 40 + Math.random() * 60, 0]);
        }
        return new G.templates.CollectLevel({
          index: 1, timer: 25, collectTarget: 5,
          groundY: 440, startX: 60, startY: 390,
          items,
          platforms: [[150, 360, 120, 16], [400, 320, 120, 16], [600, 370, 120, 16]]
        });
      }
    },

    // 3. Clown Face Fix
    {
      title: 'وجه المهرج', emoji: '🤡',
      objective: 'رتّب أجزاء وجه المهرج في أماكنها!',
      create() {
        return new G.templates.PuzzleLevel({
          index: 2,
          pieces: [
            { emoji: '👃', x: 100, y: 380, w: 50, h: 50, targetSlot: 0 },
            { emoji: '👄', x: 200, y: 380, w: 50, h: 50, targetSlot: 1 },
            { emoji: '🎀', x: 300, y: 380, w: 50, h: 50, targetSlot: 2 },
            { emoji: '👁️', x: 450, y: 380, w: 50, h: 50, targetSlot: 3 },
          ],
          slots: [
            { x: 375, y: 180, w: 55, h: 55, acceptIdx: 0, label: 'الأنف' },
            { x: 375, y: 260, w: 55, h: 55, acceptIdx: 1, label: 'الفم' },
            { x: 375, y: 100, w: 55, h: 55, acceptIdx: 2, label: 'القبعة' },
            { x: 310, y: 150, w: 55, h: 55, acceptIdx: 3, label: 'العين' },
          ],
          target: 4
        });
      }
    },

    // 4. Mud Jump
    {
      title: 'قفز الوحل', emoji: '🟤',
      objective: 'اقفز فوق حفر الوحل ووصّل للباب!',
      create() {
        return new G.templates.PlatformLevel({
          index: 3, groundY: 440, startX: 30, startY: 390, noGround: true,
          platforms: [
            [0, 440, 120, 60],
            [200, 440, 80, 60],
            [360, 440, 80, 60],
            [520, 440, 80, 60],
            [680, 440, 120, 60],
          ],
          goal: [730, 390, 40, 50, '🚪']
        });
      }
    },

    // 5. Watermelon Cart
    {
      title: 'عربة البطيخ', emoji: '🍉',
      objective: 'ادفع العربة للهدف وتجنب العوائق!',
      create() {
        return new G.templates.PlatformLevel({
          index: 4, groundY: 440, startX: 30, startY: 390,
          items: [[150, 405, 36, 36, '🍉'], [250, 405, 36, 36, '🍉'], [450, 405, 36, 36, '🍉']],
          collectTarget: 3,
          obstacles: [[350, 400, 30, 30, '🪨'], [550, 400, 30, 30, '🪨']],
          goal: [720, 390, 40, 50, '🏁']
        });
      }
    },

    // ============ ZONE 2: Prank Forest ============

    // 6. Monkey and Glasses
    {
      title: 'القرد والنظارات', emoji: '🐒',
      objective: 'استرجع 3 نظارات من القرد المشاغب!',
      create() {
        return new G.templates.ChaseLevel({
          index: 5, timer: 35, chasing: false,
          npc: [500, 400, 40, 40, '🐒', 160],
          collectTarget: 3,
          groundY: 440, startX: 60, startY: 390,
          platforms: [[200, 360, 100, 16], [450, 320, 100, 16], [650, 370, 100, 16]]
        });
      }
    },

    // 7. Singing Frog
    {
      title: 'الضفدع المغني', emoji: '🐸',
      objective: 'كرّر نمط الضفدع بالترتيب الصحيح!',
      create() {
        return new G.templates.PatternLevel({
          index: 6,
          colors: ['#f44336', '#4caf50', '#2196f3', '#fdd835'],
          emojis: ['🔴', '🟢', '🔵', '🟡'],
          maxRounds: 3
        });
      }
    },

    // 8. Moody Bee
    {
      title: 'النحلة الزعلانة', emoji: '🐝',
      objective: 'اهرب من النحلة ثم اجمع الزهرة لتهدئتها!',
      create() {
        return new G.templates.EscapeLevel({
          index: 7, groundY: 440, startX: 60, startY: 390,
          chasers: [[700, 408, 32, 32, '🐝', 90]],
          safeZone: { x: 350, y: 350, w: 80, h: 90 },
          items: [[380, 370, 32, 32, '🌸']],
          collectTarget: 1,
        });
      }
    },

    // 9. Upside-Down House
    {
      title: 'البيت المقلوب', emoji: '🏚️',
      objective: 'ابحث في البيت عن المفتاح المخفي!',
      create() {
        const items = [
          [150, 360, 28, 28, '📦'], [300, 280, 28, 28, '📦'],
          [500, 320, 28, 28, '📦'], [650, 360, 28, 28, '🔑'],
          [400, 200, 28, 28, '📦'], [200, 150, 28, 28, '📦'],
        ];
        return new G.templates.CollectLevel({
          index: 8, timer: 30, collectTarget: 6,
          groundY: 440, startX: 60, startY: 390,
          items,
          platforms: [
            [100, 320, 150, 16], [350, 260, 150, 16],
            [550, 320, 150, 16], [200, 180, 150, 16],
            [500, 180, 120, 16],
          ]
        });
      }
    },

    // 10. Bubble Falls
    {
      title: 'شلال الفقاعات', emoji: '🫧',
      objective: 'انزل بين الفقاعات وتجنب المزيفة!',
      create() {
        const obs = [];
        for (let i = 0; i < 6; i++) {
          obs.push([100 + Math.random() * 600, 80 + i * 60, 28, 28, '💥', 30 + Math.random() * 40, 0]);
        }
        return new G.templates.PlatformLevel({
          index: 9, groundY: 440, startX: 400, startY: 60,
          platforms: [
            [300, 100, 200, 14], [100, 180, 150, 14], [500, 180, 150, 14],
            [250, 260, 150, 14], [450, 340, 180, 14], [100, 340, 120, 14],
          ],
          items: [[160, 150, 28, 28, '🫧'], [550, 150, 28, 28, '🫧'], [300, 230, 28, 28, '🫧']],
          collectTarget: 3,
          obstacles: obs,
          goal: [380, 390, 40, 50, '🚪']
        });
      }
    },

    // ============ ZONE 3: Robot City ============

    // 11. Lazy Robot
    {
      title: 'الروبوت الكسلان', emoji: '🤖',
      objective: 'اجمع 4 بطاريات لتشغيل الروبوت!',
      create() {
        return new G.templates.CollectLevel({
          index: 10, timer: 25, collectTarget: 4,
          groundY: 440, startX: 60, startY: 390,
          items: [
            [200, 350, 28, 28, '🔋'], [400, 280, 28, 28, '🔋'],
            [550, 350, 28, 28, '🔋'], [700, 300, 28, 28, '🔋'],
          ],
          platforms: [
            [150, 380, 120, 16], [350, 320, 120, 16],
            [500, 380, 120, 16], [650, 340, 120, 16],
          ]
        });
      }
    },

    // 12. Wrong Button
    {
      title: 'الزر الغلط', emoji: '🔘',
      objective: 'اختر الزر الصحيح من بين الأزرار!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 11,
          npcEmoji: '🤖',
          rounds: [
            { question: 'أي زر يشغّل الروبوت؟', options: [
              { label: 'أحمر', emoji: '🔴', correct: false },
              { label: 'أخضر', emoji: '🟢', correct: true },
              { label: 'أزرق', emoji: '🔵', correct: false },
            ]},
            { question: 'أي زر يفتح الباب؟', options: [
              { label: 'مربع', emoji: '🟧', correct: false },
              { label: 'دائرة', emoji: '⭕', correct: true },
              { label: 'مثلث', emoji: '🔺', correct: false },
            ]},
            { question: 'أي زر يطفئ الإنذار؟', options: [
              { label: 'يسار', emoji: '⬅️', correct: false },
              { label: 'وسط', emoji: '⏺️', correct: false },
              { label: 'يمين', emoji: '➡️', correct: true },
            ]},
          ],
          target: 3
        });
      }
    },

    // 13. Sound Factory
    {
      title: 'مصنع الأصوات', emoji: '🔊',
      objective: 'وصّل الأنابيب بالترتيب الصحيح!',
      create() {
        return new G.templates.PuzzleLevel({
          index: 12,
          pieces: [
            { emoji: '🔵', x: 80, y: 380, w: 55, h: 55, targetSlot: 0 },
            { emoji: '🟢', x: 200, y: 380, w: 55, h: 55, targetSlot: 1 },
            { emoji: '🔴', x: 320, y: 380, w: 55, h: 55, targetSlot: 2 },
          ],
          slots: [
            { x: 250, y: 160, w: 60, h: 60, acceptIdx: 0, label: '1️⃣' },
            { x: 370, y: 160, w: 60, h: 60, acceptIdx: 1, label: '2️⃣' },
            { x: 490, y: 160, w: 60, h: 60, acceptIdx: 2, label: '3️⃣' },
          ],
          target: 3
        });
      }
    },

    // 14. Crazy Vacuum
    {
      title: 'المكنسة المجنونة', emoji: '🌀',
      objective: 'اهرب من المكنسة الكهربائية للمنطقة الآمنة!',
      create() {
        return new G.templates.EscapeLevel({
          index: 13, groundY: 440, startX: 60, startY: 390,
          chasers: [[700, 408, 36, 36, '🌀', 110]],
          safeZone: { x: 700, y: 370, w: 80, h: 70 },
          platforms: [
            [180, 380, 100, 16], [350, 340, 100, 16], [530, 380, 100, 16],
          ]
        });
      }
    },

    // 15. Fix the Robot Face
    {
      title: 'وجه الروبوت', emoji: '🤖',
      objective: 'ركّب أجزاء وجه الروبوت!',
      create() {
        return new G.templates.PuzzleLevel({
          index: 14,
          pieces: [
            { emoji: '👁️', x: 100, y: 370, w: 50, h: 50, targetSlot: 0 },
            { emoji: '👁️', x: 200, y: 370, w: 50, h: 50, targetSlot: 1 },
            { emoji: '📡', x: 350, y: 370, w: 50, h: 50, targetSlot: 2 },
            { emoji: '⚙️', x: 500, y: 370, w: 50, h: 50, targetSlot: 3 },
          ],
          slots: [
            { x: 320, y: 150, w: 55, h: 55, acceptIdx: 0, label: 'عين يمنى' },
            { x: 420, y: 150, w: 55, h: 55, acceptIdx: 1, label: 'عين يسرى' },
            { x: 370, y: 80, w: 55, h: 55, acceptIdx: 2, label: 'هوائي' },
            { x: 370, y: 230, w: 55, h: 55, acceptIdx: 3, label: 'فم' },
          ],
          target: 4
        });
      }
    },

    // ============ ZONE 4: Crazy Food Festival ============

    // 16. Runaway Burger
    {
      title: 'البرغر الهارب', emoji: '🍔',
      objective: 'اجمع 5 مكونات البرغر الطايرة!',
      create() {
        const items = [];
        const emojis = ['🍞', '🥬', '🍖', '🧀', '🍅'];
        emojis.forEach((e, i) => {
          items.push([100 + i * 140, 200 + Math.random() * 150, 32, 32, e, 30 + Math.random() * 50, 20 + Math.random() * 30]);
        });
        return new G.templates.CollectLevel({
          index: 15, timer: 30, collectTarget: 5,
          groundY: 440, startX: 60, startY: 390,
          items,
          platforms: [[150, 350, 120, 16], [400, 300, 120, 16], [600, 370, 120, 16]]
        });
      }
    },

    // 17. Soup Chaos
    {
      title: 'فوضى الحساء', emoji: '🍲',
      objective: 'اختر 3 مكونات صحيحة للحساء!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 16,
          npcEmoji: '👨‍🍳',
          rounds: [
            { question: 'أي مكون يروح في الحساء؟', options: [
              { label: 'جزر', emoji: '🥕', correct: true },
              { label: 'حذاء', emoji: '👞', correct: false },
              { label: 'مفتاح', emoji: '🔑', correct: false },
            ]},
            { question: 'أي مكون ثاني؟', options: [
              { label: 'صابون', emoji: '🧼', correct: false },
              { label: 'بطاطس', emoji: '🥔', correct: true },
              { label: 'كرة', emoji: '⚽', correct: false },
            ]},
            { question: 'المكون الأخير!', options: [
              { label: 'بصل', emoji: '🧅', correct: true },
              { label: 'قلم', emoji: '✏️', correct: false },
              { label: 'ساعة', emoji: '⏰', correct: false },
            ]},
          ],
          target: 3
        });
      }
    },

    // 18. Angry Chef
    {
      title: 'الشيف الغضبان', emoji: '👨‍🍳',
      objective: 'جهّز طلبات الشيف بسرعة!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 17, timer: 40,
          npcEmoji: '👨‍🍳',
          rounds: [
            { question: 'الشيف يبي بيتزا!', options: [
              { label: 'بيتزا', emoji: '🍕', correct: true },
              { label: 'سمك', emoji: '🐟', correct: false },
              { label: 'كيك', emoji: '🎂', correct: false },
            ]},
            { question: 'الشيف يبي سلطة!', options: [
              { label: 'برغر', emoji: '🍔', correct: false },
              { label: 'سلطة', emoji: '🥗', correct: true },
              { label: 'آيسكريم', emoji: '🍦', correct: false },
            ]},
            { question: 'الشيف يبي عصير!', options: [
              { label: 'شاي', emoji: '🍵', correct: false },
              { label: 'حليب', emoji: '🥛', correct: false },
              { label: 'عصير', emoji: '🧃', correct: true },
            ]},
            { question: 'الشيف يبي كيك!', options: [
              { label: 'كيك', emoji: '🎂', correct: true },
              { label: 'دونات', emoji: '🍩', correct: false },
            ]},
          ],
          target: 4
        });
      }
    },

    // 19. Ice Cream Run
    {
      title: 'سباق الآيسكريم', emoji: '🍦',
      objective: 'وصّل للنهاية بدون ما تطيح الآيسكريم!',
      create() {
        return new G.templates.PlatformLevel({
          index: 18, groundY: 440, startX: 30, startY: 390,
          platforms: [
            [150, 380, 100, 16], [310, 350, 100, 16],
            [470, 380, 100, 16], [600, 340, 100, 16],
          ],
          obstacles: [
            [200, 360, 28, 28, '🔥', 0, 0],
            [400, 340, 28, 28, '🔥', 0, 0],
            [550, 360, 28, 28, '🔥', 0, 0],
          ],
          goal: [730, 290, 40, 50, '🏁'],
          timer: 20
        });
      }
    },

    // 20. Golden Spoon
    {
      title: 'الملعقة الذهبية', emoji: '🥄',
      objective: 'اكتشف الملعقة الحقيقية بين المزيفة!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 19,
          npcEmoji: '🧙',
          rounds: [
            { question: 'أي ملعقة هي الذهبية؟', options: [
              { label: 'فضية', emoji: '🥈', correct: false },
              { label: 'ذهبية', emoji: '🥇', correct: true },
              { label: 'خشبية', emoji: '🪵', correct: false },
            ]},
            { question: 'أي وعاء فيه الذهب؟', options: [
              { label: 'أحمر', emoji: '🔴', correct: false },
              { label: 'أزرق', emoji: '🔵', correct: false },
              { label: 'أصفر', emoji: '🟡', correct: true },
            ]},
            { question: 'وين الملعقة الأخيرة؟', options: [
              { label: 'يسار', emoji: '⬅️', correct: false },
              { label: 'وسط', emoji: '⏺️', correct: true },
              { label: 'يمين', emoji: '➡️', correct: false },
            ]},
          ],
          target: 3
        });
      }
    },

    // ============ ZONE 5: Laugh Castle ============

    // 21. Mirror Hall
    {
      title: 'قاعة المرايا', emoji: '🪞',
      objective: 'اختر الطريق الصحيح بين الانعكاسات!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 20,
          npcEmoji: '🪞',
          rounds: [
            { question: 'أي باب هو الحقيقي؟', options: [
              { label: 'الباب ١', emoji: '🚪', correct: false },
              { label: 'الباب ٢', emoji: '🚪', correct: true },
              { label: 'الباب ٣', emoji: '🚪', correct: false },
            ]},
            { question: 'أي مرآة تعكس الحقيقة؟', options: [
              { label: 'يسار', emoji: '🪞', correct: true },
              { label: 'يمين', emoji: '🪞', correct: false },
            ]},
            { question: 'أي ممر يوصّل للخروج؟', options: [
              { label: 'فوق', emoji: '⬆️', correct: false },
              { label: 'وسط', emoji: '➡️', correct: true },
              { label: 'تحت', emoji: '⬇️', correct: false },
            ]},
          ],
          target: 3
        });
      }
    },

    // 22. Scared Ghosts
    {
      title: 'الأشباح الخايفة', emoji: '👻',
      objective: 'وجّه كل شبح لبابه الصحيح!',
      create() {
        return new G.templates.PuzzleLevel({
          index: 21,
          pieces: [
            { emoji: '👻', x: 100, y: 350, w: 55, h: 55, targetSlot: 0 },
            { emoji: '🎃', x: 250, y: 350, w: 55, h: 55, targetSlot: 1 },
            { emoji: '💀', x: 400, y: 350, w: 55, h: 55, targetSlot: 2 },
          ],
          slots: [
            { x: 200, y: 130, w: 60, h: 60, acceptIdx: 0, label: 'باب أبيض' },
            { x: 370, y: 130, w: 60, h: 60, acceptIdx: 1, label: 'باب برتقالي' },
            { x: 540, y: 130, w: 60, h: 60, acceptIdx: 2, label: 'باب أسود' },
          ],
          target: 3
        });
      }
    },

    // 23. Prank Chair
    {
      title: 'كرسي المقلب', emoji: '💺',
      objective: 'اختر الكرسي الصحيح 3 مرات!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 22,
          npcEmoji: '🤴',
          rounds: [
            { question: 'أي كرسي آمن؟', options: [
              { label: 'ذهبي', emoji: '💛', correct: true },
              { label: 'أحمر', emoji: '❤️', correct: false },
              { label: 'أزرق', emoji: '💙', correct: false },
            ]},
            { question: 'جرّب مرة ثانية!', options: [
              { label: 'صغير', emoji: '🪑', correct: false },
              { label: 'كبير', emoji: '🛋️', correct: true },
              { label: 'عادي', emoji: '💺', correct: false },
            ]},
            { question: 'آخر محاولة!', options: [
              { label: 'يسار', emoji: '⬅️', correct: false },
              { label: 'وسط', emoji: '⬇️', correct: false },
              { label: 'يمين', emoji: '➡️', correct: true },
            ]},
          ],
          target: 3
        });
      }
    },

    // 24. Portrait Puzzle
    {
      title: 'لغز البورتريه', emoji: '🖼️',
      objective: 'رتّب صور الملك بالترتيب الصحيح!',
      create() {
        return new G.templates.PuzzleLevel({
          index: 23,
          pieces: [
            { emoji: '👶', x: 550, y: 370, w: 55, h: 55, targetSlot: 0 },
            { emoji: '🧑', x: 150, y: 370, w: 55, h: 55, targetSlot: 1 },
            { emoji: '👨', x: 400, y: 370, w: 55, h: 55, targetSlot: 2 },
            { emoji: '👴', x: 250, y: 370, w: 55, h: 55, targetSlot: 3 },
          ],
          slots: [
            { x: 150, y: 160, w: 60, h: 60, acceptIdx: 0, label: '١' },
            { x: 280, y: 160, w: 60, h: 60, acceptIdx: 1, label: '٢' },
            { x: 410, y: 160, w: 60, h: 60, acceptIdx: 2, label: '٣' },
            { x: 540, y: 160, w: 60, h: 60, acceptIdx: 3, label: '٤' },
          ],
          target: 4
        });
      }
    },

    // 25. Moving Floor
    {
      title: 'الأرضية المتحركة', emoji: '🟩',
      objective: 'اعبر الأرضية المتغيرة بأمان!',
      create() {
        return new G.templates.PlatformLevel({
          index: 24, groundY: 480, startX: 30, startY: 340, noGround: true,
          platforms: [
            [0, 380, 100, 20], [160, 360, 80, 20],
            [300, 340, 80, 20], [440, 360, 80, 20],
            [580, 340, 80, 20], [700, 380, 100, 20],
          ],
          goal: [740, 330, 40, 50, '🚪']
        });
      }
    },

    // ============ ZONE 6: Final Zone ============

    // 26. Laugh Test
    {
      title: 'اختبار الضحك', emoji: '😂',
      objective: 'جاوب على الأسئلة المضحكة!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 25,
          npcEmoji: '🎭',
          rounds: [
            { question: 'شو يلبس البحر؟', options: [
              { label: 'موجة قبعة', emoji: '🌊', correct: false },
              { label: 'خاتم مرجان', emoji: '💍', correct: false },
              { label: 'تاج أمواج', emoji: '👑', correct: true },
            ]},
            { question: 'ليش البرتقالة رايحة المدرسة؟', options: [
              { label: 'تتعلم عصير', emoji: '🧃', correct: true },
              { label: 'تدرّس فاكهة', emoji: '📚', correct: false },
              { label: 'تلعب كرة', emoji: '⚽', correct: false },
            ]},
            { question: 'شو يقول الجبن لما يشوف نفسه بالمرآة؟', options: [
              { label: 'هالومي!', emoji: '🧀', correct: true },
              { label: 'يا سلام!', emoji: '😍', correct: false },
              { label: 'واو!', emoji: '😮', correct: false },
            ]},
          ],
          target: 3
        });
      }
    },

    // 27. Balloon Chase
    {
      title: 'مطاردة البالونات', emoji: '🎈',
      objective: 'اجمع البالونات الصحيحة وتجنب المزيفة!',
      create() {
        const items = [];
        const good = ['🎈', '🎈', '🎈', '🎈', '🎈'];
        good.forEach((e, i) => {
          items.push([80 + i * 150, 100 + Math.random() * 200, 32, 32, e, 0, 15 + Math.random() * 20]);
        });
        return new G.templates.CollectLevel({
          index: 26, timer: 25, collectTarget: 5,
          groundY: 440, startX: 60, startY: 390,
          items,
          obstacles: [
            [200, 200, 28, 28, '💣', 20, 20],
            [500, 150, 28, 28, '💣', -20, 15],
            [350, 300, 28, 28, '💣', 15, -20],
          ],
          platforms: [
            [100, 360, 100, 16], [300, 300, 100, 16],
            [500, 360, 100, 16], [650, 300, 100, 16],
          ]
        });
      }
    },

    // 28. Final Trap Run
    {
      title: 'سباق الفخاخ', emoji: '🏃',
      objective: 'اعبر كل الفخاخ ووصّل للنهاية!',
      create() {
        return new G.templates.PlatformLevel({
          index: 27, groundY: 440, startX: 20, startY: 390,
          platforms: [
            [120, 380, 80, 16], [260, 350, 80, 16],
            [400, 320, 80, 16], [520, 370, 80, 16],
            [650, 340, 80, 16],
          ],
          obstacles: [
            [80, 410, 28, 28, '🔥'], [210, 380, 28, 28, '💣'],
            [350, 360, 28, 28, '🌀'], [480, 390, 28, 28, '🥧'],
            [610, 370, 28, 28, '💥'],
          ],
          items: [
            [150, 350, 28, 28, '⭐'], [300, 310, 28, 28, '⭐'],
            [550, 340, 28, 28, '⭐'],
          ],
          collectTarget: 0,
          goal: [740, 290, 40, 50, '🏁'],
          timer: 30
        });
      }
    },

    // 29. Chaos Machine
    {
      title: 'آلة الفوضى', emoji: '⚙️',
      objective: 'عطّل آلة الفوضى بحل 3 ألغاز!',
      create() {
        return new G.templates.ChoiceLevel({
          index: 28, timer: 45,
          npcEmoji: '⚙️',
          rounds: [
            { question: 'أي سلك تقطعه؟ (الأحمر دائماً غلط!)', options: [
              { label: 'أحمر', emoji: '🔴', correct: false },
              { label: 'أخضر', emoji: '🟢', correct: true },
              { label: 'أصفر', emoji: '🟡', correct: false },
            ]},
            { question: 'أي رقم يوقف العداد؟', options: [
              { label: '٧', emoji: '7️⃣', correct: true },
              { label: '٣', emoji: '3️⃣', correct: false },
              { label: '٩', emoji: '9️⃣', correct: false },
            ]},
            { question: 'أي زر يطفئ الآلة نهائياً؟', options: [
              { label: 'الكبير', emoji: '⭕', correct: false },
              { label: 'الصغير', emoji: '🔘', correct: true },
              { label: 'المخفي', emoji: '❓', correct: false },
            ]},
          ],
          target: 3
        });
      }
    },

    // 30. King Farfoosh
    {
      title: 'الملك فرفوش', emoji: '👑',
      objective: 'اهزم الملك فرفوش بالمقالب المضحكة!',
      create() {
        return new G.templates.BossLevel({
          index: 29, groundY: 440, startX: 60, startY: 390,
          bossEmoji: '👑',
          phases: 3,
          platforms: [
            [200, 370, 100, 16], [400, 340, 100, 16],
          ]
        });
      }
    },
  ];

  return { ZONES, LEVELS };
})();
