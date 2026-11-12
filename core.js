/* Grow a Pet — ядро игры. Один и тот же код работает на сервере (проверяет каждое действие)
   и в браузере (мгновенно показывает результат). Все цены, шансы и награды — здесь. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m; else root.Core = m;
})(typeof self !== 'undefined' ? self : this, function () {
 
  // ---------------- РЕДКОСТИ (inc — доход в секунду) ----------------
  const RARITY = [
    { id: 'common',    name: 'Обычный',     color: '#9aa3b5', inc: 1 },
    { id: 'rare',      name: 'Редкий',      color: '#3fa9ff', inc: 5 },
    { id: 'epic',      name: 'Эпический',   color: '#b65cff', inc: 25 },
    { id: 'legendary', name: 'Легендарный', color: '#ffb020', inc: 120 },
    { id: 'mythic',    name: 'Мифический',  color: '#ff3d81', inc: 600 },
  ];
 
  // ---------------- ПЕТЫ ----------------
  // em — эмодзи, art — рисунок (рисуется в браузере), img — фото из папки pets/
  // v — себестоимость обычной версии, fam — семейство для тематических яиц
  const PETS = [
    { id: 'mouse', em: '🐭', name: 'Мышонок', r: 0, v: 800 },
    { id: 'chick', em: '🐥', name: 'Цыплёнок', r: 0, v: 820 },
    { id: 'frog', em: '🐸', name: 'Лягушонок', r: 0, v: 850 },
    { id: 'hamster', em: '🐹', name: 'Хомяк', r: 0, v: 870 },
    { id: 'rabbit', em: '🐰', name: 'Кролик', r: 0, v: 900 },
    { id: 'pig', em: '🐷', name: 'Поросёнок', r: 0, v: 920 },
    { id: 'duck', em: '🦆', name: 'Утёнок', r: 0, v: 950 },
    { id: 'cat', em: '🐱', name: 'Котёнок', r: 0, v: 960, fam: 'cat' },
    { id: 'turtle', em: '🐢', name: 'Черепаха', r: 0, v: 1000 },
    { id: 'dog', em: '🐶', name: 'Щенок', r: 0, v: 1000, fam: 'dog' },
    { id: 'ginger', name: 'Рыжий кот', r: 0, v: 1050, fam: 'cat', art: { t: 'cat', fur: '#f29a3c', f2: '#c4651a', eye: '#9be15d', pat: 'tabby' } },
    { id: 'graycat', name: 'Серый кот', r: 0, v: 1080, fam: 'cat', art: { t: 'cat', fur: '#a3a9b3', f2: '#6c727c', eye: '#f5c542', pat: 'tabby' } },
    { id: 'blackcat', name: 'Чёрный кот', r: 0, v: 1100, fam: 'cat', art: { t: 'cat', fur: '#2b2b33', eye: '#f5d442', earIn: '#5a4050', whisk: '#ffffff90' } },
    { id: 'mutt', name: 'Дворняжка', r: 0, v: 1120, fam: 'dog', art: { t: 'dog', fur: '#b98a5a', muz: '#ead3b2', ear: 'flop', earC: '#8a5f38', tongue: 1 } },
    { id: 'chihuahua', name: 'Чихуахуа', r: 0, v: 1200, fam: 'dog', art: { t: 'dog', fur: '#e9c79c', muz: '#f6e3c8', ear: 'bigpt', bigEye: 1, earIn: '#f2a3a3' } },
    { id: 'dachshund', name: 'Такса', r: 0, v: 1250, fam: 'dog', art: { t: 'dog', fur: '#8a4a24', muz: '#a35e33', ear: 'long', earC: '#6b3618', snout: 'long' } },
 
    { id: 'penguin', em: '🐧', name: 'Пингвин', r: 1, v: 5600 },
    { id: 'hedgehog', em: '🦔', name: 'Ёжик', r: 1, v: 5700 },
    { id: 'raccoon', em: '🦝', name: 'Енот', r: 1, v: 5800 },
    { id: 'koala', em: '🐨', name: 'Коала', r: 1, v: 5900 },
    { id: 'sloth', em: '🦥', name: 'Ленивец', r: 1, v: 6000 },
    { id: 'otter', em: '🦦', name: 'Выдра', r: 1, v: 6100 },
    { id: 'parrot', em: '🦜', name: 'Попугай', r: 1, v: 6200 },
    { id: 'fox', em: '🦊', name: 'Лиса', r: 1, v: 6300 },
    { id: 'british', name: 'Британец', r: 1, v: 6400, fam: 'cat', art: { t: 'cat', fur: '#8c9bb0', eye: '#f0a13c', chub: 1, flat: 1 } },
    { id: 'panda', em: '🐼', name: 'Панда', r: 1, v: 6500 },
    { id: 'siamese', name: 'Сиамский кот', r: 1, v: 6600, fam: 'cat', art: { t: 'cat', fur: '#f3e3c8', f2: '#5a4033', eye: '#4fa8ff', pat: 'points', earIn: '#8a6a5a' } },
    { id: 'fold', name: 'Вислоухий кот', r: 1, v: 6700, fam: 'cat', art: { t: 'cat', fur: '#c9c9cf', f2: '#8d8d95', eye: '#f2b84b', ear: 'fold', pat: 'tabby', chub: 1 } },
    { id: 'beagle', name: 'Бигль', r: 1, v: 6750, fam: 'dog', art: { t: 'dog', fur: '#c77a3a', muz: '#fff', ear: 'flop', earC: '#6b3a1a', pat: 'blaze' } },
    { id: 'calico', name: 'Трёхцветная кошка', r: 1, v: 6800, fam: 'cat', art: { t: 'cat', fur: '#fff6ea', f2: '#f29a3c', f3: '#2b2b33', eye: '#9be15d', pat: 'calico' } },
    { id: 'pug', name: 'Мопс', r: 1, v: 6900, fam: 'dog', art: { t: 'dog', fur: '#e6c79a', muz: '#3a2c24', ear: 'small', earC: '#3a2c24', snout: 'flat', wrinkle: 1, tongue: 1, bigEye: 1 } },
    { id: 'corgi', name: 'Корги', r: 1, v: 7000, fam: 'dog', art: { t: 'dog', fur: '#e48a3a', muz: '#fff', ear: 'bigpt', pat: 'blaze', tongue: 1, blush: 1 } },
    { id: 'poodle', name: 'Пудель', r: 1, v: 7100, fam: 'dog', art: { t: 'dog', fur: '#f1e6da', muz: '#f8f1e9', ear: 'puff', earC: '#e8d8c6' } },
    { id: 'spitz', name: 'Шпиц', r: 1, v: 7300, fam: 'dog', art: { t: 'dog', fur: '#f0a14a', muz: '#f8c98a', ear: 'pt', fluff: 1, tongue: 1, blush: 1 } },
    { id: 'm_tongue', img: 'pets/tongue.jpg', name: 'Язычок', r: 1, v: 7600, fam: 'meme' },
 
    { id: 'owl', em: '🦉', name: 'Сова', r: 2, v: 28000 },
    { id: 'flamingo', em: '🦩', name: 'Фламинго', r: 2, v: 29000 },
    { id: 'wolf', em: '🐺', name: 'Волк', r: 2, v: 30000 },
    { id: 'shark', em: '🦈', name: 'Акула', r: 2, v: 31000 },
    { id: 'croc', em: '🐊', name: 'Крокодил', r: 2, v: 32000 },
    { id: 'sphynx', name: 'Сфинкс', r: 2, v: 32500, fam: 'cat', art: { t: 'cat', fur: '#e8b9a8', f2: '#c48d7c', eye: '#7fd0a0', ear: 'big', wrinkle: 1, noWhisk: 1, earIn: '#f5a0a8' } },
    { id: 'octopus', em: '🐙', name: 'Осьминог', r: 2, v: 33000 },
    { id: 'persian', name: 'Персидский кот', r: 2, v: 33500, fam: 'cat', art: { t: 'cat', fur: '#f4f0ea', eye: '#f0a13c', flat: 1, fluff: 1, chub: 1 } },
    { id: 'bulldog', name: 'Бульдог', r: 2, v: 33800, fam: 'dog', art: { t: 'dog', fur: '#efe2d1', muz: '#f6ede2', ear: 'small', earC: '#c79d78', snout: 'jowl', teeth: 1, wrinkle: 1 } },
    { id: 'tiger', em: '🐯', name: 'Тигр', r: 2, v: 34000 },
    { id: 'bengal', name: 'Бенгальская кошка', r: 2, v: 34500, fam: 'cat', art: { t: 'cat', fur: '#e8a54b', f2: '#5a3a1e', eye: '#9be15d', pat: 'spots' } },
    { id: 'doberman', name: 'Доберман', r: 2, v: 34800, fam: 'dog', art: { t: 'dog', fur: '#23201f', muz: '#23201f', ear: 'pt', earIn: '#5a3a2a', pat: 'tan', tan: '#b5652b' } },
    { id: 'mainecoon', name: 'Мейн-кун', r: 2, v: 35000, fam: 'cat', art: { t: 'cat', fur: '#8a6a4a', f2: '#4d3826', eye: '#e8c13a', pat: 'tabby', tufts: 1, fluff: 1 } },
    { id: 'shepherd', name: 'Овчарка', r: 2, v: 35200, fam: 'dog', art: { t: 'dog', fur: '#c88a4a', muz: '#2a1d14', ear: 'pt', earC: '#2a1d14', earIn: '#6a4a3a', pat: 'saddle', tongue: 1 } },
    { id: 'husky', name: 'Хаски', r: 2, v: 35500, fam: 'dog', art: { t: 'dog', fur: '#6d7480', muz: '#fff', ear: 'pt', pat: 'mask', blue: 1, earIn: '#c9c9c9' } },
    { id: 'lion', em: '🦁', name: 'Лев', r: 2, v: 36000 },
    { id: 'dalmatian', name: 'Далматинец', r: 2, v: 36500, fam: 'dog', art: { t: 'dog', fur: '#fafafa', muz: '#fff', ear: 'flop', earC: '#fafafa', pat: 'spots' } },
    { id: 'shiba', name: 'Сиба-ину', r: 2, v: 37000, fam: 'dog', art: { t: 'dog', fur: '#e0893a', muz: '#fff4e2', ear: 'pt', pat: 'shiba', blush: 1 } },
    { id: 'm_teeth', img: 'pets/teeth.jpg', name: 'Зубастик', r: 2, v: 38000, fam: 'meme' },
    { id: 'm_pugs', img: 'pets/pugs.jpg', name: 'Мопсы-обнимашки', r: 2, v: 39000, fam: 'meme' },
 
    { id: 'eagle', em: '🦅', name: 'Огненный орёл', r: 3, v: 240000 },
    { id: 'peacock', em: '🦚', name: 'Павлин', r: 3, v: 250000 },
    { id: 'unicorn', em: '🦄', name: 'Единорог', r: 3, v: 260000 },
    { id: 'retriever', name: 'Золотой ретривер', r: 3, v: 270000, fam: 'dog', art: { t: 'dog', fur: '#e2b064', muz: '#f1cf8f', ear: 'flop', earC: '#c98f42', tongue: 1, blush: 1 } },
    { id: 'whale', em: '🐳', name: 'Кит', r: 3, v: 280000 },
    { id: 'samoyed', name: 'Самоед', r: 3, v: 285000, fam: 'dog', art: { t: 'dog', fur: '#ffffff', muz: '#ffffff', ear: 'pt', earIn: '#f2c5c5', fluff: 1, tongue: 1, blush: 1 } },
    { id: 'snowleo', name: 'Снежный барс', r: 3, v: 290000, fam: 'cat', art: { t: 'cat', fur: '#e9edf2', f2: '#5c6470', eye: '#8fd3ff', pat: 'spots', ring: 1, fluff: 1 } },
    { id: 'dragon', em: '🐉', name: 'Дракон', r: 3, v: 300000 },
    { id: 'mastiff', name: 'Тибетский мастиф', r: 3, v: 310000, fam: 'dog', art: { t: 'dog', fur: '#8a3a1e', muz: '#3a1a0e', ear: 'small', earC: '#5a2410', fluff: 1, snout: 'flat' } },
    { id: 'trex', em: '🦖', name: 'Ти-рекс', r: 3, v: 320000 },
    { id: 'm_smile', img: 'pets/smile.jpg', name: 'Улыбака', r: 3, v: 340000, fam: 'meme' },
    { id: 'm_shorts', img: 'pets/shorts.jpg', name: 'Чихуа в шортах', r: 3, v: 360000, fam: 'meme' },
 
    { id: 'spacecat', name: 'Космокот', r: 4, v: 2000000, fam: 'cat', art: { t: 'cat', fur: '#4b2fb8', eye: '#5ff7ff', pat: 'stars', earIn: '#ff7ae0', whisk: '#ffffffaa' } },
    { id: 'golddog', name: 'Золотой пёс', r: 4, v: 2200000, fam: 'dog', art: { t: 'dog', fur: '#ffcf3d', muz: '#fff0b0', ear: 'flop', earC: '#e6a800', pat: 'crown', tongue: 1, sparkle: 1 } },
    { id: 'ghostwhale', em: '🐋', name: 'Кит-призрак', r: 4, v: 2400000 },
    { id: 'skydragon', em: '🐲', name: 'Небесный дракон', r: 4, v: 2600000 },
    { id: 'm_prof', img: 'pets/prof.jpg', name: 'Профессор Гриффон', r: 4, v: 2800000, fam: 'meme' },
  ];
  const PET = {}; PETS.forEach(p => PET[p.id] = p);
 
  // версии: m — множитель цены и дохода, odds — шанс из яйца (%)
  const VARS = [
    { id: '', name: 'Обычный', m: 1, odds: 95, cls: '' },
    { id: 'g', name: 'Золотой', m: 1.25, odds: 4, cls: 'vg' },
    { id: 'r', name: 'Радужный', m: 1.5, odds: 1, cls: 'vr' },
  ];
  const EGGS = [
    { id: 'basic', em: '🥚', name: 'Обычное яйцо', price: 5000, odds: [75, 22, 3, 0, 0] },
    { id: 'cats', em: '🧺', name: 'Кошачья корзинка', price: 22000, odds: [55, 32, 10, 3, 0], pool: 'cat', desc: 'Только кошки' },
    { id: 'dogs', em: '🦴', name: 'Собачья косточка', price: 22000, odds: [55, 32, 10, 3, 0], pool: 'dog', desc: 'Только собаки' },
    { id: 'gold', em: '🪺', name: 'Золотое яйцо', price: 25000, odds: [40, 40, 17, 3, 0] },
    { id: 'meme', em: '🤪', name: 'Мем-яйцо', price: 200000, odds: [0, 45, 35, 17, 3], pool: 'meme', desc: 'Только мемные звери' },
    { id: 'cosmic', em: '🌌', name: 'Космическое яйцо', price: 200000, odds: [0, 40, 40, 17, 3] },
  ];
  const UPG = { edge: 0.85, max: 70 };          // шанс = ставка / цена × 0.85, не больше 70%
  const LEVEL_REFUND = 0.5;
  const BOOSTS = [
    { id: 'tap', em: '👆', name: 'Сила тапа', desc: l => `+5 монет за тап (сейчас ${5 * (1 + l)})`, base: 2000, mult: 2 },
    { id: 'energy', em: '🔋', name: 'Запас энергии', desc: l => `+250 к максимуму (сейчас ${1000 + 250 * l})`, base: 3000, mult: 2 },
    { id: 'regen', em: '⚡', name: 'Восстановление', desc: l => `+1 энергии в секунду (сейчас ${3 + l}/сек)`, base: 4000, mult: 2.2 },
  ];
  const DAILY = [2000, 5000, 10000, { egg: 'basic' }, 25000, 50000, { egg: 'gold' }];
  const OFFLINE_CAP_H = 3;
  const AD = { cooldown: 30, perDay: 25 };       // реклама: не чаще раза в 30 сек и 25 раз в день
  const REF = { newbie: 20000, inviter: 50000 };  // награды за приглашение друга
 
  // ---------------- КАЗИНО ----------------
  // Слот «Pet House»: 5 барабанов × 3 ряда, 10 линий. pay = выплата в ставках на линию за 3/4/5 подряд слева.
  const SLOT = {
    minBet: 10, fsFor: [0, 0, 0, 10, 15, 20], scatPay: [0, 0, 0, 2, 5, 20], buyFs: 10, buyX: 90, maxWinX: 5000, payScale: 0.47,
    syms: [
      { id: 'bone',  em: '🦴', w: 30, pay: [0, 0, 0, 14, 35, 84] },
      { id: 'ball',  em: '🎾', w: 28, pay: [0, 0, 0, 14, 42, 98] },
      { id: 'fish',  em: '🐟', w: 26, pay: [0, 0, 0, 21, 49, 126] },
      { id: 'yarn',  em: '🧶', w: 24, pay: [0, 0, 0, 21, 56, 154] },
      { id: 'pug',   pet: 'pug',       w: 12, pay: [0, 0, 0, 35, 105, 350] },
      { id: 'corgi', pet: 'corgi',     w: 10, pay: [0, 0, 0, 49, 140, 525] },
      { id: 'husky', pet: 'husky',     w: 8,  pay: [0, 0, 0, 70, 210, 700] },
      { id: 'retr',  pet: 'retriever', w: 6,  pay: [0, 0, 0, 84, 280, 1050] },
      { id: 'gold',  pet: 'golddog',   w: 4,  pay: [0, 0, 0, 175, 700, 3500] },
      { id: 'w2',    em: '🏠', w: 3, wild: 1, m: 2, reels: [1, 2, 3] },
      { id: 'w3',    em: '🏠', w: 1.5, wild: 1, m: 3, reels: [1, 2, 3] },
      { id: 'scat',  em: '🐾', w: 3, scatter: 1 },
    ],
    lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[1,0,1,2,1]],
  };
  const SYM = {}; SLOT.syms.forEach(s => SYM[s.id] = s);
  function slotSym(reel, rnd, fs) {
    const l = SLOT.syms.filter(s => (!s.reels || s.reels.includes(reel)) && !(fs && s.scatter)); const tot = l.reduce((a, s) => a + s.w, 0);
    let x = rnd() * tot; for (const s of l) { if (x < s.w) return s.id; x -= s.w; } return l[0].id;
  }
  // один спин. sticky — липкие вайлды бонуса {"r,row": множитель} (только в бесплатных вращениях)
  function slotSpin(bet, rnd, sticky) {
    const fs = !!sticky;
    const grid = Array.from({ length: 5 }, (_, r) => Array.from({ length: 3 }, () => slotSym(r, rnd, fs)));   // grid[reel][row]
    const was = fs ? Object.keys(sticky) : [];
    if (fs) { for (const k of was) { const [r, row] = k.split(',').map(Number); grid[r][row] = 'w' + sticky[k]; }
      grid.forEach((c, r) => c.forEach((s, row) => { if (SYM[s].wild) sticky[r + ',' + row] = SYM[s].m; })); }
    const lb = bet / SLOT.lines.length, wins = []; let win = 0;
    SLOT.lines.forEach((ln, li) => {
      const first = grid[0][ln[0]]; if (SYM[first].scatter || SYM[first].wild) return;
      let n = 1, m = 1; while (n < 5) { const s = grid[n][ln[n]]; if (s === first) n++; else if (SYM[s].wild) { m *= SYM[s].m; n++; } else break; }
      const p = SYM[first].pay[n] * SLOT.payScale; if (p) { const a = lb * p * m; win += a; wins.push({ line: li, sym: first, n, m, amount: Math.floor(a) }); }
    });
    let scat = 0; grid.forEach(c => c.forEach(s => { if (SYM[s].scatter) scat++; }));
    const sc = Math.min(scat, 5), scatWin = SLOT.scatPay[sc] * bet; win += scatWin;
    const res = { grid, wins, scat, scatWin: Math.floor(scatWin), win: Math.floor(win) };
    if (fs) res.sticky = Object.keys(sticky).map(k => { const [r, row] = k.split(',').map(Number); return { r, row, m: sticky[k], fresh: !was.includes(k) }; });
    else res.fsCount = SLOT.fsFor[sc];
    return res;
  }
  // целый раунд: обычный спин (или покупка) + все бесплатные вращения
  function slotRound(bet, rnd, buy) {
    const base = buy ? null : slotSpin(bet, rnd, null);
    const fsCount = buy ? SLOT.buyFs : base.fsCount, fs = [], sticky = {};
    let total = base ? base.win : 0;
    for (let i = 0; i < fsCount; i++) { const f = slotSpin(bet, rnd, sticky); fs.push(f); total += f.win; }
    total = Math.min(Math.floor(total), bet * SLOT.maxWinX);
    return { base, fs, fsCount, total };
  }
  const slotBuyPrice = bet => bet * SLOT.buyX;
  // Слот «Кот-рыбак»: 5×3, 10 линий. Рыбки 🐟 несут номинал (в ставках). В бонусе кот-вайлд собирает все рыбки на экране.
  const FISH = {
    minBet: 10, payScale: 2, moneyScale: 0.043, featP: 0.3, goldenCards: 2, buyX: 85, maxWinX: 5000,
    fsFor: [0, 0, 0, 10, 15, 20], scatPay: [0, 0, 0, 2, 5, 20], retrigEvery: 4, levels: [1, 2, 3, 10],
    pay: { worm: [0, 0, 0, 5, 12, 30], bucket: [0, 0, 0, 5, 14, 35], buoy: [0, 0, 0, 6, 16, 40], box: [0, 0, 0, 8, 20, 50], rod: [0, 0, 0, 15, 50, 150], boat: [0, 0, 0, 25, 80, 300] },
    em: { worm: '🐛', bucket: '⚓', buoy: '🦀', box: '💼', rod: '🎣', boat: '🚤', scat: '🐡', water: '💧' },
    money: [[2, 30], [5, 25], [10, 18], [15, 10], [20, 7], [25, 4], [50, 3], [100, 1.5], [250, .4], [500, .1]],
    w: {
      base:   { worm: 30, bucket: 28, buoy: 26, box: 24, rod: 12, boat: 9, money: 10, scat: 2.2 },
      fs:     { worm: 28, bucket: 26, buoy: 24, box: 22, rod: 11, boat: 8, money: 12, cat: 2 },
      golden: { money: 30, cat: 4, water: 66 },
    },
    modP: 0.15,
  };
  const isMoney = id => id[0] === 'm';
  const moneyVal = id => Number(id.slice(1));
  function fishPick(table, rnd) { const e = Object.entries(table), tot = e.reduce((a, [, w]) => a + w, 0); let x = rnd() * tot; for (const [k, w] of e) { if (x < w) return k; x -= w; } return e[0][0]; }
  function fishMoney(rnd) { const tot = FISH.money.reduce((a, [, w]) => a + w, 0); let x = rnd() * tot; for (const [v, w] of FISH.money) { if (x < w) return 'm' + v; x -= w; } return 'm2'; }
  function fishSym(mode, rnd) { const k = fishPick(FISH.w[mode], rnd); return k === 'money' ? fishMoney(rnd) : k; }
  function fishGrid(mode, rnd) { return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => fishSym(mode, rnd))); }
  function fishLines(grid, bet) {
    const lb = bet / SLOT.lines.length, wins = []; let win = 0;
    SLOT.lines.forEach((ln, li) => {
      const first = grid[0][ln[0]]; if (!FISH.pay[first]) return;
      let n = 1; while (n < 5) { const s = grid[n][ln[n]]; if (s === first || s === 'cat') n++; else break; }
      const p = FISH.pay[first][n] * FISH.payScale; if (p) { const a = lb * p; win += a; wins.push({ line: li, sym: first, n, amount: Math.floor(a) }); }
    });
    return { wins, win };
  }
  const countIn = (grid, f) => grid.reduce((a, c) => a + c.filter(f).length, 0);
  function fishBase(bet, rnd) {
    let grid = fishGrid('base', rnd); const grid0 = grid.map(c => c.slice()); let feat = null;
    if (countIn(grid, s => s === 'scat') === 2 && rnd() < FISH.featP) {
      if (rnd() < 0.5) {   // подброс: третий бонус падает на барабан без бонуса
        const free = []; grid.forEach((c, r) => { if (!c.includes('scat')) c.forEach((_, row) => free.push([r, row])); });
        const [r, row] = free[Math.floor(rnd() * free.length)]; grid[r][row] = 'scat'; feat = { type: 'drop', r, row };
      } else {             // перекрут: бонусы держатся, остальное крутится заново
        grid = grid.map((c, r) => c.map(s => s === 'scat' ? s : fishSym('base', rnd))); feat = { type: 'respin' };
      }
    }
    const L = fishLines(grid, bet), sc = Math.min(countIn(grid, s => s === 'scat'), 5), scatWin = FISH.scatPay[sc] * bet;
    return { grid0, grid, feat, wins: L.wins, scat: sc, scatWin: Math.floor(scatWin), win: Math.floor(L.win + scatWin), fsCount: FISH.fsFor[sc] };
  }
  function fishFree(bet, rnd, count, mode) {
    const out = []; let left = count, cats = 0, level = 0, total = 0;
    while (left > 0 && out.length < 120) {
      left--;
      const grid = fishGrid(mode, rnd); let mod = null;
      const hasCat = countIn(grid, s => s === 'cat') > 0, hasFish = countIn(grid, isMoney) > 0;
      if (hasCat && !hasFish && rnd() < FISH.modP) {        // рыбки приплыли сами
        const n = 1 + Math.floor(rnd() * 3), cells = []; grid.forEach((c, r) => c.forEach((s, row) => { if (s !== 'cat') cells.push([r, row]); }));
        const put = []; for (let i = 0; i < n && cells.length; i++) { const [r, row] = cells.splice(Math.floor(rnd() * cells.length), 1)[0]; grid[r][row] = fishMoney(rnd); put.push([r, row]); }
        mod = { type: 'fish', cells: put };
      } else if (!hasCat && hasFish && rnd() < FISH.modP) { // крючок вытащил кота
        const cells = []; grid.forEach((c, r) => c.forEach((s, row) => { if (!isMoney(s)) cells.push([r, row]); }));
        if (cells.length) { const [r, row] = cells[Math.floor(rnd() * cells.length)]; grid[r][row] = 'cat'; mod = { type: 'hook', r, row }; }
      }
      const L = fishLines(grid, bet), catN = countIn(grid, s => s === 'cat'), fishSum = grid.reduce((a, c) => a + c.filter(isMoney).reduce((b, s) => b + moneyVal(s), 0), 0);
      const mult = FISH.levels[level], collect = catN ? fishSum * bet * FISH.moneyScale * catN * mult : 0;
      const win = Math.floor(L.win + collect); total += win;
      cats += catN; let retrig = null;
      while (level < FISH.levels.length - 1 && cats >= FISH.retrigEvery * (level + 1)) { level++; left += 10; retrig = { add: 10, mult: FISH.levels[level] }; }
      out.push({ grid, mod, wins: L.wins, catN, fishSum, mult, collect: Math.floor(collect), win, cats, level, retrig, left });
      if (total >= bet * FISH.maxWinX) break;
    }
    return out;
  }
  function fishRound(bet, rnd, buy) {
    const base = buy ? null : fishBase(bet, rnd);
    const fsCount = buy ? 10 : base.fsCount;
    const mode = fsCount ? (rnd() < FISH.goldenCards / 12 ? 'golden' : 'fs') : null;
    const fs = fsCount ? fishFree(bet, rnd, fsCount, mode) : [];
    const total = Math.min(Math.floor((base ? base.win : 0) + fs.reduce((a, f) => a + f.win, 0)), bet * FISH.maxWinX);
    return { base, fsCount, mode, fs, total };
  }
  // «Ракетка» (краш): точка взрыва решается при старте и скрыта от игрока. P(взрыв позже x) = 0.97 / x
  const CRASH = { k: 0.12, edge: 0.97, maxX: 1000 };
  const crashPoint = rnd => { const u = rnd(); const x = CRASH.edge / (1 - u); return x < 1 ? 1 : Math.min(CRASH.maxX, Math.floor(x * 100) / 100); };
  const crashMultAt = ms => Math.floor(Math.exp(CRASH.k * Math.max(0, ms) / 1000) * 100) / 100;
  const crashTimeOf = x => Math.log(x) / CRASH.k * 1000;
  function crashSettle(S, now) {
    const c = S.cr; if (!c || !c.active) return null;
    const tc = c.t0 + crashTimeOf(c.crash), ta = c.auto ? c.t0 + crashTimeOf(c.auto) : Infinity;
    if (c.auto && c.auto < c.crash && now >= ta) { const win = Math.floor(c.bet * c.auto); S.coins += win; c.active = 0; c.cashed = c.auto; c.win = win; }
    else if (now >= tc) { c.active = 0; c.win = 0; }
    else return null;
    S.crHist = [c.crash, ...(S.crHist || [])].slice(0, 14); return c;
  }
 
  // Европейская рулетка: 0–36, один ноль
  const ROUL = {
    order: [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26],
    red: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],
    pay: { red: 2, black: 2, even: 2, odd: 2, low: 2, high: 2, d1: 3, d2: 3, d3: 3, zero: 36 },
  };
  const roulColor = n => n === 0 ? 'green' : ROUL.red.includes(n) ? 'red' : 'black';
  function roulHit(k, n) {
    if (k === 'zero') return n === 0; if (k[0] === 'n') return Number(k.slice(1)) === n; if (n === 0) return false;
    return { red: roulColor(n) === 'red', black: roulColor(n) === 'black', even: n % 2 === 0, odd: n % 2 === 1, low: n <= 18, high: n >= 19,
      d1: n <= 12, d2: n >= 13 && n <= 24, d3: n >= 25 }[k];
  }
  const roulMult = k => k[0] === 'n' ? 36 : ROUL.pay[k];
  // Мины 5×5: множитель за k открытых безопасных клеток при n минах, с преимуществом казино 3%
  function minesMult(n, k) { let m = 0.97; for (let i = 0; i < k; i++) m *= (25 - i) / (25 - n - i); return Math.floor(m * 100) / 100; }
  // Plinko: шарик на каждом ряду уходит влево/вправо 50/50. Таблицы с возвратом ~96–97%
  const _sym = a => [...a, ...a.slice(0, -1).reverse()];
  const PLINKO = { rows: [8, 12, 16], risks: ['low', 'mid', 'high'], m: {
    8: { low: _sym([5.4, 2, 1.1, 1, 0.45]), mid: _sym([11, 3, 1.3, 0.7, 0.4]), high: _sym([28, 4, 1.4, 0.3, 0.2]) },
    12: { low: _sym([10, 3, 1.6, 1.3, 1.1, 1, 0.45]), mid: _sym([32, 11, 4, 2, 1, 0.6, 0.3]), high: _sym([150, 24, 8, 2, 0.65, 0.2, 0.2]) },
    16: { low: _sym([15, 9, 2, 1.4, 1.3, 1.2, 1.1, 1, 0.4]), mid: _sym([100, 40, 10, 5, 3, 1.5, 0.9, 0.5, 0.3]), high: _sym([1000, 120, 25, 9, 4, 1.9, 0.2, 0.2, 0.2]) } } };
  // Кости: шанс 2–95%, выплата 97/шанс
  const DICE = { min: 2, max: 95, edge: 97 };
  const diceMult = c => Math.floor(DICE.edge / c * 100) / 100;
  // Монетка: x1.94
  const COIN = { mult: 1.94 };
  // Колесо: 20 секторов, возврат ~96%
  const WHEEL = {
    low: [1.2, 1.5, 1.2, 0, 1.2, 1.2, 1.5, 1.2, 0, 1.2, 1.2, 1.5, 1.2, 0, 1.2, 1.2, 1.5, 1.2, 0, 0],
    mid: [0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 1.5, 0, 4.8, 0, 1.5, 0, 0],
    high: [19.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
 
  // ---------------- МАГАЗИН ЗА TELEGRAM STARS ----------------
  const PRODUCTS = [
    { id: 'starter', em: '🎁', title: 'Стартовый набор', desc: '300 000 монет + 3 золотых яйца + доход x2 на 24 часа. Можно купить один раз.', stars: 99, once: 1, give: { coins: 300000, tickets: { gold: 3 }, x2h: 24 } },
    { id: 'coins1', em: '💰', title: 'Мешок монет', desc: '100 000 монет', stars: 25, give: { coins: 100000 } },
    { id: 'coins2', em: '💰', title: 'Сундук монет', desc: '600 000 монет', stars: 100, give: { coins: 600000 } },
    { id: 'coins3', em: '💎', title: 'Гора монет', desc: '4 000 000 монет', stars: 500, give: { coins: 4000000 } },
    { id: 'x2', em: '⚡', title: 'Доход x2 на 24 часа', desc: 'Все звери приносят вдвое больше сутки', stars: 40, give: { x2h: 24 } },
    { id: 'meme3', em: '🤪', title: '3 мем-яйца', desc: 'Три мем-яйца — шанс на Профессора Гриффона', stars: 60, give: { tickets: { meme: 3 } } },
    { id: 'cosmic1', em: '🌌', title: 'Космическое яйцо', desc: 'Одно космическое яйцо', stars: 50, give: { tickets: { cosmic: 1 } } },
  ];
 
  // ---------------- КЛЮЧИ ПЕТОВ ----------------
  // "cat" — обычный, "cat:g" — золотой, "cat:r" — радужный
  const K = (id, v) => v ? id + ':' + v : id;
  const PK = k => { const [id, v = ''] = String(k).split(':'); return { p: PET[id], v: VARS.find(x => x.id === v) || VARS[0] }; };
  const ALL_KEYS = PETS.flatMap(p => VARS.map(v => K(p.id, v.id)));
  const validKey = k => ALL_KEYS.includes(k);
 
  // ---------------- ФОРМУЛЫ ----------------
  const tapPower = S => 5 * (1 + S.boost.tap);
  const maxEnergy = S => 1000 + 250 * S.boost.energy;
  const regen = S => 3 + S.boost.regen;
  const kVal = k => { const { p, v } = PK(k); return Math.round(p.v * v.m); };
  const kIncFor = (k, n, l) => { const { p, v } = PK(k); return Math.max(1, Math.round(RARITY[p.r].inc * v.m * (1 + 0.5 * (n - 1)) * Math.pow(1.25, l))); };
  const kInc = (S, k) => { const o = S.pets[k]; return o ? kIncFor(k, o.n, o.lvl) : 0; };
  const perSec = S => Object.keys(S.pets).reduce((a, k) => a + kInc(S, k), 0);
  const x2On = (S, now) => S.x2Until > now;
  const lvlCostAt = (k, l) => { const { p, v } = PK(k); return Math.floor(RARITY[p.r].inc * v.m * 600 * Math.pow(1.7, l)); };
  const lvlCost = (S, k) => lvlCostAt(k, S.pets[k].lvl);
  const lvlSpent = (S, k) => { let s = 0; for (let l = 0; l < S.pets[k].lvl; l++) s += lvlCostAt(k, l); return s; };
  const copiesValue = (S, k, n) => { const o = S.pets[k]; if (!o || n <= 0) return 0; return kVal(k) * n + (n >= o.n ? Math.floor(lvlSpent(S, k) * LEVEL_REFUND) : 0); };
  const boostCost = (S, b) => Math.floor(b.base * Math.pow(b.mult, S.boost[b.id]));
  const adCoins = S => Math.max(10000, perSec(S) * 300);
  const dayKey = (ms, tz) => { const d = new Date(ms + (tz || 0) * 60000); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); };
  const ownedKeys = S => Object.keys(S.pets).sort((a, b) => kVal(b) - kVal(a));
  const speciesCount = S => new Set(Object.keys(S.pets).map(k => k.split(':')[0])).size;
  const famCount = (S, f) => new Set(Object.keys(S.pets).map(k => PK(k).p).filter(p => p.fam === f).map(p => p.id)).size;
 
  // ---------------- ЗАДАНИЯ ----------------
  const QUESTS = [
    { id: 'tap100', em: '👆', name: 'Сделай 100 тапов', reward: 2000, prog: S => [S.st.taps, 100] },
    { id: 'tap1000', em: '👆', name: 'Сделай 1 000 тапов', reward: 10000, prog: S => [S.st.taps, 1000] },
    { id: 'tap10k', em: '🔥', name: 'Сделай 10 000 тапов', reward: 80000, prog: S => [S.st.taps, 10000] },
    { id: 'egg1', em: '🥚', name: 'Открой первое яйцо', reward: 3000, prog: S => [S.st.eggs, 1] },
    { id: 'egg10', em: '🥚', name: 'Открой 10 яиц', reward: 30000, prog: S => [S.st.eggs, 10] },
    { id: 'egg50', em: '🪺', name: 'Открой 50 яиц', reward: 150000, prog: S => [S.st.eggs, 50] },
    { id: 'friend1', em: '👋', name: 'Пригласи друга', reward: 30000, prog: S => [S.refs, 1] },
    { id: 'friend5', em: '👥', name: 'Пригласи 5 друзей', reward: 250000, prog: S => [S.refs, 5] },
    { id: 'sell1', em: '💸', name: 'Продай зверя', reward: 2000, prog: S => [S.st.sold, 1] },
    { id: 'lvl1', em: '⬆️', name: 'Прокачай зверя', reward: 3000, prog: S => [S.st.lvl, 1] },
    { id: 'lvl10', em: '⬆️', name: 'Сделай 10 прокачек', reward: 25000, prog: S => [S.st.lvl, 10] },
    { id: 'upg1', em: '🎰', name: 'Сделай апгрейд', reward: 5000, prog: S => [S.st.upg, 1] },
    { id: 'upgw1', em: '🏆', name: 'Выиграй апгрейд', reward: 15000, prog: S => [S.st.upgWin, 1] },
    { id: 'upgw10', em: '🏆', name: 'Выиграй 10 апгрейдов', reward: 120000, prog: S => [S.st.upgWin, 10] },
    { id: 'sp10', em: '🐾', name: 'Собери 10 разных зверей', reward: 40000, prog: S => [speciesCount(S), 10] },
    { id: 'sp30', em: '🐾', name: 'Собери 30 разных зверей', reward: 300000, prog: S => [speciesCount(S), 30] },
    { id: 'cats5', em: '🐱', name: 'Собери 5 пород кошек', reward: 60000, prog: S => [famCount(S, 'cat'), 5] },
    { id: 'dogs5', em: '🐶', name: 'Собери 5 пород собак', reward: 60000, prog: S => [famCount(S, 'dog'), 5] },
    { id: 'meme1', em: '🤪', name: 'Получи мемного зверя', reward: 50000, prog: S => [famCount(S, 'meme'), 1] },
    { id: 'gold', em: '✨', name: 'Получи золотого зверя', reward: 50000, prog: S => [S.st.gotG, 1] },
    { id: 'rainbow', em: '🌈', name: 'Получи радужного зверя', reward: 150000, prog: S => [S.st.gotR, 1] },
    { id: 'leg', em: '👑', name: 'Получи легендарного зверя', reward: 200000, prog: S => [S.st.gotLeg, 1] },
    { id: 'inc100', em: '💰', name: 'Доход 100 в секунду', reward: 50000, prog: S => [perSec(S), 100] },
    { id: 'inc1000', em: '💰', name: 'Доход 1 000 в секунду', reward: 500000, prog: S => [perSec(S), 1000] },
  ];
  const questReady = (S, q) => { if (S.done[q.id]) return false; const [c, g] = q.prog(S); return c >= g; };
 
  // ---------------- СОСТОЯНИЕ ----------------
  const DEF_ST = { taps: 0, eggs: 0, upg: 0, upgWin: 0, sold: 0, lvl: 0, gotG: 0, gotR: 0, gotLeg: 0 };
  function fresh(now) {
    return { ver: 5, coins: 0, boost: { tap: 0, energy: 0, regen: 0 }, pets: { cat: { n: 1, lvl: 0 } }, main: 'cat', energy: 1000, last: now, tapT: 0,
      st: { ...DEF_ST }, done: {}, daily: { day: 0, last: '' }, hist: [], x2Until: 0, ad: { day: '', n: 0, last: 0 }, offBonus: 0,
      tickets: {}, bought: {}, refs: 0, tz: null };
  }
  function normalize(S, now) {
    if (!S.ver || S.ver < 4) S.coins = Math.floor((S.coins || 0) * 10);
    const f = fresh(now);
    for (const k in f) if (S[k] === undefined) S[k] = f[k];
    S.st = Object.assign({ ...DEF_ST }, S.st); S.boost = Object.assign({ tap: 0, energy: 0, regen: 0 }, S.boost);
    for (const k of Object.keys(S.pets)) if (!PK(k).p) delete S.pets[k];
    if (S.main && !S.pets[S.main]) S.main = ownedKeys(S)[0] || null;
    S.coins = Math.floor(S.coins); S.ver = 5; delete S.set;
    return S;
  }
  const fail = m => { throw new Error(m); };
  const int = (x, min = 0) => { x = Math.floor(Number(x)); return Number.isFinite(x) && x >= min ? x : fail('Неверное число'); };
 
  // начислить доход за прошедшее время (целые секунды)
  function idle(S, now) {
    if (!S.last || S.last > now) { S.last = now; return null; }
    const secs = Math.floor((now - S.last) / 1000); if (secs < 1) return null;
    const cap = OFFLINE_CAP_H * 3600, paid = Math.min(secs, cap);
    const x2s = Math.max(0, Math.min(paid, Math.floor((S.x2Until - S.last) / 1000)));
    const ps = perSec(S), earned = ps * paid + ps * x2s;
    S.coins += earned; S.energy = Math.min(maxEnergy(S), S.energy + regen(S) * paid);
    S.last = secs > cap ? now : S.last + secs * 1000;
    return { earned, secs: paid };
  }
  function addPet(S, k) {
    if (S.pets[k]) S.pets[k].n++; else S.pets[k] = { n: 1, lvl: 0 };
    if (!S.main || !S.pets[S.main]) S.main = k;
    const { p, v } = PK(k); if (v.id === 'g') S.st.gotG = 1; if (v.id === 'r') S.st.gotR = 1; if (p.r >= 3) S.st.gotLeg = 1;
  }
  function removePet(S, k, n) { const o = S.pets[k]; o.n -= n; if (o.n <= 0) { delete S.pets[k]; if (S.main === k) S.main = ownedKeys(S)[0] || null; } }
  function rollFrom(odds, rnd) { let x = rnd() * 100; for (let i = 0; i < odds.length; i++) { if (x < odds[i]) return i; x -= odds[i]; } return 0; }
  function randomPet(r, pool, rnd) { let l = PETS.filter(p => p.r === r && (!pool || p.fam === pool)); if (!l.length) l = PETS.filter(p => p.r === r); return l[Math.floor(rnd() * l.length)]; }
 
  // ---------------- ДЕЙСТВИЯ ----------------
  const A = {
    tap(S, { n }, now) {
      n = Math.min(int(n), 500);
      const since = S.tapT ? Math.max(0, (now - S.tapT) / 1000) : 5;
      const maxBy = Math.floor(Math.min(since, 10) * 20) + 10;   // не больше ~20 тапов в секунду
      S.tapT = now;
      const k = Math.max(0, Math.min(n, Math.floor(S.energy), maxBy));
      S.energy -= k; S.coins += k * tapPower(S); S.st.taps += k;
      return { k };
    },
    egg(S, { eid, ticket }, now, rnd) {
      const e = EGGS.find(x => x.id === eid) || fail('Нет такого яйца');
      if (ticket) { if (!(S.tickets[eid] > 0)) fail('Нет билетов на это яйцо'); S.tickets[eid]--; }
      else { if (S.coins < e.price) fail('Не хватает монет'); S.coins -= e.price; }
      const p = randomPet(rollFrom(e.odds, rnd), e.pool, rnd), v = VARS[rollFrom(VARS.map(x => x.odds), rnd)], k = K(p.id, v.id);
      const isNew = !S.pets[k]; addPet(S, k); S.st.eggs++;
      return { k, isNew };
    },
    sell(S, { k, n }) {
      const o = S.pets[k] || fail('Нет такого зверя'); n = int(n, 1); if (n > o.n) fail('Столько нет');
      const v = copiesValue(S, k, n); removePet(S, k, n); S.coins += v; S.st.sold += n; return { v };
    },
    lvl(S, { k }) {
      const o = S.pets[k] || fail('Нет такого зверя'); const c = lvlCost(S, k);
      if (S.coins < c) fail('Не хватает монет'); S.coins -= c; o.lvl++; S.st.lvl++; return {};
    },
    boost(S, { id }) {
      const b = BOOSTS.find(x => x.id === id) || fail('Нет такого буста'); const c = boostCost(S, b);
      if (S.coins < c) fail('Не хватает монет'); S.coins -= c; S.boost[id]++; return {};
    },
    main(S, { k }) { if (!S.pets[k]) fail('Нет такого зверя'); S.main = k; return {}; },
    upg(S, { coins, pets, target }, now, rnd) {
      if (!validKey(target)) fail('Неверная цель');
      coins = int(coins || 0); if (coins > S.coins) fail('Не хватает монет');
      pets = pets || {}; let sv = coins;
      for (const k in pets) { const n = int(pets[k], 1), o = S.pets[k]; if (!o || n > o.n) fail('Нет таких зверей'); sv += copiesValue(S, k, n); }
      if (sv <= 0) fail('Пустая ставка');
      const t = kVal(target); if (t <= sv) fail('Цель должна быть дороже ставки');
      const ch = Math.min(UPG.max, sv / t * 100 * UPG.edge);
      const roll = rnd() * 360, win = Math.abs(roll - 180) < ch * 1.8;   // зона выигрыша — ch% круга вокруг низа
      S.coins -= coins; for (const k in pets) removePet(S, k, int(pets[k], 1));
      if (win) { addPet(S, target); S.st.upgWin++; }
      S.st.upg++; S.hist.unshift({ s: sv, t: target, ch, w: win ? 1 : 0 }); S.hist = S.hist.slice(0, 10);
      return { roll, win, ch, sv };
    },
    daily(S, p, now) {
      const today = dayKey(now, S.tz), yest = dayKey(now - 864e5, S.tz);
      if (S.daily.last === today) fail('Уже забрано сегодня');
      const d = S.daily.last === yest ? (S.daily.day % 7) + 1 : 1, r = DAILY[d - 1];
      S.daily = { day: d, last: today };
      if (typeof r === 'number') S.coins += r; else S.tickets[r.egg] = (S.tickets[r.egg] || 0) + 1;
      return { d, r };
    },
    quest(S, { id }) {
      const q = QUESTS.find(x => x.id === id) || fail('Нет такого задания');
      if (!questReady(S, q)) fail('Задание ещё не выполнено'); S.done[id] = 1; S.coins += q.reward; return { reward: q.reward };
    },
    ad(S, { kind }, now) {
      const today = dayKey(now, S.tz); if (S.ad.day !== today) S.ad = { day: today, n: 0, last: 0 };
      if (S.ad.n >= AD.perDay) fail('Лимит рекламы на сегодня');
      if (now - S.ad.last < AD.cooldown * 1000) fail('Подожди немного');
      let amount = 0;
      if (kind === 'coins') { amount = adCoins(S); S.coins += amount; }
      else if (kind === 'egg') { S.tickets.basic = (S.tickets.basic || 0) + 1; }
      else if (kind === 'offline') { if (!(S.offBonus > 0)) fail('Нечего удваивать'); amount = S.offBonus; S.coins += amount; S.offBonus = 0; }
      else fail('Неизвестная награда');
      S.ad.n++; S.ad.last = now; return { kind, amount };
    },
  };
  // ---------------- КАЗИНО: только игровые монеты, вывода нет ----------------
  Object.assign(A, {
    slot(S, { bet, buy }, now, rnd) {
      bet = int(bet, SLOT.minBet); const cost = buy ? slotBuyPrice(bet) : bet;
      if (cost > S.coins) fail('Не хватает монет');
      S.coins -= cost;
      const R = slotRound(bet, rnd, !!buy); S.coins += R.total; S.st.casino = (S.st.casino || 0) + 1;
      const b = R.base || { grid: null, wins: [], scat: 0, scatWin: 0 };
      return { grid: b.grid, wins: b.wins, scat: b.scat, scatWin: b.scatWin, fsCount: R.fsCount, fs: R.fs, win: R.total, bet, cost, buy: !!buy };
    },
    fish(S, { bet, buy }, now, rnd) {
      bet = int(bet, FISH.minBet); const cost = buy ? bet * FISH.buyX : bet;
      if (cost > S.coins) fail('Не хватает монет');
      S.coins -= cost; const R = fishRound(bet, rnd, !!buy); S.coins += R.total; S.st.casino = (S.st.casino || 0) + 1;
      const b = R.base || {};
      return { grid0: b.grid0 || null, grid: b.grid || null, feat: b.feat || null, wins: b.wins || [], scat: b.scat || 0, scatWin: b.scatWin || 0,
        fsCount: R.fsCount, mode: R.mode, fs: R.fs, win: R.total, bet, cost, buy: !!buy };
    },
    crashStart(S, { bet, auto }, now, rnd) {
      crashSettle(S, now); if (S.cr && S.cr.active) fail('Ракета ещё летит');
      bet = int(bet, 1); if (bet > S.coins) fail('Не хватает монет');
      auto = Number(auto) || 0; if (auto && (auto < 1.01 || auto > CRASH.maxX)) fail('Автовывод от x1.01');
      S.coins -= bet; S.cr = { bet, auto: auto ? Math.floor(auto * 100) / 100 : 0, crash: crashPoint(rnd), t0: now, active: 1 };
      S.st.casino = (S.st.casino || 0) + 1;
      if (S.cr.crash <= 1) crashSettle(S, now + 1);
      return { t0: S.cr.t0 };
    },
    crashTick(S, p, now) { crashSettle(S, now); const c = S.cr || {}; return { active: !!c.active, crash: c.active ? undefined : c.crash, cashed: c.cashed, win: c.win }; },
    crashCash(S, p, now) {
      crashSettle(S, now); const c = S.cr; if (!c) fail('Нет игры');
      if (!c.active) return { active: false, crash: c.crash, cashed: c.cashed, win: c.win };
      const m = crashMultAt(now - c.t0);
      if (m >= c.crash) { crashSettle(S, c.t0 + crashTimeOf(c.crash) + 1); return { active: false, crash: c.crash, win: 0 }; }
      const win = Math.floor(c.bet * m); S.coins += win; c.active = 0; c.cashed = m; c.win = win;
      S.crHist = [c.crash, ...(S.crHist || [])].slice(0, 14);
      return { active: false, cashed: m, win, crash: c.crash };
    },
    roul(S, { bets }, now, rnd) {
      bets = bets || {}; let sum = 0;
      for (const k in bets) { if (!ROUL.pay[k] && !/^n([1-9]|[12]\d|3[0-6])$/.test(k)) fail('Неверная ставка'); bets[k] = int(bets[k], 1); sum += bets[k]; }
      if (!sum) fail('Сделай ставку'); if (sum > S.coins) fail('Не хватает монет');
      S.coins -= sum;
      const n = Math.floor(rnd() * 37); let win = 0;
      for (const k in bets) if (roulHit(k, n)) win += bets[k] * roulMult(k);
      S.coins += win; S.roulHist = [n, ...(S.roulHist || [])].slice(0, 12); S.st.casino = (S.st.casino || 0) + 1;
      return { n, win, sum };
    },
    minesStart(S, { bet, n }, now, rnd) {
      if (S.mn && S.mn.active) fail('Сначала закончи текущую игру');
      bet = int(bet, 1); n = int(n, 1); if (n > 24) fail('От 1 до 24 мин'); if (bet > S.coins) fail('Не хватает монет');
      const cells = Array.from({ length: 25 }, (_, i) => i);
      for (let i = 24; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      S.coins -= bet; S.mn = { bet, n, pos: cells.slice(0, n).sort((a, b) => a - b), open: [], active: 1 };
      S.st.casino = (S.st.casino || 0) + 1;
      return { bet, n };
    },
    minesOpen(S, { i }) {
      const m = S.mn; if (!m || !m.active) fail('Игра не начата'); i = int(i); if (i > 24 || m.open.includes(i)) fail('Эта клетка уже открыта');
      if (m.pos.includes(i)) { m.active = 0; m.boom = i; return { boom: 1, i, pos: m.pos, lost: m.bet }; }
      m.open.push(i); const mult = minesMult(m.n, m.open.length);
      if (m.open.length === 25 - m.n) { const win = Math.floor(m.bet * mult); S.coins += win; m.active = 0; return { safe: 1, i, mult, auto: 1, win, pos: m.pos }; }
      return { safe: 1, i, mult, next: minesMult(m.n, m.open.length + 1) };
    },
    minesCash(S) {
      const m = S.mn; if (!m || !m.active) fail('Игра не начата'); if (!m.open.length) fail('Открой хотя бы одну клетку');
      const mult = minesMult(m.n, m.open.length), win = Math.floor(m.bet * mult); S.coins += win; m.active = 0;
      return { win, mult, pos: m.pos };
    },
    plinko(S, { bet, rows, risk }, now, rnd) {
      bet = int(bet, 10); rows = int(rows); if (!PLINKO.rows.includes(rows)) fail('Неверное число рядов');
      if (!PLINKO.risks.includes(risk)) fail('Неверный риск'); if (bet > S.coins) fail('Не хватает монет');
      S.coins -= bet; const path = []; for (let i = 0; i < rows; i++) path.push(rnd() < 0.5 ? 0 : 1);
      const idx = path.reduce((a, b) => a + b, 0), mult = PLINKO.m[rows][risk][idx], win = Math.floor(bet * mult);
      S.coins += win; S.st.casino = (S.st.casino || 0) + 1;
      return { path, idx, mult, win, bet };
    },
    dice(S, { bet, chance, side }, now, rnd) {
      bet = int(bet, 10); chance = int(chance); if (chance < DICE.min || chance > DICE.max) fail('Шанс от 2 до 95%');
      if (side !== 'under' && side !== 'over') fail('Выбери больше или меньше'); if (bet > S.coins) fail('Не хватает монет');
      S.coins -= bet; const roll = Math.floor(rnd() * 10000) / 100;
      const ok = side === 'under' ? roll < chance : roll >= 100 - chance, mult = diceMult(chance), win = ok ? Math.floor(bet * mult) : 0;
      S.coins += win; S.st.casino = (S.st.casino || 0) + 1; S.diceHist = [{ r: roll, w: ok ? 1 : 0 }, ...(S.diceHist || [])].slice(0, 12);
      return { roll, ok, mult, win, bet };
    },
    coin(S, { bet, side }, now, rnd) {
      bet = int(bet, 10); if (side !== 'h' && side !== 't') fail('Выбери сторону'); if (bet > S.coins) fail('Не хватает монет');
      S.coins -= bet; const res = rnd() < 0.5 ? 'h' : 't', ok = res === side, win = ok ? Math.floor(bet * COIN.mult) : 0;
      S.coins += win; S.st.casino = (S.st.casino || 0) + 1; S.coinHist = [res, ...(S.coinHist || [])].slice(0, 14);
      return { res, ok, win, bet };
    },
    wheel(S, { bet, risk }, now, rnd) {
      bet = int(bet, 10); const segs = WHEEL[risk] || fail('Неверный риск'); if (bet > S.coins) fail('Не хватает монет');
      S.coins -= bet; const idx = Math.floor(rnd() * segs.length), mult = segs[idx], win = Math.floor(bet * mult);
      S.coins += win; S.st.casino = (S.st.casino || 0) + 1;
      return { idx, mult, win, bet };
    },
  });
 
  function act(S, a, p, now, rnd) { if (!A[a]) fail('Неизвестное действие'); const r = A[a](S, p || {}, now, rnd); S.coins = Math.floor(S.coins); return r; }
 
  // ---------------- УДАЧА (выдаёт админ) ----------------
  // S.luck от 0 до 1: если исход плохой, с этой вероятностью он перекручивается (до 2 раз), берётся лучший
  const LUCKY = ['slot', 'fish', 'roul', 'upg', 'egg', 'crashStart', 'plinko', 'dice', 'coin', 'wheel'];
  const petsValue = S => Object.entries(S.pets).reduce((a, [k, o]) => a + kVal(k) * o.n, 0);
  const luckScore = (S0, S1, a) => a === 'crashStart' ? (S1.cr ? S1.cr.crash : 0) - 2 : (S1.coins - S0.coins) + petsValue(S1) - petsValue(S0);
  function luckyAct(S, a, p, now, rnd) {
    if (!(S.luck > 0) || !LUCKY.includes(a)) return act(S, a, p, now, rnd);
    const snap = JSON.stringify(S), ps = JSON.stringify(p || {});
    const try1 = JSON.parse(snap), r1 = act(try1, a, JSON.parse(ps), now, rnd);
    let best = { st: try1, r: r1, sc: luckScore(S, try1, a) };
    for (let i = 0; i < 2 && best.sc < 0 && rnd() < S.luck; i++) {
      const t = JSON.parse(snap), r = act(t, a, JSON.parse(ps), now, rnd), sc = luckScore(S, t, a);
      if (sc > best.sc) best = { st: t, r, sc };
    }
    for (const k of Object.keys(S)) delete S[k]; Object.assign(S, best.st);
    return best.r;
  }
 
  // выдать покупку за звёзды
  function grant(S, pid, now) {
    const pr = PRODUCTS.find(x => x.id === pid) || fail('Нет такого товара'); const g = pr.give;
    if (g.coins) S.coins += g.coins;
    if (g.tickets) for (const e in g.tickets) S.tickets[e] = (S.tickets[e] || 0) + g.tickets[e];
    if (g.x2h) S.x2Until = Math.max(now, S.x2Until) + g.x2h * 3600e3;
    if (pr.once) S.bought[pid] = 1;
    S.coins = Math.floor(S.coins); return pr;
  }
  function refBonus(S) { S.refs = (S.refs || 0) + 1; S.coins += REF.inviter; S.tickets.basic = (S.tickets.basic || 0) + 1; }
  function upgChance(S, sv, target) { const t = kVal(target); if (!sv || t <= sv) return 0; return Math.min(UPG.max, sv / t * 100 * UPG.edge); }
 
  return { RARITY, PETS, PET, VARS, EGGS, UPG, BOOSTS, DAILY, OFFLINE_CAP_H, AD, REF, PRODUCTS, QUESTS, ALL_KEYS,
    K, PK, validKey, tapPower, maxEnergy, regen, kVal, kIncFor, kInc, perSec, x2On, lvlCost, lvlSpent, copiesValue, boostCost, adCoins,
    dayKey, ownedKeys, speciesCount, famCount, questReady, fresh, normalize, idle, act, luckyAct, addPet, grant, refBonus, upgChance,
    SLOT, SYM, slotSpin, slotRound, slotBuyPrice, FISH, isMoney, moneyVal, fishBase, fishFree, fishRound, CRASH, crashPoint, crashMultAt, crashTimeOf, crashSettle, ROUL, roulColor, roulHit, roulMult, minesMult, PLINKO, DICE, diceMult, COIN, WHEEL };
});
 
