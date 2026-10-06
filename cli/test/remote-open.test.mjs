/**
 * `remote-run.sh open <branch>`, the run workflow's opening of a run's draft pull request at its start.
 *
 * **The rule these tests exist to enforce: a run's start leaves at most one open pull request from its
 * branch, opened as a draft with `HARNESS_PR_TOKEN` alone, and its issue names it once.** Each arm is
 * driven: no pull request (a draft is opened, labelled `running`, named on issue 7), an existing one (no
 * create, no comment), GitHub's Actions refusal (no retry, no comment, a `::warning::` line), any other
 * create failure (one retry without `--draft`, the comment saying it is not a draft), a task prompt with no
 * provenance line (opened, nothing posted), the forge coupling off, and a failed `pr list` (nothing
 * created).
 *
 * The fixture and the `gh` stub are `remote-deliver.test.mjs`'s, less the bundle: `feat_x` on origin with
 * its task prompt (its provenance line for issue 7 optional) and its ledger. The stub logs each argument
 * vector with any `body=@` / `--body-file` content and the `GH_TOKEN` it ran with, answers `pr list` from
 * `STUB_PRS`, `pr create` with `https://github.com/octo/fixture/pull/12`, and fails a call starting
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
const OPENED_MARKER = '<!-- sdlc-harness event=opened branch=feat_x -->\n';

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
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

/**
 * An adopted fixture on `origin` with `feat_x` pushed carrying its task prompt and its ledger.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string, provenance?: boolean }} [options]
 */
async function openFixture(t, { forge = 'github', provenance = true } = {}) {
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

  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  const files = [`${STATE_DIR}/task_prompts/feat_x_task_prompt.md`, `${STATE_DIR}/flow_progress/feat_x_progress.md`];
  mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
  mkdirSync(join(dir, STATE_DIR, 'flow_progress'), { recursive: true });
  const origin = provenance ? `\n---\n\nStarted from ${ISSUE_URL} by @alice, who applied the label \`sdlc-harness\`.\n` : '';
  writeFileSync(join(dir, files[0]), `# Add comments\n\nDo it.\n${origin}`);
  writeFileSync(join(dir, files[1]), '# Progress\n');
  await runGit(dir, ['add', '--force', ...files]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: feat_x']);
  const push = await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);
  await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');

  return {
    defaultBranch: config.defaultBranch,
    /** @param {Record<string, string>} [env] */
    open: (env = {}) =>
      runBash(dir, [SCRIPT, 'open', 'feat_x'], {
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

test('no pull request: one draft opened with HARNESS_PR_TOKEN alone, labelled running, named once on its issue', async (t) => {
  const f = await openFixture(t);
  const result = await f.open({ HARNESS_PR_TOKEN: 'tok' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const made = creates(calls);
  assert.equal(made.length, 1);
  assert.deepEqual(made[0].args.slice(0, 9), [
    'pr', 'create', '--repo', REPOSITORY, '--base', f.defaultBranch, '--head', 'feat_x', '--draft',
  ]);
  assert.equal(made[0].token, 'tok');
  for (const call of calls.filter((call) => call !== made[0])) assert.notEqual(call.token, 'tok', call.line);
  assert.match(made[0].body, /It stays a draft while the run works/);
  assert.match(made[0].body, /\nStarted from #7\.\n/);
  assert.doesNotMatch(made[0].body, /\b(closes|fixes|resolves) #/i);
  assert.ok(made[0].body.endsWith('<!-- sdlc-harness event=pull-request branch=feat_x -->\n'), made[0].body);
  assert.deepEqual(labelAdds(calls, 12), ['labels[]=sdlc-harness: running']);
  assert.deepEqual(labelAdds(calls, 7), []);
  assert.equal(allComments(calls).length, 1);
  const [posted] = commentsOn(calls, 7);
  assert.match(posted.body, /draft pull request #12/);
  assert.match(posted.body, /https:\/\/github\.com\/octo\/fixture\/pull\/12/);
  assert.match(posted.body, /`@sdlc-harness` commands keep working on this issue/);
  assert.ok(posted.body.endsWith(OPENED_MARKER), posted.body);
});

test('an existing pull request: no create and no comment', async (t) => {
  const f = await openFixture(t);
  const result = await f.open({ STUB_PRS: JSON.stringify([{ number: 9, isCrossRepository: false, isDraft: true }]) });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 0);
  assert.equal(allComments(calls).length, 0);
  assert.match(result.stdout, /already has pull request #9; none opened/);
});

test('the Actions refusal is not retried, posts nothing and is one ::warning:: line', async (t) => {
  const f = await openFixture(t);
  const result = await f.open({
    STUB_FAIL_ON: 'pr create',
    STUB_FAIL_MESSAGE: `pull request create failed: GraphQL: ${FORBIDDEN} (createPullRequest)`,
    STUB_FAIL_TIMES: '5',
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 1);
  assert.equal(allComments(calls).length, 0);
  assert.equal(labelAdds(calls, 12).length, 0);
  assert.match(result.stdout, /^::warning::.*could not be opened.*deliver tries again/m);
});

test('another create failure is retried once without --draft, and the comment says it is not a draft', async (t) => {
  const f = await openFixture(t);
  const result = await f.open({ STUB_FAIL_ON: 'pr create', STUB_FAIL_TIMES: '1' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const made = creates(calls);
  assert.equal(made.length, 2);
  assert.ok(made[0].args.includes('--draft'));
  assert.ok(!made[1].args.includes('--draft'));
  const [posted] = commentsOn(calls, 7);
  assert.match(posted.body, /pull request #12, not as a draft/);
  assert.ok(posted.body.endsWith(OPENED_MARKER), posted.body);
});

test('a task prompt with no provenance line opens the pull request and posts no comment', async (t) => {
  const f = await openFixture(t, { provenance: false });
  const result = await f.open();
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 1);
  assert.doesNotMatch(creates(calls)[0].body, /Started from #/);
  assert.equal(allComments(calls).length, 0);
  assert.deepEqual(labelAdds(calls, 12), ['labels[]=sdlc-harness: running']);
});

test('with forge none, open calls no gh at all', async (t) => {
  const f = await openFixture(t, { forge: 'none' });
  const result = await f.open();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.match(result.stdout, /forge coupling is off/);
});

test('a failed pr list creates nothing', async (t) => {
  const f = await openFixture(t);
  const result = await f.open({ STUB_FAIL_ON: 'pr list', STUB_FAIL_TIMES: '5' });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(creates(calls).length, 0);
  assert.equal(allComments(calls).length, 0);
  assert.match(result.stdout, /^::warning::.*none opened/m);
});
