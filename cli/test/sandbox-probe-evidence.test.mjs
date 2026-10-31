/**
 * The sandbox probe's teardown (`sp_teardown`, with `sp_session`, `sp_keep_file` and `sp_track_pid`, in
 * `scripts/lib/sandbox-probe/session.sh`) as it reads the non-pass record (`sp_leg_nonpass` in
 * `scripts/lib/sandbox-probe/core.sh`).
 *
 * **The rule these tests exist to enforce: teardown keeps the evidence of every leg that did not pass,
 * outside the clone and the main checkout, prints where, and leaves nothing else behind — and stops
 * every process the probe started.**
 *
 * Each case runs a `bash -c` through `runBash`, which blanks the main-checkout anchor, sourcing
 * `core.sh`, `judge.sh`, `preflight.sh` (for `sp_snapshot_check`, a no-op with no snapshot) and
 * `session.sh` from `WORKSPACE_ROOT`. Its `TMPDIR` is its own directory under `os.tmpdir()`, and
 * `SP_TMP`, `SP_CLONE`, `SP_MAIN` and `SP_STATE_DIR` are directories under it, set after sourcing
 * because `session.sh` blanks `SP_CLONE` and `SP_STATE_DIR` when sourced. The agent CLI is a stub the
 * case writes, copying `cli/test/fixtures/sandbox-probe/ran.jsonl` to stdout.
 *
 * Left out deliberately: real sessions, so no case launches `claude`; and the clone steps of teardown,
 * since no case registers a clone.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'preflight.sh', 'session.sh'].map((name) => join(PROBE_LIB, name));
const RAN = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe', 'ran.jsonl');
const EVIDENCE_PREFIX = 'sandbox-probe-evidence.';
const KEPT_LINE = 'sandbox-probe: evidence of the legs that did not pass kept in ';
/** Below `sleep 300`, so a process teardown failed to stop fails the case rather than hanging it. */
const TIMEOUT_MS = 60_000;

/**
 * A per-case `TMPDIR` holding the four probe directories and the agent stub, removed when the case
 * ends, evidence directories included.
 *
 * @param {import('node:test').TestContext} t
 */
async function caseDirs(t) {
  const tmp = realpathSync(await mkdtemp(join(tmpdir(), 'sandbox-probe-evidence-case-')));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const dirs = { tmp, spTmp: join(tmp, 'sp-tmp'), clone: join(tmp, 'clone'), main: join(tmp, 'main'), state: join(tmp, 'state') };
  for (const dir of [dirs.spTmp, dirs.clone, dirs.main, dirs.state]) await mkdir(dir);
  const stub = join(tmp, 'agent-stub.sh');
  await writeFile(stub, `#!/usr/bin/env bash\ncat '${RAN}'\n`, 'utf8');
  await chmod(stub, 0o755);
  return { ...dirs, stub };
}

/** `body` run after sourcing the four libraries, with the probe's directories set from `d`. */
function sourced(d, body, env = {}) {
  const script = [
    'for lib in "$@"; do . "$lib"; done',
    `SP_TMP='${d.spTmp}'; SP_CLONE='${d.clone}'; SP_MAIN='${d.main}'; SP_STATE_DIR='${d.state}'`,
    body,
  ].join('\n');
  return runBash(
    d.tmp,
    ['-c', script, '_', ...LIBS],
    { TMPDIR: d.tmp, SANDBOX_PROBE_AGENT_CLI: d.stub, SP_VERSION: '', SP_CURRENT_LEG: '', ...env },
    { timeoutMs: TIMEOUT_MS },
  );
}

/** One session under `leg`, its settings, prompt and debug log created first, then `extra`. */
function sessionBody(leg, extra) {
  return [
    `SP_CURRENT_LEG=${leg}`,
    `printf '{}\\n' >"$SP_TMP/settings.json"`,
    `printf 'Run the command.\\n' >"$SP_TMP/prompt.txt"`,
    `printf 'debug\\n' >"$SP_TMP/case.debug.log"`,
    `sp_session ${leg}-case "$SP_TMP/settings.json" "$SP_TMP/prompt.txt" --debug-file "$SP_TMP/case.debug.log" || echo "session exited $?"`,
    extra,
  ].join('\n');
}

function probeLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith('sandbox-probe: '));
}

async function evidenceEntries(tmp) {
  return (await readdir(tmp)).filter((name) => name.startsWith(EVIDENCE_PREFIX));
}

async function assertUntouched(d) {
  assert.deepEqual(await readdir(d.clone), [], 'SP_CLONE holds nothing the case did not create');
  assert.deepEqual(await readdir(d.main), [], 'SP_MAIN holds nothing the case did not create');
}

test('teardown keeps the evidence of a leg that did not pass, and only that', async (t) => {
  await t.test('a leg that printed not run keeps its session files in a printed directory', async (t) => {
    const d = await caseDirs(t);
    const run = await sourced(
      d,
      sessionBody(
        'credentials',
        [
          `printf 'extra\\n' >"$SP_TMP/extra.log"`,
          'sp_keep_file "$SP_TMP/extra.log"',
          'sp_result_line credentials S1 "not run" "case" ""',
          'sp_teardown',
        ].join('\n'),
      ),
    );

    assert.equal(run.status, 0, run.stderr);
    assert.doesNotMatch(run.stdout, /session exited/, run.stdout);
    assert.match(run.stdout, /leg="credentials" row="S1" result="not run"/);
    const lines = probeLines(run.stderr);
    const last = lines.at(-1) ?? '';
    assert.ok(last.startsWith(KEPT_LINE), run.stderr);
    const dir = last.slice(KEPT_LINE.length);
    assert.ok(dir.startsWith(join(d.tmp, EVIDENCE_PREFIX)), `${dir} is a ${EVIDENCE_PREFIX}* directory under the case's TMPDIR`);
    assert.deepEqual((await readdir(dir)).sort(), ['credentials']);
    assert.deepEqual(
      (await readdir(join(dir, 'credentials'))).sort(),
      ['case.debug.log', 'credentials-case.stderr', 'credentials-case.stream.jsonl', 'extra.log', 'prompt.txt'],
    );
    await assert.rejects(readdir(d.spTmp), { code: 'ENOENT' }, 'SP_TMP is removed');
    await assertUntouched(d);
  });

  await t.test('a leg that printed only pass keeps nothing', async (t) => {
    const d = await caseDirs(t);
    const run = await sourced(d, sessionBody('network', ['sp_result_line network N1 pass "case" ""', 'sp_teardown'].join('\n')));

    assert.equal(run.status, 0, run.stderr);
    assert.doesNotMatch(run.stdout, /session exited/, run.stdout);
    assert.match(run.stdout, /leg="network" row="N1" result="pass"/);
    assert.deepEqual(
      probeLines(run.stderr).filter((line) => line.startsWith(KEPT_LINE)),
      [],
      run.stderr,
    );
    assert.deepEqual(await evidenceEntries(d.tmp), []);
    await assert.rejects(readdir(d.spTmp), { code: 'ENOENT' }, 'SP_TMP is removed');
    await assertUntouched(d);
  });
});

test('teardown stops a process registered with sp_track_pid', async (t) => {
  const d = await caseDirs(t);
  const run = await sourced(
    d,
    [
      'sleep 300 &',
      'pid=$!',
      'sp_track_pid "$pid"',
      'sp_teardown',
      'kill -0 "$pid" 2>/dev/null; printf "alive=%s exit=%s\\n" "$?" "$SP_EXIT"',
    ].join('\n'),
  );

  assert.equal(run.status, 0, run.stderr);
  const m = /alive=(\d+) exit=(\d+)/.exec(run.stdout);
  assert.ok(m, run.stdout);
  assert.notEqual(Number(m[1]), 0, 'kill -0 finds no process after teardown');
  assert.ok(Number(m[2]) < 5, `SP_EXIT is ${m[2]}: ${run.stderr}`);
  assert.deepEqual(await evidenceEntries(d.tmp), []);
  await assert.rejects(readdir(d.spTmp), { code: 'ENOENT' }, 'SP_TMP is removed');
  await assertUntouched(d);
});
