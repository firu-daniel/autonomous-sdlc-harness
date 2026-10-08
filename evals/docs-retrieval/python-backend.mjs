/**
 * The Python docs-retrieval backend as an eval session: an object an arm queries exactly as it queries
 * the in-process TypeScript index `evals/docs-retrieval/index-build.mjs` → `buildIndex` returns.
 *
 * **The rule this module exists to enforce: the eval reaches the Python backend only through the
 * package's own entry points, `bash scripts/python-service.sh run <sub-command>`** — the one route
 * `docs-retrieval-service/README.md` → `## Standing it up` makes — with one stated exception:
 * `evals/docs-retrieval/vector-agreement.mjs` reads stored document vectors back from the compose
 * database through `psql`, because no entry point exposes them, and depends on
 * `docs-retrieval-service/src/harness_docs_retrieval/store.py`'s `chunks` and `meta` schema in doing
 * so; this module owns the {@link COMPOSE_DIR} and {@link POSTGRES_SERVICE} that read-back route uses,
 * as it owns {@link WRAPPER_PATH} and {@link wrapperArgs} for the entry points — **and every figure is
 * scored by the eval's own `evals/docs-retrieval/metrics.mjs`.** Nothing here re-implements a search, a chunker or a
 * fusion; latency is the server's own `search_ms`.
 *
 * Every name the CLI already owns is imported from `cli/dist/retrieval/pythonBackend.js` and
 * `cli/dist/retrieval/models.js`. The names it does not own are spelled once, below, each with its
 * owner: the sub-commands from `docs-retrieval-service/src/harness_docs_retrieval/cli.py` →
 * `SUB_COMMANDS`, the paths and response keys from `http_app.py` → `create_app`, and the `index:`
 * summary line from `cli.py` → `_run_index`.
 *
 * The database URL is `pythonDatabaseUrl(process.env)`, the launcher's own default rule. It travels in
 * the child environment only and is never written into a message or a return value: every quoted child
 * line passes {@link scrub}.
 *
 * `chunkKeys` comes from the TypeScript `chunkMarkdown`, as `buildIndex` computes it; the two chunkers'
 * keys are byte-identical by `docs-retrieval-service/tests/test_chunk_parity.py`.
 *
 * Every exit path of {@link openPythonSession} after the mirror fixture is built — a refusal included —
 * removes that fixture and stops the server's whole process group (`harness-runs/lessons.md` → *"A
 * script that creates a temporary working copy or branch removes it on every exit path"*).
 */

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { chunkMarkdown } from '../../cli/dist/retrieval/chunk.js';
import { RETRIEVAL_STUB_ENV } from '../../cli/dist/retrieval/models.js';
import {
  PYTHON_DATABASE_URL_VARIABLE,
  PYTHON_RETRIEVAL_COMMAND,
  PYTHON_SELF_CHECK_SUB_COMMAND,
  parseSelfCheck,
  pythonDatabaseUrl,
} from '../../cli/dist/retrieval/pythonBackend.js';
import { buildMirrorFixture, removeMirrorFixture } from './mirror-fixture.mjs';

/** `cli.py` → `SUB_COMMANDS`. */
const INDEX_SUB_COMMAND = 'index';
const SERVE_HTTP_SUB_COMMAND = 'serve-http';

/** `http_app.py` → `create_app`. */
const SEARCH_PATH = '/search';
const HEALTH_PATH = '/health';
const SEARCH_RESPONSE_KEYS = Object.freeze(['hits', 'abstained', 'best_rerank_score', 'search_ms']);

/** `cli.py` → `_run_index`'s one stdout line. */
const INDEX_LINE = /^index: (\d+) files, (\d+) chunks; embedded (\d+), unchanged (\d+), deleted (\d+)(?:; rebuilt for a new embedder)?$/;

/** `bash scripts/python-service.sh`'s not-provisioned exit, its header's exit contract. */
const WRAPPER_NOT_PROVISIONED_EXIT = 3;

/** The wrapper, repo-relative to the checkout. */
export const WRAPPER_PATH = ['scripts', 'python-service.sh'];

/** `docs-retrieval-service/compose.yaml` → `services.postgres`. */
export const POSTGRES_SERVICE = 'postgres';

/** The directory whose `compose.yaml` declares {@link POSTGRES_SERVICE}, repo-relative. */
export const COMPOSE_DIR = 'docs-retrieval-service';

/** The Python package's manifest, whose `[project]` `version` is `packageVersion`. */
const PYPROJECT_PATH = ['docs-retrieval-service', 'pyproject.toml'];

const LOOPBACK_HOST = '127.0.0.1';

/** Generous because the first start loads both models before the server binds. */
const HEALTH_DEADLINE_MS = 300_000;
const HEALTH_POLL_INTERVAL_MS = 250;

/** One `POST /search` includes the server's per-call refresh. */
const SEARCH_DEADLINE_MS = 120_000;

/** How long `close()` waits for the process group after `SIGTERM` before sending `SIGKILL`. */
const CLOSE_DEADLINE_MS = 15_000;

const WARNING_PREFIX = `${PYTHON_RETRIEVAL_COMMAND}: warning: `;
const MESSAGE_PREFIX = `${PYTHON_RETRIEVAL_COMMAND}: `;

function refuse(message) {
  throw new Error(`eval: python backend: ${scrub(message)}`);
}

/** Any connection string in a quoted child line, replaced by the variable's name. */
export function scrub(text) {
  return String(text).replace(/postgres(?:ql)?:\/\/\S+/g, `<${PYTHON_DATABASE_URL_VARIABLE}>`);
}

function childEnv() {
  return { ...process.env, [PYTHON_DATABASE_URL_VARIABLE]: pythonDatabaseUrl(process.env) };
}

/** The `bash` argv for `python-service.sh run <subCommand> ...rest` in `checkout`. */
export function wrapperArgs(checkout, subCommand, rest) {
  return [join(checkout, ...WRAPPER_PATH), 'run', subCommand, ...rest];
}

function lines(text) {
  return String(text ?? '').split(/\r?\n/).filter((line) => line.length > 0);
}

/** The child's own `harness-docs-retrieval: <message>` line, else its last stderr line. */
function childMessage(stderr) {
  const all = lines(stderr);
  const own = all.filter((line) => line.startsWith(MESSAGE_PREFIX) && !line.startsWith(WARNING_PREFIX));
  return own.at(-1) ?? all.at(-1) ?? '(no stderr)';
}

/** One wrapper run, fixed argument vector, no shell. */
function runWrapper(checkout, subCommand, rest) {
  const result = spawnSync('bash', wrapperArgs(checkout, subCommand, rest), {
    cwd: checkout,
    env: childEnv(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error !== undefined) refuse(`could not run ${subCommand} through the wrapper: ${result.error.message}`);
  return result;
}

/**
 * The refusals, each by name and before the server is spawned: the stub models selected, the wrapper
 * not provisioned, and any `FAIL` line of `self-check --repo <fixtureDir>`.
 */
export function assertPythonBackendAvailable({ checkout, fixtureDir }) {
  if ((process.env[RETRIEVAL_STUB_ENV] ?? '') !== '') {
    refuse(`${RETRIEVAL_STUB_ENV} is set; the eval records real-model numbers only, so unset it and re-run`);
  }

  const result = runWrapper(checkout, PYTHON_SELF_CHECK_SUB_COMMAND, ['--repo', fixtureDir]);
  if (result.status === WRAPPER_NOT_PROVISIONED_EXIT) {
    refuse(`the Python backend is not provisioned: ${lines(result.stderr).at(-1) ?? '(no stderr)'}`);
  }
  const parsed = parseSelfCheck(result.stdout);
  if (parsed === undefined) {
    refuse(
      `${PYTHON_SELF_CHECK_SUB_COMMAND} printed no readable answer (exit ${result.status}): ` +
        `${JSON.stringify(result.stdout)}; stderr: ${childMessage(result.stderr)}`,
    );
  }
  const failed = lines(result.stdout).filter((line) => line.startsWith('FAIL '));
  if (failed.length > 0) refuse(`${PYTHON_SELF_CHECK_SUB_COMMAND} failed: ${failed.join('; ')}`);
}

/** `index --repo <fixtureDir>` through the wrapper, its summary line parsed and its warnings collected. */
export async function indexPythonCorpus({ checkout, fixtureDir }) {
  const result = runWrapper(checkout, INDEX_SUB_COMMAND, ['--repo', fixtureDir]);
  if (result.status !== 0) {
    refuse(`${INDEX_SUB_COMMAND} exited ${result.status ?? result.signal}: ${childMessage(result.stderr)}`);
  }
  const warnings = lines(result.stderr)
    .filter((line) => line.startsWith(WARNING_PREFIX))
    .map((line) => scrub(line.slice(WARNING_PREFIX.length)));
  const stdout = lines(result.stdout);
  const match = stdout.length === 1 ? INDEX_LINE.exec(stdout[0]) : null;
  if (match === null) refuse(`${INDEX_SUB_COMMAND} printed no readable summary line: ${JSON.stringify(result.stdout)}`);
  const [files, chunks, embedded, unchanged, deleted] = match.slice(1).map(Number);
  return { files, chunks, embedded, unchanged, deleted, warnings };
}

function freeLoopbackPort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, LOOPBACK_HOST, () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

function packageVersion(checkout) {
  let section = '';
  for (const line of readFileSync(join(checkout, ...PYPROJECT_PATH), 'utf8').split(/\r?\n/)) {
    const header = /^\[([^\]]+)\]\s*$/.exec(line);
    if (header !== null) section = header[1];
    const version = /^version\s*=\s*"([^"]+)"\s*$/.exec(line);
    if (section === 'project' && version !== null) return version[1];
  }
  return refuse(`${PYPROJECT_PATH.join('/')} carries no [project] version`);
}

function groupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

/** Polls until the group is gone or `ms` elapses; true when it is gone. */
async function groupGoneWithin(pid, ms) {
  const deadline = Date.now() + ms;
  while (groupAlive(pid)) {
    if (Date.now() >= deadline) return false;
    await sleep(HEALTH_POLL_INTERVAL_MS);
  }
  return true;
}

/** `GET /health` until `200`, the child's exit, or {@link HEALTH_DEADLINE_MS}. */
async function awaitHealth(baseUrl, server) {
  const deadline = Date.now() + HEALTH_DEADLINE_MS;
  let last = 'no response yet';
  while (Date.now() < deadline) {
    if (server.exited) refuse(`${SERVE_HTTP_SUB_COMMAND} exited before it was healthy: ${childMessage(server.stderr)}`);
    try {
      const response = await fetch(`${baseUrl}${HEALTH_PATH}`, {
        signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
      });
      const body = await response.json();
      if (response.status === 200) return body;
      last = `HTTP ${response.status}: ${body.error ?? JSON.stringify(body)}`;
    } catch (error) {
      last = error.cause?.code ?? error.message;
    }
    await sleep(HEALTH_POLL_INTERVAL_MS);
  }
  return refuse(`${HEALTH_PATH} was not healthy within HEALTH_DEADLINE_MS (${HEALTH_DEADLINE_MS} ms); last: ${last}`);
}

/**
 * A Python-backend session over a mirror of `resolved`'s corpus. `checkout` is `args.mjs` →
 * `parseArgs`'s `checkout`; `resolved` is `corpora.mjs` → `corpusConfig`'s `{ id, config, repoRoot }`.
 */
export async function openPythonSession({ checkout, resolved }) {
  const fixture = buildMirrorFixture(checkout, resolved);
  let server;
  let closed = false;

  async function close() {
    if (closed) return;
    closed = true;
    try {
      if (server !== undefined && !server.exited) {
        signalGroup(server.child.pid, 'SIGTERM');
        await Promise.race([server.exit, sleep(CLOSE_DEADLINE_MS)]);
      }
      if (server !== undefined && !(await groupGoneWithin(server.child.pid, CLOSE_DEADLINE_MS))) {
        signalGroup(server.child.pid, 'SIGKILL');
        await groupGoneWithin(server.child.pid, CLOSE_DEADLINE_MS);
      }
    } finally {
      removeMirrorFixture(fixture.dir);
    }
  }

  try {
    assertPythonBackendAvailable({ checkout, fixtureDir: fixture.dir });
    const index = await indexPythonCorpus({ checkout, fixtureDir: fixture.dir });
    const chunkKeys = new Set(
      fixture.files.flatMap((path) =>
        chunkMarkdown(path, readFileSync(join(fixture.dir, path), 'utf8')).map((chunk) => chunk.key),
      ),
    );
    const version = packageVersion(checkout);

    const port = await freeLoopbackPort();
    const baseUrl = `http://${LOOPBACK_HOST}:${port}`;
    const child = spawn(
      'bash',
      wrapperArgs(checkout, SERVE_HTTP_SUB_COMMAND, ['--repo', fixture.dir, '--host', LOOPBACK_HOST, '--port', String(port)]),
      // `detached` makes the wrapper, `uv` and the Python server one process group, which `close()` stops.
      { cwd: checkout, env: childEnv(), detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    server = { child, exited: false, stderr: '' };
    server.exit = new Promise((resolveExit) => {
      child.once('exit', () => {
        server.exited = true;
        resolveExit();
      });
      child.once('error', (error) => {
        server.exited = true;
        server.stderr += `\n${error.message}`;
        resolveExit();
      });
    });
    child.stdout.resume();
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => {
      server.stderr = (server.stderr + data).slice(-16_384);
    });

    const health = await awaitHealth(baseUrl, server);

    async function search({ query, k, mode }) {
      const response = await fetch(`${baseUrl}${SEARCH_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, k, mode }),
        signal: AbortSignal.timeout(SEARCH_DEADLINE_MS),
      });
      const body = await response.json();
      if (response.status !== 200) {
        refuse(`${SEARCH_PATH} refused ${JSON.stringify(query)} (HTTP ${response.status}): ${body.error ?? JSON.stringify(body)}`);
      }
      const missing = SEARCH_RESPONSE_KEYS.filter((key) => !Object.hasOwn(body, key));
      if (missing.length > 0) refuse(`${SEARCH_PATH} answered ${JSON.stringify(query)} without ${missing.join(', ')}`);
      return {
        hits: body.hits.map(({ ref, score }) => ({ ref, score })),
        abstained: body.abstained,
        bestRerankScore: body.best_rerank_score ?? null,
        searchMs: body.search_ms,
      };
    }

    return {
      backend: 'python',
      snapshot: { files: index.files, chunks: index.chunks },
      chunkKeys,
      warnings: index.warnings,
      embedder: { id: health.embedder },
      reranker: { id: health.reranker },
      packageVersion: version,
      search,
      close,
    };
  } catch (error) {
    if (server !== undefined) await close();
    else removeMirrorFixture(fixture.dir);
    throw error;
  }
}
