/**
 * The written `run-analytics.sh`, run by hand from the root of a fixture `init` adopted, over the
 * two-session stream `fixtures/run-analytics-two-sessions.jsonl`.
 *
 * **The rule these tests exist to enforce: the script's record is right, idempotent per
 * `session_id`, and machine-path-free.** Right means each metric equals the value computed by hand
 * from the fixture's timestamps below; idempotent means a re-run over the same stream changes no
 * byte and a later session never rewrites an earlier one; machine-path-free means neither output
 * file carries the fixture root, the stand-in main checkout, `/Users/` or `/home/`.
 *
 * Left out deliberately: the real `pmset` / `journalctl` readers, which depend on the host — every
 * run sets `RUN_ANALYTICS_SUSPEND_SOURCE` — and the timing over a 10 MB stream, a hand-run step
 * (`harness-runs/lessons.md` → *Evidence and measurement*). The watcher calling the script after a
 * session is `cli/test/watcher-run-analytics.test.mjs`'s subject, not this one's.
 *
 * The fixture file holds no machine path: `@FIXTURE_ROOT@` becomes the fixture root and
 * `@MAIN_REPO@` a second throwaway directory standing in for the main checkout. Every run passes
 * that directory as `--main-repo`, as the watcher does; without it `hr_main_repo` would answer the
 * fixture itself and the `<main_repo>` redaction would go untested.
 *
 * Hand-computed values (threshold 120 s; timestamps are 2026-01-01, UTC):
 *
 * Session `sess-one`, 00:00:00 → 00:20:00, wall 1 200 000 ms, result `duration_ms` 600 000:
 *   - host_suspended_ms = 1 200 000 − 600 000 = 600 000.
 *   - m1 at 00:05:00, 300 000 ms after the prompt at 00:00:00 — the only request over threshold,
 *     and idle gap 1 (start 00:00:00, 300 000 ms, in_flight_request, orchestrator).
 *   - x.sh three times: tool_use 00:05:00/:03/:07 → tool_result :02/:06/:11 = 2 000 + 3 000 +
 *     4 000 = 9 000 ms; each result text `ok — done` is 9 characters and 11 UTF-8 bytes.
 *   - an untimestamped api_retry (529), then m4 at 00:05:15, 4 000 ms after :11, after_retry.
 *   - y.sh through the main checkout three times, 1 000 ms each.
 *   - m7 at 00:05:22, then nothing until the result at 00:20:00: idle gap 2 (878 000 ms, unknown).
 *   - idle 300 000 + 878 000 = 1 178 000; active 1 200 000 − 1 178 000 = 22 000.
 *   - latencies 300 000, 1 000, 1 000, 4 000, 1 000, 1 000, 2 000.
 * Session `sess-two`, 01:00:00 → 01:00:20, wall 20 000 ms, `duration_ms` 20 000:
 *   - Agent `task-plan-writer` tool_use at 01:00:02, tool_result at 01:00:12: 10 000 ms,
 *     wall_share 10 000 / 20 000 = 0.5.
 *   - its two requests sa1 (01:00:05, 2 000 ms after its prompt at :03) and sa2 (01:00:09,
 *     4 000 ms after sa1).
 */

import assert from 'node:assert/strict';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, PACKAGE_ROOT, readJson, runBash, runCli } from './helpers/fixture.mjs';

const BRANCH = 'feat_x';
const SCRIPT = join(INIT_SCRIPTS_DIR, 'run-analytics.sh');
const FIXTURE_STREAM = join(PACKAGE_ROOT, 'test', 'fixtures', 'run-analytics-two-sessions.jsonl');

const THIRD_SESSION = [
  '{"type":"system","subtype":"init","session_id":"sess-three"}',
  '{"type":"user","timestamp":"2026-01-01T02:00:00.000Z","message":{"role":"user","content":"Again."}}',
  '{"type":"assistant","timestamp":"2026-01-01T02:00:01.000Z","message":{"id":"m10","content":[]}}',
  '{"type":"result","subtype":"success","timestamp":"2026-01-01T02:00:02.000Z","duration_ms":2000}',
].join('\n') + '\n';

/** An adopted fixture with the stream copied in, and a runner for the script over it. */
async function adopted(t, { dropLastLine = false } = {}) {
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

  const mainLogical = await mkdtemp(join(tmpdir(), 'run-analytics-main-'));
  const main = await realpath(mainLogical);
  t.after(() => rm(main, { recursive: true, force: true }));

  const { stateDir } = readJson(join(dir, 'harness.config.json'));
  const streamRel = join(stateDir, 'autonomous_logs', `${BRANCH}.stream.jsonl`);
  const streamPath = join(dir, streamRel);
  await mkdir(join(dir, stateDir, 'autonomous_logs'), { recursive: true });
  let text = readFileSync(FIXTURE_STREAM, 'utf8')
    .split('@FIXTURE_ROOT@').join(dir)
    .split('@MAIN_REPO@').join(main);
  if (dropLastLine) text = text.replace(/[^\n]*\n$/, '');
  writeFileSync(streamPath, text);

  const outDir = join(dir, stateDir, 'run_analytics', BRANCH);
  const jsonPath = join(outDir, 'run-analytics.json');
  const mdPath = join(outDir, 'run-analytics.md');
  return {
    dir,
    main,
    mainLogical,
    streamPath,
    jsonPath,
    mdPath,
    run: (env = {}) =>
      runBash(dir, [join(dir, SCRIPT), streamRel, BRANCH, '--main-repo', main], {
        RUN_ANALYTICS_SUSPEND_SOURCE: 'none',
        ...env,
      }),
    doc: () => readJson(jsonPath),
  };
}

const output = (result) => `exit ${result.status}\n${result.stdout}\n${result.stderr}`;

async function recorded(f, n, env) {
  const result = await f.run(env);
  assert.equal(result.status, 0, output(result));
  assert.equal(result.stdout, `recorded ${n} session(s) for ${BRANCH}\n`, output(result));
  return result;
}

test('metrics: each value equals the one computed by hand from the fixture', async (t) => {
  const f = await adopted(t);
  await recorded(f, 2);
  const doc = f.doc();
  assert.equal(doc.schema, 1);
  assert.equal(doc.branch, BRANCH);
  assert.deepEqual(doc.sessions.map((s) => s.session_id), ['sess-one', 'sess-two']);
  const [one, two] = doc.sessions;

  await t.test('a stalled request: per-request latency, over threshold, an in-flight idle gap', () => {
    assert.deepEqual(
      one.requests.items.map((r) => r.latency_ms),
      [300000, 1000, 1000, 4000, 1000, 1000, 2000],
    );
    assert.equal(one.requests.items[0].context, 'orchestrator');
    assert.equal(one.requests.overall.count, 7);
    assert.equal(one.requests.overall.over_threshold, 1);
    assert.equal(one.requests.overall.max_ms, 300000);
    assert.deepEqual(one.time.idle_gaps[0], {
      start_at: '2026-01-01T00:00:00.000Z',
      length_ms: 300000,
      context: 'orchestrator',
      class: 'in_flight_request',
    });
    assert.equal(one.time.idle_threshold_s, 120);
  });

  await t.test('an api_retry: the next request in its context is after_retry, 529 counted', () => {
    assert.deepEqual(
      one.requests.items.map((r) => r.after_retry),
      [false, false, false, true, false, false, false],
    );
    assert.equal(one.reliability.api_retries, 1);
    assert.deepEqual(one.reliability.api_retry_errors, { 529: 1 });
  });

  await t.test('a sub-agent dispatch: type, description, duration, its two requests, wall share', () => {
    assert.equal(two.subagents.length, 1);
    const [agent] = two.subagents;
    assert.equal(agent.type, 'task-plan-writer');
    assert.equal(agent.description, 'Write the plan');
    assert.equal(agent.duration_ms, 10000);
    assert.equal(agent.requests, 2);
    assert.equal(agent.output_tokens, 16);
    assert.equal(agent.wall_share, 0.5);
    const inAgent = two.requests.items.filter((r) => r.context === 'task-plan-writer');
    assert.deepEqual(inAgent.map((r) => r.latency_ms), [2000, 4000]);
    assert.equal(two.requests.by_context['task-plan-writer'].count, 2);
  });

  await t.test('a tool call: duration, UTF-8 result bytes, one polling entry of three', () => {
    const first = one.tools.items[0];
    assert.equal(first.tool, 'Bash');
    assert.equal(first.context, 'orchestrator');
    assert.equal(first.duration_ms, 2000);
    assert.equal('ok — done'.length, 9);
    assert.equal(first.result_bytes, 11);
    assert.deepEqual(one.tools.items.slice(0, 3).map((i) => i.duration_ms), [2000, 3000, 4000]);
    const polled = one.tools.polling.find((p) => p.command === '<repo_root>/scripts/x.sh');
    assert.deepEqual(polled, {
      context: 'orchestrator',
      command: '<repo_root>/scripts/x.sh',
      count: 3,
      total_ms: 9000,
    });
  });

  await t.test('a result shorter than the wall span: the difference is host-suspended time', () => {
    assert.equal(one.time.wall_ms, 1200000);
    assert.equal(one.time.duration_ms, 600000);
    assert.equal(one.time.host_suspended_ms, 600000);
    assert.equal(one.time.idle_ms, 1178000);
    assert.equal(one.time.active_ms, 22000);
    assert.deepEqual(one.time.idle_gaps[1], {
      start_at: '2026-01-01T00:05:22.000Z',
      length_ms: 878000,
      context: 'orchestrator',
      class: 'unknown',
    });
    assert.equal(two.time.host_suspended_ms, 0);
    assert.deepEqual(two.time.idle_gaps, []);
  });

  await t.test('the roll-up sums both sessions', () => {
    assert.equal(doc.run.sessions, 2);
    assert.equal(doc.run.wall_ms, 1220000);
    assert.equal(doc.run.host_suspended_ms, 600000);
    assert.equal(doc.run.idle_ms, 1178000);
    assert.equal(doc.run.active_ms, 42000);
    assert.equal(doc.run.total_cost_usd, 1.75);
    assert.equal(doc.run.slowest_subagent.type, 'task-plan-writer');
    assert.equal(doc.run.slowest_subagent.session, 2);
  });
});

test('suspend overlay: an interval overlapping the stalled gap re-classes it host_asleep', async (t) => {
  await t.test('a suspend file', async (t) => {
    const f = await adopted(t);
    const intervals = join(f.main, 'suspend.txt');
    writeFileSync(intervals, '2026-01-01T00:01:00Z 2026-01-01T00:02:00Z\n');
    await recorded(f, 2, { RUN_ANALYTICS_SUSPEND_SOURCE: intervals });
    const [one] = f.doc().sessions;
    assert.equal(one.time.suspend_source, 'file');
    assert.deepEqual(one.time.idle_gaps.map((g) => [g.class, g.context]), [
      ['host_asleep', 'orchestrator'],
      ['unknown', 'orchestrator'],
    ]);
  });

  await t.test('none', async (t) => {
    const f = await adopted(t);
    await recorded(f, 2, { RUN_ANALYTICS_SUSPEND_SOURCE: 'none' });
    const [one] = f.doc().sessions;
    assert.equal(one.time.suspend_source, 'none');
    assert.equal(one.time.idle_gaps[0].class, 'in_flight_request');
  });
});

test('an incomplete last session waits; a later session records it with complete: false', async (t) => {
  const f = await adopted(t, { dropLastLine: true });
  await recorded(f, 1);
  assert.deepEqual(f.doc().sessions.map((s) => s.session_id), ['sess-one']);

  appendFileSync(f.streamPath, THIRD_SESSION);
  await recorded(f, 2);
  const sessions = f.doc().sessions;
  assert.deepEqual(sessions.map((s) => [s.session_id, s.complete]), [
    ['sess-one', true],
    ['sess-two', false],
    ['sess-three', true],
  ]);
  assert.equal(sessions[1].cost.total_cost_usd, null);
});

test('idempotence: a re-run changes no byte, and a later session leaves earlier ones alone', async (t) => {
  const f = await adopted(t);
  await recorded(f, 2);
  const json = readFileSync(f.jsonPath);
  const md = readFileSync(f.mdPath);

  const again = await f.run();
  assert.equal(again.status, 0, output(again));
  assert.equal(again.stdout, `unchanged: no new session for ${BRANCH}\n`);
  assert.ok(readFileSync(f.jsonPath).equals(json), 'run-analytics.json changed on a re-run');
  assert.ok(readFileSync(f.mdPath).equals(md), 'run-analytics.md changed on a re-run');

  const before = f.doc().sessions;
  appendFileSync(f.streamPath, THIRD_SESSION);
  await recorded(f, 1);
  const after = f.doc().sessions;
  assert.equal(after.length, 3);
  assert.deepEqual(after[0], before[0]);
  assert.deepEqual(after[1], before[1]);

  const text = readFileSync(f.mdPath, 'utf8');
  const whole = text.indexOf('## Whole run');
  const s1 = text.indexOf('## Session 1');
  const s2 = text.indexOf('## Session 2');
  assert.ok(whole >= 0 && whole < s1 && s1 < s2, `section order wrong:\n${text}`);
});

test('refusal: a corrupt run-analytics.json is an exit 1 that leaves its bytes as they were', async (t) => {
  const f = await adopted(t);
  await recorded(f, 2);
  writeFileSync(f.jsonPath, '{"schema":1,"sessions":[');
  const corrupt = readFileSync(f.jsonPath);
  const md = readFileSync(f.mdPath);

  const result = await f.run();
  assert.equal(result.status, 1, output(result));
  assert.equal(result.stdout, '');
  const lines = result.stderr.split('\n').filter((line) => line !== '');
  assert.equal(lines.length, 1, result.stderr);
  assert.match(lines[0], /^run-analytics: /);
  assert.ok(readFileSync(f.jsonPath).equals(corrupt), 'the corrupt record was rewritten');
  assert.ok(readFileSync(f.mdPath).equals(md), 'run-analytics.md was rewritten');
});

test('redaction: neither output carries a machine path, and both checkouts become placeholders', async (t) => {
  const f = await adopted(t);
  await recorded(f, 2);
  const outputs = { 'run-analytics.json': readFileSync(f.jsonPath, 'utf8'), 'run-analytics.md': readFileSync(f.mdPath, 'utf8') };
  assert.notEqual(f.main, f.dir);
  for (const [name, text] of Object.entries(outputs)) {
    for (const needle of [f.dir, f.main, f.mainLogical, '/Users/', '/home/']) {
      assert.ok(!text.includes(needle), `${name} contains ${needle}`);
    }
    assert.ok(text.includes('<repo_root>/scripts/x.sh'), `${name} lacks the polled command`);
    assert.ok(text.includes('<main_repo>/scripts/y.sh'), `${name} lacks the main-checkout command`);
  }
  const [one] = f.doc().sessions;
  assert.deepEqual(one.tools.polling.find((p) => p.command === '<main_repo>/scripts/y.sh'), {
    context: 'orchestrator',
    command: '<main_repo>/scripts/y.sh',
    count: 3,
    total_ms: 3000,
  });
});
