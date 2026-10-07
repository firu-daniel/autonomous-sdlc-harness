/**
 * `remote-run.sh control --needs-agent`: the check the control workflow runs before installing the agent.
 *
 * **The rule these tests exist to enforce: the check answers whether a session would start, from
 * `control`'s own gates, and posts, dispatches and creates nothing.** Each case asserts the exit, the one
 * `needs-agent:` line, the `gh` calls made (the permission call at most), that no comment is posted and
 * no `workflow run` sent, that the runner's temp directory stays empty, and that the agent is never
 * called. One case runs plain `control` on the same refused event and asserts the check's reason is the
 * reply's, which ties the shared gate function to both callers.
 *
 * The fixture is `remote-control-mention.test.mjs`'s shape, carried file-locally as each control suite
 * carries its own: `init`, `execution.target` `github-actions`, `forge` `github`, `gh` a logging stub
 * through `HARNESS_GH_CLI` answering the permission call from `STUB_PERMISSIONS` (`FAIL` fails it), and
 * `HARNESS_AGENT_CLI` a stub that records any call. Everything sits under the system temp directory, and
 * nothing reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const MENTION = "Let's @sdlc-harness pause";
const PERMISSION_CALL = `api repos/${REPOSITORY}/collaborators/alice/permission`;

const GH_STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
const permission = /^repos\\/[^/]+\\/[^/]+\\/collaborators\\/([^/]+)\\/permission$/.exec(args[1] ?? '');
if (args[0] === 'api' && permission) {
  const answer = JSON.parse(process.env.STUB_PERMISSIONS || '{}')[permission[1]];
  if (answer === undefined || answer === 'FAIL') { process.stderr.write('stub permission failure\\n'); process.exit(4); }
  process.stdout.write(JSON.stringify({ permission: answer }));
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

const AGENT_STUB = `#!/usr/bin/env node
require('node:fs').appendFileSync(process.env.STUB_AGENT_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');
`;

/**
 * An adopted fixture with a gh stub and an agent stub.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: boolean }} [options] `forge: false` leaves `forge` out of `harness.config.json`
 */
async function controlFixture(t, { forge = true } = {}) {
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
  if (forge) config.forge = 'github';
  else delete config.forge;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  const stubDir = join(dir, STATE_DIR, 'stub');
  const runnerTemp = join(stubDir, 'runner-temp');
  mkdirSync(runnerTemp, { recursive: true });
  const gh = join(stubDir, 'gh');
  writeFileSync(gh, GH_STUB, { mode: 0o755 });
  const agent = join(stubDir, 'agent');
  writeFileSync(agent, AGENT_STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');
  const agentLog = join(stubDir, 'agent.log');
  let events = 0;

  const readLines = (path) => (existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []);

  return {
    dir,
    runnerTemp,
    /**
     * Run `control` (with `--needs-agent` unless `plain`) on one event: by default `alice`, a `User`,
     * creating <body> on pull request 12.
     *
     * @param {string} body
     * @param {{ login?: string, type?: string, event?: string, plain?: boolean }} [event]
     * @param {Record<string, string>} [env]
     */
    control: async (body, { login = 'alice', type = 'User', event = 'issue_comment', plain = false } = {}, env = {}) => {
      events += 1;
      const eventPath = join(stubDir, `event-${events}.json`);
      const issue = { number: 12, pull_request: { url: `https://api.github.com/repos/${REPOSITORY}/pulls/12` } };
      writeFileSync(eventPath, JSON.stringify({ action: 'created', comment: { body }, issue, sender: { login, type } }));
      return runBash(dir, [SCRIPT, 'control', ...(plain ? [] : ['--needs-agent'])], {
        HARNESS_GH_CLI: gh,
        STUB_LOG: log,
        GITHUB_EVENT_NAME: event,
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
        STUB_PERMISSIONS: JSON.stringify({ alice: 'write' }),
        HARNESS_AGENT_CLI: agent,
        STUB_AGENT_LOG: agentLog,
        IN_OAUTH: '',
        IN_API: '',
        ...env,
      });
    },
    /** @returns {{ args: string[], body: string | null, line: string }[]} */
    calls: () => readLines(log).map(({ args, body }) => ({ args, body, line: args.join(' ') })),
    agentCalls: () => readLines(agentLog),
  };
}

const comments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const needsLines = (stdout) => stdout.split('\n').filter((line) => line.startsWith('remote-run.sh: control: needs-agent: '));

/**
 * Assert the check's whole effect: exit <status>, exactly one `needs-agent:` line matching <pattern>,
 * the `gh` calls exactly <ghLines>, no comment, no dispatch, an empty runner temp and no agent call.
 * Returns the one line.
 */
const assertAnswer = (f, run, status, pattern, ghLines) => {
  assert.equal(run.status, status, `${run.stdout}\n${run.stderr}`);
  const lines = needsLines(run.stdout);
  assert.equal(lines.length, 1, run.stdout);
  assert.match(lines[0], pattern);
  const calls = f.calls();
  assert.deepEqual(calls.map((call) => call.line), ghLines);
  assert.deepEqual(comments(calls), []);
  assert.deepEqual(calls.filter((call) => call.line.startsWith('workflow run ')), []);
  assert.deepEqual(readdirSync(f.runnerTemp), []);
  assert.deepEqual(f.agentCalls(), []);
  return lines[0];
};

test('an admitted writer\'s mention answers yes, with only the permission call', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION), 0,
    /^remote-run\.sh: control: needs-agent: yes, a mention by @alice on #12$/, [PERMISSION_CALL]);
});

test('the exact form answers no before any gate, with no gh call', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control('@sdlc-harness status'), 2,
    /^remote-run\.sh: control: needs-agent: no, the comment is the exact form `@sdlc-harness status`$/, []);
});

for (const [name, body] of [
  ['a comment without the handle', 'pause'],
  ['a comment the harness posted', 'Paused.\n\n<!-- sdlc-harness event=reply branch=feat_x -->'],
]) {
  test(`${name} answers no after its ignored line, with no gh call`, async (t) => {
    const f = await controlFixture(t);
    const run = await f.control(body);
    assertAnswer(f, run, 2, /^remote-run\.sh: control: needs-agent: no, the comment is ignored$/, []);
    assert.match(run.stdout, /remote-run\.sh: control: ignored, /);
  });
}

test('a writer HARNESS_RUN_ACTORS does not list answers no, naming the list', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, {}, { HARNESS_RUN_ACTORS: 'bob' }), 2,
    /^remote-run\.sh: control: needs-agent: no, @alice is not on the repository variable HARNESS_RUN_ACTORS/, [PERMISSION_CALL]);
});

test('a read collaborator answers no', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, {}, { STUB_PERMISSIONS: JSON.stringify({ alice: 'read' }) }), 2,
    /^remote-run\.sh: control: needs-agent: no, GitHub reports the permission of @alice as read, not write or admin$/, [PERMISSION_CALL]);
});

test('an unlisted bot answers no, with no gh call', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, { login: 'helper[bot]', type: 'Bot' }), 2,
    /^remote-run\.sh: control: needs-agent: no, @helper\[bot\] is not a person, and is not listed in HARNESS_TRIGGER_ALLOWED_BOTS$/, []);
});

test('HARNESS_REMOTE_STOP answers no, with no gh call', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, {}, { HARNESS_REMOTE_STOP: '1' }), 2,
    /^remote-run\.sh: control: needs-agent: no, the repository variable `HARNESS_REMOTE_STOP` is set/, []);
});

test('forge unset answers no, with no gh call', async (t) => {
  const f = await controlFixture(t, { forge: false });
  assertAnswer(f, await f.control(MENTION), 2,
    /^remote-run\.sh: control: needs-agent: no, the default branch's `harness\.config\.json` does not turn run control on/, []);
});

test('a re-run by an unlisted triggering actor answers no, with no gh call', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, {}, {
    HARNESS_RUN_ACTORS: 'alice',
    GITHUB_RUN_ATTEMPT: '2',
    GITHUB_TRIGGERING_ACTOR: 'mallory',
  }), 2, /^remote-run\.sh: control: needs-agent: no, this job is a re-run by @mallory, /, []);
});

test('a failing permission call answers undecided, exit 3', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, {}, { STUB_PERMISSIONS: JSON.stringify({ alice: 'FAIL' }) }), 3,
    /^remote-run\.sh: control: needs-agent: undecided, the permission check for @alice failed \(/, [PERMISSION_CALL]);
});

test('a delete event answers no, with no gh call', async (t) => {
  const f = await controlFixture(t);
  assertAnswer(f, await f.control(MENTION, { event: 'delete' }), 2,
    /^remote-run\.sh: control: needs-agent: no, a `delete` event is not a comment$/, []);
});

test('--needs-agent on another verb is a usage error', async (t) => {
  const f = await controlFixture(t);
  const run = await runBash(f.dir, [SCRIPT, 'status', 'feat_x', '--needs-agent'], { HARNESS_GH_CLI: join(f.dir, 'no-gh') });
  assert.equal(run.status, 1, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stderr, /--needs-agent is a control option/);
  assert.deepEqual(needsLines(run.stdout), []);
});

test('the reason is the text plain control replies with for the same refusal', async (t) => {
  const f = await controlFixture(t);
  const line = assertAnswer(f, await f.control(MENTION, {}, { HARNESS_RUN_ACTORS: 'bob' }), 2,
    /^remote-run\.sh: control: needs-agent: no, /, [PERMISSION_CALL]);
  const reason = line.slice('remote-run.sh: control: needs-agent: no, '.length);

  const plain = await f.control(MENTION, { plain: true }, { HARNESS_RUN_ACTORS: 'bob' });
  assert.equal(plain.status, 2, `${plain.stdout}\n${plain.stderr}`);
  const posted = comments(f.calls());
  assert.equal(posted.length, 1);
  const after = posted[0].body.split('was not run: ')[1];
  assert.ok(after, posted[0].body);
  assert.equal(after.slice(0, after.indexOf('. ')), reason);
});
