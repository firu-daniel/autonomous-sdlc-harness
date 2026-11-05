/**
 * `scripts/gate12-sandbox-round.sh grade --full-run <branch>`: FR1-FR7, held to
 * `docs/sandbox-verification.md` → `## 10.`, observation (xvi).
 *
 * **The rule this suite enforces: the full-run grade reads only what each FR row's Read from names,
 * prints a source clause as `source` rather than grading it, and keeps FR4's quotes in full.** A
 * missing job is `not run` and a gone log is `expired`, never a pass. It prints no JS, SB or RJ line
 * and reads no state file. A wrapper's refusal line in either spelling fails FR3 although its step
 * concluded success, and a restore with no placed line passes FR6 only when the parked job's bundle
 * holds no planning file; an expired bundle is `expired`. Round 13's two jobs are replayed on both.
 *
 * THE CANNED ANSWERS. `gh run list … --branch <b>` lists the branch's `harness run <b>` jobs; the
 * `gh` stub (Task 10's `ghStub`) answers each job's `run view <id> --repo <slug> --json
 * status,conclusion,jobs` and its `--log` (tab-separated `run\t<step>\t<line>`) by route. FR4's
 * `run-analytics.json` is committed on the branch and pushed to the fixture's bare origin.
 * A parked job's `harness-state` artifact is pre-seeded as `runs.sh`'s cache,
 * `<stateDir>/scratch/gate12-sandbox-round/runs/<id>/harness-state/`, because a route cannot write
 * the files `gh run download` would; `g12_artifact`'s download path is the adversarial-grade suite's
 * to prove. An expired or absent artifact is the `gh api …/artifacts` route alone.
 *
 * Every log string a canned answer carries is read at test time out of the shipped file that prints
 * it, never retyped:
 * - `cli/templates/scripts/autonomous-watcher.sh` → `log`'s `[watcher]` tag; `run_job`'s
 *   `job: launching run for '<b>'`, `job: parked stop`, `job: resuming parked run '<b>' (answers `
 *   and `job: <final> <decision>`; `spawn_refuse`'s `not launching '<b>': `.
 * - `cli/templates/scripts/remote-run.sh` → `verb_restore`'s restored, placed and wrote lines;
 *   `verb_save`'s saved line; `save_link_free`'s `remote-run.sh: save: skipped ` form.
 * - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_copy_tree`'s
 *   `remote state bundle: skipped ` prefix and ` is a symbolic link` suffix.
 * - `cli/templates/github/workflows/harness-run.yml`: the `run` job's step names, and the install
 *   step's present line.
 * - `cli/templates/scripts/push-branch.sh`: the prefix of its `$HR_WT_CONFIG_REFUSAL` refusal, and
 *   its detached-HEAD refusal.
 * - `cli/templates/scripts/commit-on-branch.sh`: the prefix of its `$HR_WT_CONFIG_REFUSAL` refusal.
 * A refusal's reason is composed at run time, so it is canned in round 13's shape.
 *
 * It reads those fixed files, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';
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

/** The capture groups of `re` in `text`, asserted present. */
function extract(text, re, what) {
  const m = re.exec(text);
  assert.ok(m, `the shipped source no longer carries ${what} (${re})`);
  return m.slice(1);
}

const LIB = 'cli/templates/scripts/lib/harness-run-lib.sh';
const PUSH_BRANCH = 'cli/templates/scripts/push-branch.sh';
const COMMIT_ON_BRANCH = 'cli/templates/scripts/commit-on-branch.sh';
const REMOTE_RUN = 'cli/templates/scripts/remote-run.sh';
const WATCHER = 'cli/templates/scripts/autonomous-watcher.sh';
const WORKFLOW = 'cli/templates/github/workflows/harness-run.yml';

const watcher = source(WATCHER);
const [WATCHER_TAG] = extract(watcher, /^log\(\) \{ printf '%s (\[watcher\]) %s\\n'/m, 'log() format');
const runJob = fnBody(watcher, 'run_job', WATCHER);
const [LAUNCHING_OPEN] = extract(runJob, /log "(job: launching run for ')\$branch' \(engine=/, 'run_job launch line');
const [PARKED_STOP] = extract(runJob, /echo "(job: parked stop)"/, 'run_job parked stop line');
const [RESUMING_OPEN, RESUMING_ANSWERS] = extract(
  runJob,
  /log "(job: resuming parked run ')\$branch(' \(answers )\$answered_set\) in \$worktree"/,
  'run_job resume line',
);
const [JOB_FINAL] = extract(runJob, /echo "(job: )\$final \$decision"/, 'run_job final line');
const [NOT_LAUNCHING_OPEN, NOT_LAUNCHING_CLOSE] = extract(
  fnBody(watcher, 'spawn_refuse', WATCHER),
  /log "(not launching ')\$1(': )\$2"/,
  'spawn_refuse line',
);

const remoteRun = source(REMOTE_RUN);
const verbRestore = fnBody(remoteRun, 'verb_restore', REMOTE_RUN);
const [RESTORED_OPEN, RESTORED_INTO] = extract(
  verbRestore,
  /echo "(remote-run\.sh: restored the bundle of run )\$id( into )\$root"/,
  'verb_restore restored line',
);
const [PLACED_OPEN, PLACED_FOR, PLACED_KEPT, PLACED_TAIL] = extract(
  verbRestore,
  /echo "(remote-run\.sh: placed )\$HR_REMOTE_PLANNING_PLACED( planning file\(s\) for )\$branch(; kept )\$HR_REMOTE_PLANNING_KEPT( the checkout already carries)"/,
  'verb_restore placed line',
);
const [WROTE_OPEN, WROTE_FOR] = extract(verbRestore, /echo "(remote-run\.sh: wrote answer_)\$n(\.md for )\$branch"/, 'verb_restore wrote line');
const [SAVED_OPEN, SAVED_INTO] = extract(
  fnBody(remoteRun, 'verb_save', REMOTE_RUN),
  /echo "(remote-run\.sh: saved the bundle of )\$branch( into )\$out_dir"/,
  'verb_save saved line',
);
const [SAVE_SKIP_PREFIX, SAVE_SKIP_SUFFIX] = extract(
  fnBody(remoteRun, 'save_link_free', REMOTE_RUN),
  /echo "(remote-run\.sh: save: skipped )\$root\/\$HR_REMOTE_STATE_DIR\/\$1: \$HR_REMOTE_LINKED( is a symbolic link)"/,
  'save_link_free skip line',
);

const [SKIP_PREFIX, SKIP_SUFFIX] = extract(
  fnBody(source(LIB), 'hr_remote_copy_tree', LIB),
  /printf '(remote state bundle: skipped )%s: %s( is a symbolic link)\\n'/,
  'hr_remote_copy_tree skip line',
);

const pushBranchText = source(PUSH_BRANCH);
const [PUSH_REFUSAL_OPEN] = extract(pushBranchText, /echo "(push-branch\.sh: refusing to push: )\$HR_WT_CONFIG_REFUSAL"/, 'push-branch.sh worktree-config refusal');
const [PUSH_DETACHED] = extract(pushBranchText, /echo "(push-branch\.sh: detached HEAD — refusing to push)"/, 'push-branch.sh detached HEAD refusal');
const [COMMIT_REFUSAL_OPEN] = extract(
  source(COMMIT_ON_BRANCH),
  /echo "(commit-on-branch\.sh: refusing to commit: )\$HR_WT_CONFIG_REFUSAL" >&2/,
  'commit-on-branch.sh worktree-config refusal',
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
  record: "Record the default branch's commit",
  install: 'Install the sandbox prerequisites',
  preflight: 'Preflight with doctor',
  restore: "Restore the previous job's state",
  harness: 'Run the harness',
  push: 'Push the branch',
  save: 'Save the state bundle',
};
const installBlock = workflow.slice(workflow.indexOf(`- name: ${STEP.install}`));
const [PRESENT_LINE] = extract(installBlock, /echo "(The sandbox prerequisites are present\.)"/, 'the install step present line');
const [APT_COULD_NOT] = extract(installBlock, /echo "::warning::(apt-get could not install) \$\{missing/, 'the install step apt-get warning line');

test('every step name this suite cans is a step of the run job', () => {
  for (const name of Object.values(STEP)) assert.ok(RUN_STEPS.includes(name), `${WORKFLOW}'s run job has no step ${name}`);
});

// ---------------------------------------------------------------------------------------------
// The canned full run: a parked job, the resumed job, and the job that completed the run.

const B = 'gate12_full_run_20261104000000';
const TS = '2026-11-04T10:00:00.0000000Z';
const WTS = '2026-11-04T10:00:00';
const WORKTREE = '/home/runner/work/gate12/gate12';
const PARKED = 701;
const RESUMED = 702;
const COMPLETED = 703;
const watcherLine = (text) => `${WTS} ${WATCHER_TAG} ${text}`;

const LAUNCH = watcherLine(`${LAUNCHING_OPEN}${B}' (engine=task) in ${WORKTREE} (log: /tmp/run.log)`);
const NOT_LAUNCHING = watcherLine(`${NOT_LAUNCHING_OPEN}${B}${NOT_LAUNCHING_CLOSE}the launch check refused the profile`);
const RESUME = watcherLine(`${RESUMING_OPEN}${B}${RESUMING_ANSWERS}1) in ${WORKTREE}`);
const SAVED = `${SAVED_OPEN}${B}${SAVED_INTO}/home/runner/work/_temp/harness-state`;
const RESTORED = `${RESTORED_OPEN}${PARKED}${RESTORED_INTO}${WORKTREE}`;
const PLACED = `${PLACED_OPEN}2${PLACED_FOR}${B}${PLACED_KEPT}0${PLACED_TAIL}`;
const WROTE = `${WROTE_OPEN}1${WROTE_FOR}${B}`;
const LINK = `${WORKTREE}/sdlc-harness/clarifications/${B}/link.md`;
const COPY_SKIP = `${SKIP_PREFIX}${LINK}: ${LINK}${SKIP_SUFFIX}`;
const SAVE_SKIP = `${SAVE_SKIP_PREFIX}${LINK}: ${WORKTREE}/outside.txt${SAVE_SKIP_SUFFIX}`;
const WT_CONFIG_REASON = `${WORKTREE}/.git/config.worktree sets core.sparsecheckout; remove the file, then re-run setup-worktree.sh in that working copy`;
const PUSH_REFUSAL = `${PUSH_REFUSAL_OPEN}${WT_CONFIG_REASON}`;
const COMMIT_REFUSAL = `${COMMIT_REFUSAL_OPEN}${WT_CONFIG_REASON}`;

/** A `harness-state` bundle holding two planning files, as `PLACED`'s `placed 2` implies. */
const PLANNED_BUNDLE = {
  'status.json': '{"status":"paused"}\n',
  [`planning/story_plans/${B}_story_plan.md`]: '# Story\n',
  [`planning/task_plans/${B}/task_1_plan.md`]: '### Task 1\n',
};

/**
 * @typedef {object} Job
 * @property {number} id
 * @property {string} createdAt
 * @property {{name: string, conclusion: string}[]} steps
 * @property {[string, string][] | { expired: true }} log
 */

/** One completed job: every run-job step `success` but `overrides`, a group line per step that ran, then `lines`. */
function job(id, minute, lines, { overrides = {}, expired = false } = {}) {
  const steps = [...RUN_STEPS.map((name) => ({ name, conclusion: overrides[name] ?? 'success' })), { name: 'Complete job', conclusion: 'success' }];
  const groups = steps.filter((s) => s.conclusion === 'success' || s.conclusion === 'failure').map((s) => [s.name, `##[group]Run ${s.name}`]);
  return { id, createdAt: `2026-11-04T10:${String(minute).padStart(2, '0')}:00Z`, steps, log: expired ? { expired: true } : [...groups, ...lines] };
}

/**
 * The three-job run at its expected shape, each option a departure from it.
 *
 * @param {{ resumed?: boolean, wrote?: boolean, preflight?: string, finalLine?: string | null,
 *   notLaunching?: boolean, saveExtra?: string[], parkedExpired?: boolean, install?: string[],
 *   placed?: boolean, pushExtra?: string[], harnessExtra?: string[] }} [options] `pushExtra` and
 *   `harnessExtra` are appended to the completed job's `Push the branch` and `Run the harness` logs.
 * @returns {Job[]}
 */
function fullRun({
  install = [PRESENT_LINE],
  resumed = true,
  wrote = true,
  placed = true,
  preflight = 'success',
  finalLine = `${JOB_FINAL}completed stop`,
  notLaunching = false,
  saveExtra = [],
  pushExtra = [],
  harnessExtra = [],
  parkedExpired = false,
} = {}) {
  const parked = job(
    PARKED,
    0,
    [
      ...install.map((text) => [STEP.install, text]),
      [STEP.harness, LAUNCH],
      ...(notLaunching ? [[STEP.harness, NOT_LAUNCHING]] : []),
      [STEP.harness, PARKED_STOP],
      [STEP.save, SAVED],
      ...saveExtra.map((text) => [STEP.save, text]),
    ],
    { overrides: { [STEP.preflight]: preflight }, expired: parkedExpired },
  );
  if (!resumed) return [parked];
  const resumedJob = job(RESUMED, 10, [
    [STEP.install, PRESENT_LINE],
    [STEP.restore, RESTORED],
    ...(placed ? [[STEP.restore, PLACED]] : []),
    ...(wrote ? [[STEP.restore, WROTE]] : []),
    [STEP.harness, RESUME],
    [STEP.harness, `${JOB_FINAL}paused continue`],
  ]);
  const completed = job(COMPLETED, 20, [
    [STEP.install, PRESENT_LINE],
    [STEP.harness, LAUNCH],
    ...(finalLine === null ? [] : [[STEP.harness, finalLine]]),
    ...harnessExtra.map((text) => [STEP.harness, text]),
    ...pushExtra.map((text) => [STEP.push, text]),
  ]);
  return [parked, resumedJob, completed];
}

/**
 * Round 13's two jobs: a park before any plan file, then one job that resumed and completed the run,
 * each with its push refused. Its bundle is `ROUND13_BUNDLE`.
 *
 * @returns {Job[]}
 */
function round13() {
  const parked = job(PARKED, 0, [
    [STEP.install, PRESENT_LINE],
    [STEP.harness, LAUNCH],
    [STEP.harness, PARKED_STOP],
    [STEP.push, PUSH_REFUSAL],
    [STEP.save, SAVED],
  ]);
  const resumed = job(RESUMED, 10, [
    [STEP.install, PRESENT_LINE],
    [STEP.restore, RESTORED],
    [STEP.restore, WROTE],
    [STEP.harness, RESUME],
    [STEP.harness, `${JOB_FINAL}completed stop`],
    [STEP.push, PUSH_REFUSAL],
  ]);
  return [parked, resumed];
}

const ROUND13_BUNDLE = {
  'status.json': '{"status":"paused"}\n',
  [`clarifications/${B}/question_1.md`]: '# Question 1\n',
};

/** Two denied records and one allowed, in `run-analytics.jq`'s `tools.items[]` shape. */
const DENIED = [
  { tool: 'Bash', context: 'main', started_at: '2026-11-04T10:01:02Z', duration_ms: 12, result_bytes: 88, is_error: true, permission_denied: true },
  { tool: 'Write', context: 'agent:layer-implementer', started_at: '2026-11-04T10:03:04Z', duration_ms: 3, result_bytes: 41, is_error: true, permission_denied: true },
];
const ALLOWED = { tool: 'Read', context: 'main', started_at: '2026-11-04T10:02:59Z', duration_ms: 5, result_bytes: 1024, is_error: false, permission_denied: false };
const ANALYTICS = `${JSON.stringify({ sessions: [{ tools: { items: [DENIED[0], ALLOWED] } }, { tools: { items: [DENIED[1]] } }] }, null, 2)}\n`;

// ---------------------------------------------------------------------------------------------
// The fixture.

async function fixtureFor(t) {
  const fixture = await makeGate12Fixture();
  t.after(() => cleanup(fixture));
  return fixture;
}

const scratch = (fixture) => join(fixture.dir, fixture.stateDir, 'scratch', 'gate12-sandbox-round');
const evidencePath = (fixture, row) => join(scratch(fixture), 'evidence', `${row}.log`);
const analyticsRel = (fixture) => `${fixture.stateDir}/run_analytics/${B}/run-analytics.json`;

/**
 * Push branch `B` to the fixture's origin from a second clone, so the checkout the driver runs in is
 * left on main; `files` maps a repo-relative path to its body.
 */
async function pushBranch(fixture, files) {
  const pusher = join(fixture.root, 'pusher');
  await runGit(fixture.root, ['clone', '--quiet', fixture.origin, pusher]);
  await runGit(pusher, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(pusher, ['config', 'user.name', 'Gate 12 Fixture']);
  await runGit(pusher, ['checkout', '--quiet', '-b', B]);
  for (const [rel, body] of Object.entries(files)) {
    await mkdir(join(pusher, rel, '..'), { recursive: true });
    await writeFile(join(pusher, rel), body, 'utf8');
  }
  await runGit(pusher, ['add', '-A']);
  await runGit(pusher, ['commit', '--quiet', '-m', 'the full run']);
  await runGit(pusher, ['push', '--quiet', 'origin', `HEAD:refs/heads/${B}`]);
}

/**
 * Route the stub to list `jobs` for `B` and answer each; push `B` carrying `analytics` unless it is
 * `null`, which pushes the branch without the file. `artifacts`, keyed by run id: a `{ <relative
 * path>: <body> }` object is written into that run's artifact cache; `'expired'` or `'none'` is the
 * `gh api …/artifacts` answer instead. The default stands in for every path that reads the bundle,
 * whether or not the case reaches the read.
 *
 * @param {Awaited<ReturnType<typeof makeGate12Fixture>>} fixture
 * @param {Job[]} jobs
 * @param {{ analytics?: string | null, artifacts?: Record<number, Record<string, string> | 'expired' | 'none'> }} [options]
 */
async function stage(fixture, jobs, { analytics = ANALYTICS, artifacts = { [PARKED]: PLANNED_BUNDLE } } = {}) {
  await pushBranch(fixture, analytics === null ? { 'notes.md': 'no analytics\n' } : { [analyticsRel(fixture)]: analytics });

  // Listed newest first, as `gh run list` answers: the grader orders by createdAt.
  const listed = [...jobs].reverse().map((j) => ({ databaseId: j.id, createdAt: j.createdAt, displayTitle: `harness run ${B}`, status: 'completed' }));
  const routes = {
    [`run list --repo ${GATE12_SLUG} --workflow harness-run.yml --branch ${B}`]: { stdout: `${JSON.stringify(listed)}\n` },
  };
  for (const j of jobs) {
    const base = `run view ${j.id} --repo ${GATE12_SLUG}`;
    routes[`${base} --json status,conclusion,jobs`] = {
      stdout: `${JSON.stringify({ status: 'completed', conclusion: 'success', jobs: [{ name: 'run', steps: j.steps }] })}\n`,
    };
    routes[`${base} --log`] = Array.isArray(j.log)
      ? { stdout: j.log.map(([step, text]) => `run\t${step}\t${TS} ${text}\n`).join('') }
      : { stderr: 'HTTP 410: Gone (https://api.github.com/repos/fixture/gate12/actions/runs/logs)\n', exit: 1 };
  }
  for (const [id, bundle] of Object.entries(artifacts)) {
    if (bundle === 'expired' || bundle === 'none') {
      const listed = bundle === 'expired' ? [{ name: 'harness-state', expired: true }] : [];
      routes[`api repos/${GATE12_SLUG}/actions/runs/${id}/artifacts`] = { stdout: `${JSON.stringify({ artifacts: listed })}\n` };
      continue;
    }
    const dir = join(scratch(fixture), 'runs', id, 'harness-state');
    for (const [rel, body] of Object.entries(bundle)) {
      await mkdir(join(dir, rel, '..'), { recursive: true });
      await writeFile(join(dir, rel), body, 'utf8');
    }
  }
  await ghStub(fixture.binDir, routes);
}

const show = (result) => `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;

const LINE = /^row="([^"]*)" result="([^"]*)" evidence="([^"]*)" departure="([^"]*)"$/;
const FR_ROWS = ['FR1', 'FR2', 'FR3', 'FR4', 'FR5', 'FR6', 'FR7'];

/**
 * Run `grade --full-run B` with the state file absent before and after, parse its result lines, and
 * hold it to printing FR rows only, in order, with FR1's `source` line second, and to its exit status:
 * 4 when any line printed `fail`, 0 otherwise.
 */
async function grade(fixture) {
  assert.equal(existsSync(fixture.stateFile), false, 'no state file before the grade');
  const result = await runRound(fixture, ['grade', '--repo', GATE12_SLUG, '--full-run', B]);
  assert.equal(existsSync(fixture.stateFile), false, `no state file after the grade\n${show(result)}`);
  const lines = result.stdout
    .split('\n')
    .filter((l) => l !== '')
    .map((l) => {
      const m = LINE.exec(l);
      assert.ok(m, `not a result line: ${l}\n${show(result)}`);
      return { row: m[1], result: m[2], evidence: m[3], departure: m[4] };
    });
  assert.deepEqual(lines.map((l) => l.row), ['FR1', ...FR_ROWS], show(result));
  assert.equal(lines[1].result, 'source', show(result));
  assert.match(lines[1].evidence, /spawn_engine/);
  assert.equal(result.status, lines.some((l) => l.result === 'fail') ? 4 : 0, show(result));
  /** The row's one graded line. */
  const one = (row) => lines.find((l) => l.row === row && l.result !== 'source');
  return { result, lines, one };
}

// ---------------------------------------------------------------------------------------------
// The expected shape.

test('a parked, resumed and completed run is FR1-FR7 pass, one FR1 source line, FR4 quoting the two denials whole', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun());
  const { lines, one } = await grade(fixture);
  for (const row of FR_ROWS) assert.equal(one(row).result, 'pass', `${row}: ${JSON.stringify(one(row))}`);
  assert.equal(lines.filter((l) => l.result === 'source').length, 1);
  assert.deepEqual(lines.filter((l) => l.result === 'source').map((l) => l.row), ['FR1']);

  const fr4 = one('FR4');
  assert.ok(fr4.evidence.includes(evidencePath(fixture, 'FR4')), fr4.evidence);
  const record = await readFile(evidencePath(fixture, 'FR4'), 'utf8');
  for (const d of DENIED) assert.ok(record.includes(`\n${JSON.stringify(d)}\n`), `${JSON.stringify(d)} in\n${record}`);
  assert.equal(record.includes(ALLOWED.started_at), false, record);

  const fr7 = one('FR7');
  const resume = RESUME.slice(RESUME.indexOf(RESUMING_OPEN));
  assert.ok(fr7.evidence.includes(`run ${RESUMED}: ${resume}`), fr7.evidence);
  assert.ok(fr7.evidence.includes(WROTE.slice(WROTE.indexOf('wrote'))), fr7.evidence);
  assert.match(fr7.evidence, /; second clause not graded: [^;]*;[^;]*$/);
});

// ---------------------------------------------------------------------------------------------
// The resumed-job and per-row variants.

test('FR7: a restore log with no wrote answer line is still pass on the resume line alone', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ wrote: false }));
  const { one } = await grade(fixture);
  const fr7 = one('FR7');
  assert.equal(fr7.result, 'pass', JSON.stringify(fr7));
  assert.equal(fr7.evidence.includes(WROTE_OPEN.slice(WROTE_OPEN.indexOf('wrote'))), false, fr7.evidence);
});

test('without the resumed run, FR6 and FR7 are not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ resumed: false }));
  const { one } = await grade(fixture);
  assert.equal(one('FR6').result, 'not run', JSON.stringify(one('FR6')));
  assert.equal(one('FR7').result, 'not run', JSON.stringify(one('FR7')));
});

test('FR2: Preflight with doctor concluding failure is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ preflight: 'failure' }));
  const { one } = await grade(fixture);
  const fr2 = one('FR2');
  assert.equal(fr2.result, 'fail', JSON.stringify(fr2));
  assert.ok(fr2.evidence.includes(STEP.preflight), fr2.evidence);
});

// The runner renders an `echo "::warning::…"` as `##[warning]…` in the step log.
test('FR2: an install step that logged a ##[warning] line is pass, that line recorded', async (t) => {
  const fixture = await fixtureFor(t);
  const warning = `##[warning]${APT_COULD_NOT} bubblewrap.`;
  await stage(fixture, fullRun({ install: [warning] }));
  const { one } = await grade(fixture);
  const fr2 = one('FR2');
  assert.equal(fr2.result, 'pass', JSON.stringify(fr2));
  assert.ok(fr2.evidence.includes(`1 ${STEP.install} line(s)`), fr2.evidence);
  const record = await readFile(evidencePath(fixture, 'FR2'), 'utf8');
  assert.ok(record.includes(warning), record);
});

test('FR3: a final job whose Run the harness succeeded but logged job: failed stop is fail quoting that line', async (t) => {
  const fixture = await fixtureFor(t);
  const failed = `${JOB_FINAL}failed stop`;
  await stage(fixture, fullRun({ finalLine: failed }));
  const { one } = await grade(fixture);
  const fr3 = one('FR3');
  assert.equal(fr3.result, 'fail', JSON.stringify(fr3));
  assert.ok(fr3.evidence.includes(`run ${COMPLETED}: ${failed}`), fr3.evidence);
});

test('FR3: a final job with no job: <final> <decision> line is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ finalLine: null }));
  const { one } = await grade(fixture);
  const fr3 = one('FR3');
  assert.equal(fr3.result, 'fail', JSON.stringify(fr3));
  assert.ok(fr3.evidence.includes(`run ${COMPLETED}`), fr3.evidence);
});

test('FR3: a commit-on-branch.sh refusal in the final job\'s Run the harness log is fail quoting that line', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ harnessExtra: [COMMIT_REFUSAL] }));
  const { one } = await grade(fixture);
  const fr3 = one('FR3');
  assert.equal(fr3.result, 'fail', JSON.stringify(fr3));
  assert.ok(fr3.evidence.includes(`run ${COMPLETED}: ${COMMIT_REFUSAL}`), fr3.evidence);
});

test('FR3: the em-dash push-branch.sh refusal in a Push the branch that concluded success is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ pushExtra: [PUSH_DETACHED] }));
  const { one } = await grade(fixture);
  const fr3 = one('FR3');
  assert.equal(fr3.result, 'fail', JSON.stringify(fr3));
  assert.ok(fr3.evidence.includes(`run ${COMPLETED}: ${PUSH_DETACHED}`), fr3.evidence);
});

test('FR1: a not launching line after the launch line is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ notLaunching: true }));
  const { one } = await grade(fixture);
  const fr1 = one('FR1');
  assert.equal(fr1.result, 'fail', JSON.stringify(fr1));
  assert.ok(fr1.evidence.includes(`${NOT_LAUNCHING_OPEN}${B}${NOT_LAUNCHING_CLOSE}`), fr1.evidence);
});

for (const [form, line] of [
  ['remote state bundle: skipped', COPY_SKIP],
  ['remote-run.sh: save: skipped', SAVE_SKIP],
]) {
  test(`FR6: a ${form} line beside the saved line is fail`, async (t) => {
    const fixture = await fixtureFor(t);
    await stage(fixture, fullRun({ saveExtra: [line] }));
    const { one } = await grade(fixture);
    const fr6 = one('FR6');
    assert.equal(fr6.result, 'fail', JSON.stringify(fr6));
    assert.ok(fr6.evidence.includes(line), fr6.evidence);
  });
}

test('FR6: no placed line over a bundle holding two planning files is fail naming the count', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ placed: false }));
  const { one } = await grade(fixture);
  const fr6 = one('FR6');
  assert.equal(fr6.result, 'fail', JSON.stringify(fr6));
  assert.ok(fr6.evidence.includes('carries no placed <n> planning file(s) line'), fr6.evidence);
  assert.ok(fr6.evidence.includes(`run ${PARKED}'s bundle holds 2 planning file(s)`), fr6.evidence);
});

for (const [artifact, result] of [
  ['expired', 'expired'],
  ['none', 'not run'],
]) {
  test(`FR6: no placed line with the parked job's artifact ${artifact} is ${result}`, async (t) => {
    const fixture = await fixtureFor(t);
    await stage(fixture, fullRun({ placed: false }), { artifacts: { [PARKED]: artifact } });
    const { one } = await grade(fixture);
    const fr6 = one('FR6');
    assert.equal(fr6.result, result, JSON.stringify(fr6));
    assert.ok(fr6.evidence.includes(`run ${PARKED}`), fr6.evidence);
  });
}

// ---------------------------------------------------------------------------------------------
// Round 13's replay.

test('round 13: both pushes refused is FR3 fail; a park before any plan file is FR6 pass', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, round13(), { artifacts: { [PARKED]: ROUND13_BUNDLE } });
  const { result, one } = await grade(fixture);
  assert.equal(result.status, 4, show(result));

  const fr3 = one('FR3');
  assert.equal(fr3.result, 'fail', JSON.stringify(fr3));
  assert.ok(fr3.evidence.includes(`run ${PARKED}: ${PUSH_REFUSAL}`), fr3.evidence);
  assert.ok(fr3.evidence.includes(evidencePath(fixture, 'FR3')), fr3.evidence);
  const record = await readFile(evidencePath(fixture, 'FR3'), 'utf8');
  for (const id of [PARKED, RESUMED]) assert.ok(record.includes(`run ${id}: ${PUSH_REFUSAL}`), `run ${id} in\n${record}`);

  const fr6 = one('FR6');
  assert.equal(fr6.result, 'pass', JSON.stringify(fr6));
  assert.ok(fr6.evidence.endsWith('placed: none to place, the park preceded any plan file'), fr6.evidence);
});

// ---------------------------------------------------------------------------------------------
// Expired, absent and unparseable.

test('a parked run log answered HTTP 410 is FR1, FR2, FR5 and FR6 expired', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ parkedExpired: true }));
  const { one } = await grade(fixture);
  for (const row of ['FR1', 'FR2', 'FR5', 'FR6']) assert.equal(one(row).result, 'expired', `${row}: ${JSON.stringify(one(row))}`);
});

test('FR4: no run-analytics.json on the branch is not run', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun(), { analytics: null });
  const { one } = await grade(fixture);
  const fr4 = one('FR4');
  assert.equal(fr4.result, 'not run', JSON.stringify(fr4));
  assert.ok(fr4.evidence.includes(`${analyticsRel(fixture)} is absent`), fr4.evidence);
});

test('FR4: an unparseable run-analytics.json is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun(), { analytics: '{"sessions": [\n' });
  const { one } = await grade(fixture);
  const fr4 = one('FR4');
  assert.equal(fr4.result, 'fail', JSON.stringify(fr4));
  assert.match(fr4.evidence, /does not parse/);
});
