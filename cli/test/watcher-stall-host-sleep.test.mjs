/**
 * The written watcher's stall watchdog across a host sleep — `host_wake_pass` and the wake discount
 * in `check_stalled_runs` of the `init`-written `autonomous-watcher.sh` — driven pass by pass against
 * a hung session.
 *
 * **The rule this suite enforces: host-suspended time is never counted as a run's silence, and a run
 * that is silent while the host is awake is still killed.**
 *
 * One script launches the session without `wait`, then runs each later `tick` alone when the case
 * asks for it (`watcher-stall-reset-payloads.test.mjs` → `localStall`); it defines the sandbox and
 * keep-awake probe overrides itself, so no case starts a real holder. The stub writes its pid to
 * `hung` and sleeps until the `end` control file appears: alive and silent. A case back-dates both
 * liveness files with `touch -t`, as the watcher header's `a stall` REPRO row does, and writes the
 * `.host_last_tick` / `.host_woke_at` epochs itself. `STALL_MAX_RESTARTS=0` turns a kill into a
 * `failed` record with no reset or relaunch, so a case asserts the kill decision alone; the reset
 * path is `watcher-stall-reset-payloads`'s.
 *
 * Cases (a) and (c) are each other's perturbation: the same back-date, thresholds and hung stub,
 * differing only in the last-pass epoch — 4000 s ago in (a), 5 s ago in (c) — and (a) is not killed
 * while (c) is.
 *
 * Every ceiling here is scaled by `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`), and `session()`
 * waits for each pass under `TICK_TIMEOUT_MS`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { runBash, runGit } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import { createWatcherFixture, DEFAULT_KEEP_AWAKE_PROBE, DEFAULT_SANDBOX_PROBE, TICK_TIMEOUT_MS } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const INBOX = `${STATE_DIR}/autonomous_inbox`;
const LOGS = `${STATE_DIR}/autonomous_logs`;
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];

/** The default `waitFor` ceiling, scaled; a wait for a watcher pass takes `TICK_TIMEOUT_MS` instead. */
const WAIT_MS = scaleBound(30_000);
/**
 * Bounds the multi-pass session script, scaled: (a)(b)'s three 60 000 ms passes plus its polls. At
 * `timing.mjs`'s cap it stays below the suite's `--test-timeout` (choice 3).
 */
const SESSION_TIMEOUT_MS = scaleBound(240_000);
/** How far back a case dates the liveness files and, in (a), the last pass. */
const SLEPT_SECS = 4000;

const STALL_ENV = {
  STALL_CHECK_ENABLED: '1',
  STALL_WARN_SECS: '1',
  STALL_KILL_SECS: '60',
  STALL_WAKE_GAP_SECS: '60',
  POLL_INTERVAL_SECS: '15',
  STALL_BUSY_CPU_PCT: '100000',
  STALL_MAX_RESTARTS: '0',
};

const HOST_WAKE = 'host-wake: ';
const FROM_WAKE = "stall-watchdog: 'feat_x' silent ";
const FROM_WAKE_TAIL = ' — measuring silence from the wake';
const IS_HUNG = "stall-watchdog: 'feat_x' is hung (";
const GAVE_UP = /stall-watchdog: 'feat_x' -> failed \(stalled \d+s, exceeded 0 watchdog restarts\)/;

/** A shell single-quoted literal. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

const epoch = () => Math.floor(Date.now() / 1000);

/** `touch -t`'s local `[[CC]YY]MMDDhhmm[.SS]` for `secs` seconds ago. */
function touchStamp(secs) {
  const d = new Date(Date.now() - secs * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}.${p(d.getSeconds())}`;
}

/**
 * A watcher fixture adopted on `origin`'s default branch, with the hung stub set.
 *
 * @param {import('node:test').TestContext} t
 */
async function sleepFixture(t) {
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
  t.after(() => rm(`${w.dir}-${w.branch}`, { recursive: true, force: true }));

  const control = join(w.dir, 'watcher-test', 'control');
  const hungPath = join(control, 'hung');
  const endPath = join(control, 'end');
  const logs = join(w.dir, LOGS);
  await mkdir(control, { recursive: true });
  await w.setStub(
    [`printf '%s\\n' "$$" > ${shellQuote(hungPath)}`, `until [ -e ${shellQuote(endPath)} ]; do sleep 0.1; done`].join('\n'),
  );

  /** Poll `predicate` until it holds, failing with `label` and the watcher log past `budget` ms. */
  const waitFor = async (predicate, label, budget = WAIT_MS) => {
    const deadline = Date.now() + budget;
    for (;;) {
      let held = false;
      try {
        held = await predicate();
      } catch {
        // A registry or pid file read mid-write; ask again.
      }
      if (held) return;
      assert.ok(Date.now() < deadline, `${label} within ${budget} ms\n${w.watcherLog()}`);
      await delay(100);
    }
  };

  /** A live process, a zombie counted as gone. */
  const alive = async (pid) =>
    (
      await runBash(w.dir, ['-c', 'kill -0 "$1" 2>/dev/null || exit 1; case "$(ps -o stat= -p "$1")" in Z*) exit 1 ;; esac', '_', String(pid)])
    ).status === 0;

  const count = (needle) =>
    w
      .watcherLog()
      .split('\n')
      .filter((line) => line.includes(needle)).length;

  return {
    ...w,
    waitFor,
    alive,
    count,
    wakeNotes: () =>
      w
        .watcherLog()
        .split('\n')
        .filter((line) => line.includes(FROM_WAKE) && line.includes(FROM_WAKE_TAIL)).length,
    stubPid: () => readFileSync(hungPath, 'utf8').trim(),
    readState: (name) => (existsSync(join(logs, name)) ? readFileSync(join(logs, name), 'utf8') : null),
    writeState: (name, value) => writeFile(join(logs, name), `${value}\n`, 'utf8'),
    removeState: (name) => rm(join(logs, name), { force: true }),
    /** Back-date both halves of the run's liveness signal by {@link SLEPT_SECS}. */
    async backDate() {
      const result = await runBash(w.dir, [
        '-c',
        'touch -t "$1" "$2" "$3"',
        '_',
        touchStamp(SLEPT_SECS),
        join(logs, `${w.branch}.log`),
        join(logs, `${w.branch}.stream.jsonl`),
      ]);
      assert.equal(result.status, 0, `touch -t exited ${result.status}: ${result.stderr}`);
    },

    /**
     * Launch the hung session in pass 1 and return a handle: `next()` runs one more `tick` and
     * resolves once it has returned, `end()` ends the stub through the control file, then the script.
     */
    async session() {
      await writeFile(join(w.dir, INBOX, `${w.branch}_task_prompt.md`), 'do the thing\n', 'utf8');
      const script = [
        '. "$1" status >/dev/null',
        `hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,
        `hr_keep_awake_probe_var() {\n${DEFAULT_KEEP_AWAKE_PROBE}\n}`,
        'tick',
        ': > "$2/pass-1"',
        'n=2',
        'until [ -e "$2/finish" ]; do',
        '  if [ -e "$2/go-$n" ]; then tick; : > "$2/pass-$n"; n=$((n + 1)); fi',
        '  sleep 0.1',
        'done',
        'wait',
      ].join('\n');
      // Ends a session a failed case left running; the fixture's own cleanup may have run first.
      t.after(async () => {
        await writeFile(endPath, '', 'utf8').catch(() => {});
        await writeFile(join(control, 'finish'), '', 'utf8').catch(() => {});
      });
      let settled = null;
      const running = runBash(w.dir, ['-c', script, '_', w.watcherPath, control], w.watcherEnv(STALL_ENV), {
        timeoutMs: SESSION_TIMEOUT_MS,
        signal: t.signal,
      }).then((result) => {
        settled = result;
        return result;
      });
      const reached = (n) =>
        waitFor(() => {
          if (settled !== null) assert.fail(`the session script ended early\n${settled.stdout}\n${settled.stderr}`);
          return existsSync(join(control, `pass-${n}`));
        }, `pass ${n} did not return`, TICK_TIMEOUT_MS);
      await reached(1);
      await waitFor(
        () => existsSync(hungPath) && readFileSync(hungPath, 'utf8').trim() !== '',
        'the session did not hang',
        TICK_TIMEOUT_MS,
      );
      await waitFor(
        () => w.record().status === 'running' && Boolean(w.record().pid),
        'the record is not running with a pid',
        TICK_TIMEOUT_MS,
      );
      let n = 1;
      return {
        async next() {
          n += 1;
          await writeFile(join(control, `go-${n}`), '', 'utf8');
          await reached(n);
        },
        async end() {
          await writeFile(endPath, '', 'utf8');
          await writeFile(join(control, 'finish'), '', 'utf8');
          const result = await running;
          assert.equal(result.status, 0, `the session script exited ${result.status}\n${result.stdout}\n${result.stderr}`);
        },
      };
    },
  };
}

/** The kill decision on one pass: the `is hung` line, the record given up, the session gone. */
async function assertKilled(f, pid) {
  assert.equal(f.count(IS_HUNG), 1, f.watcherLog());
  assert.match(f.watcherLog(), GAVE_UP);
  assert.equal(f.record().status, 'failed', f.watcherLog());
  await f.waitFor(async () => !(await f.alive(pid)), `the recorded pid ${pid} is still alive`);
}

/** No stub process outlives the case. */
async function assertStubGone(f, stub) {
  await f.waitFor(async () => !(await f.alive(stub)), `the stub ${stub} is still alive`);
}

test('(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills', async (t) => {
  const f = await sleepFixture(t);
  if (f === null) return;

  const session = await f.session();
  const pid = f.record().pid;
  const stub = f.stubPid();

  // (a) The first pass after a 4000 s sleep.
  await f.backDate();
  await f.writeState('.host_last_tick', epoch() - SLEPT_SECS);
  await f.removeState('.host_woke_at');
  const before = epoch();
  await session.next();
  const after = epoch();

  assert.equal(f.count(HOST_WAKE), 1, f.watcherLog());
  assert.equal(f.wakeNotes(), 1, f.watcherLog());
  assert.equal(f.count(IS_HUNG), 0, f.watcherLog());
  const record = f.record();
  assert.equal(record.status, 'running', f.watcherLog());
  assert.equal(record.stall_killing ?? '', '');
  assert.ok(await f.alive(pid), `the recorded pid ${pid} is not alive`);
  const woke = Number(f.readState('.host_woke_at'));
  assert.ok(woke >= before && woke <= after, `.host_woke_at ${woke} is outside [${before}, ${after}]`);
  const ticked = Number(f.readState('.host_last_tick'));
  assert.ok(ticked >= before && ticked <= after, `.host_last_tick ${ticked} is outside [${before}, ${after}]`);

  // (b) Still silent one full STALL_KILL_SECS after the wake, with no new gap.
  await f.backDate();
  await f.writeState('.host_woke_at', epoch() - 120);
  await f.writeState('.host_last_tick', epoch() - 5);
  await session.next();

  await assertKilled(f, pid);
  assert.equal(f.count(HOST_WAKE), 1, f.watcherLog());

  await session.end();
  await assertStubGone(f, stub);
});

test('(c) a genuinely hung run with no host sleep is killed on the pass, as before', async (t) => {
  const f = await sleepFixture(t);
  if (f === null) return;

  const session = await f.session();
  const pid = f.record().pid;
  const stub = f.stubPid();

  await f.backDate();
  await f.writeState('.host_last_tick', epoch() - 5);
  await session.next();

  assert.equal(f.count(HOST_WAKE), 0, f.watcherLog());
  assert.equal(f.wakeNotes(), 0, f.watcherLog());
  await assertKilled(f, pid);

  await session.end();
  await assertStubGone(f, stub);
});

test('(d) a missing or non-integer last-pass file records no wake and never defers a kill', async (t) => {
  const f = await sleepFixture(t);
  if (f === null) return;

  // The first pass ever: no `.host_last_tick` yet.
  assert.equal(f.readState('.host_last_tick'), null);
  await f.tick(STALL_ENV);
  assert.match(f.readState('.host_last_tick') ?? '', /^\d+\n$/);
  assert.equal(f.count(HOST_WAKE), 0, f.watcherLog());

  // A file that is not an epoch.
  await f.writeState('.host_last_tick', 'garbage');
  await f.tick(STALL_ENV);
  assert.match(f.readState('.host_last_tick') ?? '', /^\d+\n$/);
  assert.equal(f.count(HOST_WAKE), 0, f.watcherLog());

  // Neither state file readable as an epoch: (c)'s back-date is still killed.
  const session = await f.session();
  const pid = f.record().pid;
  const stub = f.stubPid();
  await f.backDate();
  await f.writeState('.host_last_tick', 'garbage');
  await f.writeState('.host_woke_at', 'garbage');
  await session.next();

  assert.equal(f.count(HOST_WAKE), 0, f.watcherLog());
  assert.equal(f.wakeNotes(), 0, f.watcherLog());
  await assertKilled(f, pid);

  await session.end();
  await assertStubGone(f, stub);
});
