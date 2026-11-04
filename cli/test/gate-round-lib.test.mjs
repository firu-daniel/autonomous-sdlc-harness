/**
 * The Run gates round library, `scripts/lib/gate-round-lib.sh`: `gr_init`, `gr_gate_line`,
 * `gr_record`, `gr_previous_focus_var`, `gr_run_round` and `gr_slowest`.
 *
 * **The rule this suite enforces: a round passes only through a full phase; a focused phase that
 * fails stops the round; an unreadable or absent previous record changes nothing about today's
 * run.** It also pins the gate-line forms, the record rows, the lane validation and the
 * slowest-files section.
 *
 * Each case copies the run library (`cli/templates/scripts/lib/harness-run-lib.sh`, which owns
 * `HR_TEST_RUN_LABEL_PATTERN` and `HR_TEST_RUN_LOG_SUBDIR`) and the round library into its own
 * directory under `os.tmpdir()`, removed in process, beside a fake repository root holding
 * `cli/test/*.test.mjs` files and the lane `sdlc-harness/test_run_logs/feat-x/`. A bash driver
 * sources both copies, sets the four `GR_*` values, runs `gr_run_round` over a stub unit function
 * that logs each call and records a status the case scripts, and prints the resolved lane and the
 * round's status. Every case passes both `RUN_TEST_SUITE_*` values explicitly: this suite itself
 * runs inside a gate that exports them.
 *
 * The stub logs `GR_FOCUS_FILES` only for gate 4 in the `focused` phase, where `scripts/run-gates.sh`
 * reads it: the library leaves the variable set for every unit and into the `full` phase, and the
 * unit contract makes it meaningful only for a narrowed id in `focused`.
 *
 * Deliberately not covered: `scripts/run-gates.sh`'s real gates, which only a Run gates round runs.
 */

import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readdir, readFile, realpath, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const RUN_LIB = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');
const ROUND_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'gate-round-lib.sh');

const IDS = ['1', '2a', '2b', '3a', '4', '6a', '14a', '16'];
const LANE_DIR = 'sdlc-harness/test_run_logs/feat-x';
const LABEL = 'task_round_2';
const GATES_HEADER = 'phase\tgate\tstatus\tseconds';
const TESTS_HEADER = 'file\tstatus\tseconds\ttests\tfailed';

const DRIVER = `#!/usr/bin/env bash
# $1 run library ('' to skip it), $2 round library, $3 repo root, $4 tmp dir, $5 calls file
if [ -n "$1" ]; then
  . "$1" || exit 99
else
  unset HR_TEST_RUN_LABEL_PATTERN HR_TEST_RUN_LOG_SUBDIR
fi
. "$2" || exit 99
GR_PREREQUISITES='2a:2b,14a'
GR_NARROWED_IDS='4'
GR_TEST_FILE_PATTERN='^test/[A-Za-z0-9._/-]+\\.test\\.mjs$'
GR_TEST_ROOT='cli'
CALLS="$5"
stub() {
  local files=''
  [ "$GR_PHASE" = focused ] && [ "$1" = 4 ] && files="$GR_FOCUS_FILES"
  printf '%s %s %s\\n' "$GR_PHASE" "$1" "$files" >>"$CALLS"
  case " $STUB_FAIL " in
    *" $1 "*) gr_record "$1" FAIL 0 ;;
    *) gr_record "$1" ok 0 ;;
  esac
}
gr_init "$3" "$4"
printf 'lane=%s\\n' "$GR_LANE"
gr_run_round stub ${IDS.join(' ')}
printf 'status=%s\\n' "$?"
`;

/** A throwaway directory with both library copies, the driver, a fake repo root and its lane. */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'gate-round-lib-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const runLib = join(root, 'harness-run-lib.sh');
  const roundLib = join(root, 'gate-round-lib.sh');
  await copyFile(RUN_LIB, runLib);
  await copyFile(ROUND_LIB, roundLib);
  const driver = join(root, 'driver.sh');
  await writeFile(driver, DRIVER);
  const repo = join(root, 'repo');
  await mkdir(join(repo, 'cli', 'test'), { recursive: true });
  for (const name of ['a', 'b', 'c']) await writeFile(join(repo, 'cli', 'test', `${name}.test.mjs`), '');
  const lane = join(repo, LANE_DIR);
  await mkdir(lane, { recursive: true });
  const tmp = join(root, 'tmp');
  await mkdir(tmp);
  return { root, runLib, roundLib, driver, repo, lane, tmp };
}

/** Write `<label>.gates.tsv` (or raw text) in the lane, its mtime `age` seconds in the past. */
async function writePrevious(f, label, rows, { end = 'end\tcomplete', age = 100, raw } = {}) {
  const file = join(f.lane, `${label}.gates.tsv`);
  const body = raw ?? [GATES_HEADER, ...rows.map((r) => r.join('\t')), ...(end === null ? [] : [end])].join('\n') + '\n';
  await writeFile(file, body);
  const when = Math.floor(Date.now() / 1000) - age;
  await utimes(file, when, when);
}

/** Write `<label>.<phase>.tests.tsv` in the lane. */
async function writeTests(f, label, phase, rows, { end = 'end' } = {}) {
  const body = [TESTS_HEADER, ...rows.map((r) => r.join('\t')), ...(end === null ? [] : [end])].join('\n') + '\n';
  await writeFile(join(f.lane, `${label}.${phase}.tests.tsv`), body);
}

/** Full-phase rows for every id, with the listed ids `FAIL`. */
function fullRows(failing) {
  return IDS.map((id) => ['full', id, failing.includes(id) ? 'FAIL' : 'ok', '0']);
}

/** Run the driver; `dir` and `label` are always passed explicitly, never inherited. */
async function round(f, { fail = '', label = LABEL, dir = LANE_DIR, withRunLib = true } = {}) {
  const calls = join(f.root, 'calls');
  await rm(calls, { force: true });
  const r = await runBash(f.root, [f.driver, withRunLib ? f.runLib : '', f.roundLib, f.repo, f.tmp, calls], {
    RUN_TEST_SUITE_LABEL: label,
    RUN_TEST_SUITE_LOG_DIR: dir,
    STUB_FAIL: fail,
  });
  let callLines = [];
  try {
    callLines = (await readFile(calls, 'utf8')).split('\n').filter((l) => l !== '').map((l) => l.trimEnd());
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  let record = null;
  try {
    record = await readFile(join(f.lane, `${label}.gates.tsv`), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return { ...r, calls: callLines, record };
}

/** The record text for `rows` closed by `end`. */
function record(rows, end) {
  return [GATES_HEADER, ...rows.map((r) => r.join('\t')), `end\t${end}`].join('\n') + '\n';
}

/** Assert the first-round outcome: no focus line, every id once in `full`, record complete, 0. */
function assertFullRound(f, r, message) {
  assert.equal(r.stderr, '', message);
  assert.equal(r.stdout, `lane=${f.lane}\nstatus=0\n`, message);
  assert.deepEqual(r.calls, IDS.map((id) => `full ${id}`), message);
  assert.equal(r.record, record(IDS.map((id) => ['full', id, 'ok', '0']), 'complete'), message);
}

const FOCUS_LINE = 'run-gates: running first what failed in task_round_1: gates 4, 6a; test files test/a.test.mjs\n';

/** The previous round `task_round_1`: `4` and `6a` failed, `test/a.test.mjs` failed in gate 4. */
async function previousFailures(f) {
  await writePrevious(f, 'task_round_1', fullRows(['4', '6a']));
  await writeTests(f, 'task_round_1', 'full', [
    ['test/a.test.mjs', 'fail', '1.5', '3', '1'],
    ['test/b.test.mjs', 'pass', '0.5', '2', '0'],
  ]);
}

test('a first round runs every id once, in order, in the full phase', async (t) => {
  const f = await fixture(t);
  assertFullRound(f, await round(f), 'empty lane');
});

test('a previous round with no FAIL row gives the first-round outcome', async (t) => {
  const f = await fixture(t);
  await writePrevious(f, 'task_round_1', fullRows([]));
  assertFullRound(f, await round(f), 'previous complete, no FAIL');
});

test('still failing: only the previous failures run, focused, and the round stops with 1', async (t) => {
  const f = await fixture(t);
  await previousFailures(f);
  const r = await round(f, { fail: '6a' });
  assert.equal(r.stderr, '');
  assert.equal(
    r.stdout,
    `lane=${f.lane}\n` +
      FOCUS_LINE +
      'run-gates: stopped early: ran only gates 4, 6a and test files test/a.test.mjs, which failed in task_round_1; every other gate and test file did not run, so this round cannot pass\n' +
      'status=1\n',
  );
  assert.deepEqual(r.calls, ['focused 4 test/a.test.mjs', 'focused 6a']);
  assert.equal(
    r.record,
    record(
      [
        ['focused', '4', 'ok', '0'],
        ['focused', '6a', 'FAIL', '0'],
      ],
      'stopped',
    ),
  );
});

test('still failing: a focus on 14a brings its prerequisite 2a first', async (t) => {
  const f = await fixture(t);
  await writePrevious(f, 'task_round_1', fullRows(['14a']));
  const r = await round(f, { fail: '14a' });
  assert.equal(r.stderr, '');
  assert.equal(
    r.stdout,
    `lane=${f.lane}\n` +
      'run-gates: running first what failed in task_round_1: gates 2a, 14a; test files none\n' +
      'run-gates: stopped early: ran only gates 2a, 14a and test files none, which failed in task_round_1; every other gate and test file did not run, so this round cannot pass\n' +
      'status=1\n',
  );
  assert.deepEqual(r.calls, ['focused 2a', 'focused 14a']);
});

test('still failing: a failing file no longer on disk is dropped, and gate 4 leaves the focus with its last file', async (t) => {
  const f = await fixture(t);
  await writePrevious(f, 'task_round_1', fullRows(['4', '6a']));
  await writeTests(f, 'task_round_1', 'full', [
    ['test/a.test.mjs', 'fail', '1', '1', '1'],
    ['test/gone.test.mjs', 'fail', '1', '1', '1'],
  ]);
  const dropped = await round(f, { fail: '6a' });
  assert.equal(dropped.stderr, '');
  assert.ok(dropped.stdout.includes(FOCUS_LINE), dropped.stdout);
  assert.deepEqual(dropped.calls, ['focused 4 test/a.test.mjs', 'focused 6a']);

  await rm(join(f.repo, 'cli', 'test', 'a.test.mjs'));
  const emptied = await round(f, { fail: '6a' });
  assert.equal(emptied.stderr, '');
  assert.equal(
    emptied.stdout,
    `lane=${f.lane}\n` +
      'run-gates: running first what failed in task_round_1: gates 6a; test files none\n' +
      'run-gates: stopped early: ran only gates 6a and test files none, which failed in task_round_1; every other gate and test file did not run, so this round cannot pass\n' +
      'status=1\n',
  );
  assert.deepEqual(emptied.calls, ['focused 6a']);
});

test('now passing: the focused phase passes, then every other id and gate 4 whole run in full', async (t) => {
  const f = await fixture(t);
  await previousFailures(f);
  const r = await round(f);
  assert.equal(r.stderr, '');
  assert.equal(
    r.stdout,
    `lane=${f.lane}\n` +
      FOCUS_LINE +
      'run-gates: everything that failed in task_round_1 passed; running every other gate and the whole suite\n' +
      'status=0\n',
  );
  const full = IDS.filter((id) => id !== '6a');
  assert.deepEqual(r.calls, ['focused 4 test/a.test.mjs', 'focused 6a', ...full.map((id) => `full ${id}`)]);
  assert.equal(
    r.record,
    record(
      [
        ['focused', '4', 'ok', '0'],
        ['focused', '6a', 'ok', '0'],
        ...full.map((id) => ['full', id, 'ok', '0']),
      ],
      'complete',
    ),
  );
});

test('the newest other record by mtime is the one read, never one of the round\'s own label', async (t) => {
  const f = await fixture(t);
  await writePrevious(f, 'a_round', fullRows(['16']), { age: 100 });
  await writePrevious(f, 'z_round', fullRows(['6a']), { age: 200 });
  const byMtime = await round(f, { fail: '16' });
  assert.equal(byMtime.stderr, '');
  assert.ok(byMtime.stdout.includes('running first what failed in a_round: gates 16; test files none\n'), byMtime.stdout);
  assert.deepEqual(byMtime.calls, ['focused 16']);

  const g = await fixture(t);
  await writePrevious(g, 'z_round', fullRows(['6a']), { age: 200 });
  await writePrevious(g, LABEL, fullRows(['1']), { age: -600 });
  const own = await round(g, { fail: '6a' });
  assert.equal(own.stderr, '');
  assert.ok(own.stdout.includes('running first what failed in z_round: gates 6a; test files none\n'), own.stdout);
  assert.deepEqual(own.calls, ['focused 6a']);
});

test('an unreadable previous record gives the first-round outcome', async (t) => {
  const a = ['test/a.test.mjs', 'fail', '1', '1', '1'];
  const cases = [
    ['no end line', async (f) => writePrevious(f, 'task_round_1', fullRows(['6a']), { end: null })],
    [
      'a malformed row',
      async (f) =>
        writePrevious(f, 'task_round_1', [], {
          raw: `${GATES_HEADER}\nfull\t6a\tFAIL\nend\tcomplete\n`,
        }),
    ],
    ['an id outside the given ids', async (f) => writePrevious(f, 'task_round_1', [...fullRows(['6a']), ['full', '99', 'FAIL', '0']])],
    ['4 FAIL with its tests record missing', async (f) => writePrevious(f, 'task_round_1', fullRows(['4', '6a']))],
    [
      '4 FAIL with a tests record without end',
      async (f) => {
        await writePrevious(f, 'task_round_1', fullRows(['4', '6a']));
        await writeTests(f, 'task_round_1', 'full', [a], { end: null });
      },
    ],
    [
      '4 FAIL with a tests record naming an absolute file',
      async (f) => {
        await writePrevious(f, 'task_round_1', fullRows(['4', '6a']));
        await writeTests(f, 'task_round_1', 'full', [a, ['/abs/x.test.mjs', 'fail', '1', '1', '1']]);
      },
    ],
    [
      '4 FAIL with a tests record naming a parent-relative file',
      async (f) => {
        await writePrevious(f, 'task_round_1', fullRows(['4', '6a']));
        await writeTests(f, 'task_round_1', 'full', [a, ['../x.test.mjs', 'fail', '1', '1', '1']]);
      },
    ],
  ];
  for (const [name, setup] of cases) {
    const f = await fixture(t);
    await setup(f);
    assertFullRound(f, await round(f), name);
  }
});

test('gr_init leaves the lane empty, and the round writes nothing in it, for an unusable seam', async (t) => {
  const cases = [
    ['an absolute directory', (f) => ({ dir: f.lane })],
    ['a .. segment', () => ({ dir: 'sdlc-harness/test_run_logs/../test_run_logs/feat-x' })],
    ['a parent other than test_run_logs', () => ({ dir: 'sdlc-harness/other_logs/feat-x' })],
    ['a missing directory', () => ({ dir: 'sdlc-harness/test_run_logs/feat-missing' })],
    ['a label starting with -', () => ({ label: '-task_round_2' })],
    ['no run library sourced first', () => ({ withRunLib: false })],
  ];
  for (const [name, options] of cases) {
    const f = await fixture(t);
    await mkdir(join(f.repo, 'sdlc-harness', 'other_logs', 'feat-x'), { recursive: true });
    await writePrevious(f, 'task_round_1', fullRows(['6a']));
    const before = (await readdir(f.lane)).sort();
    const r = await round(f, options(f));
    assert.equal(r.stderr, '', name);
    assert.equal(r.stdout, 'lane=\nstatus=0\n', name);
    assert.deepEqual(r.calls, IDS.map((id) => `full ${id}`), name);
    assert.deepEqual((await readdir(f.lane)).sort(), before, name);
    assert.deepEqual(await readdir(join(f.repo, 'sdlc-harness', 'other_logs', 'feat-x')), [], name);
  }
});

/** Source both library copies and run `script` with the remaining values as `$1`, `$2`, …. */
function call(f, script, args = []) {
  return runBash(f.root, ['-c', `. "$1" || exit 99; . "$2" || exit 99; shift 2; ${script}`, '_', f.runLib, f.roundLib, ...args], {
    RUN_TEST_SUITE_LABEL: '',
    RUN_TEST_SUITE_LOG_DIR: '',
  });
}

test('gr_gate_line prints each line form byte-exact and nothing for another status', async (t) => {
  const f = await fixture(t);
  const r = await call(
    f,
    [
      'gr_gate_line ok "unit 1" 3',
      'gr_gate_line FAIL "unit 4" 12 "exit 1"',
      'gr_gate_line FAIL "unit 5" 2',
      'gr_gate_line BLOCKED "unit 6a" 0 "needs 2a"',
      'gr_gate_line SKIPPED "unit 16" 0 "not configured"',
      'gr_gate_line pass "unit 9" 0; echo "status=$?"',
    ].join('; '),
  );
  assert.equal(r.stderr, '');
  assert.equal(
    r.stdout,
    '  ok    unit 1 (3 s)\n' +
      '  FAIL  unit 4 (exit 1, 12 s)\n' +
      '  FAIL  unit 5 (2 s)\n' +
      '  BLOCKED unit 6a — needs 2a (0 s)\n' +
      '  SKIPPED unit 16 — not configured (0 s)\n' +
      'status=1\n',
  );
});

test('gr_slowest prints the ten slowest rows under its heading, or a no-record line', async (t) => {
  const f = await fixture(t);
  const seconds = ['3.5', '11', '1', '7.25', '12', '2', '9', '4', '10', '5', '8', '6'];
  const rows = seconds.map((s, i) => [`test/f${String(i + 1).padStart(2, '0')}.test.mjs`, i === 4 ? 'fail' : 'pass', s, '2', i === 4 ? '1' : '0']);
  const file = join(f.root, 'twelve.tests.tsv');
  await writeFile(file, [TESTS_HEADER, ...rows.map((r) => r.join('\t')), 'end'].join('\n') + '\n');
  const unreadable = join(f.root, 'unreadable.tests.tsv');
  await writeFile(unreadable, `${TESTS_HEADER}\n${rows[0].join('\t')}\n`);
  const r = await call(f, `GR_TEST_FILE_PATTERN='^test/[A-Za-z0-9._/-]+\\.test\\.mjs$'; gr_slowest "$1" full; gr_slowest "$2" focused; gr_slowest "$3" full`, [
    file,
    join(f.root, 'absent.tests.tsv'),
    unreadable,
  ]);
  assert.equal(r.stderr, '');
  const slowest = [...rows].sort((x, y) => Number(y[2]) - Number(x[2])).slice(0, 10);
  assert.equal(
    r.stdout,
    "== slowest test files (full run of gate 4), by the sum of each file's top-level test durations ==\n" +
      slowest.map((x) => `  ${x[2]} s  ${x[0]}  (${x[3]} tests, ${x[4]} failed)\n`).join('') +
      '== slowest test files: no per-file record (no record was written) ==\n' +
      '== slowest test files: no per-file record (the record is unreadable) ==\n',
  );
  assert.equal(slowest.at(-1)[2], '3.5');
});
