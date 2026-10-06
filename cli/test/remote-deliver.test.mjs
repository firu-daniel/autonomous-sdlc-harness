/**
 * `remote-run.sh deliver <branch> <bundle_dir>`, the run workflow's hand-off of a completed run or round to review.
 *
 * **The rule these tests exist to enforce: a completed run or round ends with its pull request marked ready
 * and one `completed` comment on the pull request and one on its issue; any other bundle status posts
 * nothing, and a refused flip never fails the step.** Each arm is driven: an open draft (flipped with the
 * job's token), an open non-draft (no flip), a refused flip (one warning, both comments still posted), no
 * pull request open (the fallback draft create, then the flip), a round's bundle, no issue, `HARNESS_PR_TOKEN`
 * scoping the create alone, GitHub's Actions refusal (no retry, the setting named on the issue alone), any
 * other create failure (one retry without `--draft`, then the compare link on the issue alone), a bundle
 * that is not `completed` or is missing, the forge coupling off, and `phases.qa` naming the local
 * interactive-test step still owed.
 *
 * The fixture is `remote-report.test.mjs`'s — `feat_x` on origin with its provenance line for issue 7 and
 * its ledger — plus a bundle directory whose `status.json` (schema `1`) the test writes. `gh` is a stub
 * reached through `HARNESS_GH_CLI`: it logs each argument vector with any `body=@` / `--body-file`
 * content and the `GH_TOKEN` it ran with, answers `pr list` from `STUB_PRS`, `pr create` with
 * `https://github.com/octo/fixture/pull/12`, `pr ready` with nothing, and fails a call starting
 * `STUB_FAIL_ON` with `STUB_FAIL_MESSAGE` up to `STUB_FAIL_TIMES` times. No case reaches the network.
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
const FORBIDDEN = 'GitHub Actions is not permitted to create or approve pull requests';
const JOB_TOKEN = 'job-token';
const PR_TOKEN = 'pr-token';

const STUB = `#!/usr/bin/env node
const { appendFileSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const fileAt = args.indexOf('--body-file');
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8')
  : fileAt >= 0 ? readFileSync(args[fileAt + 1], 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body, token: process.env.GH_TOKEN ?? null }) + '\\n');
if (process.env.STUB_FAIL_ON && args.join(' ').startsWith(process.env.STUB_FAIL_ON)) {
  const counter = process.env.STUB_LOG + '.fails';
  const failed = existsSync(counter) ? Number(readFileSync(counter, 'utf8')) : 0;
  if (failed < Number(process.env.STUB_FAIL_TIMES || '1')) {
    writeFileSync(counter, String(failed + 1));
    process.stderr.write((process.env.STUB_FAIL_MESSAGE || 'stub gh failure') + '\\n');
    process.exit(1);
  }
}
if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_PRS || '[]');
} else if (args[0] === 'pr' && args[1] === 'create') {
  process.stdout.write('https://github.com/octo/fixture/pull/12\\n');
} else if (args[0] === 'pr' && args[1] === 'ready') {
  process.stdout.write('');
} else if (args[0] === 'run' && args[1] === 'list') {
  process.stdout.write('[]');
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

/**
 * An adopted fixture on `origin` with `feat_x` pushed carrying its task prompt (with its provenance line
 * unless `issue` is false) and its ledger, and a bundle directory.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string | null, qa?: boolean, status?: string | null, engine?: string | null, issue?: boolean }} [options]
 */
async function deliverFixture(t, { forge = 'github', qa = false, status = 'completed', engine = 'task', issue = true } = {}) {
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
  if (forge === null) delete config.forge;
  else config.forge = forge;
  config.phases = { ...config.phases, qa };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  const files = [`${STATE_DIR}/task_prompts/feat_x_task_prompt.md`, `${STATE_DIR}/flow_progress/feat_x_progress.md`];
  mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
  mkdirSync(join(dir, STATE_DIR, 'flow_progress'), { recursive: true });
  const provenance = issue ? `\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n` : '';
  writeFileSync(join(dir, files[0]), `# Add comments\n\nDo it.\n${provenance}`);
  writeFileSync(join(dir, files[1]), '# Progress\n');
  await runGit(dir, ['add', '--force', ...files]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: feat_x']);
  const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);
  await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  const bundle = join(stubDir, 'bundle');
  mkdirSync(runnerTemp, { recursive: true });
  mkdirSync(bundle, { recursive: true });
  if (status !== null) {
    const record = { schema: '1', branch: 'feat_x', status };
    if (engine !== null) record.engine = engine;
    writeFileSync(join(bundle, 'status.json'), JSON.stringify(record));
  }
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');

  return {
    defaultBranch: config.defaultBranch,
    /** @param {Record<string, string>} [env] */
    deliver: (env = {}) =>
      runBash(dir, [SCRIPT, 'deliver', 'feat_x', bundle], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        GH_TOKEN: JOB_TOKEN,
        RUNNER_TEMP: runnerTemp,
        HARNESS_PR_TOKEN: '',
        STUB_PRS: '',
        STUB_FAIL_ON: '',
        STUB_FAIL_MESSAGE: '',
        STUB_FAIL_TIMES: '',
        ...env,
      }),
    /** @returns {{ args: string[], body: string | null, token: string | null, line: string }[]} */
    calls: () =>
      existsSync(log)
        ? readFileSync(log, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((line) => {
              const { args, body, token } = JSON.parse(line);
              return { args, body, token, line: args.join(' ') };
            })
        : [],
  };
}

const openDraft = JSON.stringify([{ number: 12, isCrossRepository: false, isDraft: true }]);
const openReady = JSON.stringify([{ number: 12, isCrossRepository: false, isDraft: false }]);

const creates = (calls) => calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'create');
const readies = (calls) => calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'ready');
const commentsOn = (calls, n) =>
  calls.filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/comments `));
const allComments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const labelAdds = (calls, n) =>
  calls
    .filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/labels `))
    .map((call) => call.args.at(-1));
const MARKER = '<!-- sdlc-harness event=completed branch=feat_x -->\n';

/** Every `pr ready` call carries the job's token, never `HARNESS_PR_TOKEN`. */
function assertReadyTokens(calls) {
  for (const call of readies(calls)) assert.equal(call.token, JOB_TOKEN, call.line);
}

test('an open draft is marked ready with the job token, commented on it and on its issue, and set done', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_PRS: openDraft, HARNESS_PR_TOKEN: PR_TOKEN });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 0);
  const flips = readies(calls);
  assert.equal(flips.length, 1);
  assert.deepEqual(flips[0].args, ['pr', 'ready', '12', '--repo', REPOSITORY]);
  assertReadyTokens(calls);
  assert.equal(allComments(calls).length, 2);
  const [onPr] = commentsOn(calls, 12);
  assert.match(onPr.body, /run on `feat_x` completed, and this pull request is now marked ready for your review/);
  assert.match(onPr.body, /requests changes starts another round/);
  assert.ok(onPr.body.endsWith(MARKER), onPr.body);
  const [onIssue] = commentsOn(calls, 7);
  assert.match(onIssue.body, /#12/);
  assert.match(onIssue.body, /https:\/\/github\.com\/octo\/fixture\/pull\/12/);
  assert.ok(onIssue.body.endsWith(MARKER), onIssue.body);
  assert.doesNotMatch(onIssue.body, /branch-qa-test/);
  assert.deepEqual(labelAdds(calls, 7), ['labels[]=sdlc-harness: done']);
  assert.deepEqual(labelAdds(calls, 12), ['labels[]=sdlc-harness: done']);
});

test('an open non-draft gets no flip and the not-a-draft sentence', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_PRS: openReady });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 0);
  assert.equal(readies(calls).length, 0);
  const [onPr] = commentsOn(calls, 12);
  assert.match(onPr.body, /This pull request is not a draft/);
  assert.match(onPr.body, /left as it is/);
  assert.equal(commentsOn(calls, 7).length, 1);
});

test('a refused flip is one warning line, exit 0, the refused sentence, and both comments still posted', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_PRS: openDraft, STUB_FAIL_ON: 'pr ready', STUB_FAIL_MESSAGE: 'nope', STUB_FAIL_TIMES: '5' });
  assert.equal(result.status, 0, result.stderr);
  const warnings = `${result.stdout}\n${result.stderr}`.split('\n').filter((line) => line.startsWith('::warning::'));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /nope/);
  const calls = f.calls();
  assert.equal(readies(calls).length, 1);
  assertReadyTokens(calls);
  const [onPr] = commentsOn(calls, 12);
  assert.match(onPr.body, /Marking this draft ready for review was refused; mark it ready by hand/);
  const onIssue = commentsOn(calls, 7);
  assert.equal(onIssue.length, 1);
  assert.match(onIssue[0].body, /still a draft — marking it ready for review was refused/);
  assert.doesNotMatch(onIssue[0].body, /is ready for your review/);
  assert.deepEqual(labelAdds(calls, 12), ['labels[]=sdlc-harness: done']);
});

test('with no pull request open, the fallback draft create runs with HARNESS_PR_TOKEN and then the flip', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ HARNESS_PR_TOKEN: PR_TOKEN });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no open pull request at completion/);
  const calls = f.calls();
  const made = creates(calls);
  assert.equal(made.length, 1);
  assert.deepEqual(made[0].args.slice(0, 9), [
    'pr', 'create', '--repo', REPOSITORY, '--base', f.defaultBranch, '--head', 'feat_x', '--draft',
  ]);
  assert.equal(made[0].token, PR_TOKEN);
  assert.equal(made[0].args[made[0].args.indexOf('--title') + 1], 'Add comments');
  assert.match(made[0].body, /\nStarted from #7\.\n/);
  assert.doesNotMatch(made[0].body, /\b(closes|fixes|resolves) #/i);
  for (const cmd of ['@sdlc-harness answer <n>', '@sdlc-harness pause', '@sdlc-harness resume', '@sdlc-harness stop', '@sdlc-harness clear', '@sdlc-harness status']) {
    assert.ok(made[0].body.includes(`\`${cmd}\``), made[0].body);
  }
  assert.ok(made[0].body.endsWith('<!-- sdlc-harness event=pull-request branch=feat_x -->\n'), made[0].body);
  const createAt = calls.indexOf(made[0]);
  const flips = readies(calls);
  assert.equal(flips.length, 1);
  assert.ok(calls.indexOf(flips[0]) > createAt);
  assertReadyTokens(calls);
  for (const call of calls) if (call !== made[0]) assert.notEqual(call.token, PR_TOKEN, call.line);
  assert.match(commentsOn(calls, 12)[0].body, /now marked ready/);
  assert.match(commentsOn(calls, 7)[0].body, /\/pull\/12/);
});

test('a round\'s bundle posts the round-finished texts', async (t) => {
  const f = await deliverFixture(t, { engine: 'user_review' });
  const result = await f.deliver({ STUB_PRS: openDraft });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(readies(calls).length, 1);
  assert.match(commentsOn(calls, 12)[0].body, /round on `feat_x` finished, and this pull request is marked ready for review again/);
  const [onIssue] = commentsOn(calls, 7);
  assert.match(onIssue.body, /round on `feat_x` finished\. Pull request #12 is ready for review again: https:\/\/github\.com\/octo\/fixture\/pull\/12/);
});

test('with no issue, only the pull request is commented on and labelled', async (t) => {
  const f = await deliverFixture(t, { issue: false });
  const result = await f.deliver({ STUB_PRS: openDraft });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(allComments(calls).length, 1);
  assert.equal(commentsOn(calls, 12).length, 1);
  assert.deepEqual(labelAdds(calls, 12), ['labels[]=sdlc-harness: done']);
  assert.deepEqual(labelAdds(calls, 7), []);
});

for (const [label, status] of [['a parked bundle', 'parked'], ['no status.json', null]]) {
  test(`${label} calls no gh at all and exits 0`, async (t) => {
    const f = await deliverFixture(t, { status });
    const result = await f.deliver();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(f.calls(), []);
  });
}

test('the Actions refusal is not retried, and the issue alone names the setting and HARNESS_GIT_TOKEN', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({
    STUB_FAIL_ON: 'pr create',
    STUB_FAIL_MESSAGE: `pull request create failed: GraphQL: ${FORBIDDEN} (createPullRequest)`,
    STUB_FAIL_TIMES: '5',
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 1);
  assert.equal(readies(calls).length, 0);
  const [posted] = commentsOn(calls, 7);
  assert.match(posted.body, /Allow GitHub Actions to create and approve pull requests/);
  assert.match(posted.body, /HARNESS_GIT_TOKEN/);
  assert.equal(allComments(calls).length, 1);
  assert.deepEqual(labelAdds(calls, 7), ['labels[]=sdlc-harness: done']);
});

test('another create failure is retried once without --draft, and the not-a-draft result is not flipped', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_FAIL_ON: 'pr create', STUB_FAIL_TIMES: '1' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const made = creates(calls);
  assert.equal(made.length, 2);
  assert.ok(made[0].args.includes('--draft'));
  assert.ok(!made[1].args.includes('--draft'));
  assert.equal(readies(calls).length, 0);
  assert.match(commentsOn(calls, 12)[0].body, /not a draft/);
  assert.match(commentsOn(calls, 7)[0].body, /\/pull\/12/);
});

test('a second create failure names gh\'s error and the branch to open it from, on the issue alone', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_FAIL_ON: 'pr create', STUB_FAIL_TIMES: '5', STUB_FAIL_MESSAGE: 'boom' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 2);
  assert.equal(allComments(calls).length, 1);
  const [posted] = commentsOn(calls, 7);
  assert.match(posted.body, /boom/);
  assert.match(posted.body, /compare\/[^ ]+\.\.\.feat_x/);
});

test('with the forge coupling off, deliver calls no gh at all', async (t) => {
  const f = await deliverFixture(t, { forge: null });
  const result = await f.deliver();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.match(result.stdout, /forge coupling is off/);
});

test('with phases.qa true each comment names the local branch-qa-test still owed', async (t) => {
  const f = await deliverFixture(t, { qa: true });
  const result = await f.deliver({ STUB_PRS: openDraft });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.match(commentsOn(calls, 7)[0].body, /\/autonomous-sdlc-harness:branch-qa-test feat_x/);
  assert.match(commentsOn(calls, 12)[0].body, /\/autonomous-sdlc-harness:branch-qa-test feat_x/);
});
