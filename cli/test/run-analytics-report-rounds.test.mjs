/**
 * The `## Gate rounds` section of `cli/templates/scripts/lib/run-analytics-report.jq`, run directly
 * with `jq` over documents each case builds.
 *
 * **The rule this suite exists to enforce: a schema-1 document renders exactly as before, and a
 * schema-2 document renders every round with only the slowest N test files.**
 *
 * Every document carries one session. Each run is one `execFileSync` with a fixed argument vector,
 * the document on stdin.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const PROGRAM = fileURLToPath(new URL('../templates/scripts/lib/run-analytics-report.jq', import.meta.url));

function run(mode, doc) {
  return execFileSync('jq', ['-r', '-f', PROGRAM, '--arg', 'mode', mode], {
    input: JSON.stringify(doc),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

const markdown = (doc) => run('markdown', doc);
const rollup = (doc) => JSON.parse(run('rollup', doc));

function failure(doc) {
  try {
    markdown(doc);
  } catch (err) {
    return String(err.stderr);
  }
  return assert.fail('jq accepted the document');
}

const WAIT_CMD = 'bash scripts/run-test-suite.sh --wait task_round_1';

function session(polling) {
  return {
    session_id: 's1',
    first_at: '2026-11-08T10:00:00.000Z',
    last_at: '2026-11-08T11:00:00.000Z',
    complete: true,
    time: { wall_ms: 3600000, active_ms: 3000000, idle_ms: 600000, idle_threshold_s: 60 },
    cost: { total_cost_usd: 1.5 },
    reliability: {},
    requests: { items: [] },
    tools: { by_tool: [], slowest: [], polling },
    subagents: [],
  };
}

const MATCHING = [{ context: 'orchestrator', command: WAIT_CMD, count: 3, total_ms: 90000 }];

function schema1(polling = MATCHING) {
  return { schema: 1, branch: 'feat_x', sessions: [session(polling)], run: {} };
}

function schema2(rounds, polling = MATCHING) {
  return { ...schema1(polling), schema: 2, rounds };
}

// Twelve files whose seconds are neither ascending nor descending, two tied at 7.
const FULL = [
  ['test/f.test.mjs', 3], ['test/a.test.mjs', 11], ['test/k.test.mjs', 0.5],
  ['test/c.test.mjs', 7], ['test/b.test.mjs', 7], ['test/h.test.mjs', 20.25],
  ['test/d.test.mjs', 1], ['test/l.test.mjs', 9], ['test/e.test.mjs', 2],
  ['test/g.test.mjs', 15], ['test/i.test.mjs', 4], ['test/j.test.mjs', 6],
].map(([file, seconds]) => ({ file, status: 'pass', seconds, tests: 3, failed: 0 }));

const GATES = {
  outcome: 'complete',
  rows: [
    { phase: 'focused', gate: 'typecheck', status: 'ok', seconds: 4 },
    { phase: 'full', gate: 'typecheck', status: 'ok', seconds: 5 },
    { phase: 'full', gate: 'test', status: 'ok', seconds: 30 },
  ],
};

function round(extra = {}) {
  return { round_id: 'task_round_1', verdict: 'pass', gates: GATES, tests: { full: FULL }, unreadable: [], ...extra };
}

function section(text, heading) {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `missing ${heading}`);
  const next = text.indexOf('\n### ', start + heading.length);
  return text.slice(start, next === -1 ? undefined : next);
}

test('a schema-1 document renders no Gate rounds, deterministically, with only the whole-run table before its session', () => {
  const first = markdown(schema1());
  assert.equal(first.includes('## Gate rounds'), false);
  assert.equal(markdown(schema1()), first);
  const head = first.slice(0, first.indexOf('## Session 1'));
  assert.deepEqual(head.split('\n').filter((l) => l.startsWith('#')), ['# Run analytics — feat_x', '## Whole run']);
});

test('a schema-2 document with no rounds renders as its schema-1 twin', () => {
  assert.equal(markdown(schema2([])), markdown(schema1()));
});

test('one round renders the slowest ten of twelve, every gate row and the label wait', () => {
  const text = markdown(schema2([round()]));
  const gr = text.indexOf('## Gate rounds');
  assert.ok(gr > text.indexOf('## Whole run') && gr < text.indexOf('## Session 1'));
  const body = section(text, '### Round task_round_1 — pass');
  assert.match(body, /\| Wait \(every run of task_round_1\) \| 1m 30s \|/);
  assert.match(body, /\| Gate rows \| 3 \(complete\) \|/);
  assert.match(body, /\| Test files — full \| 12 files, 85\.8 s summed \|/);
  for (const g of GATES.rows) {
    assert.ok(body.includes(`| ${g.phase} | ${g.gate} | ${g.status} | ${g.seconds} s |`), g.gate);
  }
  assert.match(body, /#### Slowest test files — full \(10 of 12\)/);
});

test('rows arriving unsorted show the ten largest descending, ties by file, and rollup keeps record order', () => {
  const doc = schema2([round()]);
  const body = section(markdown(doc), '### Round task_round_1 — pass');
  const files = body.split('\n').filter((l) => l.startsWith('| test/')).map((l) => l.split(' | ')[0].slice(2));
  assert.deepEqual(files, [
    'test/h.test.mjs', 'test/g.test.mjs', 'test/a.test.mjs', 'test/l.test.mjs', 'test/b.test.mjs',
    'test/c.test.mjs', 'test/j.test.mjs', 'test/i.test.mjs', 'test/f.test.mjs', 'test/e.test.mjs',
  ]);
  assert.ok(body.includes('| test/h.test.mjs | pass | 20.3 | 3 | 0 |'));
  assert.equal(body.includes('test/d.test.mjs'), false);
  assert.equal(body.includes('test/k.test.mjs'), false);
  assert.deepEqual(rollup(doc).rounds[0].tests.full, FULL);
});

test('a round with no matching polling row renders its wait as —', () => {
  const other = [{ context: 'orchestrator', command: 'bash scripts/run-test-suite.sh --wait task_round_2', count: 3, total_ms: 5000 },
    { context: 'subagent', command: WAIT_CMD, count: 3, total_ms: 5000 }];
  const body = section(markdown(schema2([round()], other)), '### Round task_round_1 — pass');
  assert.match(body, /\| Wait \(every run of task_round_1\) \| — \|/);
});

test('a later occurrence renders its own sub-section with the label wait', () => {
  const text = markdown(schema2([round(), round({ round_id: 'task_round_1#2', verdict: 'fail' })]));
  section(text, '### Round task_round_1 — pass');
  const body = section(text, '### Round task_round_1#2 — fail');
  assert.match(body, /\| Wait \(every run of task_round_1\) \| 1m 30s \|/);
});

test('an unreadable record is named', () => {
  const body = section(markdown(schema2([round({ unreadable: ['focused.tests.tsv'] })])), '### Round task_round_1 — pass');
  assert.match(body, /^Records not read: focused\.tests\.tsv$/m);
});

test('rollup on a schema-2 document keeps .rounds and computes .run as on schema 1', () => {
  const rounds = [round(), round({ round_id: 'task_round_1#2', gates: null, unreadable: ['gates.tsv'] })];
  const two = rollup(schema2(rounds));
  assert.deepEqual(two.rounds, rounds);
  assert.equal(JSON.stringify(two.rounds), JSON.stringify(rounds));
  assert.deepEqual(two.run, rollup(schema1()).run);
});

test('schema 3, a schema-1 document carrying rounds and a schema-2 one without an array are refused', () => {
  assert.match(failure({ ...schema1(), schema: 3 }), /schema 3 is not supported; expected 1 or 2/);
  assert.match(failure({ ...schema1(), rounds: [] }), /schema 1 document carries \.rounds/);
  assert.match(failure({ ...schema1(), schema: 2 }), /schema 2 document's \.rounds is not an array/);
});
