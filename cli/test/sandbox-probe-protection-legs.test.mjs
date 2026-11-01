/**
 * The sandbox probe's write-protection and git-leg helpers (`sp__wp_w8`, `sp__wp_cs7_edit`,
 * `sp__git_cs3_fetch`, `sp__wp_dd_grade`, `sp__git_cs3_call`, `sp__git_cs3_state`, `sp__git_cl5_grade`,
 * `sp__wp_tracked`, `sp__wp_mv_class` in
 * `scripts/lib/sandbox-probe/legs-protection.sh`), run over the recorded streams and debug logs in
 * `fixtures/sandbox-probe/` and over a repository each case seeds.
 *
 * **The rule these tests exist to enforce: W8 needs both sessions' debug logs, CS7 includes its `Edit`
 * and passes it only on a refusal that names a protection (the Edit tool's read-before-write refusal is
 * `not run`), CS3's fetch refusal is the clone layout's design, a call refused at the permission layer
 * never reached the layer CS1, CS2, CS7, CS3 and CL5 measure, and is `not run`, and a CS3 state check
 * depending on such a call is skipped rather than failed, and no probe helper writes `Broken pipe`. On
 * Linux, `Read-only file system` is a dd and rename refusal beside `Operation not permitted`, and so, from
 * PD23 (docs/sandbox-verification.md §5), are a dd's `Permission denied` and a rename's `Device or resource
 * busy`; a dd, rename or CS3 fetch error carrying no refusal string the judge knows is `not run`, never
 * `fail`; with SP_PLATFORM empty each of those cases keeps its macOS verdict.** The unknown dd and rename
 * error is `Input/output error`, which no layer-table arm matches; it was `Device or resource busy` until
 * PD23 made that a refusal.
 *
 * Fixtures are passed unsubstituted: no function here requires an absolute path, and W8's rule and its
 * unmatched-rule line both spell `@FIXTURE_ROOT@`, so the substring match holds as recorded. A case
 * setting SP_PLATFORM also sources `platform.sh` and sets it afterwards, since that file empties it.
 *
 * The `sp__wp_tracked` repository commits 10,000 files so that `git ls-files` prints more than a 64 KiB
 * pipe buffer, and runs it with SIGPIPE ignored, as a caller may launch the probe: a pipe whose reader
 * exits at the first match then fails its writer with `printf: write error: Broken pipe`, the defect's
 * observable, which the empty-stderr assertions catch. With SIGPIPE at its default the writer dies
 * silently and the defect is invisible. The clone disables automatic gc so that the seed commit leaves no
 * background writer behind.
 */

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit, seedRepository, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'controls.sh', 'legs-protection.sh'].map((f) => join(PROBE_LIB, f));
const PLATFORM_LIB = join(PROBE_LIB, 'platform.sh');
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

/** As {@link sourced}, with `platform.sh` sourced too and SP_PLATFORM set to `platform` after it. */
function sourcedOn(cwd, platform, body, args = []) {
  return runBash(
    cwd,
    [
      '-c',
      `. "$1"; . "$2"; . "$3"; . "$4"; . "$5"; SP_PLATFORM="$6"; shift 6; ${body}`,
      '_',
      ...LIBS,
      PLATFORM_LIB,
      platform,
      ...args,
    ],
    { SP_VERSION: '' },
  );
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-protection-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
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

  await t.test('a dontAsk refusal passes, worded as no allow rule and no deny rule', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-refused')),
      `pass|Edit refused by dontAsk: no allow rule covers ${RUN_PROFILE}; no deny rule names it: ` +
        "Permission to use Edit has been denied because Claude Code is running in don't ask mode.",
    );
  });

  await t.test('a denied-directory refusal passes, worded as a deny rule', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-file-tool')),
      `pass|Edit refused by a deny rule covering ${RUN_PROFILE} (file-tool layer): ` +
        'File is in a directory that is denied by your permission settings.',
    );
  });

  await t.test('listed in permission_denials with no refusal in its text is not run', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-denials-only')),
      'not run|Edit listed in permission_denials, but its result names no permission refusal of the target: ' +
        '<tool_use_error>Edit was not applied.</tool_use_error> (in permission_denials)',
    );
  });

  await t.test('an error result with no refusal is not run', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-error')),
      'not run|Edit errored with no refusal of the target: <tool_use_error>String to replace not found in file.</tool_use_error>',
    );
  });

  await t.test('an Edit that succeeded fails', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-ran')),
      `fail|the Edit of ${RUN_PROFILE} was not refused: The file ${RUN_PROFILE} has been updated.`,
    );
  });

  await t.test('a session with no Edit call is not run', async (t) => {
    assert.equal(await edit(t, fixture('ran')), `not run|Edit: no Edit call on "${RUN_PROFILE}" in the session`);
  });

  // Run 2 (2026-10-27): the Read was refused, the Edit tool refused the Edit as unread, and
  // `permission_denials` listed it — a refusal that shows nothing about the target's protection.
  await t.test('the Edit tool’s read-before-write refusal is not run, never pass, naming the Read', async (t) => {
    assert.equal(
      await edit(t, fixture('cs7-edit-not-read')),
      "not run|Edit refused by the Edit tool's read-before-write rule, not by a protection of the target: " +
        '<tool_use_error>File has not been read yet. Read it first before writing to it.</tool_use_error>; ' +
        `the Read of ${RUN_PROFILE} was refused: Permission to use Read has been denied because Claude Code is running in don't ask mode.`,
    );
  });
});

test('sp__wp_cs7_read_rule: the session may Read the run profile, by an absolute `//` rule', async (t) => {
  const dir = await caseDir(t);
  const run = await sourced(dir, 'sp__wp_cs7_read_rule "$@"', ['/state/run-profiles/x/b.json']);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, 'Read(//state/run-profiles/x/b.json)');
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

/** Runs `fn <stream> <cmd>` and returns `<$v>|<$e>`. */
async function graded(t, fn, v, e, stream, cmd) {
  const dir = await caseDir(t);
  const run = await sourced(dir, `${fn} "$@"; printf '%s|%s' "$${v}" "$${e}"`, [stream, cmd]);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

const SANDBOX_DD = 'dd if=/dev/zero of=@FIXTURE_ROOT@/outside/probe bs=1 count=1';
const PERMISSION_DD = 'dd if=/dev/null of=@FIXTURE_ROOT@/clone/.git/config conv=notrunc';
const CL5_CMD = 'git config sbx.probe true';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const NEVER_REACHED = `refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`;

test('sp__wp_dd_grade: a permission-layer refusal of a dd is not run', async (t) => {
  const dd = (t, stream, cmd) => graded(t, 'sp__wp_dd_grade', 'SP__WP_DD_V', 'SP__WP_DD_E', stream, cmd);

  await t.test('a sandbox refusal passes', async (t) => {
    assert.equal(
      await dd(t, fixture('sandbox-dd'), SANDBOX_DD),
      'pass|dd: @FIXTURE_ROOT@/outside/probe: Operation not permitted',
    );
  });

  await t.test('a permission-layer refusal is not run, never pass', async (t) => {
    assert.equal(await dd(t, fixture('wp-dd-permission'), PERMISSION_DD), `not run|${NEVER_REACHED}`);
  });

  await t.test('a session with no such dd is not run', async (t) => {
    assert.equal(await dd(t, fixture('ran'), PERMISSION_DD), `not run|no Bash call "${PERMISSION_DD}" in the session`);
  });
});

/** As {@link graded}, on `platform`; returns `[<$v>, <$e>]`. */
async function gradedOn(t, platform, fn, v, e, stream, cmd) {
  const dir = await caseDir(t);
  const run = await sourcedOn(dir, platform, `${fn} "$@"; printf '%s|%s' "$${v}" "$${e}"`, [stream, cmd]);
  assert.equal(run.status, 0, run.stderr);
  const bar = run.stdout.indexOf('|');
  return [run.stdout.slice(0, bar), run.stdout.slice(bar + 1)];
}

const EROFS_LINE = "dd: failed to open '@FIXTURE_ROOT@/clone/.git/config': Read-only file system";
const EACCES_LINE = "dd: failed to open '@FIXTURE_ROOT@/clone/.git/config': Permission denied";
const LINUX_UNRECOGNISED = 'no refusal string this judge knows on Linux';

test('sp__wp_dd_grade on Linux: Read-only file system passes, an unknown error is not run', async (t) => {
  const dd = (t, platform, name) =>
    gradedOn(t, platform, 'sp__wp_dd_grade', 'SP__WP_DD_V', 'SP__WP_DD_E', fixture(name), PERMISSION_DD);

  await t.test('Read-only file system on Linux passes, quoting the line', async (t) => {
    assert.deepEqual(await dd(t, 'linux', 'wp-dd-erofs'), ['pass', EROFS_LINE]);
  });

  await t.test('Read-only file system with SP_PLATFORM empty fails as a call that ran', async (t) => {
    const [v, e] = await dd(t, '', 'wp-dd-erofs');
    assert.equal(v, 'fail');
    assert.ok(e.startsWith('ran:'), e);
  });

  await t.test('PD23: Permission denied on Linux passes, quoting the line', async (t) => {
    assert.deepEqual(await dd(t, 'linux', 'wp-dd-eacces'), ['pass', EACCES_LINE]);
  });

  await t.test('PD23: Permission denied with SP_PLATFORM empty fails as a call that ran', async (t) => {
    const [v, e] = await dd(t, '', 'wp-dd-eacces');
    assert.equal(v, 'fail');
    assert.ok(e.startsWith('ran:'), e);
  });

  await t.test('an unknown error on Linux is not run, never fail', async (t) => {
    const [v, e] = await dd(t, 'linux', 'wp-dd-unrecognised');
    assert.equal(v, 'not run');
    assert.ok(e.startsWith(LINUX_UNRECOGNISED), e);
  });

  await t.test('an unknown error with SP_PLATFORM empty fails', async (t) => {
    const [v] = await dd(t, '', 'wp-dd-unrecognised');
    assert.equal(v, 'fail');
  });

  for (const platform of ['linux', '']) {
    await t.test(`a permission-layer refusal is not run with SP_PLATFORM '${platform}'`, async (t) => {
      assert.deepEqual(await dd(t, platform, 'wp-dd-permission'), ['not run', NEVER_REACHED]);
    });
  }
});

test('sp__wp_mv_class: one rename helper line’s class, by platform', async (t) => {
  async function cls(t, platform, line) {
    const dir = await caseDir(t);
    const run = await sourcedOn(dir, platform, 'sp__wp_mv_class "$@"', [line]);
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }
  const cases = [
    ['sbx_wp_mv 0 landed', 'landed\n', 'landed\n'],
    ['sbx_wp_mv 0 stage failed: cp: x', 'stage-failed\n', 'stage-failed\n'],
    ['sbx_wp_mv 0 mv: rename a to b: Operation not permitted', 'refused\n', 'refused\n'],
    ["sbx_wp_mv 0 mv: cannot move 'a' to 'b': Read-only file system", 'refused\n', 'other\n'],
    ["sbx_wp_mv 0 mv: cannot move 'a' to 'b': Device or resource busy", 'refused\n', 'other\n'],
    [
      "sbx_wp_mv 0 mv: inter-device move failed: 'a' to 'b'; unable to remove target: Device or resource busy",
      'refused\n',
      'other\n',
    ],
    ["sbx_wp_mv 0 mv: cannot move 'a' to 'b': Input/output error", 'unrecognised\n', 'other\n'],
  ];
  for (const [line, linux, empty] of cases) {
    await t.test(line, async (t) => {
      assert.equal(await cls(t, 'linux', line), linux, 'SP_PLATFORM=linux');
      assert.equal(await cls(t, '', line), empty, 'SP_PLATFORM empty');
    });
  }
});

test('sp__git_cs3_fetch by platform: an unknown error is not run on Linux only', async (t) => {
  const fetch = (t, platform, name) =>
    gradedOn(t, platform, 'sp__git_cs3_fetch', 'SP__GIT_FETCH_V', 'SP__GIT_FETCH_E', fixture(name), 'git fetch origin');

  await t.test('an unknown error on Linux is not run', async (t) => {
    const [v, e] = await fetch(t, 'linux', 'cs3-fetch-unrecognised');
    assert.equal(v, 'not run');
    assert.ok(e.startsWith(LINUX_UNRECOGNISED), e);
  });

  await t.test('an unknown error with SP_PLATFORM empty fails as reaching origin', async (t) => {
    const [v, e] = await fetch(t, '', 'cs3-fetch-unrecognised');
    assert.equal(v, 'fail');
    assert.ok(e.startsWith('git fetch origin reached origin from inside the sandbox: '), e);
  });

  for (const platform of ['linux', '']) {
    await t.test(`a network-allowlist refusal passes with SP_PLATFORM '${platform}'`, async (t) => {
      const [v, e] = await fetch(t, platform, 'cs3-fetch-refused');
      assert.equal(v, 'pass');
      assert.ok(e.startsWith('refused by the network allowlist, as the clone layout intends (§7 OR2): '), e);
    });
  }
});

test('sp__git_cs3_call: a permission-layer refusal of a CS3 call is not run', async (t) => {
  const call = (t, cmd) =>
    graded(t, 'sp__git_cs3_call', 'SP__GIT_CALL_V', 'SP__GIT_CALL_E', fixture('git-permission'), cmd);

  await t.test('a permission-layer refusal is not run, never fail', async (t) => {
    assert.equal(
      await call(t, 'git add sbx_a.txt'),
      `not run|refused at the permission layer, so it never ran: ${DONT_ASK}`,
    );
  });

  await t.test('a call that ran passes', async (t) => {
    assert.equal(await call(t, 'git status --porcelain'), 'pass|(empty tool_result)');
  });
});

test('sp__git_cl5_grade: a permission-layer refusal of CL5’s git config is not run', async (t) => {
  const cl5 = (t, stream) => graded(t, 'sp__git_cl5_grade', 'SP_VERDICT', 'SP_EVIDENCE', stream, CL5_CMD);

  await t.test('a sandbox refusal with a could-not-lock line passes', async (t) => {
    assert.equal(
      await cl5(t, fixture('cl5-sandbox')),
      'pass|error: could not lock config file .git/config: Operation not permitted',
    );
  });

  await t.test('a permission-layer refusal is not run, never pass', async (t) => {
    assert.equal(await cl5(t, fixture('git-permission')), `not run|${NEVER_REACHED}`);
  });

  await t.test('a session with no git config is not run', async (t) => {
    assert.equal(await cl5(t, fixture('sandbox-dd')), `not run|no Bash call "${CL5_CMD}" in the session`);
  });
});

test('sp__git_cs3_state: a state check whose call did not run is skipped, never failed', async (t) => {
  /** Runs `sp__git_cs3_state` over a clone whose state no CS3 call changed; returns `[F, P]`. */
  async function state(t, unrun) {
    const dir = await caseDir(t);
    const clone = join(dir, 'clone');
    await mkdir(clone);
    await seedRepository(clone, { remote: false });
    await runGit(clone, ['checkout', '-q', '-b', 'sbx_probe']);
    await writeFile(join(clone, 'b.txt'), 'seed\n');
    await runGit(clone, ['add', 'b.txt']);
    await runGit(clone, ['commit', '--quiet', '-m', 'seed']);
    const ref = (await runGit(clone, ['rev-parse', 'refs/heads/sbx_probe'])).stdout.trim();
    const run = await sourced(
      dir,
      'sp__git_cs3_state "$@"; printf \'%s|%s\' "$SP__GIT_STATE_F" "$SP__GIT_STATE_P"',
      [ref, 'b.txt', 'b.txt', 'sandbox probe CS3', 'sbx_cs3_switch', '0', unrun],
      { SP_CLONE: clone, SP_BRANCH: 'sbx_probe' },
    );
    assert.equal(run.status, 0, run.stderr);
    return run.stdout.split('|');
  }

  await t.test('every dependent call not run: no failure, three not-checked parts', async (t) => {
    const [fails, parts] = await state(t, 'add commit push pop switch');
    assert.equal(fails, '');
    assert.equal(
      parts,
      'commit: not checked, git add or git commit did not run; ' +
        'stash: not checked, git stash push or git stash pop did not run; ' +
        'switch: not checked, git switch -c did not run',
    );
  });

  await t.test('every call ran: the unchanged state is three failures', async (t) => {
    const [fails] = await state(t, '');
    assert.match(
      fails,
      /^commit: .*; the stash pop did not restore the change to b\.txt; switch: HEAD is 'sbx_probe', not sbx_cs3_switch$/,
    );
  });

  await t.test('only switch not run: the commit and stash failures stay, no switch failure', async (t) => {
    const [fails] = await state(t, 'switch');
    assert.match(fails, /^commit: .*; the stash pop did not restore the change to b\.txt$/);
    assert.doesNotMatch(fails, /switch:/);
  });
});

test('sp__wp_tracked: one tracked file, and nothing on stderr however long the list is', async (t) => {
  const dir = await caseDir(t);
  const clone = join(dir, 'clone');
  await mkdir(clone);
  await seedRepository(clone, { remote: false });
  // 10,000 loose objects exceed `gc.auto`; the detached gc the commit would start races the case directory's removal.
  await runGit(clone, ['config', 'gc.auto', '0']);
  await runGit(clone, ['config', 'maintenance.auto', 'false']);
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
