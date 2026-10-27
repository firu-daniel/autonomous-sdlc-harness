/**
 * The sandbox probe's write-protection and git-leg helpers (`sp__wp_w8`, `sp__wp_cs7_edit`,
 * `sp__git_cs3_fetch`, `sp__wp_tracked` in `scripts/lib/sandbox-probe/legs-protection.sh`), run over the
 * recorded streams and debug logs in `fixtures/sandbox-probe/` and over a repository each case seeds.
 *
 * **The rule these tests exist to enforce: W8 needs both sessions' debug logs, CS7 includes its `Edit`,
 * CS3's fetch refusal is the clone layout's design, and no probe helper writes `Broken pipe`.**
 *
 * Fixtures are passed unsubstituted: no function here requires an absolute path, and W8's rule and its
 * unmatched-rule line both spell `@FIXTURE_ROOT@`, so the substring match holds as recorded.
 *
 * The `sp__wp_tracked` repository commits 10,000 files so that `git ls-files` prints more than a 64 KiB
 * pipe buffer, and runs it with SIGPIPE ignored, as a caller may launch the probe: a pipe whose reader
 * exits at the first match then fails its writer with `printf: write error: Broken pipe`, the defect's
 * observable, which the empty-stderr assertions catch. With SIGPIPE at its default the writer dies
 * silently and the defect is invisible.
 */

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit, seedRepository, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'controls.sh', 'legs-protection.sh'].map((f) => join(PROBE_LIB, f));
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');
const RUN_PROFILE = '@FIXTURE_ROOT@/run-profiles/sbx.json';
const W8_RULE = 'Edit(@FIXTURE_ROOT@/scripts/**)';
const W8_CLEAN = join(FIXTURES, 'w8-clean.debug.log');
const W8_UNMATCHED = join(FIXTURES, 'w8-unmatched.debug.log');
const W8_COUNTS = (name) =>
  `${name} log: 3 line(s), 0 unmatched-rule or mixed-prefix line(s) for a rule the profile does not carry`;
const TRACKED_COUNT = 10_000;
/** A writer whose SIGPIPE is ignored reports `Broken pipe` on stderr instead of dying silently. */
const IGNORE_SIGPIPE = "trap '' PIPE; ";

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing the four libraries, its own arguments in `"$@"`, in `cwd`. */
function sourced(cwd, body, args = [], env = {}) {
  return runBash(cwd, ['-c', `. "$1"; . "$2"; . "$3"; . "$4"; shift 4; ${body}`, '_', ...LIBS, ...args], {
    SP_VERSION: '',
    ...env,
  });
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-protection-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** A case directory holding a run profile whose `permissions.deny` carries {@link W8_RULE}. */
async function w8Case(t) {
  const dir = await caseDir(t);
  const profile = join(dir, 'sbx.json');
  await writeFile(profile, `${JSON.stringify({ permissions: { deny: [W8_RULE] } })}\n`);
  return { dir, profile };
}

async function w8Line(t, w7Log) {
  const { dir, profile } = await w8Case(t);
  const departure = `--debug-file ${W8_CLEAN}`;
  const run = await sourced(dir, 'sp__wp_w8 "$@"', [departure, W8_CLEAN, w7Log], { SP_RUN_PROFILE: profile });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  return { stdout: run.stdout, departure };
}

function w8Expected(result, evidence, departure) {
  return `leg="write-protection" row="W8" result="${result}" evidence="${evidence}" departure="${departure}" claude="unknown"\n`;
}

test('sp__wp_w8: both sessions’ debug logs are graded', async (t) => {
  await t.test('clean and clean pass, counting both logs', async (t) => {
    const { stdout, departure } = await w8Line(t, W8_CLEAN);
    assert.equal(
      stdout,
      w8Expected(
        'pass',
        `no unmatched-rule or mixed-prefix line for any per-run profile rule in either log; ${W8_COUNTS('write-protection')}; ${W8_COUNTS('W7')}`,
        departure,
      ),
    );
  });

  await t.test('an unmatched-rule line in W7’s log fails, quoting the line and naming W7', async (t) => {
    const { stdout, departure } = await w8Line(t, W8_UNMATCHED);
    assert.equal(
      stdout,
      w8Expected('fail', `W7 log: Permission rule ${W8_RULE} is not matched by file permission checks`, departure),
    );
  });

  await t.test('no W7 log is not run, naming W7’s log', async (t) => {
    const { stdout, departure } = await w8Line(t, '');
    assert.equal(
      stdout,
      w8Expected(
        'not run',
        `W7's --debug-file log is missing or empty (the gates leg did not run its W7 session in this run); ${W8_COUNTS('write-protection')}`,
        departure,
      ),
    );
  });
});

test('sp__wp_cs7_edit: CS7’s Edit half', async (t) => {
  /** Runs `sp__wp_cs7_edit` and returns `<SP__WP_EDIT_V>|<SP__WP_EDIT_E>`. */
  async function edit(t, stream) {
    const dir = await caseDir(t);
    const run = await sourced(dir, 'sp__wp_cs7_edit "$@"; printf \'%s|%s\' "$SP__WP_EDIT_V" "$SP__WP_EDIT_E"', [
      stream,
      RUN_PROFILE,
    ]);
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }

  await t.test('an Edit refused at the permission layer passes', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-refused')),
      "pass|Edit refused at the permission layer: Permission to use Edit has been denied because Claude Code is running in don't ask mode.",
    );
  });

  await t.test('a session with no Edit call is not run', async (t) => {
    assert.equal(await edit(t, fixture('ran')), `not run|Edit: no Edit call on "${RUN_PROFILE}" in the session`);
  });
});

test('sp__git_cs3_fetch: a network-allowlist refusal is the clone layout’s design', async (t) => {
  const dir = await caseDir(t);
  const run = await sourced(
    dir,
    'sp__git_cs3_fetch "$@"; printf \'%s|%s\' "$SP__GIT_FETCH_V" "$SP__GIT_FETCH_E"',
    [fixture('cs3-fetch-refused'), 'git fetch origin'],
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(
    run.stdout,
    'pass|refused by the network allowlist, as the clone layout intends (§7 OR2): sandbox proxy: github-firu:22: 403 host is not on the allow list',
  );
});

test('sp__wp_tracked: one tracked file, and nothing on stderr however long the list is', async (t) => {
  const dir = await caseDir(t);
  const clone = join(dir, 'clone');
  await mkdir(clone);
  await seedRepository(clone, { remote: false });
  await writeFile(join(clone, 'README.md'), '# fixture\n');
  for (let n = 0; n < TRACKED_COUNT; n += 1) {
    await writeFile(join(clone, `f${n}.txt`), `${n}\n`);
  }
  await runGit(clone, ['add', '-A']);
  await runGit(clone, ['commit', '--quiet', '-m', 'seed tracked files']);

  await t.test('README.md first', async () => {
    const run = await sourced(dir, `${IGNORE_SIGPIPE}sp__wp_tracked`, [], { SP_CLONE: clone });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'README.md\n');
    assert.equal(run.stderr, '');
  });

  await t.test('README.md excluded: the first other non-dot tracked file', async () => {
    const run = await sourced(dir, `${IGNORE_SIGPIPE}sp__wp_tracked "$@"`, ['README.md'], { SP_CLONE: clone });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'f0.txt\n');
    assert.equal(run.stderr, '');
  });
});
