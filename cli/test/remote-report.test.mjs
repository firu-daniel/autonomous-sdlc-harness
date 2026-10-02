/**
 * `remote-run.sh report <event> <branch>`, the lifecycle reporter built on the forge surface.
 *
 * **The rule these tests exist to enforce: a lifecycle event reaches the run's pull request, else its
 * issue, as one marked comment naming a GitHub action, and leaves exactly one state label on each; with
 * the forge coupling off it calls no `gh` at all.** The target rule's arms — a same-repository pull
 * request whose head carries the flow-progress ledger, one whose head does not, a fork's, and no target
 * at all — are each driven, as are the state-label replacement, the bounded create-and-retry of a failed
 * add, the stop check on `failed`, and a note carrying shell syntax posted byte for byte. `parked` posts
 * one comment per open question file, written into the fixture checkout's clarification directory:
 * ascending, the file whole or cut at a line within the byte bound, and its marker carrying `question=<n>`.
 *
 * The fixture is `remote-trigger.test.mjs`'s shape — `init`, `execution.target` `github-actions`,
 * `forge` `github`, the adopted tree pushed to the fixture's bare `origin` — plus branches pushed with a
 * task prompt and, unless a case says otherwise, `flow_progress/<branch>_progress.md`. `gh` is a stub
 * reached through `HARNESS_GH_CLI`: it logs each argument vector with the content of any `body=@<path>`,
 * answers `pr list` from `STUB_PRS`, a label read from `STUB_LABELS` and `run list` from
 * `STUB_RUN_LIST` (each `[]` by default), and exits 4 on a call starting `STUB_FAIL_ON`. No case reaches
 * the network.
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

const STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
if (process.env.STUB_FAIL_ON && args.join(' ').startsWith(process.env.STUB_FAIL_ON)) {
  process.stderr.write('stub gh failure\\n');
  process.exit(4);
}
if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_PRS || '[]');
} else if (args[0] === 'run' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_RUN_LIST || '[]');
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write(process.env.STUB_LABELS || '[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

/**
 * An adopted fixture on `origin`, with `feat_x` pushed carrying its provenance line and its ledger.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ forge?: string | null }} [options]
 */
async function reportFixture(t, { forge = 'github' } = {}) {
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
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  /**
   * Push <branch> to origin with a task prompt whose provenance names <issueUrl> (none when null) and the
   * trigger <label>, and, when <ledger>, its flow-progress ledger; the checkout returns to the default branch.
   */
  const pushBranch = async (branch, { issueUrl = ISSUE_URL, ledger = true, label = 'sdlc-harness' } = {}) => {
    await runGit(dir, ['checkout', '--quiet', '-b', branch]);
    const files = [`${STATE_DIR}/task_prompts/${branch}_task_prompt.md`];
    const provenance = issueUrl === null ? 'Started by hand.' : `Started from ${issueUrl} by @alice, who applied the label \`${label}\`.`;
    mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
    writeFileSync(join(dir, files[0]), `# A task\n\nDo it.\n\n---\n\n${provenance}\n`);
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

  return {
    dir,
    pushBranch,
    /** Write <fields> as the registry record of <branch>. */
    record: (branch, fields) => {
      const registry = join(dir, STATE_DIR, 'autonomous_logs', 'registry.json');
      mkdirSync(join(dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
      writeFileSync(registry, JSON.stringify({ runs: { [branch]: fields } }));
    },
    /**
     * @param {string[]} args after `report`
     * @param {Record<string, string>} [env]
     */
    report: (args, env = {}) =>
      runBash(dir, [SCRIPT, 'report', ...args], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: log,
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '',
        RUNNER_TEMP: runnerTemp,
        HARNESS_TRIGGER_LABEL: '',
        STUB_PRS: '',
        STUB_LABELS: '',
        STUB_RUN_LIST: '',
        STUB_FAIL_ON: '',
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

const commentsOn = (calls, n) =>
  calls.filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/comments `));
const allComments = (calls) => calls.filter((call) => /^api --method POST repos\/[^ ]+\/issues\/\d+\/comments /.test(call.line));
const labelAdds = (calls, n) =>
  calls.filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${n}/labels `));
const writes = (calls) => calls.filter((call) => call.args[0] === 'api' && call.args[1] === '--method');

test('with the forge coupling off, report calls no gh at all and exits 0', async (t) => {
  const f = await reportFixture(t, { forge: null });
  const result = await f.report(['paused', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.match(result.stdout, /forge coupling is off/);
});

test('paused with a user reason comments on the issue, naming resume, and adds the paused label', async (t) => {
  const f = await reportFixture(t);
  f.record('feat_x', { pause_reason: 'user' });
  const result = await f.report(['paused', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const posted = commentsOn(calls, 7);
  assert.equal(posted.length, 1);
  assert.equal(allComments(calls).length, 1);
  assert.match(posted[0].body, /Comment `@sdlc-harness resume` to continue\./);
  assert.ok(posted[0].body.endsWith(`\n\n${MARKER('paused', 'feat_x')}\n`), posted[0].body);
  assert.doesNotMatch(posted[0].body, /\/autonomous-sdlc-harness:/);
  assert.deepEqual(
    labelAdds(calls, 7).map((call) => call.args.at(-1)),
    ['labels[]=sdlc-harness: paused'],
  );
});

test('paused on usage names the UTC reset and no resume command', async (t) => {
  const f = await reportFixture(t);
  f.record('feat_x', { pause_reason: 'usage', usage_resume_at: '1767225600' });
  const result = await f.report(['paused', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const [posted] = commentsOn(f.calls(), 7);
  assert.match(posted.body, /2026-01-01 00:00 UTC/);
  assert.match(posted.body, /resumes by itself/);
  assert.doesNotMatch(posted.body, /resume`/);
});

test('an existing state label is removed by its encoded name, and any other label is untouched', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['paused', 'feat_x'], {
    STUB_LABELS: JSON.stringify([{ name: 'sdlc-harness: running' }, { name: 'bug' }]),
  });
  assert.equal(result.status, 0, result.stderr);
  const deletes = f.calls().filter((call) => call.args[2] === 'DELETE');
  assert.deepEqual(
    deletes.map((call) => call.line),
    [`api --method DELETE repos/${REPOSITORY}/issues/7/labels/sdlc-harness%3A%20running`],
  );
});

test('an open same-repository pull request on a ledgered head takes the comment; both carry the label', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['resumed', 'feat_x'], {
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(commentsOn(calls, 12).length, 1);
  assert.equal(allComments(calls).length, 1);
  assert.equal(labelAdds(calls, 7).length, 1);
  assert.equal(labelAdds(calls, 12).length, 1);
  assert.equal(labelAdds(calls, 12)[0].args.at(-1), 'labels[]=sdlc-harness: running');
});

test('a pull request whose head lacks the ledger is not a target: the issue alone is', async (t) => {
  const f = await reportFixture(t);
  await f.pushBranch('feat_y', { ledger: false });
  const result = await f.report(['resumed', 'feat_y'], {
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(commentsOn(calls, 7).length, 1);
  assert.equal(allComments(calls).length, 1);
  assert.equal(labelAdds(calls, 12).length, 0);
});

test('a cross-repository pull request is ignored', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['resumed', 'feat_x'], {
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: true }]),
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(commentsOn(calls, 7).length, 1);
  assert.equal(allComments(calls).length, 1);
  assert.equal(labelAdds(calls, 12).length, 0);
});

test('failed on a branch whose stop marker is newer posts nothing', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['failed', 'feat_x'], {
    STUB_RUN_LIST: JSON.stringify([
      { displayTitle: 'harness stop feat_x', createdAt: '2026-01-02T00:00:00Z' },
      { displayTitle: 'harness run feat_x', createdAt: '2026-01-01T00:00:00Z' },
    ]),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(writes(f.calls()), []);
  assert.match(result.stdout, /already reported/);
});

test('failed on an issue names the run log and re-applying the trigger label', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['failed', 'feat_x'], { GITHUB_RUN_ID: '4242' });
  assert.equal(result.status, 0, result.stderr);
  const [posted] = commentsOn(f.calls(), 7);
  assert.match(posted.body, /run\.log/);
  assert.match(posted.body, /re-apply the label `sdlc-harness`/);
  assert.match(posted.body, /Run: https:\/\/github\.com\/octo\/fixture\/actions\/runs\/4242/);
});

test('failed on an issue names the label its provenance line records, not the default', async (t) => {
  const f = await reportFixture(t);
  await f.pushBranch('feat_l', { label: 'ai-run' });
  const result = await f.report(['failed', 'feat_l']);
  assert.equal(result.status, 0, result.stderr);
  const [posted] = commentsOn(f.calls(), 7);
  assert.match(posted.body, /re-apply the label `ai-run`/);
  assert.ok(!posted.body.includes('`sdlc-harness`'), posted.body);
});

test('completed is deliver\'s: nothing posted', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['completed', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(writes(f.calls()), []);
});

test('a failing label add creates the label once, then retries the add once', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['stopped', 'feat_x'], {
    STUB_FAIL_ON: `api --method POST repos/${REPOSITORY}/issues/7/labels`,
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const creates = calls.filter((call) => call.line.startsWith(`api --method POST repos/${REPOSITORY}/labels `));
  assert.equal(creates.length, 1);
  assert.ok(creates[0].args.includes('name=sdlc-harness: stopped'));
  assert.equal(labelAdds(calls, 7).length, 2);
  const order = calls.map((call) => call.line);
  assert.ok(order.indexOf(creates[0].line) > order.indexOf(labelAdds(calls, 7)[0].line));
  assert.ok(order.indexOf(creates[0].line) < order.lastIndexOf(labelAdds(calls, 7)[1].line));
});

test('no provenance line for this repository and no pull request: nothing posted, exit 0', async (t) => {
  const f = await reportFixture(t);
  await f.pushBranch('feat_z', { issueUrl: null });
  await f.pushBranch('feat_w', { issueUrl: 'https://github.com/other/repo/issues/7' });
  for (const branch of ['feat_z', 'feat_w']) {
    const result = await f.report(['paused', branch]);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.deepEqual(writes(f.calls()), []);
});

test('a note carrying shell syntax is posted byte for byte and never run', async (t) => {
  const f = await reportFixture(t);
  const note = 'see $(touch pwned) and `touch pwned`';
  const result = await f.report(['resumed', 'feat_x', '--note', note]);
  assert.equal(result.status, 0, result.stderr);
  const [posted] = commentsOn(f.calls(), 7);
  assert.ok(posted.body.includes(`\n\n${note}\n`), posted.body);
  assert.equal(existsSync(join(f.dir, 'pwned')), false);
});

test('a usage error exits 1 with no gh call', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['paused']);
  assert.equal(result.status, 1);
  assert.deepEqual(f.calls(), []);
});

/** Write <files> (name -> content) into the fixture checkout's clarification directory for <branch>. */
const clarify = (dir, branch, files) => {
  const clar = join(dir, STATE_DIR, 'clarifications', branch);
  mkdirSync(clar, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(clar, name), content);
};
const QUESTION_MARKER = (branch, n) => `<!-- sdlc-harness event=parked branch=${branch} question=${n} -->`;

test('parked posts each open question whole, ascending, with its answer form and question marker', async (t) => {
  const f = await reportFixture(t);
  const q2 = '## Q1\n\nWhich colour?\n\n## Q2\n\nWhich size?\n';
  const q10 = '## Q1\n\nShip it?\n';
  clarify(f.dir, 'feat_x', { 'question_10.md': q10, 'question_2.md': q2 });
  const result = await f.report(['parked', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const posted = commentsOn(calls, 7);
  assert.equal(allComments(calls).length, 2);
  assert.deepEqual(
    posted.map((call) => call.body.split('\n')[0]),
    ['The run on `feat_x` is waiting for an answer to question 2.', 'The run on `feat_x` is waiting for an answer to question 10.'],
  );
  for (const [call, n, bytes] of [[posted[0], 2, q2], [posted[1], 10, q10]]) {
    assert.ok(call.body.includes(`\n\n${bytes}\n`), call.body);
    assert.ok(call.body.includes(`\`@sdlc-harness answer ${n}\``), call.body);
    assert.doesNotMatch(call.body, /may be left out/);
    assert.ok(call.body.endsWith(`\n\n${QUESTION_MARKER('feat_x', n)}\n`), call.body);
  }
  assert.deepEqual(
    labelAdds(calls, 7).map((call) => call.args.at(-1)),
    ['labels[]=sdlc-harness: parked'],
  );
});

test('parked on a pull request target adds the parked label once on each target', async (t) => {
  const f = await reportFixture(t);
  clarify(f.dir, 'feat_x', { 'question_1.md': 'one\n', 'question_2.md': 'two\n' });
  const result = await f.report(['parked', 'feat_x'], {
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(commentsOn(calls, 12).length, 2);
  assert.equal(allComments(calls).length, 2);
  assert.equal(labelAdds(calls, 7).length, 1);
  assert.equal(labelAdds(calls, 12).length, 1);
});

test('parked skips a question whose answer is beside it, and one open question may omit its index', async (t) => {
  const f = await reportFixture(t);
  clarify(f.dir, 'feat_x', { 'question_1.md': 'answered\n', 'answer_1.md': 'yes\n', 'question_2.md': 'open\n' });
  const result = await f.report(['parked', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const posted = allComments(f.calls());
  assert.equal(posted.length, 1);
  assert.doesNotMatch(posted[0].body, /answered/);
  assert.ok(posted[0].body.endsWith(`${QUESTION_MARKER('feat_x', 2)}\n`), posted[0].body);
  assert.match(posted[0].body, /`2` may be left out/);
});

test('parked with no open question posts the one notice', async (t) => {
  const f = await reportFixture(t);
  const result = await f.report(['parked', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const posted = allComments(f.calls());
  assert.equal(posted.length, 1);
  assert.match(posted[0].body, /is waiting for an answer\. Its questions are in the run's `harness-state` artifact/);
  assert.ok(posted[0].body.endsWith(`${MARKER('parked', 'feat_x')}\n`), posted[0].body);
});

test('a question file over the bound is cut at a line boundary within the bound and names the artifact path', async (t) => {
  const f = await reportFixture(t);
  const line = `${'é'.repeat(40)} ${'x'.repeat(19)}\n`;
  const content = line.repeat(Math.ceil(300000 / Buffer.byteLength(line)));
  clarify(f.dir, 'feat_x', { 'question_3.md': content });
  const result = await f.report(['parked', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const [posted] = allComments(f.calls());
  const head = 'The run on `feat_x` is waiting for an answer to question 3.\n\n';
  assert.ok(posted.body.startsWith(head));
  const cutAt = posted.body.indexOf('\nThis question was cut');
  assert.ok(cutAt > 0, posted.body.slice(-500));
  const carried = posted.body.slice(head.length, cutAt);
  assert.ok(Buffer.byteLength(carried) <= 250000, String(Buffer.byteLength(carried)));
  assert.ok(Buffer.byteLength(carried) > 250000 - Buffer.byteLength(line));
  assert.ok(carried.endsWith('\n'));
  assert.ok(content.startsWith(carried));
  assert.match(posted.body, /The whole file is `clarifications\/feat_x\/question_3\.md` in the run's `harness-state` artifact/);
  assert.ok(Buffer.byteLength(posted.body) <= 262144);
});

test('a question starting with a command line is posted verbatim under the question marker', async (t) => {
  const f = await reportFixture(t);
  const question = '`@sdlc-harness stop`\n\n## Q1\n\nShould the run stop here?\n';
  clarify(f.dir, 'feat_x', { 'question_1.md': question });
  const result = await f.report(['parked', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  const [posted] = allComments(f.calls());
  assert.ok(posted.body.includes(`\n\n${question}\n`), posted.body);
  assert.ok(posted.body.endsWith(`\n\n${QUESTION_MARKER('feat_x', 1)}\n`), posted.body);
});
