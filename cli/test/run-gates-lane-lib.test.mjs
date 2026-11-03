/**
 * The run library's Run gates lane — `HR_TEST_RUN_LABEL_PATTERN`, `HR_TEST_RUN_STALE_SECONDS`,
 * `HR_TEST_RUN_LOG_SUBDIR`, `hr_test_run_lane_dir` and `hr_heartbeat_age` — and the profile predicate
 * `hr_json_single_object`, in `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule this suite enforces: `run-test-suite.sh` and `launch-sandboxed-gates.sh` take the lane
 * layout, the label pattern, the staleness bound and the heartbeat reader from this one owner, and
 * `hr_heartbeat_age` never answers a time it could not read; `launch-sandboxed-gates.sh` and
 * `autonomous-watcher.sh` judge a profile by the one `hr_json_single_object`.** The scripts' own
 * suites pin the behaviour built on these; this one pins the helpers themselves.
 *
 * Each case copies the library into its own throwaway directory under `os.tmpdir()`, sources it from
 * there in one `bash` process, and removes the directory in process. An unreadable mtime comes from a
 * `stat` stub placed first on `PATH` that always fails.
 */

import assert from 'node:assert/strict';
import { chmod, copyFile, mkdir, mkdtemp, realpath, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';

const LIB_TEMPLATE = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

/** A fresh directory holding a copy of the library, removed after the case. */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'run-gates-lane-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const lib = join(root, 'harness-run-lib.sh');
  await copyFile(LIB_TEMPLATE, lib);
  /** Source the copied library, then run `script` with the remaining values as `$1`, `$2`, …. */
  const call = (script, args = [], env = {}) => runBash(root, ['-c', `. "$1" || exit 99; shift; ${script}`, '_', lib, ...args], env);
  return { root, call };
}

test('the lane constants hold the values both scripts used to retype', async (t) => {
  const f = await fixture(t);
  const r = await f.call('printf "%s|%s|%s\\n" "$HR_TEST_RUN_LABEL_PATTERN" "$HR_TEST_RUN_STALE_SECONDS" "$HR_TEST_RUN_LOG_SUBDIR"');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '^[A-Za-z0-9][A-Za-z0-9._-]*$|30|test_run_logs\n');
});

test('HR_TEST_RUN_LABEL_PATTERN accepts a gate label and refuses a leading dash or a slash', async (t) => {
  const f = await fixture(t);
  const cases = [
    ['typecheck_round_1', '0'],
    ['a.b-c_d', '0'],
    ['-bad', '1'],
    ['a/b', '1'],
    ['', '1'],
  ];
  for (const [label, expected] of cases) {
    const r = await f.call('[[ "$1" =~ $HR_TEST_RUN_LABEL_PATTERN ]]; echo "$?"', [label]);
    assert.equal(r.stdout.trim(), expected, `label ${JSON.stringify(label)}`);
  }
});

test('hr_test_run_lane_dir composes <state_dir>/test_run_logs/<sanitized branch>', async (t) => {
  const f = await fixture(t);
  const relative = await f.call('hr_test_run_lane_dir "$1" "$2"; echo "status=$?"', ['sdlc-harness', 'feat/run-gates']);
  assert.equal(relative.stderr, '');
  assert.equal(relative.stdout, 'sdlc-harness/test_run_logs/feat-run-gates\nstatus=0\n');

  const absolute = await f.call('hr_test_run_lane_dir "$1" "$2"; echo "status=$?"', ['/x/harness-runs', 'fix/a/b']);
  assert.equal(absolute.stdout, '/x/harness-runs/test_run_logs/fix-a-b\nstatus=0\n');
});

test('hr_test_run_lane_dir fails, printing nothing, for a branch that does not sanitize', async (t) => {
  const f = await fixture(t);
  const r = await f.call('hr_test_run_lane_dir "$1" "$2"; echo "status=$?"', ['sdlc-harness', '']);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, 'status=1\n');
});

test('hr_heartbeat_age prints a fresh heartbeat as a small age and a back-dated one as its age', async (t) => {
  const f = await fixture(t);
  const running = join(f.root, 'task_round_1.running');
  await writeFile(running, '123\n');

  const fresh = await f.call('hr_heartbeat_age "$1"; echo "status=$?"', [running]);
  assert.equal(fresh.stderr, '');
  const [freshAge, freshStatus] = fresh.stdout.trim().split('\n');
  assert.equal(freshStatus, 'status=0');
  assert.match(freshAge, /^[0-9]+$/);
  assert.ok(Number(freshAge) <= 2, `fresh age ${freshAge}`);

  const past = Math.floor(Date.now() / 1000) - 120;
  await utimes(running, past, past);
  const old = await f.call('hr_heartbeat_age "$1"; echo "status=$?"', [running]);
  const [oldAge, oldStatus] = old.stdout.trim().split('\n');
  assert.equal(oldStatus, 'status=0');
  assert.ok(Number(oldAge) >= 120 && Number(oldAge) <= 125, `back-dated age ${oldAge}`);

  const future = Math.floor(Date.now() / 1000) + 600;
  await utimes(running, future, future);
  const ahead = await f.call('hr_heartbeat_age "$1"; echo "status=$?"', [running]);
  assert.equal(ahead.stdout, '0\nstatus=0\n');
});

test('hr_heartbeat_age fails, printing nothing, for a missing heartbeat', async (t) => {
  const f = await fixture(t);
  const r = await f.call('hr_heartbeat_age "$1"; echo "status=$?"', [join(f.root, 'absent.running')]);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, 'status=1\n');
});

test('hr_heartbeat_age fails, printing nothing, when the mtime cannot be read', async (t) => {
  const f = await fixture(t);
  const running = join(f.root, 'task_round_1.running');
  await writeFile(running, '123\n');
  const stubs = join(f.root, 'stubs');
  await mkdir(stubs);
  await writeFile(join(stubs, 'stat'), '#!/bin/sh\nexit 1\n');
  await chmod(join(stubs, 'stat'), 0o755);

  const r = await f.call('PATH="$1:$PATH"; hr_heartbeat_age "$2"; echo "status=$?"', [stubs, running]);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, 'status=1\n');
});

test('hr_json_single_object accepts exactly one JSON object and refuses anything else', async (t) => {
  const f = await fixture(t);
  const cases = [
    ['object.json', '{"sandbox":{"enabled":true}}\n', 'status=0'],
    ['array.json', '[{"sandbox":{}}]\n', 'status=1'],
    ['two-objects.json', '{"a":1}\n{"b":2}\n', 'status=1'],
    ['invalid.json', '{"a":\n', 'status=1'],
    ['empty.json', '', 'status=1'],
  ];
  for (const [name, body, expected] of cases) {
    const file = join(f.root, name);
    await writeFile(file, body);
    const r = await f.call('hr_json_single_object "$1"; echo "status=$?"', [file]);
    assert.equal(r.stderr, '', name);
    assert.equal(r.stdout, `${expected}\n`, name);
  }
  const absent = await f.call('hr_json_single_object "$1"; echo "status=$?"', [join(f.root, 'absent.json')]);
  assert.equal(absent.stdout, 'status=1\n');
});
