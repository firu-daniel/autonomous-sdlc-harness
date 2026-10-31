/**
 * `hr_wrapper_target_check_var`'s clone arm in `cli/templates/scripts/lib/harness-run-lib.sh`,
 * with the allow-list it shares with `hr_clone_create_var` (`hr_clone_config_spec`).
 *
 * **The rule these tests exist to enforce: an unsandboxed wrapper runs git in a clone only when the
 * run registry records that clone at the path `hr_worktree_dir` derives for its branch, its `.git`
 * holds no file that redirects git, its `objects/info/alternates` borrows from the main checkout's
 * object store alone, and its `.git/config` is on the one allow-list its creator writes — which may
 * carry the main checkout's identity (`user.name`, `user.email`) at its exact value, and nothing
 * else that identifies or signs. Anything else is refused, naming a key or a file and never a
 * value, and the check writes nothing — not the registry, not its lock, not a ref.** The one
 * accepted shape of a redirecting file: a `.git/config.worktree` or `.git/objects/info/http-alternates`
 * that is a regular file, 0 bytes and not a symbolic link — for `config.worktree` only while
 * `extensions.worktreeConfig` is off. Every other shape of those two, and any `commondir`, an empty
 * one included, is refused. The non-regular arm plants a FIFO: the `/dev/null` placeholder it
 * stands for is a character device, which `mknod` makes and an unprivileged test cannot, and a FIFO
 * fails the regular-file test the same way. The planted-file cases (h), (h2) and (i) rest on the
 * measurement in `docs/sandbox-verification.md`, row CL5: the runtime leaves a clone's new
 * top-level `.git` files and `objects/info/` sandbox-writable.
 *
 * The positive case is a clone `hr_clone_create_var` made, so acceptance and creation are held to
 * one contract (case (p)). Each case builds a main checkout, a local bare origin and the clone
 * under the system temp directory and sources the library from the template tree; no case reaches
 * the network or this checkout's registry.
 *
 * RED ONCE — condition 4's alternates comparison deleted from `hr_clone_target_check_var`: case (i)
 * fails on its first three variants, every other case passes.
 *
 * RED ONCE — `hr_clone_identity_keys` printing nothing: case (q)'s identity arm, case (l)'s
 * `user.name` and `user.email` variants, case (s), case (t) and case (p) fail, every other case
 * passes.
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
/** The seed commit's identity when the main checkout sets none, as `cli/test/clone-sync.test.mjs` has it. */
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];
/** The identity the probe commit's global configuration names, distinct from the main checkout's. */
const GLOBAL_NAME = 'Global Fixture';
const GLOBAL_EMAIL = 'global@example.invalid';
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
 * `hr_clone_create_var` makes at `<root>/main-feat_c`. With `identity` false the main checkout sets
 * no `user.*` key and makes its seed commit under {@link IDENTITY}.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t, { clone = true, identity = true } = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'clone-trust-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  await mkdir(origin);
  await mkdir(main);
  await runGit(origin, ['init', '--bare', '--quiet']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  if (identity) {
    await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
    await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  }
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await mkdir(join(main, 'githooks'));
  await writeFile(join(main, 'githooks', 'README'), 'hooks\n');
  await runGit(main, ['add', 'harness.config.json', 'githooks']);
  await runGit(main, [...(identity ? [] : IDENTITY), 'commit', '--quiet', '-m', 'fixture: seed']);
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

/** `hr_clone_config_spec <main> <clone>` as a key → rule map, refusing a key listed twice. */
async function readSpec(f) {
  const printed = await lib(f.root, 'hr_clone_config_spec "$1" "$2"', f.main, f.clone);
  assert.equal(printed.status, 0, printed.stderr);
  const spec = new Map();
  for (const line of printed.stdout.split('\n').filter(Boolean)) {
    const [key, rule] = line.split('\t');
    assert.ok(!spec.has(key), `the spec lists ${key} twice`);
    spec.set(key, rule);
  }
  return spec;
}

/** The created clone's `.git/config` as a key → value map, refusing a key set twice. */
async function readHeld(f) {
  const held = new Map();
  for (const entry of (await f.config('--null', '--list')).stdout.split('\0').filter(Boolean)) {
    const at = entry.indexOf('\n');
    const key = entry.slice(0, at);
    assert.ok(!held.has(key), `the created clone sets ${key} twice`);
    held.set(key, entry.slice(at + 1));
  }
  return held;
}

/**
 * Write a commit with the clone as git's repository — `commit-tree`, so no ref moves — under a
 * global configuration naming {@link GLOBAL_NAME}, with every identity variable unset so the
 * caller's environment cannot mask the configuration; answer with its `author` and `committer`
 * lines.
 */
async function probeCommit(f) {
  const home = join(f.root, 'probe-home');
  await mkdir(home, { recursive: true });
  const gitconfig = join(home, '.gitconfig');
  await writeFile(gitconfig, `[user]\n\tname = ${GLOBAL_NAME}\n\temail = ${GLOBAL_EMAIL}\n`);
  const result = await runBash(
    f.root,
    [
      '-c',
      `unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL EMAIL
tree=$(git -C "$1" rev-parse 'HEAD^{tree}') || exit 97
git -C "$1" commit-tree "$tree" -p HEAD -m probe`,
      'hr',
      f.clone,
    ],
    { HOME: home, GIT_CONFIG_GLOBAL: gitconfig, GIT_CONFIG_NOSYSTEM: '1' },
  );
  assert.equal(result.status, 0, result.stderr);
  const body = (await runGit(f.clone, ['cat-file', '-p', result.stdout.trim()])).stdout;
  const line = (field) => body.split('\n').find((l) => l.startsWith(`${field} `)) ?? '';
  return { author: line('author'), committer: line('committer') };
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

test('(h) A planted commondir, or a config.worktree or http-alternates carrying content, is refused', async (t) => {
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

test('(h2) Only an empty regular config.worktree or http-alternates is accepted, the former only with extensions.worktreeConfig off', async (t) => {
  const INERT = ['config.worktree', 'objects/info/http-alternates'];
  const planted = (f, name) => new RegExp(`${escape(join(f.clone, '.git', name))} exists, and a clone the harness made has none`);
  for (const name of INERT) {
    await t.test(`an empty regular ${name} is accepted`, async (t) => {
      const f = await fixture(t);
      await writeFile(join(f.clone, '.git', name), '', { mode: 0o644 });
      const before = await f.snapshot();
      const g = await f.check(f.clone);
      assert.deepEqual(g, { status: '0', kind: 'clone', gitdir: join(f.clone, '.git'), branch: BRANCH, refusal: '' });
      assert.deepEqual(await f.snapshot(), before);
    });
    await t.test(`${name} with content is refused`, async (t) => {
      const f = await fixture(t);
      await writeFile(join(f.clone, '.git', name), '\n');
      await assertRefused(f, f.clone, planted(f, name));
    });
    await t.test(`a symbolic link at ${name} to an empty file is refused`, async (t) => {
      const f = await fixture(t);
      const decoy = join(f.root, 'empty-decoy');
      await writeFile(decoy, '');
      await symlink(decoy, join(f.clone, '.git', name));
      await assertRefused(f, f.clone, planted(f, name));
    });
    await t.test(`a FIFO at ${name} is refused`, async (t) => {
      const f = await fixture(t);
      const made = await runBash(f.root, ['-c', 'mkfifo "$1"', 'hr', join(f.clone, '.git', name)]);
      assert.equal(made.status, 0, made.stderr);
      await assertRefused(f, f.clone, planted(f, name));
    });
  }
  await t.test('an empty config.worktree is refused while extensions.worktreeConfig is true', async (t) => {
    const f = await fixture(t);
    await f.config('extensions.worktreeConfig', 'true');
    await writeFile(join(f.clone, '.git', 'config.worktree'), '');
    await assertRefused(
      f,
      f.clone,
      new RegExp(`${escape(join(f.clone, '.git', 'config.worktree'))} exists while .* does not hold extensions\\.worktreeConfig off`),
    );
  });
  await t.test('an empty commondir is refused', async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.clone, '.git', 'commondir'), '');
    await assertRefused(f, f.clone, planted(f, 'commondir'));
  });
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
  for (const key of [
    'core.fsmonitor',
    'core.sshCommand',
    'uploadpack.packObjectsHook',
    'extensions.worktreeConfig',
    'include.path',
    'commit.gpgsign',
    'user.signingkey',
    'gpg.format',
    'gpg.program',
    'gpg.ssh.program',
  ]) {
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
    'user.name': () => `${MARKER} name`,
    'user.email': () => `${MARKER}@example.invalid`,
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
  const spec = await readSpec(f);
  assert.equal(spec.get('remote.origin.url'), `=${f.origin}`);
  assert.equal(spec.get('core.hookspath'), `=${join(f.clone, 'githooks')}`);

  const held = await readHeld(f);

  for (const [key, value] of held) {
    const rule = spec.get(key);
    assert.ok(rule !== undefined, `the created clone sets ${key}, which the spec does not list`);
    if (rule === 'bool') assert.match(value, /^(true|false)$/, key);
    else assert.equal(value, rule.slice(1), key);
  }
  for (const key of ['core.repositoryformatversion', 'core.bare', 'remote.origin.fetch', 'remote.origin.url']) {
    assert.ok(held.has(key), `the created clone lacks the required ${key}`);
  }
  for (const key of [...[...spec].filter(([, rule]) => rule === 'bool').map(([key]) => key), 'user.name', 'user.email']) {
    const main = await runBash(f.root, ['-c', 'git -C / config --file "$1" --get "$2"', 'hr', join(f.main, '.git', 'config'), key]);
    if (key.startsWith('user.')) assert.equal(main.status, 0, `the fixture's main checkout sets no ${key}`);
    if (main.status === 0) assert.equal(held.get(key), main.stdout.trim(), `${key} is not copied from the main checkout`);
    else assert.ok(!held.has(key), `${key} is set though the main checkout sets none`);
  }
});

test("(q) The clone carries the main checkout's identity exactly when the main checkout sets one", async (t) => {
  await t.test('with an identity: listed, written, accepted, and the commit names it', async (t) => {
    const f = await fixture(t);
    const spec = await readSpec(f);
    assert.equal(spec.get('user.name'), '=Harness Fixture');
    assert.equal(spec.get('user.email'), '=fixture@example.invalid');
    const held = await readHeld(f);
    assert.equal(held.get('user.name'), 'Harness Fixture');
    assert.equal(held.get('user.email'), 'fixture@example.invalid');
    const g = await f.check(f.clone);
    assert.equal(g.status, '0', g.refusal);
    const { author, committer } = await probeCommit(f);
    assert.match(author, /^author Harness Fixture <fixture@example\.invalid> /);
    assert.match(committer, /^committer Harness Fixture <fixture@example\.invalid> /);
  });
  await t.test('without one: unlisted, unwritten, accepted, and the commit names the global identity', async (t) => {
    const f = await fixture(t, { identity: false });
    const spec = await readSpec(f);
    assert.deepEqual([...spec.keys()].filter((key) => key.startsWith('user.')), []);
    const held = await readHeld(f);
    assert.deepEqual([...held.keys()].filter((key) => key.startsWith('user.')), []);
    const g = await f.check(f.clone);
    assert.equal(g.status, '0', g.refusal);
    const { author, committer } = await probeCommit(f);
    assert.match(author, new RegExp(`^author ${GLOBAL_NAME} <${escape(GLOBAL_EMAIL)}> `));
    assert.match(committer, new RegExp(`^committer ${GLOBAL_NAME} <${escape(GLOBAL_EMAIL)}> `));
  });
});

test('(r) An identity key the main checkout does not set is refused in the clone', async (t) => {
  const f = await fixture(t, { identity: false });
  await f.config('user.name', `${MARKER} name`);
  await assertConfigRefused(f, 'user.name', /which the clone allow-list does not hold/);
});

test('(s) A clone without the identity keys — the shape made before they were mirrored — is accepted', async (t) => {
  const f = await fixture(t);
  const held = await readHeld(f);
  assert.ok(held.has('user.name') && held.has('user.email'), 'the created clone lacks the identity to unset');
  await f.config('--unset', 'user.name');
  await f.config('--unset', 'user.email');
  const g = await f.check(f.clone);
  assert.equal(g.status, '0', g.refusal);
});

test("(t) The main checkout's identity changing or unset under a live clone refuses it, naming the key", async (t) => {
  await t.test('changed', async (t) => {
    const f = await fixture(t);
    await runGit(f.main, ['config', 'user.name', 'Harness Fixture Renamed']);
    await assertConfigRefused(f, 'user.name', /to a value the clone allow-list does not allow/);
  });
  await t.test('unset', async (t) => {
    const f = await fixture(t);
    await runGit(f.main, ['config', '--unset', 'user.name']);
    await assertConfigRefused(f, 'user.name', /which the clone allow-list does not hold/);
  });
});

test("(u) Signing keys the main checkout sets are neither listed nor written into the clone, and are refused there at the main checkout's own value", async (t) => {
  const f = await fixture(t, { clone: false });
  const signing = { 'commit.gpgsign': 'true', 'gpg.format': 'ssh', 'user.signingkey': join(f.root, 'signing-key.pub') };
  for (const [key, value] of Object.entries(signing)) await runGit(f.main, ['config', key, value]);
  assert.equal(await f.create(BRANCH), f.clone);
  const spec = await readSpec(f);
  const held = await readHeld(f);
  for (const key of Object.keys(signing)) {
    assert.ok(!spec.has(key.toLowerCase()), `the spec lists ${key}`);
    assert.ok(!held.has(key.toLowerCase()), `the created clone sets ${key}`);
  }
  const g = await f.check(f.clone);
  assert.equal(g.status, '0', g.refusal);
  for (const [key, value] of Object.entries(signing)) {
    await f.config(key, value);
    await assertConfigRefused(f, key, /which the clone allow-list does not hold/);
    await f.config('--unset', key);
  }
});
