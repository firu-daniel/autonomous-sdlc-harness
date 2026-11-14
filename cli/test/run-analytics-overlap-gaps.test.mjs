/**
 * The written `run-analytics.sh`'s idle-gap classification while two dispatches sent together are
 * running, run from the root of a fixture `init` adopted, over
 * `fixtures/run-analytics-overlap-gaps.jsonl`.
 *
 * **The rule these tests exist to enforce: while a dispatch the orchestrator opened is still
 * running, an idle gap belongs to the context still working, never to the orchestrator.**
 *
 * Every run passes `RUN_ANALYTICS_SUSPEND_SOURCE=none` and `CLAUDE_CONFIG_DIR` naming a fresh
 * directory under the system temp directory, so no case reads the host's sleep log or the real
 * account home. `@FIXTURE_ROOT@` becomes the fixture root and `@MAIN_REPO@` a throwaway main checkout.
 *
 * Hand-computed values (threshold 120 s; timestamps 2026-01-01, UTC):
 *
 * Session `sess-gap-tool` — the orchestrator's assistant event at 00:00:05 sends agA
 * (architecture-reviewer) and agB (task-plan-reviewer); both prompts at 00:00:06; agB opens a `Bash`
 * call at 00:00:30; agA's result arrives alone at 00:00:40; the `Bash` result at 00:04:40; agB's
 * result at 00:05:00; the orchestrator's next assistant event at 00:08:00.
 *   - gap 1: 00:00:40 → 00:04:40 = 240 000 ms, `tool_running`, task-plan-reviewer — agB is still
 *     open, so the orchestrator is not awaiting; the latest-started open call is agB's `Bash`.
 *   - gap 2: 00:05:00 → 00:08:00 = 180 000 ms, `in_flight_request`, orchestrator — the control:
 *     once the set is in, the serial rule holds.
 * Session `sess-gap-request` — the same opening an hour later (01:00:05 / 01:00:06), but agD's
 * (task-plan-reviewer) last event before agC's result at 01:00:40 is its own `Read` result at
 * 01:00:35; nothing until agD's assistant event at 01:04:40.
 *   - gap 1: 01:00:40 → 01:04:40 = 240 000 ms, `in_flight_request`, task-plan-reviewer.
 *
 * The mutation that turns the two overlap cases red and leaves the control green, applied to the
 * template alone and reverted after: `lib/run-analytics.jq` → `on_user` sets
 * `.ctx[$ck].awaiting = true` unconditionally again — run red once on feat_parallel_plan_reviews.
 *
 * **Verified to hold under overlap — no case owed.** Each attribution below was checked against two
 * dispatches in one assistant event:
 *   - a request's `latency_ms` is measured from the last timestamped event of the same context, so
 *     the orchestrator's next request counts from the set's last result, and a sub-agent's first
 *     request counts from its own dispatch's `start_t`;
 *   - `idle_ms` / `active_ms`: a gap is consecutive events of any context, so overlapping work is
 *     never counted idle twice;
 *   - `classify_gap`'s `tool_running` branch takes the latest-started open call, which during
 *     overlap is the working sub-agent's tool, never the older `Agent` call;
 *   - `requests.by_context` and `#### Token attribution` are keyed per context and per dispatch, not
 *     per time slice;
 *   - `run-analytics-report.jq`'s cross-session roll-up sums: sessions are sequential.
 * The dispatch-level fields — `subagents[].duration_ms`, `wall_share`, the `Agent` / `Task` note,
 * `agent_id` — are `cli/test/run-analytics-overlap.test.mjs`'s.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, PACKAGE_ROOT, readJson, runBash, runCli } from './helpers/fixture.mjs';

const BRANCH = 'feat_x';
const SCRIPT = join(INIT_SCRIPTS_DIR, 'run-analytics.sh');
const FIXTURE_STREAM = join(PACKAGE_ROOT, 'test', 'fixtures', 'run-analytics-overlap-gaps.jsonl');

/** An adopted fixture with the stream copied in and the script run once; resolves to the record. */
async function recordedRun(t) {
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

  const main = await realpath(await mkdtemp(join(tmpdir(), 'run-analytics-main-')));
  t.after(() => rm(main, { recursive: true, force: true }));
  const home = await mkdtemp(join(tmpdir(), 'run-analytics-home-'));
  t.after(() => rm(home, { recursive: true, force: true }));

  const { stateDir } = readJson(join(dir, 'devscene.config.json'));
  const streamRel = join(stateDir, 'autonomous_logs', `${BRANCH}.stream.jsonl`);
  await mkdir(join(dir, stateDir, 'autonomous_logs'), { recursive: true });
  writeFileSync(
    join(dir, streamRel),
    readFileSync(FIXTURE_STREAM, 'utf8').split('@FIXTURE_ROOT@').join(dir).split('@MAIN_REPO@').join(main),
  );

  const result = await runBash(dir, [join(dir, SCRIPT), streamRel, BRANCH, '--main-repo', main], {
    RUN_ANALYTICS_SUSPEND_SOURCE: 'none',
    CLAUDE_CONFIG_DIR: home,
  });
  const shown = `exit ${result.status}\n${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, shown);
  assert.equal(result.stdout, `recorded 2 session(s) for ${BRANCH}\n`, shown);

  const doc = readJson(join(dir, stateDir, 'run_analytics', BRANCH, 'run-analytics.json'));
  assert.deepEqual(doc.sessions.map((s) => s.session_id), ['sess-gap-tool', 'sess-gap-request']);
  return doc;
}

const gaps = (session) => session.time.idle_gaps.map((g) => [g.start_at, g.length_ms, g.class, g.context]);

test('an idle gap during overlapping dispatches belongs to the context still working', async (t) => {
  const doc = await recordedRun(t);
  const [tool, request] = doc.sessions;

  await t.test('a sub-agent running a tool owns the gap, and the orchestrator owns it once the set is in', () => {
    assert.deepEqual(gaps(tool), [
      ['2026-01-01T00:00:40.000Z', 240000, 'tool_running', 'task-plan-reviewer'],
      ['2026-01-01T00:05:00.000Z', 180000, 'in_flight_request', 'orchestrator'],
    ]);
  });

  await t.test('a sub-agent with its own request in flight owns the gap', () => {
    assert.deepEqual(gaps(request), [['2026-01-01T01:00:40.000Z', 240000, 'in_flight_request', 'task-plan-reviewer']]);
  });
});
