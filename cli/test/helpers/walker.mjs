/**
 * The driver the flow-walker suites share: the `flow-walker.sh` that `init` writes, called one
 * literal command at a time against a fixture repository, with its stdout parsed into the ordered
 * `key: value` pairs its OUTPUT contract fixes.
 *
 * **The rule this module exists to enforce: the walker under test is the copy `init` shipped into
 * the fixture, never the template in this checkout.** A case that ran the template would pass on a
 * walker `init` had failed to write, or had written somewhere else.
 *
 * `node --test test` loads this file as a test file of its own, so nothing here runs at import time.
 *
 * A findings file is planted **before** the `FAIL` it stands for is fed, because the walker resolves
 * each reviewer's `arg.iteration` and each gate's round count from the folder's real contents.
 */

import assert from 'node:assert/strict';
import { accessSync, constants as fsConstants, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { delimiter, dirname, join } from 'node:path';

import { createFixture, runBash, runCli } from './fixture.mjs';

const WALKER_PATH = 'scripts/flow-walker.sh';
const FLOW = 'task_plan_writing';

/** The fixture's own copy of the graph — the one a mutation check edits, never the template. */
export const WALKER_GRAPH_PATH = `scripts/flows/${FLOW}.graph.json`;

const CONFIG_PATH = 'harness.config.json';

/** The seed `init`'s own tests use: a repository whose stack detection resolves every command. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

function onPath(name) {
  for (const entry of (process.env.PATH ?? '').split(delimiter)) {
    if (entry === '') continue;
    try {
      accessSync(join(entry, name), fsConstants.X_OK);
      return true;
    } catch {
      // Not here; keep looking.
    }
  }
  return false;
}

/**
 * The reason a walker case cannot run on this host, or `false`: the walker faults without `bash`
 * or `jq`, which is a statement about the host rather than about the walker.
 */
export function walkerUnavailable() {
  for (const tool of ['bash', 'jq']) {
    if (!onPath(tool)) return `${tool} does not resolve on this process's PATH, so ${WALKER_PATH} cannot be driven here`;
  }
  return false;
}

function readConfig(dir) {
  return JSON.parse(readFileSync(join(dir, CONFIG_PATH), 'utf8'));
}

/** The configured `stateDir`, without its trailing slash. */
export function stateDirOf(dir) {
  return readConfig(dir).stateDir.replace(/\/+$/, '');
}

/**
 * A fixture `init` has wired, with `phases.parity` and `phases.qa` set as given.
 *
 * @param {{ parity: boolean, qa: boolean, branch?: string }} options
 * @returns {Promise<{ dir: string, branch: string, cleanup: () => Promise<void> }>}
 */
export async function walkerFixture({ parity, qa, branch = 'feat_x' }) {
  const { dir, cleanup } = await createFixture({ files: nodeProjectFiles() });
  const init = await runCli(dir, ['init']);
  if (init.status !== 0) {
    await cleanup();
    assert.fail(`init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  }
  const config = readConfig(dir);
  config.phases = { ...(config.phases ?? {}), parity, qa };
  await writeFile(join(dir, CONFIG_PATH), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { dir, branch, cleanup };
}

/** Stdout's `key: value` lines as ordered pairs, split at the first `: `. */
function parseAction(stdout) {
  return stdout
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const at = line.indexOf(': ');
      return at === -1 ? [line, ''] : [line.slice(0, at), line.slice(at + 2)];
    });
}

/**
 * One walker call from the fixture root, exactly as an orchestrator issues it.
 *
 * @param {string} dir
 * @param {readonly string[]} args the subcommand and its flags.
 */
export async function walk(dir, args) {
  const { status, stdout, stderr } = await runBash(dir, [WALKER_PATH, ...args]);
  return { status, stdout, stderr, action: parseAction(stdout) };
}

/**
 * Write the `review_<n>.md` a reviewer's `FAIL` leaves behind.
 *
 * @param {string} dir
 * @param {string} folder the findings folder under `stateDir`, branch segment included.
 * @param {number} n
 * @returns {Promise<string>} the file's repo-relative path — the `findings_file` the reviewer returns.
 */
export async function plantReview(dir, folder, n) {
  const relative = `${stateDirOf(dir)}/${folder}/review_${n}.md`;
  await mkdir(join(dir, dirname(relative)), { recursive: true });
  await writeFile(join(dir, relative), `# review ${n}\n`, 'utf8');
  return relative;
}

/**
 * Write a flow-progress ledger carrying only the `## Run mode` block
 * `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates` fixes, its `phases:`
 * line read off the fixture's configuration as that template requires.
 *
 * @param {string} dir
 * @param {string} branch
 * @param {string} skippedCsv the `- skipped:` value: directive ids, comma-separated, or `none`.
 */
export async function plantLedger(dir, branch, skippedCsv) {
  const stateDir = stateDirOf(dir);
  const phases = readConfig(dir).phases ?? {};
  const flag = (name) => (phases[name] === true ? 'true' : 'false');
  const relative = `${stateDir}/flow_progress/${branch}_progress.md`;
  const body = [
    `# Flow progress — ${branch}   (engine: task)`,
    '',
    '## Run mode',
    `Source: ${stateDir}/task_prompts/${branch}_task_prompt.md → \`### Run mode\``,
    `- skipped: ${skippedCsv}`,
    `- phases: parity=${flag('parity')}, qa=${flag('qa')}, docs=${flag('docs')}`,
    '',
  ].join('\n');
  await mkdir(join(dir, dirname(relative)), { recursive: true });
  await writeFile(join(dir, relative), body, 'utf8');
}

/**
 * Drive a scripted sequence and return every action, refusing on the first non-zero exit.
 *
 * A step is `{ start: true }` or `{ outcome }`; a `FAIL` step carries `review: [folder, n]`, which
 * is planted first and passed as `--findings`. `skipped` is passed on every call as `--skipped`,
 * and `null` omits the flag so only a ledger can answer the run-mode gates.
 *
 * @param {string} dir
 * @param {ReadonlyArray<{ start?: boolean, entry?: string, outcome?: string, review?: [string, number] }>} steps
 * @param {{ branch?: string, skipped?: string | null }} [options]
 * @returns {Promise<Array<Array<[string, string]>>>}
 */
export async function run(dir, steps, { branch = 'feat_x', skipped = 'none' } = {}) {
  const actions = [];
  for (const step of steps) {
    const args = step.start ? ['start'] : ['next', '--outcome', step.outcome];
    args.push('--flow', FLOW, '--branch', branch);
    if (step.entry !== undefined) args.push('--entry', step.entry);
    if (step.review !== undefined) {
      const [folder, n] = step.review;
      args.push('--findings', await plantReview(dir, `${folder}/${branch}`, n));
    }
    if (skipped !== null) args.push('--skipped', skipped);
    const result = await walk(dir, args);
    assert.equal(result.status, 0, `\`${args.join(' ')}\` exited ${result.status}\n${result.stdout}\n${result.stderr}`);
    actions.push(result.action);
  }
  return actions;
}

/** The pending node's state file, for a refusal asserted on the bytes on disk. */
export function walkerStatePath(dir) {
  return join(dir, stateDirOf(dir), '.flow_walker_state');
}

export { FLOW as WALKER_FLOW };
