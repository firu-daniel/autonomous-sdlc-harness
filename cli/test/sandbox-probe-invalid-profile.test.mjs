/**
 * The sandbox probe's `invalid-profile` leg grading (`sp__cs8a_grade`, `sp__cs8b_check`, `sp__cs8b_grade`,
 * `sp__cs8_line` in `legs-settings.sh`), run over the recorded streams in `fixtures/sandbox-probe/` and a stub
 * watcher.
 *
 * **The rule these tests exist to enforce: CS8 (a) records only a call that reached the sandbox or wrote the
 * marker; CS8 (b) passes only on the watcher check's sandbox-clause refusal of a profile whose
 * `failIfUnavailable` is a string, fails on its acceptance, and is not run when the unmodified profile's control
 * is refused. CS8's one line fails when (b) fails, is `not run` when either half is `not run` or (b) was not
 * taken, and passes otherwise.**
 *
 * No case launches a session or sources the real watcher (`autonomous-watcher.sh`): `sp__cs8b_check` is aimed
 * at `fixtures/sandbox-probe/cs8b-watcher-stub.sh`, whose `run_profile_check` answers from `CS8B_STUB_RC` and
 * `CS8B_STUB_REFUSAL`. Fixtures are passed unsubstituted, since each call is matched byte-equal against a
 * command that spells `@FIXTURE_ROOT@` the same way.
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'controls.sh', 'legs-settings.sh'];
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');
const WATCHER_STUB = join(FIXTURES, 'cs8b-watcher-stub.sh');

const HELPER_CMD = 'bash @FIXTURE_ROOT@/tmp/cs8-helper.sh';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const SANDBOX_REFUSAL = '@FIXTURE_ROOT@/tmp/cs8-helper.sh: line 2: @FIXTURE_ROOT@/home/sbx_cs8_marker: Operation not permitted';
const STRICT_REFUSAL =
  '<p> does not carry sandbox.enabled true, sandbox.failIfUnavailable true and sandbox.allowUnsandboxedCommands false, and names no sandbox opt-out';
const STUB_STDOUT = 'cs8b-stub: status on stdout';
const STUB_STDERR = 'cs8b-stub: status on stderr';

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing the probe libraries, its own arguments in `"$@"`. */
function sourced(cwd, body, args, env = {}) {
  const libs = LIBS.map((f) => join(PROBE_LIB, f));
  return runBash(cwd, ['-c', `. "$1"; . "$2"; . "$3"; . "$4"; shift 4; ${body}`, '_', ...libs, ...args], {
    SP_VERSION: '',
    ...env,
  });
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-invalid-profile-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('sp__cs8a_grade: (a) records only a call that reached the sandbox or wrote the marker', async (t) => {
  async function cs8a(t, stream, marker) {
    const run = await sourced(
      await caseDir(t),
      'sp__cs8a_grade "$@"; printf \'%s|%s\' "$SP__CS8A_V" "$SP__CS8A_E"',
      [fixture(stream), HELPER_CMD, marker],
    );
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }

  await t.test('a permission-layer refusal is not run', async (t) => {
    assert.equal(
      await cs8a(t, 'cs8-bad-permission', '0'),
      `not run|on <bad> the call was refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`,
    );
  });

  await t.test('a sandbox-layer refusal of the marker is recorded', async (t) => {
    assert.equal(
      await cs8a(t, 'cs8-bad-sandbox', '0'),
      `pass|on <bad> the marker was refused at the sandbox layer: ${SANDBOX_REFUSAL}`,
    );
  });

  await t.test('a stream without the call is not run', async (t) => {
    assert.equal(
      await cs8a(t, 'ran', '0'),
      `not run|on <bad> the call was not issued: no Bash call "${HELPER_CMD}" in the session`,
    );
  });

  await t.test('a written marker is recorded whatever the stream says', async (t) => {
    assert.equal(
      await cs8a(t, 'cs8-bad-permission', '1'),
      'pass|on <bad> the marker was written: the invalid setting was silently ignored and the call ran unsandboxed',
    );
  });
});

test('sp__cs8b_grade: (b) passes only on the sandbox-clause refusal, fails on acceptance, and is not run on a refused control', async (t) => {
  async function cs8b(t, ...args) {
    const run = await sourced(await caseDir(t), 'sp__cs8b_grade "$@"; printf \'%s|%s\' "$SP_VERDICT" "$SP_EVIDENCE"', args);
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }

  await t.test('a refused control is not run, whatever the measured call did', async (t) => {
    assert.equal(
      await cs8b(t, '0', '', '1', 'control refusal'),
      'not run|control did not succeed: run_profile_check refused the unmodified per-run profile: control refusal',
    );
  });

  await t.test('acceptance fails', async (t) => {
    assert.equal(
      await cs8b(t, '0', '', '0', ''),
      'fail|the watcher\'s run_profile_check accepted <bad>, whose sandbox.failIfUnavailable is the string "true", so a run launched on it would start unsandboxed (§5 F7)',
    );
  });

  await t.test('the sandbox-clause refusal passes', async (t) => {
    assert.equal(await cs8b(t, '1', STRICT_REFUSAL, '0', ''), `pass|refused before launch: ${STRICT_REFUSAL}`);
  });

  await t.test('any other refusal is not run', async (t) => {
    assert.equal(
      await cs8b(t, '1', '<p> is not valid JSON', '0', ''),
      'not run|refused, but not by the sandbox clause: <p> is not valid JSON',
    );
  });

  await t.test('any other status is not run', async (t) => {
    assert.equal(
      await cs8b(t, '2', 'stub defines no run_profile_check', '0', ''),
      'not run|run_profile_check could not be run (exit 2): stub defines no run_profile_check',
    );
  });
});

test('sp__cs8b_check: reads the check through a sourced watcher and discards the sourcing output', async (t) => {
  async function check(t, env) {
    const dir = await caseDir(t);
    const run = await sourced(
      dir,
      'sp__cs8b_check "$@"; printf \'%s|%s\' "$SP__CS8B_RC" "$SP__CS8B_REFUSAL"',
      [WATCHER_STUB, join(dir, 'bad.json'), join(dir, 'copy')],
      env,
    );
    assert.equal(run.status, 0, run.stderr);
    for (const line of [STUB_STDOUT, STUB_STDERR]) {
      assert.ok(!run.stdout.includes(line), `stdout carries the stub's "${line}"`);
      assert.ok(!run.stderr.includes(line), `stderr carries the stub's "${line}"`);
    }
    return run.stdout;
  }

  await t.test('a refusal sets status 1 and the refusal', async (t) => {
    assert.equal(await check(t, { CS8B_STUB_RC: '1', CS8B_STUB_REFUSAL: STRICT_REFUSAL }), `1|${STRICT_REFUSAL}`);
  });

  await t.test('acceptance sets status 0 and an empty refusal', async (t) => {
    assert.equal(await check(t, { CS8B_STUB_RC: '0', CS8B_STUB_REFUSAL: '' }), '0|');
  });
});

test('sp__cs8_line: (b) failing fails the row, either half not run is not run, otherwise pass', async (t) => {
  async function line(t, ...args) {
    const run = await sourced(await caseDir(t), 'sp__cs8_line "$@"', args);
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }
  const expected = (result, evidence) =>
    `leg="invalid-profile" row="CS8" result="${result}" evidence="${evidence}" departure="none" claude="unknown"\n`;

  await t.test('both halves pass', async (t) => {
    assert.equal(
      await line(t, 'pass', 'A', 'CTL', 'pass', 'B', ''),
      expected('pass', '(a) recorded: A; CTL; (b) B'),
    );
  });

  await t.test('(b) failing fails the row even with (a) not run', async (t) => {
    assert.equal(await line(t, 'not run', 'A', '', 'fail', 'B', ''), expected('fail', '(a) not run: A; (b) B'));
  });

  await t.test('(a) not run with (b) passing is not run', async (t) => {
    assert.equal(await line(t, 'not run', 'A', '', 'pass', 'B', ''), expected('not run', '(a) not run: A; (b) B'));
  });

  await t.test('(b) not run with (a) recorded is not run', async (t) => {
    assert.equal(await line(t, 'pass', 'A', '', 'not run', 'B', ''), expected('not run', '(a) recorded: A; (b) B'));
  });

  await t.test('(b) not taken is not run', async (t) => {
    assert.equal(await line(t, 'pass', 'A', '', '', '', ''), expected('not run', '(a) recorded: A; (b) not taken'));
  });
});
