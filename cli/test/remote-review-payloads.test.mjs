/**
 * `remote-run.sh review` — the verb the supervised `/autonomous-sdlc-harness:branch-user-review`
 * runs — driven against a mirror or a cut copy carrying each payload a GitHub job's agent or a local
 * session could plant.
 *
 * **The rule these tests exist to enforce: placing a review round never runs code the run's job
 * committed or a session planted, and never installs a run-authored protected path.** Each case
 * ends in one of two outcomes and no marker: **refused** — exit 4, nothing pushed, no `workflow
 * run`; or **placed and dispatched** — exit 0, the round committed and pushed, one `workflow run`.
 * Either way **a mirror is never removed, and a copy the verb cut is removed with the registry record
 * and local branch the cut made.**
 *
 * The fixture is `remote-run.test.mjs`'s `review` shape — an `init`-wired checkout adopted on a bare
 * `origin`, `gh` replaced by a recorder that lists one `completed` run with a `completed` bundle —
 * plus, for the mirror cases, a registry record of `feat_x` with `execution: github-actions` whose
 * `worktree` is the mirror: by default the clone `hr_clone_create_var` makes at the derived path,
 * with its `copy_kind: clone`; for (M5), a legacy linked worktree of the main checkout on `feat_x`.
 * Its main `.git/config` sets `extensions.worktreeConfig=true` and the repo-relative
 * `core.hooksPath` `githooks`, so an unpinned call in a legacy mirror reads its record's
 * `config.worktree` and resolves hooks inside the copy. A clone mirror carrying a worktree-only
 * plant's equivalent — its `.git/config.worktree`, `.git/commondir` or a `.git/config` key off the
 * allow-list — fails the clone trust check; `review` then falls through to a cut, which the
 * one-live-copy rule refuses while the mirror stands. A copy the verb cuts is a clone at the derived
 * path, and every refused cut case asserts it gone with the registry record and local branch the cut
 * made. Every payload on `origin/feat_x` is a job's commit, built by `hash-object` / `update-index` /
 * `commit-tree` in a temporary index and pushed; every planted hook, fsmonitor, `sshCommand` and
 * `uploadpack` writes a marker file named for itself.
 *
 * RED ONCE — each mutation applied once to `cli/templates/scripts/remote-run.sh` (M2, M4's second,
 * M6, M8, P1 and P2: to `lib/harness-run-lib.sh`; C1: to `create-worktree.sh` and the library), the
 * file run, the failure observed, the mutation reverted; measured on the clone layout:
 * - (M1) `git -C "$worktree" merge --ff-only "origin/$branch"` restored in place of
 *   `hr_run_fast_forward_var` → fails on the refusal, which names the push (`origin/feat_x moved`)
 *   rather than the fast-forward.
 * - (M2) `.mcp.json` dropped from `hr_run_protected_rel_paths`' output → fails on the exit status:
 *   0, the round placed and dispatched.
 * - (M3) the verb's `hr_run_surface_check_var "refs/heads/$branch" copy` call dropped → fails on the
 *   exit status: 0, the round placed and dispatched.
 * - (M4) the same mutation as (M3) → fails on the exit status: 0. With the call restored, the
 *   `ls-files --others` test dropped from `hr_run_surface_check_var` → fails on the refusal.
 * - (M5) `git -C "$worktree" fetch origin "$branch"` restored in place of the pinned main-checkout
 *   fetch → fails `a planted payload ran`, holding `M5-uploadpack`.
 * - (M6) `hr_run_copy_clean`'s first `diff` replaced by an unpinned
 *   `git -C "$HR_RUN_COPY_TOP" status --short` → fails `a planted payload ran`.
 * - (M7) mirror detection restored as `git -C "$record_wt" symbolic-ref --short HEAD` → fails on
 *   the refusal, which names the fetch rather than the working copy: the redirected mirror taken.
 * - (M8) `hr_run_surface_check_var`'s merge base taken against the local
 *   `refs/remotes/origin/<defaultBranch>` in place of `HR_RUN_TRUSTED_BASE` → fails on the exit
 *   status: 0, the round placed and dispatched.
 * - (P1) `commondir` and `config.worktree` dropped from `hr_clone_target_check_var`'s absent-file
 *   loop → both (P1) cases fail on the exit status: 0, the mirror taken and the round placed.
 * - (P2) `hr_clone_config_check_var`'s off-allow-list test skipped → fails on the exit status: 0.
 * - (C1) the tip surface check skipped in both `create-worktree.sh --existing` and
 *   `hr_clone_create_var` → fails on the refusal, which names the verb's own protected-surface check
 *   rather than `create-worktree.sh exited 2`.
 * - (C2) the round committed through `git add` and `commit-on-branch.sh --repo` in place of
 *   `hr_commit_placed` → fails on the exit status: 4, `commit-on-branch.sh` finding nothing to
 *   commit.
 */

import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = `${INIT_SCRIPTS_DIR}/remote-run.sh`;
const STATE_DIR = 'sdlc-harness';
const REGISTRY = `${STATE_DIR}/autonomous_logs/registry.json`;
const REVIEW_REL = `${STATE_DIR}/user_reviews/feat_x_review.md`;
const REVIEW_BYTES = 'The button is not centred.\n';
const REVIEW_SUBJECT = 'chore: add user review for feat_x';
const REVIEW_DISPATCH =
  'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=user_review -f resume=none -f chain=0';
const PIN = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'submodule.recurse=false'];
const REF = 'refs/heads/feat_x';

/**
 * `gh`, recorded: each argument vector appended to `STUB_LOG`; `run list` answers one completed
 * run, its artifact list the state bundle, and `run download` copies `STUB_BUNDLE`.
 */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync, cpSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const line = args.join(' ');
if (line.startsWith('run list')) {
  process.stdout.write(JSON.stringify([{ databaseId: 101, displayTitle: 'harness run feat_x', status: 'completed',
    conclusion: 'success', createdAt: '2026-01-01T00:01:00Z', url: 'https://github.com/o/r/actions/runs/101' }]));
} else if (args[0] === 'api') {
  process.stdout.write(JSON.stringify({ artifacts: [{ name: 'harness-state', expired: false }] }));
} else if (line.startsWith('run download')) {
  cpSync(process.env.STUB_BUNDLE, args[args.indexOf('-D') + 1], { recursive: true });
}
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
 * An `init`-wired checkout with `execution.target` `github-actions`, adopted on `origin`'s default
 * branch, with `origin/feat_x` one honest commit ahead of it and no local `feat_x`. `mirror`
 * `'clone'` adds the library's clone of `feat_x` at the derived path, its record made the remote
 * one; `'worktree'` adds a legacy linked worktree on `feat_x` and the remote record naming it;
 * `false` adds neither. `baseHooks` commits a marker-writing `githooks/pre-commit` on the default
 * branch first.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ mirror?: 'clone' | 'worktree' | false, baseHooks?: boolean }} [options]
 */
async function reviewFixture(t, { mirror = 'clone', baseHooks = false } = {}) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const side = `${dir}-side`;
  const markers = join(side, 'markers');
  const payloads = join(side, 'payloads');
  t.after(() => rm(side, { recursive: true, force: true }));
  for (const d of [markers, payloads]) mkdirSync(d, { recursive: true });
  /** A hook body writing `<markers>/<name>`, then `tail`. */
  const markerBody = (name, tail = 'exit 0') => `#!/bin/sh\n: > '${join(markers, name)}'\n${tail}\n`;

  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target: 'github-actions' };
  delete config.commands.depInstall;
  delete config.commands.build;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  if (baseHooks) writeFileSync(join(dir, 'githooks', 'pre-commit'), markerBody('C2-pre-commit'), { mode: 0o755 });
  const copy = join(dirname(dir), `${config.projectName}-feat_x`);
  const mirrorDir = `${dir}-mirror`;
  for (const d of [copy, mirrorDir]) t.after(() => rm(d, { recursive: true, force: true }));

  await runGit(dir, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(dir, ['config', 'core.hooksPath', 'githooks']);
  const origin = (await runGit(dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  await git(dir, ['add', '-A']);
  await git(dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await git(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const bundleDir = join(side, 'bundle');
  mkdirSync(join(bundleDir, 'clarifications', 'feat_x'), { recursive: true });
  writeFileSync(join(bundleDir, 'status.json'), JSON.stringify({
    schema: '1', branch: 'feat_x', engine: 'task', status: 'completed', pause_reason: '', usage_resume_at: '',
    park_loop_cycles: '0', resume_max_question_index: '', auto_resumes: '', stall_restarts: '',
    chain: '0', control_polled_at: '', decision: 'stop', detail: 'done', run_id: '', run_url: '', written_at: '1',
  }));
  writeFileSync(join(bundleDir, 'run.log'), 'log\n');
  const stub = join(side, 'gh');
  writeFileSync(stub, GH_STUB);
  chmodSync(stub, 0o755);
  const ghLog = join(side, 'gh.log');
  const reviewFile = join(side, 'review.md');
  writeFileSync(reviewFile, REVIEW_BYTES);

  const originTip = (name = 'feat_x') => git(origin, ['rev-parse', `refs/heads/${name}`]);
  /** A job's commit of `entries` on `origin/feat_x` (or on the default branch's tip when absent). */
  const jobCommit = async (entries, message = 'job: advance the branch') => {
    const env = { GIT_INDEX_FILE: join(payloads, `job-index-${Date.now()}`) };
    const onBranch = (await runBash(origin, ['-c', `git rev-parse --verify --quiet ${REF}`])).status === 0;
    const parent = await originTip(onBranch ? 'feat_x' : config.defaultBranch);
    await git(dir, ['fetch', '--quiet', 'origin', onBranch ? REF : `refs/heads/${config.defaultBranch}`]);
    await git(dir, ['read-tree', parent], env);
    for (const { path, content, mode = '100644' } of entries) {
      const blob = await sh(dir, 'printf "%s" "$1" | git hash-object -w --no-filters --stdin', [content]);
      await git(dir, ['update-index', '--add', '--cacheinfo', `${mode},${blob},${path}`], env);
    }
    const tree = await git(dir, ['write-tree'], env);
    const commit = await git(dir, ['commit-tree', tree, '-p', parent, '-m', message]);
    await git(dir, ['push', '--quiet', '--no-verify', origin, `${commit}:${REF}`]);
    return commit;
  };
  await jobCommit([{ path: 'src/feat.txt', content: 'feat\n' }], 'job: start feat_x');

  const f = {
    dir,
    config,
    origin,
    copy,
    markers,
    payloads,
    markerBody,
    reviewFile,
    jobCommit,
    originTip,
    mirror: null,
    recordDir: null,
    /** An executable payload outside the fixture that writes `<markers>/<name>`, then `tail`. */
    payload(name, tail = 'exit 1') {
      const path = join(payloads, `${name}.sh`);
      writeFileSync(path, markerBody(name, tail), { mode: 0o755 });
      return path;
    },
    /** Point the registry's remote record of `feat_x` at `worktree`. */
    record(worktree) {
      mkdirSync(join(dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
      const rec = { branch: 'feat_x', status: 'completed', execution: 'github-actions', worktree };
      writeFileSync(join(dir, REGISTRY), JSON.stringify({ runs: { feat_x: rec } }));
    },
    /** `refs/heads/feat_x` in the main repository: the mirror's branch tip. */
    tip: () => git(dir, ['rev-parse', REF]),
    /** The registry file's bytes, or `null` when it does not exist. */
    registry: () => (existsSync(join(dir, REGISTRY)) ? readFileSync(join(dir, REGISTRY), 'utf8') : null),
    review: () =>
      runBash(dir, [SCRIPT, 'review', 'feat_x', '--review-file', reviewFile], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: ghLog,
        STUB_BUNDLE: bundleDir,
        HARNESS_TRIGGER_LOOKUP_SECS: '0',
        PUSH_RETRY_DELAY_SECS: '0',
      }),
    workflowRuns: () =>
      existsSync(ghLog)
        ? readFileSync(ghLog, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).join(' '))
            .filter((c) => c.startsWith('workflow run'))
        : [],
    markerNames: () => readdirSync(markers).sort(),
  };

  if (mirror === 'clone') {
    await git(dir, ['fetch', '--quiet', 'origin', `+${REF}:refs/remotes/origin/feat_x`]);
    mkdirSync(join(dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
    await sh(
      dir,
      '. "$1" || exit 99; hr_clone_create_var "$2" feat_x refs/remotes/origin/feat_x || { echo "$HR_CLONE_REFUSAL" >&2; exit 1; }'
        + ' && hr_registry_set "$3" feat_x branch feat_x status completed execution github-actions',
      [join(dir, INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh'), dir, join(dir, REGISTRY)],
    );
    f.mirror = copy;
    f.recordDir = join(copy, '.git');
  } else if (mirror === 'worktree') {
    await git(dir, ['fetch', '--quiet', 'origin', `+${REF}:refs/remotes/origin/feat_x`]);
    await git(dir, ['worktree', 'add', '--quiet', '-b', 'feat_x', mirrorDir, 'refs/remotes/origin/feat_x']);
    f.mirror = mirrorDir;
    f.recordDir = await git(mirrorDir, ['rev-parse', '--absolute-git-dir']);
    f.record(mirrorDir);
  }
  return f;
}

/** Refused: exit 4 naming `reason`, no marker, nothing pushed to `origin/feat_x`, no `workflow run`. */
function assertRefused(f, result, reason, originBefore, originAfter) {
  const detail = `${result.stdout}\n${result.stderr}`;
  assert.deepEqual(f.markerNames(), [], 'a planted payload ran');
  assert.equal(result.status, 4, detail);
  assert.match(result.stderr, reason, detail);
  assert.equal(originAfter, originBefore, 'something was pushed');
  assert.deepEqual(f.workflowRuns(), [], 'a workflow run was sent');
}

/** Placed and dispatched: exit 0, the round alone committed on `origin/feat_x`, one `workflow run`. */
async function assertPlaced(f, result, originBefore) {
  const detail = `${result.stdout}\n${result.stderr}`;
  assert.deepEqual(f.markerNames(), [], 'a planted payload ran');
  assert.equal(result.status, 0, detail);
  const after = await f.originTip();
  assert.equal(await git(f.origin, ['rev-parse', `${after}~1`]), originBefore, 'the round is not on top of the branch');
  assert.equal(await git(f.origin, ['log', '-1', '--format=%s', after]), REVIEW_SUBJECT);
  assert.deepEqual((await git(f.origin, ['diff-tree', '--no-commit-id', '--name-only', '-r', after])).split('\n'), [REVIEW_REL]);
  assert.equal((await runGit(f.origin, ['show', `${after}:${REVIEW_REL}`])).stdout, REVIEW_BYTES);
  assert.deepEqual(f.workflowRuns(), [REVIEW_DISPATCH]);
}

/** The mirror still stands, and the registry's record of `feat_x` still names it. */
function assertMirrorKept(f) {
  assert.ok(existsSync(f.mirror), 'the mirror was removed');
  assert.equal(JSON.parse(f.registry()).runs.feat_x.worktree, f.mirror, "the mirror's record no longer names it");
}

/**
 * The copy the verb cut is gone with what the cut made: no derived directory, no registry record of
 * `feat_x`, and `refs/heads/feat_x` absent — or at `branchTip` when it existed before the cut.
 */
async function assertCutRemoved(f, branchTip = null) {
  assert.equal(existsSync(f.copy), false, 'the cut copy was left behind');
  const registry = f.registry();
  assert.equal(registry === null ? undefined : JSON.parse(registry).runs?.feat_x, undefined, 'the cut copy\'s record was left behind');
  const local = await runBash(f.dir, ['-c', `git rev-parse --verify --quiet ${REF}`]);
  if (branchTip === null) assert.notEqual(local.status, 0, 'the local branch feat_x was left behind');
  else assert.equal(local.stdout.trim(), branchTip, 'the local branch feat_x that existed before the cut moved');
}

// ---------------------------------------------------------------------------------------------
// The record's mirror.
// ---------------------------------------------------------------------------------------------

test('an honest mirror one job commit behind is fast-forwarded, and the round placed there and dispatched', async (t) => {
  const f = await reviewFixture(t);
  const job = await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);

  const result = await f.review();

  await assertPlaced(f, result, job);
  assert.equal(await f.tip(), await f.originTip(), "the mirror's branch is not the pushed tip");
  assert.equal(await git(f.mirror, ['rev-parse', REF]), await f.originTip(), "the clone's own branch is not the pushed tip");
  assert.equal(readFileSync(join(f.mirror, REVIEW_REL), 'utf8'), REVIEW_BYTES);
  assertMirrorKept(f);
});

test('(M1) a job commit adding post-merge and reference-transaction hooks is refused at the fast-forward', async (t) => {
  const f = await reviewFixture(t);
  const tip = await f.tip();
  const job = await f.jobCommit([
    { path: 'githooks/post-merge', content: f.markerBody('M1-post-merge'), mode: '100755' },
    { path: 'githooks/reference-transaction', content: f.markerBody('M1-reference-transaction'), mode: '100755' },
  ]);

  const result = await f.review();

  assertRefused(f, result, /fast-forward .*githooks/, job, await f.originTip());
  assert.equal(await f.tip(), tip, `${REF} moved`);
});

test('(M2) a job commit adding .mcp.json is refused at the fast-forward, the mirror\'s .mcp.json unchanged', async (t) => {
  const f = await reviewFixture(t);
  const tip = await f.tip();
  const mcp = join(f.mirror, '.mcp.json');
  const before = existsSync(mcp) ? readFileSync(mcp, 'utf8') : null;
  const job = await f.jobCommit([{ path: '.mcp.json', content: '{"mcpServers":{"planted":{"command":"true"}}}\n' }]);

  const result = await f.review();

  assertRefused(f, result, /fast-forward .*\.mcp\.json/, job, await f.originTip());
  assert.equal(await f.tip(), tip, `${REF} moved`);
  assert.equal(existsSync(mcp) ? readFileSync(mcp, 'utf8') : null, before, "the mirror's .mcp.json changed");
});

test('(M3) a mirror already at a payload tip: the fast-forward is a no-op, and the copy check refuses', async (t) => {
  const f = await reviewFixture(t);
  const job = await f.jobCommit([{ path: '.mcp.json', content: '{"mcpServers":{"planted":{"command":"true"}}}\n' }]);
  // As a sync made before this branch would have left it: ref, index and tree at the payload tip.
  await git(f.dir, ['fetch', '--quiet', 'origin', job]);
  await git(f.mirror, ['update-ref', REF, job]);
  await git(f.dir, ['update-ref', REF, job]);
  await git(f.mirror, ['read-tree', '--reset', '-u', job]);

  const result = await f.review();

  assertRefused(f, result, /protected-surface check .*\.mcp\.json/, job, await f.originTip());
  assert.equal(await f.tip(), job, `${REF} moved`);
});

test('(M4) an untracked marker-writing githooks/post-checkout in the mirror is refused by the copy check', async (t) => {
  const f = await reviewFixture(t);
  const job = await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);
  writeFileSync(join(f.mirror, 'githooks', 'post-checkout'), f.markerBody('M4-post-checkout'), { mode: 0o755 });

  const result = await f.review();

  assertRefused(f, result, /protected-surface check .*githooks\/post-checkout/, job, await f.originTip());
});

test("(M5) a legacy mirror's config.worktree sshCommand and uploadpack never run; push-branch.sh's own check refuses the push", async (t) => {
  const f = await reviewFixture(t, { mirror: 'worktree' });
  const job = await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);
  const configWorktree = join(f.recordDir, 'config.worktree');
  await git(f.dir, ['config', '--file', configWorktree, 'core.sshCommand', f.payload('M5-sshCommand')]);
  await git(f.dir, ['config', '--file', configWorktree, 'remote.origin.uploadpack', f.payload('M5-uploadpack')]);

  const result = await f.review();

  assertRefused(f, result, /pushing feat_x: the remote refused the push/, job, await f.originTip());
  assert.match(result.stderr, /push-branch\.sh: refusing to push: .*(core\.sshcommand|remote\.origin\.uploadpack)/i);
});

/**
 * A clone mirror carrying `plant` is refused by the clone trust check, so `review` falls through to
 * a cut, which the one-live-copy rule refuses while the mirror stands: refused, with the mirror, its
 * record and the branch left as they were.
 */
async function assertCloneMirrorRefused(f, plant) {
  const job = await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);
  await plant();
  const tip = await f.tip();
  const registry = f.registry();

  const result = await f.review();

  assertRefused(f, result, /the working copy \(create-worktree\.sh exited 2\)/, job, await f.originTip());
  assert.equal(await f.tip(), tip, `${REF} moved`);
  assert.equal(f.registry(), registry, 'the registry changed');
  assert.ok(existsSync(f.mirror), 'the mirror was removed');
  assert.equal(existsSync(join(f.mirror, REVIEW_REL)), false, 'the round was placed in the refused mirror');
}

test('(P1) a .git/config.worktree planted in the clone mirror carrying sshCommand and uploadpack is refused, neither run', async (t) => {
  const f = await reviewFixture(t);
  await assertCloneMirrorRefused(f, async () => {
    const configWorktree = join(f.recordDir, 'config.worktree');
    await git(f.dir, ['config', '--file', configWorktree, 'core.sshCommand', f.payload('P1-sshCommand')]);
    await git(f.dir, ['config', '--file', configWorktree, 'remote.origin.uploadpack', f.payload('P1-uploadpack')]);
  });
});

test('(P1) a .git/commondir planted in the clone mirror, naming a repository whose config carries payloads, is refused', async (t) => {
  const f = await reviewFixture(t);
  await assertCloneMirrorRefused(f, async () => {
    // A `.git` holding `feat_x` at the mirror's tip, so the common dir resolves, the clone's ref
    // reads the same, and only the clone check's own file test refuses it.
    const planted = join(f.payloads, 'planted');
    await git(f.payloads, ['init', '--quiet', planted]);
    await git(planted, ['fetch', '--quiet', f.dir, `${REF}:${REF}`]);
    await git(planted, ['config', 'core.fsmonitor', f.payload('P1-commondir-fsmonitor')]);
    await git(planted, ['config', 'remote.origin.uploadpack', f.payload('P1-commondir-uploadpack')]);
    writeFileSync(join(f.recordDir, 'commondir'), `${join(planted, '.git')}\n`);
  });
});

test('(P2) a .git/config key off the allow-list in the clone mirror is refused; its sshCommand and uploadpack never run', async (t) => {
  const f = await reviewFixture(t);
  await assertCloneMirrorRefused(f, async () => {
    const config = join(f.recordDir, 'config');
    await git(f.dir, ['config', '--file', config, 'core.sshCommand', f.payload('P2-sshCommand')]);
    await git(f.dir, ['config', '--file', config, 'remote.origin.uploadpack', f.payload('P2-uploadpack')]);
  });
});

test("(M6) a nested repository's own core.fsmonitor behind a gitlink is never run: placed and dispatched", async (t) => {
  const f = await reviewFixture(t);
  const nested = join(f.mirror, 'nested');
  mkdirSync(nested);
  await git(nested, ['init', '--quiet']);
  writeFileSync(join(nested, 'n.txt'), 'n\n');
  await git(nested, ['add', 'n.txt']);
  await git(nested, ['-c', 'user.name=n', '-c', 'user.email=n@example.invalid', 'commit', '--quiet', '-m', 'n']);
  // The gitlink is committed on the branch through the clone's own index, its tree written to the
  // main object store the clone borrows, the clone's ref moved before the main checkout's, and
  // pushed as the job's.
  const index = { GIT_INDEX_FILE: join(f.recordDir, 'index') };
  await git(f.dir, ['update-index', '--add', '--cacheinfo', `160000,${await git(nested, ['rev-parse', 'HEAD'])},nested`], index);
  const parent = await f.tip();
  const linked = await git(f.dir, ['commit-tree', await git(f.dir, ['write-tree'], index), '-p', parent, '-m', 'run: add a gitlink']);
  await git(f.mirror, ['update-ref', REF, linked, parent]);
  await git(f.dir, ['update-ref', REF, linked, parent]);
  await git(f.dir, ['push', '--quiet', '--no-verify', 'origin', `${linked}:${REF}`]);
  // One honest job commit ahead, so the fast-forward moves and the copy's clean test runs.
  const job = await f.jobCommit([{ path: 'src/job.txt', content: 'job\n' }]);
  await git(nested, ['config', 'core.fsmonitor', f.payload('M6-fsmonitor')]);

  const result = await f.review();

  await assertPlaced(f, result, job);
});

test('(M7) a mirror whose .git points into another repository is not used, and no copy is cut beside it while it stands', async (t) => {
  const f = await reviewFixture(t, { mirror: false });
  const elsewhere = `${f.dir}-elsewhere`;
  const redirected = `${f.dir}-redirected`;
  for (const d of [elsewhere, redirected]) t.after(() => rm(d, { recursive: true, force: true }));
  await git(dirname(f.dir), ['clone', '--quiet', f.origin, elsewhere]);
  await git(elsewhere, ['worktree', 'add', '--quiet', redirected, 'feat_x']);
  const elsewhereTip = await git(elsewhere, ['rev-parse', REF]);
  f.record(redirected);
  const before = await f.originTip();
  const registry = f.registry();

  const result = await f.review();

  // The record names a live copy of feat_x, so the one-live-copy rule refuses the cut.
  assertRefused(f, result, /the working copy \(create-worktree\.sh exited 2\)/, before, await f.originTip());
  assert.equal(await git(elsewhere, ['rev-parse', REF]), elsewhereTip, 'the redirected mirror\'s branch moved');
  assert.equal(existsSync(join(redirected, REVIEW_REL)), false, 'the round was placed in the redirected mirror');
  assert.equal(existsSync(f.copy), false, 'a copy was cut');
  assert.equal(f.registry(), registry, 'the registry changed');
  const local = await runBash(f.dir, ['-c', `git show-ref --verify --quiet ${REF}`]);
  assert.notEqual(local.status, 0, 'the local branch feat_x was left behind');
});

test('(M8) a forged base: the local default-branch refs pointed at a payload tip do not pass it', async (t) => {
  const f = await reviewFixture(t);
  const tip = await f.tip();
  const mcp = join(f.mirror, '.mcp.json');
  const before = existsSync(mcp) ? readFileSync(mcp, 'utf8') : null;
  const job = await f.jobCommit([
    { path: '.mcp.json', content: '{"mcpServers":{"planted":{"command":"true"}}}\n' },
    { path: 'githooks/post-merge', content: f.markerBody('M8-post-merge'), mode: '100755' },
  ]);
  const defaultBranch = f.config.defaultBranch;
  const originDefault = await f.originTip(defaultBranch);
  await git(f.dir, ['fetch', '--quiet', 'origin', `+${REF}:refs/remotes/origin/feat_x`]);
  await git(f.dir, ['update-ref', `refs/remotes/origin/${defaultBranch}`, job]);
  await git(f.dir, ['update-ref', `refs/heads/${defaultBranch}`, job]);

  const result = await f.review();

  assertRefused(f, result, /fast-forward .*\.mcp\.json/, job, await f.originTip());
  assert.equal(await f.tip(), tip, `${REF} moved`);
  assert.equal(existsSync(mcp) ? readFileSync(mcp, 'utf8') : null, before, "the mirror's .mcp.json changed");
  assert.equal(await f.originTip(defaultBranch), originDefault, "origin's default branch moved");
});

// ---------------------------------------------------------------------------------------------
// A copy the verb cuts.
// ---------------------------------------------------------------------------------------------

test('(C1) a payload tip with .claude/settings.json is refused by the cut, leaving no clone, record or local branch', async (t) => {
  const f = await reviewFixture(t, { mirror: false });
  const job = await f.jobCommit([{ path: '.claude/settings.json', content: '{"permissions":{"allow":["Bash"]}}\n' }]);

  const result = await f.review();

  assertRefused(f, result, /the working copy \(create-worktree\.sh exited 2\)/, job, await f.originTip());
  await assertCutRemoved(f);
});

test('(C2) an honest branch is placed and dispatched with no commit hook run, though the base carries one', async (t) => {
  const f = await reviewFixture(t, { mirror: false, baseHooks: true });
  const before = await f.originTip();

  const result = await f.review();

  assert.deepEqual(f.markerNames(), [], 'a commit hook ran');
  await assertPlaced(f, result, before);
  await assertCutRemoved(f);
});

test('(C3) a clone cut from an honest local feat_x is refused at the fast-forward to a payload tip, and removed', async (t) => {
  const f = await reviewFixture(t, { mirror: false });
  await git(f.dir, ['fetch', '--quiet', 'origin', `+${REF}:refs/remotes/origin/feat_x`]);
  await git(f.dir, ['branch', 'feat_x', 'refs/remotes/origin/feat_x']);
  const tip = await f.tip();
  const job = await f.jobCommit([
    { path: '.mcp.json', content: '{"mcpServers":{"planted":{"command":"true"}}}\n' },
    { path: 'githooks/post-merge', content: f.markerBody('C3-post-merge'), mode: '100755' },
  ]);

  const result = await f.review();

  assertRefused(f, result, /fast-forward .*\.mcp\.json/, job, await f.originTip());
  await assertCutRemoved(f, tip);
});
