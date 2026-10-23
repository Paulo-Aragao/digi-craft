// Regras de combinação do Digi Craft. Módulo compartilhado entre o jogo (browser)
// e o script de build (Node), para que a análise de alcançabilidade use
// exatamente as mesmas regras que o jogador vai experimentar.
//
// O grafo: cada Digimon é um nó. As arestas vêm de
//   - evolução (priorEvolutions / nextEvolutions da digi-api)
//   - atributos, tipos e campos (fields) compartilhados
//   - nível (estágio de evolução)
// combine(a, b) escolhe deterministicamente um vizinho comum aos dois.

export const LEVEL_ORDER = {
  'Baby I': 0, 'Baby II': 1, 'Child': 2, 'Adult': 3, 'Armor': 3, 'Hybrid': 3,
  'Perfect': 4, 'Ultimate': 5,
};
export const MAX_LEVEL = 5;
const DEFAULT_LEVEL = 3;
const REBIRTH_MAX_LEVEL = 2; // Child
const THEME_MARGIN = 1; // variedade entre resultados quase empatados

export const REASONS = {
  same: 'Evolução',
  rebirth: 'Renascimento',
  jogress: 'Jogress (DNA)',
  evolution: 'Evolução guiada',
  kinship: 'Afinidade de tema',
  special: 'Receita especial',
  catalystUp: 'Luz de Culumon',
  catalystDown: 'Regressão',
};

const pairKey = (a, b) => (a < b ? a * 8192 + b : b * 8192 + a);

function hash(a, b, salt) {
  let h = Math.imul((a < b ? a : b) + 0x9e3779b9, 0x85ebca6b) ^ Math.imul((a < b ? b : a) + 0x7f4a7c15, 0xc2b2ae35);
  h ^= Math.imul(salt + 0x165667b1, 0x27d4eb2f);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12; h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return h >>> 0;
}

const countShared = (x, y) => { let n = 0; for (const v of x) if (y.includes(v)) n++; return n; };
const popcount = (v) => { let n = 0; while (v) { v &= v - 1; n++; } return n; };

// Famílias de tema: agrupam os ~150 tipos da API, que são rótulos soltos
// ("Seraph", "Ophan", "Archangel"...). Um tipo pode cair em mais de um tema.
export const THEMES = [
  ['angel', /angel|seraph|ophan|cherub|dominion|^power$|virtue|principality/i],
  ['holy', /holy|seraph|ophan|cherub|dominion|virtue|principality|archangel|^angel$|small angel|god man|god beast|tathāgata|monk|light dragon|avatar/i],
  ['dark', /fallen|demon|devil|evil|dark|undead|ghost|wicked|oni|skeleton|bewitching|invade|mutant/i],
  ['dragon', /dragon/i],
  ['dino', /dinosaur|saur|reptile|ceratopsian|amphibian/i],
  ['beast', /beast|mammal/i],
  ['bird', /bird|chick/i],
  ['insect', /insect|larva|parasite/i],
  ['plant', /plant|seed|bulb|fairy|spirit/i],
  ['aquatic', /aquatic|marine|ocean|fish|mollusk|crustacean|shellfish|amphibian|plesiosaur/i],
  ['machine', /cyborg|machine|mechanical|weapon|armor|mine|navigation|lcd|enhancement|holy sword/i],
  ['puppet', /puppet|toy|card|musical|food/i],
  ['knight', /knight|warrior|monk/i],
  ['mineral', /mineral|ore|rock|braun/i],
  ['slime', /slime|mutation|lesser|smoke|unbalanced/i],
  ['element', /flame|ice-snow/i],
  ['ancient', /ancient/i],
  ['god', /god|tathāgata|major|minor|avatar|galaxy/i],
  ['alien', /alien|space|unanalyzable|species unknown|unique|composite|synthetic|hybrid/i],
];

// "Black Seraphimon" -> "seraphimon", "Shine Greymon(Burst Mode)" -> "greymon"
const familyOf = (name) => name.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/).pop().toLowerCase();

export function createEngine(game) {
  const D = game.d;
  const n = D.length;
  const levelOf = D.map((d) => (d.l < 0 ? DEFAULT_LEVEL : d.l));
  const knownLevel = D.map((d) => d.l >= 0); // nível desconhecido vale como curinga

  // Jogress: só as receitas da Wikimon (scripts/jogress.mjs) — par -> resultado
  const jogress = new Map(Object.entries(game.jogress || {}).map(([k, v]) => [Number(k), v]));

  // Baldes para a regra de afinidade: (tipo, atributo, nível), (tipo, nível), (campo, nível), (nível)
  const buckets = new Map();
  const add = (key, c) => { if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(c); };
  D.forEach((d, c) => {
    const L = levelOf[c];
    for (const t of d.t) {
      add(`ta${t}|${L}`, c);
      for (const a of d.a) add(`t${t}a${a}|${L}`, c);
    }
    for (const f of d.f) add(`f${f}|${L}`, c);
    add(`l|${L}`, c);
  });
  const bucket = (k) => buckets.get(k) || [];

  // Temas de cada Digimon (bitmask) e baldes (tema, tema, nível)
  const typeThemes = (game.types || []).map((name) => THEMES.reduce((m, [, re], k) => (re.test(name) ? m | (1 << k) : m), 0));
  const themes = D.map((d) => d.t.reduce((m, t) => m | typeThemes[t], 0));
  const themeBits = themes.map((m) => THEMES.map((_, k) => k).filter((k) => m & (1 << k)));
  D.forEach((_, c) => {
    const bits = themeBits[c], L = levelOf[c];
    for (const x of bits) for (const y of bits) if (x <= y) add(`th${x}.${y}|${L}`, c);
  });
  const isX = D.map((d) => d.n.includes('X-Antibody'));
  const families = new Map();
  const family = D.map((d, c) => {
    const f = familyOf(d.n);
    if (!families.has(f)) families.set(f, []);
    families.get(f).push(c);
    return f;
  });

  const overrides = new Map(Object.entries(game.overrides || {}).map(([k, v]) => [Number(k), v]));
  // Linhas canônicas do anime (Agumon + Agumon = Greymon...) -> [resultado, motivo]
  const canon = new Map(Object.entries(game.canon || {}).map(([k, v]) => [Number(k), v]));

  function sim(c, x) {
    const dc = D[c], dx = D[x];
    return 3 * countShared(dc.t, dx.t) + 3 * popcount(themes[c] & themes[x]) + 2 * countShared(dc.a, dx.a)
      + countShared(dc.f, dx.f) + (family[c] === family[x] ? 3 : 0) + (levelOf[c] > levelOf[x] ? 1 : 0);
  }

  // Digimon que aceitam dezenas de formas anteriores (Numemon, Sukamon...) são
  // "genéricos"; quanto mais específico o parentesco, maior a prioridade.
  const specificity = D.map((d) => -1.5 * Math.log2(1 + d.p.length));

  // margin > 0: sorteia (por hash) entre os candidatos a até `margin` pontos do melhor
  function best(cands, score, a, b, salt, margin = 0) {
    const scored = [];
    let hi = -Infinity;
    for (const c of cands) {
      if (c === a || c === b) continue;
      const s = Math.round(score(c) * 4) / 4;
      if (s === -Infinity) continue;
      scored.push([c, s]);
      if (s > hi) hi = s;
    }
    const top = scored.filter(([, s]) => s >= hi - margin).map(([c]) => c);
    return top.length ? { id: pick(top, a, b, salt), score: hi } : null;
  }

  function pick(list, a, b, salt) {
    const opts = list.filter((c) => c !== a && c !== b);
    if (!opts.length) return -1;
    return opts[hash(a, b, salt) % opts.length];
  }

  function kinship(a, b, levelHint) {
    const da = D[a], db = D[b];
    const L = Math.min(MAX_LEVEL, levelHint ?? (levelOf[a] === levelOf[b] ? levelOf[a] + 1 : Math.max(levelOf[a], levelOf[b])));
    const types = [...new Set([...da.t, ...db.t])];
    const attrs = [...new Set([...da.a, ...db.a])];
    const fields = [...new Set([...da.f, ...db.f])];
    const tiers = [
      types.flatMap((t) => attrs.flatMap((at) => bucket(`t${t}a${at}|${L}`))),
      types.flatMap((t) => bucket(`ta${t}|${L}`)),
      fields.flatMap((f) => bucket(`f${f}|${L}`)),
      bucket(`l|${L}`),
    ];
    for (let i = 0; i < tiers.length; i++) {
      const r = pick([...new Set(tiers[i])], a, b, 11 + i);
      if (r >= 0) return r;
    }
    return -1;
  }

  // Catalisadores "bugam" a evolução: combinados com qualquer Digimon, fazem
  // ele evoluir (up) ou regredir (down) uma forma. { índice: 'up' | 'down' }
  const catalysts = new Map(Object.entries(game.catalysts || {}).map(([k, v]) => [Number(k), v]));

  function evolve(x) {
    const cn = canon.get(pairKey(x, x));
    if (cn && cn[1] === 'same') return cn[0];
    const up = D[x].x.filter((c) => knownLevel[c] && levelOf[c] > levelOf[x]);
    const r = best(up, (c) => sim(c, x) + specificity[c], x, x, 21);
    return r ? r.id : -1;
  }

  // linha canônica ao contrário: War Greymon -> Metal Greymon
  const canonPrev = new Map();
  for (const [k, [c, reason]] of canon) if (reason === 'same') canonPrev.set(c, Math.floor(k / 8192));

  function devolve(x) {
    if (canonPrev.has(x)) return canonPrev.get(x);
    const down = D[x].p.filter((c) => knownLevel[c] && levelOf[c] < levelOf[x]);
    const r = best(down, (c) => sim(c, x), x, x, 22);
    return r ? r.id : -1;
  }

  // Retorna { id, reason } ou null
  function combine(a, b) {
    const ca = catalysts.get(a), cb = catalysts.get(b);
    if ((ca || cb) && !(ca && cb)) {
      const other = ca ? b : a, mode = ca || cb;
      const r = mode === 'up' ? evolve(other) : devolve(other);
      return r >= 0 ? { id: r, reason: mode === 'up' ? 'catalystUp' : 'catalystDown' } : null;
    }
    const jg = jogress.get(pairKey(a, b));
    if (jg !== undefined) return { id: jg, reason: 'jogress' };
    const ov = overrides.get(pairKey(a, b));
    if (ov !== undefined) return { id: ov, reason: 'special' };
    const cn = canon.get(pairKey(a, b));
    if (cn) return { id: cn[0], reason: cn[1] };

    const da = D[a], db = D[b];
    if (a === b) {
      // Digimon + ele mesmo: evolui para a forma seguinte mais parecida
      const up = da.x.filter((c) => levelOf[c] > levelOf[a]);
      const r = best(up.length ? up : da.x, (c) => sim(c, a) + specificity[c], a, a, 1);
      if (r) return { id: r.id, reason: 'same' };
      const k = kinship(a, a, Math.min(MAX_LEVEL, levelOf[a] + 1));
      return k >= 0 ? { id: k, reason: 'kinship' } : null;
    }

    // Child (ou menor) + sua própria evolução -> volta à forma de bebê (renascimento)
    if ((da.x.includes(b) || db.x.includes(a)) && levelOf[a] !== levelOf[b] && Math.min(levelOf[a], levelOf[b]) <= REBIRTH_MAX_LEVEL) {
      const lo = levelOf[a] < levelOf[b] ? a : b;
      const down = D[lo].p.filter((c) => levelOf[c] < levelOf[lo]);
      const r = best(down.length ? down : D[lo].p, (c) => sim(c, lo) + specificity[c], a, b, 2);
      if (r) return { id: r.id, reason: 'rebirth' };
    }

    const r = themed(a, b);
    if (r) return r;
    const k = kinship(a, b);
    return k >= 0 ? { id: k, reason: 'kinship' } : null;
  }

  // Pontuação única por tema: o resultado precisa ter a ver com A *e* com B,
  // ganha bônus se for evolução/pré-evolução de um deles e nunca cai de nível.
  function themed(a, b) {
    const la = levelOf[a], lb = levelOf[b];
    const maxL = Math.max(la, lb);
    const target = Math.min(MAX_LEVEL, la === lb ? la + 1 : maxL);

    const link = new Map(); // candidato -> bônus de parentesco
    const bump = (c, v) => link.set(c, (link.get(c) || 0) + v);
    for (const x of [a, b]) {
      for (const c of D[x].x) bump(c, 3);
      for (const c of D[x].p) bump(c, 2);
    }
    const cands = new Set(link.keys());
    for (const x of [a, b]) {
      const fam = families.get(family[x]);
      if (fam.length > 1) for (const c of fam) cands.add(c);
    }
    const ta = themeBits[a].length ? themeBits[a] : themeBits[b];
    const tb = themeBits[b].length ? themeBits[b] : themeBits[a];
    for (const L of [maxL, Math.min(MAX_LEVEL, maxL + 1)]) {
      for (const x of ta) for (const y of tb) {
        for (const c of bucket(`th${Math.min(x, y)}.${Math.max(x, y)}|${L}`)) cands.add(c);
      }
    }

    const score = (c) => {
      if (knownLevel[c] && levelOf[c] < maxL) return -Infinity;
      const sa = Math.min(2, popcount(themes[c] & themes[a])), sb = Math.min(2, popcount(themes[c] & themes[b]));
      let s = 4 * sa + 4 * sb + (sa && sb ? 4 : 0);
      s += link.get(c) || 0;
      // mesma família: bônus se for o próximo da linha, penalidade se for só uma variante lateral
      for (const x of [a, b]) if (family[c] === family[x]) s += levelOf[c] > levelOf[x] ? 4 : -4;
      if (isX[c] && !isX[a] && !isX[b]) s -= 1.5;
      s += Math.min(1, countShared(D[c].a, D[a].a)) + Math.min(1, countShared(D[c].a, D[b].a));
      s += countShared(D[c].t, D[a].t) + countShared(D[c].t, D[b].t);
      s -= knownLevel[c] ? 2 * Math.abs(levelOf[c] - target) : 1;
      return s + specificity[c] / 2;
    };
    const r = best(cands, score, a, b, 4, THEME_MARGIN);
    if (!r) return null;
    return { id: r.id, reason: link.has(r.id) ? 'evolution' : 'kinship' };
  }

  return { combine, pairKey, levelOf, n, sim, catalystOf: (i) => catalysts.get(i), setOverride: (a, b, c) => overrides.set(pairKey(a, b), c), deleteOverride: (a, b) => overrides.delete(pairKey(a, b)) };
}
