# Digi Craft

Clone do [Infinite Craft](https://neal.fun/infinite-craft/) com Digimon. Em vez dos 4 elementos, você
começa com os 8 Digimon de *Digimon Adventure* (Agumon, Gabumon, Piyomon, Tentomon, Palmon, Gomamon,
Patamon e Tailmon) e combina até descobrir os 1488 Digimon da [digi-api.com](https://digi-api.com/).

## Rodar

```bash
node scripts/serve.mjs
```

Abra http://localhost:5173.

## Pipeline de dados

```bash
node scripts/download.mjs   # baixa data/raw/*.json e img/*.png da digi-api
node scripts/jogress.mjs    # baixa as receitas de Jogress da Wikimon -> data/jogress.json
node scripts/build.mjs      # monta o grafo, calcula alcançabilidade -> data/game.json, data/report.md
```

## Como as combinações funcionam (`src/combine.js`)

Cada Digimon é um nó; as arestas são evoluções (anteriores/seguintes), temas, tipos, atributos, campos,
família de nome e nível. `combine(A, B)` é determinístico e simétrico:

0. **Catalisadores** — Digimon que "bugam" a evolução (`CATALYSTS` em `scripts/build.mjs`):
   **Culumon** faz qualquer Digimon evoluir para a próxima forma, **Apocalymon** faz regredir uma forma.
   Seguem as linhas canônicas quando existem, e o catalisador não é consumido na fusão.
1. **Jogress** — **só** as receitas listadas na [Wikimon](https://wikimon.net/Jogress) (tabelas dos jogos,
   V-Pets e as citadas no anime/mangá), em `data/jogress.json`. Quando jogos diferentes dão resultados
   diferentes para o mesmo par, vale o mais citado.
2. **Receita especial** — pares gerados pelo build para quem o grafo sozinho não alcança.
3. **Canônico** — linhas do anime (Agumon + Agumon = Greymon, War Greymon + Metal Garurumon = Omegamon).
4. **A + A** — evolui para a forma seguinte mais parecida.
5. **Renascimento** — Child (ou menor) + uma evolução dele volta para a forma de bebê.
6. **Pontuação por tema** — o resto. Cada candidato ganha pontos por:
   - tema em comum com A **e** com B (os ~150 tipos da API agrupados em `THEMES`: anjo, sagrado,
     trevas, dragão, máquina…) — é o que mais pesa;
   - ser evolução/pré-evolução de A ou B (mais ainda se evoluir dos dois);
   - família de nome (Black Seraphimon → Seraphimon) quando é o próximo da linha;
   - atributo e tipo exatos em comum.
   
   O resultado nunca fica abaixo do nível do pai mais alto (nível desconhecido vale como curinga).
   Variantes laterais de um dos pais e X-Antibody sem pai X são penalizados. Entre os candidatos a até
   1 ponto do melhor, o desempate é por hash do par.

Digimon "genéricos" (com dezenas de pré-evoluções, como Numemon) têm prioridade menor.

## Conquistas

33 desafios em `src/achievements.js`: grupos (Royal Knights, Olympos XII, Devas…), coleções,
mecânicas (Jogress, receita especial) e speedrun. O progresso fica no `localStorage`.

## Alcançabilidade

O build aplica `combine` em todos os pares descobertos até ninguém novo surgir (fecho a partir dos 8).
Resultado atual: **1407/1488 alcançáveis só pelas regras do grafo** (94,6%); 69 receitas especiais
(escolhidas entre pré-evoluções e Digimon parecidos com o alvo) garantem **1488/1488**, com no máximo
11 gerações de combinação. Detalhes em `data/report.md`.
