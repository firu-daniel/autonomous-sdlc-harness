/**
 * `remote-run.sh control` on an `issues`, `pull_request` or `delete` event: closing the run's issue,
 * closing or merging its pull request, or deleting its branch stops the run.
 *
 * **The rule these tests exist to enforce: a close or a branch deletion by an authorised actor stops an
 * unfinished run exactly as `@sdlc-harness stop` does, says why, and deletes nothing; anything else is a
 * log line with no write to GitHub.** Each stopping case is asserted on the `action=stop` marker, the
 * `run cancel`, the `stopped` comment naming the actor and the reason, the `sdlc-harness: stopped`
 * label, and the absence of any `run delete`, artifact `DELETE` or `--method DELETE` on anything but a
 * state label. Each ignored case — an unauthorised closer, an issue with no start comment, a fork's pull
 * request, a `reopened` action, a deleted tag, a completed run, a branch already stopped — is asserted on
 * stdout's one line and on the recorded `gh` calls: no `workflow run`, no `run cancel`, no comment POST
 * and no label write. A failing `stop` child is exit 3, an `::error::` line and no reply.
 *
 * Not covered here: the workflow's `on:` and `if:` prefilter for these events
 * (`cli/test/workflow-templates.test.mjs`, Task 13), and the skip of a branch absent on `origin` by
 * `harness-resume.yml` and the automatic resume (`cli/test/remote-run.test.mjs`, Task 10).
 *
 * The fixture and the `gh` stub are `remote-control.test.mjs`'s, copied rather than imported, with three
 * answers added: `repo view` from `STUB_DEFAULT_BRANCH`, a `contents/…` read from `STUB_CONTENTS`, and a
 * `run list` carrying `headSha`. No case reaches the network.
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
const MARKER = (event, branch) => `<!-- sdlc-harness event=${event} branch=${branch} -->`;
const BOT = 'github-actions[bot]';
const COMMENTS_JQ = '.[] | {login: .user.login, body: .body}';
const STOP_DISPATCH = (ref) => `workflow run harness-run.yml --ref ${ref} -f action=stop -f branch=feat_x`;
const STOPPED_LABEL = 'sdlc-harness: stopped';
const HEAD_SHA = 'abcdef1234567890abcdef1234567890abcdef12';
const GITHUB_DEFAULT = 'trunk';
const PROMPT = `# A task\n\nDo it.\n\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n`;

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
if (args[0] === 'repo' && args[1] === 'view') {
  process.stdout.write(JSON.stringify({ defaultBranchRef: { name: process.env.STUB_DEFAULT_BRANCH } }));
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
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/contents\\//.test(args[1] ?? '')) {
  process.stdout.write(process.env.STUB_CONTENTS || '');
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
  }));
}
`;

/**
 * An adopted fixture on `origin`, with `feat_x` pushed carrying its provenance line and its ledger.
 *
 * @param {import('node:test').TestContext} t
 */
async function closeFixture(t) {
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

  const branch = 'feat_x';
  await runGit(dir, ['checkout', '--quiet', '-b', branch]);
  const files = [`${STATE_DIR}/task_prompts/${branch}_task_prompt.md`, `${STATE_DIR}/flow_progress/${branch}_progress.md`];
  mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
  mkdirSync(join(dir, STATE_DIR, 'flow_progress'), { recursive: true });
  writeFileSync(join(dir, files[0]), PROMPT);
  writeFileSync(join(dir, files[1]), '# Progress\n');
  await runGit(dir, ['add', '--force', ...files]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', `fixture: ${branch}`]);
  const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', `HEAD:refs/heads/${branch}`]);
  assert.equal(push.status, 0, push.stderr);
  await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');
  let events = 0;

  return {
    /**
     * Run `control` on one <eventName> event whose payload is <payload>.
     *
     * @param {string} eventName
     * @param {object} payload
     * @param {Record<string, string>} [env]
     */
    control: async (eventName, payload, env = {}) => {
      events += 1;
      const eventPath = join(stubDir, `event-${events}.json`);
      writeFileSync(eventPath, JSON.stringify(payload));
      return runBash(dir, [SCRIPT, 'control'], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_EVENT_NAME: eventName,
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        HARNESS_REMOTE_STOP: '',
        HARNESS_TRIGGER_ALLOWED_BOTS: '',
        HARNESS_TRIGGER_LABEL: '',
        STUB_PERMISSIONS: JSON.stringify({ alice: 'write', bob: 'read' }),
        STUB_PRS: '',
        STUB_COMMENTS: JSON.stringify([startComment('feat_x')]),
        STUB_RUN_LIST: '',
        STUB_ARTIFACTS: '',
        STUB_BUNDLE_STATUS: '',
        STUB_DEFAULT_BRANCH: GITHUB_DEFAULT,
        STUB_CONTENTS: PROMPT,
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

/** A genuine start comment by <login> for <branch>, as `trigger_finish` writes it. */
function startComment(branch, login = BOT) {
  return {
    user: { login },
    body: `Started a harness run on the branch \`${branch}\`: https://example.test/runs/1\n\nThe task is this issue's title and body.\n\n${MARKER('started', branch)}\n`,
  };
}

const issueClosed = (action = 'closed', login = 'alice') =>
  ({ action, issue: { number: 7 }, sender: { login, type: 'User' } });
const prClosed = ({ merged = false, headRepo = REPOSITORY, action = 'closed' } = {}) => ({
  action,
  pull_request: { number: 9, merged, head: { ref: 'feat_x', repo: { full_name: headRepo } } },
  sender: { login: 'alice', type: 'User' },
});
const deleted = (refType = 'branch') => ({ ref: 'feat_x', ref_type: refType, sender: { login: 'alice', type: 'User' } });

const comments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const commentsOn = (calls, n) => comments(calls).filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/comments `));
const labelWrites = (calls) => calls.filter((call) => /\/labels(\/| |$)/.test(call.line) && call.args.includes('--method'));
const stoppedLabelOn = (calls, n) =>
  calls.some((call) => call.line === `api --method POST repos/${REPOSITORY}/issues/${n}/labels -f labels[]=${STOPPED_LABEL}`);

/** Assert the run was stopped and nothing was deleted; returns the one `stopped` comment. */
function assertStopped(f, result, { ref = 'feat_x', on }) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  const lines = calls.map((call) => call.line);
  const marker = lines.indexOf(STOP_DISPATCH(ref));
  const cancel = lines.indexOf('run cancel 501');
  assert.ok(marker >= 0 && cancel > marker, JSON.stringify(lines));
  assert.equal(lines.filter((line) => line.startsWith('workflow run ')).length, 1);
  const posted = commentsOn(calls, on);
  assert.equal(posted.length, 1, JSON.stringify(lines));
  assert.equal(comments(calls).length, 1);
  assert.ok(posted[0].body.endsWith(`${MARKER('stopped', 'feat_x')}\n`), posted[0].body);
  assert.ok(lines.indexOf(posted[0].line) > cancel);
  assert.ok(stoppedLabelOn(calls, on), JSON.stringify(lines));
  // The runs and their artifacts are kept.
  assert.ok(!lines.some((line) => line.startsWith('run delete')), JSON.stringify(lines));
  assert.ok(!lines.some((line) => /artifacts/.test(line) && /DELETE/.test(line)), JSON.stringify(lines));
  for (const call of calls.filter((c) => c.args.includes('--method') && c.args[c.args.indexOf('--method') + 1] === 'DELETE')) {
    assert.match(call.line, /\/issues\/\d+\/labels\/sdlc-harness/, call.line);
  }
  return posted[0].body;
}

/** Assert a close that did nothing: exit 0, one stdout line matching <pattern>, no GitHub write. */
function assertIgnored(f, result, pattern) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const out = result.stdout.split('\n').filter(Boolean);
  assert.equal(out.length, 1, result.stdout);
  assert.match(out[0], pattern);
  const calls = f.calls();
  const lines = calls.map((call) => call.line);
  assert.ok(!lines.some((line) => line.startsWith('workflow run ')), JSON.stringify(lines));
  assert.ok(!lines.some((line) => line.startsWith('run cancel')), JSON.stringify(lines));
  assert.deepEqual(comments(calls), []);
  assert.deepEqual(labelWrites(calls), []);
}

test('issue #7 closed: the marker, the cancel, a stopped comment naming the close, and the stopped label', async (t) => {
  const f = await closeFixture(t);
  const body = assertStopped(f, await f.control('issues', issueClosed()), { on: 7 });
  assert.match(body, /Stopped because @alice closed issue #7\./);
  assert.match(body, /`harness-state` artifacts are kept/);
});

test('pull request #9 closed unmerged: the comment and the label go to #9', async (t) => {
  const f = await closeFixture(t);
  const body = assertStopped(f, await f.control('pull_request', prClosed()), { on: 9 });
  assert.match(body, /Stopped because @alice closed pull request #9\./);
});

test('pull request #9 merged: the note says merged', async (t) => {
  const f = await closeFixture(t);
  const body = assertStopped(f, await f.control('pull_request', prClosed({ merged: true })), { on: 9 });
  assert.match(body, /Stopped because @alice merged pull request #9\./);
  assert.doesNotMatch(body, /closed pull request/);
});

test('branch deleted: the marker rides GitHub\'s default branch and the issue is read at the run\'s commit', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('delete', deleted(), {
    STUB_RUN_LIST: JSON.stringify([{ databaseId: 501, displayTitle: 'harness run feat_x', status: 'in_progress', headSha: HEAD_SHA, createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/501' }]),
  });
  const body = assertStopped(f, result, { ref: GITHUB_DEFAULT, on: 7 });
  assert.match(body, /Stopped because @alice deleted the branch `feat_x`\./);
  assert.match(body, /cannot be resumed/);
  const lines = f.calls().map((call) => call.line);
  assert.ok(lines.some((line) => line.startsWith(`api repos/${REPOSITORY}/contents/`) && line.includes(`?ref=${HEAD_SHA}`)), JSON.stringify(lines));
  assert.ok(!lines.some((line) => /\/collaborators\//.test(line)), JSON.stringify(lines));
});

test('a close by a read user is one line naming the login and the reason, with no write', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('issues', issueClosed('closed', 'bob'));
  assertIgnored(f, result, /close ignored: @bob is not authorised: .*permission of @bob as read/);
});

test('a close of an issue with no start comment does nothing', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('issues', issueClosed(), { STUB_COMMENTS: '[]' });
  assertIgnored(f, result, /close ignored: no harness run was started from issue #7/);
});

test('a closed pull request from a fork does nothing and calls no gh', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('pull_request', prClosed({ headRepo: 'mallory/fixture' }));
  assertIgnored(f, result, /ignored, a pull request from mallory\/fixture/);
  assert.deepEqual(f.calls(), []);
});

test('a reopened issue or pull request does nothing and calls no gh', async (t) => {
  const f = await closeFixture(t);
  assertIgnored(f, await f.control('issues', issueClosed('reopened')), /ignored, an issue reopened, not closed/);
  assertIgnored(f, await f.control('pull_request', prClosed({ action: 'reopened' })), /ignored, a pull request reopened, not closed/);
  assert.deepEqual(f.calls(), []);
});

test('a deleted tag does nothing and calls no gh', async (t) => {
  const f = await closeFixture(t);
  assertIgnored(f, await f.control('delete', deleted('tag')), /ignored, a deleted tag, not a branch/);
  assert.deepEqual(f.calls(), []);
});

test('a completed run is left alone', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('issues', issueClosed(), {
    STUB_RUN_LIST: JSON.stringify([{ databaseId: 601, displayTitle: 'harness run feat_x', status: 'completed', conclusion: 'success', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/601' }]),
    STUB_ARTIFACTS: JSON.stringify({ artifacts: [{ name: 'harness-state', expired: false }] }),
    STUB_BUNDLE_STATUS: 'completed',
  });
  assertIgnored(f, result, /close ignored: left alone: the run on `feat_x` is `completed`/);
});

test('a branch already stopped is left alone', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('pull_request', prClosed({ merged: true }), {
    STUB_RUN_LIST: JSON.stringify([
      { databaseId: 700, displayTitle: 'harness stop feat_x', status: 'completed', conclusion: 'success', createdAt: '2026-01-01T01:00:00Z', url: 'https://example.test/runs/700' },
      { databaseId: 501, displayTitle: 'harness run feat_x', status: 'in_progress', createdAt: '2026-01-01T00:00:00Z', url: 'https://example.test/runs/501' },
    ]),
  });
  assertIgnored(f, result, /close ignored: the run on `feat_x` is already stopped/);
});

test('a stop child that fails is exit 3, an ::error:: line and no reply', async (t) => {
  const f = await closeFixture(t);
  const result = await f.control('issues', issueClosed(), { STUB_FAIL_ON: 'run cancel' });
  assert.equal(result.status, 3, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /::error::remote-run\.sh: control: the stop of `feat_x` after @alice closed issue #7 failed: /);
  assert.deepEqual(comments(f.calls()), []);
});
