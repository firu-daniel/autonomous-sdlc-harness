/**
 * The written watcher on a bubblewrap host — `hr_placeholder_host_probe_var` answering `1` through
 * the `tick` helper's `placeholderHost: true` seam — driven by `tick` passes of the `init`-written
 * `autonomous-watcher.sh` against a fixture, and by `print_status` called in a shell that sourced it.
 *
 * **The rule these tests exist to enforce: on a bubblewrap host the watcher launches no clone carrying
 * a planted trust file, records what was absent before each session, and runs, and reports, one run
 * at a time.** The last case holds that a host that is not one takes none of those arms.
 *
 * Every per-run profile and manifest lands under the fixture's own `XDG_STATE_HOME` (`watcherEnv`).
 */

import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import { DEFAULT_KEEP_AWAKE_PROBE, TICK_TIMEOUT_MS, createWatcherFixture } from './helpers/watcher.mjs';
import { scaleBound } from './helpers/timing.mjs';

const STATE_DIR = 'sdlc-harness';
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
const SECOND_BRANCH = 'feat_y';
const CLAMP_LINE =
  "bubblewrap host: at most one live run per repository (concurrent runs share the main checkout's sandbox placeholders; docs/cli.md §6)";

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
    registry: () => JSON.parse(readFileSync(join(w.dir, REGISTRY_PATH), 'utf8')),
    async writeRegistry(registry) {
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

test('after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

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
  const candidates = [
    ...profile.sandbox.filesystem.denyWrite.filter((p) => typeof p === 'string' && !p.includes('*')),
    `${f.clone}/.mcp.json`,
    `${f.dir}/${STATE_DIR}/.mcp.json`,
  ];
  assert.deepEqual(manifest, candidates.filter((p) => !present(p)));
  assert.ok(manifest.length > 0, 'the manifest is empty');
  assert.ok(manifest.includes(`${f.dir}/${STATE_DIR}/.mcp.json`), manifest.join('\n'));
  const existing = `${f.clone}/.git/config`;
  assert.ok(candidates.includes(existing) && present(existing), `${existing} is not an existing denyWrite path`);
  assert.ok(!manifest.includes(existing), `${existing} existed and is listed`);
  for (const omitted of ['commondir', 'config.worktree', 'objects/info/http-alternates']) {
    assert.ok(!manifest.includes(`${f.clone}/.git/${omitted}`), `${omitted} is listed`);
  }
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
