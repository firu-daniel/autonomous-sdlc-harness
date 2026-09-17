/**
 * Command: `docs` — search the docs catalog and the conventions documents: build the index, query it,
 * serve it over MCP. `index` is its first sub-verb.
 *
 * **The rule this module exists to enforce: the sub-verb table is the one declaration of the
 * sub-verbs.** The usage lines, the refusal naming the legal sub-verbs and the dispatch all read
 * {@link SUB_VERBS}, so a sub-verb added there cannot be missing from any of them. Every sub-verb that
 * reads the index opens it through `retrieval/session.ts` → `openRetrieval`, which owns the refusals
 * that precede any load.
 *
 * **`--dry-run` builds in memory.** The global flag promises that nothing is written, and the only
 * thing `index` writes is the per-checkout index, so a dry run takes the same path as `--in-memory`.
 */

import { requireConfig } from '../config/io.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { resolveRepoRoot } from '../core/git.js';
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

const SUB_VERBS: readonly DocsSubVerb[] = [
  {
    name: 'index',
    synopsis: `index [${IN_MEMORY_FLAG}]`,
    summary: `Refresh this checkout's index; ${IN_MEMORY_FLAG} builds one in memory and writes nothing`,
    run: index,
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
    'init sets both up. --dry-run builds the index in memory and writes nothing.',
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
