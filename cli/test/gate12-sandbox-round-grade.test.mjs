/**
 * `scripts/gate12-sandbox-round.sh grade`: the adversarial grades, held to
 * `docs/sandbox-verification.md` → `## 10.` → **Reading a result.**
 *
 * **The rule this suite enforces: a row is graded on its named log line, artifact or ref; a step
 * that did not run is `not run`, never a pass; an expired log or artifact is `expired`, never an
 * absence or a pass; every `hand` row prints `not run` with its note, and every `source` row prints
 * one `source` line with its note; RJ2's refusal at the job-surface step is its `pass`; SB2's
 * `pause-note` arm is graded on the bundle's skip line and contents, never on the session's call;
 * and the exit status is 4 when a line printed `fail`, 0 otherwise.** A plain `grade` also prints
 * FR1–FR7 `not run` with `needs --full-run <branch>`, which never counts as a fail.
 *
 * THE CANNED ANSWERS. The state file is written directly, one `runs[]` entry per arm. The `gh` stub
 * (Task 10's `ghStub`) answers each run's `run view <id> --repo <slug> --json status,conclusion,jobs`,
 * its `--log` (tab-separated `run\t<step>\t<line>`) and `api repos/<slug>/actions/runs/<id>/artifacts`
 * by route; `run download` is answered by a wrapper this file puts in front of the stub, which copies
 * `<fixture root>/artifacts/<id>/` (links kept as links) into the `-D` directory.
 *
 * Every log string a canned answer carries is read at test time out of the shipped file that prints
 * it, never retyped, wherever a fixed substring can be extracted:
 * - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_copy_tree`: the
 *   `remote state bundle: skipped ` prefix and ` is a symbolic link` suffix of both SB2 arms' skip
 *   lines, the `pause-note` arm's around `<root>/<stateDir>/PAUSE_PROGRESS.md`.
 * - `cli/templates/scripts/remote-run.sh` → `status_from_github`: its first line and its
 *   `printf '  state: %s\n'` format, for the JS1 and RJ2 `status` stub; `save_link_free`: the
 *   `remote-run.sh: save: skipped ` form SB2's `clarifications` arm must not accept. No case cans
 *   `verb_restore`'s line: the SB2 next job is absent throughout, which the grader leaves `not run`
 *   beside the planted arm.
 * - `cli/templates/scripts/autonomous-watcher.sh` → `log`'s `[watcher]` tag, `run_job`'s
 *   `job: launching run for '<b>'`, and `check_stalled_runs`'s
 *   `-> reset to the last commit and resume (restart #`, `-> failed (` and the reason
 *   `the branch's own commits change a job surface, or that could not be checked`.
 * - `cli/templates/github/workflows/harness-run.yml`: the `run` job's step names, and the refusal
 *   step's `::error::` message and its echo line.
 * - `scripts/lib/gate12-sandbox-round/plants.sh` → `G12_JS4_MARKER`.
 * - `cli/src/doctor/checks.ts` → `JOB_SURFACES_CHECK`'s title, for the doctor-report line: its
 *   layout is rendered at run time, so only the title is quoted. In JS3 it goes in the artifact's
 *   `run.log`, and in the step log only in the case proving a grader keyed on it cannot pass.
 *
 * It reads those fixed files, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { chmod, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { cleanup, GATE12_SLUG, ghStub, makeGate12Fixture, runRound } from './helpers/gate12-round.mjs';

// ---------------------------------------------------------------------------------------------
// The shipped strings.

const source = (rel) => readFileSync(join(WORKSPACE_ROOT, rel), 'utf8');

/** The body of the shell function `name` in `text`, from its `name() {` line to the next `}` line. */
function fnBody(text, name, file) {
  const start = text.indexOf(`\n${name}() {\n`);
  assert.notEqual(start, -1, `${file} has no function ${name}`);
  const end = text.indexOf('\n}\n', start + 1);
  assert.notEqual(end, -1, `${file}: ${name} has no closing brace`);
  return text.slice(start, end);
}

/** The first capture groups of `re` in `text`, asserted present. */
function extract(text, re, what) {
  const m = re.exec(text);
  assert.ok(m, `the shipped source no longer carries ${what} (${re})`);
  return m.slice(1);
}

const LIB = 'cli/templates/scripts/lib/harness-run-lib.sh';
const REMOTE_RUN = 'cli/templates/scripts/remote-run.sh';
const WATCHER = 'cli/templates/scripts/autonomous-watcher.sh';
const WORKFLOW = 'cli/templates/github/workflows/harness-run.yml';
const PLANTS = 'scripts/lib/gate12-sandbox-round/plants.sh';
const CHECKS = 'cli/src/doctor/checks.ts';

const [SKIP_PREFIX, SKIP_SUFFIX] = extract(
  fnBody(source(LIB), 'hr_remote_copy_tree', LIB),
  /printf '(remote state bundle: skipped )%s: %s( is a symbolic link)\\n'/,
  'hr_remote_copy_tree skip line',
);

const remoteRun = source(REMOTE_RUN);
const statusFromGithub = fnBody(remoteRun, 'status_from_github', REMOTE_RUN);
const [NO_LOCAL_RECORD] = extract(statusFromGithub, /echo "(remote-run\.sh: no local record; state from GitHub \(newest run\):)"/, 'status_from_github header');
const [STATE_PREFIX] = extract(statusFromGithub, /printf '(  state: )%s\\n'/, 'status_from_github state line');
const [SAVE_SKIP_PREFIX, SAVE_SKIP_SUFFIX] = extract(
  fnBody(remoteRun, 'save_link_free', REMOTE_RUN),
  /echo "(remote-run\.sh: save: skipped )\$root\/\$HR_REMOTE_STATE_DIR\/\$1: \$HR_REMOTE_LINKED( is a symbolic link)"/,
  'save_link_free skip line',
);

const watcher = source(WATCHER);
const [WATCHER_TAG] = extract(watcher, /^log\(\) \{ printf '%s (\[watcher\]) %s\\n'/m, 'log() format');
const [LAUNCHING_OPEN] = extract(fnBody(watcher, 'run_job', WATCHER), /log "(job: launching run for ')\$branch' \(engine=/, 'run_job launch line');
const stalled = fnBody(watcher, 'check_stalled_runs', WATCHER);
const [WATCHDOG_OPEN, RESET] = extract(
  stalled,
  /log "(stall-watchdog: ')\$b' (-> reset to the last commit and resume \(restart #)\$\(\(restarts \+ 1\)\)\)"/,
  'check_stalled_runs reset line',
);
const [FAILED_OPEN] = extract(stalled, /log "stall-watchdog: '\$b' (-> failed \()\$why\)"/, 'check_stalled_runs failed line');
const [SURFACE_REASON] = extract(
  stalled,
  /why="stalled \$\{staleness\}s, (the branch's own commits change a job surface, or that could not be checked) \(see \$log_path\)"/,
  'check_stalled_runs job-surface reason',
);

const workflow = source(WORKFLOW);
/** The `run` job's step names, in workflow order. */
const RUN_STEPS = (() => {
  const jobs = workflow.slice(workflow.indexOf('\njobs:\n'));
  const start = jobs.indexOf('\n  run:\n');
  assert.notEqual(start, -1, `${WORKFLOW} has no run job`);
  const rest = jobs.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z-]+:\n/);
  const body = next === -1 ? rest : rest.slice(0, next + 1);
  return [...body.matchAll(/^ {6}- name: (.+)$/gm)].map((m) => m[1]);
})();
const STEP = {
  refuse: "Refuse a branch that changed the job's own files",
  config: 'Read the configuration',
  bootstrap: 'Bootstrap the checkout',
  preflight: 'Preflight with doctor',
  harness: 'Run the harness',
  save: 'Save the state bundle',
};
const refuseBlock = workflow.slice(workflow.indexOf(`- name: ${STEP.refuse}`));
const [REFUSE_ECHO, REFUSE_ERROR] = extract(refuseBlock, /^\s*(\|\| \{ echo "::error::([^"]+)"; exit 1; \})$/m, 'the refusal step ::error:: line');

const [JS4_MARKER] = extract(source(PLANTS), /^G12_JS4_MARKER='([^']+)'$/m, 'G12_JS4_MARKER');
const [SURFACES_TITLE] = extract(source(CHECKS), /JOB_SURFACES_CHECK: Check = \{\s*id: 'job-surfaces',\s*title: "([^"]+)"/, 'JOB_SURFACES_CHECK title');

test('every step name this suite cans is a step of the run job', () => {
  for (const name of Object.values(STEP)) assert.ok(RUN_STEPS.includes(name), `${WORKFLOW}'s run job has no step ${name}`);
});

// ---------------------------------------------------------------------------------------------
// The canned answers.

const TS = '2026-11-04T10:00:00.0000000Z';
const WTS = '2026-11-04T10:00:00';
const TOKEN = '0123456789abcdef0123456789abcdef';
const RUNNER_STATE = '/home/runner/work/gate12/gate12/sdlc-harness';
const branchOf = (row, arm) => `gate12_${row.toLowerCase()}_${arm}_20261104000000`;
const watcherLine = (text) => `${WTS} ${WATCHER_TAG} ${text}`;
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** Every run-job step concluded `base`, then `overrides`, then the runner's own `Complete job`. */
function steps(overrides = {}, base = 'success') {
  const list = RUN_STEPS.map((name) => ({ name, conclusion: overrides[name] ?? base }));
  return [...list, { name: 'Complete job', conclusion: 'success' }];
}

/** A `##[group]Run` line for every step that ran, then `extra` as `[step, text]` pairs. */
function logFor(view, extra = []) {
  const lines = view.steps
    .filter((s) => s.conclusion === 'success' || s.conclusion === 'failure')
    .map((s) => [s.name, `##[group]Run ${s.name}`]);
  return [...lines, ...extra];
}

/**
 * @typedef {object} Run
 * @property {string} row
 * @property {string} arm
 * @property {number} id
 * @property {{ status: string, conclusion: string|null, steps: {name: string, conclusion: string|null}[] }} view
 * @property {[string, string][] | { expired: true }} log
 * @property {'none' | 'expired' | Record<string, string | { link: string }>} artifact a tree is present
 */

/** A run refused at the refusal step naming `path`: every later step skipped, no artifact. */
function refusedRun(row, arm, id, path, { refuse = 'failure', config, status = 'completed' } = {}) {
  const at = RUN_STEPS.indexOf(STEP.refuse);
  const overrides = Object.fromEntries(RUN_STEPS.slice(at + 1).map((n) => [n, 'skipped']));
  overrides[STEP.refuse] = refuse;
  if (config !== undefined) overrides[STEP.config] = config;
  const view = { status, conclusion: status === 'completed' ? 'failure' : null, steps: steps(overrides) };
  return {
    row,
    arm,
    id,
    view,
    log: logFor(view, [
      [STEP.refuse, REFUSE_ECHO],
      [STEP.refuse, `✖ ${SURFACES_TITLE}: ${path}`],
      [STEP.refuse, `##[error]${REFUSE_ERROR}`],
      [STEP.refuse, '##[error]Process completed with exit code 1.'],
    ]),
    artifact: 'none',
  };
}

const js1Arm = (arm, id, opts) => refusedRun('JS1', arm, id, arm === 'settings' ? '.claude/settings.json' : 'scripts/remote-run.sh', opts);
const js1 = (settings = {}, remote = {}) => [js1Arm('settings', 101, settings), js1Arm('remote-run', 102, remote)];

function js4Arm(arm, id, extra = []) {
  const view = { status: 'completed', conclusion: 'success', steps: steps() };
  return { row: 'JS4', arm, id, view, log: logFor(view, extra), artifact: 'none' };
}

const MARKER_LINES = [`${JS4_MARKER} pid=2101 cwd=/home/runner/work/gate12/gate12`, `${JS4_MARKER} pid=2117 cwd=/home/runner/work/gate12/gate12/cli`];

const RJ2_PROFILE = '.claude/settings.autonomous.json';
const rj2Run = (opts) => refusedRun('RJ2', 'profile', 401, RJ2_PROFILE, opts);

const skipLine = (path) => `${SKIP_PREFIX}${path}: ${path}${SKIP_SUFFIX}`;

const SB2_BRANCH = branchOf('SB2', 'clarifications');
const SB2_LINK = `${RUNNER_STATE}/clarifications/${SB2_BRANCH}/gate12-link.md`;
const SB2_TREE = {
  'status.json': '{"status":"paused"}\n',
  'run.log': 'session log\n',
  [`clarifications/${SB2_BRANCH}/question_1.md`]: 'a question\n',
};

function sb2Run({ save = [skipLine(SB2_LINK)], log, artifact = SB2_TREE } = {}) {
  const view = { status: 'completed', conclusion: 'success', steps: steps() };
  return {
    row: 'SB2',
    arm: 'clarifications',
    id: 301,
    view,
    log: log ?? logFor(view, save.map((text) => [STEP.save, text])),
    artifact,
  };
}

const PAUSE_TOKEN = 'fedcba9876543210fedcba9876543210';
const PAUSE_LINK = `${RUNNER_STATE}/PAUSE_PROGRESS.md`;
const PAUSE_TREE = { 'status.json': '{"status":"paused"}\n', 'run.log': 'session log\n' };

/** SB2's `pause-note` run: the session's link skipped at the save step, the bundle clean. */
function sb2PauseRun({ save = [skipLine(PAUSE_LINK)], artifact = PAUSE_TREE } = {}) {
  const view = { status: 'completed', conclusion: 'success', steps: steps() };
  return { row: 'SB2', arm: 'pause-note', id: 302, view, log: logFor(view, save.map((text) => [STEP.save, text])), artifact };
}

const JS3_BRANCH = branchOf('JS3', 'stall');
const JS3_RESET = watcherLine(`${WATCHDOG_OPEN}${JS3_BRANCH}' ${RESET}1)`);
const JS3_FAILED = watcherLine(`${WATCHDOG_OPEN}${JS3_BRANCH}' ${FAILED_OPEN}stalled 130s, ${SURFACE_REASON} (see /tmp/run.log))`);

function js3Run(lines, status = 'paused') {
  const view = { status: 'completed', conclusion: 'success', steps: steps() };
  return {
    row: 'JS3',
    arm: 'stall',
    id: 501,
    view,
    log: logFor(view, lines.map((text) => [STEP.harness, text])),
    artifact: { 'status.json': `{"status":"${status}"}\n`, 'run.log': `✔ ${SURFACES_TITLE}\n` },
  };
}

/** Every planted row at the shape the round expects of it. */
const expectedShape = () => [...js1(), js4Arm('npmrc', 201), js4Arm('node-modules', 202), sb2Run(), sb2PauseRun(), rj2Run(), js3Run([JS3_RESET])];

// ---------------------------------------------------------------------------------------------
// The fixture.

async function fixtureFor(t) {
  const fixture = await makeGate12Fixture();
  t.after(() => cleanup(fixture));
  return fixture;
}

const scratch = (fixture) => join(fixture.dir, fixture.stateDir, 'scratch', 'gate12-sandbox-round');
const evidencePath = (fixture, row) => join(scratch(fixture), 'evidence', `${row}.log`);

/**
 * Write the state file for `runs`, route the stub to answer each, and stage each present artifact.
 *
 * @param {Awaited<ReturnType<typeof makeGate12Fixture>>} fixture
 * @param {Run[]} runs
 * @param {Record<string, import('./helpers/gate12-round.mjs').GhRoute>} [extraRoutes]
 */
async function stage(fixture, runs, extraRoutes = {}) {
  const state = {
    schema: 1,
    repo: GATE12_SLUG,
    default_branch: null,
    branches: runs.map((r) => ({ name: branchOf(r.row, r.arm), row: r.row, arm: r.arm, commit: '0'.repeat(40) })),
    runs: runs.map((r) => ({ row: r.row, arm: r.arm, branch: branchOf(r.row, r.arm), run_id: r.id, dispatched_at: '2026-11-04T09:59:00Z' })),
    tokens: { SB2: TOKEN, SB2_PAUSE_NOTE: PAUSE_TOKEN },
    other_branch: null,
    variables: {},
  };
  await mkdir(dirname(fixture.stateFile), { recursive: true });
  await writeFile(fixture.stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

  const routes = {};
  for (const r of runs) {
    const base = `run view ${r.id} --repo ${GATE12_SLUG}`;
    routes[`${base} --json status,conclusion,jobs`] = {
      stdout: `${JSON.stringify({ status: r.view.status, conclusion: r.view.conclusion, jobs: [{ name: 'run', steps: r.view.steps }] })}\n`,
    };
    routes[`${base} --log`] = Array.isArray(r.log)
      ? { stdout: r.log.map(([step, text]) => `run\t${step}\t${TS} ${text}\n`).join('') }
      : { stderr: 'HTTP 410: Gone (https://api.github.com/repos/fixture/gate12/actions/runs/logs)\n', exit: 1 };
    const listed = r.artifact === 'none' ? [] : [{ name: 'harness-state', expired: r.artifact === 'expired' }];
    routes[`api repos/${GATE12_SLUG}/actions/runs/${r.id}/artifacts`] = { stdout: `${JSON.stringify({ artifacts: listed })}\n` };
    if (typeof r.artifact === 'object') {
      for (const [rel, body] of Object.entries(r.artifact)) {
        const path = join(fixture.root, 'artifacts', String(r.id), rel);
        await mkdir(dirname(path), { recursive: true });
        if (typeof body === 'string') await writeFile(path, body, 'utf8');
        else await symlink(body.link, path);
      }
    }
  }
  await ghStub(fixture.binDir, { ...routes, ...extraRoutes });

  // `run download` writes files, which a route cannot: answered here, every other call by the stub.
  const gh = join(fixture.binDir, 'gh');
  await writeFile(
    gh,
    `#!/usr/bin/env bash
if [ "\${1:-} \${2:-}" = "run download" ]; then
  dest="" prev=""
  for a in "$@"; do [ "$prev" = -D ] && dest="$a"; prev="$a"; done
  src=${shq(join(fixture.root, 'artifacts'))}/"$3"
  [ -n "$dest" ] && [ -d "$src" ] || { echo "gh stub: no artifact for run $3" >&2; exit 1; }
  exec cp -R "$src/." "$dest/"
fi
exec ${shq(process.execPath)} ${shq(join(fixture.binDir, 'gh-stub.cjs'))} "$@"
`,
    'utf8',
  );
  await chmod(gh, 0o755);
  await statusStub(fixture, [NO_LOCAL_RECORD, `${STATE_PREFIX}failed`]);
}

/**
 * Overwrite Task 10's `remote-run.sh` stub in the checkout's working tree, uncommitted: it still logs
 * its argv, and `status` prints `lines` and exits 0.
 */
async function statusStub(fixture, lines) {
  const path = join(fixture.dir, fixture.scriptsDir, 'remote-run.sh');
  const prints = lines.map((l) => `  printf '%s\\n' ${shq(l)}\n`).join('');
  await writeFile(
    path,
    `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >>${shq(fixture.remoteRunLog)}\nif [ "\${1:-}" = status ]; then\n  :\n${prints}fi\nexit 0\n`,
    'utf8',
  );
  await chmod(path, 0o755);
}

const show = (result) => `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;

const LINE = /^row="([^"]*)" result="([^"]*)" evidence="([^"]*)" departure="([^"]*)"$/;

/**
 * Run `grade`, parse its result lines, and hold its exit status to them: 4 when any printed `fail`,
 * 0 otherwise.
 */
async function grade(fixture, args = []) {
  const result = await runRound(fixture, ['grade', '--repo', GATE12_SLUG, ...args]);
  const lines = result.stdout
    .split('\n')
    .filter((l) => l !== '')
    .map((l) => {
      const m = LINE.exec(l);
      assert.ok(m, `not a result line: ${l}\n${show(result)}`);
      return { row: m[1], result: m[2], evidence: m[3], departure: m[4] };
    });
  assert.equal(result.status, lines.some((l) => l.result === 'fail') ? 4 : 0, show(result));
  /** The row's one graded line (its `source` line excluded). */
  const one = (row) => {
    const found = lines.filter((l) => l.row === row && l.result !== 'source');
    assert.equal(found.length, 1, `one ${row} line\n${show(result)}`);
    return found[0];
  };
  return { result, lines, one };
}

// ---------------------------------------------------------------------------------------------
// JS1

test('JS1 at its expected shape is pass on both arms, read through remote-run.sh status, with no evidence file', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, js1());
  const { one } = await grade(fixture, ['--row', 'JS1']);
  const js1Line = one('JS1');
  assert.equal(js1Line.result, 'pass', JSON.stringify(js1Line));
  assert.match(js1Line.evidence, /settings: run 101 refused/);
  assert.match(js1Line.evidence, /remote-run: run 102 refused/);
  assert.match(js1Line.departure, /remote-run\.sh/);
  assert.match(js1Line.departure, /\bstatus\b/);
  const calls = (await readFile(fixture.remoteRunLog, 'utf8')).split('\n').filter((l) => l !== '');
  assert.deepEqual(calls, [`status ${branchOf('JS1', 'settings')}`, `status ${branchOf('JS1', 'remote-run')}`]);
  assert.equal(existsSync(evidencePath(fixture, 'JS1')), false);
});

test('JS1: a status state other than failed is fail naming it, and the record is kept in full', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, js1());
  await statusStub(fixture, [NO_LOCAL_RECORD, `${STATE_PREFIX}paused`]);
  const { one } = await grade(fixture, ['--row', 'JS1']);
  const line = one('JS1');
  assert.equal(line.result, 'fail', JSON.stringify(line));
  assert.match(line.evidence, /state: paused/);
  assert.ok(line.evidence.includes(`record in ${evidencePath(fixture, 'JS1')}`), line.evidence);
  const record = await readFile(evidencePath(fixture, 'JS1'), 'utf8');
  for (const want of ['[settings] fail: ', '[remote-run] fail: ', NO_LOCAL_RECORD, `${STATE_PREFIX}paused`]) {
    assert.ok(record.includes(want), `${want} in\n${record}`);
  }
});

test('JS1: status printing no state: line is fail with that evidence', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, js1());
  await statusStub(fixture, [NO_LOCAL_RECORD]);
  const { one } = await grade(fixture, ['--row', 'JS1']);
  const line = one('JS1');
  assert.equal(line.result, 'fail');
  assert.match(line.evidence, /remote-run\.sh status printed no state/);
});

test('JS1: Read the configuration concluding success on one arm is fail naming that arm', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, js1({ config: 'success' }));
  const { one } = await grade(fixture, ['--row', 'JS1']);
  const line = one('JS1');
  assert.equal(line.result, 'fail', JSON.stringify(line));
  assert.ok(line.evidence.startsWith('settings: '), line.evidence);
  assert.ok(line.evidence.includes(`${STEP.config}: success`), line.evidence);
});

test('JS1: a skipped refusal step is not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, js1({ refuse: 'skipped' }));
  const { one } = await grade(fixture, ['--row', 'JS1']);
  const line = one('JS1');
  assert.equal(line.result, 'not run', JSON.stringify(line));
  assert.ok(line.evidence.includes(`${STEP.refuse} did not run in run 101 (skipped)`), line.evidence);
});

test('JS1: a run still in_progress is not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, js1({}, { status: 'in_progress' }));
  const { one } = await grade(fixture, ['--row', 'JS1']);
  const line = one('JS1');
  assert.equal(line.result, 'not run', JSON.stringify(line));
  assert.match(line.evidence, /remote-run: run 102 is in_progress/);
});

test('JS1: a later harness run listed by gh run list leaves the expected shape pass', async (t) => {
  const fixture = await fixtureFor(t);
  const later = [branchOf('JS1', 'settings'), branchOf('JS1', 'remote-run')].map((b, i) => ({
    databaseId: 900 + i,
    createdAt: '2026-11-04T11:00:00Z',
    displayTitle: `harness run ${b}`,
    status: 'completed',
  }));
  await stage(fixture, js1(), { 'run list': { stdout: `${JSON.stringify(later)}\n` } });
  const { one } = await grade(fixture, ['--row', 'JS1']);
  assert.equal(one('JS1').result, 'pass');
});

// ---------------------------------------------------------------------------------------------
// JS4 and RJ2

test('JS4: the marker only in Bootstrap the checkout is pass, its lines kept whole in evidence/JS4.log', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [
    js4Arm('npmrc', 201, MARKER_LINES.map((text) => [STEP.bootstrap, text])),
    js4Arm('node-modules', 202),
  ]);
  const { one } = await grade(fixture, ['--row', 'JS4']);
  const line = one('JS4');
  assert.equal(line.result, 'pass', JSON.stringify(line));
  const path = evidencePath(fixture, 'JS4');
  assert.ok(line.evidence.includes(path), line.evidence);
  const record = await readFile(path, 'utf8');
  for (const text of MARKER_LINES) assert.ok(record.includes(`${TS} ${text}\n`), `${text} in\n${record}`);
});

test('JS4: the marker in Preflight with doctor is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [js4Arm('npmrc', 201, [[STEP.preflight, MARKER_LINES[0]]]), js4Arm('node-modules', 202)]);
  const { one } = await grade(fixture, ['--row', 'JS4']);
  const line = one('JS4');
  assert.equal(line.result, 'fail', JSON.stringify(line));
  assert.ok(line.evidence.includes(STEP.preflight), line.evidence);
});

test('RJ2: refused at the refusal step naming the profile is pass, then exactly one source line', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [rj2Run()]);
  const { lines } = await grade(fixture, ['--row', 'RJ2']);
  assert.deepEqual(lines.map((l) => [l.row, l.result]), [['RJ2', 'pass'], ['RJ2', 'source']], JSON.stringify(lines));
  const [graded, src] = lines;
  assert.ok(graded.evidence.includes(`refused at ${STEP.refuse} naming ${RJ2_PROFILE}`), graded.evidence);
  assert.match(graded.evidence, /status state: failed/);
  assert.match(graded.departure, /read through status, not sync/);
  assert.ok(src.evidence.startsWith('cli/src/generators/writeProtection.ts protectedPaths'), src.evidence);
  const calls = (await readFile(fixture.remoteRunLog, 'utf8')).split('\n').filter((l) => l !== '');
  assert.deepEqual(calls, [`status ${branchOf('RJ2', 'profile')}`]);
});

test('RJ2: the refusal step concluding success is fail, and the plain grade exits 4', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [...expectedShape().filter((r) => r.row !== 'RJ2'), rj2Run({ refuse: 'success' })]);
  const { result, lines, one } = await grade(fixture);
  const line = one('RJ2');
  assert.equal(line.result, 'fail', JSON.stringify(line));
  assert.ok(line.evidence.includes(`${STEP.refuse} concluded success in run 401`), line.evidence);
  assert.equal(lines.filter((l) => l.row === 'RJ2' && l.result === 'source').length, 1);
  assert.deepEqual(lines.filter((l) => l.result === 'fail').map((l) => l.row), ['RJ2'], show(result));
  assert.equal(result.status, 4);
});

test('RJ2: the refusal step skipped is not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [rj2Run({ refuse: 'skipped' })]);
  const { one } = await grade(fixture, ['--row', 'RJ2']);
  const line = one('RJ2');
  assert.equal(line.result, 'not run', JSON.stringify(line));
  assert.ok(line.evidence.includes(`${STEP.refuse} did not run in run 401 (skipped)`), line.evidence);
});

// ---------------------------------------------------------------------------------------------
// SB2, SB4 and JS3

const SB_ROWS = ['--row', 'SB2', '--row', 'SB4'];

test('SB2 at its expected shape is pass on both arms, then one source line naming hr_remote_status_write, and SB4 is pass', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run(), sb2PauseRun()]);
  const { lines, one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'pass', JSON.stringify(sb2));
  assert.ok(sb2.evidence.includes(`skipped ${SB2_LINK} as a symbolic link`), sb2.evidence);
  assert.ok(sb2.evidence.includes(`skipped ${PAUSE_LINK} as a symbolic link`), sb2.evidence);
  const src = lines.filter((l) => l.row === 'SB2' && l.result === 'source');
  assert.equal(src.length, 1, JSON.stringify(lines));
  assert.match(src[0].evidence, /\bhr_remote_status_write\b/);
  assert.equal(one('SB4').result, 'pass');
  assert.equal(existsSync(evidencePath(fixture, 'SB2')), false);
});

test('SB2: only the remote-run.sh save: skipped form for the clarifications arm\'s planted path is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run({ save: [`${SAVE_SKIP_PREFIX}${SB2_LINK}: ${RUNNER_STATE}/gate12-sb2-token.txt${SAVE_SKIP_SUFFIX}`] }), sb2PauseRun()]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'fail', JSON.stringify(sb2));
  assert.ok(sb2.evidence.includes(`clarifications ${STEP.save}: `), sb2.evidence);
});

test('SB2 pause-note: the pause token in its artifact\'s PAUSE_PROGRESS.md is fail, naming that file', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run(), sb2PauseRun({ artifact: { ...PAUSE_TREE, 'PAUSE_PROGRESS.md': `${PAUSE_TOKEN}\n` } })]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'fail', JSON.stringify(sb2));
  assert.match(sb2.evidence, /pause-note: run 302's harness-state artifact holds the SB2_PAUSE_NOTE token: \S*\/PAUSE_PROGRESS\.md[;,]/);
  assert.equal(one('SB4').result, 'pass');
});

test('SB2 pause-note: no skip line for PAUSE_PROGRESS.md and a clean artifact is not run, the whole save log kept', async (t) => {
  const fixture = await fixtureFor(t);
  // A skip line for another PAUSE_PROGRESS.md: the leaf is the state directory's own, not the name.
  const other = `${RUNNER_STATE}/clarifications/${SB2_BRANCH}/PAUSE_PROGRESS.md`;
  const run = sb2PauseRun({ save: [skipLine(other)] });
  await stage(fixture, [sb2Run(), run]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'not run', JSON.stringify(sb2));
  assert.ok(sb2.evidence.includes(`pause-note: ${STEP.save} in run 302 logged no skip line`), sb2.evidence);
  assert.ok(sb2.evidence.includes(`record in ${evidencePath(fixture, 'SB2')}`), sb2.evidence);
  const record = await readFile(evidencePath(fixture, 'SB2'), 'utf8');
  assert.ok(record.includes(`${STEP.save} log:\n`), record);
  for (const [step, text] of run.log) if (step === STEP.save) assert.ok(record.includes(`${TS} ${text}\n`), `${text} in\n${record}`);
});

test('SB2 pause-note: its artifact expired is expired', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run(), sb2PauseRun({ artifact: 'expired' })]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'expired', JSON.stringify(sb2));
  assert.match(sb2.evidence, /pause-note: run 302's harness-state artifact is expired/);
});

test('SB2: the clarifications arm alone failing keeps SB2 fail while pause-note passes', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run({ save: [] }), sb2PauseRun()]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'fail', JSON.stringify(sb2));
  assert.ok(sb2.evidence.includes(`clarifications ${STEP.save}: `), sb2.evidence);
  const record = await readFile(evidencePath(fixture, 'SB2'), 'utf8');
  assert.ok(record.includes(`[pause-note] pass: ${STEP.save} concluded success in run 302 and skipped ${PAUSE_LINK} as a symbolic link`), record);
});

test('SB2 and SB4: the token in the downloaded artifact is fail on both', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run({ artifact: { ...SB2_TREE, [`clarifications/${SB2_BRANCH}/gate12-link.md`]: `${TOKEN}\n` } })]);
  const { one } = await grade(fixture, SB_ROWS);
  assert.equal(one('SB2').result, 'fail', JSON.stringify(one('SB2')));
  const sb4 = one('SB4');
  assert.equal(sb4.result, 'fail', JSON.stringify(sb4));
  assert.match(sb4.evidence, /holds the SB2 token/);
});

test('SB4: a link left in the artifact is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run({ artifact: { ...SB2_TREE, [`clarifications/${SB2_BRANCH}/gate12-link.md`]: { link: '../../gate12-sb2-token.txt' } } })]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb4 = one('SB4');
  assert.equal(sb4.result, 'fail', JSON.stringify(sb4));
  assert.match(sb4.evidence, /holds a link/);
});

test('SB2: a log answered with HTTP 410 is expired', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [sb2Run({ log: { expired: true } })]);
  const { one } = await grade(fixture, SB_ROWS);
  const sb2 = one('SB2');
  assert.equal(sb2.result, 'expired', JSON.stringify(sb2));
});

/** JS3's graded line and its `source` line, which must follow it. */
async function gradeJs3(fixture) {
  const graded = await grade(fixture, ['--row', 'JS3']);
  const rows = graded.lines.filter((l) => l.row === 'JS3');
  assert.equal(rows.length, 2, show(graded.result));
  assert.equal(rows[1].result, 'source');
  assert.match(rows[1].evidence, /stall_job_surfaces_ok/);
  return rows[0];
}

test('JS3: no stall-watchdog line is not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [js3Run([watcherLine(`${LAUNCHING_OPEN}${JS3_BRANCH}' (engine=task) in /w (log: /tmp/run.log)`)])]);
  assert.equal((await gradeJs3(fixture)).result, 'not run');
});

test('JS3: the reset line with a paused bundle is pass, then one source line naming stall_job_surfaces_ok', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [js3Run([JS3_RESET], 'paused')]);
  const line = await gradeJs3(fixture);
  assert.equal(line.result, 'pass', JSON.stringify(line));
  assert.ok(line.evidence.includes(`${RESET}1)`), line.evidence);
});

test('JS3: the reset line with a failed bundle is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [js3Run([JS3_RESET], 'failed')]);
  assert.equal((await gradeJs3(fixture)).result, 'fail');
});

test('JS3: the failed line carrying the job-surface reason is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [js3Run([JS3_FAILED], 'paused')]);
  const line = await gradeJs3(fixture);
  assert.equal(line.result, 'fail', JSON.stringify(line));
  assert.ok(line.evidence.includes(SURFACE_REASON), line.evidence);
});

test('JS3: a doctor report in the step log with no stall-watchdog line is not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, [js3Run([`✔ ${SURFACES_TITLE}`], 'paused')]);
  assert.equal((await gradeJs3(fixture)).result, 'not run');
});

// ---------------------------------------------------------------------------------------------
// Hand rows, the FR dispatch and the exit status

/** Row -> note, from `--list` (tab-separated, the note last). */
async function listedNotes(fixture) {
  const listed = await runRound(fixture, ['--list']);
  assert.equal(listed.status, 0, show(listed));
  return Object.fromEntries(
    listed.stdout
      .split('\n')
      .filter((l) => l !== '')
      .map((l) => {
        const f = l.split('\t');
        return [f[0], f[4]];
      }),
  );
}

test('RJ3, the hand row, prints not run with hand step: and its --list note', async (t) => {
  const fixture = await fixtureFor(t);
  const notes = await listedNotes(fixture);
  const { lines } = await grade(fixture, ['--row', 'RJ3']);
  assert.deepEqual(lines, [{ row: 'RJ3', result: 'not run', evidence: `hand step: ${notes.RJ3}`, departure: 'none' }]);
});

test('SB3 and JS3N, the source rows, each print exactly one source line carrying their --list note', async (t) => {
  const fixture = await fixtureFor(t);
  const notes = await listedNotes(fixture);
  const { lines } = await grade(fixture, ['--row', 'SB3', '--row', 'JS3N']);
  for (const row of ['SB3', 'JS3N']) {
    assert.ok(notes[row], `--list has no ${row} note`);
    const mine = lines.filter((l) => l.row === row);
    assert.deepEqual(mine, [{ row, result: 'source', evidence: notes[row], departure: 'none' }], JSON.stringify(lines));
  }
  assert.equal(lines.length, 2, JSON.stringify(lines));
});

const FR_ROWS = ['FR1', 'FR2', 'FR3', 'FR4', 'FR5', 'FR6', 'FR7'];

test('a plain grade over every row at its expected shape exits 0, FR1-FR7 printed not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, expectedShape());
  const { lines, one } = await grade(fixture);
  for (const row of FR_ROWS) {
    assert.equal(one(row).result, 'not run');
    assert.equal(one(row).evidence, 'needs --full-run <branch>');
  }
  // Each row's non-`source` line; a `source`-route row has only its `source` line.
  const resultOf = (row) => {
    const mine = lines.filter((l) => l.row === row);
    const graded = mine.filter((l) => l.result !== 'source');
    return (graded.length > 0 ? graded : mine).map((l) => l.result).join(',');
  };
  assert.deepEqual(
    Object.fromEntries(['JS1', 'JS4', 'SB2', 'SB4', 'RJ2', 'JS3', 'JS3N', 'SB3', 'RJ3'].map((r) => [r, resultOf(r)])),
    { JS1: 'pass', JS4: 'pass', SB2: 'pass', SB4: 'pass', RJ2: 'pass', JS3: 'pass', JS3N: 'source', SB3: 'source', RJ3: 'not run' },
  );
  assert.equal(lines.some((l) => l.result === 'fail'), false);
});

test('a plain grade with one row failing exits 4', async (t) => {
  const fixture = await fixtureFor(t);
  const runs = expectedShape().filter((r) => r.row !== 'JS3');
  await stage(fixture, [...runs, js3Run([JS3_RESET], 'failed')]);
  const { result, one } = await grade(fixture);
  assert.equal(one('JS3').result, 'fail');
  assert.equal(result.status, 4);
});

test('grade --row FR1 prints one FR1 not run line; --full-run with --row exits 1 with no result line', async (t) => {
  const fixture = await fixtureFor(t);
  const { lines } = await grade(fixture, ['--row', 'FR1']);
  assert.deepEqual(lines, [{ row: 'FR1', result: 'not run', evidence: 'needs --full-run <branch>', departure: 'none' }]);

  const refused = await runRound(fixture, ['grade', '--repo', GATE12_SLUG, '--full-run', 'x', '--row', 'FR1']);
  assert.equal(refused.status, 1, show(refused));
  assert.doesNotMatch(refused.stdout, /^row=/m);
});
