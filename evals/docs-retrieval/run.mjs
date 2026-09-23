/**
 * The docs-retrieval eval's entry module: one pass over one corpus, and the result object every
 * other reader of this eval takes its figures from.
 *
 * **The rule this module exists to enforce: the generated region of
 * `docs/retrieval-eval-results.md` has exactly one writer, and arm A's row is generated like every
 * other row.** `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A
 * responsibility that already has a home does not get a second one."* A hand run of arm A is
 * published by re-running the eval with `--out … --transcript …`, never by typing numbers between
 * the markers — the next `--out` run destroys anything hand-edited there.
 *
 * This module is orchestration only: the corpus is resolved by `evals/docs-retrieval/corpora.mjs`,
 * the index built by `evals/docs-retrieval/index-build.mjs`, the labels checked by
 * `evals/docs-retrieval/queries.mjs`, the arms declared and driven by
 * `evals/docs-retrieval/arms.mjs`, the figures computed by `evals/docs-retrieval/metrics.mjs` and
 * rendered by `evals/docs-retrieval/results.mjs`. Label hygiene is asserted **before any arm runs**,
 * so a stale label costs a refusal rather than a silently worse number.
 *
 * `--transcript` is read here and nowhere else. Its scorer,
 * `evals/docs-retrieval/arm-a/score-transcript.mjs` → `scoreTranscript`, ships after this module:
 * the flag's contract exists before its producer does, and a run given `--transcript` before that
 * module lands is refused by name rather than assumed away.
 *
 * Nothing here is reached by a bare `node evals/…` tool call, which matches no entry in the
 * unattended permission profile and stalls the run. The two routes are
 * `bash scripts/scratch-run.sh <file under harness-runs/scratch/>` and a command inside
 * `scripts/run-gates.sh`, which is why {@link main} exists.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { platform, release } from 'node:os';
import { basename, isAbsolute, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARMS, runArm, selectArms } from './arms.mjs';
import { corpusConfig } from './corpora.mjs';
import { buildIndex } from './index-build.mjs';
import { scoreArm } from './metrics.mjs';
import { parseArgs } from './args.mjs';
import { assertLabelsResolve, loadQueries } from './queries.mjs';
import { renderCorpusTable, rewriteGeneratedRegion } from './results.mjs';

/** `scoreTranscript`, refused by name when the module that owns it has not landed yet. */
async function loadTranscriptScorer() {
  const specifier = './arm-a/score-transcript.mjs';
  try {
    const module = await import(specifier);
    if (typeof module.scoreTranscript !== 'function') {
      throw new Error('it exports no scoreTranscript function');
    }
    return module.scoreTranscript;
  } catch (error) {
    throw new Error(
      `eval: --transcript is read through evals/docs-retrieval/arm-a/score-transcript.mjs → ` +
        `scoreTranscript, which could not be loaded: ${error.message}`,
    );
  }
}

/** The arm A entry of the declared table: the one arm with no `SearchMode` of its own. */
function navigationArm() {
  const arm = ARMS.find((entry) => entry.mode === null);
  if (arm === undefined) throw new Error('eval: the arm table declares no navigation arm to score a transcript into');
  return arm;
}

/** `scoreTranscript`'s return, whether it hands back records alone or records with a token cost. */
function transcriptRecords(scored) {
  if (Array.isArray(scored)) return { records: scored, cost: undefined };
  return { records: scored.records, cost: scored.cost };
}

/**
 * The query set's path as the provenance renders it: relative to `checkout` when the set lies inside
 * it, else to `repo` when it lies inside that; `undefined` when neither holds, because a path that
 * begins with `..` or is absolute names where this checkout or the corpus sits on the machine.
 */
function queriesProvenancePath({ checkout, repo, queries }) {
  for (const root of [checkout, repo]) {
    if (root === undefined) continue;
    const path = relative(root, queries);
    if (path !== '' && !path.startsWith('..') && !isAbsolute(path)) return path.split(sep).join('/');
  }
  return undefined;
}

/**
 * One eval pass. `options` is `evals/docs-retrieval/args.mjs` → `parseArgs`'s shape.
 *
 * Returns the corpus result object every downstream reader takes its figures from — the arms with
 * their metrics and per-query records, and **`snapshot`, set from the `{ files, chunks }` object
 * `buildIndex` returned and passed through unchanged**, so a caller gets the corpus stamp with the
 * figures rather than deriving one of its own.
 *
 * With `out` it rewrites that file's marked region and writes nothing else. With no `out` it writes
 * nothing at all and prints the arm table and the labelled snapshot stamp to stdout.
 */
export async function runEval(options) {
  const queriesPath = queriesProvenancePath(options);
  if (queriesPath === undefined && options.out !== undefined) {
    throw new Error(
      `eval: --out refused: the query set ${basename(options.queries)} lies inside neither this checkout nor ` +
        '--repo, so its provenance path would climb out of both or be absolute; commit the set under ' +
        'evals/docs-retrieval/queries/ and pass that path',
    );
  }

  const { id, config, repoRoot } = corpusConfig({
    repoRoot: options.repo,
    corpus: options.corpus,
    docsRoot: options.docsRoot,
    conventions: options.conventions,
    corpusId: options.corpusId,
  });

  const session = await buildIndex({ repoRoot, config, dataDir: options.dataDir });
  try {
    const queries = loadQueries(options.queries);
    assertLabelsResolve(queries, session.chunkKeys, id);

    const arms = [];
    for (const arm of selectArms(options.arms)) {
      const run = await runArm({ session, arm, queries, k: options.k, repeat: options.repeat });
      arms.push({ ...run, metrics: scoreArm(run.records, queries) });
    }

    if (options.transcript !== undefined) {
      const scoreTranscript = await loadTranscriptScorer();
      const { records, cost } = transcriptRecords(await scoreTranscript({ transcript: options.transcript, queries }));
      const arm = navigationArm();
      arms.push({
        letter: arm.letter,
        mode: arm.mode,
        embedCalls: 0,
        rerankCalls: 0,
        cost,
        records,
        metrics: scoreArm(records, queries),
      });
    }

    const corpus = {
      id,
      config,
      repoRoot,
      snapshot: session.snapshot,
      warnings: session.warnings,
      queries: {
        // Repo-relative, because the rendered provenance is committed and nothing in this tree may
        // name a location on the machine that wrote it (`scripts/run-gates.sh` gate 6a) — so a path
        // climbing out of both roots is refused above, and a stdout-only run prints the basename.
        path: queriesPath ?? basename(options.queries),
        positives: queries.filter((query) => query.labels.length > 0).length,
        negatives: queries.filter((query) => query.labels.length === 0).length,
      },
      k: options.k,
      repeat: options.repeat,
      embedderId: session.embedder.id,
      rerankerId: session.reranker.id,
      host: `${platform()} ${release()}`,
      node: process.version,
      generatedAt: new Date().toISOString(),
      arms,
    };

    if (options.out === undefined) {
      console.log(renderCorpusTable(corpus));
      console.log(`\ncorpus ${corpus.id} snapshot: { files: ${corpus.snapshot.files}, chunks: ${corpus.snapshot.chunks} }`);
    } else {
      writeFileSync(options.out, rewriteGeneratedRegion(readFileSync(options.out, 'utf8'), corpus), 'utf8');
    }

    return corpus;
  } finally {
    await session.close();
  }
}

/** The direct-invocation entry `scripts/run-gates.sh` uses; every other caller imports `runEval`. */
export async function main(argv = process.argv.slice(2)) {
  await runEval(parseArgs(argv));
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
