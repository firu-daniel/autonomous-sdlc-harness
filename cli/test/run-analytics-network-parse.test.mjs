/**
 * Network refusals in `cli/templates/scripts/lib/run-analytics.jq`: mode `sessions`' `network_refusals`
 * and mode `gate_logs`, run directly with `jq`.
 *
 * **The rule this suite exists to enforce: every refusal shape a recorded run measured is listed once
 * per call with its host and port where the line names them, nothing that merely quotes one is, and a
 * gate log's matches are kept whole and recorded once per change.**
 *
 * `fixtures/run-analytics-network.jsonl` holds one session per shape. Each refusal text is copied from
 * the `docs/sandbox-verification.md` row it names; the event envelopes around it are constructed:
 *
 * - `net-n1-macos`: N1, `curl: (56) CONNECT tunnel failed, response 403`.
 * - `net-n1-runner`: N1 (runner), `curl: (7) CONNECT tunnel failed, response 403`, on a command longer
 *   than the 160-character display cut.
 * - `net-n1-violations`: N1, 2026-10-14, the row's two strings, one per line.
 * - `net-n5`: N5, the `allowed_domains cannot widen network access` refusal.
 * - `net-cs3`: CS3, `sandbox proxy: github-firu:22: 403 host is not on the allow list`.
 * - `net-p1`: P1, `Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication`.
 * - `net-subagent`: N1's macOS text, refused inside an `Agent` dispatch.
 * - Not to be listed: `net-n4` (N4's `curl: (7) Failed to connect …` error), `net-n3` (N3's returned
 *   body), `net-read-quote` (a `Read` result quoting N1 mid-line), `net-clean`.
 *
 * The gate-log lines are constructed from the error-code names and N1's string, not recorded logs.
 *
 * The mirror case is a source guard: `scripts/lib/sandbox-probe/judge.sh` is shell and the program is
 * jq, and nothing shares the refusal strings between them at run time.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

const PROGRAM = fileURLToPath(new URL('../templates/scripts/lib/run-analytics.jq', import.meta.url));
const FIXTURE = fileURLToPath(new URL('./fixtures/run-analytics-network.jsonl', import.meta.url));
const JUDGE = fileURLToPath(new URL('../../scripts/lib/sandbox-probe/judge.sh', import.meta.url));

let dir;
let fileCount = 0;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'run-analytics-network-'));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

function writeTemp(name, text) {
  fileCount += 1;
  const file = join(dir, `${fileCount}-${name}`);
  writeFileSync(file, text);
  return file;
}

function sessions(program = PROGRAM) {
  const out = execFileSync('jq', [
    '-n', '-R', '-c', '-S', '-f', program,
    '--arg', 'mode', 'sessions',
    '--argjson', 'idle_threshold_s', '30',
    '--argjson', 'known', '[]',
    '--argjson', 'redact', '[]',
    '--argjson', 'suspend', '[]',
    '--arg', 'suspend_source', 'none',
  ], { input: readFileSync(FIXTURE), encoding: 'utf8' });
  return Object.fromEntries(JSON.parse(out).map((r) => [r.session_id, r]));
}

function gateArgs(knownFile, redact) {
  return [
    '-n', '-R', '-c', '-S', '-f', PROGRAM,
    '--arg', 'mode', 'gate_logs',
    '--argjson', 'idle_threshold_s', '1',
    '--slurpfile', 'known', knownFile,
    '--argjson', 'redact', JSON.stringify(redact),
    '--argjson', 'suspend', '[]',
    '--arg', 'suspend_source', 'none',
  ];
}

function gateLogs(input, { known = [], redact = [] } = {}) {
  const out = execFileSync('jq', gateArgs(writeTemp('known.json', JSON.stringify(known)), redact), {
    input, encoding: 'utf8',
  });
  return JSON.parse(out);
}

// The caller prints the marker, the log, then one newline; the log ends in a newline unless empty.
function log(label, lines) {
  const file = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  return `${JSON.stringify({ run_analytics_gate_log: label })}\n${file}\n`;
}

const LONG_COMMAND = "curl -sS --max-time 5 -o /dev/null -w '%{http_code}' https://example.com/a/long/path/segment/that/keeps/going/so/the/command/runs/past/the/display/cut/of/one/hundred/and/sixty/characters";

function entry(fields) {
  return { context: 'orchestrator', tool: 'Bash', host: null, port: null, ...fields };
}

test('each refusal shape yields exactly one entry with its host, port, first carrying line and command', () => {
  const s = sessions();
  assert.ok(LONG_COMMAND.length > 160);
  const expected = {
    'net-n1-macos': entry({
      command: 'curl -sS https://example.com/', started_at: '2026-01-01T00:00:01.000Z',
      line: 'curl: (56) CONNECT tunnel failed, response 403',
    }),
    'net-n1-runner': entry({
      command: LONG_COMMAND, started_at: '2026-01-01T00:01:01.000Z',
      line: 'curl: (7) CONNECT tunnel failed, response 403',
    }),
    'net-n1-violations': entry({
      command: 'curl -sS https://example.com/', started_at: '2026-01-01T00:02:01.000Z',
      host: 'example.com', port: 443, line: 'CONNECT tunnel failed, response 403',
    }),
    'net-n5': entry({
      command: 'curl -sS --max-time 5 https://example.com/', started_at: '2026-01-01T00:03:01.000Z',
      line: '<tool_use_error>allowed_domains cannot widen network access in this session: the configured sandbox allowlist is the whole allowlist here (a managed-domains-only or strictAllowlist policy, or a confined evaluation run). Remove allowed_domains and use a host the configured allowlist already covers.</tool_use_error>',
    }),
    'net-cs3': entry({
      command: 'git fetch origin', started_at: '2026-01-01T00:04:01.000Z',
      host: 'github-firu', port: 22, line: 'sandbox proxy: github-firu:22: 403 host is not on the allow list',
    }),
    'net-p1': entry({
      command: 'bash ~/main/scripts/push-branch.sh ~/wt', started_at: '2026-01-01T00:05:01.000Z',
      line: 'Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication',
    }),
    'net-subagent': entry({
      context: 'layer-implementer', command: 'curl -sS https://example.com/',
      started_at: '2026-01-01T00:06:02.000Z', line: 'curl: (56) CONNECT tunnel failed, response 403',
    }),
  };
  for (const [id, want] of Object.entries(expected)) {
    assert.ok(s[id], `${id} is emitted`);
    assert.deepEqual(s[id].network_refusals, [want], id);
  }
});

test('a result that only quotes or does not carry a refusal string, and a clean session, list nothing', () => {
  const s = sessions();
  for (const id of ['net-n4', 'net-n3', 'net-read-quote', 'net-clean']) {
    assert.ok(s[id], `${id} is emitted`);
    assert.deepEqual(s[id].network_refusals, [], id);
  }
});

test('the scan changes no other key of a session record', () => {
  const source = readFileSync(PROGRAM, 'utf8');
  const variant = source
    .replace('refusal_fields($r) as $nf', 'null as $nf')
    .replace(',\n   network_refusals: .netref}', '}');
  assert.notEqual(variant.length, source.length);
  assert.ok(!variant.includes('network_refusals: .netref'), 'the finalize key was removed');
  assert.ok(!variant.includes('refusal_fields($r) as $nf'), 'the scan was removed');
  const without = sessions(writeTemp('variant.jq', variant));
  const withKey = sessions();
  assert.deepEqual(Object.keys(withKey), Object.keys(without));
  for (const [id, record] of Object.entries(withKey)) {
    assert.equal('network_refusals' in without[id], false, id);
    for (const key of ['tools', 'requests', 'cost', 'reliability']) {
      assert.deepEqual(record[key], without[id][key], `${id}.${key}`);
    }
    const { network_refusals: _dropped, ...rest } = record;
    assert.deepEqual(rest, without[id], id);
    for (const item of record.tools.items) {
      assert.deepEqual(Object.keys(item).sort(),
        ['context', 'duration_ms', 'is_error', 'permission_denied', 'result_bytes', 'started_at', 'tool'], id);
    }
  }
});

test('every judge.sh network-layer string and SP_N5_CANNOT_WIDEN is in network_refusal_strings', () => {
  const judge = readFileSync(JUDGE, 'utf8');
  const arm = judge.split('\n').find((l) => l.includes('sp__line_with "$text" "<sandbox_violations>"'));
  assert.ok(arm, 'judge.sh no longer carries the network arm this guard reads');
  const armStrings = [...arm.slice(arm.indexOf('"$text"') + '"$text"'.length).matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  assert.ok(armStrings.length >= 4, `read ${JSON.stringify(armStrings)} from the network arm`);
  const n5 = judge.match(/^SP_N5_CANNOT_WIDEN="([^"]*)"$/m);
  assert.ok(n5, 'judge.sh no longer sets SP_N5_CANNOT_WIDEN');

  const source = readFileSync(PROGRAM, 'utf8');
  const start = source.indexOf('def n5_refusal_string:');
  const stop = source.indexOf('def gate_proxy_strings:');
  assert.ok(start >= 0 && stop > start, 'the program no longer defines the string table this guard reads');
  const block = source.slice(start, stop);
  for (const s of [...armStrings, n5[1]]) {
    assert.ok(block.includes(JSON.stringify(s)), `${JSON.stringify(s)} is missing from network_refusal_strings`);
  }
  const table = block.slice(block.indexOf('def network_refusal_strings:'));
  const tableStrings = [...table.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(tableStrings, armStrings, 'the table keeps the network arm order');
  assert.match(table, /n5_refusal_string\]/);
});

const CONNECT = 'Error: connect ECONNREFUSED 127.0.0.1:443';
const PROXY = 'curl: (56) CONNECT tunnel failed, response 403';

test('a connect error after a subtest line is attributed to that test file', () => {
  const out = gateLogs(`ignored before the first marker\n${log('task_round_1', ['# Subtest: test/fetch.test.mjs', CONNECT])}`);
  assert.deepEqual(out, {
    gate_logs: [{
      log_id: 'task_round_1',
      matches: [{ kind: 'connect', test_file: 'test/fetch.test.mjs', line: CONNECT, count: 1 }],
    }],
  });
});

test('a proxy string is kind proxy; a test-name line quoting one is never matched', () => {
  const [g] = gateLogs(log('task_round_1', [PROXY, 'ok 2 - a CONNECT tunnel failed result is judged network'])).gate_logs;
  assert.deepEqual(g.matches, [{ kind: 'proxy', test_file: null, line: PROXY, count: 1 }]);
  const [h] = gateLogs(log('task_round_1', ['ok 2 - a CONNECT tunnel failed result is judged network'])).gate_logs;
  assert.deepEqual(h.matches, []);
});

test('the same line twice is one match with count 2', () => {
  const [g] = gateLogs(log('task_round_1', [CONNECT, CONNECT])).gate_logs;
  assert.deepEqual(g.matches, [{ kind: 'connect', test_file: null, line: CONNECT, count: 2 }]);
});

test('a line carrying a redaction pair is recorded with its replacement', () => {
  const [g] = gateLogs(log('task_round_1', [`${CONNECT} at /work/secret-proj/src/net.mjs:4`]), {
    redact: [['/work/secret-proj', '<repo>']],
  }).gate_logs;
  assert.equal(g.matches[0].line, `${CONNECT} at <repo>/src/net.mjs:4`);
});

test('two relative test files under a home/ segment stay two matches', () => {
  const [g] = gateLogs(log('task_round_1', [
    '# Subtest: src/home/a.test.ts', CONNECT, '# Subtest: src/home/b.test.ts', CONNECT,
  ])).gate_logs;
  assert.deepEqual(g.matches, [
    { kind: 'connect', test_file: 'src/home/a.test.ts', line: CONNECT, count: 1 },
    { kind: 'connect', test_file: 'src/home/b.test.ts', line: CONNECT, count: 1 },
  ]);
});

test('an absolute file:// test file outside the redaction pairs takes the anchored home step', () => {
  const [g] = gateLogs(log('task_round_1', [`${CONNECT} (file:///Users/someone/proj/test/x.test.mjs:3:9)`]), {
    redact: [['/nowhere', '<x>']],
  }).gate_logs;
  assert.equal(g.matches[0].test_file, '~/proj/test/x.test.mjs');
});

test('a log with no match is emitted with matches []', () => {
  assert.deepEqual(gateLogs(log('task_round_1', ['all good'])), {
    gate_logs: [{ log_id: 'task_round_1', matches: [] }],
  });
  assert.deepEqual(gateLogs('no marker\n'), { gate_logs: [] });
});

test('a recorded log emits nothing; a changed one is appended as <label>#<k + 1>', () => {
  const input = log('task_round_1', [CONNECT]) + log('task_round_2', ['all good']);
  const first = gateLogs(input).gate_logs;
  assert.deepEqual(first.map((g) => g.log_id), ['task_round_1', 'task_round_2']);
  assert.deepEqual(gateLogs(input, { known: first }), { gate_logs: [] });

  const changed = gateLogs(log('task_round_1', [CONNECT, PROXY]), { known: first }).gate_logs;
  assert.equal(changed.length, 1);
  assert.equal(changed[0].log_id, 'task_round_1#2');
  assert.equal(changed[0].matches.length, 2);
});

test('labels are ordered as mode rounds orders them', () => {
  const input = ['zeta', 'task_round_10', 'task_round_2', 'a_round_1'].map((lb) => log(lb, [])).join('');
  assert.deepEqual(gateLogs(input).gate_logs.map((g) => g.log_id), ['a_round_1', 'task_round_2', 'task_round_10', 'zeta']);
});

test('$known not a single array makes the call exit non-zero', () => {
  for (const text of ['{"gate_logs":[]}', '[] []', '']) {
    assert.throws(
      () => execFileSync('jq', gateArgs(writeTemp('known.json', text), []), { input: log('task_round_1', [CONNECT]), stdio: 'pipe' }),
      (err) => typeof err.status === 'number' && err.status !== 0,
      JSON.stringify(text),
    );
  }
});
