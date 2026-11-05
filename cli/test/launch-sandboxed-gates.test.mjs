/**
 * `launch-sandboxed-gates.sh` — the Run gates launcher for a bubblewrap host, driven as the main
 * checkout's `init`-written copy against a fixture, with a recording `bwrap` stub first on `PATH`.
 *
 * **The rule these tests exist to enforce: the launcher's answers and its `bwrap` argument vector are
 * its contract.** It answers `in-session` (exit 4) off a bubblewrap host or with the base profile's
 * sandbox off; every refusal is one stderr line and exit 2 with nothing on stdout, and starts nothing
 * past the preflight; a live label is `pending` with no supervisor; a started run is `pending` and is
 * collected by the target's own `run-test-suite.sh --wait`. The vector, compared element by element
 * against one built here from the profile with `jq`, carries no `--share-net`, and the target's own
 * command runs only as the vector's command — the gate stub records whether `bwrap` ran it. The
 * supervisor sweeps every placeholder the stub leaves on the host, a `.git` leaf's included, and
 * nothing else under the fixture changes but the lane files. Until that sweep a `scripts/.git`
 * leftover stands, and the worker and the `--wait` collector place their root past it (F15,
 * `hr_script_root`); case (t) shows a job-mode run reaching its verdict so. A clone
 * whose `run_profile` only the sandbox probe's `sp__render` wrote is launched (case (r)), and a
 * status-less control-clone record does not refuse job mode (case (s)). Case (c) hides `bwrap` by
 * shadowing its `PATH` directory, never by dropping it, because `bash` may share it (F12).
 *
 * Not covered, because no suite can show it: whether the detached supervisor outlives a sandboxed
 * Bash call on Linux. That is the GS1 row's measurement. The stub emulates bubblewrap's placeholder
 * at a `--ro-bind /dev/null <p>` mount point ({@link BWRAP_STUB}) and honours `--unsetenv` and
 * `--chdir`; it applies no namespace, mount or `--setenv`, and that emulation is not measured. Every
 * case's `PATH` puts the runner-git shim first (`helpers/runner-git-shim.mjs`), so the worker and the
 * collector meet the runner's git, which dies on either placeholder shape.
 *
 * The host answer is `hr_placeholder_host_probe_var` redefined at the end of the fixture's installed
 * library, as `watcher-placeholder-host.test.mjs` overrides it. The library's `HR_TEST_RUN_STALE_SECONDS`
 * is redefined there too, as {@link STALE_BOUND_S}: the launcher's start window and `--wait`'s
 * staleness are ceilings under `helpers/timing.mjs`'s rule, and at a fixed 30 s they failed
 * launched-run cases at random under full-suite load. `HOME` and `XDG_STATE_HOME` are
 * case-owned; nothing reaches the network or starts a session. Runs the compiled `dist/cli.js`.
 */

import assert from 'node:assert/strict';
import { accessSync, constants, existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { appendFile, chmod, mkdir, mkdtemp, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { createFixture, PACKAGE_ROOT, runBash, runCli, runGit, snapshotTree, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { installRunnerGitShim } from './helpers/runner-git-shim.mjs';
import { scaleBound } from './helpers/timing.mjs';

/** The sandbox probe's own libraries, from this checkout: case (r) writes a clone record through `sp__render`. */
const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const RENDER_STUB = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe', 'render-watcher-stub.sh');

const STATE_DIR = 'sdlc-harness';
const SCRIPTS = 'scripts';
const LAUNCHER = `${SCRIPTS}/launch-sandboxed-gates.sh`;
const RUNNER = `${SCRIPTS}/run-test-suite.sh`;
const LIB = `${SCRIPTS}/lib/harness-run-lib.sh`;
const BASE_PROFILE = '.claude/settings.autonomous.json';
const BRANCH = 'feat_gates';
const LABEL = 'gates_round_1';
const LANE = `${STATE_DIR}/test_run_logs/${BRANCH}`;
const CLONE_BRANCH = 'feat_clone';

const RUN_TIMEOUT_MS = scaleBound(90_000);
const POLL_LIMIT = scaleBound(600);
/** The library's `HR_TEST_RUN_STALE_SECONDS` (30), scaled by the same multiplier as {@link RUN_TIMEOUT_MS} so it stays a third of it. */
const STALE_BOUND_S = scaleBound(30);

/** `commands.test`: records whether `bwrap` ran it and what it saw of the worker marker, under `$STUB_OUT`. */
const GATE_STUB = [
  '#!/usr/bin/env bash',
  'printf "ran\\n" >> "$STUB_OUT/gate-runs.txt"',
  'printf "%s\\n" "${STUB_IN_BWRAP-outside}" >> "$STUB_OUT/gate-in-bwrap.txt"',
  'printf "%s\\n" "${RUN_TEST_SUITE_WORKER-unset}" >> "$STUB_OUT/gate-worker.txt"',
  'exit "${STUB_EXIT:-0}"',
  '',
].join('\n');

/**
 * The `bwrap` stub. The preflight (last word `true`, no `--`) answers `STUB_BWRAP_PREFLIGHT_RC` with
 * `STUB_BWRAP_PREFLIGHT_ERR` on stderr; `STUB_BWRAP_BOOM` exits 1 at once with that line. Otherwise
 * it records its argv, honours `--unsetenv` and `--chdir`, and runs the words after `--`. Each absent
 * `--ro-bind /dev/null <p>` is a link to `/dev/null` while the command runs — the device the
 * sandbox shows there, on which the runner's git dies (round 14) — and the 0-byte 0444 file
 * bubblewrap leaves on the host once it exits, a `.git` leaf included. That leftover stays until the
 * supervisor's sweep; the unsandboxed `--wait` collector places its root past it (F15,
 * `hr_script_root`).
 */
const BWRAP_STUB = [
  '#!/usr/bin/env bash',
  'args=("$@")',
  'n=${#args[@]}',
  'has_sep=0; for a in "${args[@]}"; do [ "$a" = -- ] && has_sep=1; done',
  'if [ "$has_sep" = 0 ] && [ "${args[n-1]-}" = true ]; then',
  '  [ -z "${STUB_BWRAP_PREFLIGHT_ERR-}" ] || printf "%s\\n" "$STUB_BWRAP_PREFLIGHT_ERR" >&2',
  '  exit "${STUB_BWRAP_PREFLIGHT_RC:-0}"',
  'fi',
  'if [ -n "${STUB_BWRAP_BOOM-}" ]; then printf "%s\\n" "$STUB_BWRAP_BOOM" >&2; exit 1; fi',
  'printf "%s\\n" "$@" >> "$STUB_RECORD"',
  'made=()',
  'i=0',
  'while [ "$i" -lt "$n" ]; do',
  '  case "${args[i]}" in',
  '    --) i=$((i + 1)); break ;;',
  '    --ro-bind)',
  '      if [ "${args[i+1]}" = /dev/null ] && [ ! -e "${args[i+2]}" ] && [ ! -L "${args[i+2]}" ]; then',
  '        ln -s /dev/null "${args[i+2]}" && made+=("${args[i+2]}") && printf "%s\\n" "${args[i+2]}" >> "$STUB_PLACEHOLDERS"',
  '      fi',
  '      i=$((i + 3)) ;;',
  '    --bind | --setenv) i=$((i + 3)) ;;',
  '    --unsetenv) unset "${args[i+1]}"; i=$((i + 2)) ;;',
  '    --chdir) cd "${args[i+1]}" || exit 97; i=$((i + 2)) ;;',
  '    --dev | --proc | --tmpfs) i=$((i + 2)) ;;',
  '    *) i=$((i + 1)) ;;',
  '  esac',
  'done',
  'STUB_IN_BWRAP=1 "${args[@]:i}"',
  'status=$?',
  'for p in ${made[@]+"${made[@]}"}; do rm -f "$p"; : > "$p"; chmod 444 "$p"; done',
  ': > "$STUB_OUT/bwrap-exited"',
  'exit "$status"',
  '',
].join('\n');

/** `setsid`: records its argv, then runs it in place. */
const SETSID_STUB = '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$STUB_OUT/setsid.txt"\nexec "$@"\n';

const output = (r) => `status ${r.status}\n--stdout--\n${r.stdout}\n--stderr--\n${r.stderr}`;

/** True when `path` exists or is a symbolic link. */
function present(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

const lines = (path) => (existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter((l) => l !== '') : []);

/** True when `dir` holds an executable `name`. */
function executableIn(dir, name) {
  try {
    accessSync(join(dir, name), constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * `path` with each directory holding an executable `bwrap` replaced, at its position, by a shadow
 * under `scratch` linking every other entry of it: `bash` may share that directory (F12).
 */
async function pathHidingBwrap(path, scratch) {
  const dirs = path.split(delimiter);
  for (const [i, dir] of dirs.entries()) {
    if (dir === '' || !executableIn(dir, 'bwrap')) continue;
    const shadow = join(scratch, `path-${i}`);
    await mkdir(shadow, { recursive: true });
    for (const entry of await readdir(dir)) {
      if (entry !== 'bwrap') await symlink(join(dir, entry), join(shadow, entry));
    }
    dirs[i] = shadow;
  }
  return dirs.join(delimiter);
}

/**
 * An adopted fixture on {@link BRANCH}, committed, its library answering `host` for the host probe;
 * and a case root beside it holding `home/` (with `.ssh/config` and `.netrc`), `state/`, `bin/`
 * (the runner-git shim, the `bwrap` stub, and with `setsid` its stub) and `out/` (every record).
 *
 * @param {import('node:test').TestContext} t
 * @param {{ host?: 0 | 1, bwrap?: boolean, setsid?: boolean }} [options]
 */
async function launcherFixture(t, { host = 1, bwrap = true, setsid = false } = {}) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
      'harness.config.json': {
        version: 1,
        defaultBranch: 'main',
        stateDir: STATE_DIR,
        layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
        commands: { typecheck: '<none>', test: 'bash stub.sh' },
      },
      'stub.sh': GATE_STUB,
    },
  });
  const { dir } = fixture;
  const root = await realpath(await mkdtemp(join(tmpdir(), 'launch-gates-')));
  const home = join(root, 'home');
  const bin = join(root, 'bin');
  const out = join(root, 'out');
  const state = join(root, 'state');
  const clones = [];
  t.after(async () => {
    // A supervisor still running (a failed case) writes into the fixture: let it finish first.
    for (const lane of [join(dir, LANE), ...clones.map((c) => join(c, STATE_DIR, 'test_run_logs', CLONE_BRANCH))]) {
      for (let i = 0; i < POLL_LIMIT && present(join(lane, `${LABEL}.running`)); i += 1) await delay(100);
    }
    await delay(300);
    for (const clone of clones) await rm(clone, { recursive: true, force: true });
    await rm(root, { recursive: true, force: true });
    await fixture.cleanup();
  });

  await mkdir(join(home, '.ssh'), { recursive: true });
  await writeFile(join(home, '.ssh', 'config'), 'Host fixture\n');
  await writeFile(join(home, '.netrc'), 'machine fixture.invalid\n');
  await mkdir(bin);
  await mkdir(out);
  await mkdir(state);
  await installRunnerGitShim(bin);
  if (bwrap) await writeFile(join(bin, 'bwrap'), BWRAP_STUB, { mode: 0o755 });
  if (setsid) await writeFile(join(bin, 'setsid'), SETSID_STUB, { mode: 0o755 });

  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, output(init));
  await runGit(dir, ['checkout', '--quiet', '-b', BRANCH]);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: adopt the harness']);
  await appendFile(
    join(dir, LIB),
    `\nhr_placeholder_host_probe_var() {\n  HR_PLACEHOLDER_HOST=${host}\n  return 0\n}\nHR_TEST_RUN_STALE_SECONDS=${STALE_BOUND_S}\n`,
  );

  const hostPath = process.env.PATH ?? '';
  const path = `${bin}${delimiter}${bwrap ? hostPath : await pathHidingBwrap(hostPath, join(root, 'path'))}`;
  const env = (extra = {}) => ({
    HOME: home,
    XDG_STATE_HOME: state,
    PATH: path,
    STUB_OUT: out,
    STUB_RECORD: join(out, 'bwrap-argv.txt'),
    STUB_PLACEHOLDERS: join(out, 'placeholders.txt'),
    RUN_TEST_SUITE_WORKER: LABEL,
    ...extra,
  });
  const bounded = { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal };

  return {
    dir,
    root,
    home,
    out,
    state,
    clones,
    env,
    record: join(out, 'bwrap-argv.txt'),
    placeholders: () => lines(join(out, 'placeholders.txt')),
    gateRuns: () => lines(join(out, 'gate-runs.txt')),
    /** The main checkout's launcher, issued from the case root. */
    launch: (args, extra = {}) => runBash(root, [join(dir, LAUNCHER), ...args], env(extra), bounded),
    /** `bash <target>/<scriptsDir>/run-test-suite.sh --wait <label>`, repeated while it prints `pending`. */
    async collect(target, label = LABEL) {
      for (let i = 0; i < POLL_LIMIT; i += 1) {
        const r = await runBash(target, [join(target, RUNNER), '--wait', label], env({ RUN_TEST_SUITE_WAIT_SLICE: '1' }), bounded);
        if (r.stdout !== 'pending\n') return r;
      }
      assert.fail('--wait never left pending');
    },
    /** Wait until `pred` holds — the supervisor's sweep runs after `bwrap` exits. */
    async until(pred, what) {
      for (let i = 0; i < POLL_LIMIT; i += 1) {
        if (pred()) return;
        await delay(100);
      }
      assert.fail(`timed out waiting for ${what}`);
    },
    /** Read `jq`'s answer for `filter` over `file`, one value per line. */
    async jq(filter, file) {
      const r = await runBash(root, ['-c', 'jq -r "$1" "$2"', '_', filter, file], {}, bounded);
      assert.equal(r.status, 0, output(r));
      return r.stdout.split('\n').filter((l) => l !== '');
    },
    async lib(fn, ...args) {
      return this.libWith({}, fn, ...args);
    },
    /** {@link lib} under `env(extra)`. */
    async libWith(extra, fn, ...args) {
      const r = await runBash(root, ['-c', `. "$1"; shift; ${fn}`, '_', join(dir, LIB), ...args], env(extra), bounded);
      assert.equal(r.status, 0, output(r));
      return r.stdout.trim();
    },
    /** Write `.runs[<branch>].run_profile` in the main checkout's run registry. */
    async recordProfile(branch, value) {
      await this.lib('hr_registry_set "$1" "$2" run_profile "$3"', join(dir, STATE_DIR, 'autonomous_logs', 'registry.json'), branch, value);
    },
  };
}

/** The passwd home the launcher also masks, as it reads it; empty where `getent` does not answer. */
async function passwdHome(f) {
  const r = await runBash(f.root, ['-c', 'getent passwd "$(id -u)" 2>/dev/null | cut -d: -f6'], {}, { timeoutMs: RUN_TIMEOUT_MS });
  return r.stdout.trim();
}

/**
 * The vector the launcher must hand `bwrap` for `target`, built from `profile`'s exact denyWrite
 * entries and the base profile's credential lists — read with `jq` — and the files as they stand now;
 * a credential path's `~/` is read under `home`, the `HOME` the launch is given.
 */
async function expectedVector(f, target, profile, { home = f.home, label = LABEL } = {}) {
  const base = join(f.dir, BASE_PROFILE);
  const v = ['--new-session', '--unshare-all', '--die-with-parent', '--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc',
    '--tmpfs', '/tmp', '--bind', target, target];
  for (let p of await f.jq('.sandbox.filesystem.denyWrite[] | strings', profile)) {
    if (!p.startsWith('/') || p.includes('*')) continue;
    while (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
    if (!p.startsWith(`${target}/`)) continue;
    if (present(p)) v.push('--ro-bind', p, p);
    else v.push('--ro-bind', '/dev/null', p);
  }
  for (const rel of ['.bash_profile', '.bashrc', '.gitconfig', '.gitmodules', '.idea', '.profile', '.ripgreprc', '.vscode', '.zprofile', '.zshrc']) {
    const p = join(target, rel);
    if (present(p)) v.push('--ro-bind', p, p);
    else v.push('--ro-bind', '/dev/null', p);
  }
  const claude = join(target, '.claude');
  if (present(claude)) v.push('--ro-bind', claude, claude);
  else v.push('--ro-bind', '/dev/null', claude);
  if (present(join(target, '.git'))) v.push('--ro-bind', join(target, '.git'), join(target, '.git'));
  const homes = [home];
  const other = (await passwdHome(f)).replace(/\/$/, '');
  if (other.startsWith('/') && other.length > 1 && other !== home) homes.push(other);
  const mask = (p) => {
    const s = statSync(p, { throwIfNoEntry: false });
    if (s?.isDirectory()) v.push('--tmpfs', p);
    else if (s?.isFile()) v.push('--ro-bind', '/dev/null', p);
  };
  for (const p of await f.jq('.sandbox.credentials.files[]? | objects | .path | strings', base)) {
    const paths = p.startsWith('~/') && p.length > 2 ? homes.map((h) => `${h}/${p.slice(2)}`) : p.startsWith('/') ? [p] : [];
    for (const q of paths) {
      mask(q);
      if (present(q) && realpathSync(q) !== q) mask(realpathSync(q));
    }
  }
  for (const name of await f.jq('.sandbox.credentials.envVars[]? | objects | .name | strings', base)) v.push('--unsetenv', name);
  v.push('--unsetenv', 'RUN_TEST_SUITE_WORKER', '--setenv', 'TMPDIR', '/tmp', '--chdir', target, '--', 'bash',
    join(target, RUNNER), '--no-detach', label);
  return v;
}

/** A refusal: exit 2, nothing on stdout, one stderr line naming the launcher. */
function assertRefusal(r, fragment) {
  assert.equal(r.status, 2, output(r));
  assert.equal(r.stdout, '', output(r));
  const err = r.stderr.split('\n').filter((l) => l !== '');
  assert.equal(err.length, 1, output(r));
  assert.ok(err[0].startsWith('launch-sandboxed-gates.sh: '), output(r));
  assert.ok(err[0].includes(fragment), `stderr lacks ${JSON.stringify(fragment)}\n${output(r)}`);
}

// ---------------------------------------------------------------------------------------------
// Answers before anything starts.
// ---------------------------------------------------------------------------------------------

test('(a) not a bubblewrap host: in-session, exit 4, bwrap never called', async (t) => {
  const f = await launcherFixture(t, { host: 0 });
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [4, 'in-session\n'], output(r));
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(b) the base profile sandbox off: in-session, exit 4, bwrap never called', async (t) => {
  const f = await launcherFixture(t);
  const base = join(f.dir, BASE_PROFILE);
  const profile = JSON.parse(readFileSync(base, 'utf8'));
  profile.sandbox.enabled = false;
  await writeFile(base, `${JSON.stringify(profile, null, 2)}\n`);
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [4, 'in-session\n'], output(r));
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(c) no bwrap on PATH: the refusal, nothing recorded', async (t) => {
  const f = await launcherFixture(t, { bwrap: false });
  const r = await f.launch([f.dir, LABEL]);
  assertRefusal(r, 'bwrap is not on PATH');
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(c2) F12: the no-bwrap PATH hides only bwrap where bwrap and bash share a directory', async (t) => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'launch-gates-path-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bashDir = (process.env.PATH ?? '').split(delimiter).find((d) => d !== '' && executableIn(d, 'bash'));
  assert.ok(bashDir, 'no bash on this process PATH');
  const shared = join(root, 'shared');
  await mkdir(shared);
  await writeFile(join(shared, 'bwrap'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  await symlink(realpathSync(join(bashDir, 'bash')), join(shared, 'bash'));
  const path = await pathHidingBwrap(shared, join(root, 'scratch'));
  assert.notEqual(path, shared);
  const bounded = { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal };
  const bwrap = await runBash(root, ['-c', 'command -v bwrap'], { PATH: path }, bounded);
  assert.notEqual(bwrap.status, 0, output(bwrap));
  const bash = await runBash(root, ['-c', 'command -v bash'], { PATH: path }, bounded);
  assert.equal(bash.status, 0, output(bash));
});

test('(d) a preflight bwrap cannot pass: the refusal quotes it and names the AppArmor sysctl', async (t) => {
  const f = await launcherFixture(t);
  const line = 'bwrap: setting up uid map: Permission denied';
  const r = await f.launch([f.dir, LABEL], { STUB_BWRAP_PREFLIGHT_RC: '1', STUB_BWRAP_PREFLIGHT_ERR: line });
  assertRefusal(r, `bwrap cannot start a sandbox here: ${line}`);
  assert.ok(r.stderr.includes('kernel.apparmor_restrict_unprivileged_userns'), output(r));
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(e) a bad label, a missing argument and an unlisted repository are refused before bwrap', async (t) => {
  const f = await launcherFixture(t);
  assertRefusal(await f.launch([f.dir, '-bad']), "label '-bad' does not match");
  assertRefusal(await f.launch([f.dir]), 'usage: launch-sandboxed-gates.sh');
  const plain = join(f.root, 'plain');
  await mkdir(plain);
  await runGit(plain, ['init', '--quiet']);
  assertRefusal(await f.launch([plain, LABEL]), 'is neither the main checkout');
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(f) a live .running is pending, exit 3, and no supervisor starts', async (t) => {
  const f = await launcherFixture(t);
  await mkdir(join(f.dir, LANE), { recursive: true });
  await writeFile(join(f.dir, LANE, `${LABEL}.running`), '99999\n');
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  await delay(1000);
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
  await rm(join(f.dir, LANE, `${LABEL}.running`));
});

// ---------------------------------------------------------------------------------------------
// The run.
// ---------------------------------------------------------------------------------------------

test('(g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept', async (t) => {
  const f = await launcherFixture(t, { setsid: true });
  const expected = await expectedVector(f, f.dir, join(f.dir, BASE_PROFILE));
  const before = await snapshotTree(f.dir);

  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout, r.stderr], [3, 'pending\n', ''], output(r));
  const verdict = await f.collect(f.dir);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));

  const argv = lines(f.record);
  assert.deepEqual(argv, expected);
  assert.ok(!argv.includes('--share-net'), argv.join('\n'));
  assert.deepEqual(argv.slice(-2), ['--no-detach', LABEL]);
  assert.ok(expected.includes(join(f.home, '.ssh')) && expected.includes(join(f.home, '.netrc')), expected.join('\n'));
  assert.deepEqual(f.gateRuns(), ['ran']);
  assert.deepEqual(lines(join(f.out, 'gate-in-bwrap.txt')), ['1']);
  assert.deepEqual(lines(join(f.out, 'gate-worker.txt')), ['unset']);
  assert.deepEqual(lines(join(f.out, 'setsid.txt')), [`bash ${join(f.dir, LAUNCHER)} --supervise ${f.dir} ${LABEL}`]);

  // (h)
  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
  const placeholders = f.placeholders();
  assert.ok(placeholders.length > 0, 'the stub mounted no placeholder: the fixture has no absent protected path');
  await f.until(() => placeholders.every((p) => !present(p)), `the sweep of ${placeholders.join(', ')}`);
  const after = await snapshotTree(f.dir);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => before[k] !== after[k]);
  const outside = changed.filter((k) => !`${k}/`.startsWith(`${STATE_DIR}/test_run_logs/`));
  assert.deepEqual(outside, [], changed.join('\n'));
});

test('(i) a bwrap that exits at once: did not start, quoting its line', async (t) => {
  const f = await launcherFixture(t);
  const r = await f.launch([f.dir, LABEL], { STUB_BWRAP_BOOM: 'bwrap: boom' });
  assertRefusal(r, `the sandboxed gate run of ${LABEL} did not start: bwrap: boom`);
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(j) a protected path whose parent is absent: cannot protect, bwrap never called past its preflight', async (t) => {
  const f = await launcherFixture(t);
  const profile = join(f.dir, BASE_PROFILE);
  const entries = (await f.jq('.sandbox.filesystem.denyWrite[] | strings', profile)).filter(
    (p) => p.startsWith(`${f.dir}/`) && !p.includes('*'),
  );
  // An absent entry whose parent directory holds nothing the launcher reads before the vector.
  const pick = entries.find((p) => {
    const parent = p.slice(0, p.lastIndexOf('/'));
    const rel = parent.slice(f.dir.length + 1);
    const needed = [BASE_PROFILE, LAUNCHER, '.git/HEAD', `${STATE_DIR}/x`].some((n) => n.startsWith(`${rel}/`));
    return !present(p) && parent !== f.dir && !needed && statSync(parent, { throwIfNoEntry: false })?.isDirectory();
  });
  assert.ok(pick, `no absent protected entry with a removable parent:\n${entries.join('\n')}`);
  await rm(pick.slice(0, pick.lastIndexOf('/')), { recursive: true, force: true });
  const r = await f.launch([f.dir, LABEL]);
  assertRefusal(r, 'in the gate sandbox: its parent directory is absent');
  assert.ok(r.stderr.includes('cannot protect '), output(r));
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

// ---------------------------------------------------------------------------------------------
// The clone arm.
// ---------------------------------------------------------------------------------------------

/** A clone of the fixture registered as {@link CLONE_BRANCH}, holding `protected.txt`, with no `run_profile`. */
async function bareClone(t, f) {
  await mkdir(join(f.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  const created = await runBash(f.root, [
    '-c',
    '. "$1" || exit 99; hr_clone_create_var "$2" "$3" "$4" || { printf "%s\\n" "$HR_CLONE_REFUSAL" >&2; exit 1; }; printf "%s\\n" "$HR_CLONE_DIR"',
    '_',
    join(f.dir, LIB),
    f.dir,
    CLONE_BRANCH,
    BRANCH,
  ], f.env(), { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal });
  assert.equal(created.status, 0, output(created));
  const clone = realpathSync(created.stdout.trim());
  f.clones.push(clone);

  const protectedPath = join(clone, 'protected.txt');
  await writeFile(protectedPath, 'kept\n');
  return { clone, protectedPath };
}

/**
 * {@link bareClone}, its per-run profile written where the watcher renders it — under the case's own
 * `XDG_STATE_HOME` — protecting `protected.txt` and recorded as the branch's `run_profile`.
 */
async function registeredClone(t, f) {
  const { clone, protectedPath } = await bareClone(t, f);
  const profileFile = await f.lib('hr_run_profile_file "$(hr_repo_slug "$1")" "$2"', f.dir, CLONE_BRANCH);
  assert.ok(profileFile.startsWith(`${f.state}/`), profileFile);
  await mkdir(profileFile.slice(0, profileFile.lastIndexOf('/')), { recursive: true });
  await writeFile(profileFile, `${JSON.stringify({ sandbox: { filesystem: { denyWrite: [protectedPath] } } })}\n`);
  await f.recordProfile(CLONE_BRANCH, profileFile);
  return { clone, protectedPath, profileFile };
}

/** Launch `clone` for `label` under `extra`, collect its pass, and return the `bwrap` argv it recorded. */
async function launchClone(f, clone, label, extra = {}) {
  await rm(f.record, { force: true });
  await rm(join(f.out, 'bwrap-exited'), { force: true });
  const r = await f.launch([clone, label], extra);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  const verdict = await f.collect(clone, label);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
  await f.until(() => !present(join(clone, STATE_DIR, 'test_run_logs', CLONE_BRANCH, `${label}.running`)), 'the clone run to end');
  return lines(f.record);
}

test('(k) a registered clone takes its protected paths from the recorded per-run profile, and refuses without one', async (t) => {
  const f = await launcherFixture(t);
  const { clone, protectedPath, profileFile } = await registeredClone(t, f);
  const expected = await expectedVector(f, clone, profileFile);

  const argv = await launchClone(f, clone, LABEL);
  assert.deepEqual(argv, expected);
  const at = argv.indexOf(protectedPath);
  assert.deepEqual(argv.slice(at - 1, at + 2), ['--ro-bind', protectedPath, protectedPath]);

  await f.recordProfile(CLONE_BRANCH, '');
  assertRefusal(await f.launch([clone, 'gates_round_2']), `the run registry records no per-run profile for '${CLONE_BRANCH}'`);

  await f.recordProfile(CLONE_BRANCH, profileFile);
  await rm(profileFile);
  const refused = await f.launch([clone, 'gates_round_2']);
  assertRefusal(refused, `no per-run profile for '${CLONE_BRANCH}' at ${profileFile}`);
});

test('(r) a clone whose record only the sandbox probe\'s sp__render wrote is launched, and refused before it', async (t) => {
  const f = await launcherFixture(t);
  const { clone, protectedPath } = await bareClone(t, f);

  // The state the probe was in before sp__render recorded the field.
  assertRefusal(await f.launch([clone, LABEL]), `the run registry records no per-run profile for '${CLONE_BRANCH}'`);

  const stubScripts = join(f.root, 'stub-scripts');
  await mkdir(stubScripts);
  await writeFile(join(stubScripts, 'autonomous-watcher.sh'), readFileSync(RENDER_STUB, 'utf8'));
  const profileFile = join(f.root, 'probe-rendered.json');
  const rendered = await runBash(f.root, [
    '-c',
    'for lib in "$1" "$2" "$3"; do . "$lib"; done; SP_SCRIPTS="$4"; SP_REGISTRY="$5"; sp__render "$6" "$7" || { printf "%s\\n" "$SP__RENDER_REFUSAL" >&2; exit 1; }; printf "%s\\n" "$SP__RENDERED"',
    '_',
    join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh'),
    join(PROBE_LIB, 'core.sh'),
    join(PROBE_LIB, 'session.sh'),
    stubScripts,
    join(f.dir, STATE_DIR, 'autonomous_logs', 'registry.json'),
    CLONE_BRANCH,
    clone,
  ], f.env({
    RENDER_STUB_PROFILE: profileFile,
    RENDER_STUB_JSON: JSON.stringify({ sandbox: { filesystem: { denyWrite: [protectedPath] } } }),
    SP_VERSION: '',
    SP_CURRENT_LEG: '',
  }), { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal });
  assert.deepEqual([rendered.status, rendered.stdout], [0, `${profileFile}\n`], output(rendered));

  const expected = await expectedVector(f, clone, profileFile);
  const argv = await launchClone(f, clone, LABEL);
  assert.deepEqual(argv, expected);
  const at = argv.indexOf(protectedPath);
  assert.deepEqual(argv.slice(at - 1, at + 2), ['--ro-bind', protectedPath, protectedPath]);
});

// ---------------------------------------------------------------------------------------------
// The main checkout as the target: job mode only, told from the main checkout's run registry.
// ---------------------------------------------------------------------------------------------

/** Write the main checkout's run registry as `runs`, or as the raw string `runs`. */
async function writeRegistry(f, runs) {
  const dir = join(f.dir, STATE_DIR, 'autonomous_logs');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'registry.json'), typeof runs === 'string' ? runs : `${JSON.stringify({ runs })}\n`);
}

test('(p) local mode: a live record naming a run copy refuses the main checkout as the target, and an unreadable registry refuses', async (t) => {
  const f = await launcherFixture(t);
  const copy = join(f.root, 'copy');
  await mkdir(copy);
  for (const status of ['running', 'parked']) {
    await writeRegistry(f, { [BRANCH]: { branch: BRANCH, worktree: copy, status } });
    assertRefusal(await f.launch([f.dir, LABEL]), 'accepted only in job mode');
  }
  await writeRegistry(f, 'not json\n');
  assertRefusal(await f.launch([f.dir, LABEL]), 'cannot read the run registry');
  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
  assert.ok(!present(join(f.dir, LANE, `${LABEL}.running`)) && !present(join(f.dir, LANE, `${LABEL}.verdict`)));
});

test('(q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding', async (t) => {
  const f = await launcherFixture(t);
  const elsewhere = join(f.root, 'finished');
  await mkdir(elsewhere);
  await writeRegistry(f, {
    [BRANCH]: { branch: BRANCH, worktree: f.dir, status: 'running' },
    feat_done: { branch: 'feat_done', worktree: elsewhere, status: 'completed' },
  });
  const expected = await expectedVector(f, f.dir, join(f.dir, BASE_PROFILE));
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  const verdict = await f.collect(f.dir);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
  assert.deepEqual(lines(f.record), expected);
  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
});

test('(s) job mode: the wrappers leg\'s control-clone record, which carries no status, does not refuse the main checkout', async (t) => {
  const f = await launcherFixture(t);
  const ctl = join(f.root, 'ctl-clone');
  await mkdir(ctl);
  const ctlBranch = `${BRANCH}_ctl`;
  await writeRegistry(f, {
    [BRANCH]: { branch: BRANCH, worktree: f.dir, status: 'running' },
    [ctlBranch]: { branch: ctlBranch, worktree: ctl, copy_kind: 'clone', run_profile: join(f.root, 'ctl-profile.json') },
  });
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  const verdict = await f.collect(f.dir);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
});

test('(t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder', async (t) => {
  const f = await launcherFixture(t);
  await writeRegistry(f, { [BRANCH]: { branch: BRANCH, worktree: f.dir, status: 'running' } });
  const base = join(f.dir, BASE_PROFILE);
  const scriptsGit = join(f.dir, SCRIPTS, '.git');
  assert.ok((await f.jq('.sandbox.filesystem.denyWrite[] | strings', base)).includes(scriptsGit), `the base profile does not protect ${scriptsGit}`);
  assert.equal(present(scriptsGit), false);
  const expected = await expectedVector(f, f.dir, base);
  const before = await snapshotTree(f.dir);

  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout, r.stderr], [3, 'pending\n', ''], output(r));
  const verdict = await f.collect(f.dir);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));

  const argv = lines(f.record);
  assert.deepEqual(argv, expected);
  const at = argv.indexOf(scriptsGit);
  assert.deepEqual(argv.slice(at - 2, at + 1), ['--ro-bind', '/dev/null', scriptsGit], argv.join('\n'));
  assert.deepEqual(argv.slice(argv.indexOf('--') + 1), ['bash', join(f.dir, RUNNER), '--no-detach', LABEL]);
  assert.deepEqual(f.gateRuns(), ['ran']);
  assert.deepEqual(lines(join(f.out, 'gate-in-bwrap.txt')), ['1']);

  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
  assert.ok(f.placeholders().includes(scriptsGit), f.placeholders().join('\n'));
  await f.until(() => !present(scriptsGit), `the sweep of ${scriptsGit}`);
  await f.until(() => !present(join(f.dir, LANE, `${LABEL}.running`)), 'the run to end');
  const after = await snapshotTree(f.dir);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => before[k] !== after[k]);
  const outside = changed.filter((k) => !`${k}/`.startsWith(`${STATE_DIR}/test_run_logs/`));
  assert.deepEqual(outside, [], changed.join('\n'));
});

test('(n) a redirected XDG_STATE_HOME or HOME does not choose the clone\'s profile', async (t) => {
  const f = await launcherFixture(t);
  const { clone, protectedPath, profileFile } = await registeredClone(t, f);
  const altState = join(f.root, 'alt-state');
  const altHome = join(f.root, 'alt-home');
  await mkdir(altState);
  await mkdir(altHome);
  const crafted = `${JSON.stringify({ sandbox: { filesystem: { denyWrite: [] } } })}\n`;
  const legs = [
    { name: 'XDG_STATE_HOME', extra: { XDG_STATE_HOME: altState }, home: f.home, under: altState },
    { name: 'HOME', extra: { HOME: altHome, XDG_STATE_HOME: '' }, home: altHome, under: altHome },
  ];

  for (const [i, leg] of legs.entries()) {
    const placed = await f.libWith(leg.extra, 'hr_run_profile_file "$(hr_repo_slug "$1")" "$2"', f.dir, CLONE_BRANCH);
    assert.ok(placed.startsWith(`${leg.under}/`), `${leg.name}: ${placed}`);
    await mkdir(placed.slice(0, placed.lastIndexOf('/')), { recursive: true });
    await writeFile(placed, crafted);

    const label = `gates_round_${i + 1}`;
    const expected = await expectedVector(f, clone, profileFile, { home: leg.home, label });
    const argv = await launchClone(f, clone, label, leg.extra);
    assert.deepEqual(argv, expected, leg.name);
    const at = argv.indexOf(protectedPath);
    assert.deepEqual(argv.slice(at - 1, at + 2), ['--ro-bind', protectedPath, protectedPath], leg.name);
  }
});

test('(o) an unusable run_profile field is a refusal, bwrap never called past its preflight', async (t) => {
  const f = await launcherFixture(t);
  const { clone, profileFile } = await registeredClone(t, f);
  const link = join(f.root, 'profile-link.json');
  await symlink(profileFile, link);

  await f.recordProfile(CLONE_BRANCH, 'profile.json');
  assertRefusal(await f.launch([clone, LABEL]), `the run registry records no per-run profile for '${CLONE_BRANCH}'`);
  await f.recordProfile(CLONE_BRANCH, `${profileFile}\n${profileFile}`);
  assertRefusal(await f.launch([clone, LABEL]), `the run registry records no per-run profile for '${CLONE_BRANCH}'`);
  await f.recordProfile(CLONE_BRANCH, link);
  assertRefusal(await f.launch([clone, LABEL]), `no per-run profile for '${CLONE_BRANCH}' at ${link}`);

  assert.equal(existsSync(f.record), false);
  assert.deepEqual(f.gateRuns(), []);
});

test('(l) the vector binds the target\'s .git read-only after every denyWrite entry, closing the omit trio', async (t) => {
  const f = await launcherFixture(t);
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  const verdict = await f.collect(f.dir);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
  const argv = lines(f.record);
  const git = join(f.dir, '.git');
  const at = argv.lastIndexOf(git);
  assert.deepEqual(argv.slice(at - 2, at + 1), ['--ro-bind', git, git], argv.join('\n'));
  const after = argv.slice(at + 1);
  const pinnedAfter = after.filter((a, i) => after[i - 1] === '/dev/null' && a.startsWith(`${f.dir}/`));
  assert.deepEqual(pinnedAfter, [], `a denyWrite placeholder follows the .git bind:\n${argv.join('\n')}`);
  for (const p of ['commondir', 'config.worktree', 'objects/info/http-alternates']) {
    assert.ok(!argv.includes(join(git, p)), `${p} is pinned path by path, which F9 forbids:\n${argv.join('\n')}`);
  }
  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
});

test('(m) the vector pins Claude Code\'s built-in protected paths at the target\'s root, .claude read-only after every denyWrite entry', async (t) => {
  const f = await launcherFixture(t);
  const r = await f.launch([f.dir, LABEL]);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  const verdict = await f.collect(f.dir);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
  const argv = lines(f.record);
  const claude = join(f.dir, '.claude');
  const at = argv.lastIndexOf(claude);
  assert.deepEqual(argv.slice(at - 2, at + 1), ['--ro-bind', claude, claude], argv.join('\n'));
  const after = argv.slice(at + 1, argv.indexOf('--'));
  const underClaude = after.filter((a) => a.startsWith(`${claude}/`));
  assert.deepEqual(underClaude, [], `a bind under .claude follows the .claude bind:\n${argv.join('\n')}`);
  for (const rel of ['.bashrc', '.gitmodules', '.vscode']) {
    const p = join(f.dir, rel);
    const i = argv.indexOf(p);
    const pinned = (i > 0 && argv[i - 1] === '--ro-bind' && argv[i + 1] === p)
      || (i > 1 && argv[i - 2] === '--ro-bind' && argv[i - 1] === '/dev/null');
    assert.ok(pinned, `${rel} is not pinned:\n${argv.join('\n')}`);
  }
  await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
});
