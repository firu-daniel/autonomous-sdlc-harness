/**
 * The docs-retrieval eval's regression gate: this run's figures against the recorded floor.
 *
 * **The rule this module exists to enforce: the graded set is
 * `evals/docs-retrieval/arms.mjs` → `ARMS` and `evals/docs-retrieval/floor.json` read against each
 * other, so neither can drift past the other in silence.** Every arm the table carries a `mode` for
 * is run and must have a floor entry; every arm key `floor.json` carries must be in the table. No arm
 * letter is written in this module — a fifth `SearchMode` gains an arm there and is refused here by
 * name until its floor is recorded.
 *
 * **What the floor is and is not is stated in one place, and it is not this one.**
 * `evals/docs-retrieval/floor.json` → `see` names it: the margin, why the graded corpus is
 * {@link FLOOR_CORPUS} alone, and when a floor is re-recorded. This module compares numbers.
 *
 * **Three exit statuses, because `scripts/run-gates.sh` tells them apart by status alone:** `0` every
 * floor met, `1` a shortfall or a drift between the two sources, and {@link MODEL_CACHE_ABSENT} when
 * the machine-shared model cache is empty — which that script reports as blocked rather than counting
 * among its failures, an empty cache being a provisioning gap rather than a regression
 * (`docs/development.md` §5, gate 11).
 *
 * It is reached as `node evals/docs-retrieval/check-floor.mjs` from inside `scripts/run-gates.sh`,
 * whose commands run as a bash subprocess with no per-command permission check. {@link checkFloor}
 * takes `cacheDir` so the blocked path can be exercised from a scratch run against an empty directory
 * rather than by moving the real cache aside.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { modelFilesPresent } from '../../cli/dist/retrieval/models.js';
import { retrievalModelCacheDir } from '../../cli/dist/retrieval/runtime.js';
import { parseArgs } from './args.mjs';
import { ARMS } from './arms.mjs';
import { runEval } from './run.mjs';

/** The one corpus this gate grades: committed, and moving only when this eval moves. */
export const FLOOR_CORPUS = 'fixture-catalog';

/** The recorded floor, repo-relative, resolved through `--floor` by the one argument surface. */
export const FLOOR_PATH = 'evals/docs-retrieval/floor.json';

/** The status reserved for an empty model cache, and reserved for nothing else. */
export const MODEL_CACHE_ABSENT = 3;

/** The command that fills an empty cache, named in the blocked message rather than described. */
const FETCH_MODELS_COMMAND = 'npx autonomous-sdlc-harness docs fetch-models';

/**
 * The metric keys `floor.json` may name, each with the label a shortfall line prints and the reader
 * that takes it off `evals/docs-retrieval/metrics.mjs` → `scoreArm`'s return. A key outside this
 * table is refused by name.
 */
const METRICS = Object.freeze({
  recallAt5: { label: 'recall@5', read: (metrics) => metrics.recall[5] },
  mrr: { label: 'MRR', read: (metrics) => metrics.mrr },
});

/** Every arm the declared table has a mode to run — the graded set, derived and never listed. */
function gradedArms() {
  return ARMS.filter((arm) => arm.mode !== null);
}

/** `floor.json`'s entries, refused by name when the file, its shape or an entry is not usable. */
function loadFloor(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`eval: the recorded floor at ${path} could not be read: ${error.message}`);
  }
  if (!Array.isArray(parsed.floors) || parsed.floors.length === 0) {
    throw new Error(`eval: ${path} carries no floors[] entries, so this gate would grade nothing`);
  }
  if (typeof parsed.see !== 'string' || parsed.see === '') {
    throw new Error(`eval: ${path} carries no see field naming where the floor policy is stated`);
  }
  for (const entry of parsed.floors) {
    if (typeof entry.value !== 'number' || typeof entry.recordedAt !== 'string') {
      throw new Error(
        `eval: ${path} carries an entry without a numeric value and a recordedAt date: ${JSON.stringify(entry)}`,
      );
    }
    if (entry.corpus !== FLOOR_CORPUS) {
      throw new Error(
        `eval: ${path} carries a floor over corpus ${JSON.stringify(entry.corpus)}; this gate grades ` +
          `${FLOOR_CORPUS} alone, because it is the corpus that moves only when this eval moves`,
      );
    }
    if (METRICS[entry.metric] === undefined) {
      throw new Error(
        `eval: ${path} carries metric ${JSON.stringify(entry.metric)}, which this gate cannot read; ` +
          `the metric keys are ${Object.keys(METRICS).join(', ')}`,
      );
    }
    if (!gradedArms().some((arm) => arm.letter === entry.arm)) {
      throw new Error(
        `eval: ${path} carries a floor for arm ${JSON.stringify(entry.arm)}, which the arm table of ` +
          `evals/docs-retrieval/arms.mjs does not carry as a runnable arm; its runnable arms are ` +
          `${gradedArms().map((arm) => arm.letter).join(', ')}`,
      );
    }
  }
  return parsed;
}

/**
 * Runs {@link FLOOR_CORPUS} over every graded arm and returns the exit status the gate takes.
 *
 * `cacheDir` is the model cache the precondition is read against and `floorPath` the recorded floor,
 * both repo-relative or absolute; the defaults are what the gate runs, and a caller passes another
 * only to exercise the blocked path or to grade a planted copy of the floor.
 */
export async function checkFloor({ cacheDir = retrievalModelCacheDir(), floorPath = FLOOR_PATH } = {}) {
  const models = modelFilesPresent(cacheDir);
  if (!models.present) {
    console.error(
      `check-floor: the retrieval model cache under ${cacheDir} is incomplete, so no figure can be ` +
        `taken; missing: ${models.missing.join(', ')}. Run ${FETCH_MODELS_COMMAND}`,
    );
    return MODEL_CACHE_ABSENT;
  }

  const letters = gradedArms().map((arm) => arm.letter);
  const options = parseArgs(['--corpus', FLOOR_CORPUS, '--arms', letters.join(''), '--floor', floorPath]);
  const floor = loadFloor(options.floor);

  for (const letter of letters) {
    if (!floor.floors.some((entry) => entry.arm === letter)) {
      console.error(
        `check-floor: arm ${letter} is a runnable arm of evals/docs-retrieval/arms.mjs with no entry in ` +
          `${floorPath}, so this gate would grade nothing about it. Record its floor there (${floor.see})`,
      );
      return 1;
    }
  }

  const corpus = await runEval({ ...options, out: undefined });
  for (const entry of floor.floors) {
    const arm = corpus.arms.find((result) => result.letter === entry.arm);
    if (arm === undefined) {
      console.error(`check-floor: arm ${entry.arm} carries a floor and produced no result in this run`);
      return 1;
    }
    const metric = METRICS[entry.metric];
    const measured = metric.read(arm.metrics);
    if (measured < entry.value) {
      console.error(
        `check-floor: ${corpus.id} arm ${entry.arm} ${metric.label} floor ${entry.value} ` +
          `(recorded ${entry.recordedAt}), measured ${measured} — below the floor. ` +
          `Snapshot { files: ${corpus.snapshot.files}, chunks: ${corpus.snapshot.chunks} }. ${floor.see}`,
      );
      return 1;
    }
  }

  console.log(
    `check-floor: ${corpus.id} met every recorded floor — ${floor.floors.length} over ` +
      `${letters.length} arms, snapshot { files: ${corpus.snapshot.files}, chunks: ${corpus.snapshot.chunks} }`,
  );
  return 0;
}

/** The direct-invocation entry `scripts/run-gates.sh` uses; the status is the gate's whole answer. */
export async function main() {
  process.exitCode = await checkFloor();
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
