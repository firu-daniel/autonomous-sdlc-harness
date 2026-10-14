/**
 * `cleanup-merged-worktrees.sh`'s removal guard, driven against the `init`-written script.
 *
 * **The rule these tests exist to enforce: the sweep removes a directory only when it is the gone
 * branch's own derived working copy and a worktree the main repository lists.** A run's sandboxed
 * session can write its record under `<main>/.git/worktrees/<name>`, so `worktree list` can name a
 * directory that is neither: a rewritten `gitdir` points the record anywhere, and a rewritten `HEAD`
 * makes a live copy read as the gone branch's. A skipped copy still leaves the branch deletion to
 * run as before.
 *
 * Each case runs `init` in a fixture with a bare origin, commits, pushes `feat_gone` (and, where
 * used, `feat_live`) with an upstream, and deletes `feat_gone` on origin so the sweep's
 * `fetch --prune` marks it `[gone]`. Derived paths come from the library's own `hr_worktree_dir`.
 *
 * The C2 and C3 victims carry a `.git` that is a symbolic link to a gitfile pointing back at the
 * rewritten record. Git's own `worktree remove` refuses a directory whose `.git` does not point
 * back at the record (git 2.50.1: `validation failed`), so a plain victim would leave the C2 and C3
 * mutations green; git follows the link, while `hr_wrapper_target_check_var` refuses it.
 *
 * RED ONCE — each mutation applied once to `cli/templates/scripts/cleanup-merged-worktrees.sh`'s
 * `own_worktree_check`, the file run, the failure observed, the mutation reverted:
 * - (C1) `return 1` at its top, skipping every copy → fails `the gone branch's own copy was not removed`.
 * - (C2) the target check and the derived-path equality both dropped → fails `the outside victim's
 *   sentinel was deleted`.
 * - (C3) the target check alone dropped → fails `the victim at the derived path was deleted`.
 * - (C4) the derived-path equality alone dropped → fails `the live copy was deleted`.
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
  const scratch = realpathSync(await mkdtemp(join(tmpdir(), 'cleanup-record-')));
  t.after(() => rm(scratch, { recursive: true, force: true }));

  return {
    d,
    scratch,
    derived,
    /** Add `branch`'s copy at its derived path; return the path and its record directory. */
    addCopy: async (branch) => {
      const path = await derived(branch);
      const before = new Set(await readdir(join(d, '.git', 'worktrees')).catch(() => []));
      await runGit(d, ['worktree', 'add', '--quiet', path, branch]);
      const record = (await readdir(join(d, '.git', 'worktrees'))).find((name) => !before.has(name));
      return { path, record: join(d, '.git', 'worktrees', record) };
    },
    sweep: (args = []) => runBash(d, [join(d, INIT_SCRIPTS_DIR, 'cleanup-merged-worktrees.sh'), ...args]),
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

  const r = await f.sweep();
  assert.equal(r.status, 0, output(r));
  assert.ok(existsSync(join(path, 'work-in-progress')), `the live copy was deleted:\n${output(r)}`);
  assert.ok(r.stdout.includes(skipLine(path)), `no skip line naming the live copy:\n${output(r)}`);
});
