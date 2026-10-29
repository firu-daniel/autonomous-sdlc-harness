/**
 * The sandbox probe's refusal leg's grading functions (`sp__rf1_grade`, `sp__rf2_grade`, `sp__rf3_grade` in
 * `scripts/lib/sandbox-probe/legs-refusal.sh`).
 *
 * **The rule these tests exist to enforce: on a host that cannot sandbox, a session that runs its call is a
 * finding, a startup refusal is quoted, and the watcher's prerequisite probe must refuse naming the missing
 * package.** A permission-refused call is `not run` in RF1 and RF3. No positive control applies, as
 * `legs-refusal.sh`'s header states, so no case goes through the control gate.
 *
 * Each case runs a `bash -c` through `runBash` sourcing `core.sh`, `platform.sh`, `judge.sh`, `session.sh`,
 * `controls.sh`, `legs-settings.sh` and `legs-refusal.sh`, then sets SP_PLATFORM to `linux`, since
 * `platform.sh` empties it. Fixtures are passed unsubstituted: every grading function matches the command it
 * is given byte-equal. Stderr files are written into a `mkdtemp` under `os.tmpdir()`, removed in process when
 * each case ends.
 *
 * Left out deliberately: no case launches a session or removes a package, so the leg's session wiring
 * (`sp_leg_refusal`) is exercised only by a hand-run probe; `hr_sandbox_prereq_probe_var` is the run
 * library's and is tested where that library is.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = [
  'core.sh',
  'platform.sh',
  'judge.sh',
  'session.sh',
  'controls.sh',
  'legs-settings.sh',
  'legs-refusal.sh',
].map((f) => join(PROBE_LIB, f));
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing {@link LIBS} with SP_PLATFORM set to `linux`, its own arguments in `"$@"`. */
function sourced(cwd, body, args = []) {
  const script = [
    `for lib in "\${@:1:${LIBS.length}}"; do . "$lib"; done`,
    `shift ${LIBS.length}`,
    `SP_PLATFORM='linux'`,
    body,
  ].join('\n');
  return runBash(cwd, ['-c', script, '_', ...LIBS, ...args], { SP_VERSION: '', SP_CURRENT_LEG: '' });
}

async function caseDir(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'harness-sp-refusal-')));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return dir;
}

/** Runs `fn "$@"` in `dir` and returns `[SP_VERDICT, SP_EVIDENCE]`. */
async function graded(dir, fn, args) {
  const run = await sourced(dir, `${fn} "$@"; printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`, args);
  assert.equal(run.status, 0, run.stderr);
  const bar = run.stdout.indexOf('|');
  return [run.stdout.slice(0, bar), run.stdout.slice(bar + 1)];
}

/** A fresh case directory holding `stderr` as `agent.stderr`; returns `[dir, path]`. */
async function stderrFile(t, text) {
  const dir = await caseDir(t);
  const file = join(dir, 'agent.stderr');
  await writeFile(file, text);
  return [dir, file];
}

const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const RF1_CMD = 'dd if=/dev/null of=@FIXTURE_ROOT@/clone/sbx_rf1_ctl conv=notrunc';
const RF3_CMD = 'bash @FIXTURE_ROOT@/tmp/cs8-helper.sh';
const STARTUP_LINE = 'Error: sandbox unavailable: bwrap not found';
const RESULT_TEXT = 'sandbox required but unavailable';
const SANDBOX_REFUSAL = '@FIXTURE_ROOT@/tmp/cs8-helper.sh: line 2: @FIXTURE_ROOT@/home/sbx_cs8_marker: Operation not permitted';

test('sp__rf1_grade: a startup refusal passes, a call that ran fails', async (t) => {
  const rf1 = async (t, stream, stderr, rc) => {
    const [dir, file] = await stderrFile(t, stderr);
    return graded(dir, 'sp__rf1_grade', [fixture(stream), file, rc, RF1_CMD]);
  };

  await t.test('no call, exit 1: pass, quoting the stderr file’s first non-empty line', async (t) => {
    assert.deepEqual(await rf1(t, 'rf-no-call', `\n${STARTUP_LINE}\nsecond line\n`, '1'), [
      'pass',
      `refused at startup (exit 1): ${STARTUP_LINE}`,
    ]);
  });

  await t.test('no call, exit 1, an empty stderr file: pass, quoting the result event', async (t) => {
    assert.deepEqual(await rf1(t, 'rf-no-call', '', '1'), ['pass', `refused at startup (exit 1): ${RESULT_TEXT}`]);
  });

  await t.test('a call that ran: fail', async (t) => {
    assert.deepEqual(await rf1(t, 'rf-ran', '', '0'), [
      'fail',
      'the session ran its call although failIfUnavailable is true and the sandbox cannot start: 0+0 records in',
    ]);
  });

  await t.test('a permission-layer refusal is not run', async (t) => {
    assert.deepEqual(await rf1(t, 'rf-permission', '', '0'), [
      'not run',
      `the call was refused at the permission layer, so it says nothing of the startup check: ${DONT_ASK}`,
    ]);
  });

  await t.test('no call and exit 0 is not run', async (t) => {
    assert.deepEqual(await rf1(t, 'rf-no-call', '', '0'), [
      'not run',
      `no call issued and the agent CLI exited 0: ${RESULT_TEXT}`,
    ]);
  });
});

test('sp__rf2_grade: pass only on a refusal naming bwrap or socat', async (t) => {
  const rf2 = async (t, st, refusal) => graded(await caseDir(t), 'sp__rf2_grade', [st, refusal]);
  const BWRAP = 'The sandbox needs bwrap on PATH; install with …';

  await t.test('status 1 naming bwrap: pass', async (t) => {
    assert.deepEqual(await rf2(t, '1', BWRAP), ['pass', `the watcher would refuse the launch: ${BWRAP}`]);
  });

  await t.test('status 1 naming neither package: not run', async (t) => {
    assert.deepEqual(await rf2(t, '1', 'the sandbox cannot start'), [
      'not run',
      "the watcher's prerequisite probe refused, naming neither bwrap nor socat: the sandbox cannot start",
    ]);
  });

  await t.test('status 0: fail', async (t) => {
    assert.deepEqual(await rf2(t, '0', ''), [
      'fail',
      "the watcher's prerequisite probe passes on a host lacking bwrap or socat",
    ]);
  });

  await t.test('status 3: not run, naming sandbox.optOut', async (t) => {
    const [v, e] = await rf2(t, '3', '');
    assert.equal(v, 'not run');
    assert.ok(e.includes('sandbox.optOut'), e);
  });

  await t.test('any other status: not run', async (t) => {
    assert.deepEqual(await rf2(t, '2', ''), [
      'not run',
      "the watcher's prerequisite probe returned status '2': (no refusal text)",
    ]);
  });
});

test('sp__rf3_grade: records an ignored profile, a startup refusal or a sandboxed refusal', async (t) => {
  const rf3 = async (t, stream, stderr, rc, written) => {
    const [dir, file] = await stderrFile(t, stderr);
    return graded(dir, 'sp__rf3_grade', [fixture(stream), file, rc, RF3_CMD, written]);
  };

  await t.test('the marker written: pass, the invalid file was ignored', async (t) => {
    assert.deepEqual(await rf3(t, 'rf-no-call', '', '0', '1'), [
      'pass',
      'the invalid file was ignored: failIfUnavailable was never read, and the session ran unsandboxed with no startup refusal',
    ]);
  });

  await t.test('no marker, no call, exit 1: pass, refused at startup', async (t) => {
    assert.deepEqual(await rf3(t, 'rf-no-call', `${STARTUP_LINE}\n`, '1', '0'), [
      'pass',
      `refused at startup (exit 1): ${STARTUP_LINE}`,
    ]);
  });

  await t.test('a permission-layer refusal is not run', async (t) => {
    const [dir, file] = await stderrFile(t, '');
    assert.deepEqual(await graded(dir, 'sp__rf3_grade', [fixture('rf-permission'), file, '0', RF1_CMD, '0']), [
      'not run',
      `the call was refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`,
    ]);
  });

  await t.test('the helper refused at the sandbox layer: pass, started sandboxed', async (t) => {
    assert.deepEqual(await rf3(t, 'cs8-bad-sandbox', '', '0', '0'), [
      'pass',
      `started sandboxed and refused the write: ${SANDBOX_REFUSAL}`,
    ]);
  });
});
