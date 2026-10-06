/**
 * `remote-run.sh report progress <branch>`, the phase-progress poster built on the forge surface.
 *
 * **The rule these tests exist to enforce: one progress comment per run or round, on the pull request
 * only, created once and edited only when a phase changes.** A fresh ledger posts it, an unchanged one
 * writes nothing, a moved phase edits that comment's id in place, and a round gets its own comment
 * whose marker carries `round=<n>`. `execution.progressComments` `false` calls no `gh` at all; no
 * recognised pull request, a docs-engine ledger and a stopped branch each post nothing. `forge_marker`'s
 * four-argument output is unchanged by its fifth field. A `report stopped` rewrites that comment's
 * `in progress` line, the task run's or a round's, to `stopped` in one `PATCH` and nothing else.
 *
 * The fixture is `remote-report.test.mjs`'s shape — `init`, `execution.target` `github-actions`,
 * `forge` `github`, `feat_x` pushed to the fixture's bare `origin` with its task prompt and ledger —
 * plus a ledger written into the fixture checkout itself, which `--repo` points at. `gh` is a stub
 * reached through `HARNESS_GH_CLI`: it logs each argument vector with the content of any `body=@<path>`,
 * answers `pr list` from `STUB_PRS`, `run list` from `STUB_RUN_LIST`, and the paginated comment listing
 * from `STUB_COMMENTS`, one JSON object per line as `--jq` prints them. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const BOT = 'github-actions[bot]';
const PR_12 = JSON.stringify([{ number: 12, isCrossRepository: false, isDraft: true }]);

const STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_PRS || '[]');
} else if (args[0] === 'run' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_RUN_LIST || '[]');
} else if (args[0] === 'api' && args[1] === '--paginate' && /\\/issues\\/[0-9]+\\/comments$/.test(args[2] ?? '')) {
  for (const c of JSON.parse(process.env.STUB_COMMENTS || '[]')) process.stdout.write(JSON.stringify(c) + '\\n');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

const TASK_IDS = ['P1', 'P2', 'P3', 'A', 'A1.5g', 'A1.5f', 'A2g', 'A2f', 'Bg', 'Bm', 'C', 'C2g', 'C2m', 'C2f', 'E', 'G', 'D'];
const REVIEW_IDS = ['R1', 'R2', 'R3', 'R4', 'RG', 'R5'];

/** A ledger in the template's shape: every id in `done` is `[x]`, every other listed id `[ ]`. */
function ledger(header, ids, done = []) {
  const lines = [header, '', '## Run mode', '- skipped: none', ''];
  for (const id of ids) lines.push(`- [${done.includes(id) ? 'x' : ' '}] ${`${id}.`.padEnd(8)} label for ${id}`);
  return `${lines.join('\n')}\n`;
}
const TASK_HEADER = '# Flow progress — feat_x   (engine: task)';
const reviewHeader = (n) => `# Flow progress — feat_x   (engine: user_review, round ${n})`;

/** @param {import('node:test').TestContext} t */
async function progressFixture(t) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target: 'github-actions' };
  config.forge = 'github';
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  const promptFile = `${STATE_DIR}/task_prompts/feat_x_task_prompt.md`;
  const ledgerFile = `${STATE_DIR}/flow_progress/feat_x_progress.md`;
  mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
  mkdirSync(join(dir, STATE_DIR, 'flow_progress'), { recursive: true });
  writeFileSync(join(dir, promptFile), `# A task\n\nDo it.\n\n---\n\nStarted from https://github.com/${REPOSITORY}/issues/7 by @alice.\n`);
  writeFileSync(join(dir, ledgerFile), ledger(TASK_HEADER, TASK_IDS));
  await runGit(dir, ['add', '--force', promptFile, ledgerFile]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: feat_x']);
  const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');

  return {
    dir,
    /** Replace the checkout's own ledger of feat_x. */
    writeLedger: (content) => writeFileSync(join(dir, ledgerFile), content),
    setConfig: (mutate) => {
      const next = JSON.parse(readFileSync(configPath, 'utf8'));
      mutate(next);
      writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`);
    },
    /** @param {Record<string, string>} [env] */
    progress: (env = {}) =>
      runBash(dir, [SCRIPT, 'report', 'progress', 'feat_x', '--repo', dir], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        STUB_PRS: PR_12,
        STUB_RUN_LIST: '',
        STUB_COMMENTS: '',
        ...env,
      }),
    /** `report stopped feat_x`, under the same stubs as `progress`. @param {Record<string, string>} [env] */
    stopped: (env = {}) =>
      runBash(dir, [SCRIPT, 'report', 'stopped', 'feat_x', '--repo', dir], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        STUB_PRS: PR_12,
        STUB_RUN_LIST: '',
        STUB_COMMENTS: '',
        ...env,
      }),
    /** @returns {{ args: string[], body: string | null, line: string }[]} */
    calls: () =>
      existsSync(log)
        ? readFileSync(log, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((line) => {
              const { args, body } = JSON.parse(line);
              return { args, body, line: args.join(' ') };
            })
        : [],
    clearLog: () => writeFileSync(log, ''),
  };
}

const writes = (calls) => calls.filter((call) => call.args[0] === 'api' && call.args[1] === '--method');
const posts = (calls) => writes(calls).filter((call) => call.args[2] === 'POST');
const patches = (calls) => writes(calls).filter((call) => call.args[2] === 'PATCH');

test('a fresh task ledger with no progress comment yet posts one on the pull request', async (t) => {
  const f = await progressFixture(t);
  const result = await f.progress();
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(writes(calls).length, 1);
  const [post] = posts(calls);
  assert.equal(post.args[3], `repos/${REPOSITORY}/issues/12/comments`);
  assert.match(post.body, /^Progress of the harness run on `feat_x`:\n/);
  assert.match(post.body, /^- Planning: in progress$/m);
  assert.match(post.body, /^- Implementation: not started$/m);
  assert.doesNotMatch(post.body, /- \[/);
  assert.ok(post.body.trimEnd().endsWith('event=progress branch=feat_x -->'), post.body);
  assert.ok(!calls.some((call) => call.line.includes('/labels')));
});

test('an unchanged ledger with its comment already listed writes nothing', async (t) => {
  const f = await progressFixture(t);
  await f.progress();
  const [post] = posts(f.calls());
  f.clearLog();
  const result = await f.progress({ STUB_COMMENTS: JSON.stringify([{ id: 501, login: BOT, body: post.body }]) });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(writes(f.calls()), []);
  assert.match(result.stdout, /already current/);
});

test('a moved phase edits the listed comment in place', async (t) => {
  const f = await progressFixture(t);
  await f.progress();
  const [post] = posts(f.calls());
  f.clearLog();
  f.writeLedger(ledger(TASK_HEADER, TASK_IDS, ['P1', 'P2', 'P3']));
  const result = await f.progress({
    STUB_COMMENTS: JSON.stringify([
      { id: 400, login: 'alice', body: post.body },
      { id: 501, login: BOT, body: post.body.replace(/\n/g, '\r\n') },
    ]),
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(writes(calls).length, 1);
  const [patch] = patches(calls);
  assert.equal(patch.args[3], `repos/${REPOSITORY}/issues/comments/501`);
  assert.match(patch.body, /^- Planning: done$/m);
  assert.match(patch.body, /^- Implementation: in progress$/m);
});

test("a round ledger with only the task run's comment listed posts a new comment marked with its round", async (t) => {
  const f = await progressFixture(t);
  await f.progress();
  const [post] = posts(f.calls());
  f.clearLog();
  f.writeLedger(ledger(reviewHeader(2), REVIEW_IDS, ['R1', 'R2']));
  const result = await f.progress({ STUB_COMMENTS: JSON.stringify([{ id: 501, login: BOT, body: post.body }]) });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(writes(calls).length, 1);
  const [round] = posts(calls);
  assert.match(round.body, /^Progress of user-review round 2 on `feat_x`:\n/);
  assert.match(round.body, /^- Fix plan: done$/m);
  assert.match(round.body, /^- Fix implementation: in progress$/m);
  assert.ok(round.body.trimEnd().endsWith('<!-- sdlc-harness event=progress branch=feat_x round=2 -->'), round.body);
});

test('execution.progressComments false calls no gh at all', async (t) => {
  const f = await progressFixture(t);
  f.setConfig((c) => {
    c.execution.progressComments = false;
  });
  const result = await f.progress();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.match(result.stdout, /off by execution\.progressComments/);
});

test('with no recognised pull request — only the issue — nothing is posted', async (t) => {
  const f = await progressFixture(t);
  const result = await f.progress({ STUB_PRS: '[]' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(writes(f.calls()), []);
  assert.match(result.stdout, /no recognised open pull request; nothing posted/);
});

test('a docs-engine ledger posts nothing', async (t) => {
  const f = await progressFixture(t);
  f.writeLedger('# Flow progress — feat_x   (engine: docs)\n\n- [ ] D1.     docs\n');
  const result = await f.progress();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(writes(f.calls()), []);
  assert.match(result.stdout, /no task or user-review ledger; nothing posted/);
});

test('a stopped branch posts nothing', async (t) => {
  const f = await progressFixture(t);
  const result = await f.progress({
    STUB_RUN_LIST: JSON.stringify([
      { displayTitle: 'harness stop feat_x', createdAt: '2026-01-02T00:00:00Z' },
      { displayTitle: 'harness run feat_x', createdAt: '2026-01-01T00:00:00Z' },
    ]),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(writes(f.calls()), []);
  assert.match(result.stdout, /feat_x was stopped/);
});

test('forge_marker with four or fewer arguments prints what it printed before the round field', async (t) => {
  const f = await progressFixture(t);
  const result = await runBash(f.dir, [
    '-c',
    `COMMENT_MARKER='<!-- sdlc-harness'; eval "$(sed -n '/^forge_marker() {/,/^}/p' "$1")"; forge_marker started feat_x; forge_marker progress feat_x "" "" 3`,
    '_',
    join(f.dir, SCRIPT),
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout,
    '<!-- sdlc-harness event=started branch=feat_x -->\n<!-- sdlc-harness event=progress branch=feat_x round=3 -->\n',
  );
});

/** A progress comment body as `forge_progress` renders it, with `- Implementation: <second>`. */
const progressBody = (second, marker = '<!-- sdlc-harness event=progress branch=feat_x -->') =>
  `Progress of the harness run on \`feat_x\`:\n\n- Planning: done\n- Implementation: ${second}\n- Branch review: not started\n- Done: not started\n\n${marker}\n`;
const listings = (calls) =>
  calls.filter((call) => call.args[0] === 'api' && call.args[1] === '--paginate' && /\/issues\/12\/comments$/.test(call.args[2]));

test("a stopped report rewrites the task run's progress comment from in progress to stopped", async (t) => {
  const f = await progressFixture(t);
  const body = progressBody('in progress');
  const result = await f.stopped({ STUB_COMMENTS: JSON.stringify([{ id: 501, login: BOT, body }]) });
  assert.equal(result.status, 0, result.stderr);
  const edits = patches(f.calls());
  assert.equal(edits.length, 1);
  assert.equal(edits[0].args[3], `repos/${REPOSITORY}/issues/comments/501`);
  assert.equal(edits[0].body, body.replace('- Implementation: in progress\n', '- Implementation: stopped\n'));
  assert.equal(writes(f.calls()).length, 2, 'the stopped comment and the progress edit, nothing else');
});

test("a stopped report rewrites a round's progress comment too", async (t) => {
  const f = await progressFixture(t);
  const body = progressBody('in progress', '<!-- sdlc-harness event=progress branch=feat_x round=2 -->');
  const result = await f.stopped({ STUB_COMMENTS: JSON.stringify([{ id: 777, login: BOT, body }]) });
  assert.equal(result.status, 0, result.stderr);
  const edits = patches(f.calls());
  assert.equal(edits.length, 1);
  assert.equal(edits[0].args[3], `repos/${REPOSITORY}/issues/comments/777`);
  assert.equal(edits[0].body, body.replace('- Implementation: in progress\n', '- Implementation: stopped\n'));
});

test('a stopped report leaves a progress comment with nothing in progress alone', async (t) => {
  const f = await progressFixture(t);
  const result = await f.stopped({ STUB_COMMENTS: JSON.stringify([{ id: 501, login: BOT, body: progressBody('done') }]) });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(listings(f.calls()).length, 1);
  assert.deepEqual(patches(f.calls()), []);
  assert.match(result.stdout, /nothing to mark stopped/);
});

test('a stopped report with progress comments off lists no comments', async (t) => {
  const f = await progressFixture(t);
  f.setConfig((c) => {
    c.execution.progressComments = false;
  });
  const result = await f.stopped({ STUB_COMMENTS: JSON.stringify([{ id: 501, login: BOT, body: progressBody('in progress') }]) });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(listings(f.calls()), []);
  assert.deepEqual(patches(f.calls()), []);
});

test("a stopped report does not edit another login's comment carrying the marker", async (t) => {
  const f = await progressFixture(t);
  const result = await f.stopped({ STUB_COMMENTS: JSON.stringify([{ id: 501, login: 'alice', body: progressBody('in progress') }]) });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(listings(f.calls()).length, 1);
  assert.deepEqual(patches(f.calls()), []);
});

test("a stopped report's round matcher is anchored to the branch and to a numeric round", async (t) => {
  const f = await progressFixture(t);
  const result = await f.stopped({
    STUB_COMMENTS: JSON.stringify([
      { id: 501, login: BOT, body: progressBody('in progress', '<!-- sdlc-harness event=progress branch=feat_xy -->') },
      { id: 502, login: BOT, body: progressBody('in progress', '<!-- sdlc-harness event=progress branch=feat_x round=two -->') },
      { id: 503, login: BOT, body: progressBody('in progress', '<!-- sdlc-harness event=progress branch=feat_xy round=2 -->') },
    ]),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(listings(f.calls()).length, 1);
  assert.deepEqual(patches(f.calls()), []);
});
