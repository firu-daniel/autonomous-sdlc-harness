/**
 * `remote-run.sh collect` — the run workflow's `collect` job: when a run ends, the next user-review
 * round starts from the reviews `control` collected while that run was in flight.
 *
 * **The rule these tests exist to enforce: a round starts only when the branch is settled, not stopped,
 * has an open pull request and has a review requesting changes no earlier round recorded, by an author
 * not refused — a refused author including a writer `HARNESS_RUN_ACTORS` does not admit, whose items
 * are dropped with one line while the rest of the round still starts; every other
 * outcome starts nothing and exits 0; and a `review` child that fails is told to the pull request in
 * exactly one comment, never retried.** A started round is asserted on origin's bytes — the `chore: add
 * user review for feat_x` commit and the round file — and on exactly one `engine=user_review` dispatch;
 * every outcome that starts nothing is asserted to push nothing and dispatch nothing.
 *
 * The fixture and the `gh` stub are `remote-control-review.test.mjs`'s shape. The stub answers `run list`
 * — the branch's listing and the all-branch listing the stop marker reads alike — from `STUB_RUN_LIST`,
 * by default run 601 `in_progress`, as the run holding the `collect` job is; its jobs from `STUB_JOBS`
 * (by default its `run` job `completed`); its artifact list and `run download` from `STUB_BUNDLES` (by
 * default a bundle saying `completed`); `pr list` from `STUB_PRS` (by default pull request 12); the
 * paginated `pulls/<n>/reviews` and `pulls/<n>/comments` listings from `STUB_PR_REVIEWS` and
 * `STUB_PR_COMMENTS`; the permission call per login from `STUB_PERMISSIONS`; and the labels GET with
 * `[]`; the paginated `issues/<n>/comments` listing per item from `STUB_ITEM_COMMENTS`, and a check run's
 * annotations from `STUB_ANNOTATIONS`. `HARNESS_TRIGGER_LOOKUP_SECS` is `0`. No case reaches the network.
 *
 * A newest run whose `run` job GitHub never started is reported by this run's own `collect` in one
 * `not_started` comment, on the pull request or else the issue, naming `@sdlc-harness resume` when its
 * dispatch's marker recorded an engine and the **Run workflow** form when none did; another run's is one
 * line, and no round is collected either way.
 *
 * The fixture's checkout is left on the default branch, never on `feat_x`, because the `collect` job
 * checks out the default branch: `review` cuts its own working copy of `feat_x`, which
 * `create-worktree.sh` refuses for a branch already checked out. `workflow-templates.test.mjs` holds the
 * job's checkout to that.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const ISSUE_URL = `https://github.com/${REPOSITORY}/issues/7`;
const REVIEW_DIR = `${STATE_DIR}/user_reviews`;
const REVIEW_DISPATCH =
  'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=user_review -f resume=none -f chain=0';

const STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
const fail = (why) => { process.stderr.write(why + '\\n'); process.exit(4); };
const permission = /^repos\\/[^/]+\\/[^/]+\\/collaborators\\/([^/]+)\\/permission$/.exec(args[1] ?? '');
if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_PRS);
} else if (args[0] === 'api' && args[1] === '--paginate' && /^repos\\/[^/]+\\/[^/]+\\/pulls\\/[0-9]+\\/(comments|reviews)$/.test(args[2] ?? '')) {
  const items = JSON.parse((args[2].endsWith('/reviews') ? process.env.STUB_PR_REVIEWS : process.env.STUB_PR_COMMENTS) || '[]');
  process.stdout.write(items.length === 0 ? '[]' : items.map((c) => JSON.stringify([c])).join(''));
} else if (args[0] === 'api' && args[1] === '--paginate' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/comments$/.test(args[2] ?? '')) {
  const item = args[2].split('/').slice(-2)[0];
  for (const c of JSON.parse(process.env.STUB_ITEM_COMMENTS || '{}')[item] || []) {
    process.stdout.write(JSON.stringify({ login: c.user.login, at: c.created_at, body: c.body }) + '\\n');
  }
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/check-runs\\/[0-9]+\\/annotations$/.test(args[1] ?? '')) {
  process.stdout.write(process.env.STUB_ANNOTATIONS || '[]');
} else if (args[0] === 'api' && permission) {
  const answer = JSON.parse(process.env.STUB_PERMISSIONS || '{}')[permission[1]];
  if (answer === undefined) fail('stub permission failure');
  process.stdout.write(JSON.stringify({ permission: answer }));
} else if (args[0] === 'api' && /\\/actions\\/runs\\/[0-9]+\\/artifacts$/.test(args[1] ?? '')) {
  const id = args[1].split('/').slice(-2)[0];
  const listed = Object.hasOwn(JSON.parse(process.env.STUB_BUNDLES || '{}'), id);
  process.stdout.write(JSON.stringify({ artifacts: listed ? [{ name: 'harness-state', expired: false }] : [] }));
} else if (args[0] === 'api' && /\\/actions\\/runs\\/[0-9]+\\/jobs$/.test(args[1] ?? '')) {
  const id = args[1].split('/').slice(-2)[0];
  process.stdout.write(JSON.stringify({ jobs: JSON.parse(process.env.STUB_JOBS || '{}')[id] || [] }));
} else if (args[0] === 'run' && args[1] === 'download') {
  const status = JSON.parse(process.env.STUB_BUNDLES || '{}')[args[2]];
  if (!status) fail('no artifact matches');
  const dir = args[args.indexOf('-D') + 1];
  require('node:fs').mkdirSync(dir, { recursive: true });
  require('node:fs').writeFileSync(dir + '/status.json', JSON.stringify({ schema: '1', branch: 'feat_x', engine: 'task', ...status }));
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
} else if (args[0] === 'run' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_RUN_LIST);
}
`;

/** One run of the run workflow, as `gh run list` returns it. */
const run = (id, title, status, createdAt) => ({
  databaseId: id,
  displayTitle: title,
  headBranch: 'feat_x',
  status,
  conclusion: status === 'completed' ? 'success' : null,
  createdAt,
  url: `https://example.test/runs/${id}`,
});

/** The run holding the `collect` job: in progress, its `run` job completed, its bundle `completed`. */
const THIS_RUN = run(601, 'harness run feat_x', 'in_progress', '2026-01-01T00:00:00Z');

/** One review, as the pull request's reviews endpoint returns it. */
const review = (id, login, fields = {}) => ({
  id,
  user: { login, type: 'User' },
  state: 'CHANGES_REQUESTED',
  body: `Review ${id} by ${login}.`,
  html_url: `https://github.com/${REPOSITORY}/pull/12#pullrequestreview-${id}`,
  submitted_at: '2026-01-02T00:00:05Z',
  ...fields,
});

/**
 * An adopted fixture on `origin`, with `feat_x` pushed carrying its provenance line, its ledger and its
 * story index; with `ledger: false`, its task prompt alone, as `start` leaves a first run's branch.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ ledger?: boolean }} [options]
 */
async function collectFixture(t, { ledger = true } = {}) {
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
  const origin = (await runGit(dir, ['remote', 'get-url', 'origin'])).stdout.trim();

  const files = {
    [`${STATE_DIR}/task_prompts/feat_x_task_prompt.md`]:
      `# A task\n\nDo it.\n\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n`,
    ...(ledger
      ? {
          [`${STATE_DIR}/flow_progress/feat_x_progress.md`]: '# Progress\n',
          [`${STATE_DIR}/story_plans/feat_x_story_plan.md`]: '# Stories\n',
        }
      : {}),
  };
  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  await runGit(dir, ['add', '--force', ...Object.keys(files)]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: feat_x']);
  const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);
  await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);
  t.after(() => rmSync(join(dirname(dir), `${config.projectName}-feat_x`), { recursive: true, force: true }));

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');

  const git = async (args) => (await runGit(origin, args)).stdout;
  return {
    origin,
    originRefs: () => git(['for-each-ref', '--format=%(refname) %(objectname)']),
    originSubject: async () => (await git(['log', '-1', '--format=%s', 'refs/heads/feat_x'])).trim(),
    originFile: (path) => git(['show', `refs/heads/feat_x:${path}`]),
    /**
     * Run `collect feat_x` as the run workflow's `collect` job does.
     *
     * @param {Record<string, string>} [env]
     * @param {string[]} [args] appended after the branch
     */
    collect: (env = {}, args = []) =>
      runBash(dir, [SCRIPT, 'collect', 'feat_x', ...args], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        HARNESS_REMOTE_STOP: '',
        HARNESS_TRIGGER_ALLOWED_BOTS: '',
        HARNESS_RUN_ACTORS: '*',
        HARNESS_TRIGGER_LOOKUP_SECS: '0',
        STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
        STUB_RUN_LIST: JSON.stringify([THIS_RUN]),
        STUB_JOBS: JSON.stringify({ 601: [{ name: 'run', status: 'completed' }, { name: 'collect', status: 'in_progress' }] }),
        STUB_BUNDLES: JSON.stringify({ 601: { status: 'completed' } }),
        STUB_PERMISSIONS: JSON.stringify({ bob: 'write' }),
        STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob')]),
        STUB_PR_COMMENTS: '',
        STUB_ITEM_COMMENTS: '',
        STUB_ANNOTATIONS: '',
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

const allComments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const dispatches = (calls) => calls.filter((call) => call.line.startsWith('workflow run '));

/** Assert nothing started: exit 0, a line matching <pattern>, no dispatch, no comment, origin unchanged. */
const assertNothing = async (f, result, before, pattern) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, pattern);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  assert.deepEqual(allComments(calls), []);
  assert.equal(await f.originRefs(), before);
};

test('settled, with one pending review: one round commit and one user_review dispatch', async (t) => {
  const f = await collectFixture(t);
  const result = await f.collect();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(await f.originSubject(), 'chore: add user review for feat_x');
  const round = await f.originFile(`${REVIEW_DIR}/feat_x_review.md`);
  assert.ok(round.startsWith('## Review by @bob\n\nReview 5 by bob.\n'), round);
  assert.match(round, /\n<!-- sdlc-harness round collected_at=\S+ reviews=5 comments= -->\n$/);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [REVIEW_DISPATCH]);
  assert.ok(calls.some((call) => call.line === 'api repos/{owner}/{repo}/actions/runs/601/jobs'), 'the run job was read');
  assert.ok(!allComments(calls).some((call) => /event=reply /.test(call.body)), 'no failure comment');
  const note = allComments(calls).find((call) => /event=round /.test(call.body));
  assert.ok(note?.body.includes(`Round 1 from pull request #12 (https://github.com/${REPOSITORY}/pull/12) by @bob`), note?.body);
});

test('a writer HARNESS_RUN_ACTORS does not admit has their items dropped with one line, and the admitted round is still dispatched', async (t) => {
  const f = await collectFixture(t);
  const result = await f.collect({
    HARNESS_RUN_ACTORS: 'alice',
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
    STUB_PR_REVIEWS: JSON.stringify([review(5, 'alice'), review(6, 'bob')]),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /dropped 1 item\(s\) by @bob: @bob is not on the repository variable HARNESS_RUN_ACTORS/);
  assert.equal(await f.originSubject(), 'chore: add user review for feat_x');
  const round = await f.originFile(`${REVIEW_DIR}/feat_x_review.md`);
  assert.ok(round.startsWith('## Review by @alice\n\nReview 5 by alice.\n'), round);
  assert.ok(!round.includes('@bob') && !round.includes('Review 6'), round);
  assert.match(round, /\n<!-- sdlc-harness round collected_at=\S+ reviews=5 comments= -->\n$/);
  assert.deepEqual(dispatches(f.calls()).map((call) => call.line), [REVIEW_DISPATCH]);
});

test('settled, with an inline comment but no review requesting changes: nothing pushed or dispatched', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const comment = {
    id: 1, pull_request_review_id: 9, user: { login: 'bob', type: 'User' }, path: 'a.ts', line: 1,
    commit_id: 'c', body: 'A note.', diff_hunk: '@@ -1 +1 @@', created_at: '2026-01-02T00:00:01Z',
  };
  const result = await f.collect({ STUB_PR_REVIEWS: '', STUB_PR_COMMENTS: JSON.stringify([comment]) });
  await assertNothing(f, result, before, /no review requesting changes is pending on #12/);
});

test('settled, with only a COMMENTED review carrying a body: nothing pushed or dispatched', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({ STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', { state: 'COMMENTED', body: 'Just a note.' })]) });
  await assertNothing(f, result, before, /no review requesting changes is pending on #12/);
});

test('a newer run listed: nothing, since its own end collects', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({
    STUB_RUN_LIST: JSON.stringify([run(602, 'harness run feat_x', 'queued', '2026-01-03T00:00:00Z'), THIS_RUN]),
  });
  await assertNothing(f, result, before, /feat_x is running; that run's own end collects/);
});

test('this run ended parked: nothing, since the resumed run collects', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({ STUB_BUNDLES: JSON.stringify({ 601: { status: 'parked' } }) });
  await assertNothing(f, result, before, /feat_x is parked; that run's own end collects/);
});

test('a stop marker newer than the run: nothing', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({
    STUB_RUN_LIST: JSON.stringify([run(603, 'harness stop feat_x', 'completed', '2026-01-03T00:00:00Z'), THIS_RUN]),
  });
  await assertNothing(f, result, before, /feat_x is stopped; no round started/);
});

test('HARNESS_REMOTE_STOP set: nothing, and no gh call', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({ HARNESS_REMOTE_STOP: '1' });
  await assertNothing(f, result, before, /HARNESS_REMOTE_STOP is set; no round started/);
  assert.deepEqual(f.calls(), []);
});

test('no open pull request: nothing to collect', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({ STUB_PRS: '[]' });
  await assertNothing(f, result, before, /no open pull request; nothing to collect/);
});

test('review failing placement: exactly one pull-request comment, exit 0, nothing dispatched', async (t) => {
  const f = await collectFixture(t);
  writeFileSync(join(f.origin, 'hooks', 'pre-receive'), '#!/bin/sh\necho "push refused by the fixture" >&2\nexit 1\n', { mode: 0o755 });
  const before = await f.originRefs();
  // `push-branch.sh` retries the refused push; no wait between its attempts.
  const result = await f.collect({ PUSH_RETRY_DELAY_SECS: '0', GITHUB_RUN_ID: '601' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  const posted = allComments(calls);
  assert.equal(posted.length, 1, JSON.stringify(calls.map((call) => call.line)));
  assert.match(posted[0].line, /issues\/12\/comments /);
  assert.match(posted[0].body, /^The reviews requesting changes collected during the run on `feat_x` could not start the next round: [^\n]*the remote refused the push/);
  assert.match(
    posted[0].body,
    /They stay on the pull request\. To retry, re-run this run's `collect` job \(no new review is needed\), or submit a review requesting changes\.\n/,
  );
  assert.match(posted[0].body, /<!-- sdlc-harness event=reply branch=feat_x -->/);
  assert.equal(await f.originRefs(), before);
});

test('--pr names the pull request even when none is listed; a --pr that is not a positive number is a usage error, exit 1', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const bad = await f.collect({}, ['--pr', '0']);
  assert.equal(bad.status, 1, `${bad.stdout}\n${bad.stderr}`);
  assert.deepEqual(f.calls(), []);
  assert.equal(await f.originRefs(), before);

  const result = await f.collect({ STUB_PRS: '[]' }, ['--pr', '12']);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(await f.originSubject(), 'chore: add user review for feat_x');
  assert.ok(f.calls().some((call) => call.line === `api --paginate repos/${REPOSITORY}/pulls/12/reviews`));
});

/** An older `harness run feat_x` run, completed, before THIS_RUN. */
const OLDER_RUN = run(600, 'harness run feat_x', 'completed', '2025-12-31T00:00:00Z');
const NOT_STARTED_WHY = 'The job was not started because your account is locked due to a billing issue.';
const ROUTE_CHOICE = '<task, user_review or docs: the one the run was started with>';

/** A `github-actions[bot]` comment <secs> after THIS_RUN was created, ending in <marker>. */
const botComment = (marker, secs = 5) => ({
  user: { login: 'github-actions[bot]' },
  created_at: new Date(Date.parse(THIS_RUN.createdAt) + secs * 1000).toISOString().replace('.000Z', 'Z'),
  body: `Dispatched.\n\n<!-- sdlc-harness event=${marker} branch=feat_x -->\n`,
});

/**
 * The environment of THIS_RUN, the newest, whose `run` job GitHub never started and which has no bundle;
 * OLDER_RUN carries one when <olderBundle>. <comments> maps an item number to its comments.
 */
const neverStarted = ({ olderBundle, comments = {}, prs = [{ number: 12, isCrossRepository: false }] }) => ({
  GITHUB_RUN_ID: '601',
  STUB_RUN_LIST: JSON.stringify([THIS_RUN, OLDER_RUN]),
  STUB_JOBS: JSON.stringify({
    601: [{ id: 9001, name: 'run', status: 'completed', conclusion: 'cancelled', steps: [] }, { name: 'collect', status: 'in_progress' }],
  }),
  STUB_BUNDLES: JSON.stringify(olderBundle ? { 600: { status: 'completed' } } : {}),
  STUB_ANNOTATIONS: JSON.stringify([{ message: NOT_STARTED_WHY }]),
  STUB_ITEM_COMMENTS: JSON.stringify(comments),
  STUB_PRS: JSON.stringify(prs),
});

const labelCalls = (calls) =>
  calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/labels /.test(call.line)).map((call) => call.line);
const labelOn = (n, state) => `api --method POST repos/${REPOSITORY}/issues/${n}/labels -f labels[]=sdlc-harness: ${state}`;

/** The `not_started` push notification's stdout line for feat_x; fails when there is none. */
const notifiedNotStarted = (result) => {
  const line = result.stdout.split('\n').find((l) => l.startsWith('remote-run.sh: notified not_started for feat_x: '));
  assert.ok(line, result.stdout);
  return line;
};

/** Assert one `not_started` comment on #<n> and nothing pushed or dispatched; returns its body. */
const assertNotStarted = async (f, result, before, n) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  const posted = allComments(calls);
  assert.equal(posted.length, 1, JSON.stringify(calls.map((call) => call.line)));
  assert.match(posted[0].line, new RegExp(`issues/${n}/comments `));
  assert.match(posted[0].body, /^GitHub did not start the job of the harness run on `feat_x`, so nothing ran and the branch is unchanged\. /);
  assert.ok(posted[0].body.includes(`\n\n${NOT_STARTED_WHY}\n`), posted[0].body);
  assert.match(posted[0].body, /<!-- sdlc-harness event=not_started branch=feat_x -->/);
  assert.equal(await f.originRefs(), before);
  return posted[0].body;
};

test('a run whose job never started, with a pull request and a recorded engine: one comment naming resume, paused', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect(neverStarted({ olderBundle: true, comments: { 12: [botComment('round')] } }));
  const body = await assertNotStarted(f, result, before, 12);
  assert.ok(body.includes('Comment `@sdlc-harness resume` to start it again.'), body);
  assert.ok(!body.includes('Run workflow'), body);
  const labels = labelCalls(f.calls());
  assert.ok(labels.includes(labelOn(12, 'paused')), labels.join('\n'));
  assert.ok(labels.includes(labelOn(7, 'paused')), labels.join('\n'));
});

test('a first run whose job never started, with its issue\'s started marker: one issue comment naming resume, paused', async (t) => {
  const f = await collectFixture(t, { ledger: false });
  const before = await f.originRefs();
  const result = await f.collect(neverStarted({ olderBundle: false, prs: [], comments: { 7: [botComment('started')] } }));
  const body = await assertNotStarted(f, result, before, 7);
  assert.ok(body.includes('Comment `@sdlc-harness resume`'), body);
  assert.ok(notifiedNotStarted(result).includes('/autonomous-sdlc-harness:branch-resume'), result.stdout);
  assert.deepEqual(labelCalls(f.calls()), [labelOn(7, 'paused')]);
});

test('a first run whose job never started, with no marker: one issue comment naming the Run workflow form, failed', async (t) => {
  const f = await collectFixture(t, { ledger: false });
  const before = await f.originRefs();
  const result = await f.collect(neverStarted({ olderBundle: false, prs: [] }));
  const body = await assertNotStarted(f, result, before, 7);
  assert.ok(body.includes('Start it again with the **Run workflow** form: '), body);
  assert.ok(body.includes(ROUTE_CHOICE), body);
  assert.ok(!body.includes('harness-state'), body);
  assert.ok(!body.includes('@sdlc-harness resume'), body);
  assert.ok(!notifiedNotStarted(result).includes('/autonomous-sdlc-harness:branch-resume'), result.stdout);
  assert.deepEqual(labelCalls(f.calls()), [labelOn(7, 'failed')]);
});

test('another run whose job never started: nothing, since its own collect reports it', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const result = await f.collect({
    ...neverStarted({ olderBundle: true, comments: { 12: [botComment('round')] } }),
    GITHUB_RUN_ID: '599',
  });
  await assertNothing(f, result, before, /run 601 of feat_x never started; its own collect reports it/);
  assert.deepEqual(labelCalls(f.calls()), []);
});

test('a run whose job never started on a stopped branch: nothing posted', async (t) => {
  const f = await collectFixture(t);
  const before = await f.originRefs();
  const env = neverStarted({ olderBundle: true, comments: { 12: [botComment('round')] } });
  const result = await f.collect({
    ...env,
    STUB_RUN_LIST: JSON.stringify([run(603, 'harness stop feat_x', 'completed', '2026-01-03T00:00:00Z'), THIS_RUN, OLDER_RUN]),
  });
  await assertNothing(f, result, before, /feat_x is stopped; no round started/);
  assert.deepEqual(labelCalls(f.calls()), []);
});
