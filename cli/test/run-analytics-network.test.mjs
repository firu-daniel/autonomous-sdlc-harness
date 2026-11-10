/**
 * The written `run-analytics.sh`, run from the root of a fixture `init` adopted, over a stream of
 * network-refusal sessions and a lane of Run gates round logs.
 *
 * **The rule these tests exist to enforce: every refused call in a recorded session reaches both
 * files, every finished round log is scanned once per change, a failure on the log path never stops
 * the sessions, and no machine path reaches either file.**
 *
 * The stream is `fixtures/run-analytics-network.jsonl`, read and never edited, unless a case says
 * otherwise. The round-log lines are constructed in this file from Node's error-code names, not
 * copied from a recorded log. Which lines match, and which entries are new, is mode `gate_logs`'
 * decision and `cli/test/run-analytics-network-parse.test.mjs`'s subject; this suite asserts what the
 * script does with the answer.
 */

import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, readJson, runBash, runCli } from './helpers/fixture.mjs';

const BRANCH = 'feat_x';
const LABEL = 'task_round_1';
const SCRIPT = join(INIT_SCRIPTS_DIR, 'run-analytics.sh');
const NETWORK = fileURLToPath(new URL('./fixtures/run-analytics-network.jsonl', import.meta.url));
const TWO_SESSIONS = fileURLToPath(new URL('./fixtures/run-analytics-two-sessions.jsonl', import.meta.url));
const CONNECT = 'Error: connect ECONNREFUSED 127.0.0.1:443';

const GATES_HEADER = 'phase\tgate\tstatus\tseconds';
const TESTS_HEADER = 'file\tstatus\tseconds\ttests\tfailed';
const GATES = [GATES_HEADER, 'full\ttest\tok\t30', 'end\tcomplete'];
const FULL = [TESTS_HEADER, 'test/a.test.mjs\tpass\t1.5\t3\t0', 'end'];

/** An adopted fixture with `stream` copied in as the branch's stream, a lane path, and a runner. */
async function adopted(t, stream = NETWORK) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
      'README.md': '# fixture project\n',
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const { stateDir } = readJson(join(dir, 'harness.config.json'));
  const streamRel = join(stateDir, 'autonomous_logs', `${BRANCH}.stream.jsonl`);
  mkdirSync(join(dir, stateDir, 'autonomous_logs'), { recursive: true });
  copyFileSync(stream, join(dir, streamRel));

  const lane = join(dir, stateDir, 'test_run_logs', BRANCH);
  const outDir = join(dir, stateDir, 'run_analytics', BRANCH);
  const jsonPath = join(outDir, 'run-analytics.json');
  const mdPath = join(outDir, 'run-analytics.md');
  return {
    dir,
    lane,
    jsonPath,
    mdPath,
    put(label, rec, lines) {
      mkdirSync(lane, { recursive: true });
      writeFileSync(join(lane, `${label}.${rec}`), lines.length > 0 ? `${lines.join('\n')}\n` : '');
    },
    run: () =>
      runBash(dir, [join(dir, SCRIPT), streamRel, BRANCH], {
        RUN_ANALYTICS_SUSPEND_SOURCE: 'none',
        CLAUDE_CONFIG_DIR: join(dir, 'no-claude-home'),
      }),
    doc: () => readJson(jsonPath),
    md: () => readFileSync(mdPath, 'utf8'),
    bytes: () => [readFileSync(jsonPath), readFileSync(mdPath)],
  };
}

const output = (r) => `exit ${r.status}\n${r.stdout}\n${r.stderr}`;

async function expectLine(f, line) {
  const r = await f.run();
  assert.equal(r.status, 0, output(r));
  assert.equal(r.stdout, `${line}\n`, output(r));
  return r;
}

/** The first call over the network stream: every session in it is new. */
async function recordAll(f, rounds = 0) {
  const r = await f.run();
  assert.equal(r.status, 0, output(r));
  const n = f.doc().sessions.length;
  assert.ok(n > 0, output(r));
  const tail = rounds > 0 ? ` and ${rounds} round(s)` : '';
  assert.equal(r.stdout, `recorded ${n} session(s)${tail} for ${BRANCH}\n`, output(r));
  return r;
}

async function expectUnchanged(f) {
  const before = f.bytes();
  await expectLine(f, `unchanged: no new session for ${BRANCH}`);
  const after = f.bytes();
  assert.ok(before[0].equals(after[0]) && before[1].equals(after[1]));
}

function assertNoRoot(f) {
  for (const p of [f.jsonPath, f.mdPath]) {
    assert.equal(readFileSync(p, 'utf8').includes(f.dir), false, p);
  }
}

test('with no lane, every refusal reaches both files and a re-run changes no byte', async (t) => {
  const f = await adopted(t);
  await recordAll(f);
  const doc = f.doc();
  assert.equal(doc.schema, 1);
  assert.equal('gate_logs' in doc, false);
  assert.equal('rounds' in doc, false);
  const refusals = doc.sessions.flatMap((s) => {
    assert.ok(Array.isArray(s.network_refusals), s.session_id);
    return s.network_refusals;
  });
  assert.ok(refusals.length > 0);

  const md = f.md();
  assert.match(md, /^## Network refusals$/m);
  const lines = md.split('\n');
  for (const x of refusals) {
    assert.ok(lines.some((l) => l.startsWith('| ') && l.endsWith(` | ${x.line} |`)), `${x.line}\n${md}`);
  }
  const violations = doc.sessions.find((s) => s.session_id === 'net-n1-violations');
  assert.deepEqual(
    violations.network_refusals.map((x) => [x.host, x.port]),
    [['example.com', 443]],
  );
  assert.ok(md.split('\n').some((l) => l.includes('| example.com | 443 |')), md);
  assert.ok(md.includes('No Run gates round log was scanned.'), md);
  assertNoRoot(f);

  await expectUnchanged(f);
});

test('a stream with no refusal says so', async (t) => {
  const f = await adopted(t, TWO_SESSIONS);
  await recordAll(f);
  assert.ok(f.md().includes('No refused network call.'), f.md());
});

test('a finished round log is scanned, attributed, redacted, and recorded once', async (t) => {
  const f = await adopted(t);
  f.put(LABEL, 'log', [
    '# Subtest: test/fetch.test.mjs',
    `${CONNECT} (${f.dir}/node_modules/client/connect.js)`,
    'ok 3 - CONNECT tunnel failed is network',
  ]);
  f.put(LABEL, 'verdict', ['pass']);
  await recordAll(f);
  const doc = f.doc();
  assert.equal(doc.schema, 3);
  assert.deepEqual(doc.rounds, []);
  assert.deepEqual(doc.gate_logs, [
    {
      log_id: LABEL,
      matches: [
        {
          kind: 'connect',
          test_file: 'test/fetch.test.mjs',
          line: `${CONNECT} (<repo_root>/node_modules/client/connect.js)`,
          count: 1,
        },
      ],
    },
  ]);
  const md = f.md();
  assert.match(md, /^## Possible network attempts in gate logs \(best effort\)$/m);
  assert.ok(md.includes("- on macOS, Seatbelt's own violation records go to the system log"), md);
  assert.ok(md.split('\n').some((l) => l.startsWith(`| ${LABEL} | connect | test/fetch.test.mjs | 1 |`)), md);
  assertNoRoot(f);

  await expectUnchanged(f);
});

test('a running round log is not scanned until a later call finds its verdict', async (t) => {
  const f = await adopted(t);
  f.put(LABEL, 'running', []);
  f.put(LABEL, 'log', [CONNECT]);
  await recordAll(f);
  assert.equal('gate_logs' in f.doc(), false);
  assert.equal(f.doc().schema, 1);

  f.put(LABEL, 'verdict', ['pass']);
  await expectLine(f, `recorded 0 session(s) for ${BRANCH}`);
  const doc = f.doc();
  assert.equal(doc.schema, 3);
  assert.deepEqual(doc.gate_logs.map((e) => e.log_id), [LABEL]);
});

test('a resumed label with a changed log is appended as <label>#2 and the first entry is left as it was', async (t) => {
  const f = await adopted(t);
  f.put(LABEL, 'log', [CONNECT]);
  f.put(LABEL, 'verdict', ['pass']);
  await recordAll(f);
  const first = JSON.stringify(f.doc().gate_logs[0]);

  f.put(LABEL, 'log', [CONNECT, 'Error: getaddrinfo EAI_AGAIN registry.npmjs.org']);
  await expectLine(f, `recorded 0 session(s) for ${BRANCH}`);
  const { gate_logs: entries } = f.doc();
  assert.deepEqual(entries.map((e) => e.log_id), [LABEL, `${LABEL}#2`]);
  assert.equal(JSON.stringify(entries[0]), first);
  assert.equal(entries[1].matches.length, 2);
});

test('a symlinked log is not followed and the sessions are still written', async (t) => {
  const f = await adopted(t);
  const target = join(f.dir, 'elsewhere.log');
  writeFileSync(target, `${CONNECT}\n`);
  mkdirSync(f.lane, { recursive: true });
  symlinkSync(target, join(f.lane, `${LABEL}.log`));
  f.put(LABEL, 'verdict', ['pass']);
  await recordAll(f);
  const doc = f.doc();
  assert.equal(doc.schema, 1);
  assert.equal('gate_logs' in doc, false);
  assert.ok(doc.sessions.length > 0);
});

test('an unreadable round log is one stderr line, and the sessions are still written', async (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    t.skip('root reads a mode-000 file, so the copy cannot be made to fail');
    return;
  }
  const f = await adopted(t);
  f.put(LABEL, 'log', [CONNECT]);
  f.put(LABEL, 'verdict', ['pass']);
  chmodSync(join(f.lane, `${LABEL}.log`), 0o000);
  const r = await f.run();
  assert.equal(r.status, 0, output(r));
  assert.ok(r.stderr.includes(`run-analytics: gate logs not read: cannot copy '${LABEL}.log' into the working copy`), output(r));
  const doc = f.doc();
  assert.equal(doc.schema, 1);
  assert.equal('gate_logs' in doc, false);
  assert.ok(doc.sessions.length > 0);
  assert.equal(r.stdout, `recorded ${doc.sessions.length} session(s) for ${BRANCH}\n`, output(r));
});

test('round records and a round log together give schema 3 with both arrays', async (t) => {
  const f = await adopted(t);
  f.put(LABEL, 'verdict', ['pass']);
  f.put(LABEL, 'gates.tsv', GATES);
  f.put(LABEL, 'full.tests.tsv', FULL);
  f.put(LABEL, 'log', ['# Subtest: test/a.test.mjs', CONNECT]);
  await recordAll(f, 1);
  const doc = f.doc();
  assert.equal(doc.schema, 3);
  assert.deepEqual(doc.rounds.map((r) => r.round_id), [LABEL]);
  assert.deepEqual(doc.gate_logs.map((e) => e.log_id), [LABEL]);
  assert.equal(doc.gate_logs[0].matches[0].test_file, 'test/a.test.mjs');
});
