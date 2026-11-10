/**
 * Mode `rounds` of `cli/templates/scripts/lib/run-analytics.jq`, run directly with `jq` over input
 * each case builds.
 *
 * **The rule this suite exists to enforce: every readable round is recorded once with every row,
 * every unreadable record is named, and a resumed label is appended, never rewritten.**
 *
 * Each input is built the way its caller builds it: a marker line, the record file's lines, and
 * one extra newline. `$known` is bound with `--slurpfile` from a file written under a throwaway
 * directory, never through an argument.
 *
 * Not covered, by the header's own statement: the caller's test-file pattern and gate-id set,
 * which the mode does not check.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

const PROGRAM = fileURLToPath(new URL('../templates/scripts/lib/run-analytics.jq', import.meta.url));

let dir;
let knownCount = 0;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'run-analytics-rounds-'));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

// The caller prints the marker, the file, then one newline; the file ends in a newline unless empty.
function record(lb, name, lines) {
  const file = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  return `${JSON.stringify({ run_analytics_round: lb, record: name })}\n${file}\n`;
}

function args(knownFile, redact) {
  return [
    '-n', '-R', '-c', '-S', '-f', PROGRAM,
    '--arg', 'mode', 'rounds',
    '--argjson', 'idle_threshold_s', '1',
    '--slurpfile', 'known', knownFile,
    '--argjson', 'redact', JSON.stringify(redact),
    '--argjson', 'suspend', '[]',
    '--arg', 'suspend_source', 'none',
  ];
}

function writeKnown(text) {
  knownCount += 1;
  const file = join(dir, `known-${knownCount}.json`);
  writeFileSync(file, text);
  return file;
}

function rounds(input, { known = [], redact = [] } = {}) {
  const out = execFileSync('jq', args(writeKnown(JSON.stringify(known)), redact), { input, encoding: 'utf8' });
  return JSON.parse(out);
}

const GATES_HEADER = 'phase\tgate\tstatus\tseconds';
const TESTS_HEADER = 'file\tstatus\tseconds\ttests\tfailed';

const GATES = [
  GATES_HEADER,
  'focused\ttypecheck\tok\t4',
  'focused\ttest\tFAIL\t12',
  'full\ttypecheck\tok\t5',
  'full\ttest\tok\t30',
  'end\tcomplete',
];

const FOCUSED = [TESTS_HEADER, 'test/b.test.mjs\tfail\t2.25\t4\t1', 'end'];

const FULL_FILES = Array.from({ length: 12 }, (_, i) => `test/f${i + 1}.test.mjs`);
const FULL = [TESTS_HEADER, ...FULL_FILES.map((f, i) => `${f}\tpass\t${i + 1}.5\t${i + 2}\t0`), 'end'];

function validRound(lb, { verdict = 'fail 1 gate failed', gates = GATES, focused = FOCUSED, full = FULL } = {}) {
  return (
    record(lb, 'verdict', [verdict]) +
    record(lb, 'gates.tsv', gates) +
    (focused ? record(lb, 'focused.tests.tsv', focused) : '') +
    (full ? record(lb, 'full.tests.tsv', full) : '')
  );
}

test('input with no marker line yields no round and no skipped record', () => {
  assert.deepEqual(rounds('pass\nphase\tgate\n'), { rounds: [], skipped: [] });
  assert.deepEqual(rounds(''), { rounds: [], skipped: [] });
});

test('one valid round keeps every row and number', () => {
  const out = rounds(`ignored before the first marker\n${validRound('task_round_1')}`);
  assert.deepEqual(out.skipped, []);
  assert.equal(out.rounds.length, 1);
  const [r] = out.rounds;
  assert.equal(r.round_id, 'task_round_1');
  assert.equal(r.verdict, 'fail');
  assert.deepEqual(r.gates, {
    outcome: 'complete',
    rows: [
      { phase: 'focused', gate: 'typecheck', status: 'ok', seconds: 4 },
      { phase: 'focused', gate: 'test', status: 'FAIL', seconds: 12 },
      { phase: 'full', gate: 'typecheck', status: 'ok', seconds: 5 },
      { phase: 'full', gate: 'test', status: 'ok', seconds: 30 },
    ],
  });
  assert.deepEqual(r.tests.focused, [{ file: 'test/b.test.mjs', status: 'fail', seconds: 2.25, tests: 4, failed: 1 }]);
  assert.equal(r.tests.full.length, 12);
  assert.deepEqual(
    r.tests.full,
    FULL_FILES.map((file, i) => ({ file, status: 'pass', seconds: i + 1.5, tests: i + 2, failed: 0 })),
  );
  assert.deepEqual(r.unreadable, []);
});

test('a passing verdict keeps the word pass', () => {
  const [r] = rounds(validRound('task_round_1', { verdict: 'pass' })).rounds;
  assert.equal(r.verdict, 'pass');
});

test('each validation failure class is named in skipped with its record name', () => {
  const gateCases = [
    ['g_hdr', [GATES_HEADER.replace('seconds', 'secs'), 'end\tcomplete'], 'first line is not phase\\tgate\\tstatus\\tseconds'],
    ['g_end', [GATES_HEADER, 'focused\ttest\tok\t1', 'end\tdone'], 'last line is not end\\tcomplete or end\\tstopped'],
    ['g_noend', [GATES_HEADER], 'last line is not end\\tcomplete or end\\tstopped'],
    ['g_fields', [GATES_HEADER, 'focused\ttest\tok', 'end\tcomplete'], 'line 2: expected 4 tab-separated fields'],
    ['g_phase', [GATES_HEADER, 'other\ttest\tok\t1', 'end\tcomplete'], 'line 2: phase is neither focused nor full'],
    ['g_gate_empty', [GATES_HEADER, 'full\t\tok\t1', 'end\tcomplete'], 'line 2: gate is empty or holds a space'],
    ['g_gate_space', [GATES_HEADER, 'full\ta b\tok\t1', 'end\tcomplete'], 'line 2: gate is empty or holds a space'],
    ['g_status', [GATES_HEADER, 'full\ttest\tpass\t1', 'end\tcomplete'], 'line 2: status is not ok, FAIL, BLOCKED or SKIPPED'],
    ['g_secs', [GATES_HEADER, 'full\ttest\tok\t1', 'full\tlint\tok\t1.5', 'end\tcomplete'], 'line 3: seconds is not all digits'],
  ];
  const testCases = [
    ['t_hdr', [TESTS_HEADER.replace('failed', 'fails'), 'end'], 'first line is not file\\tstatus\\tseconds\\ttests\\tfailed'],
    ['t_end', [TESTS_HEADER, 'a.test.mjs\tpass\t1\t1\t0'], 'last line is not end'],
    ['t_fields', [TESTS_HEADER, 'a.test.mjs\tpass\t1\t1', 'end'], 'line 2: expected 5 tab-separated fields'],
    ['t_file_empty', [TESTS_HEADER, '\tpass\t1\t1\t0', 'end'], 'line 2: file is empty, absolute, holds a space or has a . or .. segment'],
    ['t_file_abs', [TESTS_HEADER, '/abs/a.test.mjs\tpass\t1\t1\t0', 'end'], 'line 2: file is empty, absolute, holds a space or has a . or .. segment'],
    ['t_file_space', [TESTS_HEADER, 'a b.test.mjs\tpass\t1\t1\t0', 'end'], 'line 2: file is empty, absolute, holds a space or has a . or .. segment'],
    ['t_file_dot', [TESTS_HEADER, './a.test.mjs\tpass\t1\t1\t0', 'end'], 'line 2: file is empty, absolute, holds a space or has a . or .. segment'],
    ['t_file_dotdot', [TESTS_HEADER, 'a/../b.test.mjs\tpass\t1\t1\t0', 'end'], 'line 2: file is empty, absolute, holds a space or has a . or .. segment'],
    ['t_status', [TESTS_HEADER, 'a.test.mjs\tskip\t1\t1\t0', 'end'], 'line 2: status is neither pass nor fail'],
    ['t_secs', [TESTS_HEADER, 'a.test.mjs\tpass\t1.\t1\t0', 'end'], 'line 2: seconds is not a decimal number'],
    ['t_secs_alpha', [TESTS_HEADER, 'a.test.mjs\tpass\tx\t1\t0', 'end'], 'line 2: seconds is not a decimal number'],
    ['t_tests', [TESTS_HEADER, 'a.test.mjs\tpass\t1\t1.0\t0', 'end'], 'line 2: tests is not all digits'],
    ['t_failed', [TESTS_HEADER, 'a.test.mjs\tpass\t1\t1\t-1', 'end'], 'line 2: failed is not all digits'],
  ];
  const verdictCases = [
    ['v_two', ['pass', 'pass'], 'expected exactly one line'],
    ['v_word', ['passed'], 'line is neither pass nor fail'],
    ['v_empty', [], 'expected exactly one line'],
  ];

  let input = '';
  for (const [lb, lines] of gateCases) input += record(lb, 'verdict', ['pass']) + record(lb, 'gates.tsv', lines);
  for (const [lb, lines] of testCases) input += validRound(lb, { focused: lines });
  for (const [lb, lines] of verdictCases) input += record(lb, 'verdict', lines) + record(lb, 'gates.tsv', GATES);
  input += validRound('u_name') + record('u_name', 'other.tsv', ['x']);
  const out = rounds(input);
  const reasons = Object.fromEntries(out.skipped.map((s) => [s.record, s.reason]));

  for (const [lb, , reason] of gateCases) {
    assert.equal(reasons[`${lb}.gates.tsv`], reason, lb);
    assert.equal(reasons[`${lb}.verdict`], 'no readable gates.tsv', lb);
  }
  for (const [lb, , reason] of testCases) {
    assert.equal(reasons[`${lb}.focused.tests.tsv`], reason, lb);
    const r = out.rounds.find((x) => x.round_id === lb);
    assert.ok(r, `${lb} is emitted`);
    assert.deepEqual(r.unreadable, ['focused.tests.tsv'], lb);
    assert.deepEqual(Object.keys(r.tests), ['full'], lb);
  }
  for (const [lb, , reason] of verdictCases) {
    assert.equal(reasons[`${lb}.verdict`], reason, lb);
    assert.equal(reasons[`${lb}.gates.tsv`], 'no readable verdict', lb);
  }
  assert.equal(reasons['u_name.other.tsv'], 'unknown record name');
  assert.deepEqual(out.rounds.find((x) => x.round_id === 'u_name').unreadable, []);

  const emitted = out.rounds.map((r) => r.round_id).sort();
  assert.deepEqual(emitted, [...testCases.map(([lb]) => lb), 'u_name'].sort());
  const sorted = [...out.skipped.map((s) => s.record)].sort();
  assert.deepEqual(out.skipped.map((s) => s.record), sorted, 'skipped is sorted by record');
});

test('a round whose every non-verdict record is unreadable is not emitted, and each is named', () => {
  const lb = 'task_round_3';
  const out = rounds(validRound(lb, { gates: [GATES_HEADER], focused: ['x'], full: [TESTS_HEADER] }));
  assert.deepEqual(out.rounds, []);
  assert.deepEqual(out.skipped, [
    { record: `${lb}.focused.tests.tsv`, reason: 'first line is not file\\tstatus\\tseconds\\ttests\\tfailed' },
    { record: `${lb}.full.tests.tsv`, reason: 'last line is not end' },
    { record: `${lb}.gates.tsv`, reason: 'last line is not end\\tcomplete or end\\tstopped' },
    { record: `${lb}.verdict`, reason: 'no readable gates.tsv' },
  ]);
});

test('an unreadable verdict is not emitted', () => {
  const out = rounds(validRound('task_round_4', { verdict: 'maybe' }));
  assert.deepEqual(out.rounds, []);
  assert.ok(out.skipped.some((s) => s.record === 'task_round_4.verdict' && s.reason === 'line is neither pass nor fail'));
});

test('a stale per-phase record is left out of the round and named in skipped only', () => {
  const gates = [GATES_HEADER, 'focused\ttypecheck\tok\t4', 'focused\ttest\tok\t9', 'end\tstopped'];
  const out = rounds(validRound('task_round_5', { gates }));
  assert.equal(out.rounds.length, 1);
  const [r] = out.rounds;
  assert.equal(r.gates.outcome, 'stopped');
  assert.deepEqual(Object.keys(r.tests), ['focused']);
  assert.deepEqual(r.unreadable, []);
  assert.deepEqual(out.skipped, [{ record: 'task_round_5.full.tests.tsv', reason: 'no full rows in gates.tsv' }]);
});

test('a valid tests record with no gates.tsv is not emitted, and is named', () => {
  const lb = 'task_round_6';
  const out = rounds(record(lb, 'verdict', ['pass']) + record(lb, 'full.tests.tsv', FULL));
  assert.deepEqual(out.rounds, []);
  assert.deepEqual(out.skipped, [
    { record: `${lb}.full.tests.tsv`, reason: 'no readable gates.tsv' },
    { record: `${lb}.verdict`, reason: 'no readable gates.tsv' },
  ]);
});

test('$known not a single array makes the call exit non-zero', () => {
  for (const text of ['{"rounds":[]}', '[] []', '']) {
    assert.throws(
      () => execFileSync('jq', args(writeKnown(text), []), { input: validRound('task_round_1'), stdio: 'pipe' }),
      (err) => typeof err.status === 'number' && err.status !== 0,
      JSON.stringify(text),
    );
  }
});

test('a round already in $known emits nothing; a different one is appended as <label>#<k + 1>', () => {
  const input = validRound('task_round_1');
  const [first] = rounds(input).rounds;
  assert.deepEqual(rounds(input, { known: [first] }), { rounds: [], skipped: [] });

  const other = { ...first, verdict: 'pass' };
  const [second] = rounds(input, { known: [other] }).rounds;
  assert.equal(second.round_id, 'task_round_1#2');
  assert.deepEqual({ ...second, round_id: first.round_id }, first);

  const [third] = rounds(input, { known: [other, { ...other, round_id: 'task_round_1#2', unreadable: ['x'] }] }).rounds;
  assert.equal(third.round_id, 'task_round_1#3');

  assert.deepEqual(rounds(input, { known: [other, { ...first, round_id: 'task_round_1#2' }] }).rounds, []);
});

test('rounds are ordered by label stem, then round number as a number, then other labels', () => {
  const input = ['zeta', 'task_round_10', 'task_round_2', 'a_round_1'].map((lb) => validRound(lb)).join('');
  assert.deepEqual(rounds(input).rounds.map((r) => r.round_id), ['a_round_1', 'task_round_2', 'task_round_10', 'zeta']);
});

test('a gate id, a file and a round id carrying a redact pair come out with its replacement', () => {
  const gates = [GATES_HEADER, 'full\tgate-SECRET\tok\t1', 'end\tcomplete'];
  const full = [TESTS_HEADER, 'SECRET/a.test.mjs\tpass\t1\t1\t0', 'end'];
  const [r] = rounds(validRound('SECRET_round_1', { gates, focused: null, full }), { redact: [['SECRET', 'X']] }).rounds;
  assert.equal(r.round_id, 'X_round_1');
  assert.equal(r.gates.rows[0].gate, 'gate-X');
  assert.equal(r.tests.full[0].file, 'X/a.test.mjs');
});

test('keys and record values are never cut', () => {
  const long = `${'a'.repeat(191)}.test.mjs`;
  assert.equal(long.length, 200);
  const shared = 'p'.repeat(170);
  const full = [
    TESTS_HEADER,
    `${long}\tpass\t1\t1\t0`,
    `${shared}/one.test.mjs\tpass\t1\t1\t0`,
    `${shared}/two.test.mjs\tpass\t1\t1\t0`,
    'end',
  ];
  const [r] = rounds(validRound('task_round_1', { focused: null, full }), { redact: [['zzz', 'y']] }).rounds;
  assert.deepEqual(r.tests.full.map((t) => t.file), [long, `${shared}/one.test.mjs`, `${shared}/two.test.mjs`]);

  const lb = `${'L'.repeat(192)}_round_1`;
  assert.equal(lb.length, 200);
  const input = validRound(lb);
  const [first] = rounds(input).rounds;
  assert.equal(first.round_id, lb);
  assert.deepEqual(rounds(input, { known: [first] }).rounds, []);
});

test('no home step is applied to a relative file path', () => {
  const focused = [TESTS_HEADER, 'src/home/a.test.ts\tpass\t1\t1\t0', 'src/home/b.test.ts\tpass\t1\t1\t0', 'end'];
  const [r] = rounds(validRound('task_round_1', { focused, full: null })).rounds;
  assert.deepEqual(r.tests.focused.map((t) => t.file), ['src/home/a.test.ts', 'src/home/b.test.ts']);
});
