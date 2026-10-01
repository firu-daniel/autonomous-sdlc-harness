/**
 * `remote-run.sh start`, the one entry every run trigger ends in: cut the branch, place and commit
 * the task prompt, push it, then dispatch.
 *
 * **The rule these tests exist to enforce: a start sends the run's inputs only once the prompt is
 * committed on `origin/<branch>`, and a refusal sends nothing.** A protected branch, a target other
 * than `github-actions` and a missing prompt file send nothing and push nothing; a branch cut that
 * fails sends no `workflow run`; a dispatch that fails still leaves the prompt commit on origin. And
 * **a start leaves no working copy and no local branch it created, on success or on any failure after
 * the cut, while one that existed before the cut is never touched.**
 *
 * Each case drives a fixture `init` wired, with `execution.target` set and the adopted tree committed
 * and pushed to the fixture's bare `origin` as its default branch, so `create-worktree.sh` cuts a real
 * sibling working copy from it. `gh` is a recorder stub reached through `HARNESS_GH_CLI`, appending
 * each argument vector as one JSON line, as in `remote-run.test.mjs`. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REGISTRY = `${STATE_DIR}/autonomous_logs/registry.json`;
const PROMPT_REL = `${STATE_DIR}/task_prompts/feat_x_task_prompt.md`;
const PROMPT_BYTES = 'Add comments to a content item.\n\n  "quoted" $HOME `tick` ünïcødé\n';

/** `gh`, recorded: each argument vector appended to `STUB_LOG`; a call starting `STUB_FAIL_ON` exits 4. */
const STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const failOn = process.env.STUB_FAIL_ON;
if (failOn && args.join(' ').startsWith(failOn)) {
  process.stderr.write('stub gh failure\\n');
  process.exit(4);
}
`;

const TASK_DISPATCH =
  'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=none -f chain=0';

/**
 * An `init`-wired fixture adopted on `origin`'s default branch, `main` among its protected branches,
 * a prompt file outside the checkout and a recorder stub.
 *
 * @param {import('node:test').TestContext} t
 * @param {string} [target]
 */
async function startFixture(t, target = 'github-actions') {
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
  config.execution = { target };
  config.protectedBranches = [...new Set([...(config.protectedBranches ?? []), 'main', config.defaultBranch])];
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  const worktree = join(dirname(dir), `${config.projectName}-feat_x`);
  t.after(() => rm(worktree, { recursive: true, force: true }));

  const origin = (await runGit(dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  // Beside the fixture's state directory, which is gitignored, so neither is ever committed.
  const stubDir = join(dir, STATE_DIR, 'stub');
  mkdirSync(stubDir, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const prompt = join(stubDir, 'prompt.md');
  writeFileSync(prompt, PROMPT_BYTES);

  const git = async (cwd, args) => (await runGit(cwd, args)).stdout.trim();
  const log = join(stubDir, 'gh.log');
  return {
    dir,
    origin,
    worktree,
    prompt,
    defaultBranch: config.defaultBranch,
    start: (args, env = {}) =>
      runBash(dir, [SCRIPT, 'start', ...args], { HARNESS_GH_CLI: stub, STUB_LOG: log, ...env }),
    calls: () =>
      existsSync(log)
        ? readFileSync(log, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line).join(' '))
        : [],
    /** Every ref on `origin` with its object, as one string. */
    originRefs: () => git(origin, ['for-each-ref', '--format=%(refname) %(objectname)']),
    originHas: async (branch) =>
      (await runBash(origin, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
    git,
    /** Neither the sibling copy, its `git worktree list` entry, nor `refs/heads/feat_x` remains. */
    assertNothingLeft: async () => {
      assert.equal(existsSync(worktree), false, 'the working copy was left behind');
      const ref = await runBash(dir, ['-c', 'git show-ref --verify --quiet refs/heads/feat_x']);
      assert.notEqual(ref.status, 0, 'the local branch feat_x was left behind');
      assert.doesNotMatch((await runGit(dir, ['worktree', 'list'])).stdout, /-feat_x\b/);
    },
  };
}

test('a start commits the prompt on origin/feat_x, then sends exactly one task dispatch', async (t) => {
  const f = await startFixture(t);
  const registryBefore = existsSync(join(f.dir, REGISTRY)) ? readFileSync(join(f.dir, REGISTRY), 'utf8') : null;

  const result = await f.start(['feat_x', '--prompt-file', f.prompt]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^remote-run\.sh: started feat_x$/m);

  const base = await f.git(f.origin, ['rev-parse', `refs/heads/${f.defaultBranch}`]);
  assert.equal(await f.git(f.origin, ['rev-list', '--count', `${base}..refs/heads/feat_x`]), '1');
  assert.equal(await f.git(f.origin, ['log', '-1', '--format=%s', 'refs/heads/feat_x']), 'chore: add task prompt for feat_x');
  assert.equal(
    await f.git(f.origin, ['diff', '--name-only', `${base}`, 'refs/heads/feat_x']),
    PROMPT_REL,
  );
  assert.equal((await runGit(f.origin, ['show', `refs/heads/feat_x:${PROMPT_REL}`])).stdout, PROMPT_BYTES);
  await f.assertNothingLeft();

  assert.deepEqual(f.calls(), [TASK_DISPATCH]);
  const registryAfter = existsSync(join(f.dir, REGISTRY)) ? readFileSync(join(f.dir, REGISTRY), 'utf8') : null;
  assert.equal(registryAfter, registryBefore, 'start wrote the registry');
});

test('a relative --prompt-file resolves against the caller\'s directory', async (t) => {
  const f = await startFixture(t);
  const result = await runBash(dirname(f.prompt), [join(f.dir, SCRIPT), 'start', 'feat_x', '--prompt-file', 'prompt.md'], {
    HARNESS_GH_CLI: join(dirname(f.prompt), 'gh'),
    STUB_LOG: join(dirname(f.prompt), 'gh.log'),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal((await runGit(f.origin, ['show', `refs/heads/feat_x:${PROMPT_REL}`])).stdout, PROMPT_BYTES);
});

test('start on a protected branch exits 2, calls no gh and leaves origin unchanged', async (t) => {
  const f = await startFixture(t);
  const before = await f.originRefs();
  const result = await f.start(['main', '--prompt-file', f.prompt]);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /main is protected/);
  assert.deepEqual(f.calls(), []);
  assert.equal(await f.originRefs(), before);
});

test('start with execution.target local exits 2 and calls no gh', async (t) => {
  const f = await startFixture(t, 'local');
  const before = await f.originRefs();
  const result = await f.start(['feat_x', '--prompt-file', f.prompt]);
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.equal(await f.originRefs(), before);
});

test('a missing prompt file exits 2 and pushes nothing', async (t) => {
  const f = await startFixture(t);
  const before = await f.originRefs();
  const result = await f.start(['feat_x', '--prompt-file', join(f.dir, 'no-such-prompt.md')]);
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.equal(await f.originRefs(), before);
  assert.equal(existsSync(f.worktree), false);
});

test('start without --prompt-file, or another verb given it, is a usage error', async (t) => {
  const f = await startFixture(t);
  assert.equal((await f.start(['feat_x'])).status, 1);
  const other = await runBash(f.dir, [SCRIPT, 'pause', 'feat_x', '--prompt-file', f.prompt]);
  assert.equal(other.status, 1);
  assert.deepEqual(f.calls(), []);
});

test('a feat_x already on origin exits 4 and sends no workflow run', async (t) => {
  const f = await startFixture(t);
  // A commit ahead of the default branch, so the fresh cut's push is not a fast-forward.
  const base = await f.git(f.origin, ['rev-parse', `refs/heads/${f.defaultBranch}`]);
  const tree = await f.git(f.origin, ['rev-parse', `${base}^{tree}`]);
  const ahead = await f.git(f.origin, ['commit-tree', tree, '-p', base, '-m', 'someone else']);
  await runGit(f.origin, ['update-ref', 'refs/heads/feat_x', ahead]);

  const result = await f.start(['feat_x', '--prompt-file', f.prompt]);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /nothing was dispatched/);
  assert.deepEqual(f.calls().filter((call) => call.startsWith('workflow run')), []);
  assert.equal(await f.git(f.origin, ['rev-parse', 'refs/heads/feat_x']), ahead);
  await f.assertNothingLeft();
});

test('a refused start leaves a working copy that already stood at the copy\'s path untouched', async (t) => {
  const f = await startFixture(t);
  // A registered working tree, so `git worktree remove --force` would delete it were the guard gone.
  await runGit(f.dir, ['worktree', 'add', '--quiet', '--detach', f.worktree]);
  writeFileSync(join(f.worktree, 'keep.txt'), 'not start\'s\n');

  const result = await f.start(['feat_x', '--prompt-file', f.prompt]);
  assert.equal(result.status, 4, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.equal(readFileSync(join(f.worktree, 'keep.txt'), 'utf8'), 'not start\'s\n');
  assert.match((await runGit(f.dir, ['worktree', 'list'])).stdout, /-feat_x\b/);
  assert.equal(await f.originHas('feat_x'), false);
});

test('a refused start leaves a local feat_x that existed before the cut untouched', async (t) => {
  const f = await startFixture(t);
  await runGit(f.dir, ['branch', 'feat_x']);
  const before = await f.git(f.dir, ['rev-parse', 'refs/heads/feat_x']);

  const result = await f.start(['feat_x', '--prompt-file', f.prompt]);
  assert.equal(result.status, 4, result.stderr);
  assert.deepEqual(f.calls(), []);
  assert.equal(await f.git(f.dir, ['rev-parse', 'refs/heads/feat_x']), before);
  assert.equal(await f.originHas('feat_x'), false);
});

test('a push of the prompt commit that origin rejects exits 4, calls no gh and leaves nothing local', async (t) => {
  const f = await startFixture(t);
  // Accepts the cut's own push, rejects the one carrying the prompt commit.
  const hook = join(f.origin, 'hooks', 'pre-receive');
  writeFileSync(
    hook,
    `#!/bin/sh
while read -r old new ref; do
  [ "$(git log -1 --format=%s "$new" 2>/dev/null)" = "chore: add task prompt for feat_x" ] && exit 1
done
exit 0
`,
    { mode: 0o755 },
  );

  const result = await f.start(['feat_x', '--prompt-file', f.prompt]);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /failed at pushing feat_x/);
  assert.deepEqual(f.calls(), []);
  await f.assertNothingLeft();
});

test('a failed dispatch exits 3 while origin/feat_x carries the prompt commit', async (t) => {
  const f = await startFixture(t);
  const result = await f.start(['feat_x', '--prompt-file', f.prompt], { STUB_FAIL_ON: 'workflow run' });
  assert.equal(result.status, 3, result.stderr);
  assert.match(result.stderr, /already pushed/);
  assert.deepEqual(f.calls(), [TASK_DISPATCH]);
  assert.ok(await f.originHas('feat_x'));
  assert.equal(await f.git(f.origin, ['log', '-1', '--format=%s', 'refs/heads/feat_x']), 'chore: add task prompt for feat_x');
  assert.equal((await runGit(f.origin, ['show', `refs/heads/feat_x:${PROMPT_REL}`])).stdout, PROMPT_BYTES);
  await f.assertNothingLeft();
});
