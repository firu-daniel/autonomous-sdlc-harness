/**
 * The written watcher's keep-awake hold — `keep_awake_start` at launch and `keep_awake_pass` on each
 * pass in `autonomous-watcher.sh` — driven through real launches against a fixture whose own files
 * are committed and pushed to its `origin`, with the sourced `hr_keep_awake_probe_var` overridden.
 *
 * **The rule this suite enforces: the hold waits on the engine's own pid and ends with it, and never
 * changes the engine's exit classification or its stream.**
 *
 * `caffeinate` and `systemd-inhibit` are recording stubs placed first on `PATH`, so no real hold is
 * ever taken, and every Linux case reads a temp `HR_POWER_SUPPLY_DIR`, never the host's. Every pass
 * runs with `GITHUB_ACTIONS` empty, so a CI run does not take the runner arm. A Linux case's session
 * outlives a pass: one script launches without `wait`, runs each later `tick` when the case asks for
 * it, and a control file ends the stub (`watcher-stall-reset-payloads.test.mjs` → `localStall`).
 * Every bound here is scaled by `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`), and `session()`
 * waits for each pass under the shared driver's `TICK_TIMEOUT_MS`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { runBash, runGit } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import {
  createWatcherFixture,
  DEFAULT_PLACEHOLDER_HOST_PROBE,
  DEFAULT_SANDBOX_PROBE,
  TICK_TIMEOUT_MS,
} from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const INBOX = `${STATE_DIR}/autonomous_inbox`;
const LOGS = `${STATE_DIR}/autonomous_logs`;
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];

const MACOS_PROBE = 'HR_KEEP_AWAKE_HOST=macos; HR_KEEP_AWAKE_TOOL=caffeinate; return 0';
const LINUX_PROBE = 'HR_KEEP_AWAKE_HOST=linux; HR_KEEP_AWAKE_TOOL=systemd-inhibit; return 0';
const WSL2_PROBE = 'HR_KEEP_AWAKE_HOST=wsl2; HR_KEEP_AWAKE_TOOL=; return 0';

/**
 * Bounds every poll a case makes for a state the watcher reaches asynchronously.
 * Scaled by `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`).
 */
const WAIT_MS = scaleBound(20_000);
/**
 * Bounds a multi-pass session script: three passes and two holder polls, below the suite's
 * `--test-timeout` at the scale cap. Scaled by `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`).
 */
const SESSION_TIMEOUT_MS = scaleBound(240_000);

/** Separates one recorded argument from the next in a stub's record file. */
const ARG_SEP = '\u001f';

/** `gh`, recorded: each argument vector appended to `STUB_LOG`. */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
if (args.join(' ').startsWith('run list')) process.stdout.write('[]');
`;

/** A shell single-quoted literal. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * The stubs `keep-awake-lib.test.mjs` uses: each records its argv to `<records>/<name>`, one
 * invocation per line; `caffeinate` waits on the pid after `-w`; `systemd-inhibit` exits with
 * `<records>/probe-status` when its last argument is `true`, and otherwise runs what follows its
 * four flags.
 */
function stubBodies(records) {
  const record = (name) => `{ printf '%s\\037' "$@"; printf '\\n'; } >>${shellQuote(join(records, name))}`;
  return {
    caffeinate: [
      record('caffeinate'),
      'pid=""; prev=""',
      'for arg in "$@"; do [ "$prev" = "-w" ] && pid="$arg"; prev="$arg"; done',
      'while kill -0 "$pid" 2>/dev/null; do sleep 0.1; done',
    ].join('\n'),
    'systemd-inhibit': [
      record('systemd-inhibit'),
      'for last in "$@"; do :; done',
      `if [ "$last" = "true" ]; then exit "$(cat ${shellQuote(join(records, 'probe-status'))})"; fi`,
      'shift 4',
      'exec "$@"',
    ].join('\n'),
  };
}

/**
 * A watcher fixture adopted on `origin`'s default branch, with the hold stubs, a power-supply
 * directory on mains and a stub engine that writes its own pid; `keepAwake` sets
 * `execution.keepAwake` in its `harness.config.json`.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ keepAwake?: unknown }} [options]
 */
async function keepAwakeFixture(t, { keepAwake } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  if (keepAwake !== undefined) config.execution = { ...(config.execution ?? {}), keepAwake };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);
  t.after(() => rm(`${w.dir}-${w.branch}`, { recursive: true, force: true }));

  const rec = join(w.dir, 'watcher-test');
  const stubs = join(rec, 'keep-awake-bin');
  const records = join(rec, 'keep-awake-records');
  const control = join(rec, 'keep-awake-control');
  const power = join(rec, 'power');
  for (const dir of [stubs, records, control, join(power, 'AC')]) await mkdir(dir, { recursive: true });
  for (const [name, body] of Object.entries(stubBodies(records))) {
    await writeFile(join(stubs, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  }
  await writeFile(join(records, 'probe-status'), '0\n', 'utf8');
  await writeFile(join(power, 'AC', 'type'), 'Mains\n', 'utf8');
  await writeFile(join(power, 'AC', 'online'), '1\n', 'utf8');
  const ghStub = join(rec, 'gh');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });

  const enginePidPath = join(rec, 'engine-pid');
  const endPath = join(control, 'end');
  // The engine's stdout is the stream pipe, so the line it prints is what the stream must carry alone.
  const engineBody = (tail = '') =>
    [`printf '%s\\n' "$$" > ${shellQuote(enginePidPath)}`, `printf '%s\\n' '{"type":"system","subtype":"init"}'`, tail]
      .filter(Boolean)
      .join('\n');
  await w.setStub(engineBody());

  const env = () => ({
    HARNESS_GH_CLI: ghStub,
    STUB_LOG: join(rec, 'gh.log'),
    GITHUB_ACTIONS: '',
    HR_POWER_SUPPLY_DIR: power,
    PATH: `${stubs}${delimiter}${process.env.PATH ?? ''}`,
  });

  const recorded = (name) => {
    const file = join(records, name);
    if (!existsSync(file)) return undefined;
    return readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line !== '')
      .map((line) => line.split(ARG_SEP).slice(0, -1));
  };

  /** Poll `predicate` until it holds, failing with `label` and the watcher log past `budget` ms. */
  const waitFor = async (predicate, label, budget = WAIT_MS) => {
    const deadline = Date.now() + budget;
    for (;;) {
      let held = false;
      try {
        held = await predicate();
      } catch {
        // A registry read mid-write; ask again.
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

  return {
    ...w,
    env,
    recorded,
    waitFor,
    alive,
    engineBody,
    streamText: () => readFileSync(join(w.dir, LOGS, `${w.branch}.stream.jsonl`), 'utf8'),
    enginePid: () => readFileSync(enginePidPath, 'utf8').trim(),
    drop: () => writeFile(join(w.dir, INBOX, `${w.branch}_task_prompt.md`), 'do the thing\n', 'utf8'),
    setPower: (online) => writeFile(join(power, 'AC', 'online'), `${online}\n`, 'utf8'),
    setProbeStatus: (status) => writeFile(join(records, 'probe-status'), `${status}\n`, 'utf8'),
    /** One pass through the shared driver, its session waited for, with `probe` as the keep-awake probe. */
    pass: (probe) => (probe === undefined ? w.tick(env()) : w.tick(env(), { keepAwakeProbe: probe })),
    holderGone: (pid) => waitFor(async () => !(await alive(pid)), `holder ${pid} still alive`),
    /** Lines of `watcher.log` that start their message with `prefix`. */
    logLines: (prefix) =>
      w
        .watcherLog()
        .split('\n')
        .filter((line) => line.includes(prefix)),

    /**
     * Launch a long-lived session in pass 1 and return a handle: `next()` runs one more pass and
     * resolves once it has returned; `end()` ends the stub, then the script, and asserts its exit.
     */
    async session(probe) {
      await w.setStub(engineBody(`until [ -e ${shellQuote(endPath)} ]; do sleep 0.1; done`));
      await writeFile(join(w.dir, INBOX, `${w.branch}_task_prompt.md`), 'do the thing\n', 'utf8');
      const script = [
        '. "$1" status >/dev/null',
        `hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,
        `hr_keep_awake_probe_var() {\n${probe}\n}`,
        `hr_placeholder_host_probe_var() {\n${DEFAULT_PLACEHOLDER_HOST_PROBE}\n}`,
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
      const running = runBash(w.dir, ['-c', script, '_', w.watcherPath, control], w.watcherEnv(env()), {
        timeoutMs: SESSION_TIMEOUT_MS,
        signal: t.signal,
      }).then((result) => {
        settled = result;
        return result;
      });
      const reached = (n) =>
        waitFor(
          () => {
            if (settled !== null) assert.fail(`the session script ended early\n${settled.stdout}\n${settled.stderr}`);
            return existsSync(join(control, `pass-${n}`));
          },
          `pass ${n} did not return`,
          TICK_TIMEOUT_MS,
        );
      await reached(1);
      await waitFor(
        () => existsSync(enginePidPath) && w.record().keep_awake !== undefined,
        'the launch recorded no keep_awake',
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

const HOLDING = (tool, holder, engine) => `keep-awake: holding the host awake for 'feat_x' (${tool} pid ${holder}, engine pid ${engine})`;
const BATTERY_RELEASE = "keep-awake: on battery — released the hold for 'feat_x'";
const MAINS_RETAKE = (holder) => `keep-awake: mains power — holding the host awake for 'feat_x' again (systemd-inhibit pid ${holder})`;

test('(a)(c) macOS: caffeinate waits on the engine\'s own pid, is gone once the session is, and stays off the stream', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  await f.drop();
  await f.pass(MACOS_PROBE);
  const engine = f.enginePid();
  const record = f.record();
  assert.deepEqual(f.recorded('caffeinate'), [['-s', '-i', '-w', engine]]);
  assert.equal(f.recorded('systemd-inhibit'), undefined);
  assert.equal(String(record.engine_pid), engine);
  assert.equal(record.keep_awake, 'held');
  assert.ok(f.watcherLog().includes(HOLDING('caffeinate', record.keep_awake_pid, engine)), f.watcherLog());
  await f.holderGone(record.keep_awake_pid);
  assert.equal(f.streamText().includes('keep-awake'), false, f.streamText());
});

test('(b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  await f.setStub(f.engineBody('exit 3'));
  await f.drop();
  await f.pass(MACOS_PROBE);
  const record = f.record();
  assert.equal(record.keep_awake, 'held');
  assert.equal(record.status, 'failed');
  await f.holderGone(record.keep_awake_pid);
  assert.equal(f.streamText().includes('keep-awake'), false, f.streamText());
});

test('the driver\'s default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  await f.setStub(f.engineBody('exit 3'));
  await f.drop();
  await f.pass();
  const record = f.record();
  assert.equal(record.keep_awake, 'off');
  assert.equal(record.status, 'failed');
  assert.equal(f.watcherLog().includes('keep-awake:'), false, f.watcherLog());
  assert.equal(f.recorded('caffeinate'), undefined);
  assert.equal(f.recorded('systemd-inhibit'), undefined);
});

test('(d) execution.keepAwake false takes no hold, logs nothing, and status names it', async (t) => {
  const f = await keepAwakeFixture(t, { keepAwake: false });
  if (f === null) return;

  await f.drop();
  await f.pass(MACOS_PROBE);
  assert.equal(f.prompts().length, 1, `the stub was not launched\n${f.watcherLog()}`);
  assert.equal(f.recorded('caffeinate'), undefined);
  assert.equal(f.record().keep_awake, 'off');
  assert.equal(f.watcherLog().includes('keep-awake:'), false, f.watcherLog());

  const status = await runBash(f.dir, [f.watcherPath, 'status'], f.watcherEnv(f.env()), { timeoutMs: WAIT_MS, signal: t.signal });
  assert.equal(status.status, 0, status.stderr);
  const lines = status.stdout.split('\n');
  const at = lines.findIndex((line) => line.startsWith('tunables:'));
  assert.ok(at >= 0, status.stdout);
  assert.ok(lines[at].endsWith(' KEEP_AWAKE=off'), lines[at]);
  assert.equal(lines[at + 1], 'keep-awake: off — execution.keepAwake is false');
});

test('(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  const configPath = join(f.dir, 'harness.config.json');
  const setKeepAwake = async (keepAwake) => {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.execution = { ...(config.execution ?? {}), keepAwake };
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  };

  const session = await f.session(MACOS_PROBE);
  const engine = f.enginePid();
  let record = f.record();
  assert.equal(record.keep_awake, 'held');
  const first = record.keep_awake_pid;

  await setKeepAwake(false);
  await session.next();
  record = f.record();
  assert.equal(record.keep_awake, 'off');
  assert.ok(f.watcherLog().includes("keep-awake: released 'feat_x' — execution.keepAwake is false"), f.watcherLog());
  await f.holderGone(first);
  assert.ok(await f.alive(engine), 'the engine ended with the hold');

  await setKeepAwake(true);
  await session.next();
  record = f.record();
  assert.equal(record.keep_awake, 'held');
  const second = record.keep_awake_pid;
  assert.notEqual(second, first);
  assert.ok(await f.alive(second), 'the retaken holder is not alive');
  assert.deepEqual(f.recorded('caffeinate').at(-1), ['-s', '-i', '-w', engine]);

  await session.end();
  await f.holderGone(second);
});

test('(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  const session = await f.session(LINUX_PROBE);
  const engine = f.enginePid();
  let record = f.record();
  assert.equal(record.keep_awake, 'held');
  assert.equal(String(record.engine_pid), engine);
  const first = record.keep_awake_pid;
  assert.ok(await f.alive(first), 'the first holder is not alive');
  const inhibit = f.recorded('systemd-inhibit');
  assert.equal(inhibit.length, 2, JSON.stringify(inhibit));
  assert.deepEqual(inhibit[1].slice(-2), ['keep-awake-wait', engine]);
  assert.ok(f.watcherLog().includes(HOLDING('systemd-inhibit', first, engine)), f.watcherLog());

  // (f) battery: released while the session lives.
  await f.setPower(0);
  await session.next();
  record = f.record();
  assert.ok(f.watcherLog().includes(BATTERY_RELEASE), f.watcherLog());
  assert.equal(record.keep_awake, 'battery');
  await f.holderGone(first);
  assert.ok(await f.alive(engine), 'the engine ended with the hold');

  // (g) mains again: a new live holder.
  await f.setPower(1);
  await session.next();
  record = f.record();
  assert.equal(record.keep_awake, 'held');
  const second = record.keep_awake_pid;
  assert.notEqual(second, first);
  assert.ok(f.watcherLog().includes(MAINS_RETAKE(second)), f.watcherLog());
  assert.ok(await f.alive(second), 'the retaken holder is not alive');

  // (h) the session ends, and the holder with it.
  await session.end();
  await f.holderGone(second);
});

test('(i) Linux: a refused lock logs once, still launches, and is never retried on mains', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  await f.setProbeStatus(1);
  const session = await f.session(LINUX_PROBE);
  assert.equal(f.prompts().length, 1, `the stub was not launched\n${f.watcherLog()}`);
  assert.equal(f.record().keep_awake, 'refused');

  await f.setProbeStatus(0);
  await session.next();
  assert.equal(f.record().keep_awake, 'refused');
  assert.equal(f.recorded('systemd-inhibit').length, 1, 'a later pass took the lock again');
  assert.equal(f.logLines("keep-awake: not holding for 'feat_x' — systemd-inhibit exited 1 — ").length, 1, f.watcherLog());
  await session.end();
});

test('(j) WSL2: one not-holding line naming WSL2, and no tool invoked', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  await f.drop();
  await f.pass(WSL2_PROBE);
  assert.equal(f.logLines("keep-awake: not holding for 'feat_x' — WSL2 — ").length, 1, f.watcherLog());
  assert.equal(f.record().keep_awake, 'off');
  assert.equal(f.recorded('caffeinate'), undefined);
  assert.equal(f.recorded('systemd-inhibit'), undefined);
});

test('(k) Linux: under the global kill switch a pass on battery still releases the hold', async (t) => {
  const f = await keepAwakeFixture(t);
  if (f === null) return;

  const stop = join(f.dir, STATE_DIR, 'AUTONOMOUS_STOP');
  t.after(() => rm(stop, { force: true }));
  const session = await f.session(LINUX_PROBE);
  const record = f.record();
  assert.equal(record.keep_awake, 'held');
  const holder = record.keep_awake_pid;

  await writeFile(stop, '', 'utf8');
  await f.setPower(0);
  await session.next();
  assert.ok(f.watcherLog().includes('global kill switch active'), f.watcherLog());
  assert.ok(f.watcherLog().includes(BATTERY_RELEASE), f.watcherLog());
  assert.equal(f.record().keep_awake, 'battery');
  await f.holderGone(holder);
  assert.ok(await f.alive(f.enginePid()), 'the engine ended with the hold');

  await rm(stop);
  await session.end();
});
