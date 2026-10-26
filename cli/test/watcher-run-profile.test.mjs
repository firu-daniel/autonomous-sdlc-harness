/**
 * The written watcher's per-run permission profile, its launch check and its exit sync, driven by
 * one `tick` of the `init`-written `autonomous-watcher.sh` against a fixture, plus the watcher's
 * functions called directly in a shell that sourced it.
 *
 * **The rule these tests exist to enforce: a session is launched only on a per-run copy that equals
 * the base profile plus that run's exact deny entries and its wrapper twins — the run copy's spelling
 * of each base `allow` or `ask` rule for a main-checkout wrapper — with the sandbox on and strict or
 * the named opt-out taken.** And **a clone run's exit brings its branch into the main checkout, while a sync
 * that cannot run — RUN_MAIN unplaced included — is one log line and never changes the
 * classification.**
 *
 * The watcher holds declared mirrors of TypeScript owners; the last test holds each equal to its
 * owner, imported from `cli/dist`:
 * - `RUN_PROFILE_COPY_GIT_PATHS` (read through `run_profile_entries`) — `COPY_GIT_PATHS`, and the
 *   kind → rule map inside `run_profile_render` — `fileToolDenyRules`, both in
 *   `cli/src/generators/writeProtection.ts`;
 * - `run_profile_wrapper_prefixes`' main prefix — the `{{repoRoot}}` wrapper rows
 *   `cli/src/generators/permissionProfile.ts` writes, held by the clone launch case, which twins every
 *   such row a real `init` wrote;
 * - `RUN_PROFILE_OPT_OUT_MARKER` — `SANDBOX_OPT_OUT_MARKER`, and `RUN_PROFILE_SANDBOX_STRICT` —
 *   `shippedSandboxSettings()` filtered to `sandbox.enabled`, `sandbox.failIfUnavailable` and
 *   `sandbox.allowUnsandboxedCommands`, both in `cli/src/generators/sandboxProfile.ts`;
 * - `run_profile_entries`' run-copy path refusal — every `FORBIDDEN_IN_ENTRY` needle but `///`, in
 *   `cli/src/generators/profileEntries.ts`.
 * `RUN_PROFILE_SANDBOX_OPT_OUT` mirrors `applySandbox`'s opt-out branch in the same module; it is
 * held by the launch of a profile a real `init` rendered from `sandbox.optOut`, never by a
 * hand-written copy of that shape.
 *
 * Every per-run profile lands under the fixture's own `XDG_STATE_HOME` (`watcherEnv`).
 *
 * RED ONCE — each mutation applied once to the fixture's copy of `autonomous-watcher.sh`, the file
 * run, the failure observed, the mutation reverted:
 * - (P1) `classify_run_exit`'s `could not sync the clone … ($RUN_MAIN_REFUSAL)` log line replaced
 *   by `:` → fails `no unsynced-clone line`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { FORBIDDEN_IN_ENTRY } from '../dist/generators/profileEntries.js';
import { COPY_GIT_PATHS, copySurfacePaths, fileToolDenyRules } from '../dist/generators/writeProtection.js';
import { SANDBOX_OPT_OUT_MARKER, shippedSandboxSettings } from '../dist/generators/sandboxProfile.js';
import { INIT_SCRIPTS_DIR, runBash, runCli, runGit } from './helpers/fixture.mjs';
import { TICK_TIMEOUT_MS, createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const BASE_PROFILE = '.claude/settings.autonomous.json';
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;
const SANDBOX_CLAUSE = ['sandbox.enabled', 'sandbox.failIfUnavailable', 'sandbox.allowUnsandboxedCommands'];
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];

/** `entries` appended to `list` one by one, each only when absent — the render's `add_absent`. */
function addAbsent(list, entries) {
  const out = [...list];
  for (const entry of entries) if (!out.includes(entry)) out.push(entry);
  return out;
}

/** `profile` with the four arrays a per-run copy may append to removed. */
function withoutAppendable(profile) {
  const copy = structuredClone(profile);
  delete copy.sandbox.filesystem.denyWrite;
  delete copy.permissions.deny;
  delete copy.permissions.allow;
  delete copy.permissions.ask;
  return copy;
}

/** The wrapper-rule prefix `run_profile_wrapper_prefixes` gives a checkout at `root`. */
function wrapperPrefix(root) {
  return `Bash(bash ${root}/${INIT_SCRIPTS_DIR}/`;
}

/** The `copy` twin of each entry of `list` carrying `main`'s wrapper prefix, in order. */
function wrapperTwins(list, main, copy) {
  const from = wrapperPrefix(main);
  return (list ?? [])
    .filter((entry) => typeof entry === 'string' && entry.startsWith(from))
    .map((entry) => `${wrapperPrefix(copy)}${entry.slice(from.length)}`);
}

/**
 * A watcher fixture adopted on `origin`'s default branch, the stub recording its argument vector.
 * `optOut` re-renders the profile through `init --force` from `sandbox.optOut` before adopting.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ optOut?: boolean }} [options]
 */
async function adoptedFixture(t, { optOut = false } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  if (optOut) config.sandbox = { ...(config.sandbox ?? {}), optOut: { reason: 'the fixture opts out' } };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  if (optOut) {
    const init = await runCli(w.dir, ['init', '--force', '--no-analyze']);
    assert.equal(init.status, 0, `init --force exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  }
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const clone = `${w.dir}-${w.branch}`;
  t.after(() => rm(clone, { recursive: true, force: true }));
  const argvPath = join(w.dir, 'watcher-test', 'argv.txt');
  await w.setStub(`printf '%s\\n' "$@" > '${argvPath}'`);
  const basePath = join(w.dir, BASE_PROFILE);

  return {
    ...w,
    config,
    clone,
    argvPath,
    basePath,
    base: () => JSON.parse(readFileSync(basePath, 'utf8')),
    drop: () => writeFile(join(w.dir, STATE_DIR, 'autonomous_inbox', `${w.branch}_task_prompt.md`), 'do it\n', 'utf8'),
    /** The `--settings` argument the stub received, or `undefined` when it was never called. */
    settingsArg() {
      if (!existsSync(argvPath)) return undefined;
      const argv = readFileSync(argvPath, 'utf8').split('\n');
      return argv[argv.indexOf('--settings') + 1];
    },
    /** `script` run in a shell that sourced the written watcher; `$1`… are `args`. */
    watcherCall: (script, args = []) =>
      runBash(w.dir, ['-c', `. "$1" status >/dev/null; shift; ${script}`, '_', w.watcherPath, ...args], w.watcherEnv()),
    /** `hr_run_profile_file` for this fixture's slug and `branch`, under the fixture's environment. */
    async profileFileFor(branch) {
      const printed = await runBash(
        w.dir,
        ['-c', '. "$1"; hr_run_profile_file "$(hr_repo_slug "$2")" "$3"', '_', join(w.dir, LIB_PATH), w.dir, branch],
        w.watcherEnv(),
        { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
      );
      assert.equal(printed.status, 0, printed.stderr);
      return printed.stdout.trim();
    },
  };
}

/** The entries `run_profile_entries` should print for a clone at `copy`, then `others`' pointers. */
function cloneEntries(config, copy, others = []) {
  return [
    ...copySurfacePaths(config).map((rel) => ({ path: `${copy}/${rel}`, kind: 'entry' })),
    ...COPY_GIT_PATHS.map((row) => ({ path: `${copy}/${row.path}`, kind: row.kind })),
    ...others.map((other) => ({ path: `${other}/.git`, kind: 'file' })),
  ];
}

/**
 * Assert `profile` is `base` with exactly `entries` appended to the deny lists and the `copy` twins of
 * `main`'s wrapper rules to `allow` and `ask`, in order, each only when absent.
 */
function assertBasePlus(profile, base, entries, { main, copy }) {
  assert.deepEqual(
    profile.sandbox.filesystem.denyWrite,
    addAbsent(base.sandbox.filesystem.denyWrite, entries.map((e) => e.path)),
  );
  assert.deepEqual(profile.permissions.deny, addAbsent(base.permissions.deny, entries.flatMap((e) => fileToolDenyRules(e))));
  for (const list of ['allow', 'ask']) {
    if (base.permissions[list] === undefined) {
      assert.equal(profile.permissions[list], undefined, `${list} was created`);
      continue;
    }
    assert.deepEqual(
      profile.permissions[list],
      addAbsent(base.permissions[list], wrapperTwins(base.permissions[list], main, copy)),
      `${list} is not the base plus its wrapper twins`,
    );
  }
  assert.deepEqual(withoutAppendable(profile), withoutAppendable(base));
}

/** One pass that must refuse the launch: the log line, `failed`, one `failed` notice, no stub call. */
async function assertLaunchRefused(f) {
  await f.tick();
  assert.equal(f.prompts().length, 0, `the stub was called:\n${f.watcherLog()}`);
  assert.equal(f.settingsArg(), undefined, 'the stub recorded an argument vector');
  assert.ok(
    f.watcherLog().includes(`not launching '${f.branch}': `),
    `no "not launching" line:\n${f.watcherLog()}`,
  );
  assert.equal(f.record().status, 'failed');
  assert.equal(f.notifications().filter((n) => n.event === 'failed').length, 1, JSON.stringify(f.notifications()));
}

// --- Launch -------------------------------------------------------------------------------------

test('a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone\'s exact entries', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await f.drop();
  await f.tick();

  const settings = f.settingsArg();
  assert.ok(settings, `the stub was never called:\n${f.watcherLog()}`);
  const launchState = () => `record: ${JSON.stringify(f.record())}\nlog:\n${f.watcherLog()}`;
  assert.equal(settings, await f.profileFileFor(f.branch), `--settings is not hr_run_profile_file's path\n${launchState()}`);
  assert.ok(settings.startsWith(`${f.watcherEnv().XDG_STATE_HOME}/autonomous-sdlc-harness/run-profiles/`), settings);
  assert.equal(f.record().copy_kind, 'clone', `copy_kind is not clone\n${launchState()}`);
  assert.equal(f.record().worktree, f.clone, `worktree is not the clone\n${launchState()}`);

  const profile = JSON.parse(readFileSync(settings, 'utf8'));
  const base = f.base();
  assertBasePlus(profile, base, cloneEntries(f.config, f.clone), { main: f.dir, copy: f.clone });

  // Every main-checkout wrapper rule init wrote has its exact run-copy twin in the same list.
  let twins = 0;
  for (const list of ['allow', 'ask']) {
    for (const entry of base.permissions[list] ?? []) {
      if (!entry.startsWith(wrapperPrefix(f.dir))) continue;
      const twin = `${wrapperPrefix(f.clone)}${entry.slice(wrapperPrefix(f.dir).length)}`;
      assert.ok(profile.permissions[list].includes(twin), `${list} has no twin for ${entry}`);
      twins += 1;
    }
  }
  assert.ok(twins > 0, `the base carries no ${wrapperPrefix(f.dir)} rule to twin`);
});

test('a parked legacy worktree run, resumed, carries its own .git pointer and no clone .git path', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  const wt = `${f.dir}-legacy`;
  t.after(() => rm(wt, { recursive: true, force: true }));
  await runGit(f.dir, ['worktree', 'add', '--quiet', '-b', f.branch, wt]);
  const clar = join(wt, STATE_DIR, 'clarifications', f.branch);
  await runBash(wt, ['-c', 'mkdir -p "$1" && printf "## Q1\\n" > "$1/question_1.md" && printf "a1\\n" > "$1/answer_1.md"', '_', clar]);
  await f.seedRecord({ worktree: wt });

  await f.tick();

  const settings = f.settingsArg();
  assert.ok(settings, `the parked run was not resumed:\n${f.watcherLog()}`);
  assert.equal(settings, await f.profileFileFor(f.branch));
  const profile = JSON.parse(readFileSync(settings, 'utf8'));
  const denyWrite = profile.sandbox.filesystem.denyWrite;
  assert.ok(denyWrite.includes(`${wt}/.git`), `${wt}/.git is not in denyWrite`);
  assert.ok(profile.permissions.deny.includes(`Edit(/${wt}/.git)`), `Edit(/${wt}/.git) is not in deny`);
  assert.deepEqual(profile.permissions.deny.filter((rule) => rule.startsWith('Write(')), []);
  for (const row of COPY_GIT_PATHS) {
    assert.ok(!denyWrite.includes(`${wt}/${row.path}`), `${row.path} was added for a legacy worktree`);
  }
});

test('another live linked worktree\'s .git pointer is in the clone run\'s per-run copy', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  const other = `${f.dir}-other`;
  t.after(() => rm(other, { recursive: true, force: true }));
  await runGit(f.dir, ['worktree', 'add', '--quiet', '-b', 'feat_other', other]);

  await f.drop();
  await f.tick();

  const settings = f.settingsArg();
  assert.ok(settings, `the stub was never called:\n${f.watcherLog()}`);
  assertBasePlus(JSON.parse(readFileSync(settings, 'utf8')), f.base(), cloneEntries(f.config, f.clone, [other]), {
    main: f.dir,
    copy: f.clone,
  });
});

// --- Refusal ------------------------------------------------------------------------------------

for (const [name, perturb] of [
  ['the base\'s sandbox.enabled false with no opt-out marker', (p) => { p.sandbox.enabled = false; return `${JSON.stringify(p, null, 2)}\n`; }],
  ['the base\'s sandbox.failIfUnavailable false', (p) => { p.sandbox.failIfUnavailable = false; return `${JSON.stringify(p, null, 2)}\n`; }],
  ['an empty base file', () => ''],
  ['a base that is two JSON documents', (p) => `${JSON.stringify(p)}\n${JSON.stringify(p)}\n`],
]) {
  test(`the launch is refused on ${name}`, async (t) => {
    const f = await adoptedFixture(t);
    if (f === null) return;

    await writeFile(f.basePath, perturb(f.base()), 'utf8');
    await f.drop();
    await assertLaunchRefused(f);
  });
}

test('run_profile_check refuses a per-run copy tampered after render, and accepts the untampered one', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  const copy = `${f.dir}-tamper`;
  const rendered = await f.watcherCall('run_profile_render "$1" "$2" clone && printf "%s" "$RUN_PROFILE_FILE"', [
    'feat_tamper',
    copy,
  ]);
  assert.equal(rendered.status, 0, rendered.stderr);
  const file = rendered.stdout;
  assert.equal(file, await f.profileFileFor('feat_tamper'));
  const check = (path, checkCopy = copy) =>
    f.watcherCall('run_profile_check "$1" "$2"; printf "%s|%s" "$?" "$RUN_PROFILE_REFUSAL"', [path, checkCopy]);
  const notTwin = /^1\|.* appends a permissions\.allow or permissions\.ask entry that is not the run copy's twin of a base wrapper rule$/;

  assert.equal((await check(file)).stdout, '0|');
  // With no copy — job mode — the rendered twins are appends like any other.
  assert.match((await check(file, '')).stdout, notTwin);

  const profile = JSON.parse(readFileSync(file, 'utf8'));
  const changed = structuredClone(profile);
  changed.permissions.allow = [...(changed.permissions.allow ?? []), 'Bash(*)'];
  const changedPath = join(f.dir, 'watcher-test', 'changed.json');
  await writeFile(changedPath, `${JSON.stringify(changed, null, 2)}\n`, 'utf8');
  assert.match((await check(changedPath)).stdout, notTwin);

  const base = f.base();
  const [twin] = wrapperTwins(base.permissions.allow, f.dir, copy);
  assert.ok(twin, `the base carries no ${wrapperPrefix(f.dir)} allow rule`);
  const handTwinned = structuredClone(base);
  handTwinned.permissions.allow.push(twin);
  const handTwinnedPath = join(f.dir, 'watcher-test', 'hand-twinned.json');
  await writeFile(handTwinnedPath, `${JSON.stringify(handTwinned, null, 2)}\n`, 'utf8');
  assert.equal((await check(handTwinnedPath)).stdout, '0|');

  const dropped = structuredClone(profile);
  dropped.permissions.allow = dropped.permissions.allow.slice(1);
  const droppedPath = join(f.dir, 'watcher-test', 'dropped.json');
  await writeFile(droppedPath, `${JSON.stringify(dropped, null, 2)}\n`, 'utf8');
  assert.match(
    (await check(droppedPath)).stdout,
    /^1\|.* by more than entries appended to sandbox\.filesystem\.denyWrite, permissions\.deny, permissions\.allow and permissions\.ask$/,
  );

  const nonString = structuredClone(profile);
  nonString.sandbox.filesystem.denyWrite.push(42);
  const nonStringPath = join(f.dir, 'watcher-test', 'non-string.json');
  await writeFile(nonStringPath, `${JSON.stringify(nonString, null, 2)}\n`, 'utf8');
  assert.match((await check(nonStringPath)).stdout, /^1\|.* appends an entry that is not a string$/);
});

test('the opt-out profile init renders from sandbox.optOut launches', async (t) => {
  const f = await adoptedFixture(t, { optOut: true });
  if (f === null) return;

  const base = f.base();
  assert.equal(base.sandbox.enabled, false);
  assert.equal(base.sandbox.failIfUnavailable, false);
  assert.ok(base._README.some((line) => line.startsWith(SANDBOX_OPT_OUT_MARKER)), 'init wrote no opt-out marker line');

  await f.drop();
  await f.tick();

  assert.ok(f.settingsArg(), `the opt-out profile was refused:\n${f.watcherLog()}`);
  assert.ok(!f.watcherLog().includes('not launching'), f.watcherLog());
  assert.notEqual(f.record().status, 'failed');
});

// --- Exit sync ----------------------------------------------------------------------------------

test('a clone run\'s exit syncs its branch into the main checkout', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  const wrapperLog = join(f.dir, 'watcher-test', 'wrapper.log');
  // The wrapper commit, then a commit made directly in the clone, which only the exit sync carries over.
  await f.setStub(
    [
      'printf "one\\n" > sync-one.txt',
      `bash "$HARNESS_MAIN_REPO/${INIT_SCRIPTS_DIR}/commit-on-branch.sh" --repo "$PWD" sync-one.txt -- 'test: commit through the wrapper' >> '${wrapperLog}' 2>&1 || echo WRAPPER_FAILED >> '${wrapperLog}'`,
      'printf "two\\n" > sync-two.txt',
      `git add sync-two.txt && git -c core.hooksPath=/dev/null ${IDENTITY.join(' ')} commit -q -m 'test: commit directly in the clone' >> '${wrapperLog}' 2>&1 || echo DIRECT_FAILED >> '${wrapperLog}'`,
    ].join('\n'),
  );

  await f.drop();
  await f.tick();

  const log = existsSync(wrapperLog) ? readFileSync(wrapperLog, 'utf8') : '';
  assert.ok(!/WRAPPER_FAILED|DIRECT_FAILED/.test(log), log);
  const ref = `refs/heads/${f.branch}`;
  const cloneTip = (await runGit(f.clone, ['rev-parse', ref])).stdout.trim();
  const subjects = (await runGit(f.clone, ['log', '-2', '--format=%s', ref])).stdout.trim().split('\n');
  assert.deepEqual(subjects, ['test: commit directly in the clone', 'test: commit through the wrapper']);
  assert.equal((await runGit(f.dir, ['rev-parse', ref])).stdout.trim(), cloneTip, `the main checkout lags:\n${f.watcherLog()}`);
});

test('a clone run\'s exit with no placed main checkout logs the unsynced clone and classifies as before', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  // RUN_MAIN is placed once, when the watcher is sourced, from the script's own location. The exit is
  // classified directly in a shell that sourced it: once with RUN_MAIN emptied, as the watcher's top
  // empties it when it cannot place itself, and once as placed, for the classification to compare.
  const classify = async (emptyMain) => {
    await f.seedRecord({ status: 'running', copy_kind: 'clone' });
    const called = await f.watcherCall(
      `${emptyMain ? 'RUN_MAIN=""; ' : ''}classify_run_exit "$1" "$2" "$3" 0`,
      [f.branch, f.dir, f.record().log_path],
    );
    assert.equal(called.status, 0, called.stderr);
    return f.record().status;
  };
  const line =
    `classify: could not sync the clone of '${f.branch}' into the main checkout ` +
    '(cannot place the watcher in a main checkout) — its branch there may lag the run\'s commits';

  const placed = await classify(false);
  assert.ok(!f.watcherLog().includes(line), `the line was logged with RUN_MAIN placed:\n${f.watcherLog()}`);
  const unplaced = await classify(true);
  assert.ok(f.watcherLog().includes(line), `no unsynced-clone line:\n${f.watcherLog()}`);
  assert.equal(unplaced, placed);
  assert.equal(unplaced, 'completed');
  assert.deepEqual(f.notifications().map((n) => n.event), ['completed', 'completed']);
});

// --- Mirrors ------------------------------------------------------------------------------------

test('the watcher\'s mirrors equal their TypeScript owners', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  const scratch = (name) => join(f.dir, 'watcher-test', name);

  await t.test('run_profile_entries on a clone is the surface, then COPY_GIT_PATHS in order', async () => {
    const copy = `${f.dir}-mirror`;
    const printed = await f.watcherCall('run_profile_entries "$1" clone', [copy]);
    assert.equal(printed.status, 0, printed.stderr);
    const lines = printed.stdout.split('\n').filter((line) => line !== '');
    assert.deepEqual(lines, cloneEntries(f.config, copy).map((e) => `${e.path}\t${e.kind}`));
  });

  await t.test('run_profile_render appends fileToolDenyRules for each kind', async () => {
    const minimal = { sandbox: { filesystem: { denyWrite: [] } }, permissions: { deny: [] } };
    await writeFile(scratch('minimal.json'), `${JSON.stringify(minimal)}\n`, 'utf8');
    const entries = [
      { path: '/mirror/a-file', kind: 'file' },
      { path: '/mirror/a-directory', kind: 'directory' },
      { path: '/mirror/an-entry', kind: 'entry' },
    ];
    const printed = await f.watcherCall(
      [
        'SETTINGS_PROFILE="$1"',
        `run_profile_entries() { printf '%s\\n' ${entries.map((e) => `'${e.path}\t${e.kind}'`).join(' ')}; }`,
        'run_profile_render feat_mirror /mirror clone && printf "%s" "$RUN_PROFILE_FILE"',
      ].join('\n'),
      [scratch('minimal.json')],
    );
    assert.equal(printed.status, 0, printed.stderr);
    assert.equal(printed.stdout, await f.profileFileFor('feat_mirror'));
    const rendered = JSON.parse(readFileSync(printed.stdout, 'utf8'));
    assert.deepEqual(rendered.permissions.deny, entries.flatMap((e) => fileToolDenyRules(e)));
    assert.deepEqual(rendered.sandbox.filesystem.denyWrite, entries.map((e) => e.path));
  });

  await t.test('run_profile_render twins only the main-prefixed wrapper rules, each in its own list', async () => {
    const main = wrapperPrefix(f.dir);
    const minimal = {
      sandbox: { filesystem: { denyWrite: [] } },
      permissions: {
        allow: [`${main}x.sh:*)`, `Bash(bash ${INIT_SCRIPTS_DIR}/x.sh:*)`, `Bash(bash /elsewhere/${INIT_SCRIPTS_DIR}/y.sh:*)`],
        deny: [],
        ask: [`${main}deploy.sh:*)`],
      },
    };
    await writeFile(scratch('twins.json'), `${JSON.stringify(minimal)}\n`, 'utf8');
    const copy = '/twin/copy';
    const printed = await f.watcherCall(
      [
        'SETTINGS_PROFILE="$1"',
        'run_profile_entries() { :; }',
        'run_profile_render feat_twins "$2" clone && printf "%s" "$RUN_PROFILE_FILE"',
      ].join('\n'),
      [scratch('twins.json'), copy],
    );
    assert.equal(printed.status, 0, printed.stderr);
    const rendered = JSON.parse(readFileSync(printed.stdout, 'utf8'));
    const twin = wrapperPrefix(copy);
    assert.deepEqual(rendered.permissions.allow, [...minimal.permissions.allow, `${twin}x.sh:*)`]);
    assert.deepEqual(rendered.permissions.ask, [...minimal.permissions.ask, `${twin}deploy.sh:*)`]);
    assert.deepEqual(rendered.permissions.deny, []);
  });

  await t.test('run_profile_entries refuses a run copy path carrying any FORBIDDEN_IN_ENTRY needle but /// with exit 3', async () => {
    const needles = FORBIDDEN_IN_ENTRY.map(([needle]) => needle).filter((needle) => needle !== '///');
    assert.ok(needles.length > 0);
    for (const needle of needles) {
      const printed = await f.watcherCall('run_profile_entries "$1" clone', [`${f.dir}-a${needle}b`]);
      assert.equal(printed.status, 3, `${JSON.stringify(needle)}: ${printed.stderr}`);
      assert.equal(printed.stdout, '', JSON.stringify(needle));
    }
  });

  await t.test('RUN_PROFILE_OPT_OUT_MARKER is SANDBOX_OPT_OUT_MARKER', async () => {
    const printed = await f.watcherCall('printf "%s" "$RUN_PROFILE_OPT_OUT_MARKER"');
    assert.equal(printed.stdout, SANDBOX_OPT_OUT_MARKER);
  });

  await t.test('the strict sandbox values are shippedSandboxSettings(), and run_profile_check holds each', async () => {
    const shipped = shippedSandboxSettings().filter((s) => SANDBOX_CLAUSE.includes(s.path));
    assert.deepEqual(shipped.map((s) => s.path).sort(), [...SANDBOX_CLAUSE].sort());
    const strict = Object.fromEntries(shipped.map((s) => [s.path, s.value]));
    const printed = await f.watcherCall('printf "%s" "$RUN_PROFILE_SANDBOX_STRICT"');
    assert.deepEqual(JSON.parse(printed.stdout), strict);

    /** A minimal profile carrying `values`, checked as its own base. */
    const verdict = async (values, name) => {
      const sandbox = { filesystem: { denyWrite: [] } };
      for (const [dotted, value] of Object.entries(values)) sandbox[dotted.split('.')[1]] = value;
      const path = scratch(name);
      await writeFile(path, `${JSON.stringify({ sandbox, permissions: { deny: [] } })}\n`, 'utf8');
      return (
        await f.watcherCall('SETTINGS_PROFILE="$1"; run_profile_check "$1"; printf "%s|%s" "$?" "$RUN_PROFILE_REFUSAL"', [path])
      ).stdout;
    };
    assert.equal(await verdict(strict, 'strict.json'), '0|');
    for (const key of SANDBOX_CLAUSE) {
      assert.match(
        await verdict({ ...strict, [key]: !strict[key] }, `flipped-${key}.json`),
        /^1\|.* names no sandbox opt-out$/,
        `${key} flipped was accepted`,
      );
    }
  });
});
