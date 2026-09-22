/**
 * Rendering one docs-retrieval eval run into `docs/retrieval-eval-results.md`'s generated region.
 *
 * **The rule this module exists to enforce: both halves of the file are rendered from one in-memory
 * result object, so they cannot disagree.** The human table and the machine-readable fenced `json`
 * block are two renderings of the same figures; nothing is retyped between them, and no figure is
 * computed here. In particular this module **counts nothing**: the corpus `snapshot` it prints is
 * the `{ files, chunks }` object `evals/docs-retrieval/index-build.mjs` → `buildIndex` returned,
 * carried through unchanged, and the corpus id is printed beside it — two `self-docs` figures
 * carrying different stamps are not a before/after pair
 * (`evals/docs-retrieval/corpora.mjs` → the moving-corpus paragraph).
 *
 * **The table is a walk over `evals/docs-retrieval/arms.mjs` → `ARMS`, in its declared order**, one
 * row per entry, with the `Arm` and `Mode` cells read off the entry. No arm letter and no mode
 * string is written here, so a fifth mode added to `SEARCH_MODES` gains a row for free. Arm A's row
 * is part of that same walk: it renders from the records `evals/docs-retrieval/run.mjs` scored out
 * of a `--transcript`, and from a `—` placeholder when there are none.
 *
 * **The write is bounded by markers.** {@link GENERATED_START} and {@link GENERATED_END} fence the
 * only bytes {@link rewriteGeneratedRegion} touches; everything outside them — the hand-written
 * sections later tasks fill — survives byte for byte, and a target carrying anything but exactly one
 * of each marker is refused by name. Inside the region each corpus owns its own block, so running
 * one corpus does not erase another's figures.
 */

import { ABSTAIN_SCORE_THRESHOLD } from '../../cli/dist/retrieval/search.js';
import { RETRIEVAL_STUB_ENV } from '../../cli/dist/retrieval/models.js';
import { ARMS } from './arms.mjs';

/** The literal markers fencing the generated region. Nothing outside them is ever written. */
export const GENERATED_START = '<!-- eval:generated:start -->';
export const GENERATED_END = '<!-- eval:generated:end -->';

/** The cell an unmeasured metric renders as, and the cost cell of an arm awaiting its hand run. */
const EMPTY_CELL = '—';
const AWAITING_COST = 'awaiting hand run';

/**
 * The cost cell of a library arm this pass did not select. It is deliberately not
 * {@link AWAITING_COST}: an arm with a `SearchMode` awaits no hand run, and a partial pass — Task 9's
 * floor check runs one — would otherwise publish arm A's sentence against `fused-rerank`.
 */
const NOT_RUN_COST = 'not run in this pass';

/** The table's columns, in order; `recall@5` is the one the regression floor is taken from. */
const COLUMNS = Object.freeze([
  'Arm',
  'Mode',
  'recall@1',
  'recall@3',
  'recall@5',
  'MRR',
  'strict recall@5',
  'strict MRR',
  'p50 ms',
  'p95 ms',
  'cost',
]);

/** One corpus's block inside the region, so a single-corpus run leaves the other corpus alone. */
function corpusStart(id) {
  return `<!-- eval:corpus:${id}:start -->`;
}
function corpusEnd(id) {
  return `<!-- eval:corpus:${id}:end -->`;
}

/** Exactly-one-occurrence test, without counting: the first and last occurrence are the same one. */
function occursExactlyOnce(text, marker) {
  const first = text.indexOf(marker);
  return first !== -1 && first === text.lastIndexOf(marker);
}

function rate(value) {
  return value === null || value === undefined ? EMPTY_CELL : value.toFixed(3);
}

function millis(value) {
  return value === null || value === undefined ? EMPTY_CELL : value.toFixed(1);
}

function row(cells) {
  return `| ${cells.join(' | ')} |`;
}

/**
 * The cost cell. An arm that ran locally bills no tokens and says what it did instead; an arm whose
 * scorer supplied a cost prints that; and an arm with no result is read off the table entry rather
 * than off the absence — the arm with no mode awaits its hand run, any other was simply not selected.
 */
function costCell(arm, result) {
  if (result === undefined) return arm.mode === null ? AWAITING_COST : NOT_RUN_COST;
  if (result.cost !== undefined) return result.cost;
  return `local — no billed tokens (${result.embedCalls} embed calls, ${result.rerankCalls} rerank calls)`;
}

/** One table row per {@link ARMS} entry, in declared order, whether or not that arm ran. */
function armRow(arm, result) {
  const mode = arm.mode === null ? EMPTY_CELL : `\`${arm.mode}\``;
  if (result === undefined) {
    return row([
      arm.letter,
      mode,
      EMPTY_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      costCell(arm, result),
    ]);
  }
  const { metrics } = result;
  return row([
    arm.letter,
    mode,
    rate(metrics.recall[1]),
    rate(metrics.recall[3]),
    rate(metrics.recall[5]),
    rate(metrics.mrr),
    rate(metrics.strict.recall[5]),
    rate(metrics.strict.mrr),
    millis(metrics.latency.p50),
    millis(metrics.latency.p95),
    costCell(arm, result),
  ]);
}

/** The arm result for a letter, or `undefined` when that arm did not run in this pass. */
function resultFor(corpus, letter) {
  return corpus.arms.find((entry) => entry.letter === letter);
}

/** The human half: the arm table, its footnote, and the comparability sentence. */
function tableSection(corpus) {
  const header = [row(COLUMNS), row(COLUMNS.map(() => '---'))];
  const body = ARMS.map((arm) => armRow(arm, resultFor(corpus, arm.letter)));
  return [
    ...header,
    ...body,
    '',
    `Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its row is`,
    `filled by re-running the eval with \`--transcript\` against a hand-run transcript, per the procedure in`,
    '`docs/retrieval-eval.md` → `## Running arm A by hand`.',
    '',
    "The `cost` column is not a score, and **the arms' scores are not comparable across rows**: the non-reranking",
    'modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode',
    'reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only',
    'within a row.',
  ].join('\n');
}

/** One `layers[]` entry as the provenance prints it: read out of the resolved checkout, not composed here. */
function layerLine(layer) {
  return `  - \`${layer.name}\` (path \`${layer.path}\`) → \`${layer.conventions}\``;
}

/** The provenance half: what was loaded, over which corpus, under which threshold, where and when. */
function provenanceSection(corpus) {
  const layers = corpus.config.layers;
  return [
    '**Provenance.**',
    '',
    `- Corpus \`${corpus.id}\` — snapshot \`{ files: ${corpus.snapshot.files}, chunks: ${corpus.snapshot.chunks} }\`,`,
    `  as the index build of this run reported it. A figure over \`${corpus.id}\` is read with this stamp beside it;`,
    '  two figures carrying different stamps are not a before/after pair.',
    `- \`docs.root\`: \`${corpus.config.docs.root}\`, as the runner set it (the eval owns the retrieval gate and`,
    '  `docs.root` alone).',
    `- The corpus is *every* \`*.md\` under that \`docs.root\`, with no file filtered out, so a document added`,
    "  under it joins the corpus that measures it — and where that root is this checkout's own `docs/`, this",
    '  file, `docs/retrieval-eval-results.md`, is one of its members and is counted in the stamp above. A stamp',
    '  taken before such a document existed is therefore a different corpus.',
    layers[0] === undefined
      ? '- `layers[]`: none — this corpus is read as a repository of its own and carries no conventions documents.'
      : "- `layers[]`, read out of the resolved checkout's `harness.config.json` and never composed here:",
    ...layers.map(layerLine),
    `- Query set: \`${corpus.queries.path}\` — ${corpus.queries.positives} positive, ${corpus.queries.negatives} negative.`,
    `- \`k\`: ${corpus.k}; repetitions per query: ${corpus.repeat}.`,
    `- Embedder: \`${corpus.embedderId}\`. Reranker: \`${corpus.rerankerId}\` — loaded and run outside the stub.`,
    `- \`${RETRIEVAL_STUB_ENV}\` was unset for this run, which the index build refuses to proceed without.`,
    `- Abstention threshold in force: \`${ABSTAIN_SCORE_THRESHOLD}\`, read off the \`search.js\` this run loaded.`,
    '- The figures above are the **post-calibration** ones for the one arm that threshold applies to. The',
    '  pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold',
    '  calibration` below, taken at the earlier snapshot that section records by corpus name and chunk count —',
    '  so both variables that moved between the two readings, the threshold and the corpus, are named.',
    `- Host \`${corpus.host}\`, Node \`${corpus.node}\`, ${corpus.generatedAt}.`,
  ].join('\n');
}

/** The machine half: every per-query record of every arm that ran, plus the stamp beside them. */
function machineSection(corpus) {
  const payload = {
    corpus: corpus.id,
    snapshot: corpus.snapshot,
    abstainScoreThreshold: ABSTAIN_SCORE_THRESHOLD,
    embedder: corpus.embedderId,
    reranker: corpus.rerankerId,
    k: corpus.k,
    repeat: corpus.repeat,
    queries: corpus.queries,
    generatedAt: corpus.generatedAt,
    host: corpus.host,
    node: corpus.node,
    arms: ARMS.map((arm) => {
      const result = resultFor(corpus, arm.letter);
      if (result === undefined) return { arm: arm.letter, mode: arm.mode, ran: false };
      return {
        arm: arm.letter,
        mode: arm.mode,
        ran: true,
        embedCalls: result.embedCalls,
        rerankCalls: result.rerankCalls,
        metrics: result.metrics,
      };
    }),
  };
  return ['```json', JSON.stringify(payload, null, 2), '```'].join('\n');
}

/** One corpus's whole block: heading, table, provenance, machine half, between its own markers. */
export function renderCorpusBlock(corpus) {
  return [
    corpusStart(corpus.id),
    `### Corpus \`${corpus.id}\``,
    '',
    tableSection(corpus),
    '',
    provenanceSection(corpus),
    '',
    machineSection(corpus),
    corpusEnd(corpus.id),
  ].join('\n');
}

/** The table and its heading alone — what a run given no `--out` prints to stdout. */
export function renderCorpusTable(corpus) {
  return [`### Corpus \`${corpus.id}\``, '', tableSection(corpus)].join('\n');
}

/**
 * Replaces `corpus`'s block inside `text`'s generated region, leaving every byte outside the region
 * — and every other corpus's block inside it — untouched. Refuses by name when the region markers
 * are not each present exactly once.
 */
export function rewriteGeneratedRegion(text, corpus) {
  for (const marker of [GENERATED_START, GENERATED_END]) {
    if (!occursExactlyOnce(text, marker)) {
      throw new Error(
        `eval: the results file must carry exactly one ${GENERATED_START} and exactly one ${GENERATED_END}; ` +
          `${marker} is missing or repeated, and this runner writes only between those two markers`,
      );
    }
  }
  const openAt = text.indexOf(GENERATED_START) + GENERATED_START.length;
  const closeAt = text.indexOf(GENERATED_END);
  if (closeAt < openAt) {
    throw new Error(`eval: the results file carries ${GENERATED_END} before ${GENERATED_START}`);
  }

  const before = text.slice(0, openAt);
  const region = text.slice(openAt, closeAt);
  const after = text.slice(closeAt);
  const block = renderCorpusBlock(corpus);

  const start = corpusStart(corpus.id);
  const end = corpusEnd(corpus.id);
  const blockAt = region.indexOf(start);
  const blockEnd = region.indexOf(end);
  const rewritten =
    blockAt === -1 || blockEnd === -1
      ? `${region.trimEnd()}\n\n${block}\n\n`
      : `${region.slice(0, blockAt)}${block}${region.slice(blockEnd + end.length)}`;

  return `${before}${rewritten.startsWith('\n') ? '' : '\n'}${rewritten}${after}`;
}
