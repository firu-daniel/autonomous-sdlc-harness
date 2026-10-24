/**
 * The written watcher's stall watchdog — the reset to the last commit and the resume note after a
 * hung session is killed — driven through the real `check_stalled_runs` of the `init`-written
 * `autonomous-watcher.sh`, locally by two `tick`s and in job mode by `job`, against a copy a
 * sandboxed session could have written to.
 *
 * **The rule these tests exist to enforce: the watchdog's reset never runs code a sandboxed session
 * planted, never installs a run-authored protected path before a resumed session loads it, and
 * never resets a clone whose `.git` carries a file or key a clone the harness made has not; a hung
 * honest run still resumes from its committed ledger.**
 *
 * The hung session is the shared recording stub with a body that, on its first launch, writes
 * `hung`, keeps its stream fresh until the test writes `go` after planting, writes `silent` and
 * sleeps; a relaunch snapshots the registry and exits 0. The shipped tunables are lowered through the
 * environment (`STALL_WARN_SECS=1`, `STALL_KILL_SECS=2`), the busy-not-hung guard is lifted
 * (`STALL_BUSY_CPU_PCT`), and the local pass back-dates both liveness files as the watcher header's
 * `a stall` REPRO row does. The local fixture is `createWatcherFixture`'s, adopted on a bare
 * `origin`, with the copy cut by `create-worktree.sh` from a task drop: a clone, its record's
 * `copy_kind` `clone`. Its main `.git/config` sets the repo-relative `core.hooksPath` `githooks`, so
 * an unpinned hook-running call resolves hooks inside the copy, and `extensions.worktreeConfig=true`,
 * so a legacy copy's `config.worktree` is live for an unpinned call. A payload is committed the way
 * a session in a clone commits one: `hash-object` / `update-index` / `write-tree` / `commit-tree` in
 * the clone and an `update-ref` of the clone's own branch, with no working-tree write; the
 * watchdog's copy check syncs it into the main checkout. `{ legacy: true }` replaces the clone,
 * while the session hangs, with a linked worktree of the main checkout on the branch, its record
 * carrying no `copy_kind`: a parked run from before the clone layout. Every planted hook and
 * fsmonitor writes a marker named for itself. In job mode the job checkout is the fixture itself,
 * on the run branch.
 *
 * Where each plant lives on the clone layout:
 * - Clone-applicable, re-pointed at the clone: the uncommitted edit (honest), the committed
 *   protected path (S1, S2), the nested repository behind a gitlink (S3), the symlinked note (S5),
 *   the forged base, replace ref and grafts in the main repository (S6, S8, S9), and the
 *   skip-worktree bit in the clone's index (S7).
 * - Worktree-only, given its clone equivalent, each refused by the clone trust check with no
 *   marker, no reset written and no note: the record's `config.worktree` (S4: a planted
 *   `.git/config.worktree`; S4c: the same key in `.git/config`, off the allow-list) and the `.git`
 *   pointer (S10: a planted `.git/commondir`).
 * - Worktree-only, kept as migration coverage on a legacy worktree: S4, the original plant,
 *   because the worktree arm still serves a parked legacy run and only there does the reset's own
 *   pinning stand between the payload and a run.
 * - Job mode (J1–J6) is unchanged: its copy is the job checkout, never a clone.
 *
 * RED ONCE — local cases: each mutation applied once to the fixture's own written copy of
 * `autonomous-watcher.sh` (S2, S4, S4c, S6 to S10: to its `lib/harness-run-lib.sh`), never to the
 * template, the case run, the failure observed; measured on the clone layout unless the case is a
 * legacy one. Job cases: applied to `cli/templates/scripts/autonomous-watcher.sh` and reverted, and
 * not re-measured here, their checkout being the job's own:
 * - (honest) the watchdog's `hr_run_reset_var` call replaced by `:` → fails `the uncommitted edit
 *   survived the reset`.
 * - (S1) `hr_run_reset_var` replaced by the old `git -C "$worktree" reset --hard HEAD` → fails `a
 *   planted payload ran`, holding `S1-reference-transaction`.
 * - (S2) the surface check dropped from `hr_run_reset_var` → the case resumes: fails on the record's
 *   `status`, `completed`, not `failed`.
 * - (S3) `git -C "$worktree" status --short` added ahead of the reset → fails `a planted payload
 *   ran`, holding `S3-fsmonitor`. Regression guard, recorded on the worktree layout and not
 *   re-measured: the reset's `read-tree` run without its pins, or the old `git -C "$worktree" reset
 *   --hard HEAD`, did not reach this payload.
 * - (S4) `config.worktree` dropped from `hr_clone_target_check_var`'s absent-file loop → the case
 *   resumes: fails on the record's `status`, `completed`, not `failed`.
 * - (S4c) `hr_clone_config_check_var`'s off-allow-list test skipped → the same failure.
 * - (S10) `commondir` dropped from `hr_clone_target_check_var`'s absent-file loop → the same failure.
 * - (S4, legacy) the (S1) mutation → fails `a planted payload ran`, holding `S4-fsmonitor`.
 * - (S5) both `hr_run_path_safe` calls on the `PAUSE_PROGRESS.md` write skipped → the case resumes:
 *   fails on the record's `status`, `completed`, not `failed`.
 * - (S6) `hr_run_surface_check_var`'s merge base taken against the local
 *   `refs/remotes/origin/<defaultBranch>` in place of `HR_RUN_TRUSTED_BASE` → the case resumes:
 *   fails on the record's `status`, `completed`, not `failed`.
 * - (S7) `hr_run_worktree_diff_var` using `GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index"` in place of
 *   the temporary index → the case resumes: fails on the record's `status`, `completed`, not
 *   `failed`.
 * - (S8) `GIT_NO_REPLACE_OBJECTS=1` removed from `hr_copy_sync_main_git`, the body
 *   `hr_run_main_git` runs → the case resumes: fails on the record's `status`, `completed`, not
 *   `failed`.
 * - (S9) `hr_run_surface_check_var`'s merge base run as `GIT_NO_REPLACE_OBJECTS=1 git -C
 *   "$HR_RUN_MAIN" merge-base`, without `GIT_GRAFT_FILE=/dev/null` → the same failure. Removed from
 *   `hr_copy_sync_main_git` instead, the grafts refuse the sync-in first (`have diverged`), and the
 *   case fails on the refusal's wording.
 * - (J1) the empty-value test dropped from `stall_job_surfaces_ok` → fails `npx was called`, the stub
 *   having recorded `--job-surfaces=@<commit>`.
 * - (J2) the job-mode `stall_job_surfaces_ok` call skipped → the case resumes: fails on the record's
 *   `status`, `completed`, not `failed`.
 * - (J3) `--job-surfaces` given `hr_default_branch "$MAIN_REPO"` in place of
 *   `$HARNESS_GITHUB_DEFAULT_BRANCH`, the two set to differ → fails on the recorded argument vector.
 *   Second mutation: the `cd "$scratch"` dropped → fails `npx ran inside the job checkout`.
 * - (J4) the `npx` run from `$MAIN_REPO` in place of the scratch directory → fails `a planted payload
 *   ran`, holding `npmrc.marker` (npm 10.9.8, beside node v22.23.2).
 * - (J5) the same mutation → fails `a planted payload ran`, holding `node-modules.marker`.
 * - (J6) `--job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH"` without
 *   `@$HARNESS_GITHUB_DEFAULT_COMMIT@$HARNESS_DEFAULT_BRANCH_COMMIT` → the case resumes: fails on the record's `status`, `completed`, not `failed`.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { delimiter, dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { CLI_ENTRY, INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import { createWatcherFixture, DEFAULT_SANDBOX_PROBE } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;
const SETTINGS = '.claude/settings.json';
const PIN = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'submodule.recurse=false'];
/** The identity a clone-side `commit-tree` takes on its command line: the clone's config has none. */
const AUTHOR = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];
const CLI_VERSION = JSON.parse(readFileSync(join(dirname(CLI_ENTRY), '..', 'package.json'), 'utf8')).version;

/** One stalled pass's bound: a hang fails naming its command, below the suite's `--test-timeout`. */
const RUN_TIMEOUT_MS = 180_000;

/** How long the test waits for the hung session to report itself. */
const HUNG_WAIT_MS = 60_000;

/** The session: hung on its first launch (see the header), a registry snapshot on a relaunch. */
const HUNG_BODY = [
  'if [ ! -e "$REC/hung" ]; then',
  '  : > "$REC/hung"',
  '  until [ -e "$REC/go" ]; do echo "{}"; sleep 0.2; done',
  '  : > "$REC/silent"',
  '  sleep 60',
  'else',
  '  cp "$REGISTRY" "$REC/resumed-registry.json"',
  'fi',
].join('\n');

/** `gh`, recorded; `run list` answers no runs. */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
if (args.join(' ').startsWith('run list')) process.stdout.write('[]');
`;

/** `npx`, recorded: its argument vector one per line, its canonical working directory, an exit. */
const NPX_RECORDER = `#!/usr/bin/env bash
printf '%s\\n' "$@" > "$NPX_LOG"
pwd -P > "$NPX_PWD"
exit "\${NPX_STUB_EXIT:-0}"
`;

/** `npx` running this repository's built CLI: `--yes` and the package spec dropped. */
const NPX_BUILT_CLI = `#!/usr/bin/env bash
shift 2
exec node '${CLI_ENTRY.replaceAll("'", `'\\''`)}' "$@"
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
 * A watcher fixture adopted on `origin`'s default branch, with the main `.git/config` setting
 * `extensions.worktreeConfig=true` and the repo-relative `core.hooksPath` `githooks`. `job` checks
 * the run branch out in the fixture itself, the job's checkout; otherwise `localStall` cuts the
 * copy, a clone, which `legacy` replaces with a linked worktree whose record carries no `copy_kind`.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ job?: boolean, legacy?: boolean }} [options]
 */
async function createStallFixture(t, { job = false, legacy = false } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const origin = `${w.dir}-origin.git`;
  const copy = job ? w.dir : `${w.dir}-${w.branch}`;
  const markers = `${w.dir}-markers`;
  const payloads = `${w.dir}-payloads`;
  const outside = `${w.dir}-outside`;
  for (const dir of [`${w.dir}-${w.branch}`, markers, payloads, outside]) {
    t.after(() => rm(dir, { recursive: true, force: true }));
  }
  for (const dir of [markers, payloads, outside]) await mkdir(dir);
  const markerBody = (name, tail = 'exit 0') => `#!/bin/sh\n: > '${join(markers, name)}'\n${tail}\n`;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  await runGit(w.dir, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(w.dir, ['config', 'core.hooksPath', 'githooks']);
  // The recorders stay untracked: in job mode the reset would otherwise put the stub body back.
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await git(w.dir, ['add', '-A']);
  await git(w.dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await git(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);
  if (job) await git(w.dir, ['checkout', '--quiet', '-b', w.branch]);

  const rec = join(w.dir, 'watcher-test');
  const bin = join(rec, 'bin');
  await mkdir(bin);
  const ghStub = join(rec, 'gh');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });
  await w.setStub(HUNG_BODY);
  const logPath = join(w.dir, STATE_DIR, 'autonomous_logs', `${w.branch}.log`);
  const ref = `refs/heads/${w.branch}`;

  /** The environment both modes share: the hung session's inputs and the lowered tunables. */
  const stallEnv = (env) => ({
    REC: rec,
    REGISTRY: join(w.dir, REGISTRY_PATH),
    HARNESS_GH_CLI: ghStub,
    STUB_LOG: join(rec, 'gh.log'),
    STALL_CHECK_ENABLED: '1',
    STALL_WARN_SECS: '1',
    STALL_KILL_SECS: '2',
    STALL_BUSY_CPU_PCT: '100000',
    ...env,
  });

  /**
   * Start `argv` under bash, wait for the hung session, run `plant`, release the session and
   * return the finished run. A run that ends before the session hung fails naming its output.
   */
  async function stalled(argv, env, plant) {
    let settled = null;
    const running = runBash(w.dir, argv, env, { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal }).then((result) => {
      settled = result;
      return result;
    });
    const deadline = Date.now() + HUNG_WAIT_MS;
    while (!existsSync(join(rec, 'hung'))) {
      if (settled !== null) {
        assert.fail(`the run ended before the session hung\n${settled.stdout}\n${settled.stderr}\n${w.watcherLog()}`);
      }
      assert.ok(Date.now() < deadline, `the session did not hang within ${HUNG_WAIT_MS} ms\n${w.watcherLog()}`);
      await delay(100);
    }
    await plant();
    await writeFile(join(rec, 'go'), '', 'utf8');
    const result = await running;
    assert.equal(result.status, 0, `the run exited ${result.status}\n${result.stdout}\n${result.stderr}`);
    return result;
  }

  const f = {
    ...w,
    config,
    copy,
    origin,
    markers,
    payloads,
    outside,
    ref,
    bin,
    markerBody,
    /** The local drop, launch, plant and stalled `tick`, in one shell (the header). */
    async localStall(plant = async () => {}, env = {}) {
      await writeFile(join(w.dir, STATE_DIR, 'autonomous_inbox', `${w.branch}_task_prompt.md`), 'do the thing\n', 'utf8');
      const script = [
        '. "$1" status >/dev/null',
        `hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,
        'tick',
        'until [ -e "$2" ]; do sleep 0.1; done',
        'touch -t 202001010000 "$3" "$4"',
        'tick',
        'wait',
      ].join('\n');
      const argv = ['-c', script, '_', w.watcherPath, join(rec, 'silent'), logPath, logPath.replace(/\.log$/, '.stream.jsonl')];
      return stalled(argv, w.watcherEnv(stallEnv(env)), async () => {
        assert.ok(existsSync(copy), `create-worktree.sh cut no working copy\n${w.watcherLog()}`);
        assert.equal(w.record().copy_kind, 'clone', `create-worktree.sh cut no clone\n${w.watcherLog()}`);
        if (legacy) {
          await rm(copy, { recursive: true, force: true });
          await git(w.dir, ['worktree', 'add', '--quiet', copy, w.branch]);
          const registryPath = join(w.dir, REGISTRY_PATH);
          const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
          delete registry.runs[w.branch].copy_kind;
          await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
        }
        await plant();
      });
    },
    /** One `job` run of the branch, with `plant` run while the session hangs. */
    async jobStall(plant = async () => {}, env = {}) {
      const defaultCommit = await git(origin, ['rev-parse', `refs/heads/${config.defaultBranch}`]);
      const jobEnv = w.watcherEnv(
        stallEnv({
          HARNESS_JOB_MODE: '1',
          HARNESS_INPUT_CHAIN: '',
          HARNESS_REMOTE_SLUG: '',
          HARNESS_JOB_STARTED_EPOCH: '',
          HARNESS_JOB_DEADLINE_EPOCH: '',
          RUNNER_ENVIRONMENT: '',
          REMOTE_SELF_PAUSE_AFTER_SECS: '',
          GITHUB_RUN_ID: '',
          GITHUB_REPOSITORY: '',
          GITHUB_SERVER_URL: '',
          RUNNER_TEMP: '',
          POLL_INTERVAL_SECS: '1',
          REMOTE_CONTROL_POLL_SECS: '1',
          REMOTE_AUTO_RESUME_MAX: '0',
          REMOTE_AUTO_RESUME_DELAY_SECS: '0',
          HARNESS_CLI_VERSION: CLI_VERSION,
          HARNESS_GITHUB_DEFAULT_BRANCH: config.defaultBranch,
          HARNESS_GITHUB_DEFAULT_COMMIT: defaultCommit,
          HARNESS_DEFAULT_BRANCH_COMMIT: defaultCommit,
          NPX_LOG: join(rec, 'npx-argv.txt'),
          NPX_PWD: join(rec, 'npx-pwd.txt'),
          PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
          ...env,
        }),
      );
      return stalled([join(w.dir, INIT_SCRIPTS_DIR, 'autonomous-watcher.sh'), 'job', w.branch, 'task', 'none'], jobEnv, plant);
    },
    /** Put `body` on `PATH` as `npx`, ahead of every other. */
    npx: (body) => writeFile(join(bin, 'npx'), body, { mode: 0o755 }),
    npxArgv: () => (existsSync(join(rec, 'npx-argv.txt')) ? readFileSync(join(rec, 'npx-argv.txt'), 'utf8').split('\n').slice(0, -1) : null),
    npxPwd: () => readFileSync(join(rec, 'npx-pwd.txt'), 'utf8').trim(),
    /** The registry as the relaunched session read it, or `null` when no session was relaunched. */
    resumedRecord: () =>
      existsSync(join(rec, 'resumed-registry.json'))
        ? JSON.parse(readFileSync(join(rec, 'resumed-registry.json'), 'utf8')).runs[w.branch]
        : null,
    markerNames: () => readdirSync(markers).sort(),
    tip: () => git(w.dir, ['rev-parse', ref]),
    originTip: (name) => git(origin, ['rev-parse', `refs/heads/${name}`]),
    defaultFile: (path) => git(w.dir, ['show', `refs/remotes/origin/${config.defaultBranch}:${path}`]),
    /** The copy's git directory: the clone's `.git`, or a legacy worktree's record. */
    recordDir: () => git(copy, ['rev-parse', '--absolute-git-dir']),
    /** An executable payload outside the fixture that writes `<markers>/<name>`, then `tail`. */
    async payload(name, tail = 'exit 1') {
      const path = join(payloads, `${name}.sh`);
      await writeFile(path, markerBody(name, tail), { mode: 0o755 });
      return path;
    },
    /**
     * Commit `entries` on the copy's branch the way a sandboxed session in it can: by plumbing
     * through the copy's own index, object store and `refs/heads/<branch>`, writing no working-tree
     * file. On a clone the main checkout's branch stays where it was until the watchdog syncs in.
     *
     * @param {{ path: string, content?: string, oid?: string, mode?: string }[]} entries
     */
    async commitInCopy(entries, message) {
      for (const { path, content, oid, mode = '100644' } of entries) {
        const object = oid ?? (await sh(copy, 'printf "%s" "$1" | git hash-object -w --no-filters --stdin', [content]));
        await git(copy, ['update-index', '--add', '--cacheinfo', `${mode},${object},${path}`]);
      }
      const tree = await git(copy, ['write-tree']);
      const parent = await git(copy, ['rev-parse', ref]);
      const commit = await git(copy, [...AUTHOR, 'commit-tree', tree, '-p', parent, '-m', message]);
      await git(copy, ['update-ref', ref, commit, parent]);
      return commit;
    },
    /** Bring the clone's branch's objects into the main repository, moving no ref there. */
    fetchCopy: () => git(w.dir, ['fetch', '--quiet', '--no-tags', copy, ref]),
    /** An uncommitted edit to a tracked file, which a reset discards. */
    edit: () => writeFile(join(copy, 'README.md'), '# edited by the hung session\n', 'utf8'),
    edited: () => readFileSync(join(copy, 'README.md'), 'utf8') === '# edited by the hung session\n',
  };
  return f;
}

/** A session-written `.claude/settings.json` whose `SessionStart` hook writes `<markers>/<name>`. */
const markerSettings = (f, name) =>
  JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: `: > '${join(f.markers, name)}'` }] }] } });

/** Given up: the record `failed`, no relaunch, no marker, the `failed` notification naming `reason`. */
function assertGivenUp(f, reason) {
  const detail = JSON.stringify(f.notifications()) + '\n' + f.watcherLog();
  assert.deepEqual(f.markerNames(), [], 'a planted payload ran');
  assert.equal(f.record().status, 'failed', detail);
  assert.equal(f.resumedRecord(), null, `the session was relaunched\n${detail}`);
  assert.equal(f.prompts().length, 1, detail);
  assert.equal(f.notifications().some((n) => n.event === 'resumed'), false, detail);
  assert.match(f.notifications().filter((n) => n.event === 'failed').at(-1)?.detail ?? '', reason, detail);
}

/** Resumed: relaunched `running` with `stall_restarts` 1, a `resumed` notification, no marker. */
function assertResumed(f) {
  const detail = JSON.stringify(f.notifications()) + '\n' + f.watcherLog();
  assert.deepEqual(f.markerNames(), [], 'a planted payload ran');
  const resumed = f.resumedRecord();
  assert.notEqual(resumed, null, `the session was not relaunched\n${detail}`);
  assert.equal(resumed.status, 'running', detail);
  assert.equal(resumed.stall_restarts, '1', detail);
  assert.equal(f.prompts().length, 2, detail);
  assert.match(f.notifications().find((n) => n.event === 'resumed')?.detail ?? '', /stall-watchdog restart #1/, detail);
}

const REFUSED = (path) => new RegExp(`the reset was refused.*${path.replaceAll('.', '\\.')}`);
const JOB_SURFACE = /change a job surface, or that could not be checked/;

/** The clone trust check's sentence for a planted `.git/<name>`. */
const plantedFile = (name) => new RegExp(`is a clone, but \\S*/\\.git/${name.replaceAll('.', '\\.')} exists, and a clone the harness made has none`);

/** The clone trust check's sentence for `.git/config` keys off the allow-list. */
const offAllowList = (keys) => new RegExp(`\\.git/config sets ${keys}, which the clone allow-list does not hold`);

/**
 * Given up by the clone trust check with `reason`, ahead of the reset: `assertGivenUp`, the
 * session's uncommitted edit still in place, no resume note written, and the branch unmoved.
 */
async function assertCloneRefused(f, reason, tip) {
  assertGivenUp(f, reason);
  assert.equal(f.edited(), true, 'the reset ran');
  const note = join(f.copy, STATE_DIR, 'PAUSE_PROGRESS.md');
  assert.ok(!existsSync(note) || !/discarded by a reset/.test(readFileSync(note, 'utf8')), 'the resume note was written');
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
}

// ---------------------------------------------------------------------------------------------
// Local mode.
// ---------------------------------------------------------------------------------------------

test('an honest hung run resumes: the edit discarded, the branch unmoved, the note written', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  let tip;

  await f.localStall(async () => {
    tip = await f.tip();
    await f.edit();
  });

  assertResumed(f);
  assert.equal(f.edited(), false, 'the uncommitted edit survived the reset');
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
  assert.match(readFileSync(join(f.copy, STATE_DIR, 'PAUSE_PROGRESS.md'), 'utf8'), /discarded by a reset to the last commit/);
});

test('(S1) a githooks/reference-transaction committed on the branch is refused, and never runs', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  let hooksBefore;

  await f.localStall(async () => {
    hooksBefore = readdirSync(join(f.copy, 'githooks')).sort();
    await f.commitInCopy(
      [{ path: 'githooks/reference-transaction', content: f.markerBody('S1-reference-transaction'), mode: '100755' }],
      'run: add a ref hook',
    );
  });

  assertGivenUp(f, REFUSED('githooks/reference-transaction'));
  assert.deepEqual(readdirSync(join(f.copy, 'githooks')).sort(), hooksBefore, 'the working-tree githooks/ changed');
});

test('(S2) a .claude/settings.json committed with a hook is refused, and the working-tree file is not installed', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;

  await f.localStall(() => f.commitInCopy([{ path: SETTINGS, content: markerSettings(f, 'S2-session-start') }], 'run: add a session hook'));

  assertGivenUp(f, REFUSED(SETTINGS));
  assert.equal(readFileSync(join(f.copy, SETTINGS), 'utf8').trim(), await f.defaultFile(SETTINGS));
});

test("(S3) a nested repository's own core.fsmonitor behind a gitlink is never run: the run resumes", async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;

  await f.localStall(async () => {
    const nested = join(f.copy, 'nested');
    await mkdir(nested);
    await git(nested, ['init', '--quiet']);
    await writeFile(join(nested, 'n.txt'), 'n\n', 'utf8');
    await git(nested, ['add', 'n.txt']);
    await git(nested, ['-c', 'user.name=n', '-c', 'user.email=n@example.invalid', 'commit', '--quiet', '-m', 'n']);
    await f.commitInCopy([{ path: 'nested', oid: await git(nested, ['rev-parse', 'HEAD']), mode: '160000' }], 'run: add a gitlink');
    await git(nested, ['config', 'core.fsmonitor', await f.payload('S3-fsmonitor')]);
  });

  assertResumed(f);
});

test('(S5) a PAUSE_PROGRESS.md symlinked out of the clone is refused, and the outside file is unchanged', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  const target = join(f.outside, 'note.md');
  await writeFile(target, 'outside\n', 'utf8');

  await f.localStall(async () => {
    const note = join(f.copy, STATE_DIR, 'PAUSE_PROGRESS.md');
    await rm(note, { force: true });
    await symlink(target, note);
  });

  assertGivenUp(f, /the state directory in .* is not safe to write/);
  assert.equal(readFileSync(target, 'utf8'), 'outside\n', 'the note was written outside the copy');
});

test('(S6) a forged base: the local default-branch refs pointed at a payload tip do not pass it', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  const defaultBranch = f.config.defaultBranch;
  const originDefault = await f.originTip(defaultBranch);
  let tip;

  await f.localStall(async () => {
    const payload = markerSettings(f, 'S6-session-start');
    const commit = await f.commitInCopy([{ path: SETTINGS, content: payload }], 'run: add a session hook');
    // The working tree matches the tip, so only the merge base the surface check takes stands
    // between this tip and a resume.
    await writeFile(join(f.copy, SETTINGS), payload, 'utf8');
    tip = commit;
    await f.fetchCopy();
    for (const repo of [f.dir, f.copy]) {
      await git(repo, ['update-ref', `refs/remotes/origin/${defaultBranch}`, commit]);
    }
    await git(f.dir, ['update-ref', `refs/heads/${defaultBranch}`, commit]);
  });

  assertGivenUp(f, REFUSED(SETTINGS));
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
  assert.equal(await f.originTip(defaultBranch), originDefault, "origin's default branch moved");
});

test("(S7) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused", async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  let tip;

  await f.localStall(async () => {
    tip = await f.tip();
    await writeFile(join(f.copy, SETTINGS), markerSettings(f, 'S7-session-start'), 'utf8');
    await git(f.copy, ['update-index', '--skip-worktree', SETTINGS]);
  });

  assertGivenUp(f, REFUSED(SETTINGS));
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
});

test('(S8) a replace ref on the merge base does not pass a payload tip', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  const originDefault = await f.originTip(f.config.defaultBranch);
  let tip;

  await f.localStall(async () => {
    const payload = markerSettings(f, 'S8-session-start');
    const commit = await f.commitInCopy([{ path: SETTINGS, content: payload }], 'run: add a session hook');
    await writeFile(join(f.copy, SETTINGS), payload, 'utf8');
    await f.fetchCopy();
    tip = commit;
    const base = await git(f.dir, ['merge-base', commit, originDefault]);
    const fake = await git(f.dir, ['commit-tree', `${commit}^{tree}`, '-m', 'fake']);
    await git(f.dir, ['update-ref', `refs/replace/${base}`, fake]);
  });

  assertGivenUp(f, REFUSED(SETTINGS));
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
});

test('(S9) an info/grafts line on the tip and the base does not pass a payload tip', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  const originDefault = await f.originTip(f.config.defaultBranch);
  let tip;

  await f.localStall(async () => {
    const payload = markerSettings(f, 'S9-session-start');
    const commit = await f.commitInCopy([{ path: SETTINGS, content: payload }], 'run: add a session hook');
    await writeFile(join(f.copy, SETTINGS), payload, 'utf8');
    await f.fetchCopy();
    tip = commit;
    const fake = await git(f.dir, ['commit-tree', `${commit}^{tree}`, '-m', 'fake']);
    await mkdir(join(f.dir, '.git', 'info'), { recursive: true });
    await writeFile(join(f.dir, '.git', 'info', 'grafts'), `${commit} ${fake}\n${originDefault} ${fake}\n`, 'utf8');
  });

  assertGivenUp(f, REFUSED(SETTINGS));
  assert.equal(await f.tip(), tip, `${f.ref} moved`);
});

// ---------------------------------------------------------------------------------------------
// The clone equivalents of the worktree-only plants.
// ---------------------------------------------------------------------------------------------

test('(S4) a .git/config.worktree planted in the clone, carrying core.fsmonitor, is refused before the reset', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  let tip;

  await f.localStall(async () => {
    tip = await f.tip();
    await f.edit();
    await git(f.dir, ['config', '--file', join(await f.recordDir(), 'config.worktree'), 'core.fsmonitor', await f.payload('S4-fsmonitor')]);
  });

  await assertCloneRefused(f, plantedFile('config.worktree'), tip);
});

test("(S4c) a core.fsmonitor in the clone's .git/config, off the allow-list, is refused before the reset", async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  let tip;

  await f.localStall(async () => {
    tip = await f.tip();
    await f.edit();
    await git(f.dir, ['config', '--file', join(await f.recordDir(), 'config'), 'core.fsmonitor', await f.payload('S4c-fsmonitor')]);
  });

  await assertCloneRefused(f, offAllowList('core\\.fsmonitor'), tip);
});

test('(S10) a .git/commondir planted in the clone, naming a repository whose config carries a payload, is refused before the reset', async (t) => {
  const f = await createStallFixture(t);
  if (f === null) return;
  let tip;

  await f.localStall(async () => {
    tip = await f.tip();
    await f.edit();
    // A `.git` holding the branch at the clone's tip, so the common dir resolves and the clone's ref
    // reads the same through it: only the clone check's own file test refuses it.
    const planted = join(f.payloads, 'planted');
    await git(f.payloads, ['init', '--quiet', planted]);
    await git(planted, ['fetch', '--quiet', f.copy, `${f.ref}:${f.ref}`]);
    await git(planted, ['config', 'core.fsmonitor', await f.payload('S10-fsmonitor')]);
    await writeFile(join(await f.recordDir(), 'commondir'), `${join(planted, '.git')}\n`, 'utf8');
  });

  await assertCloneRefused(f, plantedFile('commondir'), tip);
});

// ---------------------------------------------------------------------------------------------
// Migration coverage: a parked legacy worktree run, its record carrying no copy_kind.
// ---------------------------------------------------------------------------------------------

test("(S4, legacy) migration coverage: a core.fsmonitor in a legacy worktree's config.worktree is never read: the run resumes", async (t) => {
  const f = await createStallFixture(t, { legacy: true });
  if (f === null) return;

  await f.localStall(async () => {
    await git(f.dir, ['config', '--file', join(await f.recordDir(), 'config.worktree'), 'core.fsmonitor', await f.payload('S4-fsmonitor')]);
  });

  assertResumed(f);
});

// ---------------------------------------------------------------------------------------------
// Job mode.
// ---------------------------------------------------------------------------------------------

test('(J1) job mode with HARNESS_GITHUB_DEFAULT_BRANCH unset gives up without calling npx', async (t) => {
  const f = await createStallFixture(t, { job: true });
  if (f === null) return;
  await f.npx(NPX_RECORDER);

  await f.jobStall(() => f.edit(), { HARNESS_GITHUB_DEFAULT_BRANCH: '' });

  assert.equal(f.npxArgv(), null, 'npx was called');
  assertGivenUp(f, JOB_SURFACE);
  assert.equal(f.edited(), true, 'the reset ran');
});

test('(J2) job mode with the job-surfaces check failing gives up before the reset', async (t) => {
  const f = await createStallFixture(t, { job: true });
  if (f === null) return;
  await f.npx(NPX_RECORDER);

  await f.jobStall(() => f.edit(), { NPX_STUB_EXIT: '1' });

  assertGivenUp(f, JOB_SURFACE);
  assert.notEqual(f.npxArgv(), null, 'npx was not called');
  assert.equal(f.edited(), true, 'the reset ran');
});

test('(J3) job mode on an honest branch runs the pinned check from a scratch directory, then resumes', async (t) => {
  const f = await createStallFixture(t, { job: true });
  if (f === null) return;
  await f.npx(NPX_RECORDER);
  const githubDefault = `gh-${f.config.defaultBranch}`;
  const commit = await f.originTip(f.config.defaultBranch);

  await f.jobStall(() => f.edit(), {
    HARNESS_GITHUB_DEFAULT_BRANCH: githubDefault,
    HARNESS_GITHUB_DEFAULT_COMMIT: commit,
    HARNESS_DEFAULT_BRANCH_COMMIT: commit,
  });

  assertResumed(f);
  assert.deepEqual(f.npxArgv(), [
    '--yes',
    `autonomous-sdlc-harness@${CLI_VERSION}`,
    'doctor',
    '--cwd',
    f.dir,
    `--job-surfaces=${githubDefault}@${commit}@${commit}`,
  ]);
  const pwd = f.npxPwd();
  assert.ok(pwd !== f.dir && !pwd.startsWith(`${f.dir}/`), `npx ran inside the job checkout: ${pwd}`);
  assert.equal(existsSync(pwd), false, `the scratch directory ${pwd} was left behind`);
  assert.equal(f.edited(), false, 'the uncommitted edit survived the reset');
});

/**
 * The real `npx` beside the test's `node`, offline, on an empty cache and an empty user
 * configuration; `null` (the test skipped) when no `npx` sits there.
 */
async function realNpxEnv(t, f) {
  const nodeBin = dirname(realpathSync(process.execPath));
  if (!existsSync(join(nodeBin, 'npx'))) {
    t.skip(`no npx beside ${process.execPath}`);
    return null;
  }
  await writeFile(join(f.payloads, 'empty.npmrc'), '', 'utf8');
  return {
    PATH: `${nodeBin}${delimiter}${process.env.PATH ?? ''}`,
    npm_config_offline: 'true',
    npm_config_cache: join(f.payloads, 'npm-cache'),
    npm_config_userconfig: join(f.payloads, 'empty.npmrc'),
  };
}

/** A session-written `package.json` and `node_modules/autonomous-sdlc-harness` whose bin runs `body`. */
async function plantLocalPackage(f, body) {
  const pkg = JSON.parse(readFileSync(join(f.copy, 'package.json'), 'utf8'));
  pkg.dependencies = { 'autonomous-sdlc-harness': CLI_VERSION };
  await writeFile(join(f.copy, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  const dir = join(f.copy, 'node_modules', 'autonomous-sdlc-harness');
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'autonomous-sdlc-harness', version: CLI_VERSION, bin: { 'autonomous-sdlc-harness': 'cli.js' } }),
    'utf8',
  );
  await writeFile(join(dir, 'cli.js'), `#!/usr/bin/env node\n${body}\nprocess.exit(0);\n`, { mode: 0o755 });
  await mkdir(join(f.copy, 'node_modules', '.bin'), { recursive: true });
  await symlink('../autonomous-sdlc-harness/cli.js', join(f.copy, 'node_modules', '.bin', 'autonomous-sdlc-harness'));
}

test('(J4) a session-written .npmrc never reaches the real npx: the offline fetch fails and the run is given up', async (t) => {
  const f = await createStallFixture(t, { job: true });
  if (f === null) return;
  const env = await realNpxEnv(t, f);
  if (env === null) return;
  const payload = join(f.payloads, 'npmrc-payload.cjs');
  await writeFile(payload, `require('node:fs').writeFileSync(${JSON.stringify(join(f.markers, 'npmrc.marker'))}, '');\n`, 'utf8');

  await f.jobStall(async () => {
    await plantLocalPackage(f, '');
    await writeFile(join(f.copy, '.npmrc'), `node-options=--require ${payload}\n`, 'utf8');
  }, env);

  assertGivenUp(f, JOB_SURFACE);
});

test('(J5) a session-written node_modules never reaches the real npx: the run is given up', async (t) => {
  const f = await createStallFixture(t, { job: true });
  if (f === null) return;
  const env = await realNpxEnv(t, f);
  if (env === null) return;

  await f.jobStall(
    () => plantLocalPackage(f, `require('node:fs').writeFileSync(${JSON.stringify(join(f.markers, 'node-modules.marker'))}, '');`),
    env,
  );

  assertGivenUp(f, JOB_SURFACE);
});

test('(J6) a forged base in the job checkout: the real doctor judges from the recorded commit and refuses', async (t) => {
  const f = await createStallFixture(t, { job: true });
  if (f === null) return;
  await f.npx(NPX_BUILT_CLI);
  const defaultBranch = f.config.defaultBranch;
  const script = `${INIT_SCRIPTS_DIR}/remote-run.sh`;

  await f.jobStall(async () => {
    const original = readFileSync(join(f.copy, script), 'utf8');
    const tip = await f.commitInCopy([{ path: script, content: `${original}\n# run-authored\n`, mode: '100755' }], 'run: change a job surface');
    await f.edit();
    await git(f.dir, ['update-ref', `refs/remotes/origin/${defaultBranch}`, tip]);
  });

  assertGivenUp(f, JOB_SURFACE);
  assert.equal(f.edited(), true, 'the reset ran');
});
