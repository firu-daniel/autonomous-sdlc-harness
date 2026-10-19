/**
 * `hr_wrapper_target_check_var`'s clone arm in `cli/templates/scripts/lib/harness-run-lib.sh`,
 * with the allow-list it shares with `hr_clone_create_var` (`hr_clone_config_spec`).
 *
 * **The rule these tests exist to enforce: an unsandboxed wrapper runs git in a clone only when the
 * run registry records that clone at the path `hr_worktree_dir` derives for its branch, its `.git`
 * holds no file that redirects git, its `objects/info/alternates` borrows from the main checkout's
 * object store alone, and its `.git/config` is on the one allow-list its creator writes. Anything
 * else is refused, naming a key or a file and never a value, and the check writes nothing — not the
 * registry, not its lock, not a ref.** The planted-file cases (h) and (i) rest on the measurement in
 * `docs/sandbox-verification.md`, row CL5: the runtime leaves a clone's new top-level `.git` files
 * and `objects/info/` sandbox-writable.
 *
 * The positive case is a clone `hr_clone_create_var` made, so acceptance and creation are held to
 * one contract (case (p)). Each case builds a main checkout, a local bare origin and the clone
 * under the system temp directory and sources the library from the template tree; no case reaches
 * the network or this checkout's registry.
 *
 * RED ONCE — condition 4's alternates comparison deleted from `hr_clone_target_check_var`: case (i)
 * fails on its first three variants, every other case passes.
 */

import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises';
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
/** A value no refusal may carry; every path a refusal names is under the fixture root, not this. */
const MARKER = 'hr-marker-value-7f3c';
const NOT_LISTED = /is neither the main checkout .* nor a worktree it lists: its \.git is not a regular pointer file/;
const NO_CLONE_RECORD = /, and the run registry records no clone of .* at that path$/;

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

/** Run `body` with the library sourced; `$1`… are `args`. */
function lib(cwd, body, ...args) {
  return runBash(cwd, ['-c', `. "$1" || exit 99; shift; ${body}`, 'hr', LIB, ...args]);
}

const CHECK = `hr_wrapper_target_check_var "$1" "$2"; s=$?
printf 'status=%s\\nkind=%s\\ngitdir=%s\\nbranch=%s\\nrefusal=%s\\n' "$s" "$HR_TARGET_KIND" "$HR_TARGET_GITDIR" "$HR_TARGET_BRANCH" "$HR_TARGET_REFUSAL"`;

/**
 * A bare origin; a main checkout on `trunk` carrying `harness.config.json` and `githooks/`, with
 * its registry directory made; and, unless `clone` is false, the clone of {@link BRANCH} that
 * `hr_clone_create_var` makes at `<root>/main-feat_c`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t, { clone = true } = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'clone-trust-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  await mkdir(origin);
  await mkdir(main);
  await runGit(origin, ['init', '--bare', '--quiet']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await mkdir(join(main, 'githooks'));
  await writeFile(join(main, 'githooks', 'README'), 'hooks\n');
  await runGit(main, ['add', 'harness.config.json', 'githooks']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await runGit(main, ['fetch', '--quiet', 'origin']);
  await mkdir(join(main, 'sdlc-harness', 'autonomous_logs'), { recursive: true });

  const registry = join(main, 'sdlc-harness', 'autonomous_logs', 'registry.json');
  const f = {
    root,
    origin,
    main,
    registry,
    clone: join(root, `main-${BRANCH}`),
    check: async (target) => globals(await lib(root, CHECK, main, target)),
    create: async (branch) => {
      const result = await lib(
        root,
        `hr_clone_create_var "$1" "$2" trunk; s=$?; printf 'status=%s\\ndir=%s\\nrefusal=%s\\n' "$s" "$HR_CLONE_DIR" "$HR_CLONE_REFUSAL"`,
        main,
        branch,
      );
      const g = globals(result);
      assert.equal(g.status, '0', g.refusal);
      return g.dir;
    },
    readRegistry: async () => JSON.parse(await readFile(registry, 'utf8')),
    writeRegistry: (doc) => writeFile(registry, `${JSON.stringify(doc)}\n`),
    config: (...args) => runGit(root, ['config', '--file', join(root, `main-${BRANCH}`, '.git', 'config'), ...args]),
    snapshot: async () => ({
      refs: (await runGit(main, ['for-each-ref'])).stdout,
      registry: (await exists(registry)) ? await readFile(registry, 'utf8') : null,
      lock: await exists(`${registry}.lock`),
    }),
  };
  if (clone) assert.equal(await f.create(BRANCH), f.clone);
  return f;
}

/** A refusal: status 1, no kind or gitdir, the main checkout's refs and registry byte-identical. */
async function assertRefused(f, target, pattern) {
  const before = await f.snapshot();
  const g = await f.check(target);
  assert.equal(g.status, '1', JSON.stringify(g));
  assert.equal(g.kind, '');
  assert.equal(g.gitdir, '');
  assert.equal(g.branch, '');
  assert.match(g.refusal, pattern);
  assert.deepEqual(await f.snapshot(), before);
  return g.refusal;
}

/** A config refusal names `key` (as git lists it, case-insensitively) and never {@link MARKER}. */
async function assertConfigRefused(f, key, pattern) {
  const refusal = await assertRefused(f, f.clone, new RegExp(escape(key), 'i'));
  assert.match(refusal, pattern);
  assert.ok(!refusal.includes(MARKER), refusal);
  assert.match(refusal, /so this clone's configuration is not trusted$/);
}

/** A repository at `dir` on `branch`, cloned from origin — what a sandboxed command could build. */
async function scratch(f, dir, branch) {
  await runGit(f.root, ['clone', '--quiet', '-b', 'trunk', f.origin, dir]);
  await runGit(dir, ['checkout', '--quiet', '-b', branch]);
}

test('(a) The created clone is accepted, and hr_wrapper_branch_var returns its branch without re-reading HEAD', async (t) => {
  const f = await fixture(t);
  const before = await f.snapshot();
  const g = await f.check(f.clone);
  assert.deepEqual(g, { status: '0', kind: 'clone', gitdir: join(f.clone, '.git'), branch: BRANCH, refusal: '' });
  assert.deepEqual(await f.snapshot(), before);

  const result = await lib(
    f.root,
    `hr_wrapper_target_check_var "$1" "$2" || exit 98
printf 'ref: refs/heads/trunk\\n' >"$2/.git/HEAD"
hr_wrapper_branch_var "$1" "$HR_TARGET_GITDIR"; s=$?
printf 'status=%s\\nbranch=%s\\n' "$s" "$HR_WRAPPER_BRANCH"`,
    f.main,
    f.clone,
  );
  assert.deepEqual(globals(result), { status: '0', branch: BRANCH });
});

test('(a2) The clone stays accepted once core.hooksPath is set to <clone>/<githooksDir>', async (t) => {
  const f = await fixture(t);
  await f.config('core.hooksPath', join(f.clone, 'githooks'));
  const g = await f.check(f.clone);
  assert.equal(g.status, '0', g.refusal);
  assert.equal(g.kind, 'clone');
});

test('(b) The main checkout and a linked worktree keep their own arms', async (t) => {
  const f = await fixture(t);
  assert.deepEqual(await f.check(f.main), {
    status: '0',
    kind: 'main',
    gitdir: join(f.main, '.git'),
    branch: '',
    refusal: '',
  });
  const wt = join(f.root, 'wt');
  await runGit(f.main, ['worktree', 'add', '--quiet', '-b', 'feat_w', wt]);
  assert.deepEqual(await f.check(wt), {
    status: '0',
    kind: 'worktree',
    gitdir: join(f.main, '.git', 'worktrees', 'wt'),
    branch: '',
    refusal: '',
  });
  const result = await lib(
    f.root,
    `hr_wrapper_target_check_var "$1" "$2" || exit 98
hr_wrapper_branch_var "$1" "$HR_TARGET_GITDIR"; printf 'status=%s\\nbranch=%s\\n' "$?" "$HR_WRAPPER_BRANCH"`,
    f.main,
    wt,
  );
  assert.deepEqual(globals(result), { status: '0', branch: 'feat_w' });
});

test('(c) A check must not write: with no registry, neither the check nor hr_registry_peek creates it or its lock', async (t) => {
  const f = await fixture(t, { clone: false });
  await scratch(f, f.clone, BRANCH);
  const refusal = await assertRefused(f, f.clone, NOT_LISTED);
  assert.match(refusal, NO_CLONE_RECORD);
  assert.equal(await exists(f.registry), false);
  assert.equal(await exists(`${f.registry}.lock`), false);

  const peek = await lib(f.root, `hr_registry_peek "$1" "$2" copy_kind; printf 'status=%s\\n' "$?"`, f.registry, BRANCH);
  assert.deepEqual(globals(peek), { status: '1' });
  assert.equal(await exists(f.registry), false);
  assert.equal(await exists(`${f.registry}.lock`), false);
});

test('(d) A scratch repository at the derived path with no registry record is refused', async (t) => {
  const f = await fixture(t);
  const dir = join(f.root, 'main-feat_s');
  await scratch(f, dir, 'feat_s');
  const refusal = await assertRefused(f, dir, NOT_LISTED);
  assert.match(refusal, NO_CLONE_RECORD);
});

test('(e) A record with no copy_kind, or whose worktree names another path, is refused', async (t) => {
  await t.test('copy_kind absent', async (t) => {
    const f = await fixture(t);
    const doc = await f.readRegistry();
    delete doc.runs[BRANCH].copy_kind;
    await f.writeRegistry(doc);
    await assertRefused(f, f.clone, NO_CLONE_RECORD);
  });
  await t.test('worktree names another path', async (t) => {
    const f = await fixture(t);
    const elsewhere = join(f.root, 'elsewhere');
    await mkdir(elsewhere);
    const doc = await f.readRegistry();
    doc.runs[BRANCH].worktree = elsewhere;
    await f.writeRegistry(doc);
    await assertRefused(f, f.clone, NO_CLONE_RECORD);
  });
});

test('(f) A clone moved off the derived path is refused even with the registry following it', async (t) => {
  const f = await fixture(t);
  const moved = join(f.root, 'moved');
  await rename(f.clone, moved);
  const doc = await f.readRegistry();
  doc.runs[BRANCH].worktree = moved;
  await f.writeRegistry(doc);
  await assertRefused(f, moved, /is a clone the run registry records, but not at the path hr_worktree_dir derives/);
});

test('(g) A HEAD rewritten to another recorded branch whose record names a different path is refused', async (t) => {
  const f = await fixture(t);
  const doc = await f.readRegistry();
  doc.runs.feat_d = { branch: 'feat_d', copy_kind: 'clone', worktree: join(f.root, 'main-feat_d') };
  await f.writeRegistry(doc);
  await writeFile(join(f.clone, '.git', 'HEAD'), 'ref: refs/heads/feat_d\n');
  await assertRefused(f, f.clone, NO_CLONE_RECORD);
});

test('(h) A planted commondir, config.worktree or http-alternates is refused', async (t) => {
  const plants = {
    commondir: (f) => `${join(f.main, '.git')}\n`,
    'config.worktree': () => `[core]\n\tfsmonitor = ${MARKER}\n`,
    'objects/info/http-alternates': () => `https://harness.invalid/${MARKER}\n`,
  };
  for (const [name, content] of Object.entries(plants)) {
    await t.test(name, async (t) => {
      const f = await fixture(t);
      await writeFile(join(f.clone, '.git', name), content(f));
      const refusal = await assertRefused(f, f.clone, new RegExp(`${escape(join(f.clone, '.git', name))} exists`));
      assert.ok(!refusal.includes(MARKER), refusal);
    });
  }
});

test('(i) alternates must be one regular-file line naming the main object store, and objects/info a real directory', async (t) => {
  const NOT_MAIN = /objects\/info\/alternates is not a regular file holding one line naming .*\/\.git\/objects$/;
  await t.test('a second directory', async (t) => {
    const f = await fixture(t);
    const other = join(f.root, 'other-objects');
    await mkdir(other);
    await writeFile(join(f.clone, '.git', 'objects', 'info', 'alternates'), `${join(f.main, '.git', 'objects')}\n${other}\n`);
    await assertRefused(f, f.clone, NOT_MAIN);
  });
  await t.test("another repository's objects", async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.clone, '.git', 'objects', 'info', 'alternates'), `${join(f.origin, 'objects')}\n`);
    await assertRefused(f, f.clone, NOT_MAIN);
  });
  await t.test('a symbolic link to a file with the right content', async (t) => {
    const f = await fixture(t);
    const alt = join(f.clone, '.git', 'objects', 'info', 'alternates');
    const decoy = join(f.root, 'alternates-decoy');
    await writeFile(decoy, `${join(f.main, '.git', 'objects')}\n`);
    await rm(alt);
    await symlink(decoy, alt);
    await assertRefused(f, f.clone, NOT_MAIN);
  });
  await t.test('objects/info a symbolic link', async (t) => {
    const f = await fixture(t);
    const info = join(f.clone, '.git', 'objects', 'info');
    const real = join(f.root, 'info-real');
    await rename(info, real);
    await symlink(real, info);
    await assertRefused(f, f.clone, /objects\/info is not a real directory$/);
  });
});

test('(j) A .git that is a symbolic link to a real .git directory takes the pointer-file path and is refused', async (t) => {
  const f = await fixture(t);
  const real = join(f.root, 'real-git');
  await rename(join(f.clone, '.git'), real);
  await symlink(real, join(f.clone, '.git'));
  const refusal = await assertRefused(f, f.clone, NOT_LISTED);
  assert.doesNotMatch(refusal, /run registry/);
});

test('(k) An off-list key is refused, naming the key and never its value', async (t) => {
  for (const key of ['core.fsmonitor', 'core.sshCommand', 'uploadpack.packObjectsHook', 'extensions.worktreeConfig', 'include.path']) {
    await t.test(key, async (t) => {
      const f = await fixture(t);
      await f.config(key, join(f.root, MARKER));
      await assertConfigRefused(f, key, /which the clone allow-list does not hold/);
    });
  }
});

test('(l) An allowed key with a wrong value is refused, naming the key and never its value', async (t) => {
  const cases = {
    'core.repositoryformatversion': () => '1',
    'remote.origin.url': (f) => join(f.root, `${MARKER}.git`),
    'core.hooksPath': (f) => join(f.root, MARKER, 'githooks'),
  };
  for (const [key, value] of Object.entries(cases)) {
    await t.test(key, async (t) => {
      const f = await fixture(t);
      await f.config(key, value(f));
      await assertConfigRefused(f, key, /to a value the clone allow-list does not allow/);
    });
  }
});

test('(m) A duplicated allowed key is refused', async (t) => {
  const f = await fixture(t);
  await f.config('--add', 'core.bare', 'false');
  await assertConfigRefused(f, 'core.bare', /sets core\.bare more than once/);
});

test('(n) A missing required key is refused', async (t) => {
  for (const key of ['core.repositoryformatversion', 'core.bare', 'remote.origin.fetch', 'remote.origin.url']) {
    await t.test(key, async (t) => {
      const f = await fixture(t);
      await f.config('--unset', key);
      await assertConfigRefused(f, key, new RegExp(`lacks ${escape(key)}, which the clone allow-list requires`));
    });
  }
});

test('(o) A .git/config git cannot parse is refused', async (t) => {
  const f = await fixture(t);
  const config = join(f.clone, '.git', 'config');
  await writeFile(config, `${await readFile(config, 'utf8')}[core\n\tfsmonitor = ${MARKER}\n`);
  const refusal = await assertRefused(f, f.clone, /git cannot parse .*\/\.git\/config, so this clone's configuration is not trusted$/);
  assert.ok(!refusal.includes(MARKER), refusal);
});

test('(p) hr_clone_config_spec and the created clone’s .git/config are one statement', async (t) => {
  const f = await fixture(t);
  const spec = new Map();
  const printed = await lib(f.root, 'hr_clone_config_spec "$1" "$2"', f.main, f.clone);
  assert.equal(printed.status, 0, printed.stderr);
  for (const line of printed.stdout.split('\n').filter(Boolean)) {
    const [key, rule] = line.split('\t');
    assert.ok(!spec.has(key), `the spec lists ${key} twice`);
    spec.set(key, rule);
  }
  assert.equal(spec.get('remote.origin.url'), `=${f.origin}`);
  assert.equal(spec.get('core.hookspath'), `=${join(f.clone, 'githooks')}`);

  const held = new Map();
  for (const entry of (await f.config('--null', '--list')).stdout.split('\0').filter(Boolean)) {
    const at = entry.indexOf('\n');
    const key = entry.slice(0, at);
    assert.ok(!held.has(key), `the created clone sets ${key} twice`);
    held.set(key, entry.slice(at + 1));
  }

  for (const [key, value] of held) {
    const rule = spec.get(key);
    assert.ok(rule !== undefined, `the created clone sets ${key}, which the spec does not list`);
    if (rule === 'bool') assert.match(value, /^(true|false)$/, key);
    else assert.equal(value, rule.slice(1), key);
  }
  for (const key of ['core.repositoryformatversion', 'core.bare', 'remote.origin.fetch', 'remote.origin.url']) {
    assert.ok(held.has(key), `the created clone lacks the required ${key}`);
  }
  for (const [key, rule] of spec) {
    if (rule !== 'bool') continue;
    const main = await runBash(f.root, ['-c', 'git -C / config --file "$1" --get "$2"', 'hr', join(f.main, '.git', 'config'), key]);
    if (main.status === 0) assert.equal(held.get(key), main.stdout.trim(), `${key} is not copied from the main checkout`);
    else assert.ok(!held.has(key), `${key} is set though the main checkout sets none`);
  }
});
