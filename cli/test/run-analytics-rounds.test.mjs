/**
 * The written `run-analytics.sh`, run from the root of a fixture `init` adopted, over a lane of
 * hand-written Run gates round records.
 *
 * **The rule these tests exist to enforce: every finished round is recorded once, a running one on a
 * later call, a refused record is named and never stops the write, a re-run changes no byte, and a
 * run with no round records writes today's bytes.**
 *
 * The records follow `scripts/lib/gate-round-lib.sh` → `THE RECORDS` and
 * `lib/run-analytics.jq` → mode `rounds`. The stream is one session whose orchestrator waits on
 * `task_round_1` three times, 2 000 ms each, so the round's wait renders as `6.0s`. Which rounds are
 * new is mode `rounds`' decision and `cli/test/run-analytics-rounds-parse.test.mjs`'s subject; this
 * suite asserts what the script does with the answer.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createFixture,
  INIT_SCRIPTS_DIR,
  MAX_ARG_STRING_BYTES,
  readJson,
  runBash,
  runCli,
} from './helpers/fixture.mjs';

const BRANCH = 'feat_x';
const LABEL = 'task_round_1';
const SCRIPT = join(INIT_SCRIPTS_DIR, 'run-analytics.sh');
const WAIT = `bash scripts/run-test-suite.sh --wait ${LABEL}`;

function streamText() {
  const lines = [
    { type: 'system', subtype: 'init', session_id: 'sess-r' },
    { type: 'user', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'user', content: 'Go.' } },
  ];
  for (let i = 1; i <= 3; i += 1) {
    const at = 1 + (i - 1) * 3;
    const ts = (s) => `2026-01-01T00:00:${String(s).padStart(2, '0')}.000Z`;
    lines.push({
      type: 'assistant',
      timestamp: ts(at),
      message: { id: `m${i}`, content: [{ type: 'tool_use', id: `tu${i}`, name: 'Bash', input: { command: WAIT } }] },
    });
    lines.push({
      type: 'user',
      timestamp: ts(at + 2),
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: `tu${i}`, content: [{ type: 'text', text: 'pending' }] }],
      },
    });
  }
  lines.push({ type: 'assistant', timestamp: '2026-01-01T00:00:10.000Z', message: { id: 'm4', content: [] } });
  lines.push({ type: 'result', subtype: 'success', timestamp: '2026-01-01T00:00:11.000Z', duration_ms: 11000 });
  return lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
}

const GATES_HEADER = 'phase\tgate\tstatus\tseconds';
const TESTS_HEADER = 'file\tstatus\tseconds\ttests\tfailed';
const GATES = [GATES_HEADER, 'focused\ttest\tok\t4', 'full\ttypecheck\tok\t5', 'full\ttest\tok\t30', 'end\tcomplete'];
const FOCUSED = [TESTS_HEADER, 'test/a.test.mjs\tpass\t1.5\t3\t0', 'end'];
const FULL = [TESTS_HEADER, 'test/a.test.mjs\tpass\t1.5\t3\t0', 'test/b.test.mjs\tpass\t2.25\t4\t0', 'end'];

/** An adopted fixture with the stream written, a lane directory path, and a runner. */
async function adopted(t) {
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
  const claudeHome = await mkdtemp(join(tmpdir(), 'run-analytics-rounds-home-'));
  t.after(() => rm(claudeHome, { recursive: true, force: true }));

  const { stateDir } = readJson(join(dir, 'harness.config.json'));
  const streamRel = join(stateDir, 'autonomous_logs', `${BRANCH}.stream.jsonl`);
  mkdirSync(join(dir, stateDir, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(dir, streamRel), streamText());

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
        CLAUDE_CONFIG_DIR: claudeHome,
      }),
    doc: () => readJson(jsonPath),
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

function putFinished(f, label = LABEL) {
  f.put(label, 'verdict', ['pass']);
  f.put(label, 'gates.tsv', GATES);
  f.put(label, 'focused.tests.tsv', FOCUSED);
  f.put(label, 'full.tests.tsv', FULL);
}

test('a finished round with both phases is recorded once, and a re-run changes no byte', async (t) => {
  const f = await adopted(t);
  putFinished(f);
  await expectLine(f, `recorded 1 session(s) and 1 round(s) for ${BRANCH}`);
  const doc = f.doc();
  assert.equal(doc.schema, 2);
  assert.deepEqual(doc.rounds.map((r) => r.round_id), [LABEL]);
  assert.deepEqual(Object.keys(doc.rounds[0].tests).sort(), ['focused', 'full']);
  assert.equal(doc.rounds[0].verdict, 'pass');
  assert.deepEqual(doc.rounds[0].unreadable, []);
  const md = readFileSync(f.mdPath, 'utf8');
  assert.match(md, /^## Gate rounds$/m);
  assert.ok(md.includes(`| Wait (every run of ${LABEL}) | 6.0s |`), md);

  const before = f.bytes();
  await expectLine(f, `unchanged: no new session for ${BRANCH}`);
  const after = f.bytes();
  assert.ok(before[0].equals(after[0]) && before[1].equals(after[1]));
});

test('a running round is not recorded until a later call finds its verdict', async (t) => {
  const f = await adopted(t);
  f.put(LABEL, 'running', []);
  f.put(LABEL, 'gates.tsv', GATES.slice(0, -1));
  await expectLine(f, `recorded 1 session(s) for ${BRANCH}`);
  assert.equal(f.doc().schema, 1);
  assert.equal('rounds' in f.doc(), false);

  rmSync(join(f.lane, `${LABEL}.running`));
  putFinished(f);
  await expectLine(f, `recorded 0 session(s) and 1 round(s) for ${BRANCH}`);
  assert.deepEqual(f.doc().rounds.map((r) => r.round_id), [LABEL]);
});

test('a broken record is named and never stops the write', async (t) => {
  await t.test('a full.tests.tsv with a broken header is recorded as unreadable', async (t2) => {
    const f = await adopted(t2);
    putFinished(f);
    f.put(LABEL, 'full.tests.tsv', ['bogus', 'end']);
    const r = await expectLine(f, `recorded 1 session(s) and 1 round(s) for ${BRANCH}`);
    const [round] = f.doc().rounds;
    assert.deepEqual(round.unreadable, ['full.tests.tsv']);
    assert.deepEqual(Object.keys(round.tests), ['focused']);
    assert.match(r.stderr, new RegExp(`^run-analytics: round record skipped: ${LABEL}\\.full\\.tests\\.tsv — `, 'm'));
  });

  await t.test('with every record broken the round is not recorded and the sessions still are', async (t2) => {
    const f = await adopted(t2);
    f.put(LABEL, 'verdict', ['maybe']);
    f.put(LABEL, 'gates.tsv', ['bogus']);
    f.put(LABEL, 'focused.tests.tsv', ['bogus']);
    f.put(LABEL, 'full.tests.tsv', ['bogus']);
    const r = await expectLine(f, `recorded 1 session(s) for ${BRANCH}`);
    const doc = f.doc();
    assert.equal(doc.schema, 1);
    assert.equal('rounds' in doc, false);
    assert.deepEqual(doc.sessions.map((s) => s.session_id), ['sess-r']);
    for (const rec of ['verdict', 'gates.tsv', 'focused.tests.tsv', 'full.tests.tsv']) {
      assert.ok(r.stderr.includes(`run-analytics: round record skipped: ${LABEL}.${rec} — `), output(r));
    }
  });
});

test('a resumed label is appended as <label>#2 and the first entry is left as it was', async (t) => {
  const f = await adopted(t);
  putFinished(f);
  await expectLine(f, `recorded 1 session(s) and 1 round(s) for ${BRANCH}`);
  const first = JSON.stringify(f.doc().rounds[0]);
  f.put(LABEL, 'gates.tsv', [GATES_HEADER, 'focused\ttest\tok\t7', 'full\ttypecheck\tok\t8', 'full\ttest\tok\t40', 'end\tcomplete']);
  await expectLine(f, `recorded 0 session(s) and 1 round(s) for ${BRANCH}`);
  const { rounds } = f.doc();
  assert.deepEqual(rounds.map((r) => r.round_id), [LABEL, `${LABEL}#2`]);
  assert.equal(JSON.stringify(rounds[0]), first);
});

test('a run with no round records writes the same bytes with or without a lane of logs and verdicts', async (t) => {
  const bare = await adopted(t);
  const logs = await adopted(t);
  logs.put(LABEL, 'log', ['some output']);
  logs.put(LABEL, 'verdict', ['pass']);
  await expectLine(bare, `recorded 1 session(s) for ${BRANCH}`);
  await expectLine(logs, `recorded 1 session(s) for ${BRANCH}`);
  assert.equal(existsSync(bare.lane), false);
  const [aj, am] = bare.bytes();
  const [bj, bm] = logs.bytes();
  assert.ok(aj.equals(bj), `${aj}\n---\n${bj}`);
  assert.ok(am.equals(bm));
  const doc = bare.doc();
  assert.equal(doc.schema, 1);
  assert.equal('rounds' in doc, false);
});

test('a schema-1 document is extended to schema 2; a schema-3 one is refused and left as it is', async (t) => {
  await t.test('schema 1 extended', async (t2) => {
    const f = await adopted(t2);
    await expectLine(f, `recorded 1 session(s) for ${BRANCH}`);
    const session = JSON.stringify(f.doc().sessions[0]);
    putFinished(f);
    await expectLine(f, `recorded 0 session(s) and 1 round(s) for ${BRANCH}`);
    const doc = f.doc();
    assert.equal(doc.schema, 2);
    assert.equal(doc.sessions.length, 1);
    assert.equal(JSON.stringify(doc.sessions[0]), session);
  });

  await t.test('schema 3 refused', async (t2) => {
    const f = await adopted(t2);
    mkdirSync(join(f.jsonPath, '..'), { recursive: true });
    const text = '{"schema":3,"branch":"feat_x","sessions":[],"rounds":[]}\n';
    writeFileSync(f.jsonPath, text);
    putFinished(f);
    const r = await f.run();
    assert.equal(r.status, 1, output(r));
    assert.ok(r.stderr.includes('is not a schema-1 or schema-2 run-analytics document; left untouched'), output(r));
    assert.equal(readFileSync(f.jsonPath, 'utf8'), text);
    assert.equal(existsSync(f.mdPath), false);
  });
});

test('no machine path reaches either file', async (t) => {
  const f = await adopted(t);
  putFinished(f);
  f.put(LABEL, 'gates.tsv', [GATES_HEADER, `full\t${f.dir}/gate\tok\t3`, 'end\tcomplete']);
  await expectLine(f, `recorded 1 session(s) and 1 round(s) for ${BRANCH}`);
  assert.equal(f.doc().rounds[0].gates.rows[0].gate, '<repo_root>/gate');
  for (const p of [f.jsonPath, f.mdPath]) {
    assert.equal(readFileSync(p, 'utf8').includes(f.dir), false, p);
  }
});

test('a stale per-phase record under a resumed label is refused and named', async (t) => {
  const f = await adopted(t);
  f.put(LABEL, 'verdict', ['pass']);
  f.put(LABEL, 'gates.tsv', [GATES_HEADER, 'full\ttypecheck\tok\t5', 'full\ttest\tok\t30', 'end\tcomplete']);
  f.put(LABEL, 'full.tests.tsv', FULL);
  await expectLine(f, `recorded 1 session(s) and 1 round(s) for ${BRANCH}`);

  f.put(LABEL, 'gates.tsv', [GATES_HEADER, 'focused\ttest\tFAIL\t4', 'end\tstopped']);
  f.put(LABEL, 'focused.tests.tsv', FOCUSED);
  const r = await expectLine(f, `recorded 0 session(s) and 1 round(s) for ${BRANCH}`);
  const { rounds } = f.doc();
  assert.deepEqual(rounds.map((x) => x.round_id), [LABEL, `${LABEL}#2`]);
  assert.deepEqual(Object.keys(rounds[1].tests), ['focused']);
  assert.ok(
    r.stderr.includes(`run-analytics: round record skipped: ${LABEL}.full.tests.tsv — no full rows in gates.tsv`),
    output(r),
  );
});

test('recorded rounds past the per-argument limit still reach mode rounds, through a file', async (t) => {
  const f = await adopted(t);
  await expectLine(f, `recorded 1 session(s) for ${BRANCH}`);
  const doc = f.doc();
  doc.schema = 2;
  doc.rounds = Array.from({ length: 20 }, (_, i) => ({
    round_id: `old_round_${i + 1}`,
    verdict: 'pass',
    gates: { outcome: 'complete', rows: [{ phase: 'full', gate: 'test', status: 'ok', seconds: 30 }] },
    tests: {
      full: Array.from({ length: 150 }, (_, j) => ({
        file: `test/suite-${i}-${j}.test.mjs`,
        status: 'pass',
        seconds: 1.25,
        tests: 4,
        failed: 0,
      })),
    },
    unreadable: [],
  }));
  assert.ok(
    Buffer.byteLength(JSON.stringify(doc.rounds)) > MAX_ARG_STRING_BYTES,
    'the recorded rounds must exceed the per-argument limit',
  );
  writeFileSync(f.jsonPath, `${JSON.stringify(doc)}\n`);
  const earlier = readJson(f.jsonPath).rounds;

  putFinished(f);
  const r = await expectLine(f, `recorded 0 session(s) and 1 round(s) for ${BRANCH}`);
  assert.equal(r.stderr.includes('round records not read'), false, output(r));
  const { rounds } = f.doc();
  assert.equal(rounds.at(-1).round_id, LABEL);
  assert.equal(rounds.length, earlier.length + 1);
  assert.deepEqual(rounds.slice(0, -1), earlier);
});
