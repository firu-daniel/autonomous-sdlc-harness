/**
 * The sandbox probe's job-mode legs: CS6's grade (`scripts/lib/sandbox-probe/legs-job.sh` →
 * `sp__cs6_grade`), the carried-over legs' job arms (`core.sh` → `sp_job_skip_clone_rows`,
 * `legs-protection.sh` → `sp__wp_w8`, `job.sh` → `sp_job_git_note`) and L1 in job mode
 * (`legs-planted-files.sh` → `sp__pf_l1_grade`, `sp__pf_l1_restore`), run over the recorded streams in
 * `fixtures/sandbox-probe/job-*.jsonl` and over repositories each case builds.
 *
 * **The rule these tests exist to enforce: each job-mode grade reads disk, refs and streams, never an
 * exit status; each job arm prints its clone-only rows `not run` and nothing else for them; and each
 * job-mode evidence line says it was read before the placeholder sweep.** CS6's `pass` needs `git add`
 * refused at the sandbox layer; a `git add` error carrying no refusal string the judge knows is `not
 * run`, never `pass`, whatever the index and the ref say.
 *
 * The reachability case is the reading Task 13 rests on, measured on a fixture rather than inferred:
 * on an adopted checkout whose `HEAD` names `refs/heads/-sbxdash`, the checkout's own `push-branch.sh`
 * aimed at the checkout answers with its dash refusal, and nothing reaches the origin.
 *
 * Every grading case sources the probe libraries in the entry point's order (`scripts/sandbox-probe.sh`)
 * and sets the globals a library assigns at source time — SP_JOB_MODE, SP_PLATFORM, the L1 restore's
 * globals — afterwards. Stream fixtures are passed unsubstituted: every call is matched byte-equal on
 * its `@FIXTURE_ROOT@` spelling.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, PACKAGE_ROOT, runBash, runGit, seedRepository, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
/** `scripts/sandbox-probe.sh`'s source order. */
const LIB_ORDER = [
  'core.sh', 'platform.sh', 'preflight.sh', 'judge.sh', 'session.sh', 'job.sh', 'controls.sh', 'legs-local.sh',
  'legs-wrappers.sh', 'legs-refresh.sh', 'legs-planted.sh', 'legs-planted-files.sh', 'legs-protection.sh',
  'legs-network.sh', 'legs-settings.sh', 'legs-glob.sh', 'legs-registry.sh', 'legs-detached.sh', 'legs-loopback.sh',
  'legs-job.sh', 'legs-runner.sh', 'legs-runner-isolation.sh', 'legs-refusal.sh',
];
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];

const BRANCH = 'chore_sbx_probe_1';
const C_STATUS = 'git status';
const C_ADD = 'git add sbx_cs6.txt';
const C_WRAP = 'bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@ sbx_cs6.txt -- "sbx probe CS6"';
const REF_BEFORE = 'a'.repeat(40);
const REF_AFTER = 'b'.repeat(40);
const STATUS_LINE = `On branch ${BRANCH}`;
const PERMISSION_LINE = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";

const L1_CMD = 'bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@';
const DASH_LINE = "push-branch.sh: branch '-sbxdash' starts with '-', which git would read as an option — refusing to push";
const DASH = 'refs/heads/-sbxdash';
/** {@link DASH} in a `for-each-ref` listing; a push leaves `refs/remotes/origin/-sbxdash`, which is not it. */
const DASH_LISTED = /^refs\/heads\/-sbxdash /m;

const RUN_PROFILE_RULE = 'Edit(@FIXTURE_ROOT@/scripts/**)';
const W8_CLEAN = join(FIXTURES, 'w8-clean.debug.log');
const W8_UNMATCHED = join(FIXTURES, 'w8-unmatched.debug.log');
const W8_COUNTS = (name) =>
  `${name} log: 3 line(s), 0 unmatched-rule or mixed-prefix line(s) for a rule the profile does not carry`;
const W8_JOB_NOTE = "; W7's half is not a job row: the gates leg does not run in job mode";
const CLONE_ONLY = 'clone layout only: job mode cuts no clone and measures the checkout itself';
const SWEEP_NOTE = '; read before the placeholder sweep';

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/**
 * `body` run after sourcing every probe library in the entry point's order, its own arguments in `"$@"`.
 * Each `globals` entry is assigned after sourcing, since a library assigns it at source time.
 */
function sourced(cwd, body, args = [], globals = {}) {
  const names = Object.keys(globals);
  const assign = names.map((name) => `${name}="$T_${name}"; `).join('');
  const env = { SP_VERSION: '' };
  for (const name of names) env[`T_${name}`] = globals[name];
  return runBash(
    cwd,
    [
      '-c',
      `lib="$1"; shift; for f in ${LIB_ORDER.join(' ')}; do . "$lib/$f" || exit 99; done; ${assign}${body}`,
      '_',
      PROBE_LIB,
      ...args,
    ],
    env,
  );
}

async function caseDir(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'harness-sp-job-legs-')));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return dir;
}

/**
 * `sp__cs6_grade`'s verdict and evidence. `unchanged` and `staged` are session 1's readings, taken
 * before the wrapper runs; `before`, `after` and `changes` bracket session 2.
 */
async function cs6(t, stream, { platform = '', unchanged = '1', staged = '', before = REF_BEFORE, after = REF_AFTER,
  changes = 'sbx_cs6.txt', wrap = C_WRAP } = {}) {
  const dir = await caseDir(t);
  const run = await sourced(
    dir,
    'sp__cs6_grade "$@"; printf \'%s|%s\' "$SP_VERDICT" "$SP_EVIDENCE"',
    [fixture(stream), C_STATUS, C_ADD, wrap, unchanged, staged, before, after, changes],
    { SP_PLATFORM: platform, SP_BRANCH: BRANCH },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  const bar = run.stdout.indexOf('|');
  return { verdict: run.stdout.slice(0, bar), evidence: run.stdout.slice(bar + 1) };
}

/** `git add`'s evidence: a sandbox refusal quotes the matching line, a `ran` error its PD18 form. */
function addLine(message, { refused = true } = {}) {
  const line = `fatal: Unable to create '@FIXTURE_ROOT@/.git/index.lock': ${message}`;
  return refused ? line : `Exit code 128: ${line}`;
}

function cs6Pass(message) {
  return `git status: ${STATUS_LINE}; git add refused at layer sandbox, index unchanged, nothing staged: ${addLine(message)}; rev-parse refs/heads/${BRANCH} ${REF_BEFORE}..${REF_AFTER}; change set: sbx_cs6.txt`;
}

test('CS6', async (t) => {
  // The index argument is session 1's reading, taken before the wrapper launches, so a wrapper that
  // synced <checkout>/.git/index afterwards does not enter it.
  await t.test('pass: git add refused under .git, index unchanged across session 1, the wrapper landed', async (t) => {
    for (const platform of ['', 'linux']) {
      assert.deepEqual(await cs6(t, 'job-cs6-pass', { platform }), {
        verdict: 'pass',
        evidence: cs6Pass('Operation not permitted'),
      });
    }
    assert.deepEqual(await cs6(t, 'job-cs6-pass-erofs', { platform: 'linux' }), {
      verdict: 'pass',
      evidence: cs6Pass('Read-only file system'),
    });
  });

  await t.test('fail: the index changed across session 1', async (t) => {
    assert.deepEqual(await cs6(t, 'job-cs6-pass', { unchanged: '0' }), {
      verdict: 'fail',
      evidence: `git add reached the checkout's index (index shasum unchanged: 0; staged: (empty)): ${addLine('Operation not permitted')}`,
    });
  });

  await t.test('fail: the file is staged after session 1', async (t) => {
    assert.deepEqual(await cs6(t, 'job-cs6-pass', { staged: 'sbx_cs6.txt' }), {
      verdict: 'fail',
      evidence: `git add reached the checkout's index (index shasum unchanged: 1; staged: sbx_cs6.txt): ${addLine('Operation not permitted')}`,
    });
  });

  await t.test('fail: the ref did not move across session 2', async (t) => {
    assert.deepEqual(await cs6(t, 'job-cs6-pass', { after: REF_BEFORE, changes: '' }), {
      verdict: 'fail',
      evidence: `the wrapper did not land: rev-parse refs/heads/${BRANCH} ${REF_BEFORE}..${REF_BEFORE}: [${BRANCH} bbbbbbb] sbx probe CS6`,
    });
  });

  await t.test('fail: the change set carries a second file', async (t) => {
    assert.deepEqual(await cs6(t, 'job-cs6-pass', { changes: 'sbx_cs6.txt\nother.txt' }), {
      verdict: 'fail',
      evidence: `the wrapper's commit changes sbx_cs6.txt, other.txt, not exactly sbx_cs6.txt: rev-parse refs/heads/${BRANCH} ${REF_BEFORE}..${REF_AFTER}`,
    });
  });

  await t.test('fail: git status errored', async (t) => {
    assert.deepEqual(await cs6(t, 'job-cs6-status-error'), {
      verdict: 'fail',
      evidence: 'git status errored: Exit code 128: fatal: unknown index entry format 0x00000000',
    });
  });

  await t.test('not run: a permission-layer refusal of each call', async (t) => {
    for (const [stream, cmd] of [
      ['job-cs6-status-permission', C_STATUS],
      ['job-cs6-add-permission', C_ADD],
      ['job-cs6-wrapper-permission', C_WRAP],
    ]) {
      assert.deepEqual(await cs6(t, stream), {
        verdict: 'not run',
        evidence: `${cmd}: refused at the permission layer, so it never reached the sandbox: ${PERMISSION_LINE}`,
      });
    }
  });

  await t.test('not run: an absent call', async (t) => {
    const wrap = 'bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@ sbx_cs6.txt';
    assert.deepEqual(await cs6(t, 'job-cs6-pass', { wrap }), {
      verdict: 'not run',
      evidence: `${wrap}: no Bash call "${wrap}" in the session`,
    });
  });

  await t.test('not run: git add reported success and nothing reached the index', async (t) => {
    const { verdict, evidence } = await cs6(t, 'job-cs6-add-ok');
    assert.equal(verdict, 'not run');
    assert.equal(evidence, 'the call reported success and nothing reached the index: (empty tool_result)');
    assert.doesNotMatch(evidence, /refused/);
  });

  await t.test('not run on Linux: git add erroring with no refusal string the judge knows, every other reading passing', async (t) => {
    // Input/output error matches no arm of the judge's layer table, as Task 19 uses it.
    for (const platform of ['linux', '']) {
      const { verdict, evidence } = await cs6(t, 'job-cs6-add-io-error', { platform });
      assert.equal(verdict, 'not run', `SP_PLATFORM='${platform}'`);
      assert.equal(evidence, `git add errored with no refusal string the judge knows: ${addLine('Input/output error', { refused: false })}`);
    }
  });
});

/** A case directory holding a run profile whose `permissions.deny` carries {@link RUN_PROFILE_RULE}. */
async function profileCase(t) {
  const dir = await caseDir(t);
  const profile = join(dir, 'sbx.json');
  await writeFile(profile, `${JSON.stringify({ permissions: { deny: [RUN_PROFILE_RULE] } })}\n`);
  return { dir, profile };
}

function resultLine(leg, row, result, evidence, departure = 'none') {
  return `leg="${leg}" row="${row}" result="${result}" evidence="${evidence}" departure="${departure}" claude="unknown"\n`;
}

test('the carried-over legs in job mode', async (t) => {
  const skipped = {
    wrappers: ['CS4', 'P3', 'CW2'],
    'write-protection': ['CS1', 'CS2', 'CS7'],
    'planted-files': ['CS12', 'CS13', 'CS14', 'L2'],
  };

  await t.test('sp_job_skip_clone_rows prints exactly the clone-only rows, as not run, in job mode', async (t) => {
    const dir = await caseDir(t);
    for (const [leg, rows] of Object.entries(skipped)) {
      const run = await sourced(dir, 'sp_job_skip_clone_rows "$1"', [leg], { SP_JOB_MODE: '1' });
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stderr, '');
      assert.equal(run.stdout, rows.map((row) => resultLine(leg, row, 'not run', CLONE_ONLY)).join(''));
    }
  });

  await t.test('sp_job_skip_clone_rows prints nothing outside job mode', async (t) => {
    const dir = await caseDir(t);
    for (const leg of Object.keys(skipped)) {
      const run = await sourced(dir, 'sp_job_skip_clone_rows "$1"', [leg], { SP_JOB_MODE: '0' });
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, '');
      assert.equal(run.stderr, '');
    }
  });

  /** `sp__wp_w8 <departure> <write-protection log> <W7 log>`'s line. */
  async function w8(t, jobMode, wpLog, w7Log) {
    const { dir, profile } = await profileCase(t);
    const run = await sourced(dir, 'sp__wp_w8 "$@"', ['dep', wpLog, w7Log], {
      SP_JOB_MODE: jobMode,
      SP_RUN_PROFILE: profile,
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stderr, '');
    return run.stdout;
  }

  await t.test('sp__wp_w8 in job mode grades the write-protection log alone', async (t) => {
    const empty = join(await caseDir(t), 'empty.debug.log');
    await writeFile(empty, '');
    assert.equal(
      await w8(t, '1', W8_CLEAN, ''),
      resultLine(
        'write-protection',
        'W8',
        'pass',
        `no unmatched-rule or mixed-prefix line for any base-profile rule in the write-protection log; ${W8_COUNTS('write-protection')}${W8_JOB_NOTE}`,
        'dep',
      ),
    );
    assert.equal(
      await w8(t, '1', W8_UNMATCHED, ''),
      resultLine(
        'write-protection',
        'W8',
        'fail',
        `write-protection log: Permission rule ${RUN_PROFILE_RULE} is not matched by file permission checks${W8_JOB_NOTE}`,
        'dep',
      ),
    );
    assert.equal(
      await w8(t, '1', empty, W8_CLEAN),
      resultLine(
        'write-protection',
        'W8',
        'not run',
        `the write-protection session's --debug-file log ${empty} is missing or empty${W8_JOB_NOTE}`,
        'dep',
      ),
    );
  });

  await t.test('sp__wp_w8 outside job mode reads both halves', async (t) => {
    assert.equal(
      await w8(t, '0', W8_CLEAN, W8_CLEAN),
      resultLine(
        'write-protection',
        'W8',
        'pass',
        `no unmatched-rule or mixed-prefix line for any per-run profile rule in either log; ${W8_COUNTS('write-protection')}; ${W8_COUNTS('W7')}`,
        'dep',
      ),
    );
    assert.equal(
      await w8(t, '0', W8_CLEAN, W8_UNMATCHED),
      resultLine(
        'write-protection',
        'W8',
        'fail',
        `W7 log: Permission rule ${RUN_PROFILE_RULE} is not matched by file permission checks`,
        'dep',
      ),
    );
    assert.equal(
      await w8(t, '0', W8_CLEAN, ''),
      resultLine(
        'write-protection',
        'W8',
        'not run',
        `W7's --debug-file log is missing or empty (the gates leg did not run its W7 session in this run); ${W8_COUNTS('write-protection')}`,
        'dep',
      ),
    );
  });

  await t.test('sp_job_git_note prints its suffix only in job mode', async (t) => {
    const dir = await caseDir(t);
    const on = await sourced(dir, 'sp_job_git_note', [], { SP_JOB_MODE: '1' });
    assert.equal(on.stdout, SWEEP_NOTE);
    const off = await sourced(dir, 'sp_job_git_note', [], { SP_JOB_MODE: '0' });
    assert.equal(off.stdout, '');
  });
});

/** A seeded repository with one commit and a bare origin, its `HEAD` pointed at {@link DASH}. */
async function dashRepo(t) {
  const root = await caseDir(t);
  const dir = join(root, 'repo');
  await mkdir(dir);
  const origin = await seedRepository(dir);
  await writeFile(join(dir, 'f.txt'), 'f\n');
  await runGit(dir, ['add', 'f.txt']);
  await runGit(dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'seed']);
  const head = (await runGit(dir, ['symbolic-ref', 'HEAD'])).stdout.trim();
  const commit = (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim();
  await runGit(dir, ['update-ref', DASH, commit]);
  await runGit(dir, ['symbolic-ref', 'HEAD', DASH]);
  return { dir, origin, head, commit };
}

/** `sp__pf_l1_restore <head>` against `dir` with the leg's globals. */
function restore(dir, head, { commit, remoteAbsent }) {
  return sourced(dir, 'sp__pf_l1_restore "$1"', [head], {
    SP_MAIN: dir,
    SP_PF_L1_COMMIT: commit,
    SP_PF_L1_REMOTE_ABSENT: remoteAbsent,
  });
}

async function refs(dir) {
  return (await runGit(dir, ['for-each-ref', '--format=%(refname) %(objectname)'])).stdout;
}

test('L1 in job mode', async (t) => {
  /** `sp__pf_l1_grade`'s verdict and evidence. */
  async function grade(t, stream, before = '', after = '') {
    const dir = await caseDir(t);
    const run = await sourced(dir, 'sp__pf_l1_grade "$@"; printf \'%s|%s\' "$SP_VERDICT" "$SP_EVIDENCE"', [
      fixture(stream),
      L1_CMD,
      before,
      after,
    ]);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stderr, '');
    const bar = run.stdout.indexOf('|');
    return { verdict: run.stdout.slice(0, bar), evidence: run.stdout.slice(bar + 1) };
  }

  await t.test('sp__pf_l1_grade: the dash refusal with no remote ref before or after passes', async (t) => {
    assert.deepEqual(await grade(t, 'job-l1-refused'), {
      verdict: 'pass',
      evidence: `${DASH_LINE}; ls-remote: no refs/heads/-sbxdash on origin before or after`,
    });
  });

  await t.test('sp__pf_l1_grade: the remote ref appearing fails', async (t) => {
    assert.deepEqual(await grade(t, 'job-l1-pushed', '', REF_AFTER), {
      verdict: 'fail',
      evidence: `the push landed: ls-remote refs/heads/-sbxdash none..${REF_AFTER}; To @FIXTURE_ROOT@.origin`,
    });
    // The ref, not the message, decides: a dash refusal beside a landed ref is still a fail.
    assert.equal((await grade(t, 'job-l1-refused', '', REF_AFTER)).verdict, 'fail');
  });

  await t.test('sp__pf_l1_grade: any other message is unreachable in job mode', async (t) => {
    assert.deepEqual(await grade(t, 'job-l1-other'), {
      verdict: 'not run',
      evidence: "unreachable in job mode: push-branch.sh: core.hooksPath in '@FIXTURE_ROOT@' is not the pinned hooks directory — refusing to push",
    });
  });

  await t.test('sp__pf_l1_grade: a permission-layer refusal and a remote ref already there are not run', async (t) => {
    assert.deepEqual(await grade(t, 'job-l1-permission'), {
      verdict: 'not run',
      evidence: `refused at the permission layer, so it never reached push-branch.sh: ${PERMISSION_LINE}`,
    });
    assert.deepEqual(await grade(t, 'job-l1-refused', REF_BEFORE, REF_BEFORE), {
      verdict: 'not run',
      evidence: `origin carried refs/heads/-sbxdash at ${REF_BEFORE} before the session`,
    });
  });

  await t.test('sp__pf_l1_restore: local only, then a second call changes nothing', async (t) => {
    const { dir, origin, head, commit } = await dashRepo(t);
    const originBefore = await refs(origin);
    const first = await restore(dir, head, { commit, remoteAbsent: '1' });
    assert.equal(first.status, 0, first.stderr);
    assert.equal(first.stderr, '');
    assert.equal((await runGit(dir, ['symbolic-ref', 'HEAD'])).stdout.trim(), head);
    const local = await refs(dir);
    assert.doesNotMatch(local, DASH_LISTED);
    const second = await restore(dir, head, { commit, remoteAbsent: '1' });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(second.stderr, '');
    assert.equal(await refs(dir), local);
    assert.equal((await runGit(dir, ['symbolic-ref', 'HEAD'])).stdout.trim(), head);
    assert.equal(await refs(origin), originBefore);
  });

  await t.test('sp__pf_l1_restore: removes the remote ref the probe caused', async (t) => {
    const { dir, origin, head, commit } = await dashRepo(t);
    await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `${DASH}:${DASH}`]);
    assert.match(await refs(origin), new RegExp(`${DASH} ${commit}`));
    const run = await restore(dir, head, { commit, remoteAbsent: '1' });
    assert.equal(run.status, 0, run.stderr);
    assert.doesNotMatch(await refs(dir), DASH_LISTED);
    assert.doesNotMatch(await refs(origin), DASH_LISTED);
  });

  await t.test('sp__pf_l1_restore: leaves a remote ref the probe did not create', async (t) => {
    await t.test('origin carried it before the probe', async (t) => {
      const { dir, origin, head, commit } = await dashRepo(t);
      await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `${DASH}:${DASH}`]);
      const run = await restore(dir, head, { commit, remoteAbsent: '0' });
      assert.equal(run.status, 0, run.stderr);
      assert.doesNotMatch(await refs(dir), DASH_LISTED);
      assert.match(await refs(origin), new RegExp(`${DASH} ${commit}`));
    });

    await t.test('origin’s tip moved to another commit', async (t) => {
      const { dir, origin, head, commit } = await dashRepo(t);
      const tree = (await runGit(dir, ['rev-parse', 'HEAD^{tree}'])).stdout.trim();
      const other = (await runGit(dir, [...IDENTITY, 'commit-tree', tree, '-p', commit, '-m', 'other'])).stdout.trim();
      await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `${other}:${DASH}`]);
      const run = await restore(dir, head, { commit, remoteAbsent: '1' });
      assert.equal(run.status, 0, run.stderr);
      assert.match(run.stderr, /left untouched/);
      assert.doesNotMatch(await refs(dir), DASH_LISTED);
      assert.match(await refs(origin), new RegExp(`${DASH} ${other}`));
    });
  });

  await t.test('sp__pf_l1_restore: the remote deletion failing returns 1 naming the hand command', async (t) => {
    const { dir, head, commit } = await dashRepo(t);
    await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `${DASH}:${DASH}`]);
    await runGit(dir, ['remote', 'remove', 'origin']);
    const run = await restore(dir, head, { commit, remoteAbsent: '1' });
    assert.equal(run.status, 1);
    assert.ok(
      run.stderr.includes(`git -C ${dir} push origin :refs/heads/-sbxdash`),
      `stderr names the hand command: ${run.stderr}`,
    );
  });

  await t.test('reachability: push-branch.sh aimed at the checkout itself answers with its dash refusal', async (t) => {
    const w = await createWatcherFixture(t);
    if (w === null) return;
    await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n/home/\n', { flag: 'a' });
    await runGit(w.dir, ['add', '-A']);
    await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
    const origin = (await runGit(w.dir, ['remote', 'get-url', 'origin'])).stdout.trim();

    await runGit(w.dir, ['update-ref', DASH, 'HEAD']);
    await runGit(w.dir, ['symbolic-ref', 'HEAD', DASH]);
    const run = await runBash(w.dir, [join(w.dir, INIT_SCRIPTS_DIR, 'push-branch.sh'), w.dir], w.watcherEnv());
    const output = `${run.stdout}${run.stderr}`;
    assert.ok(output.split('\n').includes(DASH_LINE), `push-branch.sh answered with the dash refusal:\n${output}`);
    assert.doesNotMatch(await refs(origin), DASH_LISTED);
  });
});
