/**
 * The docs-retrieval eval's argument surface: the one place a flag is spelled, defaulted and refused.
 *
 * **The rule this module exists to enforce: no arm letter appears here.** `--arms` is carried
 * through as the raw letters the operator gave, or `undefined` when the flag is absent; the default
 * set and the refusal of an illegal letter belong to `evals/docs-retrieval/arms.mjs`, which owns the
 * single declared arm table. A default list or a legal-letter check here would be a second copy of
 * that table, and the two would drift. The boundary is drawn here rather than inferred: the
 * `--arms` line of the refusal below says so too.
 *
 * `--repo <path>` is what lets the eval be pointed at any adopter's checkout; it defaults to the
 * checkout this file sits in, from a bare `git rev-parse --show-toplevel`
 * (`.claude/context/conventions.md` → `## Configuration is the source of truth…`). Every other path
 * is resolved against it unless it is already absolute.
 */

import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_RESULTS } from '../../cli/dist/retrieval/search.js';
import { BUILT_IN_CORPORA } from './corpora.mjs';

/** One run of each query, unless the operator asks for more. */
const DEFAULT_REPEAT = 1;

/** The corpus an invocation naming no `--corpus` and no `--docs-root` runs: the committed, stationary one. */
const DEFAULT_CORPUS = 'fixture-catalog';

/** Where a built-in corpus's query set lives, one set per corpus id (`evals/docs-retrieval/queries/README.md`). */
const QUERIES_DIR = 'evals/docs-retrieval/queries';

/** The legal flags, in the order the refusal lists them, each with the line that explains it there. */
const FLAGS = Object.freeze([
  ['--repo <path>', 'the checkout to run against; defaults to the one this eval sits in'],
  ['--corpus <id>', `a built-in corpus id: ${BUILT_IN_CORPORA.join(' or ')}`],
  ['--docs-root <path>', 'compose an ad-hoc corpus from this documentation directory instead'],
  ['--conventions <path>', 'a conventions document of the ad-hoc corpus; repeatable'],
  ['--queries <path>', `the query set; defaults to ${QUERIES_DIR}/<corpus-id>.jsonl for a built-in id`],
  ['--arms <letters>', 'which arms to run; the legal letters and the default set belong to arms.mjs, not here'],
  ['--k <n>', `how many hits each arm returns (default ${DEFAULT_RESULTS})`],
  ['--repeat <n>', `how many times each query is run (default ${DEFAULT_REPEAT})`],
  ['--out <path>', 'where to write the results; absent means nothing is written'],
  ['--data-dir <path>', 'where the index is stored; absent means in memory, and nothing is written'],
  ['--floor <path>', 'the recorded regression floor; read by check-floor.mjs alone, not by a run'],
  ['--transcript <path>', "an arm A hand-run transcript, scored by run.mjs and by nothing in this module"],
]);

/** Flags taking a value, by name. */
const VALUE_FLAGS = new Set(FLAGS.map(([spec]) => spec.split(' ')[0]));

function refuse(message) {
  const legal = FLAGS.map(([spec, help]) => `  ${spec.padEnd(22)} ${help}`).join('\n');
  throw new Error(`eval: ${message}\nthe legal flags are:\n${legal}`);
}

function positiveInteger(flag, raw) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) refuse(`${flag} takes a positive integer, not ${JSON.stringify(raw)}`);
  return value;
}

/** The checkout this file sits in, from a bare `git rev-parse --show-toplevel`. */
function ownCheckout() {
  const here = dirname(fileURLToPath(import.meta.url));
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
}

/**
 * The parsed argument surface. `argv` is the flags alone — `process.argv.slice(2)`.
 *
 * `corpus` is `undefined` for an ad-hoc corpus, which `--docs-root` selects; `arms` is the raw
 * letters as given, or `undefined`; every path is absolute by the time it is returned.
 */
export function parseArgs(argv) {
  const raw = { conventions: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!VALUE_FLAGS.has(flag)) refuse(`unknown flag ${flag}`);
    const value = argv[index + 1];
    if (value === undefined || VALUE_FLAGS.has(value)) refuse(`${flag} takes a value`);
    index += 1;

    switch (flag) {
      case '--conventions':
        raw.conventions.push(value);
        break;
      case '--repo':
        raw.repo = value;
        break;
      case '--corpus':
        raw.corpus = value;
        break;
      case '--docs-root':
        raw.docsRoot = value;
        break;
      case '--queries':
        raw.queries = value;
        break;
      case '--arms':
        raw.arms = value;
        break;
      case '--k':
        raw.k = positiveInteger(flag, value);
        break;
      case '--repeat':
        raw.repeat = positiveInteger(flag, value);
        break;
      case '--out':
        raw.out = value;
        break;
      case '--data-dir':
        raw.dataDir = value;
        break;
      case '--floor':
        raw.floor = value;
        break;
      case '--transcript':
        raw.transcript = value;
        break;
      // Every flag in FLAGS needs its own case: VALUE_FLAGS above accepts a flag the moment it is
      // declared, so a declared flag with no case here would take some other flag's slot silently.
      default:
        refuse(`${flag} is declared in FLAGS with no case in parseArgs, so its value would be misread`);
    }
  }

  const repo = raw.repo === undefined ? ownCheckout() : resolve(ownCheckout(), raw.repo);
  const against = (path) => (path === undefined ? undefined : isAbsolute(path) ? path : resolve(repo, path));

  const corpus = raw.corpus ?? (raw.docsRoot === undefined ? DEFAULT_CORPUS : undefined);
  if (corpus !== undefined && !BUILT_IN_CORPORA.includes(corpus)) {
    refuse(`unknown corpus ${corpus}; the built-in ids are ${BUILT_IN_CORPORA.join(' and ')}`);
  }
  if (corpus !== undefined && raw.docsRoot !== undefined) {
    refuse(`--corpus ${corpus} and --docs-root name two different corpora; give one or the other`);
  }
  const queries = against(raw.queries) ?? (corpus === undefined ? undefined : resolve(repo, QUERIES_DIR, `${corpus}.jsonl`));
  if (queries === undefined) refuse('an ad-hoc corpus has no query set of its own; name one with --queries');

  return {
    repo,
    corpus,
    docsRoot: against(raw.docsRoot),
    conventions: raw.conventions.map((path) => against(path)),
    queries,
    arms: raw.arms,
    k: raw.k ?? DEFAULT_RESULTS,
    repeat: raw.repeat ?? DEFAULT_REPEAT,
    out: against(raw.out),
    dataDir: against(raw.dataDir),
    floor: against(raw.floor),
    transcript: against(raw.transcript),
  };
}
