/**
 * The `search_docs` query log: the environment variable that turns it on, the shape of one JSONL
 * record, and the append that writes it.
 *
 * **The rule this module exists to enforce: failing to log never fails a call, and nothing here ever
 * reaches stdout.** {@link logQuery} absorbs its own failure into a `Reporter` warning on stderr and
 * returns, so `cli/src/retrieval/server.ts` → `answer` has nothing to catch and returns its result
 * unchanged. Stdout belongs to the MCP transport, where a stray byte is a malformed frame for the
 * client (`cli/templates/scripts/docs-search-server.sh`, its stdout paragraph).
 *
 * **Why the record shape lives here rather than in its one caller.** {@link QueryLogRecord} and
 * {@link QueryOutcome} are the input contract the `feat_docs_retrieval_eval` branch reads: the feature
 * ships opt-in and not yet measured against the index-first navigation agents use today, and this file
 * is what distinguishes a tool no agent reaches for from one agents reach for and get nothing from. A
 * contract inlined into its first caller has no owner file a later reader can find, so `server.ts`
 * holds no field list, no outcome spelling and no `fs` call of its own.
 *
 * **One key set, always.** Every record carries every key, the outcome included; a field a failed exit
 * cannot fill is `null` rather than absent, so a consumer never infers the outcome from which other
 * fields are missing.
 *
 * **No locking, deliberately.** `cli/src/retrieval/server.ts` → `serveDocs` serializes calls through
 * its `queue`, so two appends cannot interleave. Do not add any.
 *
 * **No shipped template mirrors {@link RETRIEVAL_LOG_ENV}, and that is deliberate.** The agent runner
 * starts the server from `.mcp.json` and passes only the MCP SDK's fixed inherited set —
 * `getDefaultEnvironment()` in `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`,
 * `PATH`, `SHELL` and `USER` on POSIX — so an exported variable does not reach the child. The route is
 * an `env` entry the operator adds by hand to the `harness-docs` server in their own `.mcp.json`,
 * which `init` merges rather than overwrites. `init` must not generate the key: generating it would
 * make this a surface an adopter who wants nothing has to read. So the spelling lives here and in the
 * adopter's own hand-edited file only, never under `cli/templates/`, and there is no mirror for this
 * header to declare under `.claude/context/conventions.md` → `## What accompanies a new unit of each
 * kind` (row *A persisted machine-state key*).
 *
 * The write itself is outside the write engine's monopoly; `cli/src/core/writer.ts`'s header
 * enumerates it as the third such exception.
 */

import { appendFileSync } from 'node:fs';

import type { Reporter } from '../core/report.js';

/**
 * The environment variable that turns the log on; this constant is its only spelling in `cli/src`.
 * Its value is a path to a file: set and non-empty, one JSON line is appended per `search_docs` call;
 * unset or empty, nothing is opened, nothing is written and no code path changes. It is deliberately
 * not a `harness.config.json` key — an adopter who does not set it gains no new surface, so there is
 * nothing for `config`, `doctor` or the config check to grow.
 */
export const RETRIEVAL_LOG_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG';

/**
 * How a call ended, one value per exit from `cli/src/retrieval/server.ts` → `answer` that reaches this
 * log. A closed union rather than a free string: the eval branch parses this file as a contract.
 * `answered` covers an abstention too — that call ended normally, and `abstained` is its own field.
 */
export type QueryOutcome = 'answered' | 'refresh-failed' | 'search-failed';

/** One line of the log. Every key is present on every record; see the header's one-key-set rule. */
export interface QueryLogRecord {
  readonly outcome: QueryOutcome;
  /** ISO 8601, UTC. */
  readonly timestamp: string;
  /** The query as received, before any trimming. */
  readonly query: string;
  /** `k` as resolved — the caller's value, or the default when it sent none. */
  readonly k: number;
  /** Hits in the rendered result; `null` when the call did not get that far. */
  readonly hits: number | null;
  /** The top hit's score; `null` when there are no hits, or the call did not get that far. */
  readonly bestScore: number | null;
  /** The `fused-rerank` abstention; `null` when the call did not get that far. */
  readonly abstained: boolean | null;
  /** The refresh counts; `null` when the refresh itself failed. */
  readonly refresh: { readonly embedded: number; readonly unchanged: number; readonly deleted: number } | null;
  /** Wall time for the whole call, refresh included, from a monotonic clock. */
  readonly durationMs: number;
}

/** {@link RETRIEVAL_LOG_ENV}'s value, unset read as empty; the only read of the variable in `cli/src`. */
function logPath(): string {
  return process.env[RETRIEVAL_LOG_ENV] ?? '';
}

/**
 * Append `record` as one JSON line to the file {@link RETRIEVAL_LOG_ENV} names, or do nothing when the
 * variable is unset or empty. Never throws: an unwritable path, a missing parent directory or a full
 * disk becomes one `report.warn` and a return.
 */
export function logQuery(record: QueryLogRecord, report: Reporter): void {
  const path = logPath();
  if (path === '') return;
  try {
    appendFileSync(path, `${JSON.stringify(record)}\n`, 'utf8');
  } catch (error) {
    report.warn(
      `${RETRIEVAL_LOG_ENV}: appending to ${path} failed: ${error instanceof Error ? error.message : String(error)}; the query was answered and nothing was logged`,
    );
  }
}
