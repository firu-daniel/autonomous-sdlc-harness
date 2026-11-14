/**
 * The written `run-analytics.sh` over sub-agent dispatches that run at the same time, run from the root
 * of a fixture `init` adopted, over `fixtures/run-analytics-overlap.jsonl` and the four transcripts
 * under `fixtures/run-analytics-overlap-transcripts/`.
 *
 * **The rule these tests exist to enforce: two dispatches that overlap are each timed and
 * token-attributed on their own, and the session's sub-agent wall time is their union, never their
 * sum.**
 *
 * Every run passes `CLAUDE_CONFIG_DIR` naming a fresh directory under the system temp directory, so
 * no case reads the real account home; each transcript is planted under
 * `projects/-an-unrelated-slug/<session_id>/subagents/`.
 *
 * Hand-computed values (timestamps 2026-01-01, UTC):
 *
 * Session `sess-ovl` — one assistant event at 00:10 sends Agent agA (plan-reviewer) and agB
 * (conventions-reviewer); their sub-agent events interleave (oa1 :12, ob1 :15, oa2 :20, ob2 :25,
 * ob3 :45); agA's tool_result arrives alone at :40 carrying `tool_use_result.agentId`
 * a0000000000000a1, agB's alone at 01:00 carrying b0000000000000b2.
 *   - agA :10 → :40 = 30 000 ms; agB :10 → 01:00 = 50 000 ms; sum 80 000 ms.
 *   - wall 00:00 → 01:05 = 65 000 ms; wall_share agA 30 000 / 65 000 = 0.4615, agB 50 000 / 65 000
 *     = 0.7692; together 1.2307, past 1.
 *   - subagent_wall_ms = |[10 000, 40 000] ∪ [10 000, 60 000]| = 50 000 ms, rendered `50.0s`.
 *   - tokens from the transcripts: agA out 100+200 = 300, in 1+2 = 3, read 1000+2000 = 3000,
 *     write 10+20 = 30; agB out 1000+2000+4000 = 7000, in 10+20+40 = 70, read 10000+20000+40000 =
 *     70000, write 100+200+400 = 700.
 * Session `sess-ovl-one` — one assistant event at 01:00:01 sends agC (code-reviewer) and agD
 * (test-reviewer), each linked only by a `task_started` event (c0000000000000c3, d0000000000000d4);
 * both tool_results arrive in one user event at :20, which carries no `tool_use_result`; then agE
 * (fix-writer, e0000000000000e5, no transcript) runs alone :21 → :30.
 *   - agC = agD = :01 → :20 = 19 000 ms; agE 9 000 ms; sum 47 000 ms, longest 19 000 ms.
 *   - wall 01:00:00 → 01:00:32 = 32 000 ms.
 *   - subagent_wall_ms = |[1 000, 20 000] ∪ [21 000, 30 000]| = 19 000 + 9 000 = 28 000 ms, rendered
 *     `28.0s` — below the sum and above the longest, so neither stands in for the union.
 *   - tokens: agC out 50, in 5, read 500, write 0; agD out 70, in 7, read 700, write 7; agE null.
 *
 * Assumptions the fixtures encode that no measured stream settles:
 *   - two `Agent` calls sent together arrive as two `tool_use` blocks in one assistant event, and
 *     each sub-agent's own events carry its dispatch's id as `parent_tool_use_id`, interleaved in
 *     arrival order;
 *   - two concurrent dispatches' results arrive either in their own user events, each with its own
 *     `tool_use_result.agentId` (`sess-ovl`), or together in one user event with the link carried by
 *     `task_*` events alone (`sess-ovl-one`).
 *
 * The mutation that turns each case red, each applied to the template alone and reverted after:
 *   - A: `lib/run-analytics.jq` → `step`'s `task_*` arm stops setting `agent_id` — run red once on
 *     feat_parallel_plan_reviews.
 *   - B: `lib/run-analytics.jq` → `attach` gives every dispatch the first transcript's totals
 *     (`$tr[.agent_id]` read as `$tr[$tr | keys[0]]`) — run red once on feat_parallel_plan_reviews.
 *   - C: `lib/run-analytics.jq` → `finalize` sums the dispatch intervals instead of taking their
 *     union — run red once on feat_parallel_plan_reviews.
 *   - D: `lib/run-analytics-report.jq` → `session_md` renders `$t.wall_ms` in the `Sub-agents
 *     (union)` cell — run red once on feat_parallel_plan_reviews.
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
const FIXTURE_STREAM = join(FIXTURES, 'run-analytics-overlap.jsonl');
const TRANSCRIPTS = join(FIXTURES, 'run-analytics-overlap-transcripts');
const AGENTS = {
  a0000000000000a1: 'sess-ovl',
  b0000000000000b2: 'sess-ovl',
  c0000000000000c3: 'sess-ovl-one',
  d0000000000000d4: 'sess-ovl-one',
};

/** An adopted fixture with the stream copied in and every transcript planted; resolves to the record and the Markdown. */
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
  const home = await realpath(await mkdtemp(join(tmpdir(), 'run-analytics-home-')));
  t.after(() => rm(home, { recursive: true, force: true }));
  for (const [id, session] of Object.entries(AGENTS)) {
    const subagents = join(home, 'projects', '-an-unrelated-slug', session, 'subagents');
    await mkdir(subagents, { recursive: true });
    await copyFile(join(TRANSCRIPTS, `agent-${id}.jsonl`), join(subagents, `agent-${id}.jsonl`));
  }

  const { stateDir } = readJson(join(dir, 'devscene.config.json'));
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
  assert.deepEqual(doc.sessions.map((s) => s.session_id), ['sess-ovl', 'sess-ovl-one']);
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

/** The one data row's cell under `column` in a session's `### Time` table. */
function timeCell(sessionText, column) {
  const rows = section(sessionText, '### Time')
    .split('\n')
    .filter((l) => l.startsWith('| '))
    .map((l) => l.slice(2, -2).split(' | '));
  assert.equal(rows.length, 2, `expected a header and one row:\n${sessionText}`);
  const at = rows[0].indexOf(column);
  assert.ok(at >= 0, `no ${column} column in ${rows[0].join(', ')}`);
  return rows[1][at];
}

const TOKENS = ['output_tokens', 'input_tokens', 'cache_read_tokens', 'cache_write_tokens'];
const pick = (o) => Object.fromEntries(TOKENS.map((k) => [k, o[k]]));
const NULL_TOKENS = { output_tokens: null, input_tokens: null, cache_read_tokens: null, cache_write_tokens: null };
const SUB_AGENT_NOTE =
  "`Agent` / `Task` rows are sub-agent wall time: each row sums every dispatch's own wall time, which `### Sub-agents` breaks down per dispatch, so dispatches sent together count once each and the sum can exceed the time the orchestrator waited, which is `### Time`'s `Sub-agents (union)`. They are not time spent in a tool.";
const WALL_SHARE_NOTE =
  "Wall share is each dispatch's own duration over the session's wall, so overlapping dispatches' wall shares can sum past 1.";

test('overlapping dispatches are timed and attributed on their own, with a union wall time', async (t) => {
  const { doc, md } = await recordedRun(t);
  const [ovl, one] = doc.sessions;

  await t.test('A: each overlapping dispatch keeps its own duration, agent id and wall share', () => {
    assert.deepEqual(
      ovl.subagents.map((s) => [s.type, s.duration_ms, s.agent_id, s.wall_share]),
      [
        ['plan-reviewer', 30000, 'a0000000000000a1', 0.4615],
        ['conventions-reviewer', 50000, 'b0000000000000b2', 0.7692],
      ],
    );
    assert.ok(ovl.subagents[0].wall_share + ovl.subagents[1].wall_share > 1);
    assert.deepEqual(
      one.subagents.map((s) => [s.type, s.duration_ms, s.agent_id]),
      [
        ['code-reviewer', 19000, 'c0000000000000c3'],
        ['test-reviewer', 19000, 'd0000000000000d4'],
        ['fix-writer', 9000, 'e0000000000000e5'],
      ],
    );
  });

  await t.test("B: each dispatch's tokens are its own transcript's, never the other's", () => {
    const [a, b] = ovl.subagents;
    assert.deepEqual(pick(a), { output_tokens: 300, input_tokens: 3, cache_read_tokens: 3000, cache_write_tokens: 30 });
    assert.deepEqual(pick(b), { output_tokens: 7000, input_tokens: 70, cache_read_tokens: 70000, cache_write_tokens: 700 });
    assert.equal(a.token_source, 'transcript');
    assert.equal(b.token_source, 'transcript');
    const byId = Object.fromEntries(ovl.requests.items.map((r) => [r.message_id, r]));
    assert.deepEqual(
      ['oa1', 'ob1', 'oa2', 'ob2', 'ob3'].map((id) => [id, byId[id].context, byId[id].output_tokens]),
      [
        ['oa1', 'plan-reviewer', 100],
        ['ob1', 'conventions-reviewer', 1000],
        ['oa2', 'plan-reviewer', 200],
        ['ob2', 'conventions-reviewer', 2000],
        ['ob3', 'conventions-reviewer', 4000],
      ],
    );

    const [c, d, e] = one.subagents;
    assert.deepEqual(pick(c), { output_tokens: 50, input_tokens: 5, cache_read_tokens: 500, cache_write_tokens: 0 });
    assert.deepEqual(pick(d), { output_tokens: 70, input_tokens: 7, cache_read_tokens: 700, cache_write_tokens: 7 });
    assert.equal(e.token_source, null);
    assert.deepEqual(pick(e), NULL_TOKENS);
  });

  await t.test('C: the session sub-agent wall time is the union of the dispatches, never their sum', () => {
    const sum = (s) => s.subagents.reduce((n, x) => n + x.duration_ms, 0);
    assert.equal(ovl.time.subagent_wall_ms, 50000);
    assert.ok(ovl.time.subagent_wall_ms < sum(ovl), `${ovl.time.subagent_wall_ms} vs ${sum(ovl)}`);
    assert.equal(ovl.time.wall_ms, 65000);
    assert.ok(ovl.time.wall_ms >= ovl.time.subagent_wall_ms);

    assert.equal(one.time.subagent_wall_ms, 28000);
    assert.ok(one.time.subagent_wall_ms < sum(one), `${one.time.subagent_wall_ms} vs ${sum(one)}`);
    assert.ok(one.time.subagent_wall_ms > Math.max(...one.subagents.map((s) => s.duration_ms)));
    assert.equal(one.time.wall_ms, 32000);
    assert.ok(one.time.wall_ms >= one.time.subagent_wall_ms);
  });

  await t.test('D: the Markdown renders the union and says the Agent rows are summed', () => {
    const s1 = sessionMd(md, 1);
    const s2 = sessionMd(md, 2);
    assert.equal(timeCell(s1, 'Sub-agents (union)'), '50.0s');
    assert.equal(timeCell(s2, 'Sub-agents (union)'), '28.0s');

    const toolTime = section(s1, '### Tool time');
    assert.ok(toolTime.includes('| Agent — sub-agent wall time | orchestrator | 2 | 1m 20s | 50.0s |'), toolTime);
    assert.ok(toolTime.includes(SUB_AGENT_NOTE), toolTime);
    assert.ok(!md.includes('how long the orchestrator was blocked on each dispatch'), md);
    assert.ok(section(s1, '### Sub-agents').includes(WALL_SHARE_NOTE), s1);
  });
});

test('D: a record written before subagent_wall_ms renders — in the union cell', async (t) => {
  const { doc, dir } = await recordedRun(t);
  const old = structuredClone(doc.sessions[0]);
  delete old.time.subagent_wall_ms;
  const document = { schema: 1, branch: BRANCH, sessions: [old], run: {} };

  const md = execFileSync(
    'jq',
    ['-r', '-f', join(dir, INIT_SCRIPTS_DIR, 'lib', 'run-analytics-report.jq'), '--arg', 'mode', 'markdown'],
    { input: JSON.stringify(document), encoding: 'utf8' },
  );
  assert.equal(timeCell(sessionMd(md, 1), 'Sub-agents (union)'), '—');
});
