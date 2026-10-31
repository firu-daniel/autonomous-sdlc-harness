/**
 * The written `run-analytics.sh`'s token and tool-time figures, run from the root of a fixture `init`
 * adopted, over `fixtures/run-analytics-tokens.jsonl` and the one sub-agent transcript under
 * `fixtures/run-analytics-transcripts/`.
 *
 * **The rule these tests exist to enforce: a token figure in the record is either final or `null`,
 * never the stream's partial sub-agent usage or a main-thread total standing in for the session's.**
 * Beside it, an `Agent` dispatch's time is reported as sub-agent wall time and never as a slow tool
 * call.
 *
 * Every run passes `CLAUDE_CONFIG_DIR` naming a fresh directory under the system temp directory, so
 * no case reads the real account home; the transcript case plants the transcript under
 * `projects/-an-unrelated-slug/sess-tok/subagents/`, a slug Claude Code would not derive, so a
 * script deriving the slug instead of globbing it finds nothing.
 *
 * Hand-computed values (timestamps 2026-01-01, UTC):
 *
 * Session `sess-tok`, linked by `tool_use_result.agentId` only:
 *   - the stream's sub-agent usage is partial: sa1 out 1 then 21, sa2 out 3 (24 in all); the
 *     closing tool_result's `usage.output_tokens` 1024 and `totalTokens` 99999 are decoys.
 *   - the transcript's final values: sa1 out 342 / in 2 / read 5000 / write 300 (its earlier out 1
 *     superseded), sa2 out 500 / in 2 / read 5300 / write 0; the dispatch: out 842, in 4,
 *     read 10300, write 300.
 *   - orchestrator requests m1 + m2 + m3: in 6+4+3 = 13, out 40+10+5 = 55, read 1000+1200+1300 =
 *     3500, write 200 — equal to `result.usage`.
 *   - `modelUsage` summed: in 17+100 = 117, out 897+20 = 917, read 13800, write 500;
 *     cache_hit_ratio 13800 / (13800+500+117) = 13800 / 14417 = 0.9572.
 *   - attribution: remainder = total − orchestrator − sub-agents = 100 / 20 / 0 / 0; total input
 *     (in + read + write): orchestrator 3713, sub-agents 10604, session 14417, remainder 100.
 *   - Agent ag1 :01 → :10 = 9 000 ms; Bash tb1 :11 → :12 = 1 000 ms.
 * Session `sess-bare`, linked by a `task_started` event only, no transcript anywhere:
 *   - sub-agent tokens all null; orchestrator m4 + m5 = in 3, out 12; total out 300.
 *   - Agent ag2 :01 → :08 = 7 000 ms of a 10 000 ms wall: wall_share 0.7.
 *   - session totals from `modelUsage`: in 50, read 0, write 0, so total input 50.
 * Whole run: output_tokens 917 + 300 = 1217, token_sessions 2; input 117 + 50 = 167, total input
 * 14417 + 50 = 14467.
 *
 * Assumptions each fixture encodes that are unverifiable here, from no measured stream:
 *   - the two link carriers: `tool_use_result.agentId` on the closing tool_result (`sess-tok`) and a
 *     system `task_*` event's `task_id` + `tool_use_id` (`sess-bare`);
 *   - a transcript line carries `message.id` and `message.usage`, its last line per `message.id`
 *     final, as the task prompt states;
 *   - `result.usage` is the main thread only: the `sess-tok` numbers are built so it equals the
 *     orchestrator's requests and falls short of `modelUsage` by exactly the transcript plus a
 *     second model's share.
 *
 * Left out deliberately: the resume-share assumption — that a resumed occurrence's `modelUsage`
 * token totals are cumulative like its `costUSD` (`lib/run-analytics-report.jq` → RESUMED
 * SESSIONS). No measured stream settles it, so a fixture would encode one answer and test the code
 * against that same answer, proving nothing.
 *
 * The mutation that turns each case red, each applied to the template alone and reverted after:
 *   - A: `lib/run-analytics.jq` `transcripts` mode keeps the first usage per `message.id` —
 *     run red once on fix_run_analytics_token_accounting.
 *   - B: `lib/run-analytics.jq` `sessions` mode records sub-agent request usage from the stream
 *     again — run red once on fix_run_analytics_token_accounting.
 *   - C: `lib/run-analytics.jq` `cost` token totals read `$r.usage` instead of `modelUsage` —
 *     run red once on fix_run_analytics_token_accounting.
 *   - D: `lib/run-analytics-report.jq` drops the `— sub-agent wall time` relabel — run red once on
 *     fix_run_analytics_token_accounting; separately, `lib/run-analytics.jq` `slowest` stops
 *     excluding `Agent` — run red once on fix_run_analytics_token_accounting.
 *   - E: `lib/run-analytics-report.jq` renders the stored sub-agent tokens again — run red once on
 *     fix_run_analytics_token_accounting; separately, `session_md`'s `Cache hit ratio` row reads
 *     `$c.cache_hit_ratio` again — run red once on fix_run_analytics_token_accounting.
 *   - F: `in_total` in `lib/run-analytics-report.jq` treats a null component as 0 — run red once
 *     on fix_run_analytics_token_accounting.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, PACKAGE_ROOT, readJson, runBash, runCli } from './helpers/fixture.mjs';

const BRANCH = 'feat_x';
const SCRIPT = join(INIT_SCRIPTS_DIR, 'run-analytics.sh');
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures');
const FIXTURE_STREAM = join(FIXTURES, 'run-analytics-tokens.jsonl');
const AGENT_ID = 'a70bd67b5381e6a24';
const TRANSCRIPT = join(FIXTURES, 'run-analytics-transcripts', `agent-${AGENT_ID}.jsonl`);

/**
 * An adopted fixture with the stream copied in, run once against a fresh claude home holding the
 * transcript or nothing; resolves to the record and the Markdown.
 */
async function recordedRun(t, { transcript }) {
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
  const home = await realpath(await mkdtemp(join(tmpdir(), 'run-analytics-home-')));
  t.after(() => rm(home, { recursive: true, force: true }));
  if (transcript) {
    const subagents = join(home, 'projects', '-an-unrelated-slug', 'sess-tok', 'subagents');
    await mkdir(subagents, { recursive: true });
    await copyFile(TRANSCRIPT, join(subagents, `agent-${AGENT_ID}.jsonl`));
  }

  const { stateDir } = readJson(join(dir, 'harness.config.json'));
  const streamRel = join(stateDir, 'autonomous_logs', `${BRANCH}.stream.jsonl`);
  await mkdir(join(dir, stateDir, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(dir, streamRel), readFileSync(FIXTURE_STREAM, 'utf8'));

  const result = await runBash(dir, [join(dir, SCRIPT), streamRel, BRANCH, '--main-repo', main], {
    RUN_ANALYTICS_SUSPEND_SOURCE: 'none',
    CLAUDE_CONFIG_DIR: home,
  });
  const shown = `exit ${result.status}\n${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, shown);
  assert.equal(result.stdout, `recorded 2 session(s) for ${BRANCH}\n`, shown);

  const outDir = join(dir, stateDir, 'run_analytics', BRANCH);
  const doc = readJson(join(outDir, 'run-analytics.json'));
  const md = readFileSync(join(outDir, 'run-analytics.md'), 'utf8');
  assert.deepEqual(doc.sessions.map((s) => s.session_id), ['sess-tok', 'sess-bare']);
  return { doc, md, dir };
}

/** The Markdown of session `k` (1-based), up to the next session heading. */
function sessionMd(md, k) {
  const start = md.indexOf(`## Session ${k} `);
  assert.ok(start >= 0, `no ## Session ${k} in:\n${md}`);
  const next = md.indexOf(`## Session ${k + 1} `, start);
  return next < 0 ? md.slice(start) : md.slice(start, next);
}

/** The Markdown from `heading` to the next heading of any level. */
function section(text, heading) {
  const start = text.indexOf(`${heading}\n`);
  assert.ok(start >= 0, `no ${heading} in:\n${text}`);
  const rest = text.slice(start + heading.length + 1);
  const next = rest.search(/\n#{2,4} /);
  return next < 0 ? rest : rest.slice(0, next);
}

const TOKENS = ['output_tokens', 'input_tokens', 'cache_read_tokens', 'cache_write_tokens'];
const pick = (o) => Object.fromEntries(TOKENS.map((k) => [k, o[k]]));

test('token and tool-time figures over a transcript-backed and a transcript-less session', async (t) => {
  const { doc, md } = await recordedRun(t, { transcript: true });
  const [tok, bare] = doc.sessions;

  await t.test('A: a partial stream with a final transcript records the transcript\'s figures', () => {
    const [agent] = tok.subagents;
    assert.equal(tok.subagents.length, 1);
    assert.equal(agent.agent_id, AGENT_ID);
    assert.equal(agent.token_source, 'transcript');
    assert.deepEqual(pick(agent), {
      output_tokens: 842,
      input_tokens: 4,
      cache_read_tokens: 10300,
      cache_write_tokens: 300,
    });
    const byId = Object.fromEntries(tok.requests.items.map((r) => [r.message_id, r]));
    assert.deepEqual(pick(byId.sa1), { output_tokens: 342, input_tokens: 2, cache_read_tokens: 5000, cache_write_tokens: 300 });
    assert.deepEqual(pick(byId.sa2), { output_tokens: 500, input_tokens: 2, cache_read_tokens: 5300, cache_write_tokens: 0 });
  });

  await t.test('B: a dispatch with no transcript records null tokens, and the Markdown says so', () => {
    const [agent] = bare.subagents;
    assert.equal(agent.agent_id, 'b0000000000000001');
    assert.equal(agent.token_source, null);
    assert.deepEqual(pick(agent), { output_tokens: null, input_tokens: null, cache_read_tokens: null, cache_write_tokens: null });
    const sb1 = bare.requests.items.find((r) => r.message_id === 'sb1');
    assert.deepEqual(pick(sb1), { output_tokens: null, input_tokens: null, cache_read_tokens: null, cache_write_tokens: null });

    const s2 = sessionMd(md, 2);
    const subagents = section(s2, '### Sub-agents');
    assert.ok(
      subagents.includes('| code-reviewer | Review the code | 7.0s | 1 | — | — | — | — | — | 0.7 |'),
      subagents,
    );
    assert.ok(subagents.includes('— in a token column: no transcript was found for this dispatch, '), subagents);
    const attribution = section(s2, '#### Token attribution');
    assert.ok(attribution.includes('| orchestrator | 3 | 3 | 12 | 0 | 0 |'), attribution);
    assert.ok(attribution.includes('| sub-agents | — | — | — | — | — |'), attribution);
    assert.ok(attribution.includes('| remainder | — | — | — | — | — |'), attribution);
    assert.ok(
      attribution.includes('1 of 1 sub-agent dispatches have no transcript; their tokens are in the session total only.'),
      attribution,
    );
  });

  await t.test('C: when usage and modelUsage disagree, the session total is modelUsage\'s', () => {
    const { cost } = tok;
    assert.equal(cost.token_source, 'model_usage');
    assert.deepEqual(pick(cost), { output_tokens: 917, input_tokens: 117, cache_read_tokens: 13800, cache_write_tokens: 500 });
    assert.equal(cost.cache_hit_ratio, 0.9572);
    assert.deepEqual(cost.by_model, { 'claude-haiku-test': 0.1, 'claude-opus-test': 0.9 });

    const s1 = sessionMd(md, 1);
    const attribution = section(s1, '#### Token attribution');
    assert.ok(
      attribution.includes(
        '| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |',
      ),
      attribution,
    );
    assert.ok(attribution.includes('| orchestrator | 13 | 3713 | 55 | 3500 | 200 |'), attribution);
    assert.ok(attribution.includes('| sub-agents | 4 | 10604 | 842 | 10300 | 300 |'), attribution);
    assert.ok(attribution.includes('| remainder | 100 | 100 | 20 | 0 | 0 |'), attribution);
    const subagents = section(s1, '### Sub-agents');
    assert.ok(subagents.includes('| task-plan-writer | Write the plan | 9.0s | 2 | 842 | 4 | 10604 | 10300 | 300 |'), subagents);
    assert.ok(s1.includes('| Input tokens (uncached) | 117 |\n| Total input tokens (incl. cache) | 14417 |\n'), s1);
    assert.ok(!/^\| Input tokens \|/m.test(md), md);
    assert.ok(md.includes('| Input tokens (uncached) | 167 |\n| Total input tokens (incl. cache) | 14467 |\n'), md);
    assert.ok(s1.includes('| Token source | result.modelUsage |'), s1);
    assert.ok(s1.includes('| Cache hit ratio | 0.9572 |'), s1);

    assert.equal(doc.run.output_tokens, 1217);
    assert.equal(doc.run.token_sessions, 2);
  });

  await t.test('D: an Agent call is sub-agent wall time, never a slowest call', () => {
    assert.deepEqual(
      tok.tools.by_tool.find((r) => r.tool === 'Agent'),
      { tool: 'Agent', context: 'orchestrator', count: 1, total_ms: 9000, max_ms: 9000 },
    );
    assert.deepEqual(tok.tools.slowest.map((i) => i.tool), ['Bash']);

    const s1 = sessionMd(md, 1);
    const toolTime = section(s1, '### Tool time');
    assert.ok(toolTime.includes('| Agent — sub-agent wall time | orchestrator | 1 | 9.0s | 9.0s |'), toolTime);
    assert.ok(toolTime.includes('`Agent` / `Task` rows are sub-agent wall time: '), toolTime);
    const slowest = section(s1, '#### Slowest calls (sub-agent dispatches excluded)');
    assert.ok(slowest.includes('| Bash | orchestrator |'), slowest);
    assert.ok(!/^\| Agent \|/m.test(slowest), slowest);
  });
});

test('E: a record from before token accounting shows no sub-agent tokens, and says why', async (t) => {
  const { doc, dir } = await recordedRun(t, { transcript: true });
  const legacy = structuredClone(doc.sessions[0]);
  delete legacy.cost.token_source;
  for (const s of legacy.subagents) delete s.token_source;
  Object.assign(legacy.subagents[0], { output_tokens: 16, input_tokens: 4, cache_read_tokens: 0, cache_write_tokens: 0 });
  const document = { schema: 1, branch: BRANCH, sessions: [legacy], run: {} };

  const md = execFileSync(
    'jq',
    ['-r', '-f', join(dir, INIT_SCRIPTS_DIR, 'lib', 'run-analytics-report.jq'), '--arg', 'mode', 'markdown'],
    { input: JSON.stringify(document), encoding: 'utf8' },
  );
  const subagents = section(sessionMd(md, 1), '### Sub-agents');
  assert.ok(subagents.includes('| task-plan-writer | Write the plan | 9.0s | 2 | — | — | — | — |'), subagents);
  assert.ok(subagents.includes('this session was recorded before token accounting'), subagents);
  assert.ok(!subagents.includes('no transcript was found'), subagents);
  assert.ok(sessionMd(md, 1).includes('| Cache hit ratio | — |'), sessionMd(md, 1));
  assert.ok(sessionMd(md, 1).includes('| Total input tokens (incl. cache) | — |'), sessionMd(md, 1));
  assert.ok(md.includes('| Total input tokens (incl. cache) | — |'), md);
});

test('F: a total input with any null component renders —, never a partial sum', async (t) => {
  const { doc, dir } = await recordedRun(t, { transcript: true });
  const [tok, bare] = structuredClone(doc.sessions);
  bare.cost.cache_write_tokens = null;
  const document = { schema: 1, branch: BRANCH, sessions: [tok, bare], run: {} };

  const md = execFileSync(
    'jq',
    ['-r', '-f', join(dir, INIT_SCRIPTS_DIR, 'lib', 'run-analytics-report.jq'), '--arg', 'mode', 'markdown'],
    { input: JSON.stringify(document), encoding: 'utf8' },
  );
  const s2 = sessionMd(md, 2);
  assert.ok(s2.includes('| Input tokens (uncached) | 50 |\n| Total input tokens (incl. cache) | — |\n'), s2);
  assert.ok(section(s2, '#### Token attribution').includes('| remainder | — | — | — | — | — |'), s2);
  // The whole-run total counts only the session whose total is known, and says so.
  assert.ok(md.includes('| Total input tokens (incl. cache) | 14417 (1 of 2 sessions) |'), md);
});

test('B: with an empty claude home, the transcript-backed dispatch records null tokens too', async (t) => {
  const { doc } = await recordedRun(t, { transcript: false });
  const [tok, bare] = doc.sessions;
  for (const s of [tok, bare]) {
    const [agent] = s.subagents;
    assert.equal(agent.token_source, null, s.session_id);
    assert.deepEqual(
      pick(agent),
      { output_tokens: null, input_tokens: null, cache_read_tokens: null, cache_write_tokens: null },
      s.session_id,
    );
  }
  assert.equal(tok.subagents[0].agent_id, AGENT_ID);
});
