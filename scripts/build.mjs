// Monta o grafo a partir de data/raw, calcula a alcançabilidade a partir dos
// 8 Digimon de Adventure e gera receitas especiais para quem ficar de fora.
// Saída: data/game.json, data/info.json, data/report.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine, LEVEL_ORDER, REASONS } from '../src/combine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const BASE_NAMES = ['Agumon', 'Gabumon', 'Piyomon', 'Tentomon', 'Palmon', 'Gomamon', 'Patamon', 'Tailmon'];
const IGNORED = new Set(['Unknown', 'No Data']);

const raw = fs.readdirSync(RAW).map((f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8')))
  .sort((a, b) => a.id - b.id);
const idx = new Map(raw.map((d, i) => [d.id, i]));

function dict() {
  const list = [], map = new Map();
  return { list, id(v) { if (!map.has(v)) { map.set(v, list.length); list.push(v); } return map.get(v); } };
}
const attrs = dict(), types = dict(), fields = dict();
const clean = (arr, key) => arr.map((x) => x[key]).filter((v) => v && !IGNORED.has(v));
const uniq = (arr) => [...new Set(arr)];

const d = raw.map((r) => {
  const lv = r.levels.map((l) => LEVEL_ORDER[l.level]).filter((v) => v !== undefined);
  return {
    i: r.id,
    n: r.name,
    l: lv.length ? Math.max(...lv) : -1,
    a: uniq(clean(r.attributes, 'attribute').map(attrs.id)),
    t: uniq(clean(r.types, 'type').map(types.id)),
    f: uniq(clean(r.fields, 'field').map(fields.id)),
    p: uniq(r.priorEvolutions.map((e) => idx.get(e.id)).filter((v) => v !== undefined && v !== idx.get(r.id))),
    x: uniq(r.nextEvolutions.map((e) => idx.get(e.id)).filter((v) => v !== undefined && v !== idx.get(r.id))),
  };
});
// Garante simetria das arestas de evolução
d.forEach((node, i) => {
  node.p.forEach((p) => { if (!d[p].x.includes(i)) d[p].x.push(i); });
  node.x.forEach((x) => { if (!d[x].p.includes(i)) d[x].p.push(i); });
});


const CANON_LINES = [
  ['Agumon', 'Greymon', 'Metal Greymon', 'War Greymon'],
  ['Gabumon', 'Garurumon', 'Were Garurumon', 'Metal Garurumon'],
  ['Piyomon', 'Birdramon', 'Garudamon', 'Hououmon'],
  ['Tentomon', 'Kabuterimon', 'Atlur Kabuterimon (Red)', 'Herakle Kabuterimon'],
  ['Palmon', 'Togemon', 'Lilimon', 'Rosemon'],
  ['Gomamon', 'Ikkakumon', 'Zudomon', 'Vikemon'],
  ['Patamon', 'Angemon', 'Holy Angemon', 'Seraphimon'],
  ['Tailmon', 'Angewomon', 'Holydramon'],
  // Tamers (a terra do Culumon)
  ['Guilmon', 'Growmon', 'Megalo Growmon', 'Dukemon'],
  ['Terriermon', 'Galgomon', 'Rapidmon Perfect', 'Saint Galgomon'],
  ['Renamon', 'Kyubimon', 'Taomon', 'Sakuyamon'],
];
const CANON_JOGRESS = [['War Greymon', 'Metal Garurumon', 'Omegamon']];
const byName = (name) => {
  const i = d.findIndex((x) => x.n === name);
  if (i < 0) throw new Error(`Digimon não encontrado: ${name}`);
  return i;
};
const pk = (a, b) => (a < b ? a * 8192 + b : b * 8192 + a);
const canon = {};
for (const line of CANON_LINES) for (let k = 0; k + 1 < line.length; k++) {
  const a = byName(line[k]);
  canon[pk(a, a)] = [byName(line[k + 1]), 'same'];
}
for (const [a, b, c] of CANON_JOGRESS) canon[pk(byName(a), byName(b))] = [byName(c), 'jogress'];

// Jogress: só as receitas da Wikimon (data/jogress.json, gerado por scripts/jogress.mjs).
// Quando um par tem resultados diferentes entre jogos, vale o mais citado (empate: o primeiro).
const jogress = {};
{
  const file = path.join(ROOT, 'data', 'jogress.json');
  const votes = new Map();
  for (const [a, b, c] of fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).recipes : []) {
    const k = pk(byName(a), byName(b));
    if (!votes.has(k)) votes.set(k, new Map());
    const v = votes.get(k);
    v.set(c, (v.get(c) || 0) + 1);
  }
  for (const [k, v] of votes) jogress[k] = byName([...v].sort((x, y) => y[1] - x[1])[0][0]);
  console.log(`Jogress da Wikimon: ${votes.size} pares`);
}

// Digimon que "bugam" a evolução de quem for combinado com eles
const CATALYSTS = { Culumon: 'up', Apocalymon: 'down' };
const catalysts = Object.fromEntries(Object.entries(CATALYSTS).map(([name, mode]) => [byName(name), mode]));

const base = BASE_NAMES.map(byName);
const game = { attrs: attrs.list, types: types.list, fields: fields.list, d, base, canon, jogress, catalysts, overrides: {} };

// Fecho: aplica combine em todos os pares de descobertos até não surgir nada novo
function closure(engine) {
  const n = d.length;
  const reached = new Uint8Array(n), depth = new Int32Array(n).fill(-1);
  const recipe = new Array(n).fill(null), producers = new Int32Array(n);
  const list = [];
  for (const b of base) { reached[b] = 1; depth[b] = 0; list.push(b); }
  for (let qi = 0; qi < list.length; qi++) {
    const x = list[qi];
    for (let k = 0; k <= qi; k++) {
      const y = list[k];
      const r = engine.combine(x, y);
      if (!r) continue;
      producers[r.id]++;
      if (!reached[r.id]) {
        reached[r.id] = 1;
        depth[r.id] = Math.max(depth[x], depth[y]) + 1;
        recipe[r.id] = [x, y, r.reason];
        list.push(r.id);
      }
    }
  }
  return { reached, depth, recipe, producers, count: list.length, list };
}

let engine = createEngine(game);
let t0 = Date.now();
let res = closure(engine);
const natural = res.count;
console.log(`Alcançáveis só com as regras: ${natural}/${d.length} (${Date.now() - t0}ms)`);
const naturallyUnreached = d.map((_, i) => i).filter((i) => !res.reached[i]);

// Receitas especiais: para cada Digimon fora do fecho, escolhe um par de
// alcançáveis parecidos com ele, cujo resultado atual tenha outras receitas.
// Só substitui pares de afinidade fraca: evoluções, Jogress e pares entre os
// 8 iniciais ficam intactos.
const usedPairs = new Set();
function proposePair(c, state) {
  const reachedList = state.list;
  const prevs = d[c].p.filter((p) => state.reached[p]);
  const bySim = reachedList.map((x) => [x, engine.sim(c, x)]).sort((u, v) => v[1] - u[1] || u[0] - v[0]).map((u) => u[0]);
  const firsts = [...prevs, ...bySim.slice(0, 12)];
  for (const x of firsts) {
    for (const y of bySim.slice(0, 150)) {
      if (x === y || (base.includes(x) && base.includes(y))) continue;
      const key = engine.pairKey(x, y);
      if (usedPairs.has(key)) continue;
      const cur = engine.combine(x, y);
      if (cur && cur.reason !== 'kinship') continue;
      if (cur && state.producers[cur.id] < 3 && !base.includes(cur.id)) continue;
      return [x, y];
    }
  }
  return null;
}

let guard = 0;
while (res.count < d.length && guard++ < 200) {
  const missing = d.map((_, i) => i).filter((i) => !res.reached[i]);
  // prioriza quem tem evoluções anteriores já alcançadas e níveis baixos
  missing.sort((u, v) => (d[u].p.some((p) => res.reached[p]) ? 0 : 1) - (d[v].p.some((p) => res.reached[p]) ? 0 : 1) || engine.levelOf[u] - engine.levelOf[v]);
  const batch = missing.slice(0, Math.max(1, Math.ceil(missing.length / 4)));
  const added = [];
  for (const c of batch) {
    const pair = proposePair(c, res);
    if (!pair) continue;
    usedPairs.add(engine.pairKey(...pair));
    engine.setOverride(pair[0], pair[1], c);
    added.push([...pair, c]);
  }
  const next = closure(engine);
  const lost = res.list.filter((i) => !next.reached[i]);
  if (lost.length) {
    // desfaz overrides que roubaram o único caminho de alguém
    for (const [x, y] of added) engine.deleteOverride(x, y);
    for (const [x, y, c] of added) {
      engine.setOverride(x, y, c);
      const test = closure(engine);
      if (res.list.some((i) => !test.reached[i])) engine.deleteOverride(x, y);
      else { game.overrides[engine.pairKey(x, y)] = c; res = test; }
    }
  } else {
    for (const [x, y, c] of added) game.overrides[engine.pairKey(x, y)] = c;
    res = next;
  }
  console.log(`  +${added.length} receitas especiais -> ${res.count}/${d.length}`);
}

game.recipe = Array.from(res.recipe, (r) => (r ? [r[0], r[1]] : null));
game.depth = Array.from(res.depth);
fs.writeFileSync(path.join(ROOT, 'data', 'game.json'), JSON.stringify(game));

// Info extra (descrição, nível textual) carregada sob demanda pelo jogo
const info = raw.map((r) => ({
  levels: r.levels.map((l) => l.level),
  attrs: r.attributes.map((a) => a.attribute),
  types: r.types.map((t) => t.type),
  fields: r.fields.map((f) => f.field),
  year: r.releaseDate || '',
  desc: (r.descriptions.find((x) => x.language === 'en_us') || {}).description || '',
}));
fs.writeFileSync(path.join(ROOT, 'data', 'info.json'), JSON.stringify(info));

// Relatório
const reasonCount = {};
res.recipe.forEach((r) => { if (r) reasonCount[r[2]] = (reasonCount[r[2]] || 0) + 1; });
const maxDepth = Math.max(...res.depth);
const hist = Array.from({ length: maxDepth + 1 }, (_, k) => res.depth.filter((x) => x === k).length);
const edgeCount = d.reduce((s, x) => s + x.x.length, 0);
const report = `# Relatório do grafo Digi Craft

- Digimon (nós): **${d.length}**
- Arestas de evolução: **${edgeCount}**
- Atributos: ${attrs.list.length} · Tipos: ${types.list.length} · Campos: ${fields.list.length}
- Base: ${base.map((b) => d[b].n).join(', ')}

## Alcançabilidade

- Só com as regras do grafo: **${natural}/${d.length}** (${(100 * natural / d.length).toFixed(1)}%)
- Receitas especiais adicionadas: **${Object.keys(game.overrides).length}**
- Final: **${res.count}/${d.length}**
- Profundidade máxima (gerações de combinação): **${maxDepth}**

### Primeira descoberta de cada Digimon, por regra
${Object.entries(reasonCount).map(([k, v]) => `- ${REASONS[k] || k}: ${v}`).join('\n')}

### Digimon por profundidade
${hist.map((v, k) => `- ${k}: ${v}`).join('\n')}

### Inalcançáveis só com as regras (${naturallyUnreached.length})
${naturallyUnreached.map((i) => d[i].n).join(', ')}
`;
fs.writeFileSync(path.join(ROOT, 'data', 'report.md'), report);
console.log(report.split('### Digimon por')[0]);
