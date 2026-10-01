/**
 * Every fact about the Python docs-retrieval backend that both the launcher and `doctor` need: the
 * console script's name, its sub-commands, the database variable, the default connection string, the
 * launcher's unavailable-backend exit code, the `self-check` line contract and the launcher's `PATH`
 * fallback list.
 *
 * **The rule this module exists to enforce: every name the Python backend is reached by is spelled
 * here once, and each copy outside the compiler is a declared mirror.**
 *
 * Pure data and pure functions: this module spawns nothing, reads no file and imports no retrieval
 * peer, so `cli/test/retrieval-loading.test.mjs`'s guarantees do not reach it.
 *
 * **MIRRORS.** Each copy outside the compiler, and what it holds:
 * - `cli/templates/scripts/docs-search-server.sh` — {@link PYTHON_RETRIEVAL_COMMAND},
 *   {@link PYTHON_SERVE_SUB_COMMAND}, {@link PYTHON_DATABASE_URL_VARIABLE},
 *   {@link PYTHON_DEFAULT_DATABASE_URL} and {@link PYTHON_BACKEND_UNAVAILABLE_EXIT}.
 * - `docs-retrieval-service/compose.yaml` → `postgres` — the user, password, database and port inside
 *   {@link PYTHON_DEFAULT_DATABASE_URL}.
 * - `docs-retrieval-service/src/harness_docs_retrieval/self_check.py` — `SELF_CHECK_QUESTIONS`
 *   ({@link SELF_CHECK_QUESTIONS}) and `CheckLine.render` (the line shape {@link parseSelfCheck} reads).
 * - `docs-retrieval-service/src/harness_docs_retrieval/store.py` — `DATABASE_URL_ENV`
 *   ({@link PYTHON_DATABASE_URL_VARIABLE}).
 * - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_path_with_fallbacks` —
 *   {@link LAUNCHER_PATH_FALLBACKS} and the policy {@link launcherSearchPath} reproduces.
 *
 * A change to a mirrored literal is an edit to every file that mirrors it, in the same change; a
 * mirror this header does not declare is a defect (`.claude/context/conventions.md` →
 * `## Configuration is the source of truth…`, the persisted-key bullet).
 */

/** The Python package's console script. */
export const PYTHON_RETRIEVAL_COMMAND = 'harness-docs-retrieval';

/** The sub-command the launcher `exec`s to serve MCP over stdio. */
export const PYTHON_SERVE_SUB_COMMAND = 'serve-mcp';

/** The sub-command whose stdout {@link parseSelfCheck} reads. */
export const PYTHON_SELF_CHECK_SUB_COMMAND = 'self-check';

/** The sub-command `doctor`'s missing-weights remedy names. */
export const PYTHON_FETCH_MODELS_SUB_COMMAND = 'fetch-models';

/** The variable the Python backend reads its Postgres connection string from. */
export const PYTHON_DATABASE_URL_VARIABLE = 'HARNESS_DOCS_RETRIEVAL_DATABASE_URL';

/**
 * The connection string used when {@link PYTHON_DATABASE_URL_VARIABLE} is unset. The credentials are
 * the compose file's throwaway values for a loopback-only container, never a real secret.
 */
export const PYTHON_DEFAULT_DATABASE_URL = 'postgresql://harness:harness@127.0.0.1:5432/docs_retrieval';

/** The launcher's exit code when the Python backend is selected but cannot be started. */
export const PYTHON_BACKEND_UNAVAILABLE_EXIT = 3;

/** The questions `self-check` answers, one line each, in this order. */
export const SELF_CHECK_QUESTIONS = ['packages', 'weights', 'index'] as const;

export type SelfCheckQuestion = (typeof SELF_CHECK_QUESTIONS)[number];

export interface SelfCheckLine {
  readonly question: SelfCheckQuestion;
  readonly ok: boolean;
  readonly detail: string;
}

/** `CheckLine.render`'s two prefixes; the `ok` one is padded to the width of `FAIL `. */
const SELF_CHECK_LINE = /^(ok {3}|FAIL )([a-z]+): (.*)$/;

/**
 * Parse `self-check`'s stdout. Answers `undefined` unless the non-empty lines are exactly one per
 * {@link SELF_CHECK_QUESTIONS} entry, in that order, each in `CheckLine.render`'s shape — a shape this
 * cannot read is the caller's to report, never guessed at.
 */
export function parseSelfCheck(stdout: string): ReadonlyMap<SelfCheckQuestion, SelfCheckLine> | undefined {
  const lines = stdout.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length !== SELF_CHECK_QUESTIONS.length) return undefined;

  const parsed = new Map<SelfCheckQuestion, SelfCheckLine>();
  for (const [index, question] of SELF_CHECK_QUESTIONS.entries()) {
    const match = SELF_CHECK_LINE.exec(lines[index] ?? '');
    if (match === null || match[2] !== question) return undefined;
    parsed.set(question, { question, ok: match[1] !== 'FAIL ', detail: match[3] ?? '' });
  }
  return parsed;
}

/**
 * The connection string the server will use: `serverEnv[PYTHON_DATABASE_URL_VARIABLE]` when
 * `serverEnv` (the `harness-docs` server's `env` object in `.mcp.json`) is an object holding a
 * non-empty string there, else {@link PYTHON_DEFAULT_DATABASE_URL}. A shell export is deliberately not
 * consulted: the agent runner never passes one to the server (`docs/retrieval.md` → **How the variable
 * reaches the server, since an export does not.**).
 */
export function pythonDatabaseUrl(serverEnv: unknown): string {
  if (typeof serverEnv === 'object' && serverEnv !== null && !Array.isArray(serverEnv)) {
    const value: unknown = (serverEnv as Record<string, unknown>)[PYTHON_DATABASE_URL_VARIABLE];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return PYTHON_DEFAULT_DATABASE_URL;
}

/** The fixed directories `hr_path_with_fallbacks` appends, in its order. */
export const LAUNCHER_PATH_FALLBACKS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'] as const;

/**
 * The `PATH` the launcher resolves {@link PYTHON_RETRIEVAL_COMMAND} on, as `hr_path_with_fallbacks`
 * builds it: the inherited non-empty entries kept in order, each {@link LAUNCHER_PATH_FALLBACKS} entry
 * not already present appended, then `<home>/.local/bin` (one trailing `/` stripped from `home`) when
 * `home` is non-empty and that entry is not among the inherited ones.
 */
export function launcherSearchPath(inherited: string, home: string | undefined): string {
  const kept = inherited.split(':').filter((entry) => entry.length > 0);
  const suffix: string[] = [];
  for (const dir of LAUNCHER_PATH_FALLBACKS) {
    if (!kept.includes(dir) && !suffix.includes(dir)) suffix.push(dir);
  }
  if (home !== undefined && home.length > 0) {
    const local = `${home.endsWith('/') ? home.slice(0, -1) : home}/.local/bin`;
    if (!kept.includes(local)) suffix.push(local);
  }
  return [...kept, ...suffix].join(':');
}
