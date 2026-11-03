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
 * supervisor sweeps every placeholder the stub mounted, and nothing else under the fixture changes
 * but the lane files.
 *
 * Not covered, because no suite can show it: whether the detached supervisor outlives a sandboxed
 * Bash call on Linux. That is the GS1 row's measurement. The stub emulates bubblewrap's placeholder
 * at a `--ro-bind /dev/null <p>` mount point ({@link BWRAP_STUB}) and honours `--unsetenv` and
 * `--chdir`; it applies no namespace, mount or `--setenv`, and that emulation is not measured.
 *
 * The host answer is `hr_placeholder_host_probe_var` redefined at the end of the fixture's installed
 * library, as `watcher-placeholder-host.test.mjs` overrides it. `HOME` and `XDG_STATE_HOME` are
 * case-owned; nothing reaches the network or starts a session. Runs the compiled `dist/cli.js`.
 */

import assert from 'node:assert/strict';
import { accessSync, constants, existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { appendFile, chmod, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit, snapshotTree } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';

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
 * sandbox shows there, which git's discovery passes over where it dies on an empty regular `.git` —
 * and the 0-byte 0444 file bubblewrap leaves on the host once it exits.
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

/** `PATH` with every directory holding an executable `bwrap` left out. */
function pathWithoutBwrap() {
  return (process.env.PATH ?? '')
    .split(delimiter)
    .filter((dir) => {
      try {
        accessSync(join(dir, 'bwrap'), constants.X_OK);
        return false;
      } catch {
        return true;
      }
    })
    .join(delimiter);
}

/**
 * An adopted fixture on {@link BRANCH}, committed, its library answering `host` for the host probe;
 * and a case root beside it holding `home/` (with `.ssh/config` and `.netrc`), `state/`, `bin/`
 * (the `bwrap` stub, and with `setsid` its stub) and `out/` (every record).
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
  if (bwrap) await writeFile(join(bin, 'bwrap'), BWRAP_STUB, { mode: 0o755 });
  if (setsid) await writeFile(join(bin, 'setsid'), SETSID_STUB, { mode: 0o755 });

  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, output(init));
  await runGit(dir, ['checkout', '--quiet', '-b', BRANCH]);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: adopt the harness']);
  await appendFile(join(dir, LIB), `\nhr_placeholder_host_probe_var() {\n  HR_PLACEHOLDER_HOST=${host}\n  return 0\n}\n`);

  const env = (extra = {}) => ({
    HOME: home,
    XDG_STATE_HOME: state,
    PATH: `${bin}${delimiter}${bwrap ? process.env.PATH ?? '' : pathWithoutBwrap()}`,
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
    async collect(target) {
      for (let i = 0; i < POLL_LIMIT; i += 1) {
        const r = await runBash(target, [join(target, RUNNER), '--wait', LABEL], env({ RUN_TEST_SUITE_WAIT_SLICE: '1' }), bounded);
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
      const r = await runBash(root, ['-c', `. "$1"; shift; ${fn}`, '_', join(dir, LIB), ...args], env(), bounded);
      assert.equal(r.status, 0, output(r));
      return r.stdout.trim();
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
 * entries and the base profile's credential lists — read with `jq` — and the files as they stand now.
 */
async function expectedVector(f, target, profile) {
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
  if (present(join(target, '.git'))) v.push('--ro-bind', join(target, '.git'), join(target, '.git'));
  const homes = [f.home];
  const other = (await passwdHome(f)).replace(/\/$/, '');
  if (other.startsWith('/') && other.length > 1 && other !== f.home) homes.push(other);
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
    join(target, RUNNER), '--no-detach', LABEL);
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

test('(k) a registered clone takes its protected paths from the per-run profile, and refuses without one', async (t) => {
  const f = await launcherFixture(t);
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
  const profileFile = await f.lib('hr_run_profile_file "$(hr_repo_slug "$1")" "$2"', f.dir, CLONE_BRANCH);
  assert.ok(profileFile.startsWith(`${f.state}/`), profileFile);
  await mkdir(profileFile.slice(0, profileFile.lastIndexOf('/')), { recursive: true });
  await writeFile(profileFile, `${JSON.stringify({ sandbox: { filesystem: { denyWrite: [protectedPath] } } })}\n`);
  const expected = await expectedVector(f, clone, profileFile);

  const r = await f.launch([clone, LABEL]);
  assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
  const verdict = await f.collect(clone);
  assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
  const argv = lines(f.record);
  assert.deepEqual(argv, expected);
  const at = argv.indexOf(protectedPath);
  assert.deepEqual(argv.slice(at - 1, at + 2), ['--ro-bind', protectedPath, protectedPath]);
  await f.until(() => !present(join(clone, STATE_DIR, 'test_run_logs', CLONE_BRANCH, `${LABEL}.running`)), 'the clone run to end');

  await rm(profileFile);
  const refused = await f.launch([clone, 'gates_round_2']);
  assertRefusal(refused, `no per-run profile for '${CLONE_BRANCH}' at ${profileFile}`);
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
