/**
 * The MCP backend pass: either backend's shipped stdio MCP server, driven the way an agent session
 * drives it — cold start, each `search_docs` round trip, and resident memory.
 *
 * **The rule this module exists to enforce: both servers are started over the same mirror fixture with
 * a warm index, and measured by the same code, so the two sets of figures differ only in the server.**
 * Cold start here is process and model load, never an index build: the cold build is
 * `evals/docs-retrieval/cold-build.mjs`'s for TypeScript and the operator's timed `index` run for
 * Python. The library-level latency is not measured here either; it is the runner's per-arm `p50` /
 * `p95`, so the write-up reports the two apart.
 *
 * `evals/docs-retrieval/query-log-pass.mjs` is the TypeScript-only precedent for driving a server over
 * MCP. It is not reused: it grades the query log, and this pass compares two servers.
 *
 * **The backend label is resolved first, by `evals/docs-retrieval/backends.mjs` → `backendFor`, the one
 * owner of the backend set,** before any corpus is resolved, fixture built or process spawned; every
 * branch below reads the resolved label, never the raw argument.
 *
 * Server-side time is Python's only: its server prints one stderr line per call that searched, whose
 * prefix is `docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` → `TIMING_LINE_PREFIX`.
 * TypeScript's in-process figure is the runner's arm E.
 *
 * Resident memory is the `rss` sum over the process subtree rooted at the spawned process. For Python
 * that subtree is the `bash` wrapper, then `uv`, then the server, so the figure includes the wrapper
 * and `uv`; the rendered section prints each process's row so their share is visible.
 *
 * The database URL travels in the Python child's environment only, through `pythonDatabaseUrl`, and
 * never into a message, the result or the rendered section.
 */

import { execFileSync } from 'node:child_process';
import { platform, release } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { RETRIEVAL_STUB_ENV } from '../../cli/dist/retrieval/models.js';
import {
  PYTHON_DATABASE_URL_VARIABLE,
  PYTHON_SERVE_SUB_COMMAND,
  pythonDatabaseUrl,
} from '../../cli/dist/retrieval/pythonBackend.js';
import { DOCS_SERVER_NAME, SEARCH_TOOL_NAME } from '../../cli/dist/retrieval/server.js';
import { backendFor } from './backends.mjs';
import { corpusConfig } from './corpora.mjs';
import { assertRealModelsAreAvailable } from './index-build.mjs';
import { percentile } from './metrics.mjs';
import { buildMirrorFixture, removeMirrorFixture } from './mirror-fixture.mjs';
import { assertPythonBackendAvailable, indexPythonCorpus, scrub } from './python-backend.mjs';
import { loadQueries } from './queries.mjs';

/** The compiled entry point the TypeScript server is spawned from, repo-relative. */
const CLI_ENTRY = ['cli', 'dist', 'cli.js'];

/** The wrapper the Python server is spawned through, repo-relative. */
const WRAPPER_PATH = ['scripts', 'python-service.sh'];

/** The directory whose `compose.yaml` declares the `postgres` service. */
const COMPOSE_DIR = 'docs-retrieval-service';
const POSTGRES_SERVICE = 'postgres';

/** `mcp_server.py` → `TIMING_LINE_PREFIX`. */
const TIMING_LINE_PREFIX = `${DOCS_SERVER_NAME}: search_ms=`;

/** `cli/src/commands/docs.ts` → `index`'s result line. */
const TS_INDEX_LINE = /^docs index: (\d+) files, (\d+) chunks;/m;

/** Wide enough for a first call that carries the model load. */
const CALL_TIMEOUT_MS = 300_000;

/** How long the spawned subtree may take to exit after `client.close()`. */
const EXIT_DEADLINE_MS = 15_000;
const EXIT_POLL_INTERVAL_MS = 100;

function refuse(message) {
  throw new Error(`eval: mcp backend pass: ${scrub(message)}`);
}

function childEnv(backend) {
  if (backend === 'python') return { ...process.env, [PYTHON_DATABASE_URL_VARIABLE]: pythonDatabaseUrl(process.env) };
  return { ...process.env };
}

/** The warm index, built before the server is timed; its counts are the snapshot stamp. */
async function warmIndex(backend, checkout, fixtureDir) {
  if (backend === 'python') {
    const index = await indexPythonCorpus({ checkout, fixtureDir });
    return { files: index.files, chunks: index.chunks };
  }
  let stdout;
  try {
    stdout = execFileSync(process.execPath, [join(checkout, ...CLI_ENTRY), 'docs', 'index', '--cwd', fixtureDir], {
      env: childEnv(backend),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    return refuse(`docs index exited ${error.status ?? error.signal}: ${String(error.stderr ?? '').trim().split('\n').at(-1)}`);
  }
  const match = TS_INDEX_LINE.exec(stdout);
  if (match === null) refuse(`docs index printed no readable summary line: ${JSON.stringify(stdout)}`);
  return { files: Number(match[1]), chunks: Number(match[2]) };
}

function serverCommand(backend, checkout, fixtureDir) {
  if (backend === 'python') {
    return { command: 'bash', args: [join(checkout, ...WRAPPER_PATH), 'run', PYTHON_SERVE_SUB_COMMAND, '--repo', fixtureDir] };
  }
  return { command: process.execPath, args: [join(checkout, ...CLI_ENTRY), 'docs', 'serve', '--cwd', fixtureDir] };
}

/** Every process's `{ pid, ppid, rssKb }`, from one `ps` read. */
function processTable() {
  const text = execFileSync('ps', ['-A', '-o', 'pid=,ppid=,rss='], { encoding: 'utf8' });
  return text
    .split('\n')
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter((fields) => fields.length === 3 && fields.every(Number.isInteger))
    .map(([pid, ppid, rssKb]) => ({ pid, ppid, rssKb }));
}

/** The subtree rooted at `rootPid`, breadth first, each row with its depth below the root. */
function subtree(rootPid) {
  const table = processTable();
  const root = table.find((row) => row.pid === rootPid);
  if (root === undefined) return [];
  const rows = [{ ...root, depth: 0 }];
  for (let index = 0; index < rows.length; index += 1) {
    const parent = rows[index];
    for (const row of table) if (row.ppid === parent.pid) rows.push({ ...row, depth: parent.depth + 1 });
  }
  return rows;
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

/** Waits for every pid to exit; any still running at the deadline is killed and returned. */
async function awaitExit(pids) {
  const deadline = Date.now() + EXIT_DEADLINE_MS;
  while (pids.some(alive) && Date.now() < deadline) await sleep(EXIT_POLL_INTERVAL_MS);
  const leftover = pids.filter(alive);
  for (const pid of leftover) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  return leftover;
}

/**
 * The compose `postgres` container's `MemUsage`, or `null` with the reason. No child output is quoted
 * into the reason: docker's own errors name machine-local socket paths.
 */
function postgresMemory(checkout) {
  const cwd = join(checkout, COMPOSE_DIR);
  const run = (args) => execFileSync('docker', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let id;
  try {
    id = run(['compose', 'ps', '-q', POSTGRES_SERVICE]);
  } catch (error) {
    if (error.code === 'ENOENT') return { value: null, reason: '`docker` is not on PATH' };
    return { value: null, reason: `\`docker compose ps\` exited ${error.status ?? error.signal}` };
  }
  if (id === '') return { value: null, reason: `the compose \`${POSTGRES_SERVICE}\` service is not running` };
  try {
    return { value: run(['stats', '--no-stream', '--format', '{{.MemUsage}}', id.split('\n')[0]]), reason: null };
  } catch (error) {
    return { value: null, reason: `\`docker stats\` exited ${error.status ?? error.signal}` };
  }
}

/** One server child over the fixture: cold start, every query once, memory, then teardown. */
async function driveServer({ backend, checkout, fixtureDir, queries }) {
  const transport = new StdioClientTransport({
    ...serverCommand(backend, checkout, fixtureDir),
    env: childEnv(backend),
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const client = new Client({ name: 'docs-retrieval-mcp-backend-pass', version: '0.0.0' });
  const calls = [];
  let pids = [];
  let leftover = [];
  let measured;
  try {
    const started = performance.now();
    await client.connect(transport);
    const connectMs = performance.now() - started;
    let firstCallMs;
    for (const query of queries) {
      const callStarted = performance.now();
      const result = await client.callTool({ name: SEARCH_TOOL_NAME, arguments: { query: query.query } }, undefined, {
        timeout: CALL_TIMEOUT_MS,
      });
      const returned = performance.now();
      firstCallMs ??= returned - started;
      if (result.isError === true) {
        refuse(`${SEARCH_TOOL_NAME} failed on query ${query.id}: ${result.content.map((part) => part.text).join('\n')}`);
      }
      calls.push({ id: query.id, roundTripMs: returned - callStarted, serverMs: null });
    }

    const tree = subtree(transport.pid);
    pids = tree.map((row) => row.pid);
    if (tree.length === 0) refuse(`the ${backend} server (pid ${transport.pid}) was not running when its memory was read`);
    const serverVersion = client.getServerVersion();
    measured = {
      serverId: { name: serverVersion?.name, version: serverVersion?.version },
      coldStart: { connectMs, firstCallMs },
      residentKb: tree.reduce((sum, row) => sum + row.rssKb, 0),
      residentProcesses: tree.map(({ depth, rssKb }) => ({ depth, rssKb })),
      postgres: backend === 'python' ? postgresMemory(checkout) : { value: null, reason: null },
    };
  } finally {
    if (pids.length === 0 && transport.pid !== null) pids = subtree(transport.pid).map((row) => row.pid);
    await client.close();
    leftover = await awaitExit(pids);
  }
  if (leftover.length > 0) refuse(`the ${backend} server's processes ${leftover.join(', ')} were still running after close and were killed`);

  if (backend === 'python') {
    const timings = stderr
      .split(/\r?\n/)
      .filter((line) => line.startsWith(TIMING_LINE_PREFIX))
      .map((line) => Number(line.slice(TIMING_LINE_PREFIX.length)));
    if (timings.length !== calls.length) {
      refuse(`the python server printed ${timings.length} \`${TIMING_LINE_PREFIX}\` lines for ${calls.length} calls`);
    }
    timings.forEach((ms, index) => {
      calls[index].serverMs = ms;
    });
  }
  return { ...measured, calls };
}

function latency(values) {
  return { p50: percentile(values, 50), p95: percentile(values, 95) };
}

/**
 * Drive `backend`'s stdio MCP server over a warm mirror of the corpus and return what
 * {@link renderMcpBackendSection} renders.
 *
 * `options` is the eval's parsed argument surface (`evals/docs-retrieval/args.mjs`) plus a raw backend
 * label; it reads `repo`, `checkout`, `corpus`, `queries` and `backend`. `--k` and `--repeat` are not
 * honoured: each query is called once, at each server's own default `k`.
 */
export async function runMcpBackendPass({ repo, checkout, corpus, queries: queriesPath, backend }) {
  const resolvedBackend = backendFor(backend);
  if ((process.env[RETRIEVAL_STUB_ENV] ?? '') !== '') {
    refuse(`${RETRIEVAL_STUB_ENV} is set; this pass records real-model numbers only, so unset it and re-run`);
  }
  if (resolvedBackend === 'typescript') assertRealModelsAreAvailable();

  const queries = loadQueries(queriesPath);
  const resolved = corpusConfig({ repoRoot: repo ?? checkout, corpus });
  const fixture = buildMirrorFixture(checkout, resolved);
  try {
    if (resolvedBackend === 'python') assertPythonBackendAvailable({ checkout, fixtureDir: fixture.dir });
    const snapshot = await warmIndex(resolvedBackend, checkout, fixture.dir);
    const run = await driveServer({ backend: resolvedBackend, checkout, fixtureDir: fixture.dir, queries });
    const serverTimes = run.calls.map((call) => call.serverMs);
    return {
      backend: resolvedBackend,
      corpus: resolved.id,
      snapshot,
      serverId: run.serverId,
      coldStart: run.coldStart,
      calls: run.calls,
      client: latency(run.calls.map((call) => call.roundTripMs)),
      server: serverTimes.every((ms) => ms === null) ? null : latency(serverTimes),
      residentKb: run.residentKb,
      residentProcesses: run.residentProcesses,
      postgresMemory: run.postgres.value,
      postgresMemoryReason: run.postgres.reason,
      host: `${platform()} ${release()}`,
      node: process.version,
      generatedAt: new Date().toISOString(),
    };
  } finally {
    removeMirrorFixture(fixture.dir);
  }
}

function ms(value) {
  return value === null || value === undefined ? '—' : value.toFixed(1);
}

/** The process rows' labels: what each depth of the spawned subtree is, per backend. */
function processLabel(backend, depth) {
  if (backend === 'python') return ['`bash` wrapper', '`uv`', 'the server'][depth] ?? 'a child of the server';
  return depth === 0 ? 'the server' : 'a child of the server';
}

/** One Markdown block for {@link runMcpBackendPass}'s result; no machine-local path, no connection string. */
export function renderMcpBackendSection(result) {
  const memoryRows = result.residentProcesses.map(
    (row) => `| ${processLabel(result.backend, row.depth)} (depth ${row.depth}) | ${row.rssKb} |`,
  );
  const postgres =
    result.backend !== 'python'
      ? 'not applicable: this backend runs no database'
      : result.postgresMemory ?? `not read: ${result.postgresMemoryReason}`;
  return [
    `**MCP backend pass — \`${result.backend}\`**, taken through \`mcp-backend-pass.mjs\`, warm index, model load included in \`firstCallMs\`.`,
    '',
    `- Corpus \`${result.corpus}\`, snapshot \`{ files: ${result.snapshot.files}, chunks: ${result.snapshot.chunks} }\``,
    `- Server \`${result.serverId.name}\` \`${result.serverId.version}\``,
    `- Cold start: \`connectMs\` ${ms(result.coldStart.connectMs)}, \`firstCallMs\` ${ms(result.coldStart.firstCallMs)}`,
    `- Calls: ${result.calls.length}, each query once at the server's default \`k\`; the first call is included in the percentiles`,
    '',
    '| Figure | p50 ms | p95 ms |',
    '| --- | --- | --- |',
    `| Client-side MCP round trip | ${ms(result.client.p50)} | ${ms(result.client.p95)} |`,
    result.server === null
      ? '| Server-side `search_ms` | — | — |'
      : `| Server-side \`search_ms\` | ${ms(result.server.p50)} | ${ms(result.server.p95)} |`,
    '',
    `Resident memory: ${result.residentKb} KB over the spawned process subtree.`,
    '',
    '| Process | rss KB |',
    '| --- | --- |',
    ...memoryRows,
    '',
    `- Postgres container memory: ${postgres}`,
    `- Host \`${result.host}\`, Node \`${result.node}\`, ${result.generatedAt}`,
  ].join('\n');
}
