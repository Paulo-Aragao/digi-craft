// Baixa as receitas de Jogress da Wikimon (https://wikimon.net/Jogress) e as
// traduz para os nomes da digi-api. Só essas receitas fazem Jogress no jogo.
// Saída: data/jogress.json  ->  { recipes: [[A, B, Resultado, fonte]], unmatched: [...] }
// Uso: node scripts/jogress.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://wikimon.net/api.php?action=parse&page=Jogress&prop=text&format=json';

// Tabelas ignoradas: exemplos, Pendulum por atributo ("qualquer Vaccine + Data") e a
// matriz por elemento do next 0rder — não são pares específicos de Digimon.
const SKIP_TABLE = /^(Example|ExE Evolutions|References|Digimon Pendulum$)/;

// Receitas citadas no texto do artigo (anime, mangá, live action), fora das tabelas
const PROSE = [
  ['War Greymon', 'Metal Garurumon', 'Omegamon', 'Xros Wars'],
  ['V-mon', 'Stingmon', 'Imperialdramon: Dragon Mode', 'Xros Wars'],
  ['Breakdramon', 'Slayerdramon', 'Examon', 'Card Game'],
  ['Groundramon', 'Wingdramon', 'Examon', 'Card Game'],
  ['Orgemon', 'Devimon', 'Skull Satamon', 'V-Tamer 01'],
  ['Kuwagamon', 'Cockatrimon', 'Megadramon', 'V-Tamer 01'],
  ['Megadramon', 'Jyureimon', 'Deathmon', 'V-Tamer 01'],
  ['Monodramon', 'Zeed Millenniumon', 'Cyberdramon', "Ryo's Story!"],
  ['Fenriloogamon', 'Kazuchimon', 'Fenriloogamon: Takemikazuchi', 'Seekers'],
  ['Atratusmon', 'Albatusmon', 'Volvemon', 'Beatbreak'],
  ['Metatromon', 'Dalphomon', 'Ex Maquinamon', 'Liberator'],
];

// Grafias da Wikimon que não batem com a digi-api
const ALIASES = {
  'omegamon i': 'Omegamon', 'omegamon ii': 'Omegamon', 'tailmon r': 'Tailmon',
  'imperialdramon': 'Imperialdramon(Dragon Mode)', 'cherubimon': 'Cherubimon (Virtue)',
  'millenniummon': 'Millenniumon', 'minotaurmon adult': 'Minotaurmon',
  'belphemon': 'Belphemon(Rage Mode)', 'rapidmon': 'Rapidmon Perfect',
  'scumon': 'Sukamon', 'platinum scumon': 'Platinum Sukamon', 'vermilimon': 'Vermillimon',
  'bishop chessmon': 'Bishop Chessmon (White)', 'rook chessmon': 'Rook Chessmon (White)',
};

const TAGS = /\((?:PenProg\d|D-Scan\d|\d\.\d(?:\/\d\.\d)?|Both[^)]*|Zealous|Tolerant|Sociable|Enlightened|Overprotective|Reckless|Friendly|Daring|Passionate|Devoted|Sly|Justice Genome|Evil Genome|Nature Genome|Ultimate Genome)\)/g;

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;|&#160;/g, ' ');
const cellText = (html) => decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<sup[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, '')).trim();

function parseTables(html) {
  const rows = [];
  for (const [, table] of html.matchAll(/<table[\s\S]*?>([\s\S]*?)<\/table>/gi)) {
    const trs = [...table.matchAll(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi)].map(([, tr]) =>
      [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([, c]) => cellText(c)));
    const title = (trs[0]?.[0] || '').replace('Jogress Evolutions in ', '');
    if (!trs.length || SKIP_TABLE.test(title)) continue;
    let comp = -1, res = -1;
    for (const cells of trs) {
      const ci = cells.findIndex((c) => /^Component/.test(c)), ri = cells.findIndex((c) => /^Jogressed/.test(c));
      if (ci >= 0 && ri >= 0) { comp = ci; res = ri; continue; }
      if (comp < 0 || cells.length <= Math.max(comp, res)) continue;
      rows.push({ src: title, comp: cells[comp], res: cells[res] });
    }
  }
  return rows;
}

// "A + B" por linha; "Any two of A, B, or C" / "Any combination of ..." vira todos os pares
function pairsOf(comp) {
  // as marcações de versão/personalidade separam receitas; quebras de linha
  // coladas no "+" fazem parte do mesmo par ("XV-mon\n(Zealous) + Stingmon")
  const text = comp.replace(TAGS, '\n').replace(/\s*\n\s*\+/g, ' +').replace(/\+\s*\n\s*/g, '+ ');
  const any = text.match(/^Any (?:two|combination) of (.+)$/s);
  if (any) {
    const names = any[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map((s) => s.trim()).filter(Boolean);
    return names.flatMap((a, i) => names.slice(i + 1).map((b) => [a, b]));
  }
  // "Dukemon + Sakuyamon/Saint Galgomon" vira um par para cada alternativa
  return text.split('\n').map((l) => l.split(' + ').map((s) => s.trim()))
    .filter((p) => p.length === 2 && p[0] && p[1])
    .flatMap(([a, b]) => b.split('/').map((bb) => [a, bb.trim()]));
}

function main(html) {
  const game = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'game.json'), 'utf8'));
  const names = game.d.map((d) => d.n);
  const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byKey = new Map(names.map((n) => [key(n), n]));

  const resolve = (raw) => {
    let s = raw.replace(TAGS, '').replace(/\s+/g, ' ').trim();
    if (ALIASES[s.toLowerCase()]) return ALIASES[s.toLowerCase()];
    const tries = [
      s,
      s.replace(/: (.+)$/, '($1)'),                 // "Rosemon: Burst Mode" -> "Rosemon(Burst Mode)"
      s.replace(/: (.+?) \((.+)\)$/, '($1 ($2))'),  // "Imperialdramon: Dragon Mode (Black)"
      s.replace(/ X-Antibody$/, ' (X-Antibody)'),
    ];
    for (const t of tries) if (byKey.has(key(t))) return byKey.get(key(t));
    return null;
  };

  const recipes = [], unmatched = new Set(), seen = new Set();
  const rows = [...parseTables(html), ...PROSE.map(([a, b, res, src]) => ({ src, comp: `${a} + ${b}`, res }))];
  for (const { src, comp, res } of rows) {
    const result = resolve(res.split('\n')[0]);
    if (!result) { unmatched.add(res.replace(TAGS, '').trim()); continue; }
    for (const [ra, rb] of pairsOf(comp)) {
      const a = resolve(ra), b = resolve(rb);
      if (!a) unmatched.add(ra);
      if (!b) unmatched.add(rb);
      if (!a || !b) continue;
      const k = [a, b].sort().join('|') + '>' + result;
      if (seen.has(k)) continue;
      seen.add(k);
      recipes.push([a, b, result, src]);
    }
  }
  const out = { source: 'https://wikimon.net/Jogress', recipes, unmatched: [...unmatched].sort() };
  fs.writeFileSync(path.join(ROOT, 'data', 'jogress.json'), JSON.stringify(out, null, 1));
  console.log(`${recipes.length} receitas de Jogress, ${unmatched.size} nomes sem correspondência na digi-api`);
  if (unmatched.size) console.log('  ' + [...unmatched].sort().join(', '));
}

const res = await fetch(URL, { headers: { 'User-Agent': 'DigiCraft/1.0 (fan project)' } });
if (!res.ok) throw new Error(`Wikimon respondeu ${res.status}`);
main((await res.json()).parse.text['*']);
