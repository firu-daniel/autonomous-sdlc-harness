/**
 * The written watcher on a bubblewrap host — `hr_placeholder_host_probe_var` answering `1` through
 * the `tick` helper's `placeholderHost: true` seam — driven by `tick` passes of the `init`-written
 * `autonomous-watcher.sh` against a fixture, and by `print_status` called in a shell that sourced it.
 *
 * **The rule these tests exist to enforce: on a bubblewrap host the watcher launches no clone carrying
 * a planted trust file, records what was absent before each session, and runs, and reports, one run
 * at a time, and removes only a recorded, 0-byte, read-only leftover, before the first reader that it
 * breaks, including the watcher's own start. In a job the watcher records what was absent under
 * `$RUNNER_TEMP` and removes those leftovers before the watchdog's recovery and before the job
 * ends, and `job-sweep` removes them after a watcher killed with its session.** The seam-off cases
 * hold that a host that is not one takes none of those arms.
 *
 * The `job-sweep:` cases run the written watcher's `job-sweep` entry against a job fixture whose
 * registry holds the branch `running` under a dead pid, or a live one, and whose `RUNNER_TEMP`
 * manifest is written through `hr_job_absent_file`.
 *
 * The `job:` cases source the watcher, enter job mode through `job_mode_enter` — the `job` entry's
 * own switch — install the seam, point `RUNNER_TEMP` at a fixture-owned sibling of the checkout and
 * call `run_job` in the fixture itself, checked out on the run branch. A leftover is planted while
 * the stall session hangs, or by a session that plants it and exits 2, and the job's automatic
 * resumes are off, so only the sweep under test can remove it.
 *
 * Every per-run profile and manifest lands under the fixture's own `XDG_STATE_HOME` (`watcherEnv`). A
 * leftover is recorded the way a launch records one: `hr_placeholder_manifest_write`, while the path
 * is still absent, at `hr_run_profile_absent_file` for a branch of its own (`KILLED_BRANCH`), so no
 * launch in the case rewrites it.
 *
 * The stall cases replay the watcher header's `a stall` REPRO row with the session of
 * `watcher-stall-reset-payloads.test.mjs`: hung on its first launch until the test writes `go`, a
 * registry snapshot on its relaunch.
 *
 * The another-run-live case drives `process_inbox_file` itself with `RUN_CAP` lifted: on a bubblewrap
 * host the cap is 1, so a live run defers the drop at the cap check, ahead of the sweep call.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { chmod, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import {
  DEFAULT_KEEP_AWAKE_PROBE,
  DEFAULT_SANDBOX_PROBE,
  TICK_TIMEOUT_MS,
  createWatcherFixture,
} from './helpers/watcher.mjs';
import { scaleBound } from './helpers/timing.mjs';

const STATE_DIR = 'sdlc-harness';
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
const SECOND_BRANCH = 'feat_y';
const CLAMP_LINE =
  "bubblewrap host: at most one live run per repository (concurrent runs share the main checkout's sandbox placeholders; docs/cli.md §6)";
const KILLED_BRANCH = 'killed_session';
const START_REFUSAL = 'is not inside a git repository — refusing to start';

/** One stalled pass's bound, and the wait for the hung session (`helpers/timing.mjs`). */
const STALL_TIMEOUT_MS = scaleBound(180_000);
const HUNG_WAIT_MS = scaleBound(60_000);

/** The session: hung on its first launch until `go`, a registry snapshot on a relaunch. */
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

/** The probe overrides a pass script installs after sourcing the watcher, the seam answering `host`. */
const probes = (host) =>
  [
    `hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,
    `hr_keep_awake_probe_var() {\n${DEFAULT_KEEP_AWAKE_PROBE}\n}`,
    `hr_placeholder_host_probe_var() {\nHR_PLACEHOLDER_HOST=${host}; return 0\n}`,
  ].join('\n');

/** Create `path` as the leftover a killed session leaves: empty, mode 0444. */
async function plantLeftover(path) {
  await writeFile(path, '', 'utf8');
  await chmod(path, 0o444);
}

/** True when `path` exists or is a symbolic link — the manifest write's own absence test, negated. */
function present(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * A watcher fixture adopted on `origin`'s default branch, the stub recording its argument vector.
 *
 * @param {import('node:test').TestContext} t
 */
async function adoptedFixture(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const clone = `${w.dir}-${w.branch}`;
  const secondClone = `${w.dir}-${SECOND_BRANCH}`;
  t.after(() => rm(clone, { recursive: true, force: true }));
  t.after(() => rm(secondClone, { recursive: true, force: true }));
  const argvPath = join(w.dir, 'watcher-test', 'argv.txt');
  await w.setStub(`printf '%s\\n' "$@" > '${argvPath}'`);
  const inbox = join(w.dir, STATE_DIR, 'autonomous_inbox');

  /** `hr_run_profile_file` and `hr_run_profile_absent_file` for this fixture's slug and `branch`. */
  const libPath = async (fn, branch) => {
    const printed = await runBash(
      w.dir,
      ['-c', `. "$1"; ${fn} "$(hr_repo_slug "$2")" "$3"`, '_', join(w.dir, LIB_PATH), w.dir, branch],
      w.watcherEnv(),
      { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
    );
    assert.equal(printed.status, 0, printed.stderr);
    return printed.stdout.trim();
  };

  return {
    ...w,
    clone,
    secondClone,
    inbox,
    drop: (branch = w.branch) => writeFile(join(inbox, `${branch}_task_prompt.md`), 'do it\n', 'utf8'),
    /** The `--settings` argument the stub last received, or `undefined` when it was never called. */
    settingsArg() {
      if (!existsSync(argvPath)) return undefined;
      const argv = readFileSync(argvPath, 'utf8').split('\n');
      return argv[argv.indexOf('--settings') + 1];
    },
    profileFile: (branch = w.branch) => libPath('hr_run_profile_file', branch),
    manifestFile: (branch = w.branch) => libPath('hr_run_profile_absent_file', branch),
    /** The main checkout's own `<scriptsDir>/.git`, where a leftover hides the checkout from git. */
    scriptsGit: join(w.dir, INIT_SCRIPTS_DIR, '.git'),
    /** Record `paths`, each still absent, in `KILLED_BRANCH`'s manifest. */
    async recordAbsent(...paths) {
      const manifest = await libPath('hr_run_profile_absent_file', KILLED_BRANCH);
      const written = await runBash(
        w.dir,
        ['-c', '. "$1"; shift; hr_placeholder_manifest_write "$@"', '_', join(w.dir, LIB_PATH), manifest, ...paths],
        w.watcherEnv(),
        { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
      );
      assert.equal(written.status, 0, written.stderr);
      assert.deepEqual(readFileSync(manifest, 'utf8').split('\n').filter((l) => l !== ''), paths);
    },
    /** `bash -c script` with the watcher as `$1` and `args` after it, under the pass environment. */
    async pass(script, args = [], env = {}, timeoutMs = TICK_TIMEOUT_MS) {
      const result = await runBash(w.dir, ['-c', script, '_', w.watcherPath, ...args], w.watcherEnv(env), {
        timeoutMs,
        signal: t.signal,
      });
      assert.equal(result.status, 0, `the pass exited ${result.status}\n${result.stdout}\n${result.stderr}`);
      return result;
    },
    registry: () => JSON.parse(readFileSync(join(w.dir, REGISTRY_PATH), 'utf8')),
    async writeRegistry(registry) {
      await mkdir(dirname(join(w.dir, REGISTRY_PATH)), { recursive: true });
      await writeFile(join(w.dir, REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    },
    /** `print_status`'s lines in a shell that sourced the watcher with the seam answering `host`. */
    async statusLines(host) {
      const script = [
        '. "$1" status >/dev/null',
        `hr_keep_awake_probe_var() {\n${DEFAULT_KEEP_AWAKE_PROBE}\n}`,
        `hr_placeholder_host_probe_var() {\nHR_PLACEHOLDER_HOST=${host}; return 0\n}`,
        'print_status',
      ].join('\n');
      const printed = await runBash(w.dir, ['-c', script, '_', w.watcherPath], w.watcherEnv({ MAX_PARALLEL_RUNS: '5' }), {
        timeoutMs: TICK_TIMEOUT_MS,
        signal: t.signal,
      });
      assert.equal(printed.status, 0, printed.stderr);
      return printed.stdout.split('\n');
    },
  };
}

test('a planted .git/commondir in the clone refuses the resume', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await f.drop();
  await f.tick({}, { placeholderHost: true });
  assert.equal(f.prompts().length, 1, `the first launch did not run:\n${f.watcherLog()}`);

  const registry = f.registry();
  const record = registry.runs[f.branch];
  assert.equal(record.copy_kind, 'clone');
  assert.equal(record.worktree, f.clone);
  record.status = 'parked';
  record.pid = '';
  await f.writeRegistry(registry);
  const clar = join(f.clone, STATE_DIR, 'clarifications', f.branch);
  await runBash(f.clone, ['-c', 'mkdir -p "$1" && printf "## Q1\\n" > "$1/question_1.md" && printf "a1\\n" > "$1/answer_1.md"', '_', clar]);
  const planted = join(f.clone, '.git', 'commondir');
  await writeFile(planted, '../../elsewhere/.git\n', 'utf8');

  await f.tick({}, { placeholderHost: true });

  assert.equal(f.prompts().length, 1, `the planted clone was launched:\n${f.watcherLog()}`);
  assert.equal(f.record().status, 'failed');
  const refusal = `not launching '${f.branch}': the run copy failed its trust check before launch: `;
  const line = f.watcherLog().split('\n').find((l) => l.includes(refusal));
  assert.ok(line, `no trust-check refusal line:\n${f.watcherLog()}`);
  assert.ok(line.includes('.git/commondir'), line);
  const failed = f.notifications().filter((n) => n.event === 'failed');
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.ok(failed[0].detail.includes('.git/commondir'), failed[0].detail);
});

/**
 * Every path `profile`'s denyWrite list yields, as `hr_profile_deny_paths` lists it: each exact
 * string, then each `<parent>/<stem>*<suffix>` glob as `<parent>/<name><suffix>` for each
 * `<stem>`-prefixed directory under `<parent>`.
 */
function profileDenyPaths(profile) {
  const list = profile.sandbox.filesystem.denyWrite.filter((e) => typeof e === 'string' && !e.includes('\n'));
  const expanded = list
    .filter((e) => e.includes('*'))
    .flatMap((glob) => {
      const head = glob.slice(0, glob.indexOf('*'));
      const suffix = glob.slice(glob.indexOf('*') + 1);
      const parent = head.slice(0, head.lastIndexOf('/'));
      const stem = head.slice(head.lastIndexOf('/') + 1);
      return readdirSync(parent)
        .filter((name) => name.startsWith(stem) && statSync(join(parent, name), { throwIfNoEntry: false })?.isDirectory())
        .map((name) => `${parent}/${name}${suffix}`);
    });
  return [...list.filter((e) => !e.includes('*')), ...expanded];
}

/** Create the sibling `<projectName>-other` with a real `.git/objects/info/`, removed when the case ends. */
async function makeOtherSibling(t, f) {
  const dir = `${f.dir}-other`;
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, '.git', 'objects', 'info'), { recursive: true });
  return dir;
}

/** `<other>`, spelled as `profile`'s `<glob>/.mcp.json` entry spells the work root. */
function otherAsGlobbed(profile) {
  const glob = profile.sandbox.filesystem.denyWrite.find((e) => typeof e === 'string' && e.includes('*') && e.endsWith('/.mcp.json'));
  assert.ok(glob, 'the profile carries no <glob>/.mcp.json entry');
  return glob.slice(0, -'/.mcp.json'.length).replace('*', 'other');
}

test('after a launch the manifest lists exactly the absent denyWrite paths, glob expansions included, and --add-dir .mcp.json paths', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  await makeOtherSibling(t, f);

  await f.drop();
  await f.tick({}, { placeholderHost: true });

  const settings = f.settingsArg();
  assert.ok(settings, `the stub was never called:\n${f.watcherLog()}`);
  assert.equal(settings, await f.profileFile());
  const manifestPath = await f.manifestFile();
  assert.equal(manifestPath, settings.replace(/\.json$/, '.absent'));
  assert.ok(existsSync(manifestPath), `no manifest at ${manifestPath}:\n${f.watcherLog()}`);
  const manifest = readFileSync(manifestPath, 'utf8').split('\n').filter((l) => l !== '');

  const profile = JSON.parse(readFileSync(settings, 'utf8'));
  const candidates = [...profileDenyPaths(profile), `${f.clone}/.mcp.json`, `${f.dir}/${STATE_DIR}/.mcp.json`];
  assert.deepEqual([...manifest].sort(), candidates.filter((p) => !present(p)).sort());
  assert.ok(manifest.length > 0, 'the manifest is empty');
  const other = otherAsGlobbed(profile);
  for (const rel of ['.git/commondir', '.git/config.worktree', '.git/objects/info/http-alternates', '.mcp.json']) {
    assert.ok(manifest.includes(`${other}/${rel}`), `${other}/${rel} is not listed:\n${manifest.join('\n')}`);
  }
  assert.ok(manifest.includes(`${f.dir}/${STATE_DIR}/.mcp.json`), manifest.join('\n'));
  const existing = `${f.clone}/.git/config`;
  assert.ok(candidates.includes(existing) && present(existing), `${existing} is not an existing denyWrite path`);
  assert.ok(!manifest.includes(existing), `${existing} existed and is listed`);
  for (const omitted of ['commondir', 'config.worktree', 'objects/info/http-alternates']) {
    assert.ok(!manifest.includes(`${f.clone}/.git/${omitted}`), `${omitted} is listed`);
  }

  // The Edit side: no rule names the clone's omitted trio, exact or by a `*` rule; its kept rows stay.
  const deny = profile.permissions.deny.filter((e) => typeof e === 'string');
  const clones = [...new Set([f.clone, realpathSync(f.clone)])];
  for (const omitted of ['commondir', 'config.worktree', 'objects/info/http-alternates']) {
    for (const clone of clones) {
      const named = deny.filter((rule) => editRuleCovers(rule, `${clone}/.git/${omitted}`));
      assert.deepEqual(named, [], `a deny rule names ${clone}/.git/${omitted}`);
    }
  }
  for (const rule of [`Edit(/${f.clone}/.git/config)`, `Edit(/${f.clone}/.git/hooks/**)`, `Edit(/${f.clone}/.git/objects/info/alternates)`]) {
    assert.ok(deny.includes(rule), `${rule} is not in deny`);
  }
  for (const kept of ['/.git/config)', '/.git/hooks/**)', '/.git/objects/info/alternates)']) {
    assert.ok(deny.some((rule) => rule.includes('*') && rule.endsWith(kept)), `no glob rule ending ${kept} is in deny`);
  }
});

/**
 * Whether the `Edit(/<p>)` or `Edit(/<p>/**)` rule `rule` reaches `path`: `<p>` equal to it, or a `*`
 * in `<p>` matching one segment's run of characters.
 */
function editRuleCovers(rule, path) {
  if (!rule.startsWith('Edit(/') || !rule.endsWith(')')) return false;
  let inner = rule.slice('Edit(/'.length, -1);
  if (inner.endsWith('/**')) inner = inner.slice(0, -3);
  const pattern = inner
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${pattern}$`).test(path);
}

test("a launch-recorded leftover at a sibling's .git/commondir is swept by the next pass-start sweep", async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  await makeOtherSibling(t, f);

  await f.drop();
  await f.tick({}, { placeholderHost: true });
  const settings = f.settingsArg();
  assert.ok(settings, `the stub was never called:\n${f.watcherLog()}`);
  const path = `${otherAsGlobbed(JSON.parse(readFileSync(settings, 'utf8')))}/.git/commondir`;
  const manifest = readFileSync(await f.manifestFile(), 'utf8').split('\n');
  assert.ok(manifest.includes(path), `${path} is not in the manifest:\n${manifest.join('\n')}`);
  await plantLeftover(path);

  await f.tick({}, { placeholderHost: true });

  const log = f.watcherLog();
  assert.equal(present(path), false, `the leftover is still there:\n${log}`);
  assert.ok(log.includes(`placeholder sweep: removed ${path}`), log);
});

test('a second queued run is deferred at cap 1, with the bubblewrap host line logged once', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await f.drop();
  await f.drop(SECOND_BRANCH);
  await f.tick({ MAX_PARALLEL_RUNS: '5' }, { placeholderHost: true, timeoutMs: scaleBound(120_000) });

  assert.equal(f.prompts().length, 1, `more than one run launched:\n${f.watcherLog()}`);
  const log = f.watcherLog();
  assert.match(log, /at the cap \(1\/1 runs\) — deferring '(feat_x|feat_y)' \(leaving it in the inbox\)/);
  assert.equal(log.split('\n').filter((l) => l.includes(CLAMP_LINE)).length, 1, log);
  assert.equal(readdirSync(f.inbox).filter((n) => n.endsWith('_task_prompt.md')).length, 1);
});

test('status reports the enforced cap on a placeholder host, after the keep-awake line', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  const lines = await f.statusLines(1);
  const at = lines.findIndex((l) => l.startsWith('tunables: '));
  assert.ok(at >= 0, lines.join('\n'));
  assert.ok(lines[at].startsWith('tunables: MAX_PARALLEL_RUNS=1 '), lines[at]);
  assert.ok(lines[at + 1].startsWith('keep-awake: '), lines[at + 1]);
  assert.equal(lines[at + 2], 'cap: 1 (MAX_PARALLEL_RUNS=5 clamped on a bubblewrap host; docs/cli.md §6)');
});

test('with the seam off no manifest is written, two runs launch, and status prints the resolved cap', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await f.drop();
  await f.drop(SECOND_BRANCH);
  await f.tick({ MAX_PARALLEL_RUNS: '5' }, { timeoutMs: scaleBound(120_000) });

  assert.equal(f.prompts().length, 2, `two runs did not launch:\n${f.watcherLog()}`);
  assert.ok(!f.watcherLog().includes(CLAMP_LINE), f.watcherLog());
  for (const branch of [f.branch, SECOND_BRANCH]) {
    assert.ok(existsSync(await f.profileFile(branch)), `no per-run profile for ${branch}`);
    assert.ok(!existsSync(await f.manifestFile(branch)), `a manifest was written for ${branch}`);
  }

  const lines = await f.statusLines(0);
  const at = lines.findIndex((l) => l.startsWith('tunables: '));
  assert.ok(lines[at].startsWith('tunables: MAX_PARALLEL_RUNS=5 '), lines[at]);
  assert.ok(lines[at + 1].startsWith('keep-awake: '), lines[at + 1]);
  assert.deepEqual(lines.filter((l) => l.startsWith('cap: ')), []);
});

// ---------------------------------------------------------------------------------------------
// The sweep.
// ---------------------------------------------------------------------------------------------

/** A pass that sources the watcher, installs the seam answering `host`, plants the leftover, ticks. */
async function plantedLaunch(f, host) {
  await f.recordAbsent(f.scriptsGit);
  await f.drop();
  const script = ['. "$1" status >/dev/null', probes(host), ': > "$2" && chmod 444 "$2"', 'tick; wait'].join('\n');
  await f.pass(script, [f.scriptsGit]);
}

/**
 * Drop, launch and hang a session, run `plant` while it hangs, then back-date its logs and take a
 * second pass with the stall tunables lowered — the seam answering `host` in both passes.
 */
async function stalledPass(t, f, host, plant) {
  const rec = join(f.dir, 'watcher-test');
  await f.setStub(HUNG_BODY);
  await f.drop();
  const logPath = join(f.dir, STATE_DIR, 'autonomous_logs', `${f.branch}.log`);
  const script = [
    '. "$1" status >/dev/null',
    probes(host),
    'tick',
    'until [ -e "$2" ]; do sleep 0.1; done',
    'touch -t 202001010000 "$3" "$4"',
    'tick',
    'wait',
  ].join('\n');
  const env = f.watcherEnv({
    REC: rec,
    REGISTRY: join(f.dir, REGISTRY_PATH),
    STALL_CHECK_ENABLED: '1',
    STALL_WARN_SECS: '1',
    STALL_KILL_SECS: '2',
    STALL_BUSY_CPU_PCT: '100000',
  });
  const argv = ['-c', script, '_', f.watcherPath, join(rec, 'silent'), logPath, logPath.replace(/\.log$/, '.stream.jsonl')];
  let settled = null;
  const running = runBash(f.dir, argv, env, { timeoutMs: STALL_TIMEOUT_MS, signal: t.signal }).then((result) => {
    settled = result;
    return result;
  });
  const deadline = Date.now() + HUNG_WAIT_MS;
  while (!existsSync(join(rec, 'hung'))) {
    if (settled !== null) assert.fail(`the run ended before the session hung\n${settled.stdout}\n${settled.stderr}\n${f.watcherLog()}`);
    assert.ok(Date.now() < deadline, `the session did not hang within ${HUNG_WAIT_MS} ms\n${f.watcherLog()}`);
    await delay(100);
  }
  await plant();
  await writeFile(join(rec, 'go'), '', 'utf8');
  const result = await running;
  assert.equal(result.status, 0, `the stalled pass exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  const snapshot = join(rec, 'resumed-registry.json');
  return existsSync(snapshot) ? JSON.parse(readFileSync(snapshot, 'utf8')).runs[f.branch] : null;
}

/** A recorded empty 0444 `<clone>/.git/commondir`, planted while the session hangs. */
async function plantCommondir(f) {
  const path = join(f.clone, '.git', 'commondir');
  await f.recordAbsent(path);
  await plantLeftover(path);
  return path;
}

test('(1) a recorded leftover <scriptsDir>/.git is swept at the pass start and the drop launches', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await plantedLaunch(f, 1);

  const log = f.watcherLog();
  assert.equal(f.prompts().length, 1, `the drop did not launch:\n${log}`);
  assert.equal(f.record().copy_kind, 'clone', log);
  assert.equal(f.record().worktree, f.clone, log);
  assert.equal(present(f.scriptsGit), false, `the leftover is still there:\n${log}`);
  assert.ok(log.includes(`placeholder sweep: removed ${f.scriptsGit}`), log);
});

test('(2) a recorded leftover .git/commondir is kept while its run is live and swept after the watchdog kill', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  let path;

  const resumed = await stalledPass(t, f, 1, async () => {
    path = await plantCommondir(f);
  });

  const log = f.watcherLog();
  assert.notEqual(resumed, null, `the session was not relaunched:\n${log}`);
  assert.equal(resumed.status, 'running', log);
  assert.equal(resumed.stall_restarts, '1', log);
  assert.equal(present(path), false, log);
  const lines = log.split('\n');
  const kill = lines.findIndex((l) => l.includes(`stall-watchdog: '${f.branch}' is hung`));
  const removed = lines.findIndex((l) => l.includes(`placeholder sweep: removed ${path}`));
  assert.ok(kill >= 0 && removed > kill, `the sweep did not follow the kill:\n${log}`);
  assert.ok(!log.includes('placeholder sweep: skipped'), `the pass-start skip was not quiet:\n${log}`);
});

test('(3) a recorded leftover <scriptsDir>/.git does not refuse the watcher start: it is swept there', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  await f.recordAbsent(f.scriptsGit);
  await plantLeftover(f.scriptsGit);

  const result = await runBash(f.dir, [f.watcherPath, 'tick'], f.watcherEnv(), { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(present(f.scriptsGit), false, result.stderr);
  assert.ok(result.stderr.includes(`autonomous-watcher.sh: placeholder sweep at start: removed ${f.scriptsGit}`), result.stderr);
  assert.ok(f.watcherLog().includes('placeholder sweep at start: removed 1 path(s)'), f.watcherLog());
});

test('(4) an unlisted leftover <scriptsDir>/.git is kept and the watcher refuses to start as today', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  await f.recordAbsent(join(f.dir, 'never-planted'));
  await plantLeftover(f.scriptsGit);

  const result = await runBash(f.dir, [f.watcherPath, 'tick'], f.watcherEnv(), { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal });

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.ok(result.stderr.includes(START_REFUSAL), result.stderr);
  const stat = statSync(f.scriptsGit);
  assert.equal(stat.size, 0);
  assert.equal(stat.mode & 0o777, 0o444);
});

test('hr_main_checkout_past_leftovers_nogit passes over a leftover <scriptsDir>/.git, and over nothing else', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  const scripts = join(f.dir, INIT_SCRIPTS_DIR);
  const walk = () =>
    runBash(f.dir, ['-c', '. "$1"; hr_main_checkout_past_leftovers_nogit "$2"', '_', join(f.dir, LIB_PATH), scripts], {}, {
      timeoutMs: TICK_TIMEOUT_MS,
      signal: t.signal,
    });

  await plantLeftover(f.scriptsGit);
  const past = await walk();
  assert.equal(past.status, 0, past.stderr);
  assert.equal(past.stdout, `${realpathSync(f.dir)}\n`);

  await rm(f.scriptsGit, { force: true });
  await writeFile(f.scriptsGit, '', { mode: 0o644 });
  await chmod(f.scriptsGit, 0o644);
  const writable = await walk();
  assert.deepEqual([writable.status, writable.stdout], [1, '']);

  await rm(f.scriptsGit, { force: true });
  await symlink(join(f.dir, '.git'), f.scriptsGit);
  const linked = await walk();
  assert.deepEqual([linked.status, linked.stdout], [1, '']);
});

test('(5) a recorded .git/commondir with content is kept and the parked resume is refused by the launch check', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await f.drop();
  await f.tick({}, { placeholderHost: true });
  assert.equal(f.prompts().length, 1, `the first launch did not run:\n${f.watcherLog()}`);
  const registry = f.registry();
  registry.runs[f.branch].status = 'parked';
  registry.runs[f.branch].pid = '';
  await f.writeRegistry(registry);
  const clar = join(f.clone, STATE_DIR, 'clarifications', f.branch);
  await runBash(f.clone, ['-c', 'mkdir -p "$1" && printf "## Q1\\n" > "$1/question_1.md" && printf "a1\\n" > "$1/answer_1.md"', '_', clar]);
  const path = join(f.clone, '.git', 'commondir');
  await f.recordAbsent(path);
  await writeFile(path, '../../elsewhere/.git\n', 'utf8');
  await chmod(path, 0o444);

  await f.tick({}, { placeholderHost: true });

  const log = f.watcherLog();
  assert.ok(log.includes(`placeholder sweep: kept ${path}: has content`), log);
  assert.equal(readFileSync(path, 'utf8'), '../../elsewhere/.git\n');
  assert.equal(f.prompts().length, 1, `the planted clone was launched:\n${log}`);
  assert.equal(f.record().status, 'failed', log);
  assert.ok(log.includes(`not launching '${f.branch}': the run copy failed its trust check before launch: `), log);
});

test("(6) with another run live the inbox pass's sweep is skipped, logged, and the leftover kept", async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  const live = spawn('sleep', ['300'], { stdio: 'ignore' });
  t.after(() => live.kill('SIGKILL'));
  await f.writeRegistry({ runs: { [SECOND_BRANCH]: { status: 'running', pid: String(live.pid), engine: 'task' } } });
  await f.recordAbsent(f.scriptsGit);
  await f.drop();

  const script = [
    '. "$1" status >/dev/null',
    probes(1),
    ': > "$2" && chmod 444 "$2"',
    'RUN_CAP=5',
    'process_inbox_file "$3"',
    'wait',
  ].join('\n');
  await f.pass(script, [f.scriptsGit, join(f.inbox, `${f.branch}_task_prompt.md`)]);

  const log = f.watcherLog();
  assert.ok(log.includes('placeholder sweep: skipped, 1 run(s) of this repository live'), log);
  assert.equal(present(f.scriptsGit), true, log);
  assert.equal(f.prompts().length, 0, log);
});

test('(7) with the seam off the recorded leftovers of cases 1 and 2 are left in place', async (t) => {
  await t.test('the fresh launch', async (st) => {
    const f = await adoptedFixture(st);
    if (f === null) return;

    await plantedLaunch(f, 0);

    const log = f.watcherLog();
    assert.equal(present(f.scriptsGit), true, log);
    assert.equal(f.prompts().length, 0, log);
    assert.ok(!log.includes('placeholder sweep'), log);
  });

  await t.test('the stall-watchdog resume', async (st) => {
    const f = await adoptedFixture(st);
    if (f === null) return;
    let path;

    const resumed = await stalledPass(st, f, 0, async () => {
      path = await plantCommondir(f);
    });

    const log = f.watcherLog();
    assert.equal(resumed, null, `the session was relaunched:\n${log}`);
    assert.equal(present(path), true, log);
    assert.equal(f.record().status, 'failed', log);
    assert.ok(!log.includes('placeholder sweep'), log);
  });
});

// ---------------------------------------------------------------------------------------------
// Job mode.
// ---------------------------------------------------------------------------------------------

/** The manifest directory `hr_job_absent_file` names under `RUNNER_TEMP`. */
const JOB_MANIFEST_DIR = 'autonomous-sdlc-harness-placeholders';

/** `gh`: `run list` answers no runs, every other call succeeds silently. */
const GH_STUB = '#!/usr/bin/env bash\ncase "$*" in "run list"*) printf "[]" ;; esac\nexit 0\n';

/** A session that plants each path in `$PLANT` (colon-separated) as `PLANT_BODY` with mode 0444, then exits 2. */
const PLANT_AND_CRASH = [
  'IFS=: read -r -a plant <<< "$PLANT"',
  'for p in "${plant[@]}"; do printf "%s" "${PLANT_BODY-}" > "$p"; chmod 444 "$p"; done',
  'exit 2',
].join('\n');

/**
 * An adopted fixture checked out on the run branch, as a job's checkout is, with `npx` and `gh`
 * stubbed and a `RUNNER_TEMP` beside the checkout, outside every root the session may write.
 *
 * @param {import('node:test').TestContext} t
 */
async function jobFixture(t) {
  const f = await adoptedFixture(t);
  if (f === null) return null;
  const config = JSON.parse(readFileSync(join(f.dir, 'harness.config.json'), 'utf8'));
  const defaultCommit = (await runGit(f.dir, ['rev-parse', 'HEAD'])).stdout.trim();
  await runGit(f.dir, ['checkout', '--quiet', '-b', f.branch]);

  const rec = join(f.dir, 'watcher-test');
  const bin = join(rec, 'bin');
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, 'npx'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });
  await writeFile(join(rec, 'gh'), GH_STUB, { mode: 0o755 });
  const runnerTemp = `${f.dir}-runner-temp`;
  t.after(() => rm(runnerTemp, { recursive: true, force: true }));
  await mkdir(runnerTemp);
  const manifestDir = join(runnerTemp, JOB_MANIFEST_DIR);
  const settingsLocal = join(f.dir, '.claude', 'settings.local.json');

  /**
   * One `run_job` of the branch with the seam answering `host`. With `plant`, the session hangs
   * until `plant` has run (HUNG_BODY) and the stall watchdog is on; otherwise the session body is
   * whatever the case set.
   */
  async function job(host, env = {}, plant = null) {
    const script = ['. "$1" status >/dev/null', 'job_mode_enter', probes(host), 'run_job "$2" task none'].join('\n');
    const jobEnv = f.watcherEnv({
      HARNESS_JOB_MODE: '1',
      HARNESS_INPUT_CHAIN: '0',
      HARNESS_REMOTE_SLUG: '',
      HARNESS_JOB_STARTED_EPOCH: '',
      HARNESS_JOB_DEADLINE_EPOCH: '',
      RUNNER_ENVIRONMENT: '',
      REMOTE_SELF_PAUSE_AFTER_SECS: '',
      GITHUB_RUN_ID: '',
      GITHUB_REPOSITORY: '',
      GITHUB_SERVER_URL: '',
      RUNNER_TEMP: runnerTemp,
      POLL_INTERVAL_SECS: '1',
      REMOTE_CONTROL_POLL_SECS: '1',
      REMOTE_AUTO_RESUME_MAX: '0',
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
      HARNESS_GH_CLI: join(rec, 'gh'),
      HARNESS_CLI_VERSION: '0.0.0',
      HARNESS_GITHUB_DEFAULT_BRANCH: config.defaultBranch,
      HARNESS_GITHUB_DEFAULT_COMMIT: defaultCommit,
      HARNESS_DEFAULT_BRANCH_COMMIT: defaultCommit,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      REC: rec,
      REGISTRY: join(f.dir, REGISTRY_PATH),
      ...(plant === null
        ? {}
        : { STALL_CHECK_ENABLED: '1', STALL_WARN_SECS: '1', STALL_KILL_SECS: '2', STALL_BUSY_CPU_PCT: '100000' }),
      ...env,
    });
    let settled = null;
    const running = runBash(f.dir, ['-c', script, '_', f.watcherPath, f.branch], jobEnv, {
      timeoutMs: STALL_TIMEOUT_MS,
      signal: t.signal,
    }).then((result) => {
      settled = result;
      return result;
    });
    if (plant !== null) {
      const deadline = Date.now() + HUNG_WAIT_MS;
      while (!existsSync(join(rec, 'hung'))) {
        if (settled !== null) assert.fail(`the job ended before the session hung\n${settled.stdout}\n${settled.stderr}\n${f.watcherLog()}`);
        assert.ok(Date.now() < deadline, `the session did not hang within ${HUNG_WAIT_MS} ms\n${f.watcherLog()}`);
        await delay(100);
      }
      await plant();
      await writeFile(join(rec, 'go'), '', 'utf8');
    }
    const result = await running;
    assert.equal(result.status, 0, `the job exited ${result.status}\n${result.stdout}\n${result.stderr}\n${f.watcherLog()}`);
    return result;
  }

  return {
    ...f,
    rec,
    runnerTemp,
    manifestDir,
    manifest: join(manifestDir, `${f.branch}.absent`),
    settingsLocal,
    leftovers: [f.scriptsGit, settingsLocal],
    job,
    /** The manifest's line naming the same file as `path`: the profile may spell the checkout canonically. */
    manifestLine(path) {
      const lines = readFileSync(join(manifestDir, `${f.branch}.absent`), 'utf8').split('\n').filter(Boolean);
      const dir = realpathSync(dirname(path));
      return lines.find((l) => basename(l) === basename(path) && existsSync(dirname(l)) && realpathSync(dirname(l)) === dir);
    },
  };
}

test('job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  await f.setStub(HUNG_BODY);
  const lines = [];

  await f.job(1, {}, async () => {
    assert.ok(existsSync(f.manifest), `no manifest at ${f.manifest}:\n${f.watcherLog()}`);
    for (const path of f.leftovers) {
      const line = f.manifestLine(path);
      assert.ok(line, `${path} is not in the manifest:\n${readFileSync(f.manifest, 'utf8')}`);
      lines.push(line);
      await plantLeftover(path);
    }
  });

  const log = f.watcherLog();
  for (const path of f.leftovers) assert.equal(present(path), false, `${path} is still there:\n${log}`);
  for (const line of lines) assert.ok(log.includes(`placeholder sweep: removed ${line}`), log);
  const resumed = existsSync(join(f.rec, 'resumed-registry.json'))
    ? JSON.parse(readFileSync(join(f.rec, 'resumed-registry.json'), 'utf8')).runs[f.branch]
    : null;
  assert.notEqual(resumed, null, `the session was not relaunched:\n${log}`);
  assert.equal(resumed.stall_restarts, '1', log);
  assert.equal(f.prompts().length, 2, log);
  assert.match(f.prompts()[1], /This is a RESUME/, f.prompts()[1]);
  assert.ok(!log.includes('the reset was refused'), log);
  assert.equal(existsSync(join(f.dir, 'home', '.local', 'state')), false, 'job mode wrote under XDG_STATE_HOME');
});

test('job: (2) a stall the watchdog gives up on leaves no leftover, and the wrapper anchor resolves after the job', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  await f.setStub(HUNG_BODY);

  await f.job(1, { STALL_MAX_RESTARTS: '0' }, async () => {
    for (const path of f.leftovers) await plantLeftover(path);
  });

  const log = f.watcherLog();
  assert.equal(f.record().status, 'failed', log);
  for (const path of f.leftovers) assert.equal(present(path), false, `${path} is still there:\n${log}`);
  const anchor = await runBash(
    f.dir,
    ['-c', '. "$1"; hr_wrapper_main_of "$2"', '_', join(f.dir, LIB_PATH), join(f.dir, INIT_SCRIPTS_DIR)],
    {},
    { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
  );
  assert.equal(anchor.status, 0, anchor.stderr);
  assert.equal(realpathSync(anchor.stdout.trim()), realpathSync(f.dir));
});

test("job: (2b) a crashed session's leftovers are swept at the job's exit, ahead of the push step", async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  await f.setStub(PLANT_AND_CRASH);

  await f.job(1, { PLANT: f.leftovers.join(':') });

  const log = f.watcherLog();
  assert.equal(f.prompts().length, 1, log);
  assert.equal(f.record().status, 'failed', log);
  for (const path of f.leftovers) assert.equal(present(path), false, `${path} is still there:\n${log}`);
  assert.equal(log.split('\n').filter((l) => l.includes('placeholder sweep: removed ')).length, 2, log);
});

test('job: (3) a recorded <scriptsDir>/.git with content is kept and logged', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  await f.setStub(PLANT_AND_CRASH);

  await f.job(1, { PLANT: f.scriptsGit, PLANT_BODY: 'gitdir: /elsewhere\n' });

  const log = f.watcherLog();
  const line = f.manifestLine(f.scriptsGit);
  assert.ok(line, readFileSync(f.manifest, 'utf8'));
  assert.ok(log.includes(`placeholder sweep: kept ${line}: has content`), log);
  assert.equal(readFileSync(f.scriptsGit, 'utf8'), 'gitdir: /elsewhere\n');
});

test('job: (4) with the seam off no manifest is written under RUNNER_TEMP and the leftovers stay', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  await f.setStub(PLANT_AND_CRASH);

  await f.job(0, { PLANT: f.leftovers.join(':') });

  const log = f.watcherLog();
  assert.equal(f.prompts().length, 1, log);
  assert.equal(existsSync(f.manifestDir), false, `a manifest directory was written:\n${log}`);
  for (const path of f.leftovers) assert.equal(present(path), true, `${path} was removed:\n${log}`);
  assert.ok(!log.includes('placeholder sweep'), log);
});

test('job: (5) with RUNNER_TEMP unset the job launches, logs that it has no manifest path, and writes none', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;

  await f.job(1, { RUNNER_TEMP: '' });

  const log = f.watcherLog();
  assert.equal(f.prompts().length, 1, log);
  assert.ok(log.includes(`placeholder manifest: no path for '${f.branch}' — the next sweep removes nothing for this session`), log);
  assert.equal(existsSync(f.manifestDir), false, log);
});

// ---------------------------------------------------------------------------------------------
// `job-sweep`: the workflow's post-session sweep, after a watcher killed with its session. Not
// probe-gated, so no case installs the seam.
// ---------------------------------------------------------------------------------------------

/** A pid that answered once and no longer does: a process spawned and reaped. */
async function deadPid() {
  const child = spawn('true', [], { stdio: 'ignore' });
  await new Promise((resolve) => child.once('exit', resolve));
  return String(child.pid);
}

/**
 * A job fixture whose `RUNNER_TEMP` manifest for the branch records the paths `pick` names, each
 * still absent, and whose registry holds the branch `running` under `pid`, as a killed job's does.
 *
 * @param {import('node:test').TestContext} t
 * @param {string} pid
 * @param {(f: any) => string[]} pick
 */
async function killedJobFixture(t, pid, pick) {
  const f = await jobFixture(t);
  if (f === null) return null;
  const paths = pick(f);
  const written = await runBash(
    f.dir,
    [
      '-c',
      '. "$1"; m="$(hr_job_absent_file "$2")" || exit 1; shift 2; hr_placeholder_manifest_write "$m" "$@"',
      '_',
      join(f.dir, LIB_PATH),
      f.branch,
      ...paths,
    ],
    f.watcherEnv({ RUNNER_TEMP: f.runnerTemp }),
    { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
  );
  assert.equal(written.status, 0, written.stderr);
  assert.deepEqual(readFileSync(f.manifest, 'utf8').split('\n').filter((l) => l !== ''), paths);
  await f.writeRegistry({ runs: { [f.branch]: { status: 'running', pid, engine: 'task' } } });
  return {
    ...f,
    /** `autonomous-watcher.sh job-sweep <branch>` in job mode, `env` over the job environment. */
    sweep: (env = {}) =>
      runBash(
        f.dir,
        [f.watcherPath, 'job-sweep', f.branch],
        f.watcherEnv({ HARNESS_JOB_MODE: '1', RUNNER_TEMP: f.runnerTemp, ...env }),
        { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
      ),
  };
}

/** A live process for a `running` record's pid, killed when the case ends. */
function livePid(t) {
  const live = spawn('sleep', ['300'], { stdio: 'ignore' });
  t.after(() => live.kill('SIGKILL'));
  return String(live.pid);
}

test("job-sweep: (1) a killed job's recorded <scriptsDir>/.git is swept, and the wrapper anchor resolves", async (t) => {
  const f = await killedJobFixture(t, await deadPid(), (k) => [k.scriptsGit]);
  if (f === null) return;
  await plantLeftover(f.scriptsGit);

  const result = await f.sweep();

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(present(f.scriptsGit), false, result.stderr);
  assert.ok(result.stderr.includes(`autonomous-watcher.sh: placeholder sweep at start: removed ${f.scriptsGit}`), result.stderr);
  const anchor = await runBash(
    f.dir,
    ['-c', '. "$1"; hr_wrapper_main_of "$2"', '_', join(f.dir, LIB_PATH), join(f.dir, INIT_SCRIPTS_DIR)],
    {},
    { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
  );
  assert.equal(anchor.status, 0, anchor.stderr);
  assert.equal(realpathSync(anchor.stdout.trim()), realpathSync(f.dir));
});

test("job-sweep: (1b) a recorded leftover that does not stop git is swept by the entry's own pass", async (t) => {
  const f = await killedJobFixture(t, await deadPid(), (k) => [k.settingsLocal]);
  if (f === null) return;
  await plantLeftover(f.settingsLocal);

  const result = await f.sweep();

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(present(f.settingsLocal), false, f.watcherLog());
  assert.ok(f.watcherLog().includes(`placeholder sweep: removed ${f.settingsLocal}`), f.watcherLog());
});

test('job-sweep: (2) without HARNESS_JOB_MODE=1 it exits 2 and leaves the leftover', async (t) => {
  const f = await killedJobFixture(t, await deadPid(), (k) => [k.scriptsGit]);
  if (f === null) return;
  await plantLeftover(f.scriptsGit);

  const result = await f.sweep({ HARNESS_JOB_MODE: '' });

  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.ok(result.stderr.includes('autonomous-watcher.sh: job-sweep: refused: HARNESS_JOB_MODE is not 1'), result.stderr);
  assert.equal(present(f.scriptsGit), true, result.stderr);
});

test("job-sweep: (3) with the record's pid live a recorded leftover is kept", async (t) => {
  await t.test('<scriptsDir>/.git: kept, and the start refused', async (st) => {
    const f = await killedJobFixture(st, livePid(st), (k) => [k.scriptsGit]);
    if (f === null) return;
    await plantLeftover(f.scriptsGit);

    const result = await f.sweep();

    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.ok(result.stderr.includes(START_REFUSAL), result.stderr);
    assert.equal(present(f.scriptsGit), true, result.stderr);
  });

  await t.test('.claude/settings.local.json: kept, and the skip logged', async (st) => {
    const f = await killedJobFixture(st, livePid(st), (k) => [k.settingsLocal]);
    if (f === null) return;
    await plantLeftover(f.settingsLocal);

    const result = await f.sweep();

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(present(f.settingsLocal), true, f.watcherLog());
    assert.ok(f.watcherLog().includes('placeholder sweep: skipped, 1 run(s) of this repository live'), f.watcherLog());
  });
});

test('job-sweep: (4) a leftover no manifest lists is kept', async (t) => {
  const f = await killedJobFixture(t, await deadPid(), (k) => [join(k.dir, 'never-planted')]);
  if (f === null) return;
  await plantLeftover(f.scriptsGit);

  const result = await f.sweep();

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.ok(result.stderr.includes(START_REFUSAL), result.stderr);
  const stat = statSync(f.scriptsGit);
  assert.equal(stat.size, 0);
  assert.equal(stat.mode & 0o777, 0o444);
});

test('(8) a kept path is not logged by the quiet pass-start sweep', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;
  const path = join(f.dir, '.mcp.json');
  await f.recordAbsent(path);
  await writeFile(path, '{}\n', 'utf8');

  await f.tick({}, { placeholderHost: true });
  await f.tick({}, { placeholderHost: true });

  const log = f.watcherLog();
  assert.ok(!log.includes(`placeholder sweep: kept ${path}`), log);
  assert.equal(readFileSync(path, 'utf8'), '{}\n');
});
