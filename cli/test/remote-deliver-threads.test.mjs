/**
 * `remote-run.sh deliver` on a completed user-review round: the review threads the round collected.
 *
 * **The rule these tests exist to enforce: at a round's completion, a collected thread is resolved only when
 * its finding is `[x]`, and always after a reply naming the fix commit; anything else is replied to with the
 * reason or left alone, and no review is dismissed.**
 *
 * The fixture is `remote-deliver.test.mjs`'s, plus on origin's `feat_x` a round file
 * `user_reviews/feat_x_review.md` whose marker records `comments=101,102,103`, a fix-plan index whose
 * `[x] **Finding 1**` flip lands in a commit of its own, `finding_1.md` and `finding_2.md` carrying
 * `**Review comments:** 101` and `102`, and an Out-of-scope bullet ending ` **Review comments:** 103`.
 * `gh` is a stub reached through `HARNESS_GH_CLI`: it logs each argument vector with any `body=@` content,
 * answers the `api graphql` listing from `STUB_THREADS` and the mutation with a resolved thread, and fails a
 * call starting `STUB_FAIL_ON`. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const ISSUE_URL = `https://github.com/${REPOSITORY}/issues/7`;
const COLLECTED_AT = '2026-01-01T00:00:00Z';
const REASON = '**Observation 3 — "Rename the helper."** Out of scope: the name is the public API.';
const THREAD_MARKER = '<!-- sdlc-harness event=thread branch=feat_x -->\n';

const STUB = `#!/usr/bin/env node
const { appendFileSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
if (process.env.STUB_FAIL_ON && args.join(' ').startsWith(process.env.STUB_FAIL_ON)) {
  process.stderr.write('stub refusal\\n');
  process.exit(1);
}
if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_PRS || '[]');
} else if (args[0] === 'pr' && args[1] === 'ready') {
  process.stdout.write('');
} else if (args[0] === 'api' && args[1] === 'graphql') {
  if (args.some((arg) => arg.includes('resolveReviewThread'))) {
    process.stdout.write('{"data":{"resolveReviewThread":{"thread":{"isResolved":true}}}}');
  } else {
    process.stdout.write(process.env.STUB_THREADS || '{}');
  }
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

const comment = (databaseId, createdAt = '2025-12-31T23:00:00Z', body = 'Please fix.') => ({ databaseId, createdAt, body });
const thread = (id, isResolved, comments) => ({ id, isResolved, comments: { nodes: comments } });

/** The listing's one page: threads for 101, 102 (resolved), 103 and an uncollected 104. */
function threadsPage({ laterReplyOn101 = false } = {}) {
  const on101 = [comment(101)];
  if (laterReplyOn101) on101.push(comment(105, '2026-01-02T00:00:00Z', 'Still wrong.'));
  const nodes = [
    thread('T101', false, on101),
    thread('T102', true, [comment(102)]),
    thread('T103', false, [comment(103)]),
    thread('T104', false, [comment(104)]),
  ];
  return JSON.stringify({
    data: { repository: { pullRequest: { reviewThreads: { pageInfo: { hasNextPage: false, endCursor: null }, nodes } } } },
  });
}

/**
 * @param {import('node:test').TestContext} t
 * @param {{ engine?: string, unmarkedNewest?: boolean }} [options]
 */
async function threadsFixture(t, { engine = 'user_review', unmarkedNewest = false } = {}) {
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
  config.phases = { ...config.phases, qa: false };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  /** @param {string} rel @param {string} text @param {string} message */
  const commitFile = async (rel, text, message) => {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), text);
    await runGit(dir, ['add', '--force', rel]);
    await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', message]);
  };
  const reviews = `${STATE_DIR}/user_reviews`;
  const index = `${reviews}/feat_x_fix_plan.md`;
  await commitFile(
    `${STATE_DIR}/task_prompts/feat_x_task_prompt.md`,
    `# Add comments\n\nDo it.\n\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n`,
    'fixture: task prompt',
  );
  await commitFile(`${STATE_DIR}/flow_progress/feat_x_progress.md`, '# Progress\n', 'fixture: ledger');
  await commitFile(
    `${reviews}/feat_x_review.md`,
    `## Review by @bob\n\nFix it.\n\n<!-- sdlc-harness round collected_at=${COLLECTED_AT} reviews=1 comments=101,102,103 -->\n`,
    'chore: add user review for feat_x',
  );
  const indexText = (mark) =>
    '# User-Review Fix Plan: feat_x\n\n## Phase 2 Readiness — Ordered Fix List\n\n'
    + `1. [${mark}] **Finding 1** — Fix the helper. _(layer: cli)_\n2. [x] **Finding 2** — Fix the other. _(layer: cli)_\n\n`
    + `## Out of scope / verified-OK\n\n- ${REASON} **Review comments:** 103\n\n## Source observations\n`;
  await commitFile(`${reviews}/feat_x_fix_plan/finding_1.md`, '### Finding 1\n\n**Review comments:** 101\n', 'fixture: finding 1');
  await commitFile(`${reviews}/feat_x_fix_plan/finding_2.md`, '### Finding 2\n\n**Review comments:** 102\n', 'fixture: finding 2');
  await commitFile(index, indexText(' '), 'fixture: fix plan');
  await commitFile(index, indexText('x'), 'fix: finding 1');
  const flip = (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim();
  await commitFile(`${STATE_DIR}/flow_progress/feat_x_progress.md`, '# Progress\n\n- [x] done\n', 'chore: later commit');
  if (unmarkedNewest) await commitFile(`${reviews}/feat_x_review_2.md`, '## A local round\n', 'chore: add user review for feat_x');
  const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);
  await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  const bundle = join(stubDir, 'bundle');
  mkdirSync(runnerTemp, { recursive: true });
  mkdirSync(bundle, { recursive: true });
  writeFileSync(join(bundle, 'status.json'), JSON.stringify({ schema: '1', branch: 'feat_x', status: 'completed', engine }));
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');

  return {
    flip,
    /** @param {Record<string, string>} [env] */
    deliver: (env = {}) =>
      runBash(dir, [SCRIPT, 'deliver', 'feat_x', bundle], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        GH_TOKEN: 'job-token',
        RUNNER_TEMP: runnerTemp,
        HARNESS_PR_TOKEN: '',
        STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false, isDraft: true }]),
        STUB_THREADS: threadsPage(),
        STUB_FAIL_ON: '',
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
  };
}

const replyPath = (id) => `api --method POST repos/${REPOSITORY}/pulls/12/comments/${id}/replies `;
const repliesTo = (calls, id) => calls.filter((call) => call.line.startsWith(replyPath(id)));
const allReplies = (calls) => calls.filter((call) => /\/pulls\/12\/comments\/\d+\/replies /.test(call.line));
const resolves = (calls) => calls.filter((call) => call.args[0] === 'api' && call.args[1] === 'graphql' && call.line.includes('resolveReviewThread'));
const graphqls = (calls) => calls.filter((call) => call.args[0] === 'api' && call.args[1] === 'graphql');
const firstComment = (calls) => calls.findIndex((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const warnings = (result) => `${result.stdout}\n${result.stderr}`.split('\n').filter((line) => line.startsWith('::warning::'));

/** No case calls a review-dismissal endpoint. */
function assertNoDismissal(calls) {
  for (const call of calls) assert.doesNotMatch(call.line, /dismissals/, call.line);
}

test('a fixed comment is replied to with its flip commit, then resolved; a reason is replied to and left open', async (t) => {
  const f = await threadsFixture(t);
  const result = await f.deliver();
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();

  const [listing] = graphqls(calls);
  assert.ok(listing.args.includes('--paginate'), listing.line);
  assert.ok(listing.line.includes('reviewThreads(first: 100, after: $endCursor)'), listing.line);

  const [on101] = repliesTo(calls, 101);
  assert.equal(on101.body, `Addressed in \`${f.flip}\`.\n\n${THREAD_MARKER}`);
  const done = resolves(calls);
  assert.equal(done.length, 1);
  assert.ok(done[0].args.includes('id=T101'), done[0].line);
  assert.ok(calls.indexOf(done[0]) > calls.indexOf(on101));

  assert.equal(repliesTo(calls, 102).length, 0);
  assert.match(result.stdout, /comment 102's thread is already resolved; left alone/);
  const [on103] = repliesTo(calls, 103);
  assert.equal(on103.body, `Not changed in this round: ${REASON}\n\n${THREAD_MARKER}`);
  assert.equal(repliesTo(calls, 104).length, 0);
  assert.equal(allReplies(calls).length, 2);

  const commentAt = firstComment(calls);
  assert.ok(commentAt > calls.indexOf(done[0]), 'the replies land before the completed comments');
  assert.deepEqual(warnings(result), []);
  assertNoDismissal(calls);
});

test('a reviewer reply after the round leaves the thread alone', async (t) => {
  const f = await threadsFixture(t);
  const result = await f.deliver({ STUB_THREADS: threadsPage({ laterReplyOn101: true }) });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(repliesTo(calls, 101).length, 0);
  assert.equal(resolves(calls).length, 0);
  assert.equal(repliesTo(calls, 103).length, 1);
  assert.match(result.stdout, /comment 101's thread has a reply newer than round 1; left alone/);
  assert.deepEqual(warnings(result), []);
  assertNoDismissal(calls);
});

test('a thread already carrying the harness reply is not replied to again', async (t) => {
  const f = await threadsFixture(t);
  const page = JSON.parse(threadsPage());
  page.data.repository.pullRequest.reviewThreads.nodes[0].comments.nodes.push(
    comment(106, '2026-01-02T00:00:00Z', `Addressed in \`abc\`.\n\n${THREAD_MARKER}`),
  );
  const result = await f.deliver({ STUB_THREADS: JSON.stringify(page) });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(repliesTo(calls, 101).length, 0);
  assert.equal(resolves(calls).length, 0);
  assert.equal(repliesTo(calls, 103).length, 1);
  assert.match(result.stdout, /comment 101's thread already carries this harness's reply; left alone/);
  assert.deepEqual(warnings(result), []);
  assertNoDismissal(calls);
});

test('a refused resolve is one warning line and exit 0', async (t) => {
  const f = await threadsFixture(t);
  const result = await f.deliver({ STUB_FAIL_ON: 'api graphql -f query=mutation' });
  assert.equal(result.status, 0, result.stderr);
  const lines = warnings(result);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /resolving review comment 101's thread was refused/);
  const calls = f.calls();
  assert.equal(repliesTo(calls, 101).length, 1);
  assert.equal(firstComment(calls) >= 0, true);
  assertNoDismissal(calls);
});

test('an unmarked newest round makes no graphql call', async (t) => {
  const f = await threadsFixture(t, { unmarkedNewest: true });
  const result = await f.deliver();
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(graphqls(calls).length, 0);
  assert.equal(allReplies(calls).length, 0);
  assert.match(result.stdout, /round 2 of feat_x was not placed from a pull-request review/);
  assertNoDismissal(calls);
});

test('a task-engine bundle makes no graphql call', async (t) => {
  const f = await threadsFixture(t, { engine: 'task' });
  const result = await f.deliver();
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(graphqls(calls).length, 0);
  assert.equal(allReplies(calls).length, 0);
  assertNoDismissal(calls);
});
