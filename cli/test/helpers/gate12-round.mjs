/**
 * The shared fixture of every `scripts/gate12-sandbox-round.sh` suite: a throwaway Gate 12
 * repository, a `gh` stub, and the two launchers that run the round driver against them.
 *
 * **The rule this module exists to enforce: the round driver only ever meets a repository built
 * here, under `os.tmpdir()`, and a `gh` that answers from a file.** The driver pushes branches,
 * edits a default branch and sets repository variables; pointed at anything real it would do so.
 *
 * - The checkout's raw `remote.origin.url` is the GitHub URL the preflight reads, while its own
 *   `url.<bare>.insteadOf` sends every fetch and push to the bare origin beside it.
 * - The stub `gh` answers a route keyed by argv prefix — the longest matching key wins, and a
 *   matching route answers verbatim and leaves the state untouched. With no route, `repo view`,
 *   `repo edit --default-branch`, `variable list|set|delete` and `run list` answer from, and
 *   change, the stub's state file; anything else exits 1. `--jq` is applied (through `jq -r`) to
 *   state answers and synthesised runs only, never to a route's fixed stdout.
 * - Nothing here runs at import time: `node --test` loads this file as a test file of its own.
 */

import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../../dist/core/mainRepoAnchor.js';
import { runBash, runGit, WORKSPACE_ROOT } from './fixture.mjs';

/** The `--repo` value the fixture's origin URL names. */
export const GATE12_SLUG = 'fixture/gate12';

/** The script every launcher runs unless a case names a copy. */
export const ROUND_SCRIPT = join(WORKSPACE_ROOT, 'scripts', 'gate12-sandbox-round.sh');

/** The step name the preflight's last check looks for in the default branch's workflow. */
const INSTALL_STEP ='Install the sandbox prerequisites';

const ORIGIN_URL = `https://github.com/${GATE12_SLUG}.git`;
const WORKFLOW_TEMPLATE = join(WORKSPACE_ROOT, 'cli', 'templates', 'github', 'workflows', 'harness-run.yml');
const ISOLATED_GITCONFIG = resolve(import.meta.dirname, 'isolated-gitconfig');

/** Every fixture root this module created; {@link cleanup} removes these and nothing else. */
const created = new Set();

/** One argument quoted for a generated bash script. */
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/**
 * @typedef {object} Gate12Fixture
 * @property {string} root the temp directory holding everything below
 * @property {string} dir the checkout, the driver's working directory
 * @property {string} origin the bare repository every push reaches
 * @property {string} binDir the `PATH` directory holding the `gh` stub
 * @property {string} stateDir
 * @property {string} scriptsDir
 * @property {string} remoteRunLog the stub `remote-run.sh`'s argv log, one space-joined line per call
 * @property {string} stateFile the driver's state file inside the checkout
 */

/**
 * @param {{ withInstallStep?: boolean, stateDir?: string, scriptsDir?: string, remoteRunExit?: number }} [options]
 * @returns {Promise<Gate12Fixture>}
 */
export async function makeGate12Fixture({
  withInstallStep = true,
  stateDir = 'sdlc-harness',
  scriptsDir = 'scripts',
  remoteRunExit = 0,
} = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'gate12-round-')));
  created.add(root);
  const dir = join(root, 'gate12');
  const origin = join(root, 'origin.git');
  const binDir = join(root, 'bin');
  const remoteRunLog = join(root, 'remote-run.log');
  await mkdir(dir);
  await mkdir(binDir);

  await runGit(root, ['init', '--quiet', '--bare', origin]);
  await runGit(origin, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  await runGit(dir, ['init', '--quiet']);
  await runGit(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  await runGit(dir, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(dir, ['config', 'user.name', 'Gate 12 Fixture']);
  await runGit(dir, ['config', `url.${origin}.insteadOf`, ORIGIN_URL]);
  await runGit(dir, ['remote', 'add', 'origin', ORIGIN_URL]);

  let workflow = readFileSync(WORKFLOW_TEMPLATE, 'utf8');
  if (!workflow.includes(INSTALL_STEP)) throw new Error(`fixture setup: ${WORKFLOW_TEMPLATE} has no step '${INSTALL_STEP}'`);
  if (!withInstallStep) workflow = workflow.replaceAll(INSTALL_STEP, 'Install prerequisites');

  const config = { version: 1, projectName: 'gate12', defaultBranch: 'main', stateDir, scriptsDir };
  const files = {
    'harness.config.json': `${JSON.stringify(config, null, 2)}\n`,
    '.claude/settings.json': `${JSON.stringify({ permissions: { allow: [] } }, null, 2)}\n`,
    '.github/workflows/harness-run.yml': workflow,
    // The scratch contents rule init's managed block renders for stateDir (repoRoot.ts → contentsIgnoredDirectory).
    '.gitignore': `${stateDir}/scratch/*\n`,
  };
  for (const [path, body] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true });
    await writeFile(join(dir, path), body, 'utf8');
  }
  const remoteRun = join(dir, scriptsDir, 'remote-run.sh');
  await mkdir(join(remoteRun, '..'), { recursive: true });
  await writeFile(
    remoteRun,
    `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >>${shq(remoteRunLog)}\nexit ${Number(remoteRunExit)}\n`,
    { mode: 0o755 },
  );

  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', 'gate12 fixture seed']);
  await runGit(dir, ['push', '--quiet', 'origin', 'HEAD:refs/heads/main']);
  await runGit(dir, ['fetch', '--quiet', 'origin']);

  await ghStub(binDir, {});

  return {
    root,
    dir,
    origin,
    binDir,
    stateDir,
    scriptsDir,
    remoteRunLog,
    stateFile: join(dir, stateDir, 'scratch', 'gate12-sandbox-round', 'state.json'),
  };
}

const GH_STUB_JS = `'use strict';
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');

function main() {
  const args = process.argv.slice(2);
  appendFileSync(join(__dirname, 'gh.calls.jsonl'), JSON.stringify(args) + '\\n');
  const routes = JSON.parse(readFileSync(join(__dirname, 'gh.routes.json'), 'utf8'));
  const statePath = join(__dirname, 'gh.state.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const save = () => writeFileSync(statePath, JSON.stringify(state, null, 2) + '\\n');
  const line = args.join(' ');
  const opt = (name) => {
    const i = args.indexOf(name);
    return i === -1 || i + 1 >= args.length ? undefined : args[i + 1];
  };
  const jq = opt('--jq');
  const answer = (value) => {
    const json = JSON.stringify(value);
    process.stdout.write(jq === undefined ? json + '\\n' : execFileSync('jq', ['-r', jq], { input: json, encoding: 'utf8' }));
    return 0;
  };
  const fail = (message) => {
    process.stderr.write('gh stub: ' + message + '\\n');
    return 1;
  };

  let key;
  for (const k of Object.keys(routes)) {
    if ((line === k || line.startsWith(k + ' ')) && (key === undefined || k.length > key.length)) key = k;
  }
  const route = key === undefined ? undefined : routes[key];
  if (route !== undefined && route.synthesiseRun === true) {
    const branch = opt('--branch');
    if (branch === undefined) return answer([]);
    if (!Object.prototype.hasOwnProperty.call(state.runs, branch)) {
      state.runs[branch] = (route.firstId ?? 1001) + Object.keys(state.runs).length;
      save();
    }
    return answer([{
      databaseId: state.runs[branch],
      createdAt: new Date().toISOString().replace(/\\.\\d{3}Z$/, 'Z'),
      displayTitle: 'harness run ' + branch,
      status: route.status ?? 'queued',
    }]);
  }
  if (route !== undefined) {
    if (route.stdout) process.stdout.write(route.stdout);
    if (route.stderr) process.stderr.write(route.stderr);
    return route.exit ?? 0;
  }

  const sub = args.slice(0, 2).join(' ');
  if (sub === 'repo view') return answer({ defaultBranchRef: { name: state.defaultBranch } });
  if (sub === 'repo edit') {
    const branch = opt('--default-branch');
    if (branch === undefined) return fail('no route for: ' + line);
    state.defaultBranch = branch;
    save();
    return 0;
  }
  if (sub === 'variable list') {
    return answer(Object.entries(state.variables).map(([name, value]) => ({ name, value })));
  }
  if (sub === 'variable set') {
    const body = opt('--body');
    if (args[2] === undefined || body === undefined) return fail('variable set needs <name> --body <value>');
    state.variables[args[2]] = body;
    save();
    return 0;
  }
  if (sub === 'variable delete') {
    if (!Object.prototype.hasOwnProperty.call(state.variables, args[2])) return fail('variable ' + args[2] + ' not found');
    delete state.variables[args[2]];
    save();
    return 0;
  }
  if (sub === 'run list') return answer([]);
  return fail('no route for: ' + line);
}

// exitCode rather than process.exit, so a pipe's pending write is not cut off.
process.exitCode = main();
`;

/**
 * @typedef {object} GhRoute
 * @property {string} [stdout]
 * @property {string} [stderr]
 * @property {number} [exit] default `0`
 * @property {boolean} [synthesiseRun] `run list` only: answer `--branch <b>` with one synthesised run
 * @property {string} [status] with `synthesiseRun`, default `queued`
 * @property {number} [firstId] with `synthesiseRun`, default `1001`
 */

/**
 * Write the `gh` stub into `dir`, which a launcher puts first on `PATH`. Rewrites the routes on every
 * call; the state file is written only when absent or when `state` is passed, so re-routing between
 * two runs keeps the variables, the default branch and the allotted run IDs.
 *
 * @param {string} dir
 * @param {Record<string, GhRoute>} routes keyed by argv prefix, e.g. `'repo view'`
 * @param {{ defaultBranch?: string, variables?: Record<string, string> }} [state]
 * @returns {Promise<string>} the stub's path
 */
export async function ghStub(dir, routes, state) {
  const statePath = join(dir, 'gh.state.json');
  if (state !== undefined || !existsSync(statePath)) {
    const { defaultBranch = 'main', variables = {} } = state ?? {};
    await writeFile(statePath, `${JSON.stringify({ defaultBranch, variables, runs: {} }, null, 2)}\n`, 'utf8');
  }
  await writeFile(join(dir, 'gh.routes.json'), `${JSON.stringify(routes, null, 2)}\n`, 'utf8');
  await writeFile(join(dir, 'gh-stub.cjs'), GH_STUB_JS, 'utf8');
  const gh = join(dir, 'gh');
  await writeFile(gh, `#!/usr/bin/env bash\nexec ${shq(process.execPath)} ${shq(join(dir, 'gh-stub.cjs'))} "$@"\n`, 'utf8');
  await chmod(gh, 0o755);
  return gh;
}

/** @returns {{ defaultBranch: string, variables: Record<string, string>, runs: Record<string, number> }} */
export function ghStubState(dir) {
  return JSON.parse(readFileSync(join(dir, 'gh.state.json'), 'utf8'));
}

/** The stub's `{ <branch>: <databaseId> }` map of synthesised runs. */
export function ghStubRuns(dir) {
  return ghStubState(dir).runs;
}

/** Every argv the stub was called with, in order. @returns {Promise<string[][]>} */
export async function ghStubCalls(dir) {
  if (!existsSync(join(dir, 'gh.calls.jsonl'))) return [];
  const text = await readFile(join(dir, 'gh.calls.jsonl'), 'utf8');
  return text.split('\n').filter((l) => l !== '').map((l) => JSON.parse(l));
}

const stubPath = (fixture) => `${fixture.binDir}${delimiter}${process.env.PATH ?? ''}`;

/**
 * Run the round driver in the fixture checkout through `runBash`, the stub directory first on `PATH`.
 *
 * @param {Gate12Fixture} fixture
 * @param {readonly string[]} args
 * @param {{ env?: Record<string, string>, script?: string }} [options] `script` runs a copy instead of {@link ROUND_SCRIPT}
 */
export function runRound(fixture, args, { env = {}, script = ROUND_SCRIPT } = {}) {
  return runBash(fixture.dir, [script, ...args], { PATH: stubPath(fixture), ...env });
}

/**
 * {@link runRound}'s command as a child the caller can signal. The anchor is blanked in the same
 * object as the environment spread: `cli/test/main-anchor-isolation.test.mjs` reads for exactly that.
 *
 * @param {Gate12Fixture} fixture
 * @param {readonly string[]} args
 * @param {{ env?: Record<string, string> }} [options]
 * @returns {import('node:child_process').ChildProcess}
 */
export function spawnRound(fixture, args, { env = {} } = {}) {
  return spawn('bash', [ROUND_SCRIPT, ...args], {
    cwd: fixture.dir,
    env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '', GIT_CONFIG_GLOBAL: ISOLATED_GITCONFIG, GIT_CONFIG_NOSYSTEM: '1', PATH: stubPath(fixture), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * Remove a fixture's root, or every root this module created when none is named.
 *
 * @param {Gate12Fixture} [fixture]
 */
export async function cleanup(fixture) {
  const roots = fixture === undefined ? [...created] : [fixture.root];
  for (const root of roots) {
    if (!created.has(root)) continue;
    await rm(root, { recursive: true, force: true });
    created.delete(root);
  }
}
