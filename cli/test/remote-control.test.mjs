/**
 * `remote-run.sh control`, the comment adapter: an `issue_comment` event becomes one harness action on
 * exactly one branch, through this script's own verbs run as children.
 *
 * **The rule these tests exist to enforce: only the handle as the first word of the first line is a
 * command, only a write-or-admin human or a listed bot is obeyed, the harness's own comments and every
 * pull request from a fork are never acted on, and a refusal always replies.** Each ignored shape is
 * driven and asserted to call no `gh` at all; each refusal arm — `HARNESS_REMOTE_STOP`, the coupling off,
 * a `read` answer, a failed permission call, `ghost`, an unlisted bot, an unknown verb, a fork, a head
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
 * `[]`. No case reaches the network.
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
  writeFileSync(join(dir, 'status.json'), JSON.stringify({ schema: '1', branch: 'feat_x', status: process.env.STUB_BUNDLE_STATUS || 'parked' }));
}
`;

/**
 * An adopted fixture on `origin`, with `feat_x` pushed carrying its provenance line and its ledger.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string }} [options]
 */
async function controlFixture(t, { forge = 'github' } = {}) {
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
      writeFileSync(join(dir, files[1]), '# Progress\n');
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
        HARNESS_TRIGGER_LABEL: '',
        STUB_PERMISSIONS: JSON.stringify({ alice: 'write' }),
        STUB_PR: '',
        STUB_PRS: '',
        STUB_COMMENTS: '',
        STUB_RUN_LIST: '',
        STUB_ARTIFACTS: '',
        STUB_BUNDLE_STATUS: '',
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

test('an unknown verb gets a reply listing the five commands', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness merge');
  const reply = assertRefused(f, result);
  assert.match(reply.body, /^@alice: `merge` was not run: /);
  for (const command of ['answer [<n>]', 'pause', 'resume', 'stop', 'clear']) {
    assert.ok(reply.body.includes(`\`@sdlc-harness ${command}\``), command);
  }
  assert.match(reply.body, /docs\/github-run-control\.md/);
});

test('a known verb no arm handles yet gets the same reply', async (t) => {
  const f = await controlFixture(t);
  const result = await f.control('@sdlc-harness resume');
  const reply = assertRefused(f, result, /docs\/github-run-control\.md/);
  assert.match(reply.body, /`@sdlc-harness clear`/);
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
  const other = await f.control('@sdlc-harness pause', {}, { GITHUB_EVENT_NAME: 'issues' });
  assert.equal(other.status, 1);
  const missing = await f.control('@sdlc-harness pause', {}, { GITHUB_EVENT_PATH: join(f.dir, 'nope.json') });
  assert.equal(missing.status, 1);
  assert.deepEqual(f.calls(), []);
});

/** The entries of <dir>, for asserting that control removed what it created there. */
function readdirNames(dir) {
  return existsSync(dir) ? readdirSync(dir) : [];
}
