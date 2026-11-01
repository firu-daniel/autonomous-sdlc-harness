/**
 * `cleanup-merged-worktrees.sh`'s legacy worktree arm, driven against the `init`-written script.
 *
 * **The rule these tests exist to enforce: the legacy arm removes a directory only when it is the
 * gone branch's own derived working copy and a worktree the main repository lists.** The sweep's
 * candidates come from the run registry: each case gives `feat_gone` a record with no `copy_kind`
 * whose `worktree` names the victim, so the sweep reaches the legacy arm's check. The record tampering
 * is that arm's: a run's sandboxed session can write its record under `<main>/.git/worktrees/<name>`,
 * so a rewritten `gitdir` points the record anywhere, and a rewritten `HEAD` makes a live copy read as
 * the gone branch's. A skipped copy still leaves the branch deletion to run as before. Clones, and
 * the sweep's reading of the registry, are `cli/test/cleanup-run-copies.test.mjs`'s.
 *
 * Each case runs `init` in a fixture with a bare origin, commits, pushes `feat_gone` (and, where
 * used, `feat_live`) with an upstream, and deletes `feat_gone` on origin so the sweep's
 * `fetch --prune` marks it `[gone]`. Derived paths and the registry path come from the library's own
 * `hr_worktree_dir` and `hr_state_path`. Every sweep runs under `XDG_STATE_HOME` set to the case's
 * own `scratch` directory, so the per-run profile path it resolves never lands in the real one.
 *
 * The C2 and C3 victims carry a `.git` that is a symbolic link to a gitfile pointing back at the
 * rewritten record. Git's own `worktree remove` refuses a directory whose `.git` does not point
 * back at the record (git 2.50.1: `validation failed`), so a plain victim would leave the C2 and C3
 * mutations green; git follows the link, while `hr_wrapper_target_check_var` refuses it.
 *
 * RED ONCE — each mutation applied once to `own_worktree_check` in the fixture's `init`-written copy
 * of the sweep, through a scratch copy of this file, never to the template; the failure observed:
 * - `return 1` at its top, skipping every copy → (C1) fails `the gone branch's own copy was not removed`.
 * - the target check alone dropped → (C2) fails `the target check did not refuse` and (C3) fails
 *   `the victim at the derived path was deleted`; (C4) stays green, its live copy refused by the
 *   derived-path equality.
 * - the derived-path equality alone dropped → (C4) fails `the live copy was deleted`.
 * - both dropped → (C2) fails `the outside victim's sentinel was deleted`, and (C3) and (C4) fail.
 */

import assert from 'node:assert/strict';
import { existsSync, realpathSync } from 'node:fs';
import { mkdtemp, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const GONE = 'feat_gone';
const LIVE = 'feat_live';

/** The init-written fixture with `branches` pushed with upstreams, and `feat_gone` deleted on origin. */
async function sweepFixture(t, branches) {
  const fixture = await createFixture({
    files: {
      'package.json': {
        name: 'fixture-project',
        private: true,
        version: '0.0.0',
        scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build' },
      },
      'README.md': '# fixture project\n',
    },
  });
  t.after(fixture.cleanup);
  const d = fixture.dir;
  const init = await runCli(d, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  await runGit(d, ['add', '-A']);
  await runGit(d, ['commit', '--quiet', '--allow-empty', '-m', 'seed']);
  for (const branch of branches) {
    await runGit(d, ['branch', branch]);
    // `--no-verify`: `init` installed a `pre-push` hook, and these pushes are fixture setup.
    await runGit(d, ['push', '--quiet', '--no-verify', '-u', 'origin', branch]);
  }
  const origin = (await runGit(d, ['config', 'remote.origin.url'])).stdout.trim();
  await runGit(origin, ['branch', '--quiet', '-D', GONE]);

  const lib = join(d, INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh');
  const derived = async (branch) => {
    const r = await runBash(d, ['-c', '. "$1"; hr_worktree_dir "$2" "$3"', '_', lib, d, branch]);
    assert.equal(r.status, 0, `hr_worktree_dir failed: ${r.stderr}`);
    const path = r.stdout.trim();
    t.after(() => rm(path, { recursive: true, force: true }));
    return path;
  };
  const registry = (
    await runBash(d, ['-c', '. "$1"; r=$(hr_state_path "$2" autonomous_logs/registry.json) && mkdir -p "${r%/*}" && echo "$r"', '_', lib, d])
  ).stdout.trim();
  assert.ok(registry, 'hr_state_path gave no registry path');
  const scratch = realpathSync(await mkdtemp(join(tmpdir(), 'cleanup-record-')));
  t.after(() => rm(scratch, { recursive: true, force: true }));

  return {
    d,
    scratch,
    derived,
    /** Record `dir` as `feat_gone`'s run copy, with no `copy_kind`: the legacy arm's record. */
    recordGone: async (dir) => {
      const r = await runBash(d, ['-c', '. "$1"; hr_registry_set "$2" "$3" worktree "$4" status completed', '_', lib, registry, GONE, dir]);
      assert.equal(r.status, 0, `hr_registry_set failed: ${r.stderr}`);
    },
    /** Add `branch`'s copy at its derived path; return the path and its record directory. */
    addCopy: async (branch) => {
      const path = await derived(branch);
      const before = new Set(await readdir(join(d, '.git', 'worktrees')).catch(() => []));
      await runGit(d, ['worktree', 'add', '--quiet', path, branch]);
      const record = (await readdir(join(d, '.git', 'worktrees'))).find((name) => !before.has(name));
      return { path, record: join(d, '.git', 'worktrees', record) };
    },
    sweep: (args = []) =>
      runBash(d, [join(d, INIT_SCRIPTS_DIR, 'cleanup-merged-worktrees.sh'), ...args], { XDG_STATE_HOME: join(scratch, 'state') }),
    localHas: async (branch) =>
      (await runBash(d, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
  };
}

/** A victim directory holding `sentinel`, whose `.git` is a symbolic link to a gitfile naming `record`. */
async function plantVictim(f, victim, record) {
  await runBash(f.d, ['-c', 'mkdir -p "$1"', '_', victim]);
  await writeFile(join(victim, 'sentinel'), 'keep\n', 'utf8');
  const pointer = join(f.scratch, 'pointer');
  await writeFile(pointer, `gitdir: ${record}\n`, 'utf8');
  await symlink(pointer, join(victim, '.git'));
  await writeFile(join(record, 'gitdir'), `${victim}/.git\n`, 'utf8');
}

const output = (r) => `${r.stdout}\n${r.stderr}`;
const skipLine = (dir) => `skip removing ${dir} for '${GONE}' — it is not that branch's working copy`;

test('(C1) honest: the gone branch\'s own copy is removed and its branch deleted', async (t) => {
  const f = await sweepFixture(t, [GONE]);
  const { path } = await f.addCopy(GONE);
  await f.recordGone(path);

  const r = await f.sweep();
  assert.equal(r.status, 0, output(r));
  assert.ok(!existsSync(path), `the gone branch's own copy was not removed:\n${output(r)}`);
  assert.equal(await f.localHas(GONE), false, `${GONE} was not deleted:\n${output(r)}`);
});

test('(C2) a rewritten record gitdir naming a directory outside the fixture removes nothing there', async (t) => {
  const f = await sweepFixture(t, [GONE]);
  const { record } = await f.addCopy(GONE);
  const victim = join(f.scratch, 'victim');
  await plantVictim(f, victim, record);
  await f.recordGone(victim);

  const r = await f.sweep();
  assert.equal(r.status, 0, output(r));
  assert.ok(existsSync(join(victim, 'sentinel')), `the outside victim's sentinel was deleted:\n${output(r)}`);
  assert.ok(r.stdout.includes(skipLine(victim)), `no skip line naming the victim:\n${output(r)}`);
  assert.match(r.stdout, /not a regular pointer file/, `the target check did not refuse:\n${output(r)}`);

  // The record survives the sweep (its branch is still checked out there), so the preview sees it too.
  const dry = await f.sweep(['--dry-run']);
  assert.equal(dry.status, 0, output(dry));
  assert.ok(dry.stdout.includes(`[dry-run] would ${skipLine(victim)}`), `no dry-run skip line:\n${output(dry)}`);
});

test('(C3) a victim at the derived path is refused by the target check alone', async (t) => {
  const f = await sweepFixture(t, [GONE]);
  const { path, record } = await f.addCopy(GONE);
  await rename(path, join(f.scratch, 'moved-copy'));
  await plantVictim(f, path, record);
  await f.recordGone(path);

  // The fixture reaches the target check: `worktree list` names the derived path for the record.
  const list = (await runGit(f.d, ['worktree', 'list', '--porcelain'])).stdout;
  assert.ok(list.includes(`worktree ${path}\n`), `worktree list does not name ${path}:\n${list}`);

  const r = await f.sweep();
  assert.equal(r.status, 0, output(r));
  assert.ok(existsSync(join(path, 'sentinel')), `the victim at the derived path was deleted:\n${output(r)}`);
  assert.ok(r.stdout.includes(skipLine(path)), `no skip line naming the victim:\n${output(r)}`);
});

test('(C4) a live copy whose record HEAD names the gone branch survives', async (t) => {
  const f = await sweepFixture(t, [GONE, LIVE]);
  const { path, record } = await f.addCopy(LIVE);
  await writeFile(join(path, 'work-in-progress'), 'live\n', 'utf8');
  await writeFile(join(record, 'HEAD'), `ref: refs/heads/${GONE}\n`, 'utf8');
  await f.recordGone(path);

  const r = await f.sweep();
  assert.equal(r.status, 0, output(r));
  assert.ok(existsSync(join(path, 'work-in-progress')), `the live copy was deleted:\n${output(r)}`);
  assert.ok(r.stdout.includes(skipLine(path)), `no skip line naming the live copy:\n${output(r)}`);
});
