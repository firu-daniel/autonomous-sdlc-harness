/**
 * `remote-run.sh trigger`, the GitHub event adapter: an `issues` `labeled` event, or a `repository_dispatch`
 * of type `harness-task`, becomes a branch and a task text, then `start`.
 *
 * **The rule these tests exist to enforce: only a write-or-admin human or a listed bot starts a run;
 * every refusal sends no `workflow run` and posts one comment naming why; event text is data.** Each
 * refusal arm — `HARNESS_REMOTE_STOP`, a trigger the configuration does not turn on, a closed issue,
 * `ghost`, an unlisted bot, a `read` answer and a failed permission call — is driven here, and a body
 * carrying shell syntax is committed byte for byte with nothing executed. A dispatch event has no issue,
 * so its cases assert feedback in the step summary and no `issue` call at all.
 *
 * Each case drives `remote-start.test.mjs`'s fixture shape — `init`, `execution.target` set, the
 * adopted tree pushed to the fixture's bare `origin` — plus `forge: "github"` and an event file the
 * test writes. `gh` is a stub reached through `HARNESS_GH_CLI`: it answers the permission call from a
 * per-login table, answers `run list` with a `harness run <branch>` run carrying a `url`, and logs each
 * argument vector with any `--body-file`'s content; a call starting `STUB_FAIL_ON` exits 4. No case
 * reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const TITLE = 'Add comments to items';
const BRANCH = 'add_comments_to_items';

/**
 * `gh`, answered and recorded. `STUB_PERMISSIONS` maps a login to its `.permission`, or to `FAIL` for a
 * call that exits 4; `run list` answers one `harness run <--branch>` run.
 */
const STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.indexOf('--body-file');
const body = at >= 0 ? readFileSync(args[at + 1], 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
if (process.env.STUB_FAIL_ON && args.join(' ').startsWith(process.env.STUB_FAIL_ON)) {
  process.stderr.write('stub gh failure\\n');
  process.exit(4);
}
const permission = /^repos\\/[^/]+\\/[^/]+\\/collaborators\\/([^/]+)\\/permission$/.exec(args[1] ?? '');
if (args[0] === 'api' && permission) {
  const answer = JSON.parse(process.env.STUB_PERMISSIONS ?? '{}')[permission[1]];
  if (answer === undefined || answer === 'FAIL') {
    process.stderr.write('stub permission failure\\n');
    process.exit(4);
  }
  process.stdout.write(JSON.stringify({ permission: answer }));
} else if (args[0] === 'run' && args[1] === 'list') {
  const branch = args[args.indexOf('--branch') + 1];
  process.stdout.write(JSON.stringify([{ displayTitle: 'harness run ' + branch, url: 'https://example.test/runs/' + branch }]));
}
`;

/**
 * An `init`-wired fixture adopted on `origin`'s default branch, with `forge` and `execution.target` set.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string }} [options]
 */
async function triggerFixture(t, { forge = 'github' } = {}) {
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

  const origin = (await runGit(dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  // Beside the fixture's state directory, which is gitignored, so none of it is ever committed.
  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');
  const summary = join(stubDir, 'step-summary.md');
  let events = 0;

  /** Every working copy a derived branch may cut, removed after the case. */
  const worktreeOf = (branch) => join(dirname(dir), `${config.projectName}-${branch}`);

  return {
    dir,
    origin,
    worktreeOf,
    /**
     * Run `trigger` on one event.
     *
     * @param {object} [overrides] merged over a `labeled` event by the write-access user `alice`.
     * @param {Record<string, string>} [env]
     * @param {Record<string, string>} [permissions]
     */
    trigger: async (overrides = {}, env = {}, permissions = { alice: 'write' }) => {
      const event = {
        action: 'labeled',
        label: { name: 'harness' },
        sender: { login: 'alice', type: 'User' },
        ...overrides,
        issue: {
          number: 7,
          title: TITLE,
          body: 'Let a reader comment on a content item.\n',
          html_url: `https://github.com/${REPOSITORY}/issues/7`,
          state: 'open',
          ...(overrides.issue ?? {}),
        },
      };
      events += 1;
      const eventPath = join(stubDir, `event_${events}.json`);
      writeFileSync(eventPath, JSON.stringify(event));
      for (const branch of [BRANCH, `${BRANCH}_2`, `issue_${event.issue.number}`]) {
        t.after(() => rm(worktreeOf(branch), { recursive: true, force: true }));
      }
      return runBash(dir, [SCRIPT, 'trigger'], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        STUB_PERMISSIONS: JSON.stringify(permissions),
        GITHUB_EVENT_NAME: 'issues',
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '4242',
        RUNNER_TEMP: runnerTemp,
        HARNESS_REMOTE_STOP: '',
        HARNESS_TRIGGER_LABEL: '',
        HARNESS_TRIGGER_ALLOWED_BOTS: '',
        HARNESS_TRIGGER_LOOKUP_SECS: '0',
        ...env,
      });
    },
    /**
     * Run `trigger` on one `repository_dispatch` event, with a step-summary file.
     *
     * @param {object} event the whole event: `action` and `client_payload`.
     * @param {Record<string, string>} [env]
     */
    dispatch: async (event, env = {}) => {
      events += 1;
      const eventPath = join(stubDir, `event_${events}.json`);
      writeFileSync(eventPath, JSON.stringify(event));
      for (const branch of [BRANCH, 'task_4242']) {
        t.after(() => rm(worktreeOf(branch), { recursive: true, force: true }));
      }
      return runBash(dir, [SCRIPT, 'trigger'], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        STUB_PERMISSIONS: '{}',
        GITHUB_EVENT_NAME: 'repository_dispatch',
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '4242',
        GITHUB_STEP_SUMMARY: summary,
        RUNNER_TEMP: runnerTemp,
        HARNESS_REMOTE_STOP: '',
        HARNESS_TRIGGER_LABEL: '',
        HARNESS_TRIGGER_ALLOWED_BOTS: '',
        HARNESS_TRIGGER_LOOKUP_SECS: '0',
        ...env,
      });
    },
    summary: () => (existsSync(summary) ? readFileSync(summary, 'utf8') : ''),
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
    committedPrompt: async (branch) =>
      (await runGit(origin, ['show', `refs/heads/${branch}:${STATE_DIR}/task_prompts/${branch}_task_prompt.md`])).stdout,
  };
}

const dispatches = (calls) => calls.filter((call) => call.line.startsWith('workflow run'));
const comments = (calls) => calls.filter((call) => call.line.startsWith('issue comment 7'));
const removals = (calls) =>
  calls.filter((call) => call.line === `issue edit 7 --repo ${REPOSITORY} --remove-label harness`);
const permissionCalls = (calls) => calls.filter((call) => call.args[0] === 'api');

/** One comment and one label removal, and no dispatch: the shape of every refusal. */
function assertRefused(f, result, reason) {
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(dispatches(calls), []);
  const posted = comments(calls);
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, /No run started/);
  assert.match(posted[0].body, reason);
  assert.equal(removals(calls).length, 1);
  return calls;
}

test('a write user starts one run on the derived branch, comments it and removes the label', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.trigger();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(
    dispatches(calls).map((call) => call.line),
    [`workflow run harness-run.yml --ref ${BRANCH} -f action=run -f branch=${BRANCH} -f engine=task -f resume=none -f chain=0`],
  );
  const posted = comments(calls);
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, new RegExp(`\`${BRANCH}\``));
  assert.match(posted[0].body, new RegExp(`https://example\\.test/runs/${BRANCH}`));
  assert.equal(removals(calls).length, 1);
  assert.ok(
    calls.findIndex((call) => call.line.startsWith('issue comment')) <
      calls.findIndex((call) => call.line.startsWith('issue edit')),
    'the label was removed before the comment was posted',
  );

  const prompt = await f.committedPrompt(BRANCH);
  assert.match(
    prompt,
    new RegExp(
      `^# ${TITLE}\\n\\nLet a reader comment on a content item\\.\\n\\n\\n---\\n\\nStarted from https://github\\.com/${REPOSITORY}/issues/7 by @alice, who applied the label \`harness\` at \\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\dZ\\.`,
    ),
  );
});

test('an admin user starts a run', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.trigger({}, {}, { alice: 'admin' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(dispatches(f.calls()).length, 1);
});

test('a read answer (triage) is refused, naming write access', async (t) => {
  const f = await triggerFixture(t);
  assertRefused(f, await f.trigger({}, {}, { alice: 'read' }), /write access/);
});

test('ghost is refused without a permission call', async (t) => {
  const f = await triggerFixture(t);
  const calls = assertRefused(f, await f.trigger({ sender: { login: 'ghost', type: 'User' } }), /ghost/);
  assert.deepEqual(permissionCalls(calls), []);
});

test('an unlisted bot is refused without a permission call', async (t) => {
  const f = await triggerFixture(t);
  const calls = assertRefused(
    f,
    await f.trigger({ sender: { login: 'helper[bot]', type: 'Bot' } }),
    /HARNESS_TRIGGER_ALLOWED_BOTS/,
  );
  assert.deepEqual(permissionCalls(calls), []);
});

test('a bot listed in HARNESS_TRIGGER_ALLOWED_BOTS starts a run without a permission call', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.trigger(
    { sender: { login: 'helper[bot]', type: 'Bot' } },
    { HARNESS_TRIGGER_ALLOWED_BOTS: 'other[bot] , helper[bot]' },
  );
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(dispatches(calls).length, 1);
  assert.deepEqual(permissionCalls(calls), []);
});

test('a failing permission call is refused, never a pass', async (t) => {
  const f = await triggerFixture(t);
  assertRefused(f, await f.trigger({}, {}, { alice: 'FAIL' }), /could not confirm write access/);
});

test('HARNESS_REMOTE_STOP refuses every start', async (t) => {
  const f = await triggerFixture(t);
  const calls = assertRefused(f, await f.trigger({}, { HARNESS_REMOTE_STOP: '1' }), /HARNESS_REMOTE_STOP/);
  assert.deepEqual(permissionCalls(calls), []);
});

test('forge none is refused before any permission call', async (t) => {
  const f = await triggerFixture(t, { forge: 'none' });
  const calls = assertRefused(f, await f.trigger(), /`forge`.*`execution\.target`/s);
  assert.deepEqual(permissionCalls(calls), []);
});

test('a closed issue is refused', async (t) => {
  const f = await triggerFixture(t);
  assertRefused(f, await f.trigger({ issue: { state: 'closed' } }), /Reopen/);
});

test('another action or another label is ignored with no gh call', async (t) => {
  const f = await triggerFixture(t);
  const opened = await f.trigger({ action: 'opened' });
  assert.equal(opened.status, 0, opened.stderr);
  const other = await f.trigger({ label: { name: 'bug' } });
  assert.equal(other.status, 0, other.stderr);
  assert.match(other.stdout, /ignored/);
  assert.deepEqual(f.calls(), []);
});

test('a second issue with the same title starts on <slug>_2', async (t) => {
  const f = await triggerFixture(t);
  assert.equal((await f.trigger()).status, 0);
  const second = await f.trigger({ issue: { number: 8 } });
  assert.equal(second.status, 0, second.stderr);
  const sent = dispatches(f.calls()).map((call) => call.args[4]);
  assert.deepEqual(sent, [BRANCH, `${BRANCH}_2`]);
});

test('a title with no slug starts on issue_<number>', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.trigger({ issue: { number: 12, title: '🚀🚀' } });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(dispatches(f.calls()).map((call) => call.args[4]), ['issue_12']);
  assert.match(await f.committedPrompt('issue_12'), /^# 🚀🚀\n/);
});

test('a body carrying shell syntax is committed byte for byte and never run', async (t) => {
  const f = await triggerFixture(t);
  const body = 'Try $(touch pwned) and `touch pwned` and "$HOME".\nEnd.';
  const result = await f.trigger({ issue: { body } });
  assert.equal(result.status, 0, result.stderr);
  const prompt = await f.committedPrompt(BRANCH);
  assert.ok(prompt.includes(`\n\n${body}\n\n---\n`), prompt);
  for (const where of [f.dir, f.worktreeOf(BRANCH), join(f.dir, STATE_DIR, 'stub', 'runner-temp')]) {
    assert.equal(existsSync(join(where, 'pwned')), false, `a pwned file exists in ${where}`);
  }
});

test('a dispatch that fails after the push exits 3 and comments the manual way on', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.trigger({}, { STUB_FAIL_ON: 'workflow run' });
  assert.equal(result.status, 3, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  const posted = comments(calls);
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, new RegExp(`\`${BRANCH}\` was pushed`));
  assert.match(posted[0].body, /harness-run\.yml.*Run workflow/s);
  assert.match(posted[0].body, /Use workflow from\* set to/);
  assert.equal(removals(calls).length, 1);
});

const issueCalls = (calls) => calls.filter((call) => call.args[0] === 'issue');

test('a harness-task dispatch starts one run, snapshots its provenance and reports in the step summary', async (t) => {
  const f = await triggerFixture(t);
  const body = 'Let a reader comment on a content item';
  const result = await f.dispatch({
    action: 'harness-task',
    client_payload: { title: TITLE, body, source: 'jira PROJ-12' },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const calls = f.calls();
  assert.deepEqual(
    dispatches(calls).map((call) => call.line),
    [`workflow run harness-run.yml --ref ${BRANCH} -f action=run -f branch=${BRANCH} -f engine=task -f resume=none -f chain=0`],
  );
  assert.deepEqual(issueCalls(calls), []);
  const prompt = await f.committedPrompt(BRANCH);
  assert.match(
    prompt,
    new RegExp(
      `^# ${TITLE}\\n\\n${body}\\n\\n---\\n\\nStarted by a repository_dispatch event of type \`harness-task\`, from jira PROJ-12 at \\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\dZ\\.\\n$`,
    ),
  );
  assert.match(f.summary(), new RegExp(`\`${BRANCH}\``));
  assert.match(f.summary(), new RegExp(`https://example\\.test/runs/${BRANCH}`));
  assert.match(result.stdout, new RegExp(`\`${BRANCH}\``));
});

test('a dispatch of another type is ignored with no gh call', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.dispatch({ action: 'something-else', client_payload: { title: TITLE } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ignored/);
  assert.deepEqual(f.calls(), []);
});

test('a dispatch without a title is refused, naming the payload shape', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.dispatch({ action: 'harness-task', client_payload: { body: 'x' } });
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(dispatches(f.calls()), []);
  assert.deepEqual(issueCalls(f.calls()), []);
  assert.match(f.summary(), /No run started/);
  assert.match(f.summary(), /"client_payload": \{"title"/);
});

test('a dispatch whose title has no slug starts on task_<GITHUB_RUN_ID>', async (t) => {
  const f = await triggerFixture(t);
  const result = await f.dispatch({ action: 'harness-task', client_payload: { title: '🚀🚀', body: 'x' } });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(dispatches(f.calls()).map((call) => call.args[4]), ['task_4242']);
  assert.match(await f.committedPrompt('task_4242'), /^# 🚀🚀\n\nx\n\n---\n\nStarted by a repository_dispatch event of type `harness-task` at /);
});
