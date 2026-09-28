/**
 * Command: `docs` — search the docs catalog and the conventions documents: build the index, query it,
 * serve it over MCP, and fetch the models it runs on. Its sub-verbs are `index`, `search`, `serve` and
 * `fetch-models`.
 *
 * **The rule this module exists to enforce: the sub-verb table is the one declaration of the
 * sub-verbs.** The usage lines, the refusal naming the legal sub-verbs and the dispatch all read
 * {@link SUB_VERBS}, so a sub-verb added there cannot be missing from any of them. Every sub-verb that
 * reads the index opens it through `retrieval/session.ts` → `openRetrieval`, which owns the refusals
 * that precede any load.
 *
 * **`--dry-run` never persists the index.** The global flag promises that nothing is written, and the
 * only thing a sub-verb writes is the per-checkout index: `index` and `search` build it in memory, the
 * same path as `--in-memory`, and `serve` refuses the flag before opening anything.
 */

import { requireConfig } from '../config/io.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { resolveRepoRoot } from '../core/git.js';
import { ownManifestString } from '../core/paths.js';
import {
  DEFAULT_RESULTS,
  MAX_RESULTS,
  renderResults,
  SEARCH_MODES,
  searchDocs,
  type SearchMode,
} from '../retrieval/search.js';
import {
  EMBEDDING_MODEL,
  fetchModels,
  modelFilesPresent,
  RERANK_MODEL,
  RETRIEVAL_STUB_ENV,
  stubModelsSelected,
} from '../retrieval/models.js';
import { retrievalModelCacheDir } from '../retrieval/runtime.js';
import { serveDocs } from '../retrieval/server.js';
import { openRetrieval } from '../retrieval/session.js';
import type { CommandContext, Subcommand } from './registry.js';

const SUMMARY = 'Search the docs catalog and conventions: build the index, query it, serve it over MCP';

const CLI = 'npx autonomous-sdlc-harness';

/** One sub-verb: its synopsis after `docs`, its one-line description, and its behaviour. */
interface DocsSubVerb {
  readonly name: string;
  readonly synopsis: string;
  readonly summary: string;
  run(ctx: CommandContext, args: readonly string[]): Promise<number>;
}

const IN_MEMORY_FLAG = '--in-memory';

/** The refusal suffix every bad invocation carries. */
function helpHint(): string {
  return `run \`${CLI} docs --help\` for the usage`;
}

/** The boolean flags `args` sets, refusing any token not in `allowed`. */
function parseFlags(verb: string, args: readonly string[], allowed: readonly string[]): ReadonlySet<string> {
  const set = new Set<string>();
  for (const token of args) {
    if (!allowed.includes(token)) {
      const what = token.startsWith('-') ? 'unknown option' : 'unexpected argument';
      throw new HarnessError(`docs ${verb}: ${what} ${JSON.stringify(token)}; ${helpHint()}`);
    }
    set.add(token);
  }
  return set;
}

/** `docs index [--in-memory]`: refresh the checkout's index, or build one in memory. */
async function index(ctx: CommandContext, args: readonly string[]): Promise<number> {
  const flags = parseFlags('index', args, [IN_MEMORY_FLAG]);
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const config = requireConfig(repoRoot);

  const session = await openRetrieval({ repoRoot, config, inMemory: flags.has(IN_MEMORY_FLAG) || ctx.flags.dryRun });
  try {
    const result = await session.refresh();
    for (const warning of result.warnings) ctx.report.warn(warning);
    ctx.report.result(
      `docs index: ${result.files} files, ${result.chunks} chunks; embedded ${result.embedded}, unchanged ${result.unchanged}, deleted ${result.deleted}${
        result.rebuilt ? '; rebuilt for a new embedder' : ''
      }`,
    );
  } finally {
    await session.close();
  }
  return EXIT.OK;
}

const K_FLAG = '--k';
const MODE_FLAG = '--mode';
const DEFAULT_MODE: SearchMode = 'fused-rerank';

/**
 * `docs search <query> [--k <n>] [--mode <mode>]`: refresh the checkout's index, then answer the query.
 * An abstention exits 0; it is an answer, not an error.
 */
async function search(ctx: CommandContext, args: readonly string[]): Promise<number> {
  const modes = SEARCH_MODES.join(', ');
  let query: string | undefined;
  let k = DEFAULT_RESULTS;
  let mode = DEFAULT_MODE;
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i] ?? '';
    if (token === K_FLAG || token === MODE_FLAG) {
      const value = args[i + 1];
      if (value === undefined) throw new HarnessError(`docs search: ${token} needs a value; ${helpHint()}`);
      i += 1;
      if (token === K_FLAG) {
        if (!/^[0-9]+$/.test(value)) {
          throw new HarnessError(`docs search: ${K_FLAG} takes a whole number, not ${JSON.stringify(value)}; ${helpHint()}`);
        }
        k = Number(value);
      } else {
        const found = SEARCH_MODES.find((candidate) => candidate === value);
        if (found === undefined) {
          throw new HarnessError(`docs search: unknown mode ${JSON.stringify(value)}; expected ${modes}; ${helpHint()}`);
        }
        mode = found;
      }
      continue;
    }
    if (token.startsWith('-') || query !== undefined) {
      const what = token.startsWith('-') ? 'unknown option' : 'unexpected argument';
      throw new HarnessError(`docs search: ${what} ${JSON.stringify(token)}; ${helpHint()}`);
    }
    query = token;
  }
  if (query === undefined || query.trim() === '') {
    throw new HarnessError(`docs search: no query given; ${helpHint()}`);
  }

  const repoRoot = resolveRepoRoot(ctx.cwd);
  const config = requireConfig(repoRoot);
  const session = await openRetrieval({ repoRoot, config, inMemory: ctx.flags.dryRun });
  try {
    const refreshed = await session.refresh();
    for (const warning of refreshed.warnings) ctx.report.warn(warning);
    const result = await searchDocs({
      store: session.store,
      embedder: session.embedder,
      reranker: session.reranker,
      query,
      k,
      mode,
    });
    ctx.report.result(renderResults(result));
  } finally {
    await session.close();
  }
  return EXIT.OK;
}

/**
 * `docs serve`: the stdio MCP server, through `retrieval/server.ts` → `serveDocs`. **Nothing but the
 * transport may write to stdout** — a stray byte corrupts the JSON-RPC stream and an agent sees a tool
 * that never loads — so this sub-verb writes no `result` line and sends every warning to stderr
 * through `report.warn`. A refusal before the transport starts exits non-zero with its message on
 * stderr.
 */
async function serve(ctx: CommandContext, args: readonly string[]): Promise<number> {
  parseFlags('serve', args, []);
  if (ctx.flags.dryRun) {
    throw new HarnessError(`docs serve: --dry-run is not supported, because a server persists the index it refreshes; ${helpHint()}`);
  }
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const config = requireConfig(repoRoot);
  await serveDocs({ repoRoot, config, version: ownManifestString('version'), report: ctx.report });
  return EXIT.OK;
}

/**
 * `docs fetch-models`: download both models into the shared model cache. **The one command that reaches
 * the network.** `init` runs it at setup time (`retrieval/setup.ts`), and a person may run it by hand.
 * It refuses under {@link RETRIEVAL_STUB_ENV} before loading anything, because a stub run must never
 * download.
 */
async function fetchModelsVerb(ctx: CommandContext, args: readonly string[]): Promise<number> {
  parseFlags('fetch-models', args, []);
  if (stubModelsSelected()) {
    throw new HarnessError(
      `docs fetch-models: refusing to download while ${RETRIEVAL_STUB_ENV} is set, because a stub run never downloads; unset it to fetch the real models`,
    );
  }
  await fetchModels();
  const dir = retrievalModelCacheDir();
  const { present, missing } = modelFilesPresent(dir);
  if (!present) {
    throw new HarnessError(`docs fetch-models: the download finished but ${dir} is missing ${missing.join(', ')}`);
  }
  ctx.report.result(`docs fetch-models: ${EMBEDDING_MODEL} and ${RERANK_MODEL} cached in ${dir}`);
  return EXIT.OK;
}

const SUB_VERBS: readonly DocsSubVerb[] = [
  {
    name: 'index',
    synopsis: `index [${IN_MEMORY_FLAG}]`,
    summary: `Refresh this checkout's index; ${IN_MEMORY_FLAG} builds one in memory and writes nothing`,
    run: index,
  },
  {
    name: 'search',
    synopsis: `search <query> [${K_FLAG} <n>] [${MODE_FLAG} <${SEARCH_MODES.join('|')}>]`,
    summary: `Refresh the index and search it; ${K_FLAG} defaults to ${DEFAULT_RESULTS} (at most ${MAX_RESULTS}), ${MODE_FLAG} to ${DEFAULT_MODE}`,
    run: search,
  },
  {
    name: 'serve',
    synopsis: 'serve',
    summary: 'Serve search_docs over stdio MCP; stdout carries the protocol and nothing else',
    run: serve,
  },
  {
    name: 'fetch-models',
    synopsis: 'fetch-models',
    summary: 'Download both models into the shared model cache; the one sub-verb that reaches the network',
    run: fetchModelsVerb,
  },
];

function usage(): readonly string[] {
  const width = Math.max(...SUB_VERBS.map((verb) => verb.synopsis.length));
  return [
    `The sub-verb is required: ${CLI} docs <${SUB_VERBS.map((verb) => verb.name).join('|')}>`,
    '',
    'Sub-verbs:',
    ...SUB_VERBS.map((verb) => `  ${verb.synopsis.padEnd(width)}  ${verb.summary}`),
    '',
    'Retrieval must be on (phases.docs and docs.retrieval true) and the model cache present;',
    'init sets both up. --dry-run builds the index in memory for index and search and writes',
    'nothing; serve refuses it.',
  ];
}

async function run(ctx: CommandContext): Promise<number> {
  const [name, ...args] = ctx.argv;
  const names = SUB_VERBS.map((verb) => verb.name).join(', ');
  if (name === undefined) throw new HarnessError(`docs: no sub-verb given; expected ${names}; ${helpHint()}`);
  const verb = SUB_VERBS.find((candidate) => candidate.name === name);
  if (verb === undefined) {
    const what = name.startsWith('-') ? 'unknown option' : 'unknown sub-verb';
    throw new HarnessError(`docs: ${what} ${JSON.stringify(name)}; expected ${names}; ${helpHint()}`);
  }
  return verb.run(ctx, args);
}

export const DOCS_COMMAND: Subcommand = {
  name: 'docs',
  summary: SUMMARY,
  usage: usage(),
  run,
};
