/**
 * The docs-retrieval eval's arm table, and the runner that drives one arm over one query set.
 *
 * **The rule this module exists to enforce: the arm set is declared once, here, by pairing letters
 * onto `SEARCH_MODES` imported from the module `searchDocs` itself comes from.** `SearchMode` and
 * `SEARCH_MODES` are a single source in `cli/src/retrieval/search.ts`, and
 * `.claude/context/conventions.md` → `## Registries and dispatch tables` requires such a source to
 * have "no second list beside it". So no mode string and no arm letter is retyped anywhere else on
 * this branch: `evals/docs-retrieval/args.mjs` returns `--arms` as the raw letters an operator gave
 * and defers both the default set and the by-name refusal to {@link selectArms}, and
 * `evals/docs-retrieval/results.mjs` renders one row per {@link ARMS} entry, reading `letter` and
 * `mode` off the entry. A fifth `SearchMode` therefore gains an arm, a metric row and a results row
 * with no edit here beyond a fifth letter — and if that letter is missing, this module refuses **at
 * load** by name rather than silently dropping the mode.
 *
 * **Arm A is in the table and is not run by this module.** It is index-first navigation by an agent,
 * has no `SearchMode`, and carries `mode: null`. Its row is rendered from the records
 * `evals/docs-retrieval/run.mjs` scores out of a `--transcript`, and from nothing else.
 *
 * **`session` in {@link runArm} is the object `evals/docs-retrieval/index-build.mjs` → `buildIndex`
 * returned**, never `cli/src/retrieval/session.ts` → `openRetrieval`'s, which this eval deliberately
 * never calls (`evals/docs-retrieval/corpora.mjs` → the gate paragraph).
 */

import { SEARCH_MODES, searchDocs } from '../../cli/dist/retrieval/search.js';

/** The index-first navigation arm: declared so its row exists, with no mode because it runs no search. */
const NAVIGATION_ARM = Object.freeze({ letter: 'A', mode: null });

/**
 * The letters the library arms take, in `SEARCH_MODES` order. `A` is {@link NAVIGATION_ARM}'s, so
 * this list starts at `B`; a mode with no letter left is the load-time refusal below.
 */
const LIBRARY_ARM_LETTERS = Object.freeze(['B', 'C', 'D', 'E']);

/** The one declared arm table: `{ letter, mode }`, arm A first, then `SEARCH_MODES` in its own order. */
export const ARMS = Object.freeze([
  NAVIGATION_ARM,
  ...SEARCH_MODES.map((mode, index) => {
    const letter = LIBRARY_ARM_LETTERS[index];
    if (letter === undefined) {
      throw new Error(
        `eval: SearchMode ${mode} has no arm letter — SEARCH_MODES carries ${SEARCH_MODES.length} modes ` +
          `and evals/docs-retrieval/arms.mjs supplies ${LIBRARY_ARM_LETTERS.length} letters ` +
          `(${LIBRARY_ARM_LETTERS.join(', ')}). Add the next letter there rather than dropping the mode`,
      );
    }
    return Object.freeze({ letter, mode });
  }),
]);

/** The arms an invocation naming no `--arms` runs: every entry that has a mode to run. */
export const DEFAULT_ARM_LETTERS = Object.freeze(ARMS.filter((arm) => arm.mode !== null).map((arm) => arm.letter));

/** Every letter the table declares, in table order, as a refusal lists them. */
function declaredLetters() {
  return ARMS.map((arm) => arm.letter).join(', ');
}

/** The table entry `letter` names, refused by name against the table's own letters. */
export function armForLetter(letter) {
  const arm = ARMS.find((entry) => entry.letter === letter);
  if (arm === undefined) {
    throw new Error(`eval: unknown arm ${letter}; the arm table declares ${declaredLetters()}`);
  }
  return arm;
}

/**
 * The table entries an operator's raw `--arms` value selects, in table order, de-duplicated.
 *
 * `raw` is the letters exactly as `parseArgs` carried them through — run together, comma separated,
 * space separated or lower case, all read the same — or `undefined`, which selects
 * {@link DEFAULT_ARM_LETTERS}. Arm A is refused here rather
 * than run empty: it has no mode, and its row comes from `--transcript`.
 */
export function selectArms(raw) {
  const letters =
    raw === undefined
      ? [...DEFAULT_ARM_LETTERS]
      : raw
          .toUpperCase()
          .split(/[^A-Z]+/u)
          .filter((token) => token !== '')
          .flatMap((token) => [...token]);
  if (letters.length === 0) {
    throw new Error(`eval: --arms selected no arm; the arm table declares ${declaredLetters()}`);
  }

  const selected = [];
  for (const letter of letters) {
    const arm = armForLetter(letter);
    if (arm.mode === null) {
      throw new Error(
        `eval: arm ${arm.letter} runs no search of its own and cannot be selected with --arms; ` +
          'its row is rendered from the records --transcript supplies',
      );
    }
    if (!selected.includes(arm)) selected.push(arm);
  }
  return ARMS.filter((arm) => selected.includes(arm));
}

/** `embedder` with every `embedQuery` counted; `calls` is read after the arm has run. */
function countingEmbedder(embedder, counter) {
  return {
    id: embedder.id,
    dimensions: embedder.dimensions,
    embedDocuments: (texts) => embedder.embedDocuments(texts),
    embedQuery: (text) => {
      counter.embedCalls += 1;
      return embedder.embedQuery(text);
    },
  };
}

/** `reranker` with every `score` counted, on the same terms. */
function countingReranker(reranker, counter) {
  return {
    id: reranker.id,
    score: (query, passages) => {
      counter.rerankCalls += 1;
      return reranker.score(query, passages);
    },
  };
}

/** The ordered refs of a result, which is what a repetition is compared on. */
function refsOf(result) {
  return result.hits.map((hit) => hit.ref);
}

/**
 * Runs one arm over `queries` and returns `{ letter, mode, embedCalls, rerankCalls, records }`.
 *
 * `arm` is a {@link ARMS} entry and its `mode` is read off that entry — there is no letter test in
 * this module's run path. Each record is `{ id, arm, hits: [{ ref, score }], abstained,
 * bestRerankScore, durationMs }` plus `warnings`, where `durationMs` is one entry per repetition and
 * `hits`, `abstained` and `bestRerankScore` are the **first** repetition's, which is the one scored.
 * `bestRerankScore` is `SearchResult.bestRerankScore` carried through: the score abstention tested,
 * present whether or not it abstained, and `null` in every mode that does not rerank.
 *
 * With `repeat > 1` every query is run once per repetition, in query order, and every duration is
 * kept. A repetition whose ordered refs differ from the first repetition's is recorded as a
 * non-determinism warning on that record: an averaged-away difference would move recall and MRR
 * without saying so, and `evals/docs-retrieval/floor.json`'s numbers are taken from these records.
 *
 * `performance.now()` brackets the `searchDocs` call alone, so the timing excludes this loop.
 */
export async function runArm({ session, arm, queries, k, repeat = 1 }) {
  const counter = { embedCalls: 0, rerankCalls: 0 };
  const embedder = countingEmbedder(session.embedder, counter);
  const reranker = countingReranker(session.reranker, counter);

  const records = new Map(
    queries.map((query) => [
      query.id,
      {
        id: query.id,
        arm: arm.letter,
        hits: [],
        abstained: false,
        bestRerankScore: null,
        durationMs: [],
        warnings: [],
      },
    ]),
  );

  for (let repetition = 0; repetition < repeat; repetition += 1) {
    for (const query of queries) {
      const record = records.get(query.id);
      const started = performance.now();
      const result = await searchDocs({
        store: session.store,
        embedder,
        reranker,
        query: query.query,
        k,
        mode: arm.mode,
      });
      record.durationMs.push(performance.now() - started);

      const refs = refsOf(result);
      if (repetition === 0) {
        record.hits = result.hits.map((hit) => ({ ref: hit.ref, score: hit.score }));
        record.abstained = result.abstained;
        record.bestRerankScore = result.bestRerankScore ?? null;
      } else if (refs.join('\u0000') !== record.hits.map((hit) => hit.ref).join('\u0000')) {
        record.warnings.push(
          `repetition ${repetition + 1} returned [${refs.join(', ')}], ` +
            `which differs from repetition 1's [${record.hits.map((hit) => hit.ref).join(', ')}]`,
        );
      }
    }
  }

  return {
    letter: arm.letter,
    mode: arm.mode,
    embedCalls: counter.embedCalls,
    rerankCalls: counter.rerankCalls,
    records: queries.map((query) => records.get(query.id)),
  };
}
