/**
 * `remote-run.sh deliver <branch> <bundle_dir>`, the run workflow's hand-off of a completed run to review.
 *
 * **The rule these tests exist to enforce: a completed run on GitHub ends with exactly one open pull
 * request from its branch, naming its issue as a plain mention, and one `completed` comment naming that
 * pull request; any other bundle status posts nothing.** Each arm is driven: no pull request (a draft is
 * opened), an existing one (reused), `HARNESS_PR_TOKEN` scoping the create alone, GitHub's Actions
 * refusal (no retry, the setting named), any other create failure (one retry without `--draft`), a
 * bundle that is not `completed` or is missing, the forge coupling off, and `phases.qa` naming the local
 * interactive-test step still owed.
 *
 * The fixture is `remote-report.test.mjs`'s — `feat_x` on origin with its provenance line for issue 7 and
 * its ledger — plus a bundle directory whose `status.json` (schema `1`) the test writes. `gh` is a stub
 * reached through `HARNESS_GH_CLI`: it logs each argument vector with any `body=@` / `--body-file`
 * content and the `GH_TOKEN` it ran with, answers `pr list` from `STUB_PRS`, `pr create` with
 * `https://github.com/octo/fixture/pull/12`, and fails a call starting `STUB_FAIL_ON` with
 * `STUB_FAIL_MESSAGE` up to `STUB_FAIL_TIMES` times. No case reaches the network.
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
} else if (args[0] === 'run' && args[1] === 'list') {
  process.stdout.write('[]');
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

/**
 * An adopted fixture on `origin` with `feat_x` pushed carrying its provenance line and its ledger, and a
 * bundle directory.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string | null, qa?: boolean, status?: string | null }} [options]
 */
async function deliverFixture(t, { forge = 'github', qa = false, status = 'completed' } = {}) {
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
  writeFileSync(
    join(dir, files[0]),
    `# Add comments\n\nDo it.\n\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n`,
  );
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
    writeFileSync(join(bundle, 'status.json'), JSON.stringify({ schema: '1', branch: 'feat_x', status }));
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
        GH_TOKEN: '',
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

const creates = (calls) => calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'create');
const commentsOn = (calls, n) =>
  calls.filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/comments `));
const allComments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const labelAdds = (calls, n) =>
  calls
    .filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/labels `))
    .map((call) => call.args.at(-1));

test('a completed run with no pull request opens one draft naming its issue, comments once and sets done', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver();
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const made = creates(calls);
  assert.equal(made.length, 1);
  assert.deepEqual(made[0].args.slice(0, 9), [
    'pr', 'create', '--repo', REPOSITORY, '--base', f.defaultBranch, '--head', 'feat_x', '--draft',
  ]);
  assert.equal(made[0].args[made[0].args.indexOf('--title') + 1], 'Add comments');
  assert.match(made[0].body, /\nStarted from #7\.\n/);
  assert.doesNotMatch(made[0].body, /\b(closes|fixes|resolves) #/i);
  assert.match(made[0].body, /@sdlc-harness pause/);
  for (const cmd of ['@sdlc-harness answer <n>', '@sdlc-harness pause', '@sdlc-harness resume', '@sdlc-harness stop', '@sdlc-harness clear']) {
    assert.ok(made[0].body.includes(`\`${cmd}\``), made[0].body);
  }
  assert.doesNotMatch(made[0].body, /While a round is running/);
  assert.ok(made[0].body.endsWith('<!-- sdlc-harness event=pull-request branch=feat_x -->\n'), made[0].body);
  assert.equal(allComments(calls).length, 1);
  const [posted] = commentsOn(calls, 7);
  assert.match(posted.body, /https:\/\/github\.com\/octo\/fixture\/pull\/12/);
  assert.match(posted.body, /requests changes starts another round/);
  assert.ok(posted.body.endsWith('<!-- sdlc-harness event=completed branch=feat_x -->\n'), posted.body);
  assert.doesNotMatch(posted.body, /branch-qa-test/);
  assert.deepEqual(labelAdds(calls, 7), ['labels[]=sdlc-harness: done']);
  assert.deepEqual(labelAdds(calls, 12), ['labels[]=sdlc-harness: done']);
});

test('HARNESS_PR_TOKEN reaches the create alone', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ HARNESS_PR_TOKEN: 'tok' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls)[0].token, 'tok');
  const others = calls.filter((call) => !(call.args[0] === 'pr' && call.args[1] === 'create'));
  assert.ok(others.length > 0);
  for (const call of others) assert.notEqual(call.token, 'tok', call.line);
});

test('an existing pull request is reused: no create, and the comment and labels go on it', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_PRS: JSON.stringify([{ number: 9, isCrossRepository: false }]) });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 0);
  assert.equal(allComments(calls).length, 1);
  const [posted] = commentsOn(calls, 9);
  assert.match(posted.body, /round on `feat_x` finished/);
  assert.deepEqual(labelAdds(calls, 9), ['labels[]=sdlc-harness: done']);
});

for (const [label, status] of [['a parked bundle', 'parked'], ['no status.json', null]]) {
  test(`${label} calls no gh at all and exits 0`, async (t) => {
    const f = await deliverFixture(t, { status });
    const result = await f.deliver();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(f.calls(), []);
  });
}

test('the Actions refusal is not retried, and the comment names the setting and HARNESS_GIT_TOKEN', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({
    STUB_FAIL_ON: 'pr create',
    STUB_FAIL_MESSAGE: `pull request create failed: GraphQL: ${FORBIDDEN} (createPullRequest)`,
    STUB_FAIL_TIMES: '5',
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 1);
  const [posted] = commentsOn(calls, 7);
  assert.match(posted.body, /Allow GitHub Actions to create and approve pull requests/);
  assert.match(posted.body, /HARNESS_GIT_TOKEN/);
  assert.equal(allComments(calls).length, 1);
  assert.deepEqual(labelAdds(calls, 7), ['labels[]=sdlc-harness: done']);
});

test('another create failure is retried once without --draft', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_FAIL_ON: 'pr create', STUB_FAIL_TIMES: '1' });
  assert.equal(result.status, 0, result.stderr);
  const made = creates(f.calls());
  assert.equal(made.length, 2);
  assert.ok(made[0].args.includes('--draft'));
  assert.ok(!made[1].args.includes('--draft'));
  assert.match(commentsOn(f.calls(), 7)[0].body, /\/pull\/12/);
});

test('a second create failure names gh\'s error and the branch to open it from', async (t) => {
  const f = await deliverFixture(t);
  const result = await f.deliver({ STUB_FAIL_ON: 'pr create', STUB_FAIL_TIMES: '5', STUB_FAIL_MESSAGE: 'boom' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 2);
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

test('with phases.qa true the comment names the local branch-qa-test still owed', async (t) => {
  const f = await deliverFixture(t, { qa: true });
  const result = await f.deliver();
  assert.equal(result.status, 0, result.stderr);
  const [posted] = commentsOn(f.calls(), 7);
  assert.match(posted.body, /\/autonomous-sdlc-harness:branch-qa-test feat_x/);
});
