/* Grow a Pet — сервер: игра, Telegram-бот, оплата звёздами, друзья, рейтинг.
   Переменные окружения (задаются на хостинге):
     BOT_TOKEN          — токен от @BotFather (обязательно)
     WEBAPP_URL         — адрес этого сервера, например https://growapet.onrender.com (обязательно)
     DATABASE_URL       — строка подключения Postgres из Neon (без неё данные пишутся в файл — только для теста)
     ADSGRAM_BLOCK_ID   — id рекламного блока Adsgram (без него реклама скрыта)
     ADMIN_ID           — твой Telegram id (для команды /refund)
     SUPPORT            — контакт поддержки, например @username
*/
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Core = require('./public/core.js');

const { BOT_TOKEN = '', DATABASE_URL = '', ADSGRAM_BLOCK_ID = '', ADMIN_ID = '', SUPPORT = '', DEV = '' } = process.env;
const WEBAPP_URL = (process.env.WEBAPP_URL || '').replace(/\/$/, '');
const PORT = process.env.PORT || 3000;
const HOOK_SECRET = crypto.createHash('sha256').update('hook:' + BOT_TOKEN).digest('hex').slice(0, 40);
let BOT_USERNAME = process.env.BOT_USERNAME || '';

// ================= ХРАНИЛИЩЕ =================
let db;
if (DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : { rejectUnauthorized: false }, max: 5 });
  db = {
    async init() {
      await pool.query(`
        create table if not exists users(id bigint primary key, name text, state jsonb not null, per_sec bigint default 0,
          ref_by bigint, created_at timestamptz default now(), updated_at timestamptz default now());
        create index if not exists users_per_sec on users(per_sec desc);
        create index if not exists users_ref on users(ref_by);
        create table if not exists payments(charge_id text primary key, user_id bigint, product text, stars int,
          refunded boolean default false, created_at timestamptz default now());`);
    },
    async get(id) { const r = await pool.query('select id,name,state,ref_by from users where id=$1', [id]); return r.rows[0] || null; },
    async put(u) {
      await pool.query(`insert into users(id,name,state,per_sec,ref_by) values($1,$2,$3,$4,$5)
        on conflict(id) do update set name=$2, state=$3, per_sec=$4, updated_at=now()`, [u.id, u.name, JSON.stringify(u.state), u.per_sec, u.ref_by || null]);
    },
    async top(n) { return (await pool.query('select id,name,per_sec from users order by per_sec desc limit $1', [n])).rows.map(r => ({ id: +r.id, name: r.name, ps: +r.per_sec })); },
    async rank(ps) { return +(await pool.query('select count(*) c from users where per_sec>$1', [ps])).rows[0].c + 1; },
    async friends(id) { return (await pool.query('select name,per_sec from users where ref_by=$1 order by per_sec desc limit 100', [id])).rows.map(r => ({ name: r.name, ps: +r.per_sec })); },
    async addPayment(p) {
      const r = await pool.query('insert into payments(charge_id,user_id,product,stars) values($1,$2,$3,$4) on conflict do nothing', [p.charge, p.user, p.product, p.stars]);
      return r.rowCount === 1;
    },
    async getPayment(charge) { return (await pool.query('select * from payments where charge_id=$1', [charge])).rows[0] || null; },
    async markRefunded(charge) { await pool.query('update payments set refunded=true where charge_id=$1', [charge]); },
    async stats() {
      const u = (await pool.query("select count(*) c, count(*) filter (where updated_at > now() - interval '1 day') d from users")).rows[0];
      const p = (await pool.query('select count(*) c, coalesce(sum(stars),0) s from payments where not refunded')).rows[0];
      return { users: +u.c, day: +u.d, payments: +p.c, stars: +p.s };
    },
  };
} else {
  // простое файловое хранилище — только для локальной проверки
  const FILE = path.join(__dirname, 'data.json');
  let data = { users: {}, payments: {} };
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
  const flush = () => fs.writeFileSync(FILE, JSON.stringify(data));
  db = {
    async init() { console.warn('⚠️  DATABASE_URL не задан — данные пишутся в data.json (только для теста)'); },
    async get(id) { return data.users[id] ? JSON.parse(JSON.stringify(data.users[id])) : null; },
    async put(u) { data.users[u.id] = JSON.parse(JSON.stringify(u)); flush(); },
    async top(n) { return Object.values(data.users).sort((a, b) => b.per_sec - a.per_sec).slice(0, n).map(u => ({ id: +u.id, name: u.name, ps: u.per_sec })); },
    async rank(ps) { return Object.values(data.users).filter(u => u.per_sec > ps).length + 1; },
    async friends(id) { return Object.values(data.users).filter(u => u.ref_by === id).map(u => ({ name: u.name, ps: u.per_sec })); },
    async addPayment(p) { if (data.payments[p.charge]) return false; data.payments[p.charge] = { ...p, user_id: p.user }; flush(); return true; },
    async getPayment(c) { return data.payments[c] || null; },
    async markRefunded(c) { if (data.payments[c]) data.payments[c].refunded = true; flush(); },
    async stats() { const pays = Object.values(data.payments).filter(p => !p.refunded); return { users: Object.keys(data.users).length, day: Object.keys(data.users).length, payments: pays.length, stars: pays.reduce((a, p) => a + (p.stars || 0), 0) }; },
  };
}

// очередь на каждого игрока, чтобы два запроса не перезаписали друг друга
const locks = new Map();
function withUser(id, fn) {
  const prev = locks.get(id) || Promise.resolve();
  const p = prev.then(() => fn());
  const tail = p.catch(() => {});
  locks.set(id, tail);
  tail.then(() => { if (locks.get(id) === tail) locks.delete(id); });
  return p;
}
const rnd = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;
// игроку не отправляем, где лежат мины, пока игра идёт
const pub = S => {
  let o = S;
  if (S.mn && S.mn.active) o = { ...o, mn: { ...S.mn, pos: undefined } };          // где мины
  if (S.cr && S.cr.active) o = { ...o, cr: { ...S.cr, crash: undefined } };       // когда взорвётся ракета
  return o;
};
const nameOf = u => (u.username ? '@' + u.username : [u.first_name, u.last_name].filter(Boolean).join(' ')) || 'Игрок';
const parseRef = s => { const m = /^r(\d{1,15})$/.exec(String(s || '')); return m ? Number(m[1]) : 0; };

async function saveUser(u) { u.per_sec = Core.perSec(u.state); await db.put(u); }

// загрузить игрока (или создать нового, с учётом пригласившего)
async function loadUser(tgUser, startParam) {
  const now = Date.now();
  let u = await db.get(tgUser.id);
  if (!u) {
    u = { id: tgUser.id, name: nameOf(tgUser), state: Core.fresh(now), ref_by: null };
    const ref = parseRef(startParam);
    if (ref && ref !== tgUser.id && await db.get(ref)) {
      u.ref_by = ref; u.state.coins += Core.REF.newbie;
      await withUser(ref, async () => {
        const inv = await db.get(ref); if (!inv) return;
        Core.normalize(inv.state, now); Core.idle(inv.state, now); Core.refBonus(inv.state); await saveUser(inv);
      });
      tg('sendMessage', { chat_id: ref, text: `🎉 ${u.name} пришёл в игру по твоей ссылке! Тебе +${Core.REF.inviter.toLocaleString('ru-RU')} монет и обычное яйцо.` }).catch(() => {});
    }
    await saveUser(u);
  } else {
    u.name = nameOf(tgUser);
  }
  u.id = Number(u.id);
  Core.normalize(u.state, now);
  return u;
}

// ================= ПРОВЕРКА ВХОДА ЧЕРЕЗ TELEGRAM =================
function checkInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash'); if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > 7 * 86400) return null;   // старше недели — не принимаем
  try { return { user: JSON.parse(params.get('user')), start: params.get('start_param') || '' }; } catch (e) { return null; }
}
function auth(req) {
  if (DEV && req.get('x-dev-user')) return { user: { id: Number(req.get('x-dev-user')), first_name: 'Тест ' + req.get('x-dev-user') }, start: req.get('x-dev-start') || '' };
  const a = checkInitData(req.get('x-init-data'));
  return a && a.user && a.user.id ? a : null;
}

// ================= TELEGRAM BOT API =================
async function tg(method, body) {
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN не задан');
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  const j = await r.json(); if (!j.ok) throw new Error(`${method}: ${j.description}`); return j.result;
}
const playMarkup = () => ({ inline_keyboard: [[{ text: '🐾 Играть', web_app: { url: WEBAPP_URL } }]] });

async function onUpdate(up) {
  // перед оплатой Telegram спрашивает: можно продавать? Отвечаем за 10 секунд.
  if (up.pre_checkout_query) {
    const q = up.pre_checkout_query; let ok = false, err = 'Товар недоступен';
    try {
      const pl = JSON.parse(q.invoice_payload), pr = Core.PRODUCTS.find(x => x.id === pl.p);
      if (pr && pl.u === q.from.id && q.total_amount === pr.stars && q.currency === 'XTR') {
        ok = true;
        if (pr.once) { const u = await db.get(q.from.id); if (u && u.state.bought && u.state.bought[pr.id]) { ok = false; err = 'Этот набор уже куплен'; } }
      }
    } catch (e) {}
    await tg('answerPreCheckoutQuery', ok ? { pre_checkout_query_id: q.id, ok: true } : { pre_checkout_query_id: q.id, ok: false, error_message: err });
    return;
  }
  const m = up.message; if (!m) return;
  // успешная оплата — выдаём товар (один раз на каждый платёж)
  if (m.successful_payment) {
    const sp = m.successful_payment, pl = JSON.parse(sp.invoice_payload), uid = m.from.id;
    const fresh = await db.addPayment({ charge: sp.telegram_payment_charge_id, user: uid, product: pl.p, stars: sp.total_amount });
    if (!fresh) return;
    let pr;
    await withUser(uid, async () => { const u = await loadUser(m.from, ''); Core.idle(u.state, Date.now()); pr = Core.grant(u.state, pl.p, Date.now()); await saveUser(u); });
    await tg('sendMessage', { chat_id: m.chat.id, text: `✅ Спасибо за покупку! «${pr.title}» уже в игре.`, reply_markup: playMarkup() });
    return;
  }
  const text = m.text || '';
  if (text.startsWith('/start')) {
    const payload = text.split(' ')[1] || '';
    await withUser(m.from.id, () => loadUser(m.from, payload));
    await tg('sendMessage', { chat_id: m.chat.id, parse_mode: 'HTML', reply_markup: playMarkup(),
      text: `Привет, ${m.from.first_name || 'друг'}! 🐱🐶\n\n<b>Grow a Pet</b> — собирай зверей:\n👆 Тапай и зарабатывай монеты\n🐾 Звери приносят доход каждую секунду\n🥚 Открывай яйца — выбивай редких, золотых и радужных\n🎰 Рискни в апгрейдере\n👥 Зови друзей — получай награды\n\nЖми кнопку 👇` });
  } else if (text.startsWith('/paysupport')) {
    await tg('sendMessage', { chat_id: m.chat.id, text: `Если с покупкой что-то не так — напиши ${SUPPORT || 'администратору бота'} и приложи номер платежа из чека. Мы разберёмся и при необходимости вернём звёзды.` });
  } else if (text.startsWith('/refund') && String(m.from.id) === String(ADMIN_ID)) {
    const charge = text.split(' ')[1]; const p = charge && await db.getPayment(charge);
    if (!p) return tg('sendMessage', { chat_id: m.chat.id, text: 'Платёж не найден. Формат: /refund <id платежа>' });
    if (p.refunded) return tg('sendMessage', { chat_id: m.chat.id, text: 'Уже возвращён.' });
    await tg('refundStarPayment', { user_id: Number(p.user_id), telegram_payment_charge_id: charge });
    await db.markRefunded(charge);
    await tg('sendMessage', { chat_id: m.chat.id, text: '✅ Звёзды возвращены.' });
  } else {
    await tg('sendMessage', { chat_id: m.chat.id, text: 'Открой игру кнопкой 👇', reply_markup: playMarkup() });
  }
}

// ================= HTTP =================
const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', setHeaders: (res, p) => { if (p.endsWith('.html') || p.endsWith('core.js')) res.setHeader('Cache-Control', 'no-cache'); } }));
app.get('/health', (req, res) => res.send('ok'));

const api = (fn) => async (req, res) => {
  const a = auth(req); if (!a) return res.status(401).json({ error: 'Открой игру через Telegram' });
  try { res.json({ ...(await fn(a, req.body || {})), now: Date.now() }); }
  catch (e) { res.status(400).json({ error: e.message || 'Ошибка' }); }
};

app.post('/api/state', api(async (a, b) => withUser(a.user.id, async () => {
  const u = await loadUser(a.user, a.start), S = u.state, now = Date.now();
  if (S.tz == null && Number.isFinite(b.tz)) S.tz = Math.max(-720, Math.min(840, Math.round(b.tz)));
  const off = Core.idle(S, now);
  const offline = off && off.secs >= 60 ? off.earned : 0;
  if (offline) S.offBonus = offline;
  await saveUser(u);
  return { state: pub(S), offline, me: { id: u.id, name: u.name, admin: isAdmin(u.id) }, config: { ads: ADSGRAM_BLOCK_ID, bot: BOT_USERNAME } };
})));

app.post('/api/act', api(async (a, b) => withUser(a.user.id, async () => {
  const u = await loadUser(a.user, a.start), S = u.state, now = Date.now();
  if (b.a === 'ad' && !ADSGRAM_BLOCK_ID) throw new Error('Реклама выключена');
  Core.idle(S, now);
  const r = Core.luckyAct(S, b.a, b, now, rnd);
  await saveUser(u);
  return { state: pub(S), r };
})));

app.post('/api/invoice', api(async (a, b) => {
  const pr = Core.PRODUCTS.find(x => x.id === b.pid); if (!pr) throw new Error('Нет такого товара');
  if (pr.once) { const u = await db.get(a.user.id); if (u && u.state.bought && u.state.bought[pr.id]) throw new Error('Этот набор уже куплен'); }
  const payload = JSON.stringify({ u: a.user.id, p: pr.id, n: crypto.randomBytes(4).toString('hex') });
  const link = await tg('createInvoiceLink', { title: pr.title, description: pr.desc, payload, currency: 'XTR', prices: [{ label: pr.title, amount: pr.stars }] });
  return { link };
}));

app.post('/api/top', api(async (a) => {
  const top = await db.top(50); const u = await db.get(a.user.id);
  const ps = u ? Core.perSec(Core.normalize(u.state, Date.now())) : 0;
  return { top: top.map(t => ({ name: t.name, ps: t.ps, me: t.id === a.user.id })), rank: await db.rank(ps), ps };
}));

// ================= АДМИНКА (только для ADMIN_ID) =================
const isAdmin = id => (ADMIN_ID && String(id) === String(ADMIN_ID)) || (DEV && String(id) === String(process.env.DEV_ADMIN || ''));
app.post('/api/admin', api(async (a, b) => {
  if (!isAdmin(a.user.id)) throw new Error('Нет доступа');
  if (b.op === 'stats') return { stats: await db.stats(), top: await db.top(10) };
  const uid = Number(b.uid || a.user.id); if (!uid) throw new Error('Нужен ID игрока');
  return withUser(uid, async () => {
    const u = await db.get(uid); if (!u) throw new Error('Игрок не найден — он должен хоть раз открыть игру');
    u.id = Number(u.id); const S = Core.normalize(u.state, Date.now()); Core.idle(S, Date.now());
    const num = (x, min = 0) => { x = Math.floor(Number(x)); if (!Number.isFinite(x) || x < min) throw new Error('Неверное число'); return x; };
    let msg = '';
    if (b.op === 'coins') { const n = num(Math.abs(b.n)) * Math.sign(b.n || 0); S.coins = Math.max(0, S.coins + n); msg = `Монеты: ${n > 0 ? '+' : ''}${n}`; }
    else if (b.op === 'setCoins') { S.coins = num(b.n); msg = `Баланс = ${S.coins}`; }
    else if (b.op === 'pet') { if (!Core.validKey(b.k)) throw new Error('Нет такого пета'); const n = num(b.n || 1, 1); for (let i = 0; i < Math.min(n, 100); i++) Core.addPet(S, b.k); msg = `Пет ${b.k} x${n}`; }
    else if (b.op === 'ticket') { if (!Core.EGGS.find(e => e.id === b.egg)) throw new Error('Нет такого яйца'); S.tickets[b.egg] = (S.tickets[b.egg] || 0) + num(b.n || 1, 1); msg = `Билеты ${b.egg}`; }
    else if (b.op === 'luck') { S.luck = Math.max(0, Math.min(1, Number(b.v) || 0)); msg = `Удача ${Math.round(S.luck * 100)}%`; }
    else if (b.op === 'energy') { S.energy = Core.maxEnergy(S); msg = 'Энергия полная'; }
    else if (b.op === 'reset') { u.state = Core.fresh(Date.now()); msg = 'Прогресс сброшен'; }
    else if (b.op !== 'get') throw new Error('Неизвестная команда');
    await saveUser(u);
    const T = u.state;
    return { msg, user: { id: u.id, name: u.name, coins: T.coins, ps: Core.perSec(T), pets: Object.keys(T.pets).length, luck: T.luck || 0, refs: T.refs || 0 }, state: uid === a.user.id ? pub(T) : undefined };
  });
}));

app.post('/api/friends', api(async (a) => ({ list: await db.friends(a.user.id), bot: BOT_USERNAME, id: a.user.id })));

app.post('/tg/' + HOOK_SECRET, (req, res) => {
  if (req.get('x-telegram-bot-api-secret-token') !== HOOK_SECRET) return res.sendStatus(403);
  res.sendStatus(200);
  onUpdate(req.body).catch(e => console.error('update error:', e.message));
});

// ================= ЗАПУСК =================
(async () => {
  await db.init();
  app.listen(PORT, () => console.log('Grow a Pet запущен на порту', PORT));
  if (BOT_TOKEN && WEBAPP_URL) {
    try {
      const me = await tg('getMe'); BOT_USERNAME = me.username;
      await tg('setWebhook', { url: `${WEBAPP_URL}/tg/${HOOK_SECRET}`, secret_token: HOOK_SECRET, allowed_updates: ['message', 'pre_checkout_query'] });
      await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Играть', web_app: { url: WEBAPP_URL } } });
      await tg('setMyCommands', { commands: [{ command: 'start', description: 'Открыть игру' }, { command: 'paysupport', description: 'Помощь с покупками' }] });
      console.log('Бот @' + BOT_USERNAME + ' подключён');
    } catch (e) { console.error('Не удалось настроить бота:', e.message); }
  } else console.warn('⚠️  BOT_TOKEN или WEBAPP_URL не заданы — бот не подключён');
})();

module.exports = { checkInitData };
