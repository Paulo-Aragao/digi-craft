// Conquistas do Digi Craft. Cada requisito de grupo é um nome ou uma lista de
// nomes alternativos (qualquer um deles conta).
const ULTIMATE = 5;
export const FAST_MEGA = 3;

const GROUPS = [
  {
    id: 'miracle', icon: '✨',
    name: { pt: 'Milagre dos Milagres', en: 'Miracle of Miracles' },
    desc: { pt: 'Descubra Magnamon e o Rapidmon dourado.', en: 'Discover Magnamon and the golden Rapidmon.' },
    req: ['Magnamon', 'Rapidmon Perfect'],
  },
  {
    id: 'royal-knights', icon: '🛡️',
    name: { pt: '13 Cavaleiros Reais', en: '13 Royal Knights' },
    desc: { pt: 'Reúna todos os Royal Knights.', en: 'Gather every Royal Knight.' },
    req: ['Omegamon', 'Alphamon', 'Dukemon', 'Ulforce V-dramon', 'Examon', 'Gankoomon', 'JESmon', 'Sleipmon',
      'Craniummon', 'Dynasmon', 'Lord Knightmon', 'Magnamon', 'Duftmon'],
  },
  {
    id: 'royal-knights-x', icon: '⚔️',
    name: { pt: 'Cavaleiros Reais X', en: 'Royal Knights X' },
    desc: { pt: 'Reúna os 12 Royal Knights X-Antibody (não existe Alphamon X).', en: 'Gather the 12 X-Antibody Royal Knights (there is no Alphamon X).' },
    req: ['Omegamon (X-Antibody)', 'Dukemon (X-Antibody)', 'Ulforce V-dramon (X-Antibody)', 'Examon (X-Antibody)',
      'Gankoomon (X-Antibody)', 'JESmon (X-Antibody)', 'Sleipmon (X-Antibody)', 'Craniummon (X-Antibody)',
      'Dynasmon (X-Antibody)', 'Lord Knightmon (X-Antibody)', 'Magnamon (X-Antibody)', 'Duftmon (X-Antibody)'],
  },
  {
    id: 'angels', icon: '👼',
    name: { pt: '3 Grandes Anjos', en: '3 Great Angels' },
    desc: { pt: 'Seraphimon, Ofanimon e Cherubimon.', en: 'Seraphimon, Ofanimon and Cherubimon.' },
    req: ['Seraphimon', 'Ofanimon', 'Cherubimon (Virtue)'],
  },
  {
    id: 'sovereigns', icon: '🐉',
    name: { pt: '4 Feras Sagradas', en: 'Four Holy Beasts' },
    desc: { pt: 'Os guardiões dos quatro pontos cardeais.', en: 'The guardians of the four directions.' },
    req: ['Zhuqiaomon', 'Qinglongmon', 'Baihumon', 'Xuanwumon'],
  },
  {
    id: 'huanglongmon', icon: '🌟',
    name: { pt: 'O Quinto Soberano', en: 'The Fifth Sovereign' },
    desc: { pt: 'As 4 Feras Sagradas e Huanglongmon.', en: 'The Four Holy Beasts and Huanglongmon.' },
    req: ['Zhuqiaomon', 'Qinglongmon', 'Baihumon', 'Xuanwumon', 'Huanglongmon'],
  },
  {
    id: 'dark-masters', icon: '🃏',
    name: { pt: 'Mestres das Trevas', en: 'Dark Masters' },
    desc: { pt: 'Metal Seadramon, Pinochimon, Mugendramon e Piemon.', en: 'Metal Seadramon, Pinochimon, Mugendramon and Piemon.' },
    req: ['Metal Seadramon', 'Pinochimon', 'Mugendramon', 'Piemon'],
  },
  {
    id: 'olympos', icon: '🏛️',
    name: { pt: '12 Deuses do Olimpo', en: 'Olympos XII' },
    desc: { pt: 'Todos os deuses do Olympos XII.', en: 'Every god of the Olympos XII.' },
    req: ['Jupitermon', 'Junomon', 'Neptunemon', 'Apollomon', 'Dianamon', 'Marsmon', 'Venusmon', 'Minervamon',
      'Vulcanusmon', 'Mercurymon', 'Ceresmon', 'Bacchusmon'],
  },
  {
    id: 'devas', icon: '🐒',
    name: { pt: '12 Devas', en: '12 Devas' },
    desc: { pt: 'Os servos das Feras Sagradas.', en: 'The servants of the Holy Beasts.' },
    req: ['Kumbhiramon', 'Vajramon', 'Pajiramon', 'Mihiramon', 'Sandiramon', 'Indaramon', 'Makuramon', 'Sinduramon',
      'Majiramon', 'Vikaralamon', 'Caturamon', 'Andiramon (Deva)'],
  },
  {
    id: 'ancients', icon: '🗿',
    name: { pt: '10 Guerreiros Antigos', en: '10 Ancient Warriors' },
    desc: { pt: 'Os heróis que derrotaram Lucemon.', en: 'The heroes who defeated Lucemon.' },
    req: ['Ancient Greymon', 'Ancient Garurumon', 'Ancient Irismon', 'Ancient Beatmon', 'Ancient Megatheriumon',
      'Ancient Mermaimon', 'Ancient Sphinxmon', 'Ancient Troiamon', 'Ancient Volcamon', 'Ancient Wisemon'],
  },
  {
    id: 'legendary', icon: '🔥',
    name: { pt: 'Guerreiros Lendários', en: 'Legendary Warriors' },
    desc: { pt: 'Os 10 espíritos de Frontier (Gigasmon no lugar de Grottomon).', en: 'The 10 Frontier spirits (Gigasmon stands in for Grottomon).' },
    req: ['Agnimon', 'Wolfmon', 'Fairimon', 'Blitzmon', 'Chackmon', 'Löwemon', 'Arbormon', 'Ranamon', 'Mercuremon', 'Gigasmon'],
  },
  {
    id: 'adventure-megas', icon: '🌈',
    name: { pt: 'Escolhidos', en: 'DigiDestined' },
    desc: { pt: 'A forma final de cada parceiro de Adventure.', en: 'The final form of every Adventure partner.' },
    req: ['War Greymon', 'Metal Garurumon', 'Hououmon', 'Herakle Kabuterimon', 'Rosemon', 'Vikemon', 'Seraphimon', 'Holydramon'],
  },
  {
    id: 'omegamon', icon: '⚪',
    name: { pt: 'Omegamon', en: 'Omegamon' },
    desc: { pt: 'Os dois heróis viram um só.', en: 'Two heroes become one.' },
    req: ['Omegamon'],
  },
  {
    id: 'adventure02', icon: '🥚',
    name: { pt: 'Parceiros de 02', en: '02 Partners' },
    desc: { pt: 'V-mon, Wormmon, Hawkmon e Armadimon.', en: 'V-mon, Wormmon, Hawkmon and Armadimon.' },
    req: ['V-mon', 'Wormmon', 'Hawkmon', 'Armadimon'],
  },
  {
    id: 'imperialdramon', icon: '🐲',
    name: { pt: 'Imperialdramon Completo', en: 'Complete Imperialdramon' },
    desc: { pt: 'Todos os modos de Imperialdramon.', en: 'Every Imperialdramon mode.' },
    req: ['Imperialdramon(Dragon Mode)', 'Imperialdramon(Dragon Mode (Black))', 'Imperialdramon(Fighter Mode)',
      'Imperialdramon(Fighter Mode (Black))', 'Imperialdramon(Paladin Mode)'],
  },
  {
    id: 'tamers', icon: '🎴',
    name: { pt: 'Domadores', en: 'Tamers' },
    desc: { pt: 'Guilmon, Terriermon, Renamon e suas formas Mega.', en: 'Guilmon, Terriermon, Renamon and their Mega forms.' },
    req: ['Guilmon', 'Terriermon', 'Renamon', 'Dukemon', 'Saint Galgomon', 'Sakuyamon'],
  },
  {
    id: 'savers', icon: '🦅',
    name: { pt: 'Data Squad', en: 'Data Squad' },
    desc: { pt: 'Os Megas de Digimon Savers.', en: 'The Megas of Digimon Savers.' },
    req: ['Shine Greymon', 'Mirage Gaogamon', 'Rosemon', 'Ravmon'],
  },
  {
    id: 'villains', icon: '💀',
    name: { pt: 'Chefões', en: 'Final Bosses' },
    desc: { pt: 'Apocalymon, Belial Vamdemon, Millenniumon e Ogudomon.', en: 'Apocalymon, Belial Vamdemon, Millenniumon and Ogudomon.' },
    req: ['Apocalymon', 'Belial Vamdemon', ['Millenniumon', 'Zeed Millenniumon'], 'Ogudomon'],
  },
  {
    id: 'stinky', icon: '💩',
    name: { pt: 'Fedorento', en: 'Stinky' },
    desc: { pt: 'Numemon, Sukamon e Gold Numemon.', en: 'Numemon, Sukamon and Gold Numemon.' },
    req: ['Numemon', 'Sukamon', 'Gold Numemon'],
  },
  {
    id: 'numemons', icon: '🐌',
    name: { pt: 'Família Numemon', en: 'Numemon Family' },
    desc: { pt: 'Todos os Numemon.', en: 'Every Numemon.' },
    req: ['Numemon', 'Karatuki Numemon', 'Black King Numemon', 'Platinum Numemon', 'Gold Numemon',
      'Gold Numemon (Ultimate)', 'Gigantic Numemon', 'Numemon (X-Antibody)'],
  },
];

const T = (pt, en) => ({ pt, en });

export function createAchievements(game) {
  const D = game.d;
  const byName = new Map(D.map((d, i) => [d.n, i]));
  const resolve = (alts) => [].concat(alts).map((n) => {
    if (!byName.has(n)) console.warn('Conquista com Digimon inexistente:', n);
    return byName.get(n);
  }).filter((i) => i !== undefined);

  const isX = D.map((d) => d.n.includes('(X-Antibody)'));
  const babies = D.map((_, i) => i).filter((i) => D[i].l === 0);
  const specials = [...new Set(Object.values(game.overrides || {}))];
  const attrIds = game.attrs.map((_, a) => a); // Vaccine, Data, Virus, Free, Variable
  const N = D.length;

  const list = GROUPS.map((g) => {
    const reqs = g.req.map(resolve);
    return { ...g, req: reqs.map((r) => r[0]), progress: ({ disc }) => [reqs.filter((r) => r.some((i) => disc.has(i))).length, reqs.length] };
  });

  const count = (fn) => ({ disc }) => { let n = 0; for (const i of disc.keys()) if (fn(i)) n++; return n; };
  const xCount = count((i) => isX[i]);
  list.push(
    { id: 'babies', icon: '🍼', name: T('Berçário', 'Nursery'), desc: T('Todos os Digimon Baby I.', 'Every Baby I Digimon.'),
      req: babies, progress: ({ disc }) => [babies.filter((i) => disc.has(i)).length, babies.length] },
    { id: 'x-first', icon: '🧬', name: T('Antídoto X', 'X Antidote'), desc: T('Descubra um Digimon X-Antibody.', 'Discover an X-Antibody Digimon.'),
      progress: (c) => [Math.min(1, xCount(c)), 1] },
    { id: 'x-50', icon: '☣️', name: T('Infectado', 'Infected'), desc: T('Descubra 50 Digimon X-Antibody.', 'Discover 50 X-Antibody Digimon.'),
      progress: (c) => [Math.min(50, xCount(c)), 50] },
    { id: 'jogress', icon: '🧪', name: T('Primeiro Jogress', 'First Jogress'), desc: T('Faça uma fusão Jogress.', 'Perform a Jogress fusion.'),
      progress: ({ stats }) => [Math.min(1, stats.jogress || 0), 1] },
    { id: 'secret', icon: '🗝️', name: T('Receita Secreta', 'Secret Recipe'), desc: T('Descubra um Digimon de receita especial.', 'Discover a special-recipe Digimon.'),
      progress: ({ disc }) => [specials.some((i) => disc.has(i)) ? 1 : 0, 1] },
    ...[100, 250, 500, 1000].map((n) => ({
      id: `count-${n}`, icon: '📚', name: T(`Coleção ${n}`, `Collection ${n}`), desc: T(`Descubra ${n} Digimon.`, `Discover ${n} Digimon.`),
      progress: ({ disc }) => [Math.min(n, disc.size), n],
    })),
    { id: 'attributes', icon: '💉', name: T('Todos os Atributos', 'Every Attribute'), desc: T('Tenha um Digimon Vaccine, Data, Virus, Free e Variable.', 'Own a Vaccine, Data, Virus, Free and Variable Digimon.'),
      progress: ({ disc }) => [attrIds.filter((a) => [...disc.keys()].some((i) => D[i].a.includes(a))).length, attrIds.length] },
    { id: 'fields', icon: '🗺️', name: T('Todos os Campos', 'Every Field'), desc: T(`Tenha um Digimon de cada um dos ${game.fields.length} campos.`, `Own a Digimon from each of the ${game.fields.length} fields.`),
      progress: ({ disc }) => [game.fields.filter((_, f) => [...disc.keys()].some((i) => D[i].f.includes(f))).length, game.fields.length] },
    { id: 'speedrun', icon: '⚡', name: T('Digievolução Relâmpago', 'Lightning Digivolution'), desc: T(`Chegue a um Mega em até ${FAST_MEGA} combinações desde o começo.`, `Reach a Mega within ${FAST_MEGA} combinations from the start.`),
      progress: ({ stats }) => [stats.fastMega ? 1 : 0, 1] },
    { id: 'complete', icon: '🏆', name: T('Digimundo Completo', 'Complete Digital World'), desc: T(`Descubra todos os ${N} Digimon.`, `Discover all ${N} Digimon.`),
      progress: ({ disc }) => [disc.size, N] },
  );

  return { list, isUltimate: (i) => D[i].l === ULTIMATE };
}
