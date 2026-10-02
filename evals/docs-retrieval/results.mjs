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
 * string is written here, so a fifth mode added to `SEARCH_MODES` gains a row for free. Arm A's rows
 * are part of that same walk: one per result `evals/docs-retrieval/run.mjs` scored out of a
 * `--transcript`, its `Arm` cell carrying the result's `variant` where it has one, and a single `—`
 * placeholder row when there are none.
 *
 * **The write is bounded by markers.** {@link GENERATED_START} and {@link GENERATED_END} fence the
 * only bytes {@link rewriteGeneratedRegion} touches; everything outside them — the hand-written
 * sections later tasks fill — survives byte for byte, and a target carrying anything but exactly one
 * of each marker is refused by name. Inside the region each corpus owns its own block, so running
 * one corpus does not erase another's figures — one block per corpus and backend, keyed by
 * `evals/docs-retrieval/backends.mjs` → `corpusBlockId`, so a run naming a backend writes beside the
 * unlabelled block rather than over it. A block {@link transplantCorpusBlock} moves between results
 * files is bytes this module rendered in an earlier pass, so the region still has exactly one writer.
 */

import { ABSTAIN_SCORE_THRESHOLD } from '../../cli/dist/retrieval/search.js';
import { RETRIEVAL_STUB_ENV } from '../../cli/dist/retrieval/models.js';
import { ARMS } from './arms.mjs';
import { BACKENDS, corpusBlockId } from './backends.mjs';

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

/**
 * The provenance bullet a run naming a backend gains, per {@link BACKENDS} entry: the route its figures
 * were measured through. Checked against {@link BACKENDS} at load, so a backend added there without a
 * route here is refused by name rather than rendered with no provenance.
 */
const BACKEND_ROUTES = Object.freeze({
  typescript: [
    "- Backend `typescript`: this checkout's `cli/dist` driven in process — the same path as the unlabelled",
    '  block, run again in this session.',
  ],
  python: [
    '- Backend `python`: `harness-docs-retrieval serve-http` over a throwaway mirror of the corpus, each arm',
    "  through `POST /search` with its `mode`; latency is the server's own `search_ms` — `search_docs` alone,",
    '  timed inside the Python process, excluding the per-call refresh and the HTTP hop; the connection string',
    '  is not recorded.',
  ],
});
for (const backend of BACKENDS) {
  if (BACKEND_ROUTES[backend] === undefined) {
    throw new Error(
      `eval: backend ${backend} has no provenance route in evals/docs-retrieval/results.mjs → BACKEND_ROUTES`,
    );
  }
}

/**
 * One block inside the region, keyed by block id — the corpus id for a run naming no backend,
 * `<corpus>@<backend>` otherwise — so a single-corpus run leaves every other block alone.
 */
function corpusStart(blockId) {
  return `<!-- eval:corpus:${blockId}:start -->`;
}
function corpusEnd(blockId) {
  return `<!-- eval:corpus:${blockId}:end -->`;
}

/** The block id `corpus`'s figures are written under. */
function blockIdOf(corpus) {
  return corpusBlockId(corpus.id, corpus.backend);
}

/** The block's heading; a run naming no backend renders today's heading byte for byte. */
function heading(corpus) {
  return corpus.backend === undefined
    ? `### Corpus \`${corpus.id}\``
    : `### Corpus \`${corpus.id}\` — backend \`${corpus.backend}\``;
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

/** The `Arm` cell: the entry's letter, suffixed with the result's variant when it carries one. */
function armLabel(arm, result) {
  return result?.variant ? `${arm.letter}-${result.variant}` : arm.letter;
}

/** One table row per result of an {@link ARMS} entry, or per entry when that arm did not run. */
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
    armLabel(arm, result),
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

/**
 * The results of `arm` in this pass, in the order `run.mjs` pushed them: one per library arm that ran,
 * one per scored transcript for arm A, and `[undefined]` when the arm did not run, so the walk still
 * renders its one placeholder row.
 */
function resultsFor(corpus, arm) {
  const results = corpus.arms.filter((entry) => entry.letter === arm.letter);
  return results.length === 0 ? [undefined] : results;
}

/** The human half: the arm table, its footnote, and the comparability sentence. */
function tableSection(corpus) {
  const header = [row(COLUMNS), row(COLUMNS.map(() => '---'))];
  const body = ARMS.flatMap((arm) => resultsFor(corpus, arm).map((result) => armRow(arm, result)));
  return [
    ...header,
    ...body,
    '',
    `Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its rows are`,
    `filled by re-running the eval with one \`--transcript\` per variant against a hand-run transcript, per the`,
    'procedure in `docs/retrieval-eval.md` → `## Running arm A by hand`. The arm A rows, when present, are each',
    "scored from the **first repetition's** transcript of that variant; the spread across repetitions is",
    'hand-written below the end marker.',
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
    ...(corpus.backend === undefined ? [] : BACKEND_ROUTES[corpus.backend]),
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

/** The opening and closing fence lines {@link machineSection} wraps its payload in. */
const JSON_FENCE_OPEN = '```json\n';
const JSON_FENCE_CLOSE = '\n```';

/**
 * The machine half: every per-query record of every arm that ran, plus the stamp beside them. Each
 * arm A entry carries `variant`, `null` for an unlabelled transcript or for no transcript at all.
 */
function machineSection(corpus) {
  const payload = {
    corpus: corpus.id,
    ...(corpus.backend === undefined ? {} : { backend: corpus.backend }),
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
    arms: ARMS.flatMap((arm) =>
      resultsFor(corpus, arm).map((result) => {
        const variant = arm.mode === null ? { variant: result?.variant ?? null } : {};
        if (result === undefined) return { arm: arm.letter, ...variant, mode: arm.mode, ran: false };
        return {
          arm: arm.letter,
          ...variant,
          mode: arm.mode,
          ran: true,
          embedCalls: result.embedCalls,
          rerankCalls: result.rerankCalls,
          metrics: result.metrics,
        };
      }),
    ),
  };
  return `${JSON_FENCE_OPEN}${JSON.stringify(payload, null, 2)}${JSON_FENCE_CLOSE}`;
}

/** One corpus's whole block: heading, table, provenance, machine half, between its own markers. */
export function renderCorpusBlock(corpus) {
  return [
    corpusStart(blockIdOf(corpus)),
    heading(corpus),
    '',
    tableSection(corpus),
    '',
    provenanceSection(corpus),
    '',
    machineSection(corpus),
    corpusEnd(blockIdOf(corpus)),
  ].join('\n');
}

/** The table and its heading alone — what a run given no `--out` prints to stdout. */
export function renderCorpusTable(corpus) {
  return [heading(corpus), '', tableSection(corpus)].join('\n');
}

/**
 * Replaces `corpus`'s block inside `text`'s generated region, leaving every byte outside the region
 * — and every other corpus's block inside it — untouched. Refuses by name when the region markers
 * are not each present exactly once.
 */
export function rewriteGeneratedRegion(text, corpus) {
  return spliceBlock(text, blockIdOf(corpus), renderCorpusBlock(corpus));
}

/**
 * `text` with `block` in place of `blockId`'s block inside the generated region, or appended to the
 * region when it carries none. Refuses by name when the region markers are not each present exactly once.
 */
function spliceBlock(text, blockId, block) {
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

  const start = corpusStart(blockId);
  const end = corpusEnd(blockId);
  const blockAt = region.indexOf(start);
  const blockEnd = region.indexOf(end);
  const rewritten =
    blockAt === -1 || blockEnd === -1
      ? `${region.trimEnd()}\n\n${block}\n\n`
      : `${region.slice(0, blockAt)}${block}${region.slice(blockEnd + end.length)}`;

  return `${before}${rewritten.startsWith('\n') ? '' : '\n'}${rewritten}${after}`;
}

/**
 * The parsed fenced-`json` machine half of one block inside `text`'s generated region — the
 * payload {@link machineSection} rendered. The one reader of the block {@link renderCorpusBlock}
 * writes, so the marker spelling and the block layout stay this module's alone.
 *
 * `corpusId` is the **block id** (`evals/docs-retrieval/backends.mjs` → `corpusBlockId`), which equals
 * the corpus id for an unlabelled block; `<corpus>@<backend>` reads a backend's block.
 *
 * Refuses, naming `corpusId`, when the region markers are not each present exactly once, when the
 * block's start or end marker is missing from the region, and when the block carries no fenced
 * `json` or one that does not parse.
 */
export function readCorpusMachineHalf(text, corpusId) {
  for (const marker of [GENERATED_START, GENERATED_END]) {
    if (!occursExactlyOnce(text, marker)) {
      throw new Error(
        `eval: cannot read corpus ${corpusId}: the results file must carry exactly one ${marker}, ` +
          'and it is missing or repeated',
      );
    }
  }
  const region = text.slice(text.indexOf(GENERATED_START) + GENERATED_START.length, text.indexOf(GENERATED_END));

  const start = corpusStart(corpusId);
  const end = corpusEnd(corpusId);
  const blockAt = region.indexOf(start);
  const blockEnd = region.indexOf(end);
  if (blockAt === -1 || blockEnd === -1 || blockEnd < blockAt) {
    throw new Error(`eval: the generated region carries no block for corpus ${corpusId} (${start} … ${end})`);
  }
  const block = region.slice(blockAt + start.length, blockEnd);

  const openAt = block.indexOf(JSON_FENCE_OPEN);
  const closeAt = openAt === -1 ? -1 : block.indexOf(JSON_FENCE_CLOSE, openAt + JSON_FENCE_OPEN.length - 1);
  if (openAt === -1 || closeAt === -1) {
    throw new Error(`eval: the block for corpus ${corpusId} carries no fenced json machine half`);
  }
  try {
    return JSON.parse(block.slice(openAt + JSON_FENCE_OPEN.length, closeAt));
  } catch (error) {
    throw new Error(`eval: the fenced json machine half of corpus ${corpusId} does not parse: ${error.message}`);
  }
}

/**
 * `targetText` with `blockId`'s block copied in from `sourceText`'s generated region — start marker
 * through end marker, byte for byte — replacing a same-id block there or appended as
 * {@link rewriteGeneratedRegion} appends one. This is how a hand run moves a finished block from its
 * scratch copy into the document of record without a second writer of the region.
 *
 * Refuses, naming `blockId`, when either file's region markers are not each present exactly once, when
 * the source carries no such block, and when the source block's fenced `json` does not parse.
 */
export function transplantCorpusBlock(targetText, sourceText, blockId) {
  for (const [role, text] of [
    ['target', targetText],
    ['source', sourceText],
  ]) {
    for (const marker of [GENERATED_START, GENERATED_END]) {
      if (!occursExactlyOnce(text, marker)) {
        throw new Error(
          `eval: cannot transplant block ${blockId}: the ${role} results file must carry exactly one ${marker}, ` +
            'and it is missing or repeated',
        );
      }
    }
  }
  const region = sourceText.slice(
    sourceText.indexOf(GENERATED_START) + GENERATED_START.length,
    sourceText.indexOf(GENERATED_END),
  );
  const start = corpusStart(blockId);
  const end = corpusEnd(blockId);
  const blockAt = region.indexOf(start);
  const blockEnd = region.indexOf(end);
  if (blockAt === -1 || blockEnd === -1 || blockEnd < blockAt) {
    throw new Error(
      `eval: cannot transplant block ${blockId}: the source's generated region carries no such block (${start} … ${end})`,
    );
  }
  readCorpusMachineHalf(sourceText, blockId);
  return spliceBlock(targetText, blockId, region.slice(blockAt, blockEnd + end.length));
}
