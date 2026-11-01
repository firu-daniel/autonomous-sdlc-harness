/**
 * The written watcher's review drop — the reused working copy, and the remote arm's fetch,
 * fast-forward, commit and push — driven by one `tick` of the `init`-written
 * `autonomous-watcher.sh` against a copy a sandboxed session could have written to.
 *
 * **The rule these tests exist to enforce: a review drop never runs code a sandboxed session
 * planted in the copy, never installs a run-authored protected path, and never reuses a clone whose
 * `.git` carries a file or key a clone the harness made has not; an honest copy's outcome is
 * unchanged.**
 *
 * The fixture is `createWatcherFixture`'s, adopted on a bare `origin`, with the run's copy cut by
 * `create-worktree.sh` from a task drop: a clone, its record's `copy_kind` `clone`. Its main
 * `.git/config` sets the repo-relative `core.hooksPath` `githooks`, so an unpinned hook-running call
 * resolves hooks inside the copy, and `extensions.worktreeConfig=true`, so a legacy copy's
 * `config.worktree` is live for an unpinned call; without them the mutations below could not reach
 * their payloads. A protected path is committed the way a session in a clone commits one it cannot
 * write: `hash-object` / `update-index` / `write-tree` / `commit-tree` in the clone and an
 * `update-ref` of the clone's own branch, with no working-tree write; the review drop's sync-in
 * brings it into the main checkout. `{ legacy: true }` replaces the clone with a linked worktree of
 * the main checkout on the branch, its record carrying no `copy_kind` — a parked run from before the
 * clone layout. Every planted hook, fsmonitor, filter driver, `sshCommand` and `uploadpack` writes
 * a marker file named for itself.
 *
 * Where each plant lives on the clone layout:
 * - Clone-applicable, re-pointed at the clone: the nested repository behind a gitlink (L2), the
 *   submodule's own config (L3), the committed `.gitattributes` (L4), the committed or untracked
 *   protected path (L5, L6, L9, L10), the symlinked `user_reviews` (L8), and the job commits and
 *   staged index entry of the remote arm (R2–R5).
 * - Worktree-only, given its clone equivalent, each refused by the clone trust check with no
 *   marker and the main checkout's branch unmoved: the record's `config.worktree` (L1, R1: a planted
 *   `.git/config.worktree`; L1c and L4: the same keys in `.git/config`, off the allow-list), the
 *   `.git` pointer (L11: a planted `.git/commondir`), the record's `HEAD` (L7: the clone's own
 *   `.git/HEAD`).
 * - Worktree-only, kept as migration coverage on a legacy worktree: L1, L7 and R1, each the
 *   original plant, because the worktree arm still serves a parked legacy run and the clone layout
 *   cannot reach the behaviour each asserts.
 *
 * RED ONCE — each mutation applied once to the fixture's own written copy of
 * `autonomous-watcher.sh` (L6, L8, L9, L10, R2's second, R4, R5 and every clone-check mutation: to
 * its `lib/harness-run-lib.sh`), never to the template, the file run, the failure observed;
 * measured on the clone layout unless the case is a legacy one:
 * - (L1) `config.worktree` dropped from `hr_clone_target_check_var`'s absent-file loop → fails on the
 *   record's `status`: `completed`, not `failed`.
 * - (L1c) `hr_clone_config_check_var`'s off-allow-list test skipped → fails on the record's
 *   `status`: `completed`, not `failed`.
 * - (L1, legacy) `git -C "$worktree" status --short | grep -v '^??'` restored as the reuse path's
 *   clean test in place of `hr_run_copy_clean` → fails `a planted payload ran`, holding
 *   `L1-fsmonitor`.
 * - (L2) the (L1, legacy) mutation → fails `a planted payload ran`, holding `L2-fsmonitor`.
 * - (L3) the (L1, legacy) mutation → fails `a planted payload ran`, holding `L3-fsmonitor`.
 * - (L4) the (L1c) mutation → fails on the record's `status`: `completed`, not `failed`.
 * - (L5) the reuse path's `hr_run_surface_check_var "refs/heads/$branch" copy` dropped → fails on
 *   the record's `status`: `completed`, not `failed`.
 * - (L6) the `ls-files --others` test dropped from `hr_run_worktree_diff_var` → fails on the
 *   record's `status`: `completed`, not `failed`.
 * - (L7) the registry test in `hr_clone_target_check_var` skipped → fails on the refusal, which
 *   names the derived path rather than the registry.
 * - (L7, legacy) the reuse path's compare of the inbox branch with `HR_RUN_COPY_BRANCH` dropped →
 *   fails on the record's `status`: `completed`, not `failed`.
 * - (L8) both `hr_run_path_safe` calls in `hr_place_artifact` dropped → fails `the placement wrote
 *   outside the copy`, holding `feat_x_review.md`.
 * - (L9) `hr_run_surface_check_var`'s merge base taken against the local
 *   `refs/remotes/origin/<defaultBranch>` in place of `HR_RUN_TRUSTED_BASE` → fails on the
 *   record's `status`: `completed`, not `failed`.
 * - (L10) `hr_run_worktree_diff_var` using `GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index"` in place
 *   of the temporary index → fails on the record's `status`: `completed`, not `failed`.
 * - (L11) `commondir` dropped from `hr_clone_target_check_var`'s absent-file loop → fails on the
 *   record's `status`: `completed`, not `failed`.
 * - (R1) the (L1) mutation → fails on the record's `status`: `running`, not `failed`.
 * - (R1, legacy) `git -C "$worktree" fetch origin "$branch"` restored in place of the pinned
 *   main-checkout fetch → fails `a planted payload ran`, holding `R1-uploadpack`.
 * - (R2) `git -C "$worktree" merge --ff-only "origin/$branch"` restored in place of
 *   `hr_run_fast_forward_var` → fails `refs/heads/feat_x moved`. Separately, the surface check
 *   inside `hr_run_fast_forward_var` skipped → fails `refs/heads/feat_x moved`.
 * - (R3) the review commit made by an unpinned `git add` and `git commit` in the clone in
 *   `watcher_commit` → fails `a commit hook ran`, holding `R3-commit-msg` and `R3-pre-commit`.
 *   Routed through `commit-on-branch.sh --repo` instead, it passes: that wrapper runs no commit hook.
 * - (R4) `hr_commit_placed`'s tree built from the copy's own index rather than the temporary one →
 *   fails on the commit's paths, which carry `extra`.
 * - (R5) the L9 mutation → fails `refs/heads/feat_x moved`: the job tip was fast-forwarded, and the
 *   review committed and dispatched on it.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runBash, runGit } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;
const REVIEW = 'feat_x_review.md';
const REVIEW_REL = `${STATE_DIR}/user_reviews/${REVIEW}`;
const REVIEW_SUBJECT = 'chore: add user review for feat_x';
const PIN = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'submodule.recurse=false'];
/** The identity a clone-side `commit-tree` takes on its command line: the clone's config has none. */
const AUTHOR = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];

/** `gh`, recorded: each argument vector appended to `STUB_LOG`; `run list` answers no runs. */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
if (args.join(' ').startsWith('run list')) process.stdout.write('[]');
`;

/** Run `script` under `bash -c` in `cwd`; throw on a non-zero exit, else return trimmed stdout. */
async function sh(cwd, script, args = [], env = {}) {
  const result = await runBash(cwd, ['-c', script, '_', ...args], env);
  if (result.status !== 0) {
    throw new Error(`fixture setup: \`${script} ${args.join(' ')}\` exited ${result.status}: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

/** The fixture's own git, pinned so that no payload it plants runs while it plants the next. */
const git = (cwd, args, env = {}) => sh(cwd, 'git "$@"', [...PIN, ...args], env);

/**
 * A watcher fixture adopted on `origin`'s default branch, whose main `.git/config` sets
 * `extensions.worktreeConfig=true` and the repo-relative `core.hooksPath` `githooks`, with the run's
 * clone cut by `create-worktree.sh` from a task drop and its record left `completed`. `legacy`
 * replaces the clone with a linked worktree on the branch at the same path and drops the record's
 * `copy_kind`. `remote` sets `execution.target` `github-actions` with `gh` recorded; `baseHooks`
 * commits a marker-writing `githooks/pre-commit` and `githooks/commit-msg` on the default branch
 * first.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ remote?: boolean, baseHooks?: boolean, legacy?: boolean }} [options]
 */
async function createReviewFixture(t, { remote = false, baseHooks = false, legacy = false } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const copy = `${w.dir}-${w.branch}`;
  const origin = `${w.dir}-origin.git`;
  const markers = `${w.dir}-markers`;
  const payloads = `${w.dir}-payloads`;
  const outside = `${w.dir}-outside`;
  for (const dir of [copy, markers, payloads, outside]) t.after(() => rm(dir, { recursive: true, force: true }));
  for (const dir of [markers, payloads, outside]) await mkdir(dir);
  /** A hook body writing `<markers>/<name>`, then `tail`. */
  const markerBody = (name, tail = 'exit 0') => `#!/bin/sh\n: > '${join(markers, name)}'\n${tail}\n`;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  if (remote) config.execution = { target: 'github-actions' };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  if (baseHooks) {
    for (const name of ['pre-commit', 'commit-msg']) {
      await writeFile(join(w.dir, 'githooks', name), markerBody(`R3-${name}`), { mode: 0o755 });
    }
  }

  await runGit(w.dir, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(w.dir, ['config', 'core.hooksPath', 'githooks']);
  await git(w.dir, ['add', '-A']);
  await git(w.dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await git(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const ghStub = join(w.dir, 'watcher-test', 'gh');
  const ghLog = join(w.dir, 'watcher-test', 'gh.log');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });
  const tick = (env = {}) => w.tick({ HARNESS_GH_CLI: ghStub, STUB_LOG: ghLog, PUSH_RETRY_DELAY_SECS: '0', ...env });
  const inbox = join(w.dir, STATE_DIR, 'autonomous_inbox');
  /** Assign `fields` to the run's record; a field whose value is `undefined` is removed. */
  const patchRecord = async (fields) => {
    const path = join(w.dir, REGISTRY_PATH);
    const registry = JSON.parse(readFileSync(path, 'utf8'));
    Object.assign(registry.runs[w.branch], fields);
    await writeFile(path, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  };

  await writeFile(join(inbox, `${w.branch}_task_prompt.md`), 'do the thing\n', 'utf8');
  await tick();
  assert.ok(existsSync(copy), `create-worktree.sh cut no working copy\n${w.watcherLog()}`);
  assert.equal(w.record().copy_kind, 'clone', `create-worktree.sh cut no clone\n${w.watcherLog()}`);
  await patchRecord({ status: 'completed' });
  if (legacy) {
    await rm(copy, { recursive: true, force: true });
    await git(w.dir, ['worktree', 'add', '--quiet', copy, w.branch]);
    await patchRecord({ copy_kind: undefined });
  }

  const ref = `refs/heads/${w.branch}`;
  const f = {
    ...w,
    config,
    copy,
    origin,
    markers,
    payloads,
    outside,
    ref,
    /** The copy's git directory: the clone's `.git`, or a legacy worktree's record. */
    recordDir: await git(copy, ['rev-parse', '--absolute-git-dir']),
    tick,
    patchRecord,
    markerBody,
    /** An executable payload outside the fixture that writes `<markers>/<name>`, then `tail`. */
    async payload(name, tail = 'exit 1') {
      const path = join(payloads, `${name}.sh`);
      await writeFile(path, markerBody(name, tail), { mode: 0o755 });
      return path;
    },
    drop: (body = 'fix the button\n') => writeFile(join(inbox, REVIEW), body, 'utf8'),
    ghCalls: () =>
      existsSync(ghLog)
        ? readFileSync(ghLog, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).join(' '))
        : [],
    workflowRuns() {
      return this.ghCalls().filter((c) => c.startsWith('workflow run'));
    },
    markerNames: () => readdirSync(markers).sort(),
    tip: () => git(w.dir, ['rev-parse', ref]),
    originTip: (name = w.branch) => git(origin, ['rev-parse', `refs/heads/${name}`]),
    failedArchives: () => readdirSync(join(inbox, '.processed')).filter((n) => n.startsWith('failed_')),
    failures: () => w.notifications().filter((n) => n.event === 'failed'),
    /**
     * Commit `entries` (and the `removals`) on the clone's branch the way a sandboxed session in it
     * can: by plumbing through the clone's own index, object store and `refs/heads/<branch>`, writing
     * no working-tree file and leaving the main checkout's branch where it was.
     *
     * @param {{ path: string, content?: string, oid?: string, mode?: string }[]} entries
     */
    async commitInCopy(entries, message, removals = []) {
      for (const path of removals) await git(copy, ['update-index', '--force-remove', path]);
      for (const { path, content, oid, mode = '100644' } of entries) {
        const object = oid ?? (await sh(copy, 'printf "%s" "$1" | git hash-object -w --no-filters --stdin', [content]));
        await git(copy, ['update-index', '--add', '--cacheinfo', `${mode},${object},${path}`]);
      }
      return this.commitCopyIndex(message);
    },
    /** Commit the clone's index as it stands on the clone's branch, moving the clone's ref alone. */
    async commitCopyIndex(message) {
      const tree = await git(copy, ['write-tree']);
      const parent = await git(copy, ['rev-parse', ref]);
      const commit = await git(copy, [...AUTHOR, 'commit-tree', tree, '-p', parent, '-m', message]);
      await git(copy, ['update-ref', ref, commit, parent]);
      return commit;
    },
    /** A job's commit of `entries` on `origin/<branch>`, built in the main repository by plumbing. */
    async jobCommit(entries, message = 'job: advance the branch') {
      const env = { GIT_INDEX_FILE: join(payloads, 'job-index') };
      const parent = await git(origin, ['rev-parse', ref]);
      await git(w.dir, ['read-tree', parent], env);
      for (const { path, content, mode = '100644' } of entries) {
        const blob = await sh(w.dir, 'printf "%s" "$1" | git hash-object -w --no-filters --stdin', [content]);
        await git(w.dir, ['update-index', '--add', '--cacheinfo', `${mode},${blob},${path}`], env);
      }
      const tree = await git(w.dir, ['write-tree'], env);
      const commit = await git(w.dir, ['commit-tree', tree, '-p', parent, '-m', message]);
      await git(w.dir, ['push', '--quiet', '--no-verify', origin, `${commit}:${ref}`]);
      return commit;
    },
  };
  return f;
}

/**
 * A refusal: the record `failed`, no launch and no marker, and the failure notification's detail
 * matching `reason`. A refusal before the placement archives the drop as `failed_<ts>_<name>`; one
 * after it (`placed`) finds the drop already archived as placed.
 */
function assertRefused(f, launchesBefore, reason, { placed = false } = {}) {
  const detail = JSON.stringify(f.notifications()) + '\n' + f.watcherLog();
  assert.deepEqual(f.markerNames(), [], 'a planted payload ran');
  assert.equal(f.record().status, 'failed', detail);
  assert.equal(f.prompts().length, launchesBefore, 'the drop was launched');
  assert.equal(f.failedArchives().filter((n) => n.endsWith(`_${REVIEW}`)).length, placed ? 0 : 1, detail);
  assert.match(f.failures().at(-1)?.detail ?? '', reason, detail);
}

/** A local launch: the review placed, the agent launched once more, no marker. */
function assertLaunched(f, launchesBefore) {
  const detail = JSON.stringify(f.notifications()) + '\n' + f.watcherLog();
  assert.deepEqual(f.markerNames(), [], 'a planted payload ran');
  assert.equal(f.prompts().length, launchesBefore + 1, `the drop was not launched\n${detail}`);
  assert.equal(f.record().status, 'completed', detail);
  assert.equal(f.record().engine, 'user_review');
  assert.equal(readFileSync(join(f.copy, REVIEW_REL), 'utf8'), 'fix the button\n');
}

/**
 * `plant` run on a clone fixture, then a drop: refused by the clone trust check with `reason`, no
 * marker, nothing launched or dispatched, and the main checkout's and origin's branch unmoved.
 */
async function assertClonePlantRefused(f, reason, plant) {
  const before = f.prompts().length;
  const runs = f.workflowRuns().length;
  await plant();
  const tip = await f.tip();
  const originTip = await f.originTip();

  await f.drop();
  await f.tick();

  assertRefused(f, before, reason);
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
  assert.equal(await f.originTip(), originTip, `origin's ${f.ref} moved`);
  assert.equal(f.workflowRuns().length, runs, 'a workflow run was sent');
  assert.equal(existsSync(join(f.copy, REVIEW_REL)), false, 'the review was placed in the refused clone');
}

/** The clone trust check's sentence for a planted `.git/<name>`. */
const plantedFile = (name) => new RegExp(`is a clone, but \\S*/\\.git/${name.replaceAll('.', '\\.')} exists, and a clone the harness made has none`);

/** The clone trust check's sentence for `.git/config` keys off the allow-list. */
const offAllowList = (keys) => new RegExp(`\\.git/config sets ${keys}, which the clone allow-list does not hold`);

// ---------------------------------------------------------------------------------------------
// Local reuse.
// ---------------------------------------------------------------------------------------------

test('a clean reused clone launches, with the review placed and left uncommitted', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const tip = await f.tip();
  const before = f.prompts().length;

  await f.drop();
  await f.tick();

  assertLaunched(f, before);
  assert.equal(await f.tip(), tip, 'the local review drop committed');
  assert.equal(await git(f.copy, ['ls-files', '--', REVIEW_REL]), '', 'the review was staged');
});

test("(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches", async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  const nested = join(f.copy, 'nested');
  await mkdir(nested);
  await git(nested, ['init', '--quiet']);
  await writeFile(join(nested, 'n.txt'), 'n\n', 'utf8');
  await git(nested, ['add', 'n.txt']);
  await git(nested, ['-c', 'user.name=n', '-c', 'user.email=n@example.invalid', 'commit', '--quiet', '-m', 'n']);
  await f.commitInCopy([{ path: 'nested', oid: await git(nested, ['rev-parse', 'HEAD']), mode: '160000' }], 'run: add a gitlink');
  await git(nested, ['config', 'core.fsmonitor', await f.payload('L2-fsmonitor')]);

  await f.drop();
  await f.tick();

  assertLaunched(f, before);
});

test("(L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches", async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  const source = `${f.dir}-subsource`;
  t.after(() => rm(source, { recursive: true, force: true }));
  await mkdir(source);
  await git(source, ['init', '--quiet']);
  await writeFile(join(source, 's.txt'), 's\n', 'utf8');
  await git(source, ['add', 's.txt']);
  await git(source, ['-c', 'user.name=s', '-c', 'user.email=s@example.invalid', 'commit', '--quiet', '-m', 's']);
  await git(f.copy, ['-c', 'protocol.file.allow=always', 'submodule', '--quiet', 'add', source, 'sub']);
  // `submodule add` records the submodule in the clone's .git/config, which the profile denies a
  // session and the allow-list would refuse; the submodule's own .git/modules/sub stays.
  await git(f.copy, ['config', '--file', join(f.recordDir, 'config'), '--remove-section', 'submodule.sub']);
  await f.commitCopyIndex('run: add a submodule');
  const moduleDir = await git(join(f.copy, 'sub'), ['rev-parse', '--absolute-git-dir']);
  assert.ok(moduleDir.startsWith(join(f.recordDir, 'modules')), `the submodule's git directory is ${moduleDir}`);
  await git(f.dir, ['config', '--file', join(moduleDir, 'config'), 'core.fsmonitor', await f.payload('L3-fsmonitor')]);
  await runGit(f.dir, ['config', 'submodule.recurse', 'true']);

  await f.drop();
  await f.tick();

  assertLaunched(f, before);
});

test('(L5) a committed .claude/settings.json change, the working-tree file untouched, is refused', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  const settings = '.claude/settings.json';
  await f.commitInCopy([{ path: settings, content: '{"permissions":{"allow":["Bash"]}}\n' }], 'run: widen the profile');
  // The clone's index is sandbox-writable too: marked unchanged, the stale working-tree file reads
  // clean, so only the surface check stands between this tip and a launch.
  await git(f.copy, ['update-index', '--assume-unchanged', settings]);

  await f.drop();
  await f.tick();

  assertRefused(f, before, /files that run outside the sandbox.*\.claude\/settings\.json/);
});

test('(L6) an untracked githooks/post-checkout is refused', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  await writeFile(join(f.copy, 'githooks', 'post-checkout'), f.markerBody('L6-post-checkout'), { mode: 0o755 });

  await f.drop();
  await f.tick();

  assertRefused(f, before, /files that run outside the sandbox.*githooks\/post-checkout/);
});

test('(L8) a user_reviews directory that is a symlink out of the clone is refused, and nothing is written outside', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  const dir = `${STATE_DIR}/user_reviews`;
  const tracked = (await git(f.copy, ['ls-files', '--', dir])).split('\n').filter(Boolean);
  await f.commitInCopy([{ path: dir, content: f.outside, mode: '120000' }], 'run: redirect user_reviews', tracked);
  await rm(join(f.copy, dir), { recursive: true, force: true });
  await symlink(f.outside, join(f.copy, dir));

  await f.drop();
  await f.tick();

  assert.deepEqual(readdirSync(f.outside), [], 'the placement wrote outside the copy');
  assertRefused(f, before, /could not be placed/);
});

test('(L9) a forged base: the local default-branch refs pointed at a payload tip do not pass it', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  const settings = '.claude/settings.json';
  const content = JSON.stringify({
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: `: > '${join(f.markers, 'L9-session-start')}'` }] }] },
  });
  const commit = await f.commitInCopy([{ path: settings, content }], 'run: add a session hook');
  await writeFile(join(f.copy, settings), content, 'utf8');
  const defaultBranch = f.config.defaultBranch;
  const originDefault = await f.originTip(defaultBranch);
  // The payload tip's objects brought into the main repository, so its refs can name it there too.
  await git(f.dir, ['fetch', '--quiet', '--no-tags', f.copy, f.ref]);
  for (const repo of [f.dir, f.copy]) {
    await git(repo, ['update-ref', `refs/remotes/origin/${defaultBranch}`, commit]);
  }
  await git(f.dir, ['update-ref', `refs/heads/${defaultBranch}`, commit]);

  await f.drop();
  await f.tick();

  assertRefused(f, before, /files that run outside the sandbox.*\.claude\/settings\.json/);
  assert.equal(await f.originTip(defaultBranch), originDefault, "origin's default branch moved");
});

test("(L10) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused", async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  const before = f.prompts().length;
  const settings = '.claude/settings.json';
  const content = JSON.stringify({
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: `: > '${join(f.markers, 'L10-session-start')}'` }] }] },
  });
  await writeFile(join(f.copy, settings), content, 'utf8');
  await git(f.copy, ['update-index', '--skip-worktree', settings]);

  await f.drop();
  await f.tick();

  assertRefused(f, before, /files that run outside the sandbox.*\.claude\/settings\.json/);
});

// ---------------------------------------------------------------------------------------------
// The clone equivalents of the worktree-only plants.
// ---------------------------------------------------------------------------------------------

test("(L1) a .git/config.worktree planted in the clone, carrying core.fsmonitor, is refused and never read", async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  await assertClonePlantRefused(f, plantedFile('config.worktree'), async () => {
    await git(f.dir, ['config', '--file', join(f.recordDir, 'config.worktree'), 'core.fsmonitor', await f.payload('L1-fsmonitor')]);
  });
});

test("(L1c) a core.fsmonitor in the clone's .git/config, off the allow-list, is refused and never run", async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  await assertClonePlantRefused(f, offAllowList('core\\.fsmonitor'), async () => {
    await git(f.dir, ['config', '--file', join(f.recordDir, 'config'), 'core.fsmonitor', await f.payload('L1c-fsmonitor')]);
  });
});

test("(L4) a clean filter the clone's .git/config defines for a committed .gitattributes is refused and never run", async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  await assertClonePlantRefused(f, offAllowList('filter\\.planted\\.clean'), async () => {
    const attributes = '*.dat filter=planted\n';
    const data = 'data\n';
    await writeFile(join(f.copy, '.gitattributes'), attributes, 'utf8');
    await writeFile(join(f.copy, 'payload.dat'), data, 'utf8');
    await f.commitInCopy(
      [
        { path: '.gitattributes', content: attributes },
        { path: 'payload.dat', content: data },
      ],
      'run: select a filter',
    );
    await git(f.dir, ['config', '--file', join(f.recordDir, 'config'), 'filter.planted.clean', await f.payload('L4-clean', 'cat')]);
    const later = new Date(Date.now() + 60_000);
    await utimes(join(f.copy, 'payload.dat'), later, later);
  });
});

test('(L7) a clone .git/HEAD naming another branch is refused: the registry records no clone of it there', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  await assertClonePlantRefused(f, /its \.git is not a regular pointer file, and the run registry records no clone of /, async () => {
    await git(f.copy, ['branch', 'other', f.ref]);
    await writeFile(join(f.recordDir, 'HEAD'), 'ref: refs/heads/other\n', 'utf8');
  });
});

test('(L11) a .git/commondir planted in the clone, naming a repository whose config carries a payload, is refused', async (t) => {
  const f = await createReviewFixture(t);
  if (f === null) return;
  await assertClonePlantRefused(f, plantedFile('commondir'), async () => {
    // A `.git` holding the branch at the clone's tip, so the common dir resolves and the clone's ref
    // reads the same through it: only the clone check's own file test refuses it.
    const planted = join(f.payloads, 'planted');
    await git(f.payloads, ['init', '--quiet', planted]);
    await git(planted, ['fetch', '--quiet', f.copy, `${f.ref}:${f.ref}`]);
    await git(planted, ['config', 'core.fsmonitor', await f.payload('L11-fsmonitor')]);
    await writeFile(join(f.recordDir, 'commondir'), `${join(planted, '.git')}\n`, 'utf8');
  });
});

test('(R1) a .git/config.worktree planted in the clone, carrying sshCommand and uploadpack, is refused before the fetch', async (t) => {
  const f = await createReviewFixture(t, { remote: true });
  if (f === null) return;
  await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);
  await assertClonePlantRefused(f, plantedFile('config.worktree'), async () => {
    const configWorktree = join(f.recordDir, 'config.worktree');
    await git(f.dir, ['config', '--file', configWorktree, 'core.sshCommand', await f.payload('R1-sshCommand')]);
    await git(f.dir, ['config', '--file', configWorktree, 'remote.origin.uploadpack', await f.payload('R1-uploadpack')]);
  });
});

// ---------------------------------------------------------------------------------------------
// The remote arm.
// ---------------------------------------------------------------------------------------------

test('a remote drop fast-forwards an honest origin/<branch>, commits the review, pushes and dispatches once', async (t) => {
  const f = await createReviewFixture(t, { remote: true });
  if (f === null) return;
  const job = await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);
  const runs = f.workflowRuns().length;

  await f.drop();
  await f.tick();

  assert.equal(await git(f.dir, ['log', '-1', '--format=%s', f.ref]), REVIEW_SUBJECT);
  assert.equal(await git(f.dir, ['rev-parse', `${f.ref}~1`]), job, 'the review is not on top of the job commit');
  assert.equal(await f.originTip(), await f.tip(), 'the push did not land');
  assert.equal(await git(f.copy, ['rev-parse', f.ref]), await f.tip(), "the clone's own branch is not the pushed tip");
  assert.equal(f.workflowRuns().length, runs + 1);
  assert.equal(f.record().status, 'running');
  assert.deepEqual(f.markerNames(), []);
});

test('an identical re-drop on the remote arm skips the commit and pushes anyway', async (t) => {
  const f = await createReviewFixture(t, { remote: true });
  if (f === null) return;
  await f.drop();
  await f.tick();
  const committed = await f.tip();
  assert.equal(await git(f.dir, ['log', '-1', '--format=%s', f.ref]), REVIEW_SUBJECT);
  await f.patchRecord({ status: 'completed' });

  await f.drop();
  await f.tick();

  assert.equal(await f.tip(), committed, 'the identical re-drop made a commit');
  assert.match(f.watcherLog(), /already committed \(identical re-drop\)/);
  assert.equal(await f.originTip(), committed);
});

test('(R2) a job commit adding reference-transaction and post-merge hooks is refused before the fast-forward', async (t) => {
  const f = await createReviewFixture(t, { remote: true });
  if (f === null) return;
  const before = f.prompts().length;
  const runs = f.workflowRuns().length;
  const tip = await f.tip();
  await f.jobCommit([
    { path: 'githooks/reference-transaction', content: f.markerBody('R2-reference-transaction'), mode: '100755' },
    { path: 'githooks/post-merge', content: f.markerBody('R2-post-merge'), mode: '100755' },
  ]);

  await f.drop();
  await f.tick();

  assert.equal(await f.tip(), tip, `${f.ref} moved`);
  assert.equal(f.workflowRuns().length, runs, 'a workflow run was sent');
  assertRefused(f, before, /fast-forward .*failed/);
});

test('(R3) pre-commit and commit-msg hooks on the branch and the base never run on the review commit', async (t) => {
  const f = await createReviewFixture(t, { remote: true, baseHooks: true });
  if (f === null) return;
  const runs = f.workflowRuns().length;

  await f.drop();
  await f.tick();

  assert.deepEqual(f.markerNames(), [], 'a commit hook ran');
  assert.equal(await git(f.dir, ['log', '-1', '--format=%s', f.ref]), REVIEW_SUBJECT);
  assert.equal(await f.originTip(), await f.tip());
  assert.equal(f.workflowRuns().length, runs + 1);
});

test("(R4) an extra entry staged in the clone's index is not committed with the review", async (t) => {
  const f = await createReviewFixture(t, { remote: true });
  if (f === null) return;
  const runs = f.workflowRuns().length;
  // A gitlink: the one staged entry the copy's clean test (`--ignore-submodules`) lets through.
  await git(f.copy, ['update-index', '--add', '--cacheinfo', `160000,${await f.tip()},extra`]);

  await f.drop();
  await f.tick();

  assert.equal(await git(f.dir, ['log', '-1', '--format=%s', f.ref]), REVIEW_SUBJECT, f.watcherLog());
  assert.deepEqual(
    (await git(f.dir, ['diff-tree', '--no-commit-id', '--name-only', '-r', f.ref])).split('\n'),
    [REVIEW_REL],
  );
  assert.equal(await f.originTip(), await f.tip());
  assert.equal(f.workflowRuns().length, runs + 1);
});

test('(R5) a forged base on the remote arm: the job tip the local default-branch refs name is still refused', async (t) => {
  const f = await createReviewFixture(t, { remote: true });
  if (f === null) return;
  const before = f.prompts().length;
  const runs = f.workflowRuns().length;
  const tip = await f.tip();
  const job = await f.jobCommit([
    { path: '.mcp.json', content: '{"mcpServers":{"planted":{"command":"true"}}}\n' },
    { path: 'githooks/post-merge', content: f.markerBody('R5-post-merge'), mode: '100755' },
  ]);
  const defaultBranch = f.config.defaultBranch;
  const originDefault = await f.originTip(defaultBranch);
  await git(f.dir, ['fetch', '--quiet', 'origin', `+${f.ref}:refs/remotes/origin/${f.branch}`]);
  await git(f.dir, ['update-ref', `refs/remotes/origin/${defaultBranch}`, job]);
  await git(f.dir, ['update-ref', `refs/heads/${defaultBranch}`, job]);

  await f.drop();
  await f.tick();

  assert.equal(await f.tip(), tip, `${f.ref} moved`);
  assert.equal(f.workflowRuns().length, runs, 'a workflow run was sent');
  assertRefused(f, before, /fast-forward .*failed/);
  assert.equal(await f.originTip(defaultBranch), originDefault, "origin's default branch moved");
});

// ---------------------------------------------------------------------------------------------
// Migration coverage: a parked legacy worktree run, its record carrying no copy_kind.
// ---------------------------------------------------------------------------------------------

test("(L1, legacy) migration coverage: a core.fsmonitor in a legacy worktree's config.worktree is never read: the drop launches", async (t) => {
  const f = await createReviewFixture(t, { legacy: true });
  if (f === null) return;
  const before = f.prompts().length;
  await git(f.dir, ['config', '--file', join(f.recordDir, 'config.worktree'), 'core.fsmonitor', await f.payload('L1-fsmonitor')]);

  await f.drop();
  await f.tick();

  assertLaunched(f, before);
});

test("(L7, legacy) migration coverage: a legacy worktree's record HEAD naming another branch is refused with today's message", async (t) => {
  const f = await createReviewFixture(t, { legacy: true });
  if (f === null) return;
  const before = f.prompts().length;
  await git(f.dir, ['branch', 'other', f.ref]);
  await writeFile(join(f.recordDir, 'HEAD'), 'ref: refs/heads/other\n', 'utf8');

  await f.drop();
  await f.tick();

  assertRefused(f, before, /is on branch 'other', not 'feat_x'/);
});

test("(R1, legacy) migration coverage: a legacy worktree's config.worktree sshCommand and uploadpack never run; push-branch.sh's own check refuses the push", async (t) => {
  const f = await createReviewFixture(t, { remote: true, legacy: true });
  if (f === null) return;
  const before = f.prompts().length;
  const runs = f.workflowRuns().length;
  const configWorktree = join(f.recordDir, 'config.worktree');
  await git(f.dir, ['config', '--file', configWorktree, 'core.sshCommand', await f.payload('R1-sshCommand')]);
  await git(f.dir, ['config', '--file', configWorktree, 'remote.origin.uploadpack', await f.payload('R1-uploadpack')]);

  await f.drop();
  await f.tick();

  assertRefused(f, before, /push-branch\.sh did not push/, { placed: true });
  const runLog = readFileSync(join(f.dir, STATE_DIR, 'autonomous_logs', `${f.branch}.log`), 'utf8');
  assert.match(runLog, /push-branch\.sh: refusing to push: .*(core\.sshcommand|remote\.origin\.uploadpack)/i);
  assert.equal(f.workflowRuns().length, runs, 'a workflow run was sent');
});
