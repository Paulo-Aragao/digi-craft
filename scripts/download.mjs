// Baixa todos os Digimon da digi-api.com (detalhes + imagens).
// Uso: node scripts/download.mjs [--no-images]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const IMG_DIR = path.join(ROOT, 'img');
const API = 'https://digi-api.com/api/v1';
const CONCURRENCY = 8;
const withImages = !process.argv.includes('--no-images');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, as = 'json', tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return as === 'json' ? await res.json() : Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === tries - 1) throw new Error(`${url}: ${e.message}`);
      await sleep(500 * 2 ** i);
    }
  }
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function pool(items, fn) {
  let i = 0, done = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try { await fn(item); } catch (e) { console.error('\n' + e.message); }
      if (++done % 50 === 0 || done === items.length) process.stdout.write(`\r  ${done}/${items.length}`);
    }
  });
  await Promise.all(workers);
  process.stdout.write('\n');
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  console.log('Listando Digimon...');
  const list = [];
  // totalPages da API vem errado; pagina até completar totalElements
  for (let page = 0; page < 50; page++) {
    const j = await fetchRetry(`${API}/digimon?pageSize=500&page=${page}`);
    if (!j?.content?.length) break;
    list.push(...j.content);
    if (list.length >= j.pageable.totalElements) break;
  }
  console.log(`  ${list.length} Digimon encontrados`);
  await fs.writeFile(path.join(ROOT, 'data', 'list.json'), JSON.stringify(list));

  console.log('Baixando detalhes...');
  await pool(list, async ({ id }) => {
    const file = path.join(RAW_DIR, `${id}.json`);
    if (await exists(file)) return;
    const d = await fetchRetry(`${API}/digimon/${id}`);
    if (d) await fs.writeFile(file, JSON.stringify(d));
  });

  if (!withImages) return;
  console.log('Baixando imagens...');
  await pool(list, async ({ id, image }) => {
    const file = path.join(IMG_DIR, `${id}.png`);
    if (await exists(file) || !image) return;
    const buf = await fetchRetry(encodeURI(decodeURI(image)), 'buffer');
    if (buf) await fs.writeFile(file, buf);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
