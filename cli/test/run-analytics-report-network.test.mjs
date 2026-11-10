/**
 * `.run.network` and the two network sections of `cli/templates/scripts/lib/run-analytics-report.jq`,
 * run directly with `jq` over documents each case builds.
 *
 * **The rule this suite exists to enforce: every refusal recorded in a scanned session is rendered
 * and rolled up, an unscanned session is never reported clean, and the gate-log section always
 * states its blind spots.**
 *
 * Every session is built with `network_refusals` except where a case removes the key. Each run is
 * one `execFileSync` with a fixed argument vector, the document on stdin.
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

function session(id, refusals = []) {
  return {
    session_id: id,
    first_at: '2026-11-08T10:00:00.000Z',
    last_at: '2026-11-08T11:00:00.000Z',
    complete: true,
    time: { wall_ms: 3600000, active_ms: 3000000, idle_ms: 600000, idle_threshold_s: 60 },
    cost: { total_cost_usd: 1.5 },
    reliability: {},
    requests: { items: [] },
    tools: { by_tool: [], slowest: [], polling: [] },
    subagents: [],
    network_refusals: refusals,
  };
}

function unscanned(id) {
  const { network_refusals: _drop, ...rest } = session(id);
  return rest;
}

const REFUSALS = [
  {
    context: 'orchestrator', tool: 'Bash', command: 'curl https://example.org', started_at: '2026-11-08T10:10:00.000Z',
    host: 'example.org', port: 443, line: 'curl: (56) CONNECT tunnel failed, response 403',
  },
  {
    context: 'subagent', tool: 'WebFetch', command: null, started_at: '2026-11-08T10:20:00.000Z',
    host: null, port: null, line: 'Operation not permitted',
  },
];

function schema1(sessions) {
  return { schema: 1, branch: 'feat_x', sessions, run: {} };
}

function schema3(sessions, gateLogs, rounds = []) {
  return { schema: 3, branch: 'feat_x', sessions, run: {}, rounds, gate_logs: gateLogs };
}

function section(text, heading) {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `missing ${heading}`);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next === -1 ? undefined : next);
}

const REFUSALS_H = '## Network refusals';
const GATE_H = '## Possible network attempts in gate logs (best effort)';

test('two refusals in the second session are rolled up and rendered, null cells as —', () => {
  const doc = schema1([session('s1'), session('s2', REFUSALS)]);
  const net = rollup(doc).run.network;
  assert.equal(net.sessions_scanned, 2);
  assert.equal(net.sessions_not_scanned, 0);
  assert.deepEqual(net.refusals, REFUSALS.map(({ started_at: _s, ...r }) => ({ session: 2, session_id: 's2', ...r })));
  const body = section(markdown(doc), REFUSALS_H);
  assert.ok(body.includes('2 of 2 sessions scanned.\n'));
  assert.ok(body.includes('| Session | Context | Tool | Command | Host | Port | Refusal line |'));
  assert.ok(body.includes('| 2 | orchestrator | Bash | curl https://example.org | example.org | 443 | curl: (56) CONNECT tunnel failed, response 403 |'));
  assert.ok(body.includes('| 2 | subagent | WebFetch | — | — | — | Operation not permitted |'));
});

test('no refusal says so', () => {
  const body = section(markdown(schema1([session('s1'), session('s2')])), REFUSALS_H);
  assert.ok(body.includes('2 of 2 sessions scanned.\n'));
  assert.ok(body.includes('No refused network call.'));
  assert.equal(body.includes('| Session |'), false);
});

test('a session recorded before the scan is counted as not scanned, never as clean', () => {
  const doc = schema1([unscanned('s1'), session('s2')]);
  assert.equal(rollup(doc).run.network.sessions_not_scanned, 1);
  assert.equal(rollup(doc).run.network.sessions_scanned, 1);
  assert.ok(section(markdown(doc), REFUSALS_H).includes('1 of 2 sessions scanned. 1 recorded before refusals were scanned.'));

  const none = section(markdown(schema1([unscanned('s1'), unscanned('s2')])), REFUSALS_H);
  assert.ok(none.includes('No session was scanned for refusals.'));
  assert.equal(none.includes('sessions scanned.'), false);
  assert.equal(none.includes('No refused network call.'), false);
});

test('gate-log matches render with the blind spots, and the sections sit in order', () => {
  const logs = [
    { log_id: 'task_round_1', matches: [{ kind: 'connect', test_file: 'test/net.test.mjs', line: 'Error: connect ECONNREFUSED 127.0.0.1:443', count: 3 }] },
    { log_id: 'task_round_1#2', matches: [] },
  ];
  const round = { round_id: 'task_round_1', verdict: 'pass', gates: null, tests: {}, unreadable: [] };
  const doc = schema3([session('s1')], logs, [round]);
  const rolled = rollup(doc);
  assert.deepEqual(rolled.gate_logs, logs);
  assert.deepEqual(rolled.rounds, [round]);
  const net = rolled.run.network;
  assert.equal(net.gate_logs_scanned, 2);
  assert.deepEqual(net.gate_log_matches, [{ log_id: 'task_round_1', ...logs[0].matches[0] }]);

  const text = markdown(doc);
  const order = ['## Whole run', REFUSALS_H, GATE_H, '## Gate rounds', '## Session 1'].map((h) => text.indexOf(h));
  assert.ok(order.every((p) => p !== -1), JSON.stringify(order));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));

  const body = section(text, GATE_H);
  for (const blind of [
    '- a test that catches the error and passes leaves no trace;',
    '- a plain connect error cannot be told apart from a host that is unreachable for another reason;',
    "- on macOS, Seatbelt's own violation records go to the system log, not to the test output;",
    '- a test whose name or output quotes one of these strings is listed too.',
  ]) {
    assert.ok(body.includes(blind), blind);
  }
  assert.ok(body.includes('| Log | Kind | Test file | Count | Line |'));
  const rows = body.split('\n').filter((l) => l.startsWith('| task_round'));
  assert.deepEqual(rows, ['| task_round_1 | connect | test/net.test.mjs | 3 | Error: connect ECONNREFUSED 127.0.0.1:443 |']);

  const clean = section(markdown(schema3([session('s1')], [logs[1]])), GATE_H);
  assert.ok(clean.includes('No possible network attempt in 1 round logs.'));

  const one = section(markdown(schema1([session('s1')])), GATE_H);
  assert.ok(one.includes('No Run gates round log was scanned.'));
  assert.ok(one.includes('- a test that catches the error and passes leaves no trace;'));
});

test('a refusal line over 300 characters is whole in the Markdown and in .run', () => {
  const line = `Operation not permitted ${'x'.repeat(400)} end`;
  const doc = schema1([session('s1', [{ ...REFUSALS[1], line }])]);
  assert.equal(rollup(doc).run.network.refusals[0].line, line);
  assert.ok(section(markdown(doc), REFUSALS_H).includes(`| ${line} |`));
});

test('a cell carrying a pipe and a newline renders escaped on one line', () => {
  const doc = schema1([session('s1', [{ ...REFUSALS[0], command: 'curl a | tee b\nnext' }])]);
  const rows = section(markdown(doc), REFUSALS_H).split('\n').filter((l) => l.startsWith('| 1 |'));
  assert.equal(rows.length, 1);
  assert.ok(rows[0].includes('| curl a \\| tee b next |'), rows[0]);
});

test('two renders of one document are byte-identical', () => {
  const doc = schema3([session('s1', REFUSALS), unscanned('s2')],
    [{ log_id: 'task_round_1', matches: [{ kind: 'proxy', test_file: null, line: 'HTTP 403', count: 1 }] }]);
  assert.equal(markdown(doc), markdown(doc));
  assert.ok(section(markdown(doc), GATE_H).includes('| task_round_1 | proxy | — | 1 | HTTP 403 |'));
});

test('check_doc refuses gate_logs outside schema 3 and a schema-3 document missing either array', () => {
  assert.match(failure({ ...schema1([session('s1')]), gate_logs: [] }), /a schema 1 document carries \.gate_logs; only schema 3 may/);
  assert.match(failure({ ...schema1([session('s1')]), schema: 2, rounds: [], gate_logs: [] }),
    /a schema 2 document carries \.gate_logs; only schema 3 may/);
  const { rounds: _r, ...noRounds } = schema3([session('s1')], []);
  assert.match(failure(noRounds), /schema 3 document's \.rounds is not an array/);
  const { gate_logs: _g, ...noLogs } = schema3([session('s1')], []);
  assert.match(failure(noLogs), /schema 3 document's \.gate_logs is not an array/);
});
