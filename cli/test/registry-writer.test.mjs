/**
 * The run registry's writer, `hr_registry_set`, driven by many processes at once.
 *
 * **The rule these tests exist to enforce: every write any process makes to one registry record
 * survives every other concurrent write, and a pair written together is never seen apart.** The
 * registry is shared by every outer-loop script and by the watcher's own background subshell, so a
 * read-modify-write that is not serialized loses whichever write lands second — silently, since each
 * writer exits 0.
 *
 * The library is sourced the way `cli/test/outer-loop-scripts.test.mjs` → `libCall` sources it: out
 * of an `init`-wired fixture, so the copy under test is the one an adopter receives. That makes these
 * cases run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`.
 * Every registry lives in a directory of its own, so the lock directory and the writer's temp file
 * are the only things that could be left beside it.
 *
 * ## Three non-obvious choices
 *
 * 1. **Concurrency is real processes, started together with `Promise.all`.** A background subshell
 *    inside one `bash` would share its parent's `$$`, which is exactly the case the lock's per-call
 *    token exists for — but separate processes are the harder race and the one the watcher meets
 *    against the other scripts, so they are what case (a) measures.
 * 2. **Case (d) cannot be forced to lose, only given the chance.** Whether a reader's create lands
 *    after the writer's rename is scheduling, so it is repeated over several rounds; it proves the
 *    create never truncates only to the extent the rounds hit the window.
 * 3. **Case (e) gives many breakers one stale lock at once, but it does not show the race closed.**
 *    Whether two breakers interleave is scheduling, as in case (d), so a pass shows only that the
 *    rounds did not hit the window. The closure rests on the construction stated in the library's
 *    `THE RUN REGISTRY.` section: one breaker at a time judges the age again under the break mutex,
 *    and a re-taken lock is fresh. Case (f) covers that mutex's own staleness rule.
 */

import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, after, test } from 'node:test';

import { createFixture, runBash, runCli } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

/** The library's path under the default `scriptsDir` — the contract, spelled out once. */
const LIB_PATH = 'scripts/lib/harness-run-lib.sh';

/** Case (a)'s writer count — the task's floor of 24 separate processes. */
const WRITERS = 24;

/** Case (b)'s paired-write count, and so the reader's read count. */
const PAIR_WRITES = 40;

/** Case (d)'s reader count per round, and its round count (choice 2 in the header). */
const READERS = 24;
const CREATE_ROUNDS = 5;

/** The watcher-pair case's round count: each round races the usage gate's pair against a pause. */
const WATCHER_PAIR_ROUNDS = 25;

/** The stop-race case's round count, and the watcher writes raced against each round's `stop`. */
const STOP_RACE_ROUNDS = 10;
const STOP_RACE_WRITERS = 8;

/** A branch with a slash, so a record keyed on a path fragment would show. */
const BRANCH = 'feat/x';

let fixtureDir = '';
let cleanup = async () => {};
let registryCount = 0;

before(async () => {
  const fixture = await createFixture({
    files: {
      'package.json': {
        name: 'fixture-project',
        private: true,
        version: '0.0.0',
        scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
      },
      'README.md': '# fixture project\n',
    },
  });
  fixtureDir = fixture.dir;
  cleanup = fixture.cleanup;
  const init = await runCli(fixtureDir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
});

after(() => cleanup());

/** Source the written library, then run `script` with the remaining values as `$1`, `$2`, …. */
function libCall(script, args = []) {
  return runBash(fixtureDir, ['-c', `. "$1"; shift; ${script}`, '_', join(fixtureDir, LIB_PATH), ...args]);
}

/** A registry path in a directory of its own, which does not exist yet. */
function freshRegistry() {
  registryCount += 1;
  const dir = join(fixtureDir, `registry-${registryCount}`);
  mkdirSync(dir);
  return { dir, file: join(dir, 'registry.json') };
}

/** The parsed registry, asserted to be shaped `{"runs": {…}}`. */
function readRegistry(file) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(parsed), ['runs'], 'the registry file is not shaped {"runs": {…}}');
  return parsed;
}

/** Assert that nothing but the registry itself is left in its directory. */
function assertNothingLeftBeside(dir) {
  assert.deepEqual(readdirSync(dir), ['registry.json'], 'a lock directory or a temp file was left beside the registry');
}

test('(a) distinct keys written at once by separate processes all survive', async () => {
  const { dir, file } = freshRegistry();
  const init = await libCall('hr_registry_init "$1"', [file]);
  assert.equal(init.status, 0, `hr_registry_init exited ${init.status}: ${init.stderr}`);

  const results = await Promise.all(
    Array.from({ length: WRITERS }, (_, i) => libCall('hr_registry_set "$@"', [file, BRANCH, `key_${i}`, `v_${i}`])),
  );
  results.forEach((result, i) => assert.equal(result.status, 0, `writer ${i} exited ${result.status}: ${result.stderr}`));

  const record = readRegistry(file).runs[BRANCH];
  const missing = Array.from({ length: WRITERS }, (_, i) => i).filter((i) => record[`key_${i}`] !== `v_${i}`);
  assert.deepEqual(missing, [], `${missing.length} of ${WRITERS} concurrent writes were lost`);

  // The four-argument form round-trips exactly as it did before the multi-key form existed.
  const set = await libCall('hr_registry_set "$@" && hr_registry_get "$1" "$2" "$3"', [file, BRANCH, 'status', 'running']);
  assert.equal(set.status, 0, `the four-argument round-trip exited ${set.status}: ${set.stderr}`);
  assert.equal(set.stdout, 'running\n', 'hr_registry_get did not return the value hr_registry_set wrote');
  const stamped = readRegistry(file).runs[BRANCH];
  assert.equal(stamped.status, 'running');
  assert.equal(stamped.branch, BRANCH, 'the write did not stamp `branch`');
  assert.equal(typeof stamped.updated_at, 'string', 'the write did not stamp `updated_at`');
  assert.equal(stamped.key_0, 'v_0', 'a later write dropped an earlier key of the same record');
  assertNothingLeftBeside(dir);
});

test('(b) a pair written together is never seen apart by a concurrent reader', async () => {
  const { file } = freshRegistry();
  await libCall('hr_registry_set "$@"', [file, BRANCH, 'a', '0', 'b', '0']);

  const writer = libCall(
    'i=1; while [ "$i" -le "$2" ]; do hr_registry_set "$1" "$3" a "$i" b "$i" || exit 1; i=$((i + 1)); done',
    [file, String(PAIR_WRITES), BRANCH],
  );
  const reader = libCall(
    'i=1; while [ "$i" -le "$2" ]; do jq -c --arg b "$3" \'.runs[$b] // {} | [.a, .b]\' "$1" 2>/dev/null || echo ERR; i=$((i + 1)); done',
    [file, String(PAIR_WRITES), BRANCH],
  );
  const [written, read] = await Promise.all([writer, reader]);
  assert.equal(written.status, 0, `the paired writer exited ${written.status}: ${written.stderr}`);

  const reads = read.stdout.trim().split('\n');
  assert.equal(reads.length, PAIR_WRITES);
  const unreadable = reads.filter((line) => line === 'ERR');
  assert.deepEqual(unreadable, [], 'a reader saw a registry it could not parse');
  const split = reads.map((line) => JSON.parse(line)).filter(([a, b]) => a !== b);
  assert.deepEqual(split, [], 'a reader saw one half of a pair without the other');
  const record = readRegistry(file).runs[BRANCH];
  assert.equal(record.a, String(PAIR_WRITES));
  assert.equal(record.b, String(PAIR_WRITES));
});

test('(c) a stale lock is broken, and no lock directory is left behind', async () => {
  const { dir, file } = freshRegistry();
  const init = await libCall('hr_registry_init "$1"', [file]);
  assert.equal(init.status, 0, `hr_registry_init exited ${init.status}: ${init.stderr}`);
  const lock = `${file}.lock`;
  mkdirSync(lock);
  writeFileSync(join(lock, 'owner'), 'a-writer-that-crashed\n');
  const aged = await runBash(fixtureDir, ['-c', 'touch -t 200001010000 "$1"', '_', lock]);
  assert.equal(aged.status, 0, `touch -t exited ${aged.status}: ${aged.stderr}`);

  const set = await libCall('hr_registry_set "$@"', [file, BRANCH, 'status', 'running']);
  assert.equal(set.status, 0, `hr_registry_set exited ${set.status} past a stale lock: ${set.stderr}`);
  assert.equal(readRegistry(file).runs[BRANCH].status, 'running');
  assertNothingLeftBeside(dir);
});

test('(e) many writers arriving at one stale lock all survive, and no lock directory is left behind', async () => {
  const { dir, file } = freshRegistry();
  const init = await libCall('hr_registry_init "$1"', [file]);
  assert.equal(init.status, 0, `hr_registry_init exited ${init.status}: ${init.stderr}`);
  const lock = `${file}.lock`;
  mkdirSync(lock);
  writeFileSync(join(lock, 'owner'), 'a-writer-that-crashed\n');
  const aged = await runBash(fixtureDir, ['-c', 'touch -t 200001010000 "$1"', '_', lock]);
  assert.equal(aged.status, 0, `touch -t exited ${aged.status}: ${aged.stderr}`);

  const results = await Promise.all(
    Array.from({ length: WRITERS }, (_, i) => libCall('hr_registry_set "$@"', [file, BRANCH, `key_${i}`, `v_${i}`])),
  );
  results.forEach((result, i) => assert.equal(result.status, 0, `writer ${i} exited ${result.status}: ${result.stderr}`));

  const record = readRegistry(file).runs[BRANCH];
  const missing = Array.from({ length: WRITERS }, (_, i) => i).filter((i) => record[`key_${i}`] !== `v_${i}`);
  assert.deepEqual(missing, [], `${missing.length} of ${WRITERS} writes past one stale lock were lost`);
  assertNothingLeftBeside(dir);
});

test('(f) a break mutex left by a killed breaker is aged out, and the stale lock behind it is broken', async () => {
  const { dir, file } = freshRegistry();
  const init = await libCall('hr_registry_init "$1"', [file]);
  assert.equal(init.status, 0, `hr_registry_init exited ${init.status}: ${init.stderr}`);
  const lock = `${file}.lock`;
  mkdirSync(lock);
  writeFileSync(join(lock, 'owner'), 'a-writer-that-crashed\n');
  mkdirSync(`${lock}.break`);
  const aged = await runBash(fixtureDir, ['-c', 'touch -t 200001010000 "$1" "$2"', '_', lock, `${lock}.break`]);
  assert.equal(aged.status, 0, `touch -t exited ${aged.status}: ${aged.stderr}`);

  const set = await libCall('hr_registry_set "$@"', [file, BRANCH, 'status', 'running']);
  assert.equal(set.status, 0, `hr_registry_set exited ${set.status} past a stale break mutex: ${set.stderr}`);
  assert.equal(readRegistry(file).runs[BRANCH].status, 'running');
  assertNothingLeftBeside(dir);
});

test('(d) creating the registry never truncates one a concurrent writer just wrote', async () => {
  for (let round = 0; round < CREATE_ROUNDS; round += 1) {
    const { dir, file } = freshRegistry();
    const readers = Array.from({ length: READERS }, () => libCall('hr_registry_get "$@"', [file, BRANCH, 'status']));
    const results = await Promise.all([libCall('hr_registry_set "$@"', [file, BRANCH, 'status', 'running']), ...readers]);
    assert.equal(results[0].status, 0, `hr_registry_set exited ${results[0].status}: ${results[0].stderr}`);
    assert.equal(readRegistry(file).runs[BRANCH]?.status, 'running', `round ${round}: a reader's create truncated the write`);
    assertNothingLeftBeside(dir);
  }
});

test('an odd count of key/value arguments, or none, writes nothing', async () => {
  const { file } = freshRegistry();
  await libCall('hr_registry_set "$@"', [file, BRANCH, 'status', 'running']);
  const unchanged = readFileSync(file, 'utf8');

  for (const args of [[BRANCH], [BRANCH, 'a'], [BRANCH, 'a', '1', 'b']]) {
    const set = await libCall('hr_registry_set "$@"', [file, ...args]);
    assert.equal(set.status, 1, `hr_registry_set ${args.join(' ')} exited ${set.status}`);
    assert.equal(readFileSync(file, 'utf8'), unchanged, `hr_registry_set ${args.join(' ')} changed the registry`);
  }
});

test("the usage gate's paired write and a local pause classification both survive, every round", async (t) => {
  const fixture = await createWatcherFixture(t);
  if (fixture === null) return;
  const watcher = join(fixture.dir, 'scripts/autonomous-watcher.sh');
  const logPath = join(fixture.dir, 'sdlc-harness', 'autonomous_logs', `${fixture.branch}.log`);
  writeFileSync(join(fixture.dir, 'sdlc-harness', 'PAUSE_ACK'), '');
  const env = {
    AUTO_TAIL_TERMINAL: '0',
    USAGE_LANE_STATE_ENABLED: '0',
    USAGE_LANE_LOCK_ENABLED: '0',
    HOME: join(fixture.dir, 'home'),
    XDG_CONFIG_HOME: join(fixture.dir, 'home', '.config'),
    XDG_STATE_HOME: join(fixture.dir, 'home', '.local', 'state'),
  };
  // The watcher header's REPRO form: source the written watcher, then call one of its functions.
  const watcherCall = (script, args) =>
    runBash(fixture.dir, ['-c', `. "$1" status >/dev/null; shift; ${script}`, '_', watcher, ...args], env);

  for (let round = 0; round < WATCHER_PAIR_ROUNDS; round += 1) {
    await fixture.seedRecord({ status: 'running' });
    const resumeAt = String(2_000_000_000 + round);
    const [gate, classify] = await Promise.all([
      watcherCall('registry_set "$1" paused_by usage usage_resume_at "$2"', [fixture.branch, resumeAt]),
      watcherCall('classify_run_exit "$1" "$2" "$3" 0', [fixture.branch, fixture.dir, logPath]),
    ]);
    assert.equal(gate.status, 0, `round ${round}: the gate's write exited ${gate.status}: ${gate.stderr}`);
    assert.equal(classify.status, 0, `round ${round}: classify_run_exit exited ${classify.status}: ${classify.stderr}`);
    const record = fixture.record();
    assert.equal(record.status, 'paused', `round ${round}: the pause classification was lost`);
    assert.equal(record.paused_by, 'usage', `round ${round}: the gate's paused_by was lost`);
    assert.match(record.usage_resume_at ?? '', /^[0-9]+$/, `round ${round}: usage_resume_at is not numeric`);
  }
});

test("a remote-run.sh stop racing the watcher's writes loses neither, every round", async (t) => {
  const fixture = await createFixture({ files: { 'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } } } });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target: 'github-actions' };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  // A `gh` that accepts every call and lists no active run, in the style of `cli/test/remote-run.test.mjs` → `STUB`.
  const logsDir = join(dir, 'sdlc-harness', 'autonomous_logs');
  mkdirSync(logsDir, { recursive: true });
  const stub = join(dir, 'sdlc-harness', 'gh-stub');
  writeFileSync(stub, "#!/usr/bin/env node\nif (process.argv.slice(2).join(' ').startsWith('run list')) process.stdout.write('[]');\n", { mode: 0o755 });
  const registry = join(logsDir, 'registry.json');
  const env = {
    HARNESS_GH_CLI: stub,
    AUTO_TAIL_TERMINAL: '0',
    USAGE_LANE_STATE_ENABLED: '0',
    USAGE_LANE_LOCK_ENABLED: '0',
    HOME: join(dir, 'home'),
    XDG_CONFIG_HOME: join(dir, 'home', '.config'),
    XDG_STATE_HOME: join(dir, 'home', '.local', 'state'),
  };
  const watcher = join(dir, 'scripts/autonomous-watcher.sh');

  for (let round = 0; round < STOP_RACE_ROUNDS; round += 1) {
    writeFileSync(registry, `${JSON.stringify({ runs: { feat_x: { branch: 'feat_x', status: 'running' } } })}\n`);
    const [stop, ...writes] = await Promise.all([
      runBash(dir, ['scripts/remote-run.sh', 'stop', 'feat_x'], env),
      ...Array.from({ length: STOP_RACE_WRITERS }, (_, i) =>
        runBash(dir, ['-c', '. "$1" status >/dev/null; registry_set feat_x "$2" "$3"', '_', watcher, `key_${i}`, `v_${i}`], env)),
    ]);
    assert.equal(stop.status, 0, `round ${round}: stop exited ${stop.status}: ${stop.stderr}`);
    writes.forEach((w, i) => assert.equal(w.status, 0, `round ${round}: watcher write ${i} exited ${w.status}: ${w.stderr}`));
    const record = JSON.parse(readFileSync(registry, 'utf8')).runs.feat_x;
    assert.equal(record.status, 'failed', `round ${round}: the stop's status was lost`);
    assert.match(record.remote_stopped_at ?? '', /^[0-9]+$/, `round ${round}: remote_stopped_at is not numeric`);
    const missing = Array.from({ length: STOP_RACE_WRITERS }, (_, i) => i).filter((i) => record[`key_${i}`] !== `v_${i}`);
    assert.deepEqual(missing, [], `round ${round}: watcher writes were lost`);
  }
});
