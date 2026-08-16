/* ============================================================
   Figma design generator — «جزيرة المقالب» landing page.

   This is Figma Plugin API code (it expects the `figma` global), NOT a
   Node script. It rebuilds the landing page (index.html) as an editable
   Figma frame: header, hero, mode cards, features, zones, how-to, CTA,
   footer — all on auto-layout, in the game's palette, with an Arabic font.

   HOW TO RUN
   ----------
   • Via the Figma MCP `use_figma` tool: pass this file's body as `code`
     against the design file:
       https://www.figma.com/design/hYsO8rxjSiFoCtru2TS5A3
     (fileKey: hYsO8rxjSiFoCtru2TS5A3)
   • Or paste into a Figma plugin's console (e.g. a scratch plugin).

   NOTE: generating into Figma via the MCP requires available tool-call
   quota on the Figma plan; if rate-limited, retry once the quota resets.
   ============================================================ */

const page = figma.currentPage;

// ---- fonts (try Arabic-capable families, fall back) ----
const FAMILIES = ["Cairo", "Tajawal", "Noto Sans Arabic", "IBM Plex Sans Arabic"];
let FAM = null;
const WEIGHTS = ["Regular", "SemiBold", "Bold", "Black"];
for (const fam of FAMILIES) {
  try {
    for (const w of WEIGHTS) await figma.loadFontAsync({ family: fam, style: w });
    FAM = fam; break;
  } catch (e) { /* try next */ }
}
if (!FAM) { FAM = "Inter"; for (const w of ["Regular","Semi Bold","Bold","Black"]) { try { await figma.loadFontAsync({family:"Inter",style:w}); } catch(e){} } }
const STYLE = (w) => {
  if (FAM === "Inter" && w === "SemiBold") return "Semi Bold";
  return w;
};

// ---- helpers ----
const hex = (h) => { h = h.replace('#',''); return { r: parseInt(h.substr(0,2),16)/255, g: parseInt(h.substr(2,2),16)/255, b: parseInt(h.substr(4,2),16)/255 }; };
const solid = (h, a=1) => [{ type:'SOLID', color: hex(h), opacity: a }];
const C = { ink:'#3a2c28', cream:'#fff7ec', gold:'#ffd23f', sky:'#bfeaff', sky2:'#9fd6f4', skyTop:'#d8f3ff',
  green:'#6abe4c', greenD:'#4e9e36', orange:'#ff9800', purple:'#ab47bc', blue:'#5aa9e6', red:'#ef5350',
  white:'#ffffff', muted:'#6a5a50', body:'#44525c' };

function shadow(node, y=8, blur=20, a=0.16) {
  node.effects = [{ type:'DROP_SHADOW', color:{ ...hex(C.ink), a }, offset:{x:0,y}, radius:blur, spread:0, visible:true, blendMode:'NORMAL' }];
}
function frame(name, mode='VERTICAL') {
  const f = figma.createFrame(); f.name = name; f.layoutMode = mode;
  f.primaryAxisSizingMode='AUTO'; f.counterAxisSizingMode='AUTO';
  f.itemSpacing=0; f.paddingTop=0; f.paddingBottom=0; f.paddingLeft=0; f.paddingRight=0;
  f.fills=[]; f.clipsContent=false; return f;
}
function pad(f, t,r,b,l){ f.paddingTop=t; f.paddingRight=r; f.paddingBottom=b; f.paddingLeft=l!=null?l:r; }
function txt(chars, size, w='Regular', color=C.ink, align='RIGHT') {
  const t = figma.createText(); t.fontName={family:FAM, style:STYLE(w)};
  t.characters=chars; t.fontSize=size; t.fills=solid(color);
  t.textAlignHorizontal=align; t.lineHeight={value: size*1.5, unit:'PIXELS'};
  return t;
}
function paragraph(chars, size, color, width, align='CENTER', w='Regular') {
  const t = txt(chars, size, w, color, align); t.textAutoResize='HEIGHT'; t.resize(width, 10); return t;
}
function button(label, fill, textColor, full=false) {
  const b = frame('btn:'+label, 'HORIZONTAL'); b.primaryAxisAlignItems='CENTER'; b.counterAxisAlignItems='CENTER';
  pad(b, 14,26,14,26); b.cornerRadius=18; b.fills=solid(fill); b.strokes=solid(C.ink); b.strokeWeight=4;
  shadow(b,6,14,0.15); b.appendChild(txt(label, 19, 'Bold', textColor, 'CENTER'));
  if (full) { b.layoutAlign='STRETCH'; b.primaryAxisSizingMode='FIXED'; }
  return b;
}
function chip(label, bg, color, weight='Bold', fs=13) {
  const c = frame('chip', 'HORIZONTAL'); c.primaryAxisAlignItems='CENTER'; c.counterAxisAlignItems='CENTER';
  pad(c,5,12,5,12); c.cornerRadius=999; c.fills=solid(bg);
  c.appendChild(txt(label, fs, weight, color, 'CENTER')); return c;
}

// ===================== ROOT =====================
const root = frame('Landing — جزيرة المقالب', 'VERTICAL');
root.counterAxisAlignItems='CENTER'; root.primaryAxisSizingMode='AUTO';
root.counterAxisSizingMode='FIXED'; root.resize(1280, 100); root.fills=solid(C.cream);
page.appendChild(root); root.x=0; root.y=0;

const section = (name, bg) => { const s=frame(name,'VERTICAL'); s.layoutAlign='STRETCH'; s.primaryAxisSizingMode='AUTO'; s.counterAxisAlignItems='CENTER'; s.fills= bg? solid(bg):[]; return s; };
const content = (w=1120) => { const c=frame('content','VERTICAL'); c.counterAxisAlignItems='CENTER'; c.primaryAxisSizingMode='AUTO'; c.counterAxisSizingMode='FIXED'; c.resize(w,10); c.itemSpacing=14; return c; };

// ---------- HEADER ----------
const header = section('Header', C.cream); pad(header,0,40,0,40);
const headRow = frame('headRow','HORIZONTAL'); headRow.layoutAlign='STRETCH'; headRow.primaryAxisSizingMode='FIXED';
headRow.primaryAxisAlignItems='SPACE_BETWEEN'; headRow.counterAxisAlignItems='CENTER'; pad(headRow,14,0,14,0);
const navGroup = frame('nav','HORIZONTAL'); navGroup.counterAxisAlignItems='CENTER'; navGroup.itemSpacing=22;
navGroup.appendChild(txt('الأوضاع',16,'SemiBold',C.muted));
navGroup.appendChild(txt('المميزات',16,'SemiBold',C.muted));
navGroup.appendChild(txt('المناطق',16,'SemiBold',C.muted));
navGroup.appendChild(button('🎮 العب', C.green, C.white));
const brand = txt('🏝️ جزيرة المقالب', 22, 'Black', C.ink, 'RIGHT');
headRow.appendChild(navGroup); headRow.appendChild(brand);
header.appendChild(headRow); root.appendChild(header);

// ---------- HERO ----------
const hero = section('Hero'); pad(hero,64,40,96,40);
hero.fills=[{type:'GRADIENT_LINEAR', gradientTransform:[[0,1,0],[-1,0,1]],
  gradientStops:[{position:0,color:{...hex(C.skyTop),a:1}},{position:0.55,color:{...hex(C.sky),a:1}},{position:1,color:{...hex(C.sky2),a:1}}]}];
const heroC = content(720); heroC.counterAxisAlignItems='CENTER'; heroC.itemSpacing=16;
const badge = chip('🎉 لعبة مجانية • تشتغل على أي جوال بدون تنزيل', C.white, C.ink, 'Bold', 15);
badge.strokes=solid(C.ink); badge.strokeWeight=3; shadow(badge,6,14,0.15);
heroC.appendChild(badge);
heroC.appendChild(txt('🏝️ جزيرة المقالب', 72, 'Black', C.ink, 'CENTER'));
heroC.appendChild(txt('PRANK ISLAND', 22, 'SemiBold', '#5a7a8c', 'CENTER'));
heroC.appendChild(paragraph('اهبط على جزيرة مجنونة فيها شخصيات غريبة تحتاج مساعدتك في مقالب وألغاز مضحكة! مغامرة ملوّنة للأطفال من ٧ إلى ١٥ سنة — العب فوراً من المتصفّح.', 20, C.body, 620, 'CENTER'));
const cta = frame('cta','HORIZONTAL'); cta.itemSpacing=16; cta.counterAxisAlignItems='CENTER'; pad(cta,16,0,0,0);
cta.appendChild(button('🎮 العب الآن', C.green, C.white));
cta.appendChild(button('🌍 العالم المفتوح', C.purple, C.white));
const ghost = button('↓ استكشف الأوضاع', C.white, C.ink); ghost.fills=solid(C.white,0.7);
cta.appendChild(ghost); heroC.appendChild(cta);
const stats = frame('stats','HORIZONTAL'); stats.itemSpacing=34; pad(stats,30,0,0,0);
[['٣٠','مرحلة'],['٦','مناطق'],['٣','أوضاع لعب'],['٠','تنزيل']].forEach(([n,l])=>{
  const st=frame('stat','VERTICAL'); st.counterAxisAlignItems='CENTER';
  st.appendChild(txt(n,34,'Black',C.ink,'CENTER')); st.appendChild(txt(l,14,'SemiBold','#5a7a8c','CENTER'));
  stats.appendChild(st);
});
heroC.appendChild(stats); hero.appendChild(heroC); root.appendChild(hero);

// ---------- generic section title ----------
function titled(sec, title, sub) {
  const c = content(1120); c.itemSpacing=8; c.counterAxisAlignItems='CENTER';
  c.appendChild(txt(title, 38, 'Black', C.ink, 'CENTER'));
  c.appendChild(paragraph(sub, 18, C.muted, 760, 'CENTER'));
  sec.appendChild(c); return c;
}

// ---------- MODES ----------
const modes = section('Modes', C.cream); pad(modes,72,40,72,40);
const modesC = titled(modes, '🎮 ثلاثة أوضاع للعب', 'من المغامرة ثنائية الأبعاد إلى عالم مفتوح ثلاثي الأبعاد بهوية سعودية.');
const modeRow = frame('modeRow','HORIZONTAL'); modeRow.itemSpacing=22; pad(modeRow,28,0,0,0); modeRow.counterAxisAlignItems='MIN';
function modeCard(top, ic, h, p, tags, btnLabel, btnColor) {
  const card = frame('mode:'+h,'VERTICAL'); card.counterAxisSizingMode='FIXED'; card.resize(352,10);
  card.fills=solid(C.white); card.strokes=solid(C.ink); card.strokeWeight=4; card.cornerRadius=22;
  pad(card,26,26,26,26); card.itemSpacing=10; shadow(card,14,30,0.18); card.counterAxisAlignItems='MAX';
  const bar=frame('bar','VERTICAL'); bar.layoutAlign='STRETCH'; bar.primaryAxisSizingMode='FIXED'; bar.resize(10,8); bar.fills=solid(top); bar.cornerRadius=4;
  card.appendChild(bar);
  card.appendChild(txt(ic,50,'Regular',C.ink,'RIGHT'));
  card.appendChild(txt(h,23,'Black',C.ink,'RIGHT'));
  const pt=paragraph(p,15,C.muted,300,'RIGHT'); pt.layoutAlign='STRETCH'; card.appendChild(pt);
  const tg=frame('tags','HORIZONTAL'); tg.itemSpacing=8; tg.counterAxisAlignItems='CENTER'; pad(tg,4,0,8,0);
  tags.forEach(t=> tg.appendChild(chip(t, C.sky, '#33586c')));
  card.appendChild(tg);
  card.appendChild(button(btnLabel, btnColor, C.white, true));
  return card;
}
modeRow.appendChild(modeCard(C.green,'🏘️','مغامرة 2D','اقفز، اجمع، والعب الألغاز عبر ٣٠ مرحلة في ٦ مناطق ملوّنة على محرّك Phaser.',['قفز','ألغاز','جمع'],'ابدأ المغامرة',C.green));
modeRow.appendChild(modeCard(C.purple,'🧊','تحدّي 3D','شخصية ثلاثية الأبعاد، مراحل بمؤقّت ونجوم، تسجيل دخول ولوحة أبطال محلية.',['نجوم','لوحة أبطال','مؤقّت'],'ادخل التحدي',C.purple));
modeRow.appendChild(modeCard(C.blue,'🌍','عالم مفتوح','تجوّل بحرية في بلدة سعودية، اركب 🚗 سيارة و🐪 بعير و✈️ طيارة واجمع العملات.',['مركبات','متجر','استكشاف'],'استكشف العالم',C.blue));
modesC.appendChild(modeRow);

// ---------- FEATURES ----------
const feats = section('Features', '#ffeccf'); pad(feats,72,40,72,40);
const featsC = titled(feats, '✨ لماذا ستحبّها؟', 'صُمّمت لتكون آمنة، سهلة، وممتعة لكل طفل.');
const featGrid = frame('featGrid','VERTICAL'); featGrid.itemSpacing=20; pad(featGrid,28,0,0,0); featGrid.counterAxisAlignItems='CENTER';
const FEATS = [['📱','بدون تنزيل','تشتغل مباشرة في المتصفّح على الجوال والتابلت والكمبيوتر.'],
  ['🇸🇦','هوية سعودية','بلدة وشوارع ونخيل وإبل بأسلوب كرتوني محبّب.'],
  ['🎨','رسومات ملوّنة','فنّ مرسوم بالكامل ومتناسق مع مؤثّرات حركية مرحة.'],
  ['💾','حفظ تلقائي','تقدّمك ونجومك تُحفظ على جهازك تلقائياً.'],
  ['🔊','أصوات وموسيقى','مؤثّرات صوتية وموسيقى خلفية مع زر كتم سريع.'],
  ['🆓','مجانية بالكامل','بدون إعلانات وبدون مشتريات — متعة خالصة.']];
function featCard(ic,h,p){
  const c=frame('feat','HORIZONTAL'); c.counterAxisSizingMode='FIXED'; c.resize(353,10); c.counterAxisAlignItems='MIN';
  c.fills=solid(C.white); c.cornerRadius=18; c.strokes=solid(C.ink,0.12); c.strokeWeight=3; pad(c,22,22,22,22); c.itemSpacing=14; shadow(c,6,14,0.12);
  const tcol=frame('t','VERTICAL'); tcol.layoutGrow=1; tcol.itemSpacing=4; tcol.counterAxisAlignItems='MAX'; tcol.primaryAxisSizingMode='AUTO';
  tcol.appendChild(txt(h,18,'Bold',C.ink,'RIGHT'));
  const pt=paragraph(p,14,C.muted,240,'RIGHT'); pt.layoutAlign='STRETCH'; tcol.appendChild(pt);
  c.appendChild(tcol); c.appendChild(txt(ic,34,'Regular',C.ink,'RIGHT'));
  return c;
}
for (let i=0;i<FEATS.length;i+=3){ const row=frame('frow','HORIZONTAL'); row.itemSpacing=20; row.counterAxisAlignItems='MIN';
  FEATS.slice(i,i+3).forEach(f=> row.appendChild(featCard(...f))); featGrid.appendChild(row); }
featsC.appendChild(featGrid);

// ---------- ZONES ----------
const zones = section('Zones', C.cream); pad(zones,72,40,72,40);
const zonesC = titled(zones, '🗺️ ٦ مناطق للاستكشاف', 'كل منطقة لها جوّها وشخصياتها ومقالبها الخاصة.');
const zoneRow = frame('zoneRow','HORIZONTAL'); zoneRow.itemSpacing=14; pad(zoneRow,28,0,0,0); zoneRow.counterAxisAlignItems='CENTER';
const ZONES=[['🏘️','قرية الفوضى','#bfeaff'],['🌳','غابة المقالب','#bfe7c0'],['🤖','مدينة الروبوتات','#cfe6ef'],
  ['🍔','مهرجان الطعام','#ffe0c2'],['🏰','قلعة الضحك','#e3d6f7'],['🎪','النهاية الكبرى','#fbd0e0']];
ZONES.forEach(([ic,n,bg],i)=>{ const z=frame('zone','VERTICAL'); z.counterAxisSizingMode='FIXED'; z.resize(168,10);
  z.counterAxisAlignItems='CENTER'; z.fills=solid(bg); z.cornerRadius=18; z.strokes=solid(C.ink,0.18); z.strokeWeight=3; pad(z,18,12,18,12); z.itemSpacing=4; shadow(z,6,14,0.12);
  z.appendChild(txt(ic,36,'Regular',C.ink,'CENTER')); z.appendChild(txt(n,14,'Black',C.ink,'CENTER'));
  z.appendChild(txt('منطقة '+['١','٢','٣','٤','٥','٦'][i],12,'Bold',C.muted,'CENTER')); zoneRow.appendChild(z); });
zonesC.appendChild(zoneRow);

// ---------- HOW TO ----------
const howto = section('HowTo', '#d8f0ff'); pad(howto,72,40,72,40);
const howtoC = titled(howto, '🕹️ كيف تلعب؟', 'ثلاث خطوات بسيطة وتبدأ المرح فوراً.');
const stepRow = frame('stepRow','HORIZONTAL'); stepRow.itemSpacing=22; pad(stepRow,28,0,0,0); stepRow.counterAxisAlignItems='MIN';
const STEPS=[['▶️','١. اضغط «العب»','تفتح اللعبة مباشرة بدون أي تثبيت.'],['🏃','٢. تحرّك واقفز','استخدم الأزرار على الشاشة أو لوحة المفاتيح.'],['⭐','٣. اجمع النجوم','أكمل المقالب والألغاز واحصد النقاط.']];
STEPS.forEach(([ic,h,p])=>{ const s=frame('step','VERTICAL'); s.counterAxisSizingMode='FIXED'; s.resize(300,10); s.counterAxisAlignItems='CENTER'; s.itemSpacing=8;
  const circ=frame('circ','HORIZONTAL'); circ.counterAxisSizingMode='FIXED'; circ.primaryAxisSizingMode='FIXED'; circ.resize(74,74); circ.cornerRadius=37;
  circ.fills=solid(C.white); circ.strokes=solid(C.ink); circ.strokeWeight=4; circ.primaryAxisAlignItems='CENTER'; circ.counterAxisAlignItems='CENTER'; shadow(circ,6,14,0.15);
  circ.appendChild(txt(ic,34,'Regular',C.ink,'CENTER')); s.appendChild(circ);
  s.appendChild(txt(h,20,'Bold',C.ink,'CENTER')); s.appendChild(paragraph(p,15,C.body,260,'CENTER')); stepRow.appendChild(s); });
howtoC.appendChild(stepRow);
const ctrlRow = frame('ctrlRow','HORIZONTAL'); ctrlRow.itemSpacing=14; pad(ctrlRow,20,0,0,0); ctrlRow.counterAxisAlignItems='CENTER';
['الحركة ← →','القفز: مسافة / ↑','الألغاز: اسحب بإصبعك'].forEach(t=>{ const p=chip(t,C.white,C.ink,'Bold',15); p.strokes=solid(C.ink); p.strokeWeight=3; p.cornerRadius=14; pad(p,10,16,10,16); shadow(p,6,14,0.12); ctrlRow.appendChild(p); });
howtoC.appendChild(ctrlRow);

// ---------- CTA BAND ----------
const ctaSec = section('CTA', C.cream); pad(ctaSec,40,40,72,40);
const ctaCard = frame('ctaCard','VERTICAL'); ctaCard.layoutAlign='STRETCH'; ctaCard.counterAxisAlignItems='CENTER'; ctaCard.primaryAxisSizingMode='AUTO';
ctaCard.cornerRadius=28; ctaCard.strokes=solid(C.ink); ctaCard.strokeWeight=5; pad(ctaCard,50,26,50,26); ctaCard.itemSpacing=12; shadow(ctaCard,14,30,0.2);
ctaCard.fills=[{type:'GRADIENT_LINEAR', gradientTransform:[[1,0,0],[0,1,0]], gradientStops:[{position:0,color:{...hex(C.purple),a:1}},{position:1,color:{...hex(C.blue),a:1}}]}];
ctaCard.appendChild(txt('جاهز للمغامرة؟ 🚀', 38, 'Black', C.white, 'CENTER'));
ctaCard.appendChild(txt('الجزيرة تنتظرك — ابدأ اللعب الآن مجاناً!', 18, 'SemiBold', C.white, 'CENTER'));
const bigBtn = button('🎮 العب الآن', C.gold, C.ink); pad(bigBtn,16,34,16,34); ctaCard.appendChild(bigBtn);
const ctaWrap = content(1120); ctaWrap.appendChild(ctaCard); ctaSec.appendChild(ctaWrap);

// ---------- FOOTER ----------
const footer = section('Footer', C.ink); pad(footer,40,40,40,40);
const fc = content(1120); fc.itemSpacing=12; fc.counterAxisAlignItems='CENTER';
fc.appendChild(txt('🏝️ جزيرة المقالب — Prank Island', 22, 'Black', C.cream, 'CENTER'));
const flinks = frame('flinks','HORIZONTAL'); flinks.itemSpacing=22; flinks.counterAxisAlignItems='CENTER';
['المغامرة 2D','تحدّي 3D','العالم المفتوح','GitHub'].forEach(t=> flinks.appendChild(txt(t,15,'SemiBold',C.cream,'CENTER')));
fc.appendChild(flinks);
fc.appendChild(txt('صُنع بـ ❤️ للأطفال • رخصة MIT • Phaser 3 + three.js', 14, 'Regular', '#bdae9f', 'CENTER'));
footer.appendChild(fc); root.appendChild(footer);

await figma.setCurrentPageAsync(page);
figma.viewport.scrollAndZoomIntoView([root]);
