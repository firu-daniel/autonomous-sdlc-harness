/**
 * `remote-run.sh control`, the comment adapter: an `issue_comment` event becomes one harness action on
 * exactly one branch, through this script's own verbs run as children.
 *
 * **The rule these tests exist to enforce: only the handle as the first word of the first line is a
 * command, only a write-or-admin human `HARNESS_RUN_ACTORS` admits or a listed bot is obeyed, the
 * harness's own comments and every pull request from a fork are never acted on, and a refusal always
 * replies.** Each ignored shape is driven and asserted to call no `gh` at all; each refusal arm —
 * `HARNESS_REMOTE_STOP`, the coupling off, a `read` answer, a failed permission call, a writer the list
 * does not admit, `ghost`, an unlisted bot, an unknown verb, a fork, a head
 * without the ledger, a protected branch, an issue with no genuine start — is asserted to send no
 * `workflow run` and to post exactly one reply. On an issue, only a `github-actions[bot]` comment that
 * opens with the trigger's start sentence and ends with the `started` marker names the branch.
 *
 * The fixture is `remote-report.test.mjs`'s shape — `init`, `execution.target` `github-actions`, `forge`
 * `github`, the adopted tree pushed to the fixture's bare `origin`, and `feat_x` pushed carrying its task
 * prompt (naming issue 7) and its flow-progress ledger. `gh` is a stub reached through `HARNESS_GH_CLI`:
 * it logs each argument vector with the content of any `body=@<path>`, answers `pr view` from `STUB_PR`
 * (by default a same-repository `OPEN` pull request with head `feat_x`), `pr list` from `STUB_PRS`, the
 * paginated comment listing from `STUB_COMMENTS` (raw API objects, projected as the `--jq` asks), the
 * permission call from the `STUB_PERMISSIONS` table (`FAIL` exits 4), `run list` from `STUB_RUN_LIST` (by
 * default one `in_progress` `harness run <branch>` run), a run's artifact list from `STUB_ARTIFACTS`, a
 * `run download` by writing a status.json whose `status` is `STUB_BUNDLE_STATUS`, and the labels GET with
 * `[]`. `STUB_BUNDLE_FIELDS` adds fields to that status.json, and `STUB_BUNDLE_QUESTIONS` writes an open
 * `clarifications/feat_x/question_<n>.md` beside it for each <n>. No case reaches the network.
 *
 * `resume` and `clear` are asserted to send exactly the local relay's dispatch — `clear` alone adding
 * `park_loop_clear` — and to refuse every other state, and an unrecorded engine, with no `workflow run`.
 * `answer` is asserted to send one `resume=answer` dispatch carrying one entry, its text byte for byte
 * and never evaluated, to label the run `running` only when no other question stays open, and to refuse
 * a hold, an expired bundle, a job in progress, an unnamed or unknown index and an oversized payload.
 *
 * With a `harness stop feat_x` run newer than the newest `harness run feat_x` run in `STUB_RUN_LIST`,
 * every reply naming the state names it `stopped` — never `paused`, `parked` or `running` — while
 * `resume` on a stopped paused run, `answer` on a stopped parked one and `clear` on a stopped hold
 * still dispatch.
 *
 * `status` is asserted to reply once in every state — `running` and `none` included — naming the state
 * (`stopped` for a stopped run), the ledger's next entry and its section, each open question with its
 * answer form and the latest run, with no labels write and no `workflow run` in any case. A fully
 * ticked ledger is reported as ticked only when no user-review round commit (a whole-line subject match)
 * follows the ledger's last change and the run is not `running`.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const ISSUE_URL = `https://github.com/${REPOSITORY}/issues/7`;
const MARKER = (event, branch) => `<!-- sdlc-harness event=${event} branch=${branch} -->`;
const BOT = 'github-actions[bot]';
const PAUSE_DISPATCH = 'workflow run harness-run.yml --ref feat_x -f action=pause -f branch=feat_x';
const COMMENTS_JQ = '.[] | {login: .user.login, body: .body}';

const STUB = `#!/usr/bin/env node
const { appendFileSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
const fail = (why) => { process.stderr.write(why + '\\n'); process.exit(4); };
if (process.env.STUB_FAIL_ON && args.join(' ').startsWith(process.env.STUB_FAIL_ON)) fail('stub gh failure');
const permission = /^repos\\/[^/]+\\/[^/]+\\/collaborators\\/([^/]+)\\/permission$/.exec(args[1] ?? '');
if (args[0] === 'pr' && args[1] === 'view') {
  process.stdout.write(process.env.STUB_PR || JSON.stringify({ headRefName: 'feat_x', isCrossRepository: false, state: 'OPEN' }));
} else if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_PRS || '[]');
} else if (args[0] === 'api' && args[1] === '--paginate') {
  const jq = args[args.indexOf('--jq') + 1];
  if (jq !== ${JSON.stringify(COMMENTS_JQ)}) fail('unexpected --jq ' + jq);
  for (const c of JSON.parse(process.env.STUB_COMMENTS || '[]')) {
    process.stdout.write(JSON.stringify({ login: c.user.login, body: c.body }) + '\\n');
  }
} else if (args[0] === 'api' && permission) {
  const answer = JSON.parse(process.env.STUB_PERMISSIONS || '{}')[permission[1]];
  if (answer === undefined || answer === 'FAIL') fail('stub permission failure');
  process.stdout.write(JSON.stringify({ permission: answer }));
} else if (args[0] === 'api' && /\\/actions\\/runs\\/[0-9]+\\/artifacts$/.test(args[1] ?? '')) {
  process.stdout.write(process.env.STUB_ARTIFACTS || '{"artifacts":[]}');
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
} else if (args[0] === 'run' && args[1] === 'list') {
  const branch = args[args.indexOf('--branch') + 1];
  process.stdout.write(process.env.STUB_RUN_LIST
    || JSON.stringify([{ databaseId: 501, displayTitle: 'harness run ' + branch, status: 'in_progress', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/501' }]));
} else if (args[0] === 'run' && args[1] === 'download') {
  const dir = args[args.indexOf('-D') + 1];
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'status.json'), JSON.stringify({
    schema: '1', branch: 'feat_x', status: process.env.STUB_BUNDLE_STATUS || 'parked',
    ...JSON.parse(process.env.STUB_BUNDLE_FIELDS || '{}'),
  }));
  for (const n of (process.env.STUB_BUNDLE_QUESTIONS || '').split(' ').filter(Boolean)) {
    mkdirSync(join(dir, 'clarifications', 'feat_x'), { recursive: true });
    writeFileSync(join(dir, 'clarifications', 'feat_x', 'question_' + n + '.md'), 'Which one?\\n');
  }
}
`;

/**
 * An adopted fixture on `origin`, with `feat_x` pushed carrying its provenance line and its ledger.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string, ledger?: string }} [options]
 */
async function controlFixture(t, { forge = 'github', ledger: ledgerText = '# Progress\n' } = {}) {
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
  config.forge = forge;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  /** Push <branch> to origin with a task prompt naming issue 7 and, when <ledger>, its ledger. */
  const pushBranch = async (branch, { ledger = true } = {}) => {
    await runGit(dir, ['checkout', '--quiet', '-b', branch]);
    const files = [`${STATE_DIR}/task_prompts/${branch}_task_prompt.md`];
    mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
    writeFileSync(join(dir, files[0]), `# A task\n\nDo it.\n\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n`);
    if (ledger) {
      files.push(`${STATE_DIR}/flow_progress/${branch}_progress.md`);
      mkdirSync(join(dir, STATE_DIR, 'flow_progress'), { recursive: true });
      writeFileSync(join(dir, files[1]), ledgerText);
    }
    await runGit(dir, ['add', '--force', ...files]);
    await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', `fixture: ${branch}`]);
    const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `HEAD:refs/heads/${branch}`]);
    assert.equal(push.status, 0, push.stderr);
    await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);
  };
  await pushBranch('feat_x');

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');
  let events = 0;

  return {
    dir,
    defaultBranch: config.defaultBranch,
    runnerTemp,
    pushBranch,
    /**
     * Run `control` on one `issue_comment` event: by default `alice` (a `User`) creating <body> on
     * pull request 12.
     *
     * @param {string} body the comment body
     * @param {{ number?: number, pr?: boolean, action?: string, login?: string, type?: string }} [event]
     * @param {Record<string, string>} [env]
     */
    control: async (body, { number = 12, pr = true, action = 'created', login = 'alice', type = 'User' } = {}, env = {}) => {
      events += 1;
      const eventPath = join(stubDir, `event-${events}.json`);
      const issue = { number, ...(pr ? { pull_request: { url: `https://api.github.com/repos/${REPOSITORY}/pulls/${number}` } } : {}) };
      writeFileSync(eventPath, JSON.stringify({ action, comment: { body }, issue, sender: { login, type } }));
      return runBash(dir, [SCRIPT, 'control'], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_EVENT_NAME: 'issue_comment',
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        HARNESS_REMOTE_STOP: '',
        HARNESS_TRIGGER_ALLOWED_BOTS: '',
        HARNESS_RUN_ACTORS: '*',
        GITHUB_RUN_ATTEMPT: '',
        GITHUB_TRIGGERING_ACTOR: '',
        HARNESS_TRIGGER_LABEL: '',
        STUB_PERMISSIONS: JSON.stringify({ alice: 'write' }),
        STUB_PR: '',
        STUB_PRS: '',
        STUB_COMMENTS: '',
        STUB_RUN_LIST: '',
        STUB_ARTIFACTS: '',
        STUB_BUNDLE_STATUS: '',
        STUB_BUNDLE_FIELDS: '',
        STUB_BUNDLE_QUESTIONS: '',
        STUB_FAIL_ON: '',
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

const commentsOn = (calls, n) =>
  calls.filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/comments `));
const allComments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const replies = (calls) => allComments(calls).filter((call) => /<!-- sdlc-harness event=reply /.test(call.body));
const dispatches = (calls) => calls.filter((call) => call.line.startsWith('workflow run '));
const permissionCalls = (calls) => calls.filter((call) => /\/collaborators\//.test(call.line));

/** A genuine start comment by <login> for <branch>, as `trigger_finish` writes it. */
const startComment = (branch, login = BOT) => ({
  user: { login },
  body: `Started a harness run on the branch \`${branch}\`: https://example.test/runs/1\n\nThe task is this issue's title and body.\n\n${MARKER('started', branch)}\n`,
});

/** Assert one refusal: exit 2, one reply naming @alice, no dispatch. */
const assertRefused = (f, result, pattern) => {
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  const posted = replies(calls);
  assert.equal(posted.length, 1, JSON.stringify(calls.map((call) => call.line)));
  assert.equal(allComments(calls).length, 1);
  assert.match(posted[0].body, /was not run: /);
  if (pattern) assert.match(posted[0].body, pattern);
  return posted[0];
};

test('a write user\'s pause on a running run dispatches the pause and replies once naming @alice', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [PAUSE_DISPATCH]);
  const posted = commentsOn(calls, 12);
  assert.equal(allComments(calls).length, 1);
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, /^Pause requested by @alice; the run on `feat_x` yields at its next clean checkpoint, and a paused comment follows\.\n/);
  assert.ok(posted[0].body.endsWith(`\n\n${MARKER('reply', 'feat_x')}\n`), posted[0].body);
  assert.deepEqual(
    calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'view').map((call) => call.line),
    [`pr view 12 --repo ${REPOSITORY} --json headRefName,isCrossRepository,state`],
  );
});

test('the handle and verb match case-insensitively', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@SDLC-Harness PAUSE\r\nplease');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(dispatches(f.calls()).map((call) => call.line), [PAUSE_DISPATCH]);
  assert.equal(replies(f.calls()).length, 1);
});

for (const [name, body, event] of [
  ['a bare verb', 'pause', {}],
  ['a verb with words', 'pause this', {}],
  ['the handle mid-line', "Let's @sdlc-harness pause", {}],
  ['a quoted command', '> @sdlc-harness pause', {}],
  ['the handle on a later line', 'Thanks!\n@sdlc-harness pause', {}],
  ['a body carrying the marker', `@sdlc-harness pause\n\n${MARKER('reply', 'feat_x')}`, {}],
  ['an edited comment', '@sdlc-harness pause', { action: 'edited' }],
]) {
  test(`${name} is ignored with no gh call`, async (t) => {
    const f = await controlFixture(t);
    const result = await f.control(body, event);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(f.calls(), []);
    assert.match(result.stdout, /ignored/);
  });
}

test('a read answer is refused with one reply and no dispatch', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, { STUB_PERMISSIONS: JSON.stringify({ alice: 'read' }) });
  const reply = assertRefused(f, result, /permission of @alice as read/);
  assert.match(reply.body, /^@alice: `pause` was not run: /);
  assert.match(reply.body, /HARNESS_TRIGGER_ALLOWED_BOTS/);
});

test('a failed permission call is refused, never a pass', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, { STUB_PERMISSIONS: JSON.stringify({ alice: 'FAIL' }) });
  assertRefused(f, result, /permission check for @alice failed/);
});

test('a write commenter HARNESS_RUN_ACTORS does not admit is refused naming the list', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', { login: 'bob' }, {
    HARNESS_RUN_ACTORS: 'alice',
    STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'write' }),
  });
  const reply = assertRefused(f, result, /@bob is not on the repository variable HARNESS_RUN_ACTORS/);
  assert.match(reply.body, /^@bob: `pause` was not run: /);
  assert.match(reply.body, /whom the repository variable `HARNESS_RUN_ACTORS` admits \(when unset, the owner alone of a repository a personal account owns, and nobody in an organisation-owned one\)/);
});

test('HARNESS_RUN_ACTORS entries are trimmed and matched case-insensitively', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, { HARNESS_RUN_ACTORS: ' ALICE ' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(dispatches(f.calls()).map((call) => call.line), [PAUSE_DISPATCH]);
});

test('a re-run of a command by a person HARNESS_RUN_ACTORS does not admit is refused', async (t) => {
  const rerun = { HARNESS_RUN_ACTORS: 'alice', GITHUB_RUN_ATTEMPT: '2' };

  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'bob' });
  assertRefused(f, result, /re-run by @bob/);
  assert.deepEqual(permissionCalls(f.calls()), []);

  const g = await controlFixture(t);
  const listed = await g.control('@sdlc-harness pause', {}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'alice' });
  assert.equal(listed.status, 0, `${listed.stdout}\n${listed.stderr}`);
  assert.deepEqual(dispatches(g.calls()).map((call) => call.line), [PAUSE_DISPATCH]);
});

test('ghost is refused', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', { login: 'ghost' });
  assertRefused(f, result, /does not name/);
  assert.deepEqual(permissionCalls(f.calls()), []);
});

test('an unlisted bot is refused with no permission call', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', { login: 'renovate[bot]', type: 'Bot' });
  assertRefused(f, result, /not listed in HARNESS_TRIGGER_ALLOWED_BOTS/);
  assert.deepEqual(permissionCalls(f.calls()), []);
});

test('HARNESS_REMOTE_STOP refuses every command', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, { HARNESS_REMOTE_STOP: '1' });
  assertRefused(f, result, /HARNESS_REMOTE_STOP/);
  assert.deepEqual(permissionCalls(f.calls()), []);
});

test('forge none is refused before any permission call', async (t) => {
  const f = await controlFixture(t, { forge: 'none' });
  const result = await f.control('@sdlc-harness pause');
  assertRefused(f, result, /`forge` set to `github` \(it is none\)/);
  assert.deepEqual(permissionCalls(f.calls()), []);
});

test('an unknown verb gets a reply listing the six commands', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness merge');
  const reply = assertRefused(f, result);
  assert.match(reply.body, /^@alice: `merge` was not run: /);
  for (const command of ['answer [<n>]', 'pause', 'resume', 'stop', 'clear', 'status']) {
    assert.ok(reply.body.includes(`\`@sdlc-harness ${command}\``), command);
  }
  assert.match(reply.body, /docs\/github-run-control\.md/);
});

test('a cross-repository pull request is refused', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, {
    STUB_PR: JSON.stringify({ headRefName: 'feat_x', isCrossRepository: true, state: 'OPEN' }),
  });
  assertRefused(f, result, /from a fork/);
  assert.equal(f.calls().filter((call) => call.args[0] === 'run').length, 0);
});

test('a closed pull request is refused', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, {
    STUB_PR: JSON.stringify({ headRefName: 'feat_x', isCrossRepository: false, state: 'CLOSED' }),
  });
  assertRefused(f, result, /is CLOSED, not open/);
});

test('a pull request whose head carries no ledger is not a harness branch', async (t) => {
  const f = await controlFixture(t);
  await f.pushBranch('feat_y', { ledger: false });
  const result = await f.control('@sdlc-harness pause', {}, {
    STUB_PR: JSON.stringify({ headRefName: 'feat_y', isCrossRepository: false, state: 'OPEN' }),
  });
  assertRefused(f, result, /`feat_y` is not a harness branch/);
});

test('on an issue, a github-actions[bot] genuine start names the branch', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', { number: 7, pr: false }, {
    STUB_COMMENTS: JSON.stringify([startComment('feat_x')]),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [PAUSE_DISPATCH]);
  assert.equal(commentsOn(calls, 7).length, 1);
  assert.ok(calls.some((call) => call.line === `api --paginate repos/${REPOSITORY}/issues/7/comments --jq ${COMMENTS_JQ}`));
  assert.equal(calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'view').length, 0);
});

test('on an issue, the same start comment by anyone else is never trusted', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', { number: 7, pr: false }, {
    STUB_COMMENTS: JSON.stringify([startComment('feat_x', 'mallory')]),
  });
  assertRefused(f, result, /no harness run was started from this issue/);
});

test('a quoted marker mid-body, and a marker after another sentence, are both ignored', async (t) => {
  const f = await controlFixture(t);
  const evil = MARKER('started', 'feat_evil');
  const result = await f.control('@sdlc-harness pause', { number: 7, pr: false }, {
    STUB_COMMENTS: JSON.stringify([
      startComment('feat_x'),
      { user: { login: BOT }, body: `Started a harness run on the branch \`feat_evil\`: quoted\n\n${evil}\n\nmore text after it\n${MARKER('parked', 'feat_x')}\n` },
      { user: { login: BOT }, body: `The run on \`feat_x\` is waiting for an answer.\n\n${evil}\n` },
    ]),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [PAUSE_DISPATCH]);
  assert.ok(!calls.some((call) => call.line.includes('feat_evil')));
});

test('an issue whose genuine start names a protected branch is refused', async (t) => {
  const f = await controlFixture(t);
  // The fixture's default branch, always in the protected set; its name follows the host's git.
  const protectedBranch = f.defaultBranch;
  const result = await f.control('@sdlc-harness pause', { number: 7, pr: false }, {
    STUB_COMMENTS: JSON.stringify([startComment(protectedBranch)]),
  });
  const reply = assertRefused(f, result);
  assert.ok(reply.body.includes(`\`${protectedBranch}\` is a protected branch`), reply.body);
});

test('an issue whose genuine start names a branch without the ledger is refused', async (t) => {
  const f = await controlFixture(t);
  await f.pushBranch('feat_y', { ledger: false });
  const result = await f.control('@sdlc-harness pause', { number: 7, pr: false }, {
    STUB_COMMENTS: JSON.stringify([startComment('feat_y')]),
  });
  assertRefused(f, result, /`feat_y` is not a harness branch/);
});

test('stop on a pull request: the marker, the cancel, the stopped comment and a reply, each naming @alice', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness stop', {}, {
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  const lines = calls.map((call) => call.line);
  const marker = lines.indexOf('workflow run harness-run.yml --ref feat_x -f action=stop -f branch=feat_x');
  const cancel = lines.indexOf('run cancel 501');
  assert.ok(marker >= 0 && cancel > marker, JSON.stringify(lines));
  const posted = commentsOn(calls, 12);
  assert.equal(posted.length, 2);
  assert.match(posted[0].body, /Stopped by @alice\./);
  assert.ok(posted[0].body.endsWith(`${MARKER('stopped', 'feat_x')}\n`));
  assert.match(posted[1].body, /^Stop requested by @alice; the run on `feat_x` is stopped\./);
  assert.ok(posted[1].body.endsWith(`${MARKER('reply', 'feat_x')}\n`));
  assert.ok(lines.indexOf(posted[0].line) > cancel);
});

test('stop typed on the issue posts stopped on the pull request and the reply on the issue', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness stop', { number: 7, pr: false }, {
    STUB_COMMENTS: JSON.stringify([startComment('feat_x')]),
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  const onPr = commentsOn(calls, 12);
  const onIssue = commentsOn(calls, 7);
  assert.equal(onPr.length, 1);
  assert.match(onPr[0].body, /Stopped by @alice\./);
  assert.equal(onIssue.length, 1);
  assert.match(onIssue[0].body, /@alice/);
  assert.match(onIssue[0].body, /`feat_x`/);
  assert.ok(onIssue[0].body.endsWith(`${MARKER('reply', 'feat_x')}\n`));
});

test('stop with no run on the branch is refused', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness stop', {}, { STUB_RUN_LIST: '[]' });
  assertRefused(f, result, /no harness run on `feat_x`/);
});

test('pause on a parked run is refused naming parked, with no dispatch', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, {
    STUB_RUN_LIST: JSON.stringify([{ databaseId: 601, displayTitle: 'harness run feat_x', status: 'completed', conclusion: 'success', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/601' }]),
    STUB_ARTIFACTS: JSON.stringify({ artifacts: [{ name: 'harness-state', expired: false }] }),
    STUB_BUNDLE_STATUS: 'parked',
  });
  assertRefused(f, result, /only a running run can be paused, and the run on `feat_x` is `parked`/);
  assert.deepEqual(readdirNames(f.runnerTemp), []);
});

test('a pause whose dispatch fails replies naming the failure and exits 3', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness pause', {}, { STUB_FAIL_ON: 'workflow run' });
  assert.equal(result.status, 3, `${result.stdout}\n${result.stderr}`);
  const posted = replies(f.calls());
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, /stub gh failure/);
});

test('a reply that cannot be posted is an ::error:: line and exit 3', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness merge', {}, { STUB_FAIL_ON: `api --method POST repos/${REPOSITORY}/issues/12/comments` });
  assert.equal(result.status, 3);
  assert.match(result.stdout, /::error::remote-run\.sh: control: the reply on #12 could not be posted/);
});

test('another event name, or an unreadable event file, exits 1 with no gh call', async (t) => {
  const f = await controlFixture(t);
  const other = await f.control('@sdlc-harness pause', {}, { GITHUB_EVENT_NAME: 'push' });
  assert.equal(other.status, 1);
  const missing = await f.control('@sdlc-harness pause', {}, { GITHUB_EVENT_PATH: join(f.dir, 'nope.json') });
  assert.equal(missing.status, 1);
  assert.deepEqual(f.calls(), []);
});

const RESUME_DISPATCH = 'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=pause -f chain=0';
const CLEAR_DISPATCH = 'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=pause -f park_loop_clear=true -f chain=0';

/** The environment of a completed `harness run feat_x` run whose bundle carries <status> and <fields>. */
const finishedRun = (status, fields = {}, questions = '') => ({
  STUB_RUN_LIST: JSON.stringify([{ databaseId: 601, displayTitle: 'harness run feat_x', status: 'completed', conclusion: 'success', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/601' }]),
  STUB_ARTIFACTS: JSON.stringify({ artifacts: [{ name: 'harness-state', expired: false }] }),
  STUB_BUNDLE_STATUS: status,
  STUB_BUNDLE_FIELDS: JSON.stringify(fields),
  STUB_BUNDLE_QUESTIONS: questions,
  STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
});

/** Assert a sent resume: exit 0, <dispatch> alone, one reply matching <pattern>, `running` on 7 and 12. */
const assertResumed = (f, result, dispatch, pattern) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [dispatch]);
  const posted = replies(calls);
  assert.equal(posted.length, 1);
  assert.equal(allComments(calls).length, 1);
  assert.match(posted[0].body, pattern);
  for (const n of [7, 12]) {
    assert.ok(
      calls.some((call) => call.line === `api --method POST repos/${REPOSITORY}/issues/${n}/labels -f labels[]=sdlc-harness: running`),
      `${n}: ${JSON.stringify(calls.map((call) => call.line))}`,
    );
  }
  const lines = calls.map((call) => call.line);
  assert.ok(lines.indexOf(posted[0].line) > lines.indexOf(dispatch));
};

test('resume on a paused run sends the relay\'s dispatch, replies naming @alice and labels it running', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume', {}, finishedRun('paused', { pause_reason: 'user', engine: 'task' }));
  assertResumed(f, result, RESUME_DISPATCH, /^Resume requested by @alice: `feat_x` continues from its committed ledger\.\n/);
});

test('resume on a run paused as expired is dispatched the same way', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume', {}, finishedRun('paused', { pause_reason: 'expired', engine: 'task' }));
  assertResumed(f, result, RESUME_DISPATCH, /^Resume requested by @alice/);
});

test('resume on a park-loop hold is refused pointing at clear', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume', {}, finishedRun('park_loop', { engine: 'task' }));
  assertRefused(f, result, /`@sdlc-harness clear`/);
});

test('clear on a park-loop hold sends the same dispatch with park_loop_clear', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness clear', {}, finishedRun('park_loop', { engine: 'task' }));
  assertResumed(f, result, CLEAR_DISPATCH, /^Park-loop hold on `feat_x` cleared by @alice; the run resumes from its committed ledger\.\n/);
});

test('resume on a parked run is refused naming answer and the open index', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume', {}, finishedRun('parked', { engine: 'task' }, '2'));
  const reply = assertRefused(f, result, /`@sdlc-harness answer <n>`/);
  assert.match(reply.body, /open: 2\)/);
});

test('resume with no recorded engine is refused naming the Run workflow form', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume', {}, finishedRun('paused', { pause_reason: 'user' }));
  const reply = assertRefused(f, result, /\*\*Run workflow\*\* form/);
  assert.match(reply.body, /resume pause/);
});

test('clear on a paused run is refused, with no dispatch', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness clear', {}, finishedRun('paused', { pause_reason: 'user', engine: 'task' }));
  assertRefused(f, result, /no park-loop hold to clear: the run on `feat_x` is `paused`/);
});

test('resume on a running run is refused as already running', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume');
  assertRefused(f, result, /already `running`/);
});

test('a resume whose dispatch fails replies naming the failure and exits 3', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume', {}, {
    ...finishedRun('paused', { pause_reason: 'user', engine: 'task' }),
    STUB_FAIL_ON: 'workflow run',
  });
  assert.equal(result.status, 3, `${result.stdout}\n${result.stderr}`);
  const posted = replies(f.calls());
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, /stub gh failure/);
  assert.ok(!f.calls().some((call) => /\/labels -f labels\[\]=/.test(call.line)));
});

const ANSWER_DISPATCH = (answers) =>
  `workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=answer -f answers=${JSON.stringify(answers)} -f chain=0`;
const parkedRun = (questions) => finishedRun('parked', { engine: 'task' }, questions);

test('answer with lines below and one open question sends them, replies that it resumes and labels it running', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer\r\nUse A.\r\nBecause it is smaller.\n', {}, parkedRun('1'));
  assertResumed(f, result, ANSWER_DISPATCH({ 1: 'Use A.\nBecause it is smaller.\n' }),
    /^Answer to question 1 received from @alice; every open question is answered, so `feat_x` resumes\.\n/);
  assert.deepEqual(readdirNames(f.runnerTemp), []);
});

test('answer 1 with a short answer on the first line sends that answer', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 1 Use B.', {}, parkedRun('1'));
  assertResumed(f, result, ANSWER_DISPATCH({ 1: 'Use B.' }), /^Answer to question 1 received from @alice/);
});

test('answer with no index and two open questions is refused listing both', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer\nUse B.', {}, parkedRun('1 2'));
  const reply = assertRefused(f, result, /questions 1, 2 are open, so the command must name one/);
  assert.match(reply.body, /`@sdlc-harness answer 1`, `@sdlc-harness answer 2`/);
});

test('answer 2 with two open is sent, names question 1 as still open and leaves the label', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 2\nUse B.', {}, parkedRun('1 2'));
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls).map((call) => call.line), [ANSWER_DISPATCH({ 2: 'Use B.' })]);
  const posted = replies(calls);
  assert.equal(posted.length, 1);
  assert.match(posted[0].body,
    /^Answer to question 2 received from @alice and sent; question\(s\) 1 still need an answer: `@sdlc-harness answer 1`\.\n/);
  assert.ok(!calls.some((call) => /\/labels -f labels\[\]=/.test(call.line)), JSON.stringify(calls.map((call) => call.line)));
});

test('answer 3 is refused naming the open set', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 3\nUse B.', {}, parkedRun('1 2'));
  assertRefused(f, result, /question 3 is not open; the open questions are 1, 2/);
});

test('an empty answer is refused', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 1\n  \n', {}, parkedRun('1'));
  assertRefused(f, result, /the answer is empty/);
});

test('answer on a park-loop hold is refused naming clear', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 1\nUse B.', {}, finishedRun('park_loop', { engine: 'task' }, '1'));
  assertRefused(f, result, /`@sdlc-harness clear`/);
});

test('answer on an expired bundle is refused naming the expiry, never as no park', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 1\nUse B.', {}, {
    ...parkedRun('1'),
    STUB_ARTIFACTS: JSON.stringify({ artifacts: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] }),
  });
  const reply = assertRefused(f, result, /expired on 2026-01-02T00:00:00Z/);
  assert.match(reply.body, /can no longer be answered here/);
  assert.match(reply.body, /`@sdlc-harness resume`/);
});

test('answer while a job is in progress is refused naming the run', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness answer 1\nUse B.');
  assertRefused(f, result, /in progress \(https:\/\/example\.test\/runs\/501\)/);
});

test('an answer over the payload limit is refused naming the limit', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control(`@sdlc-harness answer\n${'a'.repeat(70000)}`, {}, parkedRun('1'));
  const reply = assertRefused(f, result, /workflow_dispatch limit of 65535/);
  assert.match(reply.body, /Shorten the answer, or commit it to a file on `feat_x`/);
});

test('an answer carrying a command substitution and a backtick is sent byte for byte and never run', async (t) => {
  const f = await controlFixture(t);
  const answer = 'Run `$(touch pwned)` and "$HOME"\\n `x';
  const result = await f.control(`@sdlc-harness answer\n${answer}`, {}, parkedRun('1'));
  assertResumed(f, result, ANSWER_DISPATCH({ 1: answer }), /^Answer to question 1 received from @alice/);
  assert.ok(!existsSync(join(f.dir, 'pwned')));
});

/** A `harness stop feat_x` run newer than every `harness run feat_x` run the cases below list. */
const STOP_RUN = { databaseId: 700, displayTitle: 'harness stop feat_x', status: 'completed', conclusion: 'success', createdAt: '2026-01-01T01:00:00Z', url: 'https://example.test/runs/700' };

/** <env> with STOP_RUN added to its run list. */
const stopped = (env) => ({ ...env, STUB_RUN_LIST: JSON.stringify([STOP_RUN, ...JSON.parse(env.STUB_RUN_LIST)]) });

/** A newest `harness run feat_x` run still `in_progress`, created before STOP_RUN. */
const CANCELLING = {
  STUB_RUN_LIST: JSON.stringify([{ databaseId: 501, displayTitle: 'harness run feat_x', status: 'in_progress', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/501' }]),
};

test('a stopped run whose bundle reads running (paused, killed) is named stopped by pause and answer; resume still dispatches', async (t) => {
  const env = stopped(finishedRun('running', { engine: 'task' }));
  const f = await controlFixture(t);
  const pause = assertRefused(f, await f.control('@sdlc-harness pause', {}, env), /the run on `feat_x` is `stopped`\. /);
  assert.match(pause.body, /Comment `@sdlc-harness resume` to continue it from its committed ledger\./);
  assert.doesNotMatch(pause.body, /`paused`/);

  const g = await controlFixture(t);
  const answer = assertRefused(g, await g.control('@sdlc-harness answer 1\nUse B.', {}, env), /the run on `feat_x` is `stopped`\. /);
  assert.match(answer.body, /`@sdlc-harness resume`/);
  assert.doesNotMatch(answer.body, /`paused`/);

  const h = await controlFixture(t);
  assertResumed(h, await h.control('@sdlc-harness resume', {}, env), RESUME_DISPATCH, /^Resume requested by @alice/);
});

test('a stopped parked run is named stopped by pause and resume, and an answer resumes it', async (t) => {
  const env = stopped(parkedRun('1'));
  for (const verb of ['pause', 'resume']) {
    const f = await controlFixture(t);
    const reply = assertRefused(f, await f.control(`@sdlc-harness ${verb}`, {}, env),
      /the run on `feat_x` is `stopped` \(it was parked, waiting for an answer, open: 1\)/);
    assert.match(reply.body, /`@sdlc-harness answer <n>`.*; the answer resumes it\./);
    assert.doesNotMatch(reply.body, /`parked`/);
  }
  const f = await controlFixture(t);
  assertResumed(f, await f.control('@sdlc-harness answer 1\nUse A.', {}, env), ANSWER_DISPATCH({ 1: 'Use A.' }),
    /^Answer to question 1 received from @alice; every open question is answered, so the stopped run on `feat_x` resumes\.\n/);
});

test('a stopped park-loop hold is named stopped by resume, and clear resumes it', async (t) => {
  const env = stopped(finishedRun('park_loop', { engine: 'task' }));
  const f = await controlFixture(t);
  const reply = assertRefused(f, await f.control('@sdlc-harness resume', {}, env),
    /the run on `feat_x` is `stopped` \(it was held by the park-loop guard\)/);
  assert.match(reply.body, /`@sdlc-harness clear`/);
  const g = await controlFixture(t);
  assertResumed(g, await g.control('@sdlc-harness clear', {}, env), CLEAR_DISPATCH,
    /^Park-loop hold on `feat_x` cleared by @alice; the stopped run resumes from its committed ledger\.\n/);
});

test('a stopped run whose cancelled job is still in progress is named stopped by pause and resume, never running', async (t) => {
  const env = stopped(CANCELLING);
  for (const verb of ['pause', 'resume']) {
    const f = await controlFixture(t);
    const reply = assertRefused(f, await f.control(`@sdlc-harness ${verb}`, {}, env),
      /the run on `feat_x` is `stopped`; its cancelled job is still finishing\. Comment `@sdlc-harness resume` once it has ended\./);
    assert.doesNotMatch(reply.body, /`running`/);
  }
});

test('without a stop run, pause names a paused run paused and resume names a parked run parked', async (t) => {
  const f = await controlFixture(t);
  assertRefused(f, await f.control('@sdlc-harness pause', {}, finishedRun('paused', { pause_reason: 'user', engine: 'task' })),
    /only a running run can be paused, and the run on `feat_x` is `paused`/);
  const g = await controlFixture(t);
  const reply = assertRefused(g, await g.control('@sdlc-harness resume', {}, parkedRun('1')), /is `parked`, waiting for an answer/);
  assert.doesNotMatch(reply.body, /`stopped`/);
});

const STATUS_LEDGER = '# Progress\n\n## Phase A\n\n- [x] Plan the story\n\n## Phase B\n\n- [x] Task 1\n- [ ] Task 2 — write the reply\n- [ ] Task 3\n';

/** Assert one `status` reply: exit 0, one comment, no labels write and no `workflow run`. */
const assertStatus = (f, result) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  assert.ok(!calls.some((call) => /\/labels( |$)/.test(call.line) && call.args.includes('--method')), JSON.stringify(calls.map((call) => call.line)));
  const posted = replies(calls);
  assert.equal(posted.length, 1);
  assert.equal(allComments(calls).length, 1);
  assert.doesNotMatch(posted[0].body, /was not run: /);
  return posted[0].body;
};

test('status on a parked run names parked, question 1 with its answer form, the next ledger entry and the run', async (t) => {
  const f = await controlFixture(t, { ledger: STATUS_LEDGER });
  const body = assertStatus(f, await f.control('@sdlc-harness status', {}, parkedRun('1')));
  assert.match(body, /^@alice: `feat_x` is `parked`\./);
  assert.match(body, /Next in the flow-progress ledger: Task 2 — write the reply \(under `Phase B`\)/);
  assert.match(body, /Open questions: 1 \(`@sdlc-harness answer 1`\)/);
  assert.match(body, /Latest run: https:\/\/example\.test\/runs\/601/);
  assert.deepEqual(readdirNames(f.runnerTemp), []);
});

test('status on a running run is answered, never refused', async (t) => {
  const f = await controlFixture(t, { ledger: STATUS_LEDGER });
  const body = assertStatus(f, await f.control('@sdlc-harness status'));
  assert.match(body, /^@alice: `feat_x` is `running`\./);
  assert.match(body, /Latest run: https:\/\/example\.test\/runs\/501/);
});

test('status with no run listed says so, and a fully ticked ledger says every entry is ticked', async (t) => {
  const f = await controlFixture(t, { ledger: '# Progress\n\n## Phase A\n\n- [x] Plan\n' });
  const body = assertStatus(f, await f.control('@sdlc-harness status', {}, { STUB_RUN_LIST: '[]' }));
  assert.match(body, /^@alice: no harness run is listed for `feat_x`\./);
  assert.match(body, /Every entry of the flow-progress ledger is ticked\./);
  assert.doesNotMatch(body, /Latest run: /);
});

const TICKED_LEDGER = '# Progress\n\n## Phase A\n\n- [x] Plan\n';
const ROUND_STARTED = /A user-review round has started on `feat_x`, and its flow-progress ledger is not written yet\./;
const STILL_RUNNING = /The run is still running, and its flow-progress ledger has no open entry: it is finishing its last step, or a new stage has not written its ledger yet\./;

/**
 * Push commits onto origin's `feat_x`, in order: a string is an empty commit with that subject, and
 * `{ ledger }` rewrites the flow-progress ledger to that text.
 *
 * @param {{ dir: string, defaultBranch: string }} f
 * @param {(string | { ledger: string })[]} commits
 */
async function pushOntoFeatX(f, commits) {
  await runGit(f.dir, ['checkout', '--quiet', 'feat_x']);
  for (const commit of commits) {
    if (typeof commit === 'string') {
      await runGit(f.dir, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', commit]);
    } else {
      const rel = `${STATE_DIR}/flow_progress/feat_x_progress.md`;
      writeFileSync(join(f.dir, rel), commit.ledger);
      await runGit(f.dir, ['add', '--force', rel]);
      await runGit(f.dir, ['commit', '--quiet', '--no-verify', '-m', 'chore: Add flow-progress ledger for feat_x']);
    }
  }
  const push = await runGit(f.dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);
  await runGit(f.dir, ['checkout', '--quiet', f.defaultBranch]);
}

test('status on a running run whose round commit follows a ticked ledger names the round, never every entry ticked', async (t) => {
  const f = await controlFixture(t, { ledger: TICKED_LEDGER });
  await pushOntoFeatX(f, ['chore: add user review for feat_x']);
  const body = assertStatus(f, await f.control('@sdlc-harness status'));
  assert.match(body, /^@alice: `feat_x` is `running`\./);
  assert.match(body, ROUND_STARTED);
  assert.doesNotMatch(body, /Every entry of the flow-progress ledger is ticked/);
});

test('status on a running run with a ticked ledger and no round commit says it is still running', async (t) => {
  const f = await controlFixture(t, { ledger: TICKED_LEDGER });
  const body = assertStatus(f, await f.control('@sdlc-harness status'));
  assert.match(body, STILL_RUNNING);
  assert.doesNotMatch(body, /every entry .* is ticked/i);
  assert.doesNotMatch(body, ROUND_STARTED);
});

test('status reads a ledger written after the round commit as it reads any ledger', async (t) => {
  const f = await controlFixture(t, { ledger: TICKED_LEDGER });
  await pushOntoFeatX(f, ['chore: add user review for feat_x', { ledger: STATUS_LEDGER }]);
  const open = assertStatus(f, await f.control('@sdlc-harness status'));
  assert.match(open, /Next in the flow-progress ledger: Task 2 — write the reply \(under `Phase B`\)/);
  assert.doesNotMatch(open, ROUND_STARTED);

  const g = await controlFixture(t, { ledger: STATUS_LEDGER });
  await pushOntoFeatX(g, ['chore: add user review for feat_x', { ledger: TICKED_LEDGER }]);
  const ticked = assertStatus(g, await g.control('@sdlc-harness status', {}, finishedRun('paused', { engine: 'task' })));
  assert.match(ticked, /`feat_x` is `paused`/);
  assert.match(ticked, /Every entry of the flow-progress ledger is ticked\./);
  assert.doesNotMatch(ticked, ROUND_STARTED);
});

test('status does not take a subject that only contains the round text for the round commit', async (t) => {
  const f = await controlFixture(t, { ledger: TICKED_LEDGER });
  await pushOntoFeatX(f, ['chore: add user review for feat_x_2', 'see chore: add user review for feat_x']);
  const body = assertStatus(f, await f.control('@sdlc-harness status'));
  assert.doesNotMatch(body, ROUND_STARTED);
  assert.match(body, STILL_RUNNING);
});

test('status on an expired bundle reports the expiry, never an absent run', async (t) => {
  const f = await controlFixture(t);
  const body = assertStatus(f, await f.control('@sdlc-harness status', {}, {
    ...parkedRun('1'),
    STUB_ARTIFACTS: JSON.stringify({ artifacts: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] }),
  }));
  assert.match(body, /`feat_x` is `paused` \(`expired`\): the state bundle of run 601 expired on 2026-01-02T00:00:00Z/);
});

test('status names a stopped run stopped, whether its bundle says running or parked', async (t) => {
  const f = await controlFixture(t);
  const running = assertStatus(f, await f.control('@sdlc-harness status', {}, stopped(finishedRun('running', { engine: 'task' }))));
  assert.match(running, /`feat_x` is `stopped`/);
  assert.doesNotMatch(running, /`paused`/);

  const g = await controlFixture(t);
  const parked = assertStatus(g, await g.control('@sdlc-harness status', {}, stopped(parkedRun('1'))));
  assert.match(parked, /`feat_x` is `stopped`; it was parked, waiting for an answer\./);
  assert.match(parked, /Open questions: 1 \(`@sdlc-harness answer 1`\)/);
  assert.doesNotMatch(parked, /`parked`/);
});

test('status whose state read fails is refused with exit 3', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness status', {}, { STUB_FAIL_ON: 'run list' });
  assert.equal(result.status, 3, `${result.stdout}\n${result.stderr}`);
  const posted = replies(f.calls());
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, /^@alice: `status` was not run: the state of the run on `feat_x` could not be read/);
  assert.deepEqual(dispatches(f.calls()), []);
});

/** The entries of <dir>, for asserting that control removed what it created there. */
function readdirNames(dir) {
  return existsSync(dir) ? readdirSync(dir) : [];
}
