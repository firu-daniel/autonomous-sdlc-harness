/**
 * `cleanup-merged-worktrees.sh`'s registry-driven sweep, over clones and legacy linked worktrees.
 *
 * **The rule these tests exist to enforce: a run copy is found from the registry and removed by its
 * kind; nothing the registry does not name as the branch's own copy is removed.** A clone goes
 * through `hr_clone_remove_var`, a record with no `copy_kind` through the legacy worktree arm, and a
 * worktree `git worktree list` names with no record is left in place. `--dry-run` prints the same
 * decisions and changes no directory, branch or registry byte.
 *
 * Each case builds, under the system temp directory, a bare origin and a main checkout `demo` on
 * `trunk` carrying `harness.config.json`, the template sweep and `lib/harness-run-lib.sh` copied
 * into `scripts/`, and the registry directory. Clones come from the copied library's
 * `hr_clone_create_var`, at `hr_worktree_dir`'s `<root>/demo-<branch>`. A branch is made gone by
 * pushing it with an upstream and deleting it on origin. Every case runs {@link sweepBoth}: the
 * preview, the unchanged snapshot, then the real sweep, whose decisions must equal the preview's.
 *
 * RED ONCE — each mutation applied once to the fixture's copied sweep through a scratch copy of this
 * file, never to the template, the failure observed:
 * - `hr_clone_remove_var "$main_repo" "$wt"` replaced by `rm -rf "$wt"` → the other-branch cases
 *   fail `the other branch's clone was removed`.
 * - `parked` dropped from the active-run filter → the `parked` case fails `the clone was removed`.
 * - the legacy arm's `if ! own_worktree_check …` replaced by `if true`, skipping every worktree →
 *   the legacy case fails.
 */

import assert from 'node:assert/strict';
import { copyFile, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATES = join(PACKAGE_ROOT, 'templates', 'scripts');
const CONFIG = {
  version: 1,
  projectName: 'demo',
  defaultBranch: 'trunk',
  protectedBranches: ['release/*'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const GONE = 'feat_gone';
const OTHER = 'feat_other';

const exists = (path) =>
  lstat(path).then(
    () => true,
    () => false,
  );

/** Every path under `dir`, not descending into a `.git` directory or a bare `*.git` one. */
async function listing(dir) {
  const out = [];
  const walk = async (d) => {
    for (const entry of (await readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, entry.name);
      out.push(`${relative(dir, p)}${entry.isSymbolicLink() ? ' -> link' : entry.isDirectory() ? '/' : ''}`);
      if (entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.endsWith('.git')) await walk(p);
    }
  };
  await walk(dir);
  return out.join('\n');
}

/** The fixture of the module header. */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cleanup-copies-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'demo');
  await mkdir(origin);
  await mkdir(join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(origin, ['init', '--bare', '--quiet']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, '.gitignore'), 'sdlc-harness/\n');
  await copyFile(join(TEMPLATES, 'cleanup-merged-worktrees.sh'), join(main, 'scripts', 'cleanup-merged-worktrees.sh'));
  await copyFile(join(TEMPLATES, 'lib', 'harness-run-lib.sh'), join(main, 'scripts', 'lib', 'harness-run-lib.sh'));
  await runGit(main, ['add', '-A']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', '-u', 'origin', 'trunk']);
  const logs = join(main, 'sdlc-harness', 'autonomous_logs');
  await mkdir(logs, { recursive: true });
  const registry = join(logs, 'registry.json');
  const lib = join(main, 'scripts', 'lib', 'harness-run-lib.sh');
  const call = async (body, args) => {
    const r = await runBash(root, ['-c', `. "$1" || exit 99; shift; ${body}`, 'hr', lib, ...args]);
    assert.equal(r.status, 0, `${body}: ${r.stdout}${r.stderr}`);
    return r.stdout;
  };

  return {
    root,
    main,
    registry,
    derived: (branch) => join(root, `demo-${branch.replaceAll('/', '-')}`),
    /** `hr_clone_create_var` for `branch`, cut at `trunk`; returns the clone's path. */
    clone: async (branch) =>
      (await call('hr_clone_create_var "$1" "$2" trunk || { echo "$HR_CLONE_REFUSAL" >&2; exit 1; }; echo "$HR_CLONE_DIR"', [main, branch])).trim(),
    /** `hr_registry_set` with `pairs` on `branch`'s record. */
    record: (branch, ...pairs) => call('hr_registry_set "$@"', [registry, branch, ...pairs]),
    drop: (branch) => call('hr_registry_drop "$1" "$2"', [registry, branch]),
    /** Cut `branch` at `trunk` unless it exists, and push it with an upstream. */
    publish: async (branch) => {
      if ((await runBash(main, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status !== 0) {
        await runGit(main, ['branch', branch, 'trunk']);
      }
      await runGit(main, ['push', '--quiet', '-u', 'origin', branch]);
    },
    /** Delete `branch` on origin, so the sweep's `fetch --prune` marks it `[gone]`. */
    gone: (branch) => runGit(origin, ['branch', '--quiet', '-D', branch]),
    worktree: (branch) => runGit(main, ['worktree', 'add', '--quiet', join(root, `demo-${branch}`), branch]),
    localHas: async (branch) =>
      (await runBash(main, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
    sweep: (args = []) => runBash(main, [join(main, 'scripts', 'cleanup-merged-worktrees.sh'), ...args]),
    /** The registry bytes, the local branches and the temp tree's listing. */
    snapshot: async () => ({
      registry: (await exists(registry)) ? await readFile(registry, 'utf8') : null,
      heads: (await runGit(main, ['for-each-ref', 'refs/heads/'])).stdout,
      tree: await listing(root),
    }),
  };
}

const output = (r) => `${r.stdout}\n${r.stderr}`;
const PREFIX = 'cleanup-merged-worktrees.sh: ';

/**
 * The sweep's decisions as comparable strings, one per decision, sorted. A preview's
 * `would delete branch 'b' and remove <kind> d` is the real sweep's `removed <kind> d` and
 * `deleted merged branch 'b'`; a branch `git branch -D` then refuses was still a decision to delete.
 */
function decisions(stdout) {
  const out = [];
  for (const raw of stdout.split('\n')) {
    if (!raw.startsWith(PREFIX)) continue;
    const line = raw.slice(PREFIX.length).replace(/^\[dry-run\] (would )?/, '');
    let m;
    if ((m = line.match(/^delete branch '(.+?)'(?: and remove (clone|worktree) (.+))?$/))) {
      out.push(`delete ${m[1]}`);
      if (m[2]) out.push(`remove ${m[2]} ${m[3]}`);
    } else if ((m = line.match(/^removed (clone|worktree) (.+)$/))) {
      out.push(`remove ${m[1]} ${m[2]}`);
    } else if ((m = line.match(/^(?:deleted merged branch|could not delete branch) '(.+?)'/))) {
      out.push(`delete ${m[1]}`);
    } else if (/^(skip |.+ is already gone$)/.test(line)) {
      out.push(line);
    }
  }
  return out.sort();
}

/** Preview, assert it changed nothing, sweep for real, and assert the decisions match. */
async function sweepBoth(f) {
  const before = await f.snapshot();
  const dry = await f.sweep(['--dry-run']);
  assert.equal(dry.status, 0, output(dry));
  assert.deepEqual(await f.snapshot(), before, `--dry-run changed the fixture:\n${output(dry)}`);
  const real = await f.sweep();
  assert.equal(real.status, 0, output(real));
  assert.deepEqual(decisions(real.stdout), decisions(dry.stdout), `the preview and the sweep disagree:\n${output(dry)}\n---\n${output(real)}`);
  return real;
}

const skipLine = (dir, branch) => `skip removing ${dir} for '${branch}' — it is not that branch's working copy`;

test('a gone branch with a completed clone record: the clone and the branch are removed', async (t) => {
  const f = await fixture(t);
  const dir = await f.clone(GONE);
  assert.equal(dir, f.derived(GONE));
  await f.record(GONE, 'status', 'completed');
  await f.publish(GONE);
  await f.gone(GONE);

  const r = await sweepBoth(f);
  assert.ok(r.stdout.includes(`removed clone ${dir}`), output(r));
  assert.equal(await exists(dir), false, `the clone was not removed:\n${output(r)}`);
  assert.equal(await f.localHas(GONE), false, `${GONE} was not deleted:\n${output(r)}`);
});

for (const status of ['running', 'parked']) {
  test(`a gone branch with a ${status} clone record: nothing is removed`, async (t) => {
    const f = await fixture(t);
    const dir = await f.clone(GONE);
    await f.record(GONE, 'status', status);
    await f.publish(GONE);
    await f.gone(GONE);

    const r = await sweepBoth(f);
    assert.ok(r.stdout.includes(`skip '${GONE}' (active run)`), output(r));
    assert.ok(await exists(join(dir, '.git')), `the clone was removed:\n${output(r)}`);
    assert.equal(await f.localHas(GONE), true, `${GONE} was deleted:\n${output(r)}`);
  });
}

test("a clone record naming another branch's clone, also recorded: skipped, and that clone survives", async (t) => {
  const f = await fixture(t);
  const other = await f.clone(OTHER);
  await f.publish(GONE);
  await f.record(GONE, 'worktree', other, 'copy_kind', 'clone', 'status', 'completed');
  await f.gone(GONE);

  const r = await sweepBoth(f);
  assert.ok(r.stdout.includes(skipLine(other, GONE)), output(r));
  assert.match(r.stdout, /2 run registry records name a clone at/, output(r));
  assert.ok(await exists(join(other, '.git')), `the other branch's clone was removed:\n${output(r)}`);
  assert.equal(await f.localHas(GONE), false, `${GONE} was not deleted:\n${output(r)}`);
});

test("a clone record naming another branch's derived path, unrecorded: skipped on the derived path", async (t) => {
  const f = await fixture(t);
  const other = await f.clone(OTHER);
  await f.drop(OTHER);
  await f.publish(GONE);
  await f.record(GONE, 'worktree', other, 'copy_kind', 'clone', 'status', 'completed');
  await f.gone(GONE);

  const r = await sweepBoth(f);
  assert.ok(r.stdout.includes(skipLine(other, GONE)), output(r));
  assert.ok(r.stdout.includes(`is not the path hr_worktree_dir derives from ${f.main} for the branch '${GONE}'`), output(r));
  assert.ok(await exists(join(other, '.git')), `the other branch's clone was removed:\n${output(r)}`);
  assert.equal(await f.localHas(GONE), false, `${GONE} was not deleted:\n${output(r)}`);
});

test('a gone branch with no record: no copy is removed, and the branch is still deleted', async (t) => {
  const f = await fixture(t);
  const dir = await f.clone(GONE);
  await f.drop(GONE);
  await f.publish(GONE);
  await f.gone(GONE);

  const r = await sweepBoth(f);
  assert.doesNotMatch(r.stdout, /removed (clone|worktree)/, output(r));
  assert.ok(await exists(join(dir, '.git')), `the unrecorded clone was removed:\n${output(r)}`);
  assert.equal(await f.localHas(GONE), false, `${GONE} was not deleted:\n${output(r)}`);
});

test('legacy: a recorded worktree is removed with its branch; one with no record is left in place', async (t) => {
  const f = await fixture(t);
  const OLD = 'feat_old';
  const STRAY = 'feat_stray';
  for (const branch of [OLD, STRAY]) {
    await f.publish(branch);
    await f.worktree(branch);
  }
  await f.record(OLD, 'worktree', f.derived(OLD), 'status', 'completed');
  await f.gone(OLD);
  await f.gone(STRAY);
  const listed = (await runGit(f.main, ['worktree', 'list', '--porcelain'])).stdout;
  assert.ok(listed.includes(`worktree ${f.derived(STRAY)}\n`), `worktree list does not name the stray copy:\n${listed}`);

  const r = await sweepBoth(f);
  assert.ok(r.stdout.includes(`removed worktree ${f.derived(OLD)}`), output(r));
  assert.equal(await exists(f.derived(OLD)), false, `the legacy worktree was not removed:\n${output(r)}`);
  assert.equal(await f.localHas(OLD), false, `${OLD} was not deleted:\n${output(r)}`);
  assert.ok(await exists(join(f.derived(STRAY), '.git')), `the unrecorded worktree was removed:\n${output(r)}`);
  assert.ok(!r.stdout.includes(`removed worktree ${f.derived(STRAY)}`), output(r));
});
