/**
 * The candidate end-state rule for the BM25 index, measured at refresh level through each backend's own
 * refresh: after a refresh that left a dead row, `REINDEX INDEX chunks_bm25`; after any other refresh
 * that changed something, `bm25_spill_index('chunks_bm25')`; the first `docs index` build ends in the
 * same state.
 *
 * **The rule this module exists to enforce: the rule's statements are issued by hand, because the
 * shipped refresh does not issue them yet; every reading is compared against fresh builds of the final
 * corpus taken in the same run, never against a remembered figure; and every mirror, data directory and
 * database this module creates is removed on every exit path, failure included** (`harness-runs/lessons.md`
 * → `## Remote and branch-scoped operations`, the temporary-copy rule). Its `before` readings are the
 * shipped code's end state; its `after` readings are the state the rule would leave.
 *
 * A refresh is the backend's own: on TypeScript `openPgliteStore` → `refreshIndex` → `close`, as
 * `docs index` does through `openRetrieval`; on Python the package's `index` through
 * `evals/docs-retrieval/python-backend.mjs` → `indexPythonCorpus`, against a database of this module's own.
 * Every engine, statement and reading is `evals/docs-retrieval/bm25-history.mjs`'s, imported and never
 * copied. On PGlite no route reads the store's own instance, so every reading opens the data directory
 * again after the store closed, and each `before` reading is labelled as read after a reopen. No time is
 * measured here.
 */

import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { parseArgs as parseFlags } from 'node:util';

import { chunkMarkdown } from '../../cli/dist/retrieval/chunk.js';
import { resolveModels } from '../../cli/dist/retrieval/models.js';
import { PYTHON_DATABASE_URL_VARIABLE, PYTHON_DEFAULT_DATABASE_URL } from '../../cli/dist/retrieval/pythonBackend.js';
import { refreshIndex } from '../../cli/dist/retrieval/refresh.js';
import { CHUNKS_TABLE, openPgliteStore } from '../../cli/dist/retrieval/store.js';
import { parseArgs } from './args.mjs';
import { BACKENDS } from './backends.mjs';
import {
  BM25_HISTORY_STATEMENTS,
  SCORE_COLUMNS,
  differencesByColumn,
  openPgliteEngine,
  openPostgresEngine,
  readIndexState,
  renderIndexState,
  scoreLines,
  spillAvailable,
  stamp,
} from './bm25-history.mjs';
import { BUILT_IN_CORPORA, corpusConfig } from './corpora.mjs';
import { assertRealModelsAreAvailable } from './index-build.mjs';
import { buildMirrorFixture, removeMirrorFixture } from './mirror-fixture.mjs';
import { assertPythonBackendAvailable, indexPythonCorpus } from './python-backend.mjs';
import { loadQueries } from './queries.mjs';

/** Where a corpus's query set lives (`evals/docs-retrieval/args.mjs` → `QUERIES_DIR`). */
const QUERIES_DIR = 'evals/docs-retrieval/queries';

/** How many differing hits a comparison lists with both values. */
const LISTED_DIFFERENCES = 3;

/** Appended to `F` for the `file-edited` scenario's prior state; fixed so a re-run edits identically. */
const EDIT_PARAGRAPH = '\n\nThis paragraph was appended by the BM25 refresh-rule measurement, so this section stores a different hash.\n';

const STORED_HASHES = `SELECT key, hash FROM ${CHUNKS_TABLE}`;

/** The final-corpus variants, each with a fresh reference build. */
const VARIANTS = Object.freeze({ full: 'full', withoutF: 'without-f' });

/** The three ways a reference build is read, in the order each comparison lists them. */
const REFERENCE_FORMS = Object.freeze(['insert', 'spill', 'reindex']);

/**
 * Each scenario: the mirror state of its prior refresh (`undefined` for an empty store, `other` for
 * corpus B) and of its last refresh, which is the final corpus.
 */
const SCENARIOS = Object.freeze([
  { id: 'fresh', label: 'empty -> A', prior: undefined, final: 'full' },
  { id: 'other-corpus', label: 'B -> A', prior: 'other', final: 'full' },
  { id: 'file-added', label: 'A without F -> A', prior: 'without-f', final: 'full' },
  { id: 'file-edited', label: 'A with F edited -> A', prior: 'edited', final: 'full' },
  { id: 'file-removed', label: 'A -> A without F', prior: 'full', final: 'without-f' },
  { id: 'unchanged', label: 'A -> A', prior: 'full', final: 'full' },
]);

function refuse(message) {
  throw new Error(`eval: bm25 refresh rule: ${message}`);
}

/**
 * The rule's decision for one refresh. `updatedExisting` is the number of keys stored before and after
 * the refresh with a different hash; an upsert over an existing key leaves a dead row, as a delete does.
 */
export function endStateRule({ deleted, rebuilt, embedded, updatedExisting }) {
  if (deleted > 0 || rebuilt || updatedExisting > 0) return 'reindex';
  if (embedded > 0) return 'spill';
  return 'none';
}

function chunksOf(root, files) {
  return files.flatMap((path) => chunkMarkdown(path, readFileSync(join(root, path), 'utf8')));
}

/** Runs `body`, then every cleanup registered so far in reverse order; a body failure outranks a cleanup failure. */
async function withCleanups(body) {
  const cleanups = [];
  let result;
  let failure;
  try {
    result = await body((cleanup) => cleanups.push(cleanup));
  } catch (error) {
    failure = error;
  }
  const errors = [];
  for (const cleanup of cleanups.reverse()) {
    try {
      await cleanup();
    } catch (error) {
      errors.push(error);
    }
  }
  if (failure !== undefined) throw failure;
  if (errors.length > 0) refuse(`${errors.length} cleanup(s) failed: ${errors.map((error) => error.message).join('; ')}`);
  return result;
}

/** The TypeScript backend: one PGlite data directory per store, refreshed as `docs index` refreshes it. */
async function typescriptBackend() {
  assertRealModelsAreAvailable();
  const { embedder } = await resolveModels({ allowRemote: false });
  return {
    name: 'typescript',
    engine: 'pglite',
    rebuildReported: true,
    createStore() {
      const dataDir = mkdtempSync(join(tmpdir(), 'bm25-refresh-rule-'));
      return {
        async refresh(mirror) {
          const store = await openPgliteStore({ dataDir, dimensions: embedder.dimensions });
          try {
            return await refreshIndex({ repoRoot: mirror.dir, config: mirror.config, store, embedder });
          } finally {
            await store.close();
          }
        },
        openEngine: () => openPgliteEngine({ dataDir }),
        remove: () => rmSync(dataDir, { recursive: true, force: true }),
      };
    },
  };
}

/** The Python backend: one compose database per store, refreshed by the package's own `index`. */
function pythonBackend(checkout, fixtureDir) {
  const prior = process.env[PYTHON_DATABASE_URL_VARIABLE];
  if (prior !== undefined && prior !== '' && prior !== PYTHON_DEFAULT_DATABASE_URL) {
    refuse(
      `${PYTHON_DATABASE_URL_VARIABLE} is set to something other than the default URL, and every reading goes ` +
        "through the compose server's psql; unset it and re-run",
    );
  }
  assertPythonBackendAvailable({ checkout, fixtureDir });
  return {
    name: 'python',
    engine: 'postgres',
    rebuildReported: false,
    createStore(id) {
      const database = `bm25_refresh_rule_${id.replace(/-/g, '_')}`;
      const owner = openPostgresEngine(checkout, { database, create: true });
      const url = new URL(PYTHON_DEFAULT_DATABASE_URL);
      url.pathname = `/${database}`;
      return {
        async refresh(mirror) {
          const previous = process.env[PYTHON_DATABASE_URL_VARIABLE];
          process.env[PYTHON_DATABASE_URL_VARIABLE] = url.toString();
          try {
            return await indexPythonCorpus({ checkout, fixtureDir: mirror.dir });
          } finally {
            if (previous === undefined) delete process.env[PYTHON_DATABASE_URL_VARIABLE];
            else process.env[PYTHON_DATABASE_URL_VARIABLE] = previous;
          }
        },
        openEngine: async () => openPostgresEngine(checkout, { database, create: false }),
        remove: () => owner.close(),
      };
    },
  };
}

async function storedHashes(store) {
  const engine = await store.openEngine();
  try {
    const [text] = await engine.run([{ sql: STORED_HASHES }]);
    const hashes = new Map();
    for (const line of text.split('\n')) {
      if (line === '') continue;
      const at = line.lastIndexOf(' ');
      hashes.set(line.slice(0, at), line.slice(at + 1));
    }
    return hashes;
  } finally {
    await engine.close();
  }
}

function storedChange(before, after) {
  const deleted = [...before.keys()].filter((key) => !after.has(key)).length;
  const added = [...after.keys()].filter((key) => !before.has(key)).length;
  const updatedExisting = [...after].filter(([key, hash]) => before.has(key) && before.get(key) !== hash).length;
  return { before: before.size, after: after.size, deleted, added, updatedExisting };
}

/**
 * The rule's statement, or none, issued through a newly opened engine, then that engine's reading.
 * `statement` is what the output states in its place.
 */
async function issueAndRead(store, kind, spill, read) {
  const engine = await store.openEngine();
  try {
    let statement;
    if (kind === 'reindex') {
      await engine.run([{ sql: BM25_HISTORY_STATEMENTS.reindex }]);
      statement = BM25_HISTORY_STATEMENTS.reindex;
    } else if (kind === 'spill' && spill) {
      await engine.run([{ sql: BM25_HISTORY_STATEMENTS.spill }]);
      statement = BM25_HISTORY_STATEMENTS.spill;
    } else if (kind === 'spill') {
      statement = `bm25_spill_index not available on ${engine.name}; the state is the one the reading's open leaves`;
    } else {
      statement = 'no statement';
    }
    return { statement, state: await read(engine) };
  } finally {
    await engine.close();
  }
}

/** A reading's index-scan scores: the forced re-score where the probe plan was not the index scan. */
const indexScanScores = (state) => state.forced?.scores ?? state.scores;

function compare(state, reference, keys) {
  const forced = [state.forced !== undefined && 'reading', reference.forced !== undefined && 'reference'].filter(Boolean);
  return { forced, byColumn: differencesByColumn(indexScanScores(reference), indexScanScores(state), keys) };
}

/**
 * Measures the rule on `backend` (`typescript` or `python`) with corpus `corpusA` as the final corpus
 * and `corpusB` as the `other-corpus` scenario's prior one. Returns `{ backend, engine, ranAt, server,
 * extversion, spillAvailable, corpora, file, queries, references, scenarios }`: `references` holds each
 * variant's three readings, and each scenario its refreshes, stored-state change, decision, statement,
 * `before` and `after` readings and their comparisons against its variant's references.
 */
export async function measureRefreshRule({ checkout, backend, corpusA, corpusB }) {
  if (!BACKENDS.includes(backend)) refuse(`backend ${backend} is not one of ${BACKENDS.join(', ')}`);
  for (const id of [corpusA, corpusB]) {
    if (!BUILT_IN_CORPORA.includes(id)) refuse(`corpus ${id} is not one of ${BUILT_IN_CORPORA.join(', ')}`);
  }
  if (corpusA === corpusB) refuse('corpus A and corpus B must differ');

  const resolvedA = corpusConfig({ repoRoot: checkout, corpus: corpusA });
  const resolvedB = corpusConfig({ repoRoot: checkout, corpus: corpusB });
  const queriesSet = `${QUERIES_DIR}/${corpusA}.jsonl`;
  const queries = loadQueries(join(checkout, queriesSet));
  const ranAt = new Date().toISOString();

  return withCleanups(async (onExit) => {
    const mirrorA = buildMirrorFixture(checkout, resolvedA);
    onExit(() => removeMirrorFixture(mirrorA.dir));
    const mirrorB = buildMirrorFixture(checkout, resolvedB);
    onExit(() => removeMirrorFixture(mirrorB.dir));

    const file = mirrorA.files.at(-1);
    const fullChunks = chunksOf(resolvedA.repoRoot, mirrorA.files);
    const bChunks = chunksOf(resolvedB.repoRoot, mirrorB.files);
    const fullKeys = new Set(fullChunks.map((chunk) => chunk.key));
    const collision = bChunks.find((chunk) => fullKeys.has(chunk.key));
    if (collision !== undefined) refuse(`key ${collision.key} is in both ${corpusA} and ${corpusB}`);
    const variants = {
      [VARIANTS.full]: { keys: fullKeys },
      [VARIANTS.withoutF]: { keys: new Set(fullChunks.filter((chunk) => chunk.path !== file).map((chunk) => chunk.key)) },
    };
    if (variants[VARIANTS.withoutF].keys.size === 0) refuse(`corpus ${corpusA} holds one file, ${file}, so removing it leaves no final corpus`);

    // The A mirror's state; `F` is reset from the resolved corpus root before each change, never mutated twice.
    const filePath = join(mirrorA.dir, file);
    let mirrorState = 'full';
    const setMirror = (state) => {
      if (state === mirrorState) return;
      if (mirrorState !== 'full') copyFileSync(join(resolvedA.repoRoot, file), filePath);
      if (state === 'without-f') rmSync(filePath);
      if (state === 'edited') appendFileSync(filePath, EDIT_PARAGRAPH);
      mirrorState = state;
    };
    const mirrorFor = (state) => {
      if (state === 'other') return mirrorB;
      setMirror(state);
      return mirrorA;
    };

    const driver = backend === 'typescript' ? await typescriptBackend() : pythonBackend(checkout, mirrorA.dir);
    const read = (variant) => (engine) =>
      readIndexState(engine, queries, { limit: variants[variant].keys.size, keys: variants[variant].keys });

    let server;
    let extversion;
    let spill;
    const open = async (id) => {
      const store = driver.createStore(id);
      onExit(() => store.remove());
      if (spill === undefined) {
        const engine = await store.openEngine();
        try {
          await engine.run(BM25_HISTORY_STATEMENTS.extensions.map((sql) => ({ sql })));
          [server, extversion] = await engine.run([{ sql: BM25_HISTORY_STATEMENTS.version }, { sql: BM25_HISTORY_STATEMENTS.extversion }]);
          spill = await spillAvailable(engine);
        } finally {
          await engine.close();
        }
      }
      return store;
    };

    const references = {};
    const readReferenceForms = async (store, variant, insertState) => {
      const forms = { insert: { statement: 'as left', state: insertState } };
      forms.spill = await issueAndRead(store, 'spill', spill, read(variant));
      forms.reindex = await issueAndRead(store, 'reindex', spill, read(variant));
      references[variant] = forms;
    };

    const withoutFStore = await open(`reference-${VARIANTS.withoutF}`);
    const withoutFBuild = await withoutFStore.refresh(mirrorFor(VARIANTS.withoutF));
    const withoutFInsert = await issueAndRead(withoutFStore, 'none', spill, read(VARIANTS.withoutF));
    await readReferenceForms(withoutFStore, VARIANTS.withoutF, withoutFInsert.state);
    await withoutFStore.remove();

    const scenarios = [];
    for (const scenario of SCENARIOS) {
      const store = await open(scenario.id);
      const prior = scenario.prior === undefined ? undefined : await store.refresh(mirrorFor(scenario.prior));
      const hashesBefore = prior === undefined ? new Map() : await storedHashes(store);
      const finalMirror = mirrorFor(scenario.final);
      const refresh = await store.refresh(finalMirror);
      const hashesAfter = await storedHashes(store);
      const finalKeys = variants[scenario.final].keys;
      const stray = [...hashesAfter.keys()].filter((key) => !finalKeys.has(key));
      const missing = [...finalKeys].filter((key) => !hashesAfter.has(key));
      if (stray.length > 0 || missing.length > 0) {
        refuse(
          `scenario ${scenario.id}: the stored keys are not the final corpus's (${stray.length} stored and not in it, ` +
            `${missing.length} in it and not stored), so no reading describes the corpus`,
        );
      }
      const stored = storedChange(hashesBefore, hashesAfter);
      const inputs = { deleted: stored.deleted, rebuilt: refresh.rebuilt ?? false, embedded: refresh.embedded, updatedExisting: stored.updatedExisting };
      const decision = endStateRule(inputs);

      const beforeReading = await issueAndRead(store, 'none', spill, read(scenario.final));
      const afterReading = await issueAndRead(store, decision, spill, read(scenario.final));
      if (scenario.id === 'fresh') await readReferenceForms(store, VARIANTS.full, beforeReading.state);
      await store.remove();

      scenarios.push({
        ...scenario,
        prior: prior === undefined ? undefined : { mirror: scenario.prior, result: prior },
        refresh,
        stored,
        rule: { decision, inputs },
        statement: afterReading.statement,
        before: beforeReading.state,
        after: afterReading.state,
      });
    }

    for (const scenario of scenarios) {
      const keys = variants[scenario.final].keys;
      scenario.comparisons = Object.fromEntries(
        ['before', 'after'].map((reading) => [
          reading,
          Object.fromEntries(REFERENCE_FORMS.map((form) => [form, compare(scenario[reading], references[scenario.final][form].state, keys)])),
        ]),
      );
    }

    return {
      backend,
      engine: driver.engine,
      rebuildReported: driver.rebuildReported,
      ranAt,
      server,
      extversion,
      spillAvailable: spill,
      corpora: {
        a: { id: corpusA, snapshot: { files: mirrorA.files.length, chunks: fullChunks.length } },
        aWithoutF: { snapshot: { files: mirrorA.files.length - 1, chunks: variants[VARIANTS.withoutF].keys.size } },
        b: { id: corpusB, snapshot: { files: mirrorB.files.length, chunks: bChunks.length } },
      },
      file,
      referenceBuild: { [VARIANTS.withoutF]: withoutFBuild },
      queries: { set: queriesSet, count: queries.length },
      references,
      scenarios,
    };
  });
}

function refreshLine(result, rebuildReported) {
  const rebuilt = result.rebuilt ?? (rebuildReported ? 'unknown' : 'not reported by indexPythonCorpus, taken as false');
  const warnings = result.warnings?.length > 0 ? `; warnings: ${result.warnings.join(' / ')}` : '';
  return `files ${result.files}, chunks ${result.chunks}, embedded ${result.embedded}, unchanged ${result.unchanged}, deleted ${result.deleted}, rebuilt ${rebuilt}${warnings}`;
}

function comparisonLines(stepId, variant, comparisons) {
  const lines = [];
  for (const form of REFERENCE_FORMS) {
    const { forced, byColumn } = comparisons[form];
    const reference = `reference-${form}.${variant}`;
    const reading = forced.length === 0 ? 'default plan' : `index-scan reading, forced on the ${forced.join(' and the ')}`;
    lines.push(`  versus ${reference} (${reading}): ${SCORE_COLUMNS.map((column) => `${column} ${byColumn[column].length}`).join(', ')}`);
    for (const column of SCORE_COLUMNS) {
      for (const hit of byColumn[column].slice(0, LISTED_DIFFERENCES)) {
        lines.push(`    differs ${stepId} ${column} vs ${reference}: ${hit.queryId} ${hit.key} reference ${hit.reference} ${stepId} ${hit.step}`);
      }
    }
  }
  return lines;
}

/** The text a reader records from; `withScores` appends every reading's score lines in the probe's capture format. */
export function renderRefreshRule(result, { withScores = false } = {}) {
  const pgliteBefore = result.engine === 'pglite' ? ', read after a reopen' : '';
  const lines = [
    `bm25-refresh-rule: backend ${result.backend} (engine ${result.engine}), ran ${result.ranAt}`,
    `server: ${result.server}`,
    `pg_textsearch: ${result.extversion}`,
    `bm25_spill_index: ${result.spillAvailable ? 'available' : `not available on ${result.engine}`}`,
    `corpus A: ${result.corpora.a.id} ${stamp(result.corpora.a.snapshot)}; A without F: ${stamp(result.corpora.aWithoutF.snapshot)}; ` +
      `corpus B: ${result.corpora.b.id} ${stamp(result.corpora.b.snapshot)}`,
    `F: ${result.file}`,
    `queries: ${result.queries.count} from ${result.queries.set}`,
    `references: fresh builds of each final-corpus variant in this run; ${VARIANTS.full} is the fresh scenario's build, ` +
      `${VARIANTS.withoutF} built with ${refreshLine(result.referenceBuild[VARIANTS.withoutF], result.rebuildReported)}`,
  ];
  for (const variant of Object.values(VARIANTS)) {
    for (const form of REFERENCE_FORMS) {
      const { statement, state } = result.references[variant][form];
      lines.push('', ...renderIndexState(`reference-${form}.${variant}`, form === 'insert' ? `${statement}${pgliteBefore}` : statement, state));
    }
  }
  for (const scenario of result.scenarios) {
    const { inputs, decision } = scenario.rule;
    lines.push(
      '',
      `scenario ${scenario.id}: ${scenario.label}, final corpus ${scenario.final}`,
      scenario.prior === undefined ? '  prior refresh: none, the store was empty' : `  prior refresh (${scenario.prior.mirror}): ${refreshLine(scenario.prior.result, result.rebuildReported)}`,
      `  refresh: ${refreshLine(scenario.refresh, result.rebuildReported)}`,
      `  stored keys: before ${scenario.stored.before}, after ${scenario.stored.after}; deleted ${scenario.stored.deleted}, ` +
        `added ${scenario.stored.added}, updated existing ${scenario.stored.updatedExisting}`,
      `  rule: ${decision} (deleted ${inputs.deleted}, rebuilt ${inputs.rebuilt}, embedded ${inputs.embedded}, updatedExisting ${inputs.updatedExisting})`,
      `  statement: ${scenario.statement}`,
      ...renderIndexState(`${scenario.id}.before`, `right after the refresh${pgliteBefore}`, scenario.before),
      ...comparisonLines(`${scenario.id}.before`, scenario.final, scenario.comparisons.before),
      ...renderIndexState(`${scenario.id}.after`, `after ${scenario.statement}`, scenario.after),
      ...comparisonLines(`${scenario.id}.after`, scenario.final, scenario.comparisons.after),
    );
  }
  if (withScores) {
    lines.push('');
    // Not a spread: a self-docs capture holds more score lines than one call's argument limit.
    for (const variant of Object.values(VARIANTS)) {
      for (const form of REFERENCE_FORMS) for (const line of scoreLines(`reference-${form}.${variant}`, result.references[variant][form].state)) lines.push(line);
    }
    for (const scenario of result.scenarios) {
      for (const reading of ['before', 'after']) for (const line of scoreLines(`${scenario.id}.${reading}`, scenario[reading])) lines.push(line);
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * The launcher's whole body: `--backend`, `--corpus` (A) and `--other` (B) select one run, and
 * `--capture <path>` also writes the text with every score line to that repo-relative path, which the
 * `bm25-history.mjs` launcher's `--compare` reads.
 */
export async function runRefreshRuleLauncher(argv) {
  let values;
  try {
    ({ values } = parseFlags({
      args: argv,
      options: { backend: { type: 'string' }, corpus: { type: 'string' }, other: { type: 'string' }, capture: { type: 'string' } },
      strict: true,
    }));
  } catch (error) {
    refuse(`${error.message}; the flags are --backend, --corpus, --other and --capture`);
  }
  for (const flag of ['backend', 'corpus', 'other']) {
    if (values[flag] === undefined) refuse(`--${flag} is required`);
  }
  if (values.corpus === values.other) refuse(`--corpus and --other are both ${values.corpus}; they must differ`);
  const { checkout } = parseArgs([]);
  const result = await measureRefreshRule({ checkout, backend: values.backend, corpusA: values.corpus, corpusB: values.other });
  process.stdout.write(renderRefreshRule(result));
  if (values.capture !== undefined) {
    const path = isAbsolute(values.capture) ? values.capture : join(checkout, values.capture);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, renderRefreshRule(result, { withScores: true }));
  }
}
