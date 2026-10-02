/**
 * `remote-run.sh control` on a `pull_request_review` event: a review requesting changes becomes the
 * branch's next user-review round through the `review` verb the local relay uses.
 *
 * **The rule these tests exist to enforce: only a review requesting changes, by a write-or-admin
 * reviewer, on a recognised same-repository harness branch carrying a story index, starts a round; the
 * round collects every review requesting changes, every other submitted review carrying a summary, and
 * every inline comment since the previous round, by
 * every authorised author, each review's body under its own `## Review by @<login>` section and each
 * comment with file, line, commit, author and hunk, closed by a marker recording the ids it consumed, and
 * nothing a marker records is collected again; a review arriving while a run is in flight is never
 * refused: it is acknowledged with one reply, nothing is pushed or dispatched, and it stays on the pull
 * request for the next round; once settled, `review` holds until its dispatched run is listed by the
 * pushed commit's `headSha`.** A started round is asserted on origin's bytes — the `chore: add user review for feat_x`
 * commit and the round file — and on exactly one `engine=user_review` dispatch; every ignored shape is
 * asserted to call no `gh` at all; every refusal is asserted to post one reply and push nothing.
 *
 * The fixture is `remote-control.test.mjs`'s — `init`, `execution.target` `github-actions`, `forge`
 * `github`, the adopted tree pushed to the fixture's bare `origin`, and `feat_x` pushed carrying its task
 * prompt and its flow-progress ledger — plus `feat_x`'s story index. `gh` is a stub reached through
 * `HARNESS_GH_CLI`: it logs each argument vector with the content of any `body=@<path>`, answers the
 * paginated `pulls/<n>/comments` and `pulls/<n>/reviews` listings from `STUB_PR_COMMENTS` and
 * `STUB_PR_REVIEWS` (raw API objects, one page each), the permission call per login from
 * `STUB_PERMISSIONS`, `run list` from `STUB_RUN_LIST` (by default one completed
 * `harness run <branch>` run with no state bundle, which reads as `failed`), a run's jobs from
 * `STUB_JOBS` (none by default), its artifact list and `run download` from `STUB_BUNDLES` (run id ->
 * `status.json` fields; none by default), the post-dispatch `headSha` lookup with origin's tip under
 * `STUB_LIST_DISPATCHED`, and the labels GET with `[]`. `HARNESS_TRIGGER_LOOKUP_SECS` is `0`, so a
 * lookup that finds nothing costs no wait. No case reaches the network.
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
const REVIEW_ID = 900;
const REVIEW_URL = `https://github.com/${REPOSITORY}/pull/12#pullrequestreview-${REVIEW_ID}`;
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
  process.stdout.write(process.env.STUB_PRS || '[]');
} else if (args[0] === 'api' && args[1] === '--paginate' && /^repos\\/[^/]+\\/[^/]+\\/pulls\\/[0-9]+\\/(comments|reviews)$/.test(args[2] ?? '')) {
  const items = JSON.parse((args[2].endsWith('/reviews') ? process.env.STUB_PR_REVIEWS : process.env.STUB_PR_COMMENTS) || '[]');
  process.stdout.write(items.length === 0 ? '[]' : items.map((c) => JSON.stringify([c])).join(''));
} else if (args[0] === 'api' && permission) {
  const answer = JSON.parse(process.env.STUB_PERMISSIONS || '{}')[permission[1]];
  if (answer === undefined || answer === 'FAIL') fail('stub permission failure');
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
} else if (args[0] === 'run' && args[1] === 'list' && process.env.STUB_LIST_DISPATCHED && args.includes('url,displayTitle,headSha')) {
  const branch = args[args.indexOf('--branch') + 1];
  const tip = require('node:child_process').execFileSync('git', ['ls-remote', 'origin', 'refs/heads/' + branch], { encoding: 'utf8' }).split('\\t')[0];
  process.stdout.write(JSON.stringify([{ displayTitle: 'harness run ' + branch, headSha: tip, url: 'https://example.test/runs/777' }]));
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
} else if (args[0] === 'run' && args[1] === 'list') {
  const branch = args[args.indexOf('--branch') + 1];
  process.stdout.write(process.env.STUB_RUN_LIST
    || JSON.stringify([{ databaseId: 601, displayTitle: 'harness run ' + branch, status: 'completed', conclusion: 'success', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/601' }]));
}
`;

/**
 * An adopted fixture on `origin`, with `feat_x` pushed carrying its provenance line, its ledger and its
 * story index.
 *
 * @param {import('node:test').TestContext} t
 */
async function reviewFixture(t) {
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

  /** Commit <files> (path -> text) on <branch> and push it to origin. */
  const commitOn = async (branch, files, message) => {
    const exists = (await runBash(dir, ['-c', `git show-ref --verify --quiet refs/heads/${branch}`])).status === 0;
    await runGit(dir, ['checkout', '--quiet', ...(exists ? [] : ['-b']), branch]);
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    await runGit(dir, ['add', '--force', ...Object.keys(files)]);
    await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', message]);
    const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `HEAD:refs/heads/${branch}`]);
    assert.equal(push.status, 0, push.stderr);
    await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);
  };

  /** Push <branch> with its task prompt and, when asked, its ledger and its story index. */
  const pushBranch = async (branch, { ledger = true, story = true } = {}) => {
    const files = {
      [`${STATE_DIR}/task_prompts/${branch}_task_prompt.md`]:
        `# A task\n\nDo it.\n\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n`,
    };
    if (ledger) files[`${STATE_DIR}/flow_progress/${branch}_progress.md`] = '# Progress\n';
    if (story) files[`${STATE_DIR}/story_plans/${branch}_story_plan.md`] = '# Stories\n';
    await commitOn(branch, files, `fixture: ${branch}`);
    t.after(() => rmSync(join(dirname(dir), `${config.projectName}-${branch}`), { recursive: true, force: true }));
  };
  await pushBranch('feat_x');

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');
  let events = 0;

  const git = async (args) => (await runGit(origin, args)).stdout;
  return {
    dir,
    commitOn,
    pushBranch,
    originRefs: () => git(['for-each-ref', '--format=%(refname) %(objectname)']),
    originSubject: async (branch) => (await git(['log', '-1', '--format=%s', `refs/heads/${branch}`])).trim(),
    originFile: (branch, path) => git(['show', `refs/heads/${branch}:${path}`]),
    /**
     * Run `control` on one `pull_request_review` event: by default `alice` (a `User`) submitting a
     * `changes_requested` review on pull request 12, whose head is `feat_x` in this repository.
     *
     * @param {{ state?: string, body?: string, action?: string, login?: string, type?: string, head?: string, headRepo?: string, submittedAt?: string }} [event]
     * @param {Record<string, string>} [env]
     */
    control: async (
      { state = 'changes_requested', body = 'Please fix these.', action = 'submitted', login = 'alice', type = 'User', head = 'feat_x', headRepo = REPOSITORY, submittedAt = '2026-01-02T03:04:05Z' } = {},
      env = {},
    ) => {
      events += 1;
      const eventPath = join(stubDir, `event-${events}.json`);
      writeFileSync(eventPath, JSON.stringify({
        action,
        review: { id: REVIEW_ID, state, body, html_url: REVIEW_URL, submitted_at: submittedAt, user: { login } },
        pull_request: { number: 12, head: { ref: head, repo: { full_name: headRepo } } },
        sender: { login, type },
      }));
      return runBash(dir, [SCRIPT, 'control'], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_EVENT_NAME: 'pull_request_review',
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        HARNESS_REMOTE_STOP: '',
        HARNESS_TRIGGER_ALLOWED_BOTS: '',
        HARNESS_TRIGGER_LABEL: '',
        STUB_PERMISSIONS: JSON.stringify({ alice: 'write' }),
        STUB_PRS: '',
        STUB_PR_COMMENTS: '',
        STUB_PR_REVIEWS: '',
        STUB_RUN_LIST: '',
        STUB_JOBS: '',
        STUB_BUNDLES: '',
        STUB_LIST_DISPATCHED: '',
        HARNESS_TRIGGER_LOOKUP_SECS: '0',
        ...env,
      });
    },
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
const replies = (calls) => allComments(calls).filter((call) => /<!-- sdlc-harness event=reply /.test(call.body));
const dispatches = (calls) => calls.filter((call) => call.line.startsWith('workflow run '));

/** One inline comment, as the pull request's comments endpoint returns it. */
const inline = (id, fields = {}) => ({
  id,
  pull_request_review_id: REVIEW_ID,
  user: { login: 'alice', type: 'User' },
  html_url: `https://github.com/${REPOSITORY}/pull/12#discussion_r${id}`,
  path: `src/file_${id}.ts`,
  line: 10 + id,
  original_line: 10 + id,
  commit_id: `head${id}`,
  original_commit_id: `orig${id}`,
  body: `Comment ${id} body.`,
  diff_hunk: `@@ -1,3 +1,3 @@\n context\n-old ${id}\n+new ${id}`,
  created_at: `2026-01-02T00:00:0${id}Z`,
  ...fields,
});

/** One review, as the pull request's reviews endpoint returns it. */
const review = (id, login, fields = {}) => ({
  id,
  user: { login, type: 'User' },
  state: 'CHANGES_REQUESTED',
  body: `Review ${id} by ${login}.`,
  html_url: `https://github.com/${REPOSITORY}/pull/12#pullrequestreview-${id}`,
  submitted_at: `2026-01-02T00:00:0${id % 10}Z`,
  ...fields,
});

/** The marker line closing a round that consumed <reviews> and <comments>. */
const markerOf = (reviews, comments) =>
  new RegExp(`\\n<!-- sdlc-harness round collected_at=\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\dZ reviews=${reviews.join(',')} comments=${comments.join(',')} -->\\n$`);

/** Assert a started round: exit 0, `feat_x_review<suffix>.md` committed on origin, one dispatch, no reply. */
const assertRound = async (f, result, name = 'feat_x_review.md') => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(await f.originSubject('feat_x'), 'chore: add user review for feat_x');
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [REVIEW_DISPATCH]);
  assert.deepEqual(replies(calls), []);
  return f.originFile('feat_x', `${REVIEW_DIR}/${name}`);
};

/** Assert one refusal: exit 2, one reply naming @alice, no dispatch, origin unchanged. */
const assertRefused = async (f, result, before, pattern) => {
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  const posted = replies(calls);
  assert.equal(posted.length, 1, JSON.stringify(calls.map((call) => call.line)));
  assert.equal(allComments(calls).length, 1);
  assert.match(posted[0].body, /^@alice: `review` was not run: /);
  assert.match(posted[0].body, pattern);
  assert.equal(await f.originRefs(), before);
  return posted[0];
};

for (const state of ['changes_requested', 'CHANGES_REQUESTED']) {
  test(`a ${state} review with two inline comments places round 1 carrying both, and dispatches user_review once`, async (t) => {
    const f = await reviewFixture(t);
    const result = await f.control({ state, body: 'The button is not centred.\n\n  "quoted" $HOME `tick`' }, {
      STUB_PR_COMMENTS: JSON.stringify([inline(2), inline(1)]),
    });
    const round = await assertRound(f, result);
    assert.ok(round.startsWith('## Review by @alice\n\nThe button is not centred.\n\n  "quoted" $HOME `tick`\n\n'
      + `Requested changes on pull request #12 (${REVIEW_URL}) at 2026-01-02T03:04:05Z.\n`), round);
    assert.ok(!round.includes('\n---\n'), round);
    assert.ok(round.includes('\n## Inline comments\n'), round);
    assert.match(round, markerOf([REVIEW_ID], [1, 2]));
    for (const id of [1, 2]) {
      assert.ok(round.includes(`### \`src/file_${id}.ts\`, line ${10 + id}\n\nMade on commit \`orig${id}\`.\n`
        + `By @alice: https://github.com/${REPOSITORY}/pull/12#discussion_r${id}\n\nComment ${id} body.\n`), round);
      assert.ok(round.includes(`\`\`\`diff\n@@ -1,3 +1,3 @@\n context\n-old ${id}\n+new ${id}\n\`\`\`\n`), round);
    }
    assert.ok(round.indexOf('src/file_1.ts') < round.indexOf('src/file_2.ts'), 'sorted by created_at');
    const lines = f.calls().map((call) => call.line);
    assert.ok(lines.includes(`api --paginate repos/${REPOSITORY}/pulls/12/comments`), JSON.stringify(lines));
    assert.ok(lines.includes(`api --paginate repos/${REPOSITORY}/pulls/12/reviews`), JSON.stringify(lines));
    assert.ok(!lines.some((line) => /\/reviews\//.test(line)), JSON.stringify(lines));
    const note = allComments(f.calls()).find((call) => /event=round /.test(call.body));
    assert.ok(note?.body.includes(`Round 1 from pull request #12 (https://github.com/${REPOSITORY}/pull/12) by @alice`), note?.body);
  });
}

for (const state of ['approved', 'commented']) {
  test(`a review in state ${state} is ignored with no gh call`, async (t) => {
    const f = await reviewFixture(t);
    const before = await f.originRefs();
    const result = await f.control({ state });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /ignored/);
    assert.deepEqual(f.calls(), []);
    assert.equal(await f.originRefs(), before);
  });
}

test('an empty review body reads as no summary', async (t) => {
  const f = await reviewFixture(t);
  const round = await assertRound(f, await f.control({ body: '' }));
  assert.ok(round.startsWith('## Review by @alice\n\n(The review carries no summary.)\n\nRequested changes on pull request #12 '), round);
  assert.ok(!round.includes('## Inline comments'), round);
  assert.match(round, markerOf([REVIEW_ID], []));
});

test('an outdated comment reads original line <n> (outdated)', async (t) => {
  const f = await reviewFixture(t);
  const result = await f.control({}, { STUB_PR_COMMENTS: JSON.stringify([inline(1, { line: null, original_line: 7 })]) });
  const round = await assertRound(f, result);
  assert.ok(round.includes('### `src/file_1.ts`, original line 7 (outdated)\n'), round);
});

test("an authorised second reviewer's review body and inline comment are present", async (t) => {
  const f = await reviewFixture(t);
  const result = await f.control({}, {
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'admin' }),
    STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', { body: 'Bob requests.' })]),
    STUB_PR_COMMENTS: JSON.stringify([inline(1), inline(2, { pull_request_review_id: 5, user: { login: 'bob', type: 'User' }, body: 'Bob says so.' })]),
  });
  const round = await assertRound(f, result);
  assert.ok(round.includes('## Review by @bob\n\nBob requests.\n'), round);
  assert.ok(round.includes('Comment 1 body.'), round);
  assert.ok(round.includes(`By @bob: https://github.com/${REPOSITORY}/pull/12#discussion_r2\n\nBob says so.\n`), round);
  assert.match(round, markerOf([5, REVIEW_ID], [1, 2]));
});

test("an unauthorised commenter's review and inline comment are absent, with one line naming the login", async (t) => {
  const f = await reviewFixture(t);
  const result = await f.control({}, {
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', mallory: 'read' }),
    STUB_PR_REVIEWS: JSON.stringify([review(5, 'mallory', { body: 'Mallory requests.' })]),
    STUB_PR_COMMENTS: JSON.stringify([inline(1), inline(2, { user: { login: 'mallory', type: 'User' }, body: 'Mallory says so.' })]),
  });
  const round = await assertRound(f, result);
  assert.ok(round.includes('Comment 1 body.'), round);
  assert.ok(!round.includes('Mallory'), round);
  assert.ok(!round.includes('src/file_2.ts'), round);
  assert.match(round, markerOf([REVIEW_ID], [1]));
  assert.match(result.stdout, /dropped 2 item\(s\) by @mallory: GitHub reports the permission of @mallory as read/);
});

for (const [state, provenance] of [['COMMENTED', 'Commented on pull request #12'], ['APPROVED', 'Approved pull request #12']]) {
  test(`a review in state ${state} with a body rides along beside the review requesting changes, with its own provenance line`, async (t) => {
    const f = await reviewFixture(t);
    const result = await f.control({}, {
      STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
      STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', { state, body: 'Only a summary.' })]),
      STUB_PR_COMMENTS: JSON.stringify([inline(2, { pull_request_review_id: 5, user: { login: 'bob', type: 'User' }, body: 'Bob notes.' })]),
    });
    const round = await assertRound(f, result);
    assert.equal(round.match(/^## Review by @/gm)?.length, 2, round);
    assert.ok(round.startsWith('## Review by @bob\n\nOnly a summary.\n\n'
      + `${provenance} (https://github.com/${REPOSITORY}/pull/12#pullrequestreview-5) at 2026-01-02T00:00:05Z.\n`), round);
    assert.ok(round.includes(`Requested changes on pull request #12 (${REVIEW_URL}) at 2026-01-02T03:04:05Z.\n`), round);
    assert.ok(round.includes('Bob notes.'), round);
    assert.match(round, markerOf([5, REVIEW_ID], [2]));
    const note = allComments(f.calls()).find((call) => /event=round /.test(call.body));
    assert.ok(note?.body.includes('by @bob, @alice'), note?.body);
  });
}

for (const [name, fields] of [['with an empty body', { state: 'COMMENTED', body: '' }], ['with a whitespace-only body', { state: 'COMMENTED', body: ' \n\t' }], ['still a draft (PENDING)', { state: 'PENDING', body: 'A draft.' }]]) {
  test(`a review ${name} is no section and is not recorded`, async (t) => {
    const f = await reviewFixture(t);
    const result = await f.control({}, {
      STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
      STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', fields)]),
    });
    const round = await assertRound(f, result);
    assert.equal(round.match(/^## Review by @/gm)?.length, 1, round);
    assert.ok(!round.includes('@bob'), round);
    assert.match(round, markerOf([REVIEW_ID], []));
  });
}

test("a COMMENTED review an earlier round's marker records is absent", async (t) => {
  const f = await reviewFixture(t);
  await f.commitOn('feat_x', {
    [`${REVIEW_DIR}/feat_x_review.md`]: 'Round one.\n\n<!-- sdlc-harness round collected_at=2000-01-01T00:00:00Z reviews=5 comments= -->\n',
  }, 'chore: add user review for feat_x');
  const result = await f.control({}, {
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
    STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', { state: 'COMMENTED', body: 'Already taken.', submitted_at: '2100-01-01T00:00:00Z' })]),
  });
  const round = await assertRound(f, result, 'feat_x_review_2.md');
  assert.ok(!round.includes('Already taken.'), round);
  assert.match(round, markerOf([REVIEW_ID], []));
});

test('two reviews requesting changes become one round with two sections and one marker listing both', async (t) => {
  const f = await reviewFixture(t);
  const result = await f.control({}, {
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
    STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', { body: 'Bob requests.' })]),
  });
  const round = await assertRound(f, result);
  assert.equal(round.match(/^## Review by @/gm)?.length, 2, round);
  assert.ok(round.indexOf('## Review by @bob\n\nBob requests.\n') < round.indexOf('## Review by @alice\n'), 'oldest submitted_at first');
  assert.match(round, markerOf([5, REVIEW_ID], []));
  const note = allComments(f.calls()).find((call) => /event=round /.test(call.body));
  assert.ok(note?.body.includes('by @bob, @alice'), note?.body);
});

test("an id already recorded in a previous round's marker is absent", async (t) => {
  const f = await reviewFixture(t);
  await f.commitOn('feat_x', {
    [`${REVIEW_DIR}/feat_x_review.md`]: 'Round one.\n\n<!-- sdlc-harness round collected_at=2000-01-01T00:00:00Z reviews=5 comments=1 -->\n',
  }, 'chore: add user review for feat_x');
  const result = await f.control({}, {
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
    STUB_PR_REVIEWS: JSON.stringify([review(5, 'bob', { body: 'Bob requests.', submitted_at: '2100-01-01T00:00:00Z' })]),
    STUB_PR_COMMENTS: JSON.stringify([
      inline(1, { created_at: '2100-01-01T00:00:00Z', body: 'Recorded.' }),
      inline(2, { created_at: '2100-01-01T00:00:00Z' }),
    ]),
  });
  const round = await assertRound(f, result, 'feat_x_review_2.md');
  assert.ok(!round.includes('Bob requests.'), round);
  assert.ok(!round.includes('Recorded.'), round);
  assert.ok(round.includes('Comment 2 body.'), round);
  assert.match(round, markerOf([REVIEW_ID], [2]));
});

test('a review a marker already records, with nothing else pending, is answered with its round and places nothing', async (t) => {
  const f = await reviewFixture(t);
  await f.commitOn('feat_x', {
    [`${REVIEW_DIR}/feat_x_review.md`]: `Round one.\n\n<!-- sdlc-harness round collected_at=2000-01-01T00:00:00Z reviews=${REVIEW_ID} comments= -->\n`,
  }, 'chore: add user review for feat_x');
  const before = await f.originRefs();
  const result = await f.control();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  assert.equal(replies(calls).length, 1);
  assert.match(replies(calls)[0].body, /^@alice: your review is part of round 1 of `feat_x`/);
  assert.equal(await f.originRefs(), before);
});

test('a comment from before the marked boundary is absent, and one inside the overlap is present', async (t) => {
  const f = await reviewFixture(t);
  await f.commitOn('feat_x', {
    [`${REVIEW_DIR}/feat_x_review.md`]: 'Round one.\n\n<!-- sdlc-harness round collected_at=2026-01-02T00:00:00Z reviews=800 comments= -->\n',
  }, 'chore: add user review for feat_x');
  const result = await f.control({}, {
    STUB_PR_COMMENTS: JSON.stringify([
      inline(1, { pull_request_review_id: 800, created_at: '2026-01-01T23:50:00Z', body: 'Before the boundary.' }),
      inline(2, { pull_request_review_id: 801, created_at: '2026-01-01T23:56:00Z', body: 'Inside the overlap.' }),
    ]),
  });
  const round = await assertRound(f, result, 'feat_x_review_2.md');
  assert.ok(!round.includes('Before the boundary.'), round);
  assert.ok(round.includes('Inside the overlap.'), round);
});

test('with no marked round, a comment from before the previous round is absent, and one after it is present', async (t) => {
  const f = await reviewFixture(t);
  await f.commitOn('feat_x', { [`${REVIEW_DIR}/feat_x_review.md`]: 'Round one.\n' }, 'chore: add user review for feat_x');
  const result = await f.control({ submittedAt: '2100-01-01T00:00:00Z' }, {
    STUB_PR_COMMENTS: JSON.stringify([
      inline(1, { pull_request_review_id: 800, created_at: '2000-01-01T00:00:00Z', body: 'Before the round.' }),
      inline(2, { pull_request_review_id: 801, created_at: '2100-01-01T00:00:00Z', body: 'After the round.' }),
    ]),
  });
  const round = await assertRound(f, result, 'feat_x_review_2.md');
  assert.ok(!round.includes('Before the round.'), round);
  assert.ok(round.includes('After the round.'), round);
});

test('a hunk carrying a triple-backtick line is fenced with four backticks', async (t) => {
  const f = await reviewFixture(t);
  const hunk = '@@ -1,2 +1,2 @@\n-```js\n+```ts';
  const result = await f.control({}, { STUB_PR_COMMENTS: JSON.stringify([inline(1, { diff_hunk: hunk })]) });
  const round = await assertRound(f, result);
  assert.ok(round.includes(`\n\`\`\`\`diff\n${hunk}\n\`\`\`\`\n`), round);
});

test('with no run on GitHub at all, the round is placed and dispatched', async (t) => {
  const f = await reviewFixture(t);
  await assertRound(f, await f.control({}, { STUB_RUN_LIST: '[]' }));
});

test('a read reviewer is refused with a reply, and nothing is pushed', async (t) => {
  const f = await reviewFixture(t);
  const before = await f.originRefs();
  const result = await f.control({}, { STUB_PERMISSIONS: JSON.stringify({ alice: 'read' }) });
  await assertRefused(f, result, before, /permission of @alice as read/);
});

test('a head without the ledger is refused as not a harness branch', async (t) => {
  const f = await reviewFixture(t);
  await f.pushBranch('feat_y', { ledger: false });
  const before = await f.originRefs();
  await assertRefused(f, await f.control({ head: 'feat_y' }), before, /`feat_y` is not a harness branch/);
});

test('a head without the story index is refused: the round cannot start on it', async (t) => {
  const f = await reviewFixture(t);
  await f.pushBranch('feat_z', { story: false });
  const before = await f.originRefs();
  await assertRefused(f, await f.control({ head: 'feat_z' }), before,
    /`feat_z` carries no story index \(`sdlc-harness\/story_plans\/feat_z_story_plan\.md`\).*cannot start on this branch/);
});

/** A `run list` answer whose newest `harness run feat_x` run, 501, is `in_progress`. */
const IN_PROGRESS = JSON.stringify([{ databaseId: 501, displayTitle: 'harness run feat_x', status: 'in_progress', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/501' }]);

/** Assert the in-flight answer: exit 0, one reply matching <pattern>, no dispatch, origin unchanged. */
const assertAcknowledged = async (f, result, before, pattern) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  const posted = replies(calls);
  assert.equal(posted.length, 1, JSON.stringify(calls.map((call) => call.line)));
  assert.equal(allComments(calls).length, 1);
  assert.match(posted[0].body, pattern);
  assert.doesNotMatch(posted[0].body, /was not run|submit your review again/i);
  assert.equal(await f.originRefs(), before);
  return posted[0];
};

test('a review while the newest run is in progress is collected, not refused; nothing pushed or dispatched', async (t) => {
  const f = await reviewFixture(t);
  const before = await f.originRefs();
  const result = await f.control({}, { STUB_RUN_LIST: IN_PROGRESS });
  const reply = await assertAcknowledged(f, result, before, /^@alice: your review was collected\. `feat_x` is `running`; /);
  assert.match(reply.body, /the next user-review round starts by itself .* Nothing needs to be submitted again\./);
  assert.ok(f.calls().some((call) => call.line === 'api repos/{owner}/{repo}/actions/runs/501/jobs'), 'the run job was read');
});

test('a review already recorded in a round while the branch is in flight is answered with that round', async (t) => {
  const f = await reviewFixture(t);
  await f.commitOn('feat_x', {
    [`${REVIEW_DIR}/feat_x_review.md`]: `Round one.\n\n<!-- sdlc-harness round collected_at=2000-01-01T00:00:00Z reviews=${REVIEW_ID} comments= -->\n`,
  }, 'chore: add user review for feat_x');
  const before = await f.originRefs();
  const result = await f.control({}, { STUB_RUN_LIST: IN_PROGRESS });
  await assertAcknowledged(f, result, before, /^@alice: your review is part of round 1, which is `running` on `feat_x`\./);
});

test('a run whose run job has completed is read from its bundle: completed places the round', async (t) => {
  const f = await reviewFixture(t);
  const result = await f.control({}, {
    STUB_RUN_LIST: IN_PROGRESS,
    STUB_JOBS: JSON.stringify({ 501: [{ name: 'run', status: 'completed' }, { name: 'collect', status: 'in_progress' }] }),
    STUB_BUNDLES: JSON.stringify({ 501: { status: 'completed' } }),
  });
  await assertRound(f, result);
});

test('a run whose run job has completed parked is in flight, and the reply names the answer command', async (t) => {
  const f = await reviewFixture(t);
  const before = await f.originRefs();
  const result = await f.control({}, {
    STUB_RUN_LIST: IN_PROGRESS,
    STUB_JOBS: JSON.stringify({ 501: [{ name: 'run', status: 'completed' }] }),
    STUB_BUNDLES: JSON.stringify({ 501: { status: 'parked' } }),
  });
  const reply = await assertAcknowledged(f, result, before, /^@alice: your review was collected\. `feat_x` is `parked`; /);
  assert.match(reply.body, /comment `@sdlc-harness answer <n>`/);
});

test("review waits for its dispatch to be listed, finding the run by the pushed commit's headSha", async (t) => {
  const f = await reviewFixture(t);
  const result = await f.control({}, { STUB_LIST_DISPATCHED: '1' });
  await assertRound(f, result);
  assert.match(result.stdout, /^remote-run\.sh: the dispatched run of feat_x is listed: https:\/\/example\.test\/runs\/777$/m);
  assert.doesNotMatch(result.stdout, /::warning::/);
  const lines = f.calls().map((call) => call.line);
  const dispatched = lines.indexOf(REVIEW_DISPATCH);
  assert.ok(lines.slice(dispatched + 1).some((line) => line.startsWith('run list ') && line.includes('url,displayTitle,headSha')), JSON.stringify(lines));
});

test('a review of a cross-repository head is ignored with no gh call', async (t) => {
  const f = await reviewFixture(t);
  const before = await f.originRefs();
  const result = await f.control({ headRepo: 'mallory/fixture' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /ignored/);
  assert.deepEqual(f.calls(), []);
  assert.equal(await f.originRefs(), before);
});
