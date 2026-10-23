import { createEngine } from './combine.js';
import { t, getLang, setLang, applyStatic } from './i18n.js';
import { createAchievements, FAST_MEGA } from './achievements.js';

const SAVE_KEY = 'digicraft-v1';
const LEVEL_NAMES = ['Baby I', 'Baby II', 'Child (Rookie)', 'Adult (Champion)', 'Perfect (Ultimate)', 'Ultimate (Mega)'];

const $ = (s) => document.querySelector(s);
const board = $('#board'), itemsEl = $('#items');

const game = await (await fetch('data/game.json')).json();
const engine = createEngine(game);
const achievements = createAchievements(game);
const D = game.d;
const N = D.length;
let info = null; // data/info.json, carregado sob demanda

const img = (i) => `img/${D[i].i}.png`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Estado ----------
let state = load();
function fresh() {
  return { disc: game.base.map((b) => [b, -1, -1]), target: null, ach: [], stats: { combos: 0, jogress: 0, fastMega: false } };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && Array.isArray(s.disc)) {
      const f = fresh();
      return { ...f, ...s, stats: { ...f.stats, ...s.stats } };
    }
  } catch {}
  return fresh();
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}
let discovered = new Map(state.disc.map(([i, a, b], k) => [i, { a, b, k }]));
const isNew = new Set(); // destaque "Nova" nesta sessão

// ---------- Barra lateral ----------
function chipHTML(i, extra = '') {
  return `<img src="${img(i)}" alt="" loading="lazy" draggable="false"><span>${esc(D[i].n)}</span>${extra}`;
}

function renderItems() {
  const q = $('#search').value.trim().toLowerCase();
  const sort = $('#sort').value;
  let list = [...discovered.keys()];
  if (q) list = list.filter((i) => D[i].n.toLowerCase().includes(q));
  if (sort === 'name') list.sort((a, b) => D[a].n.localeCompare(D[b].n));
  else if (sort === 'level') list.sort((a, b) => engine.levelOf[a] - engine.levelOf[b] || D[a].n.localeCompare(D[b].n));
  else list.sort((a, b) => discovered.get(a).k - discovered.get(b).k);
  itemsEl.innerHTML = list.length
    ? list.map((i) => `<div class="chip" data-id="${i}">${chipHTML(i, isNew.has(i) ? `<span class="new-badge">${t('newBadge')}</span>` : '')}</div>`).join('')
    : `<div class="empty">${t('nothing')}</div>`;
  renderProgress();
}

function renderProgress() {
  const n = discovered.size;
  $('#progress-text').textContent = t('progress', { n, total: N });
  $('#progress-fill').style.width = `${(100 * n) / N}%`;
}

$('#search').addEventListener('input', renderItems);
$('#sort').addEventListener('change', renderItems);

// ---------- Área de jogo ----------
function spawn(i, x, y, cls = '') {
  const el = document.createElement('div');
  el.className = `chip inst ${cls}`;
  el.dataset.id = i;
  el.innerHTML = chipHTML(i);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  board.appendChild(el);
  return el;
}

function boardPoint(e) {
  const r = board.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
}

let drag = null;

function beginDrag(el, e, offX, offY) {
  el.classList.add('dragging');
  el.classList.remove('fresh', 'pop');
  try { el.setPointerCapture?.(e.pointerId); } catch {} // o dedo pode já ter saído
  drag = { el, offX, offY, moved: false, sx: e.clientX, sy: e.clientY };
}

function dragFromSide(chip, e) {
  const i = Number(chip.dataset.id);
  const r = chip.getBoundingClientRect();
  const p = boardPoint(e);
  const offX = e.clientX - r.left, offY = e.clientY - r.top;
  const el = spawn(i, p.x - offX, p.y - offY);
  beginDrag(el, e, offX, offY);
  drag.fromSide = true;
}

// Coloca um Digimon num ponto livre da área de jogo (toque / clique simples na lista)
function placeFree(i) {
  const r = board.getBoundingClientRect();
  const others = [...board.querySelectorAll('.inst')].map((o) => [o.offsetLeft, o.offsetTop]);
  let best = null, bestD = -1;
  for (let k = 0; k < 24; k++) {
    const x = 12 + Math.random() * Math.max(10, r.width - 150);
    const y = 70 + Math.random() * Math.max(10, r.height - 150);
    const d = Math.min(Infinity, ...others.map(([ox, oy]) => Math.hypot(ox - x, oy - y)));
    if (d > bestD) { bestD = d; best = [x, y]; }
    if (d > 140) break;
  }
  return spawn(i, best[0], best[1], 'pop');
}

// Na lista: mouse arrasta direto; no toque, deslizar rola a lista,
// tocar coloca na área de jogo e segurar (long press) começa a arrastar.
let pending = null;
itemsEl.addEventListener('pointerdown', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || e.button > 0) return;
  if (e.pointerType === 'mouse') { e.preventDefault(); dragFromSide(chip, e); return; }
  pending = { chip, id: e.pointerId, sx: e.clientX, sy: e.clientY };
  pending.timer = setTimeout(() => {
    if (!pending) return;
    navigator.vibrate?.(15);
    dragFromSide(chip, e);
    pending = null;
  }, 260);
});
itemsEl.addEventListener('pointermove', (e) => {
  if (pending && Math.hypot(e.clientX - pending.sx, e.clientY - pending.sy) > 8) { clearTimeout(pending.timer); pending = null; }
});
itemsEl.addEventListener('pointerup', () => {
  if (!pending) return;
  clearTimeout(pending.timer);
  placeFree(Number(pending.chip.dataset.id));
  pending = null;
});
itemsEl.addEventListener('pointercancel', () => { if (pending) { clearTimeout(pending.timer); pending = null; } });
// enquanto arrasta a partir da lista, impede a rolagem
itemsEl.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });
itemsEl.addEventListener('contextmenu', (e) => e.preventDefault());

let lastTap = { el: null, t: 0 };
board.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.inst');
  if (!el || e.button > 0) return;
  e.preventDefault();
  const r = el.getBoundingClientRect();
  beginDrag(el, e, e.clientX - r.left, e.clientY - r.top);
});

function duplicate(el) {
  spawn(Number(el.dataset.id), el.offsetLeft + 14, el.offsetTop + 14, 'pop');
}
board.addEventListener('dblclick', (e) => {
  const el = e.target.closest('.inst');
  if (el) duplicate(el);
});

board.addEventListener('contextmenu', (e) => {
  const el = e.target.closest('.inst');
  if (!el) return;
  e.preventDefault();
  if (lastPointerType === 'mouse') el.remove();
});
let lastPointerType = 'mouse';
window.addEventListener('pointerdown', (e) => { lastPointerType = e.pointerType; }, true);

function overlapTarget(el) {
  const a = el.getBoundingClientRect();
  const ac = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  let best = null, bestD = Infinity;
  for (const o of board.querySelectorAll('.inst')) {
    if (o === el || o.classList.contains('loading')) continue;
    const b = o.getBoundingClientRect();
    if (a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom) continue;
    const d = Math.hypot(b.left + b.width / 2 - ac.x, b.top + b.height / 2 - ac.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

let hoverEl = null;
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = boardPoint(e);
  drag.el.style.left = `${p.x - drag.offX}px`;
  drag.el.style.top = `${p.y - drag.offY}px`;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
  const t = overlapTarget(drag.el);
  if (t !== hoverEl) { hoverEl?.classList.remove('over'); t?.classList.add('over'); hoverEl = t; }
});

window.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const { el, fromSide, moved } = drag;
  drag = null;
  el.classList.remove('dragging');
  hoverEl?.classList.remove('over');
  hoverEl = null;
  // clique/toque sem arrastar
  if (!moved) {
    if (fromSide) { el.remove(); placeFree(Number(el.dataset.id)); return; }
    // toque duplo em um Digimon da área de jogo duplica (no mouse, o dblclick já cuida)
    if (e.pointerType !== 'mouse') {
      const now = performance.now();
      if (lastTap.el === el && now - lastTap.t < 320) { duplicate(el); lastTap = { el: null, t: 0 }; }
      else lastTap = { el, t: now };
    }
    return;
  }
  const p = boardPoint(e);
  if (!p.inside) { el.remove(); return; }
  const target = overlapTarget(el);
  if (target) merge(el, target);
});
window.addEventListener('pointercancel', () => {
  if (!drag) return;
  drag.el.classList.remove('dragging');
  if (drag.fromSide) drag.el.remove();
  drag = null;
});

function merge(a, b) {
  const ia = Number(a.dataset.id), ib = Number(b.dataset.id);
  const res = engine.combine(ia, ib);
  if (!res) { shake(a); return; }
  const x = (a.offsetLeft + b.offsetLeft) / 2, y = (a.offsetTop + b.offsetTop) / 2;
  const jog = res.reason === 'jogress';
  const finish = () => {
    a.remove(); b.remove();
    const isFirst = !discovered.has(res.id);
    spawn(res.id, x, y, `pop ${isFirst ? 'fresh' : ''} ${jog ? 'jogress-glow' : ''}`);
    state.stats.combos++;
    if (jog) state.stats.jogress++;
    if (achievements.isUltimate(res.id) && state.stats.combos <= FAST_MEGA) state.stats.fastMega = true;
    if (isFirst) discover(res.id, ia, ib, res.reason);
    else save();
    checkAchievements(true);
  };
  if (!jog) { finish(); return; }
  // Jogress: os dois parceiros giram em direção ao centro antes da fusão
  a.classList.add('loading'); b.classList.add('loading');
  for (const el of [a, b]) {
    el.animate([
      { transform: 'translate(0, 0) rotate(0) scale(1)' },
      { transform: `translate(${x - el.offsetLeft}px, ${y - el.offsetTop}px) rotate(${el === a ? 200 : -200}deg) scale(.5)`, opacity: 0.2 },
    ], { duration: 420, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
  }
  setTimeout(() => {
    jogressFx(x + a.offsetWidth / 2, y + a.offsetHeight / 2);
    finish();
  }, 420);
}

function jogressFx(cx, cy) {
  const fx = document.createElement('div');
  fx.className = 'jogress-fx';
  fx.style.left = `${cx}px`;
  fx.style.top = `${cy}px`;
  const sparks = Array.from({ length: 14 }, (_, k) => `<i class="spark" style="--a:${(k / 14) * 360}deg;--d:${70 + (k % 3) * 25}px"></i>`).join('');
  fx.innerHTML = `<span class="ring r1"></span><span class="ring r2"></span><span class="flash"></span>${sparks}<b class="jogress-text">${t('jogress')}</b>`;
  board.appendChild(fx);
  setTimeout(() => fx.remove(), 1300);
}

function shake(el) {
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 250 });
}

function discover(i, a, b, reason) {
  discovered.set(i, { a, b, k: state.disc.length });
  state.disc.push([i, a, b]);
  isNew.add(i);
  toast(`✨ <b>${esc(D[i].n)}</b><small>${esc(D[a].n)} + ${esc(D[b].n)} · ${t('reasons')[reason]}</small>`);
  if (state.target === i) {
    toast(t('goalReached', { name: esc(D[i].n) }), 'goal');
    state.target = null;
  }
  save();
  renderItems();
  renderTarget();
}

function toast(html, cls = '') {
  const t = document.createElement('div');
  t.className = `toast ${cls}`;
  t.innerHTML = html;
  $('#toasts').prepend(t);
  setTimeout(() => t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).onfinish = () => t.remove(), 3600);
  while ($('#toasts').children.length > 4) $('#toasts').lastChild.remove();
}

$('#btn-clear').addEventListener('click', () => board.querySelectorAll('.inst').forEach((el) => el.remove()));
$('#btn-reset').addEventListener('click', () => {
  if (!confirm(t('resetConfirm'))) return;
  state = fresh();
  discovered = new Map(state.disc.map(([i, a, b], k) => [i, { a, b, k }]));
  isNew.clear();
  save();
  renderAchCount();
  board.querySelectorAll('.inst').forEach((el) => el.remove());
  renderItems();
  renderTarget();
  placeStarters();
});

// ---------- Objetivo ----------
function renderTarget() {
  const tg = state.target;
  $('#target').hidden = tg === null;
  if (tg === null) return;
  $('#target-img').src = img(tg);
  $('#target-img').classList.toggle('silhouette', !discovered.has(tg));
  $('#target-name').textContent = D[tg].n;
}

function setTarget(i) {
  state.target = i;
  save();
  renderTarget();
}

$('#target-close').addEventListener('click', () => setTarget(null));

// ---------- Digidex ----------
const dex = $('#dex'), detail = $('#detail');
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('.modal').hidden = true));
document.querySelectorAll('.modal').forEach((m) => m.addEventListener('pointerdown', (e) => { if (e.target === m) m.hidden = true; }));
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!detail.hidden) detail.hidden = true;
  else { dex.hidden = true; achModal.hidden = true; }
});

function renderLevelOptions() {
  const sel = $('#dex-level'), v = sel.value;
  sel.innerHTML = `<option value="">${t('allLevels')}</option>`
    + LEVEL_NAMES.map((l, k) => `<option value="${k}">${l}</option>`).join('')
    + `<option value="-1">${t('unknownLevel')}</option>`;
  sel.value = v;
}

function renderDex() {
  const q = $('#dex-search').value.trim().toLowerCase();
  const f = $('#dex-filter').value;
  const lv = $('#dex-level').value;
  const cells = [];
  for (let i = 0; i < N; i++) {
    const found = discovered.has(i);
    if (f === 'found' && !found) continue;
    if (f === 'missing' && found) continue;
    if (lv !== '' && D[i].l !== Number(lv)) continue;
    if (q && !D[i].n.toLowerCase().includes(q)) continue;
    cells.push(`<div class="cell ${found ? '' : 'missing'} ${state.target === i ? 'is-target' : ''}" data-id="${i}">
      <span class="cell-no">#${D[i].i}</span>
      <img src="${img(i)}" alt="" loading="lazy" draggable="false">
      <div class="cell-name">${found || q ? esc(D[i].n) : '???'}</div></div>`);
  }
  $('#dex-grid').innerHTML = cells.join('') || `<div class="empty">${t('noDigimon')}</div>`;
  $('#dex-count').textContent = `${discovered.size} / ${N}`;
}
['input', 'change'].forEach((ev) => ['#dex-search', '#dex-filter', '#dex-level'].forEach((s) => $(s).addEventListener(ev, renderDex)));
$('#btn-dex').addEventListener('click', () => { dex.hidden = false; renderDex(); $('#dex-search').focus(); });
$('#dex-grid').addEventListener('click', (e) => {
  const c = e.target.closest('.cell');
  if (c) showDetail(Number(c.dataset.id));
});

async function showDetail(i) {
  info ??= await (await fetch('data/info.json')).json();
  const x = info[i], found = discovered.has(i), rec = discovered.get(i);
  const tags = (arr, cls) => arr.map((v) => `<span class="tag ${cls}">${esc(v)}</span>`).join('');
  let recipe = '';
  if (found && rec.a >= 0) {
    recipe = `<div class="recipe">${t('discoveredWith')} <span class="chip">${chipHTML(rec.a)}</span> + <span class="chip">${chipHTML(rec.b)}</span></div>`;
  } else {
    recipe = `<div class="recipe">${t(found ? 'starter' : 'notFound')}</div>`;
  }
  $('#detail-body').innerHTML = `
    <div class="detail-top">
      <img src="${img(i)}" alt="" class="${found ? '' : 'silhouette'}">
      <div>
        <h3>${esc(D[i].n)}</h3>
        <div class="tags">${tags(x.levels, 'lv')}${tags(x.attrs, 'at')}</div>
        <div class="tags">${tags(x.types, '')}</div>
        <div class="tags">${tags(x.fields, '')}</div>
        ${x.year ? `<div class="hint">${t('release', { year: esc(x.year) })}</div>` : ''}
      </div>
    </div>
    ${found && x.desc ? `<p class="desc">${esc(x.desc)}</p>` : ''}
    ${recipe}
    <div class="detail-actions">
      ${found
        ? `<button class="btn primary" data-act="place">${t('place')}</button>`
        : `<button class="btn primary" data-act="target">${t(state.target === i ? 'isTarget' : 'setTarget')}</button>`}
    </div>`;
  detail.hidden = false;
  detail.querySelector('[data-act]').onclick = (e) => {
    if (e.target.dataset.act === 'target') setTarget(i);
    else {
      const r = board.getBoundingClientRect();
      spawn(i, r.width / 2 - 60, r.height / 2 - 20, 'pop');
    }
    detail.hidden = true;
    dex.hidden = true;
  };
}

// ---------- Início ----------
function placeStarters() {
  const r = board.getBoundingClientRect();
  const cx = r.width / 2, cy = r.height / 2, rad = Math.min(r.width, r.height) * 0.28;
  game.base.forEach((b, k) => {
    const ang = (k / game.base.length) * Math.PI * 2 - Math.PI / 2;
    spawn(b, cx + Math.cos(ang) * rad - 55, cy + Math.sin(ang) * rad - 18, 'pop');
  });
}

// ---------- Conquistas ----------
const achModal = $('#ach');
const achCtx = () => ({ disc: discovered, stats: state.stats });

function checkAchievements(notify) {
  const ctx = achCtx(), L = getLang();
  let changed = false;
  for (const a of achievements.list) {
    if (state.ach.includes(a.id)) continue;
    const [have, need] = a.progress(ctx);
    if (have < need) continue;
    state.ach.push(a.id);
    changed = true;
    if (notify) toast(`${a.icon} ${t('achUnlocked', { name: esc(a.name[L]) })}<small>${esc(a.desc[L])}</small>`, 'ach');
  }
  if (!changed) return;
  save();
  renderAchCount();
  if (!achModal.hidden) renderAch();
}

function renderAchCount() {
  $('#ach-count').textContent = `${state.ach.length}/${achievements.list.length}`;
}

function renderAch() {
  const ctx = achCtx(), L = getLang();
  $('#ach-total').textContent = `${state.ach.length} / ${achievements.list.length}`;
  $('#ach-grid').innerHTML = achievements.list.map((a) => {
    const done = state.ach.includes(a.id);
    const [have, need] = a.progress(ctx);
    const pct = done ? 100 : Math.round((100 * have) / need);
    const faces = a.req && a.req.length <= 13
      ? `<div class="ach-faces">${a.req.map((i) => {
        const f = discovered.has(i);
        return `<span class="face" data-name="${esc(D[i].n)}" tabindex="0"><img src="${img(i)}" alt="${esc(D[i].n)}" class="${f ? '' : 'silhouette'}" loading="lazy" draggable="false"></span>`;
      }).join('')}</div>`
      : '';
    return `<div class="ach-card ${done ? 'done' : ''}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-body">
        <div class="ach-name">${esc(a.name[L])}</div>
        <div class="ach-desc">${esc(a.desc[L])}</div>
        ${faces}
        <div class="ach-bar"><div style="width:${pct}%"></div></div>
        <div class="ach-prog">${done ? '✔' : `${have} / ${need}`}</div>
      </div></div>`;
  }).join('');
}
$('#btn-ach').addEventListener('click', () => { achModal.hidden = false; renderAch(); });
// No celular não existe hover: tocar na fotinho mostra o nome por alguns segundos
let faceTimer = null;
$('#ach-grid').addEventListener('click', (e) => {
  const face = e.target.closest('.face');
  document.querySelectorAll('.face.show').forEach((f) => { if (f !== face) f.classList.remove('show'); });
  if (!face) return;
  face.classList.toggle('show');
  clearTimeout(faceTimer);
  faceTimer = setTimeout(() => face.classList.remove('show'), 2500);
});

// ---------- Idioma ----------
function applyLang() {
  applyStatic();
  renderLevelOptions();
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('primary', b.dataset.lang === getLang()));
  renderItems();
  renderAchCount();
  if (!dex.hidden) renderDex();
  if (!achModal.hidden) renderAch();
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
  setLang(b.dataset.lang);
  applyLang();
  detail.hidden = true;
}));

checkAchievements(false);
applyLang();
renderTarget();
placeStarters();
