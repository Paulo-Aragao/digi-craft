// Textos da interface em português e inglês. Nomes e descrições dos Digimon vêm da API.
const STRINGS = {
  pt: {
    subtitle: 'Infinite Craft com Digimon',
    targetLabel: 'Objetivo',
    removeTarget: 'Remover objetivo',
    dex: '📖 Digidex',
    clear: '🧹 Limpar',
    reset: 'Recomeçar',
    resetConfirm: 'Apagar todo o progresso e recomeçar com os 8 Digimon de Adventure?',
    search: 'Buscar descobertos…',
    sortTime: 'Descoberta',
    sortName: 'Nome',
    sortLevel: 'Nível',
    sortTitle: 'Ordenar',
    sideFoot: 'Arraste ou toque para levar à área de jogo · solte um sobre outro para combinar · toque duplo duplica',
    nothing: 'Nada encontrado.',
    progress: '{n} / {total} Digimon',
    newBadge: 'NOVO',
    goalReached: '🎯 Objetivo alcançado: <b>{name}</b>!',
    dexSearch: 'Buscar qualquer Digimon…',
    all: 'Todos',
    found: 'Descobertos',
    missing: 'Faltando',
    allLevels: 'Todos os níveis',
    unknownLevel: 'Desconhecido',
    noDigimon: 'Nenhum Digimon.',
    release: 'Lançamento: {year}',
    discoveredWith: 'Você descobriu com:',
    starter: 'Um dos 8 Digimon iniciais de Digimon Adventure.',
    notFound: 'Ainda não descoberto.',
    place: 'Colocar na área de jogo',
    setTarget: 'Definir como objetivo',
    isTarget: 'Já é o objetivo',
    language: 'Idioma',
    achievements: '🏆 Conquistas',
    achTitle: 'Conquistas',
    achUnlocked: 'Conquista desbloqueada: <b>{name}</b>',
    jogress: 'JOGRESS!',
    reasons: {
      same: 'Evolução', rebirth: 'Renascimento', jogress: 'Jogress (DNA)',
      evolution: 'Evolução guiada', kinship: 'Afinidade de tema', special: 'Receita especial',
    },
  },
  en: {
    subtitle: 'Infinite Craft with Digimon',
    targetLabel: 'Goal',
    removeTarget: 'Remove goal',
    dex: '📖 Digidex',
    clear: '🧹 Clear',
    reset: 'Restart',
    resetConfirm: 'Erase all progress and start over with the 8 Digimon Adventure partners?',
    search: 'Search discovered…',
    sortTime: 'Discovery',
    sortName: 'Name',
    sortLevel: 'Level',
    sortTitle: 'Sort',
    sideFoot: 'Drag or tap to add to the play area · drop one on another to combine · double-tap to duplicate',
    nothing: 'Nothing found.',
    progress: '{n} / {total} Digimon',
    newBadge: 'NEW',
    goalReached: '🎯 Goal reached: <b>{name}</b>!',
    dexSearch: 'Search any Digimon…',
    all: 'All',
    found: 'Discovered',
    missing: 'Missing',
    allLevels: 'All levels',
    unknownLevel: 'Unknown',
    noDigimon: 'No Digimon.',
    release: 'Released: {year}',
    discoveredWith: 'You discovered it with:',
    starter: 'One of the 8 starting Digimon from Digimon Adventure.',
    notFound: 'Not discovered yet.',
    place: 'Place in play area',
    setTarget: 'Set as goal',
    isTarget: 'Already the goal',
    language: 'Language',
    achievements: '🏆 Achievements',
    achTitle: 'Achievements',
    achUnlocked: 'Achievement unlocked: <b>{name}</b>',
    jogress: 'JOGRESS!',
    reasons: {
      same: 'Evolution', rebirth: 'Rebirth', jogress: 'Jogress (DNA)',
      evolution: 'Guided evolution', kinship: 'Theme kinship', special: 'Special recipe',
    },
  },
};

const LANG_KEY = 'digicraft-lang';
let lang = 'pt';
try { lang = localStorage.getItem(LANG_KEY) || ''; } catch {}
if (!STRINGS[lang]) lang = (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';

export const getLang = () => lang;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch {}
}

export function t(key, vars = {}) {
  const s = STRINGS[lang][key] ?? STRINGS.pt[key] ?? key;
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s;
}

// Aplica textos aos elementos com data-i18n / data-i18n-placeholder / data-i18n-title
export function applyStatic(root = document) {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}
