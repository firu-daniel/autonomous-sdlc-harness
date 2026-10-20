/**
 * The order a clone's branch moves in, in `cli/templates/scripts/lib/harness-run-lib.sh`: the
 * artifact commit (`hr_commit_paths_var`) and the fast-forward (`hr_run_fast_forward_var`), both
 * through `hr_copy_ref_swap_var`.
 *
 * **The rule these tests exist to enforce: on a clone a branch moves clone ref first, main checkout
 * second, and a commit landing in the clone after sync-in is refused with nothing moved on either
 * side.**
 *
 * Each case builds, under the system temp directory, a main checkout carrying a hand-written
 * `harness.config.json` and its `autonomous_logs/` directory, a local bare origin, a copy of the
 * template library, and the clone `hr_clone_create_var` makes; the library is sourced from that
 * copy. The race is a `git` shim first on `PATH`, the technique `cli/test/run-copy-clone-arm.test.mjs`
 * uses: on the first call whose arguments contain its trigger, it commits once in the clone by
 * plumbing, then runs the real git or fails the call. The copy check on a clone in general is
 * `cli/test/run-copy-clone-arm.test.mjs`'s; sync-in's heal is `cli/test/clone-sync.test.mjs`'s.
 *
 * RED ONCE, each mutation applied to the fixture's copy of the library:
 * - the main-first order (the main checkout's `update-ref` issued ahead of the clone's swap): every
 *   case fails, (a) and (b) on the main checkout's ref, which moved while the clone's refused;
 * - the clone's swap removed from the clone arm: every case fails;
 * - the rollback's compare-and-swap dropped (`update-ref <ref> <old>` with no expected value): case
 *   (c) alone fails, the rollback overwriting the race commit so the commit returns 4.
 */

import assert from 'node:assert/strict';
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const LIB = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const BRANCH = 'feat_c';
const REF = `refs/heads/${BRANCH}`;
const ORIGIN_REF = `refs/remotes/origin/${BRANCH}`;
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

/** Parse the `name=value` lines a library call prints; a value may hold `=`. */
function globals(result) {
  assert.equal(result.stderr, '', result.stderr);
  const out = {};
  for (const line of result.stdout.split('\n')) {
    const at = line.indexOf('=');
    if (at > 0) out[line.slice(0, at)] = line.slice(at + 1);
  }
  return out;
}

/** The copy check alone. `$1` main, `$2` copy. */
const CHECK = `hr_run_copy_check_var "$1" "$2"; s=$?
printf 'status=%s\\ntip=%s\\nrefusal=%s\\n' "$s" "$HR_RUN_COPY_TIP" "$HR_RUN_REFUSAL"`;
/** The copy check, then `hr_commit_paths_var` of `$3` on the checked copy. */
const COMMIT_PATHS = `if ! hr_run_copy_check_var "$1" "$2"; then printf 'status=check\\nrefusal=%s\\n' "$HR_RUN_REFUSAL"; exit 0; fi
hr_commit_paths_var "$1" "$HR_RUN_COPY_TOP" "$HR_RUN_COPY_GITDIR" "$HR_RUN_COPY_BRANCH" "$HR_RUN_COPY_TIP" 100644 committed "fixture: $3" "$3" -- "fixture: $3"; s=$?
printf 'status=%s\\nnew=%s\\nsyncfailed=%s\\nrefusal=%s\\n' "$s" "$HR_COMMIT_NEW" "$HR_COMMIT_SYNC_FAILED" "$HR_COMMIT_REFUSAL"`;
/** The copy check, then the fast-forward to `$3`. */
const FAST_FORWARD = `if ! hr_run_copy_check_var "$1" "$2"; then printf 'status=check\\nrefusal=%s\\n' "$HR_RUN_REFUSAL"; exit 0; fi
hr_run_fast_forward_var "$3"; s=$?
printf 'status=%s\\ntip=%s\\nrefusal=%s\\n' "$s" "$HR_RUN_COPY_TIP" "$HR_RUN_FF_REFUSAL"`;

/**
 * A bare origin whose `trunk` carries `githooks/pre-push`; a main checkout on `trunk` carrying
 * `harness.config.json` and `autonomous_logs/`; the library copied to `<root>/lib/`; and the clone of
 * {@link BRANCH} at `<root>/main-feat_c`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'clone-ref-order-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  const lib = join(root, 'lib', 'harness-run-lib.sh');
  await mkdir(origin);
  await mkdir(join(main, 'githooks'), { recursive: true });
  await mkdir(join(root, 'lib'));
  await copyFile(LIB, lib);
  await runGit(origin, ['init', '--bare', '--quiet', '-b', 'trunk']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, 'githooks', 'pre-push'), '#!/bin/sh\nexit 0\n');
  await runGit(main, ['add', 'harness.config.json', 'githooks/pre-push']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await runGit(main, ['fetch', '--quiet', 'origin']);
  await mkdir(join(main, 'sdlc-harness', 'autonomous_logs'), { recursive: true });

  /** Run `body` with the fixture's library copy sourced; `$1`… are `args`. */
  const run = (body, args, env = {}) => runBash(root, ['-c', `. "$1" || exit 99; shift; ${body}`, 'hr', lib, ...args], env);

  const created = globals(
    await run(`hr_clone_create_var "$1" "$2" trunk; s=$?; printf 'status=%s\\nrefusal=%s\\n' "$s" "$HR_CLONE_REFUSAL"`, [main, BRANCH]),
  );
  assert.equal(created.status, '0', created.refusal);
  const clone = join(root, `main-${BRANCH}`);

  const f = {
    root,
    main,
    clone,
    check: async () => globals(await run(CHECK, [main, clone])),
    commitPaths: async (rel, env = {}) => globals(await run(COMMIT_PATHS, [main, clone, rel], env)),
    fastForward: async (env = {}) => globals(await run(FAST_FORWARD, [main, clone, ORIGIN_REF], env)),
    mainTip: async (ref = REF) => (await runGit(main, ['rev-parse', '--verify', ref])).stdout.trim(),
    cloneTip: async (ref = REF) => (await runGit(clone, ['rev-parse', '--verify', ref])).stdout.trim(),
    parentOf: async (oid) => (await runGit(clone, ['rev-parse', `${oid}^`])).stdout.trim(),
    cloneStatus: async () => (await runGit(clone, ['status', '--porcelain'])).stdout,
    /**
     * Give origin's {@link BRANCH} a commit on the main checkout's {@link REF} adding `path` with
     * `content`, made by plumbing in the main checkout, and fetch it to {@link ORIGIN_REF} there. The
     * main checkout's {@link REF} does not move. Returns the commit.
     */
    originGains: async (path, content) => {
      const parent = await f.mainTip();
      const blob = (await runBash(main, ['-c', 'printf "%s" "$1" | git hash-object -w --stdin', 'hr', content])).stdout.trim();
      const index = join(root, 'plumbing-index');
      const step = async (args) => {
        const r = await runBash(main, ['-c', 'git "$@"', 'hr', ...args], { GIT_INDEX_FILE: index });
        assert.equal(r.status, 0, r.stderr);
        return r.stdout.trim();
      };
      await step(['read-tree', parent]);
      await step(['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`]);
      const tree = await step(['write-tree']);
      await rm(index, { force: true });
      const oid = (await runGit(main, [...IDENTITY, 'commit-tree', tree, '-p', parent, '-m', `origin: ${path}`])).stdout.trim();
      await runGit(main, ['push', '--quiet', 'origin', `${oid}:${REF}`]);
      await runGit(main, ['fetch', '--quiet', 'origin']);
      assert.equal(await f.mainTip(ORIGIN_REF), oid);
      return oid;
    },
  };
  return f;
}

/**
 * Put a `git` shim first on `PATH`. On the first call whose arguments contain `trigger`, it commits
 * once in the clone — `commit-tree` of the clone's tree onto its tip, then an `update-ref` of
 * {@link REF} — with the caller's `GIT_*` location variables unset, and records that commit's id;
 * then it runs the real git, or with `fail` exits 1 without running it. Every other call is the real
 * git.
 */
async function raceShim(f, trigger, { fail = false } = {}) {
  const real = (await runBash(f.root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(f.root, 'shim-bin');
  const raced = join(f.root, 'shim-commit');
  await mkdir(bin);
  const plain = `env -u GIT_DIR -u GIT_COMMON_DIR -u GIT_OBJECT_DIRECTORY -u GIT_INDEX_FILE -u GIT_WORK_TREE "$REAL" -C '${f.clone}' -c core.hooksPath=/dev/null`;
  await writeFile(
    join(bin, 'git'),
    [
      '#!/bin/sh',
      `REAL='${real}'`,
      `case " $* " in *'${trigger}'*)`,
      `  if [ ! -e '${raced}' ]; then`,
      `    x=$(${plain} ${IDENTITY.map((a) => `'${a}'`).join(' ')} commit-tree 'HEAD^{tree}' -p HEAD -m 'race: landed after sync-in') || exit 98`,
      `    ${plain} update-ref '${REF}' "$x" || exit 98`,
      `    printf '%s' "$x" > '${raced}'`,
      fail ? '    exit 1' : '',
      '  fi ;;',
      'esac',
      'exec "$REAL" "$@"',
      '',
    ].join('\n'),
  );
  await chmod(join(bin, 'git'), 0o755);
  return {
    env: { PATH: `${bin}:${process.env.PATH}` },
    /** The race commit's id, or `null` when the shim never fired. */
    raced: async () => ((await exists(raced)) ? (await readFile(raced, 'utf8')).trim() : null),
  };
}

test('(a) A commit landing in the clone before the artifact commit’s first update-ref is refused with 4, and neither ref moves', async (t) => {
  const f = await fixture(t);
  const tip = await f.mainTip();
  assert.equal(await f.cloneTip(), tip);
  await writeFile(join(f.clone, 'b.txt'), 'artifact\n');
  const shim = await raceShim(f, ' update-ref ');
  const g = await f.commitPaths('b.txt', shim.env);
  const raced = await shim.raced();
  assert.ok(raced, 'the shim never fired');
  assert.equal(g.status, '4', JSON.stringify(g));
  assert.equal(g.new, '');
  assert.equal(g.syncfailed, '');
  assert.equal(await f.mainTip(), tip);
  assert.equal(await f.cloneTip(), raced);
  assert.equal(await f.parentOf(raced), tip);
});

test('(b) A commit landing in the clone before the fast-forward’s first update-ref is refused with 1, and neither ref nor the tree moves; with no race, both refs and the tree move', async (t) => {
  const f = await fixture(t);
  const tip = await f.mainTip();
  const target = await f.originGains('e.txt', 'from origin\n');
  const shim = await raceShim(f, ' update-ref ');
  const g = await f.fastForward(shim.env);
  const raced = await shim.raced();
  assert.ok(raced, 'the shim never fired');
  assert.equal(g.status, '1', JSON.stringify(g));
  assert.match(g.refusal, /moved, or its ref could not be locked/);
  assert.equal(await f.mainTip(), tip);
  assert.equal(await f.cloneTip(), raced);
  assert.equal(await f.parentOf(raced), tip);
  assert.equal(await exists(join(f.clone, 'e.txt')), false);
  assert.equal(await f.cloneStatus(), '');

  await t.test('positive control: the race commit rewound, no shim', async () => {
    await runGit(f.clone, ['update-ref', REF, tip, raced]);
    const ok = await f.fastForward();
    assert.deepEqual(ok, { status: '0', tip: target, refusal: '' });
    assert.equal(await f.mainTip(), target);
    assert.equal(await f.cloneTip(), target);
    assert.equal(await readFile(join(f.clone, 'e.txt'), 'utf8'), 'from origin\n');
    assert.equal(await f.cloneStatus(), '');
  });
});

test('(c) A failed main swap whose rollback loses to a clone commit leaves the commit landed with HR_COMMIT_SYNC_FAILED, and the next copy check syncs the clone in', async (t) => {
  const f = await fixture(t);
  const tip = await f.mainTip();
  await writeFile(join(f.clone, 'b.txt'), 'artifact\n');
  // The main checkout's swap is the one `update-ref` carrying `-m`; the clone's swap passed before it.
  const shim = await raceShim(f, ' update-ref -m ', { fail: true });
  const g = await f.commitPaths('b.txt', shim.env);
  const raced = await shim.raced();
  assert.ok(raced, 'the shim never fired');
  assert.equal(g.status, '1', JSON.stringify(g));
  assert.equal(g.syncfailed, '1');
  assert.match(g.new, /^[0-9a-f]{40,64}$/);
  assert.match(g.refusal, /could not follow the clone's/);
  assert.equal(await f.mainTip(), tip);
  assert.equal(await f.cloneTip(), raced);
  assert.equal(await f.parentOf(raced), g.new);
  assert.equal(await f.parentOf(g.new), tip);

  const next = await f.check();
  assert.deepEqual(next, { status: '0', tip: raced, refusal: '' });
  assert.equal(await f.mainTip(), raced);
  assert.equal(await f.cloneTip(), raced);
});
