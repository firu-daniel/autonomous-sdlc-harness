/**
 * The sandbox probe's glob-deny and registry legs' target, grading and restore functions (`sp__gw_targets`,
 * `sp__gw_grade` in `scripts/lib/sandbox-probe/legs-glob.sh`; `sp__rg1_grade`, `sp__rg2_grade`,
 * `sp__rg3_grade`, `sp__rg_restore` in `scripts/lib/sandbox-probe/legs-registry.sh`), with `sp_teardown`'s
 * pending-restore step (`sp_restore_register`, `sp_restore_clear` in `scripts/lib/sandbox-probe/session.sh`).
 *
 * **The rule these tests exist to enforce: the glob leg measures only paths a `*` entry alone covers,
 * outside the clone's `.git`, and records either outcome; and RG2 and RG3 are graded on the registry's own
 * state, and a moved directory is restored with no recursive removal.** Every grading function drives a
 * permission-refused fixture to `not run`. Since PD23 (docs/sandbox-verification.md §5), a Linux
 * `Device or resource busy` is a sandbox-layer refusal, so RG2 (a) and RG3 quote it as one; only that
 * evidence moved, no verdict. RG3's unrecognised path is held on `Input/output error` instead, in a stream
 * the case derives from `rg3-refused.jsonl`.
 *
 * Each case runs a `bash -c` through `runBash` sourcing `core.sh`, `platform.sh`, `judge.sh`,
 * `controls.sh`, `preflight.sh`, `session.sh`, `legs-protection.sh` and the two leg files, then sets
 * SP_PLATFORM (`linux` unless a case says otherwise), since `platform.sh` empties it. Fixtures are passed
 * unsubstituted: every grading function matches the command or path it is given byte-equal. Temporary
 * trees are `mkdtemp`s under `os.tmpdir()`, removed in process when each case ends.
 *
 * Left out deliberately: no case launches a session, so the legs' session wiring (`sp_leg_glob_deny`,
 * `sp_leg_registry`) is exercised only by a hand-run probe.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = [
  'core.sh',
  'platform.sh',
  'judge.sh',
  'controls.sh',
  'preflight.sh',
  'session.sh',
  'legs-protection.sh',
  'legs-glob.sh',
  'legs-registry.sh',
].map((f) => join(PROBE_LIB, f));
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing {@link LIBS} with SP_PLATFORM set to `platform`, its own arguments in `"$@"`. */
function sourced(cwd, body, args = [], { platform = 'linux', env = {} } = {}) {
  const script = [
    `for lib in "\${@:1:${LIBS.length}}"; do . "$lib"; done`,
    `shift ${LIBS.length}`,
    `SP_PLATFORM='${platform}'`,
    body,
  ].join('\n');
  return runBash(cwd, ['-c', script, '_', ...LIBS, ...args], { SP_VERSION: '', SP_CURRENT_LEG: '', ...env });
}

async function caseDir(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'harness-sp-glob-registry-')));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return dir;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Runs `fn "$@"` and returns `[SP_VERDICT, SP_EVIDENCE]`. */
async function graded(t, fn, args, opts) {
  const dir = await caseDir(t);
  const run = await sourced(dir, `${fn} "$@"; printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`, args, opts);
  assert.equal(run.status, 0, run.stderr);
  const bar = run.stdout.indexOf('|');
  return [run.stdout.slice(0, bar), run.stdout.slice(bar + 1)];
}

const GW_DD = 'dd if=/dev/null of=@FIXTURE_ROOT@/proj-sbx/githooks/sbx_gw1_new conv=notrunc';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const LOGS = '@FIXTURE_ROOT@/main/harness-runs/autonomous_logs';
const REG = `${LOGS}/registry.json`;
const RG1_DD = `dd if=/dev/null of=${REG} conv=notrunc`;
const RG2_MV = `mv ${LOGS}/sbx_rg2_sib ${REG}`;
const RG2_HELPER = 'bash @FIXTURE_ROOT@/sp-tmp/rg2-helper.sh';
const RG2_BUSY = `sbx_rg2_mv refused: mv: cannot move '${LOGS}/sbx_rg2_copy' to '${REG}': Device or resource busy`;
const RG3_MV = `mv ${LOGS} ${LOGS}.aside`;
const RG3_BUSY = `mv: cannot move '${LOGS}' to '${LOGS}.aside': Device or resource busy`;

test('sp__gw_targets: only clone paths a `*` entry alone covers, never under the clone’s .git', async (t) => {
  /** A work root holding the clone `proj-sbx/`, a profile with `denyWrite`, and the run's printed targets. */
  async function targets(t, denyWrite) {
    const root = await caseDir(t);
    const clone = join(root, 'proj-sbx');
    await mkdir(join(clone, '.git'), { recursive: true });
    await writeFile(join(clone, '.git', 'config'), '[core]\n');
    await mkdir(join(clone, 'githooks'));
    await mkdir(join(clone, '.claude'));
    const profile = join(root, 'profile.json');
    await writeFile(profile, `${JSON.stringify({ sandbox: { filesystem: { denyWrite: denyWrite(root) } } })}\n`);
    const run = await sourced(
      root,
      'sp__gw_targets "$@"; rc=$?; printf "%s\\n" "$rc" "$SP__GW_EXISTING" "$SP__GW_EXISTING_ENTRY" "$SP__GW_ABSENT" "$SP__GW_ABSENT_ENTRY"',
      [profile, clone],
    );
    assert.equal(run.status, 0, run.stderr);
    const [rc, existing, existingEntry, absent, absentEntry] = run.stdout.split('\n');
    return { root, clone, rc, existing, existingEntry, absent, absentEntry };
  }

  await t.test('the .git entry is dropped; GW1 is a new file in githooks/, GW2 the absent settings file', async (t) => {
    const r = await targets(t, (root) => [
      `${root}/proj-*/.git/config`,
      `${root}/proj-*/githooks`,
      `${root}/proj-*/.claude/settings.local.json`,
      `${root}/proj-sbx/.mcp.json`,
    ]);
    assert.equal(r.rc, '0');
    assert.equal(r.existing, join(r.clone, 'githooks', 'sbx_gw1_new'));
    assert.equal(r.existingEntry, `${r.root}/proj-*/githooks`);
    assert.equal(r.absent, join(r.clone, '.claude', 'settings.local.json'));
    assert.equal(r.absentEntry, `${r.root}/proj-*/.claude/settings.local.json`);
  });

  await t.test('a profile with no `*` entry returns status 1', async (t) => {
    const r = await targets(t, (root) => [`${root}/proj-sbx/.mcp.json`, `${root}/proj-sbx/githooks`]);
    assert.equal(r.rc, '1');
    assert.equal(r.existing, '');
    assert.equal(r.absent, '');
  });
});

test('sp__gw_grade: refused and written both pass; a permission-layer refusal is not run', async (t) => {
  await t.test('Read-only file system on Linux passes as refused', async (t) => {
    assert.deepEqual(await graded(t, 'sp__gw_grade', [fixture('gw-refused'), GW_DD]), [
      'pass',
      "refused: dd: failed to open '@FIXTURE_ROOT@/proj-sbx/githooks/sbx_gw1_new': Read-only file system",
    ]);
  });

  await t.test('a dd that opened the path passes as written', async (t) => {
    assert.deepEqual(await graded(t, 'sp__gw_grade', [fixture('gw-written'), GW_DD]), [
      'pass',
      'written: the open for writing succeeded, so no entry protected the path: 0+0 records in',
    ]);
  });

  await t.test('a permission-layer refusal is not run, never pass', async (t) => {
    assert.deepEqual(await graded(t, 'sp__gw_grade', [fixture('gw-permission'), GW_DD]), [
      'not run',
      `refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`,
    ]);
  });
});

test('sp__rg1_grade: the dd, the Edit and the registry’s shasum', async (t) => {
  const RG1_REFUSALS =
    `dd refused: dd: failed to open '${REG}': Read-only file system; ` +
    `Edit refused by a deny rule covering ${REG} (file-tool layer): File is in a directory that is denied by your permission settings.`;

  await t.test('both refused, shasum unchanged: pass', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg1_grade', [fixture('rg-session'), RG1_DD, REG, '1']), [
      'pass',
      `${RG1_REFUSALS}; shasum unchanged`,
    ]);
  });

  await t.test('both refused, shasum changed: fail', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg1_grade', [fixture('rg-session'), RG1_DD, REG, '0']), [
      'fail',
      `${RG1_REFUSALS}; shasum changed`,
    ]);
  });

  await t.test('a permission-layer refusal of the dd is not run', async (t) => {
    const [v, e] = await graded(t, 'sp__rg1_grade', [fixture('gw-permission'), GW_DD, REG, '1']);
    assert.equal(v, 'not run');
    assert.ok(e.startsWith(`dd refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}; `), e);
  });
});

test('sp__rg2_grade: graded on the registry’s inode and shasum and the helper’s line', async (t) => {
  await t.test('inode and shasum unchanged, the helper refused: pass, quoting the busy message', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg2_grade', [fixture('rg-session'), RG2_MV, RG2_HELPER, '1', '1']), [
      'pass',
      `(a) refused at the permission layer: ${DONT_ASK}; (b) ${RG2_BUSY}; inode unchanged, shasum unchanged`,
    ]);
  });

  await t.test('inode changed: fail', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg2_grade', [fixture('rg-session'), RG2_MV, RG2_HELPER, '0', '1']), [
      'fail',
      `(a) refused at the permission layer: ${DONT_ASK}; (b) ${RG2_BUSY}; inode changed, shasum unchanged`,
    ]);
  });

  await t.test('a permission-layer refusal of the helper is not run', async (t) => {
    const [v, e] = await graded(t, 'sp__rg2_grade', [fixture('gw-permission'), RG2_MV, GW_DD, '1', '1']);
    assert.equal(v, 'not run');
    assert.ok(e.includes(`(b) refused at the permission layer, so the helper never ran: ${DONT_ASK}`), e);
  });

  // PD23: on Linux a direct mv's `Device or resource busy` is a sandbox refusal; with SP_PLATFORM empty it
  // is still an error carrying no refusal string. Only (a)'s evidence moves; the verdict is (b)'s.
  for (const [platform, a] of [
    ['linux', `(a) refused at the sandbox layer: ${RG3_BUSY}`],
    ['', `(a) failed with no refusal string: Exit code 1: ${RG3_BUSY}`],
  ]) {
    await t.test(`a busy direct mv with SP_PLATFORM '${platform}': (a) reads ${platform ? 'sandbox' : 'no refusal string'}`, async (t) => {
      assert.deepEqual(
        await graded(t, 'sp__rg2_grade', [fixture('rg3-refused'), RG3_MV, RG2_HELPER, '1', '1'], { platform }),
        ['not run', `${a}; (b) no Bash call "${RG2_HELPER}" in the session; inode unchanged, shasum unchanged`],
      );
    });
  }
});

test('sp__rg3_grade: graded on whether the directory moved; the mv’s message is quoted, never matched', async (t) => {
  // PD23 made `Device or resource busy` a Linux sandbox refusal, so its evidence is the refusal line;
  // `Input/output error`, which no layer-table arm matches, keeps the unrecognised path.
  await t.test('not moved, a busy error: pass, quoting the sandbox refusal', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg3_grade', [fixture('rg3-refused'), RG3_MV, '0', '1']), [
      'pass',
      `refused: ${RG3_BUSY}`,
    ]);
  });

  await t.test('not moved, an unrecognised error: pass, quoting it', async (t) => {
    const dir = await caseDir(t);
    const stream = join(dir, 'rg3-unrecognised.jsonl');
    const recorded = await readFile(fixture('rg3-refused'), 'utf8');
    await writeFile(stream, recorded.replace('Device or resource busy', 'Input/output error'));
    assert.deepEqual(await graded(t, 'sp__rg3_grade', [stream, RG3_MV, '0', '1']), [
      'pass',
      `refused: Exit code 1: mv: cannot move '${LOGS}' to '${LOGS}.aside': Input/output error`,
    ]);
  });

  await t.test('moved: fail, naming the restore', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg3_grade', [fixture('rg3-refused'), RG3_MV, '1', '1']), [
      'fail',
      "the registry's directory was moved aside from inside the sandbox; the probe restored it",
    ]);
  });

  await t.test('a permission-layer refusal is not run', async (t) => {
    assert.deepEqual(await graded(t, 'sp__rg3_grade', [fixture('gw-permission'), GW_DD, '0', '1']), [
      'not run',
      `the mv was refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`,
    ]);
  });
});

test('sp__rg_restore: puts <dir>.aside back with no recursive removal', async (t) => {
  const TEXT = '{"runs":[]}\n';

  /** A case directory holding `logs.aside/registry.json` with {@link TEXT} and, unless `noLogs`, a zero-byte `logs/registry.json`. */
  async function moved(t, { noLogs = false } = {}) {
    const dir = await caseDir(t);
    const logs = join(dir, 'logs');
    const aside = join(dir, 'logs.aside');
    await mkdir(aside);
    await writeFile(join(aside, 'registry.json'), TEXT);
    if (!noLogs) {
      await mkdir(logs);
      await writeFile(join(logs, 'registry.json'), '');
    }
    return { dir, logs, aside };
  }

  /** Runs `body` with `$1` set to the `logs` path; prints `rc=<status> exit=<SP_EXIT>` from `body`'s own printf. */
  async function restore(dir, logs, body = 'sp__rg_restore "$1"; rc=$?') {
    const run = await sourced(dir, `${body}; printf 'rc=%s exit=%s\\n' "$rc" "$SP_EXIT"`, [logs]);
    assert.equal(run.status, 0, run.stderr);
    return run;
  }

  await t.test('a zero-byte registry.json in an otherwise empty logs/ is replaced by the moved directory', async (t) => {
    const { dir, logs, aside } = await moved(t);
    const run = await restore(dir, logs);
    assert.equal(run.stdout, 'rc=0 exit=0\n');
    assert.equal(await readFile(join(logs, 'registry.json'), 'utf8'), TEXT);
    assert.equal(await exists(aside), false);
  });

  await t.test('a logs/ holding another non-empty file is left with logs.aside, status 1 and exit 5', async (t) => {
    const { dir, logs, aside } = await moved(t);
    await writeFile(join(logs, 'other.txt'), 'kept\n');
    const run = await restore(dir, logs);
    assert.equal(run.stdout, 'rc=1 exit=5\n');
    assert.equal(
      run.stderr,
      `sandbox-probe: registry restore: '${logs}' is left and not an empty directory, so '${aside}' was not moved back; restore it by hand\n`,
    );
    assert.equal(await readFile(join(logs, 'other.txt'), 'utf8'), 'kept\n');
    assert.equal(await readFile(join(aside, 'registry.json'), 'utf8'), TEXT);
  });

  await t.test('no logs.aside: nothing is done, status 0', async (t) => {
    const dir = await caseDir(t);
    const logs = join(dir, 'logs');
    await mkdir(logs);
    await writeFile(join(logs, 'registry.json'), '');
    const run = await restore(dir, logs);
    assert.equal(run.stdout, 'rc=0 exit=0\n');
    assert.equal(await readFile(join(logs, 'registry.json'), 'utf8'), '');
  });

  await t.test('logs.aside and no logs/ (an interrupt between the mv and the mkdir): moved back, status 0', async (t) => {
    const { dir, logs, aside } = await moved(t, { noLogs: true });
    const run = await restore(dir, logs);
    assert.equal(run.stdout, 'rc=0 exit=0\n');
    assert.equal(await readFile(join(logs, 'registry.json'), 'utf8'), TEXT);
    assert.equal(await exists(aside), false);
  });

  /** As {@link restore}, through `sp_teardown` with an otherwise empty probe state; prints the slot afterwards. */
  async function teardown(dir, logs, before) {
    const spTmp = join(dir, 'sp-tmp');
    await mkdir(spTmp);
    const body = [
      `SP_TMP='${spTmp}'; SP_CLONE=''; SP_MAIN=''`,
      'sp_restore_register sp__rg_restore "$1"',
      before,
      'sp_teardown',
      `printf 'fn=%s exit=%s\\n' "$SP__RESTORE_FN" "$SP_EXIT"`,
    ].join('\n');
    const run = await sourced(dir, body, [logs], { env: { TMPDIR: dir } });
    assert.equal(run.status, 0, run.stderr);
    return run;
  }

  await t.test('a registered restore runs in sp_teardown, with no restore call of its own', async (t) => {
    const { dir, logs, aside } = await moved(t);
    const run = await teardown(dir, logs, ':');
    assert.equal(run.stdout, 'fn= exit=0\n');
    assert.equal(await readFile(join(logs, 'registry.json'), 'utf8'), TEXT);
    assert.equal(await exists(aside), false);
  });

  await t.test('a cleared restore is not run by sp_teardown: logs.aside is left untouched', async (t) => {
    const { dir, logs, aside } = await moved(t);
    const run = await teardown(dir, logs, 'sp_restore_clear');
    assert.equal(run.stdout, 'fn= exit=0\n');
    assert.equal(await readFile(join(aside, 'registry.json'), 'utf8'), TEXT);
    assert.equal(await readFile(join(logs, 'registry.json'), 'utf8'), '');
  });
});
