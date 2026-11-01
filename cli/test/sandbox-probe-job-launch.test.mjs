/**
 * The sandbox probe's job-mode mirrors of the watcher's launch line (`scripts/lib/sandbox-probe/session.sh`
 * → `sp_launch_args`, `sp_session`; `scripts/lib/sandbox-probe/job.sh` → `sp_job_add_dirs`,
 * `sp_job_manifest_write`, `sp_job_teardown`), held to `cli/templates/scripts/autonomous-watcher.sh` →
 * `spawn_engine` and `job-sweep`.
 *
 * **The rule these tests exist to enforce: job mode's launch line is the clone layout's plus the watcher's
 * job tail and nothing else; its manifest lists exactly what the watcher's would, at the path the job's
 * sweep reads, and is never written where a session could write it; the sweep is the checkout's own
 * `job-sweep`, run before every manifest write as well as at teardown; and the agent's PID reaches the
 * prompt as a literal.**
 *
 * Each case runs a `bash -c` through `runBash`, sourcing the run library and `core.sh`, `platform.sh`,
 * `judge.sh`, `controls.sh`, `session.sh` and `job.sh` from `WORKSPACE_ROOT`, with the probe's variables
 * set after sourcing because the libraries blank them. Fixtures sit under `os.tmpdir()`, removed in process.
 * The manifest cases point `SP_MAIN` and `SP_SCRIPTS` at an `init`-written fixture (`createWatcherFixture`),
 * because the probe calls that watcher's own `placeholder_manifest_writable_root`.
 *
 * Left out deliberately: no real agent CLI — `SANDBOX_PROBE_AGENT_CLI` is a stub recording its argument
 * vector — and no real placeholder host: `SP_JOB_PLACEHOLDER_HOST` is set by the case, not probed.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash, seedRepository, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const RUN_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh');
const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = [
  RUN_LIB,
  ...['core.sh', 'platform.sh', 'judge.sh', 'controls.sh', 'session.sh', 'job.sh'].map((name) => join(PROBE_LIB, name)),
];
const STATE_DIR = 'harness-runs';
const BRANCH = 'chore_sbx_probe_job_launch';
const PID_TOKEN = '@SP_AGENT_PID@';
const TIMEOUT_MS = scaleBound(60_000);

/** A shell single-quoted literal. */
function q(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * A fresh case directory holding `sp-tmp`, `main` (with its state directory) and `cwd`, removed when the
 * case ends.
 *
 * @param {import('node:test').TestContext} t
 */
async function caseDirs(t) {
  const tmp = realpathSync(await mkdtemp(join(tmpdir(), 'sandbox-probe-job-launch-case-')));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const d = { tmp, spTmp: join(tmp, 'sp-tmp'), main: join(tmp, 'main'), cwd: join(tmp, 'cwd') };
  for (const dir of [d.spTmp, d.main, join(d.main, STATE_DIR), d.cwd]) await mkdir(dir, { recursive: true });
  return d;
}

/** `body` run after sourcing every library, with the probe's directories set from `d`. */
function sourced(d, body, env = {}) {
  const script = [
    'for lib in "$@"; do . "$lib"; done',
    `SP_TMP=${q(d.spTmp)}; SP_CLONE=${q(d.cwd)}; SP_MAIN=${q(d.main)}; SP_STATE_DIR=${q(STATE_DIR)}; SP_BRANCH=${q(BRANCH)}`,
    body,
  ].join('\n');
  return runBash(
    d.tmp,
    ['-c', script, '_', ...LIBS],
    { TMPDIR: d.tmp, SP_VERSION: '', SP_CURRENT_LEG: '', ...env },
    { timeoutMs: TIMEOUT_MS },
  );
}

/** An executable at `path` whose body is `lines`. */
async function writeScript(path, lines) {
  await writeFile(path, `${['#!/usr/bin/env bash', ...lines].join('\n')}\n`, 'utf8');
  await chmod(path, 0o755);
}

function lines(text) {
  return text.split('\n').filter((line) => line !== '');
}

/** The probe's own stderr lines, those carrying its `sandbox-probe: ` prefix. */
function probeLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith('sandbox-probe: '));
}

/** `sp_launch_args` for `d`, one argument per stdout line, then `status=<n>`. */
const LAUNCH_ARGS_BODY = [
  'sp_launch_args "$SP_TMP/settings.json" dontAsk "$SP_CLONE" "$SP_MAIN" "$SP_STATE_DIR"',
  'rc=$?',
  `printf '%s\\n' "\${SP_LAUNCH_ARGS[@]}"`,
  'printf "status=%s\\n" "$rc"',
].join('\n');

/** The clone layout's launch-line flags, as a literal list. */
function cloneLayout(d) {
  return [
    '--settings',
    join(d.spTmp, 'settings.json'),
    '--permission-mode',
    'dontAsk',
    '--add-dir',
    d.cwd,
    '--add-dir',
    `${d.main}/${STATE_DIR}`,
  ];
}

test('the job tail of the launch line', async (t) => {
  await t.test('file order, empty and fixed-directory entries dropped, duplicates kept', async (t) => {
    const d = await caseDirs(t);
    const profile = join(d.tmp, 'base.json');
    await writeFile(
      profile,
      JSON.stringify({ permissions: { additionalDirectories: ['/a', '', d.cwd, `${d.main}/${STATE_DIR}/`, '/b', '/a'] } }),
    );

    const run = await sourced(d, `SP_JOB_MODE=1; SP_JOB_BASE_PROFILE=${q(profile)}\n${LAUNCH_ARGS_BODY}`);

    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(lines(run.stdout), [
      ...cloneLayout(d),
      '--add-dir',
      '/a',
      '--add-dir',
      '/b',
      '--add-dir',
      '/a',
      'status=0',
    ]);
  });

  for (const [label, content] of [
    ['no additionalDirectories key', JSON.stringify({ permissions: { allow: [] } })],
    ['an unparsable profile', '{ "permissions": '],
    ['an absent profile', null],
  ]) {
    await t.test(`${label}: no tail, status 0`, async (t) => {
      const d = await caseDirs(t);
      const profile = join(d.tmp, 'base.json');
      if (content !== null) await writeFile(profile, content);

      const run = await sourced(d, `SP_JOB_MODE=1; SP_JOB_BASE_PROFILE=${q(profile)}\n${LAUNCH_ARGS_BODY}`);

      assert.equal(run.status, 0, run.stderr);
      assert.deepEqual(lines(run.stdout), [...cloneLayout(d), 'status=0']);
    });
  }

  await t.test('SP_JOB_MODE=0: byte-identical to the clone layout', async (t) => {
    const d = await caseDirs(t);
    const profile = join(d.tmp, 'base.json');
    await writeFile(profile, JSON.stringify({ permissions: { additionalDirectories: ['/a', '/b'] } }));

    const run = await sourced(d, `SP_JOB_MODE=0; SP_JOB_BASE_PROFILE=${q(profile)}\n${LAUNCH_ARGS_BODY}`);

    assert.equal(run.status, 0, run.stderr);
    assert.equal(
      run.stdout,
      [
        '--settings',
        `${d.spTmp}/settings.json`,
        '--permission-mode',
        'dontAsk',
        '--add-dir',
        d.cwd,
        '--add-dir',
        `${d.main}/harness-runs`,
        'status=0',
        '',
      ].join('\n'),
    );
  });
});

test('the job-mode placeholder manifest', async (t) => {
  /**
   * A profile denying one present and two absent paths, and two add-dir roots, the first holding a
   * `.mcp.json`; `w` is the watcher fixture whose scripts directory is `SP_SCRIPTS`, `null` when its
   * helper skipped the case.
   */
  async function manifestFixture(t) {
    const w = await createWatcherFixture(t);
    if (w === null) return null;
    const d = await caseDirs(t);
    const present = join(d.tmp, 'present.txt');
    const absentOne = join(d.tmp, 'absent-one.txt');
    const absentTwo = join(d.tmp, 'absent-two.txt');
    await writeFile(present, 'here\n');
    const profile = join(d.tmp, 'base.json');
    await writeFile(profile, JSON.stringify({ sandbox: { filesystem: { denyWrite: [absentOne, present, absentTwo] } } }));
    const rootA = join(d.tmp, 'root-a');
    const rootB = join(d.tmp, 'root-b');
    await mkdir(rootA);
    await mkdir(rootB);
    await writeFile(join(rootA, '.mcp.json'), '{}\n');
    return { w, d, profile, rootA, rootB, absentOne, absentTwo, scripts: join(w.dir, INIT_SCRIPTS_DIR) };
  }

  const write = (m, runnerTemp, { jobMode = 1, host = 1, scripts = m.scripts } = {}) =>
    sourced(
      m.d,
      [
        `SP_MAIN=${q(m.w.dir)}; SP_SCRIPTS=${q(scripts)}`,
        `SP_JOB_MODE=${jobMode}; SP_JOB_PLACEHOLDER_HOST=${host}; SP_JOB_RUNNER_TEMP=${q(runnerTemp)}`,
        `sp_job_manifest_write ${q(m.profile)} ${q(m.rootA)} ${q(m.rootB)}`,
        'printf "status=%s\\n" "$?"',
      ].join('\n'),
      m.w.watcherEnv(),
    );
  const manifestAt = (runnerTemp) => join(runnerTemp, 'autonomous-sdlc-harness-placeholders', `${BRANCH}.absent`);
  /** The probe's lines less the pre-session sweep's, which the real watcher's `job-sweep` produces. */
  const manifestLines = (stderr) =>
    probeLines(stderr).filter((l) => !l.startsWith('sandbox-probe: job-sweep before this session: '));

  await t.test('lists exactly the absent deny paths and the absent .mcp.json', async (t) => {
    const m = await manifestFixture(t);
    if (m === null) return;
    const rt = join(m.d.tmp, 'runner-temp');

    const run = await write(m, rt);

    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'status=0\n');
    assert.deepEqual(manifestLines(run.stderr), [], run.stderr);
    assert.equal(
      readFileSync(manifestAt(rt), 'utf8'),
      `${m.absentOne}\n${m.absentTwo}\n${join(m.rootB, '.mcp.json')}\n`,
    );
  });

  await t.test('a runner temp under a root: no file, one line saying so', async (t) => {
    const m = await manifestFixture(t);
    if (m === null) return;
    const rt = join(m.rootB, 'runner-temp');

    const run = await write(m, rt);

    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(manifestLines(run.stderr), [
      `sandbox-probe: placeholder manifest: not writing ${manifestAt(rt)}, under the session-writable root ${m.rootB} — the sweep removes nothing for this session`,
    ]);
    assert.ok(!existsSync(manifestAt(rt)), 'no manifest is written');
    assert.ok(!existsSync(rt), 'nothing is created under the root');
  });

  await t.test('no watcher under SP_SCRIPTS: no file, one line saying so', async (t) => {
    const m = await manifestFixture(t);
    if (m === null) return;
    const rt = join(m.d.tmp, 'runner-temp');
    const scripts = join(m.d.tmp, 'no-watcher');
    await mkdir(scripts);

    const run = await write(m, rt, { scripts });

    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'status=0\n');
    assert.deepEqual(manifestLines(run.stderr), [
      'sandbox-probe: job-sweep before this session exited 127',
      `sandbox-probe: placeholder manifest: not writing ${manifestAt(rt)}, the watcher's placeholder_manifest_writable_root could not be called from ${scripts}/autonomous-watcher.sh — the sweep removes nothing for this session`,
    ]);
    assert.ok(!existsSync(manifestAt(rt)), 'no manifest is written');
  });

  await t.test('a placeholder an earlier session left is swept and listed again', async (t) => {
    const m = await manifestFixture(t);
    if (m === null) return;
    const rt = join(m.d.tmp, 'runner-temp');
    const call = `sp_job_manifest_write ${q(m.profile)} ${q(m.rootA)} ${q(m.rootB)}`;

    const run = await sourced(
      m.d,
      [
        `SP_MAIN=${q(m.w.dir)}; SP_SCRIPTS=${q(m.scripts)}`,
        `SP_JOB_MODE=1; SP_JOB_PLACEHOLDER_HOST=1; SP_JOB_RUNNER_TEMP=${q(rt)}`,
        call,
        // Read-only: hr_placeholder_leftover_var sweeps only a 0-byte file with no write bit.
        `: > ${q(m.absentOne)} && chmod 444 ${q(m.absentOne)}`,
        call,
        'printf "status=%s\\n" "$?"',
      ].join('\n'),
      m.w.watcherEnv(),
    );

    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'status=0\n');
    assert.ok(!existsSync(m.absentOne), `the earlier session's placeholder is swept\n${run.stderr}`);
    assert.equal(lines(readFileSync(manifestAt(rt), 'utf8'))[0], m.absentOne);
  });

  for (const [label, flags] of [
    ['SP_JOB_PLACEHOLDER_HOST=0', { host: 0 }],
    ['SP_JOB_MODE=0', { jobMode: 0 }],
  ]) {
    await t.test(`${label}: no file, no output`, async (t) => {
      const m = await manifestFixture(t);
      if (m === null) return;
      const rt = join(m.d.tmp, 'runner-temp');

      const run = await write(m, rt, flags);

      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, 'status=0\n');
      assert.equal(run.stderr, '');
      assert.ok(!existsSync(rt), 'nothing is created');
    });
  }
});

test("teardown runs the checkout's own job-sweep", async (t) => {
  /** A seeded `SP_MAIN` and an `SP_SCRIPTS` whose watcher stub records its call and exits `STUB_EXIT`. */
  async function sweepFixture(t) {
    const d = await caseDirs(t);
    await seedRepository(d.main, { remote: false });
    const scripts = join(d.tmp, 'scripts');
    const record = join(d.tmp, 'record');
    await mkdir(scripts);
    await writeScript(join(scripts, 'autonomous-watcher.sh'), [
      `{ printf 'args=%s\\n' "$*"; printf 'HARNESS_JOB_MODE=%s\\n' "\${HARNESS_JOB_MODE-unset}"; printf 'RUNNER_TEMP=%s\\n' "\${RUNNER_TEMP-unset}"; printf 'pwd=%s\\n' "$(pwd -P)"; } > ${q(record)}`,
      "printf 'swept one\\n'",
      "printf 'swept two\\n'",
      'exit "${STUB_EXIT:-0}"',
    ]);
    return { d, scripts, record, rt: join(d.tmp, 'runner-temp') };
  }

  const teardown = (s, stubExit) =>
    sourced(
      s.d,
      [
        `SP_JOB_MODE=1; SP_SCRIPTS=${q(s.scripts)}; SP_JOB_RUNNER_TEMP=${q(s.rt)}; SP__JOB_SETUP_RAN=1; SP__JOB_SWITCHED=0`,
        'sp_job_teardown',
        'printf "status=%s SP_EXIT=%s\\n" "$?" "$SP_EXIT"',
      ].join('\n'),
      { STUB_EXIT: String(stubExit) },
    );

  await t.test('the stub exiting 0', async (t) => {
    const s = await sweepFixture(t);

    const run = await teardown(s, 0);

    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'status=0 SP_EXIT=0\n');
    assert.deepEqual(lines(readFileSync(s.record, 'utf8')), [
      `args=job-sweep ${BRANCH}`,
      'HARNESS_JOB_MODE=1',
      `RUNNER_TEMP=${s.rt}`,
      `pwd=${s.d.main}`,
    ]);
    assert.deepEqual(probeLines(run.stderr), [
      'sandbox-probe: job-sweep: swept one',
      'sandbox-probe: job-sweep: swept two',
      'sandbox-probe: job-sweep: exit 0; git status after the sweep: clean',
    ]);
  });

  await t.test('the stub exiting 3 raises SP_EXIT to 5', async (t) => {
    const s = await sweepFixture(t);

    const run = await teardown(s, 3);

    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'status=0 SP_EXIT=5\n');
    assert.deepEqual(probeLines(run.stderr), [
      'sandbox-probe: job-sweep: swept one',
      'sandbox-probe: job-sweep: swept two',
      'sandbox-probe: job-sweep: exit 3; git status after the sweep: clean',
      `sandbox-probe: teardown: the job-sweep of '${BRANCH}' exited 3`,
    ]);
  });
});

test('the agent PID token', async (t) => {
  /** A case whose agent stub records its PID, prompt, `--allowedTools` and `--add-dir` values under `$STUB_OUT`. */
  async function agentFixture(t) {
    const d = await caseDirs(t);
    const stub = join(d.tmp, 'agent-stub.sh');
    await writeScript(stub, [
      'out="$STUB_OUT"',
      'mkdir -p "$out"',
      `printf '%s\\n' "$$" >"$out/pid"`,
      ': >"$out/allowed"',
      ': >"$out/add-dirs"',
      'while [ $# -gt 0 ]; do',
      '  case "$1" in',
      `    -p) printf '%s' "$2" >"$out/prompt"; shift 2 ;;`,
      `    --allowedTools) printf '%s\\n' "$2" >>"$out/allowed"; shift 2 ;;`,
      `    --add-dir) printf '%s\\n' "$2" >>"$out/add-dirs"; shift 2 ;;`,
      '    *) shift ;;',
      '  esac',
      'done',
      'exit 0',
    ]);
    await writeFile(join(d.spTmp, 'settings.json'), '{}\n');
    return { d, stub };
  }

  const session = (a, name, out, prompt, allowed, pre = '') =>
    sourced(
      a.d,
      [
        pre,
        `printf '%s' ${q(prompt)} >"$SP_TMP/${name}.prompt"`,
        `export STUB_OUT=${q(out)}`,
        `sp_session ${name} "$SP_TMP/settings.json" "$SP_TMP/${name}.prompt"${allowed.map((rule) => ` --allowed ${q(rule)}`).join('')}`,
        'printf "status=%s\\n" "$?"',
      ].join('\n'),
      { SANDBOX_PROBE_AGENT_CLI: a.stub },
    );

  await t.test('the token becomes the agent CLI’s own PID', async (t) => {
    const a = await agentFixture(t);
    const out = join(a.d.tmp, 'out-token');
    const prompt = `Signal ${PID_TOKEN} with $HOME & \\n, then stop.`;

    const run = await session(a, 'token', out, prompt, [`Bash(kill -0 ${PID_TOKEN})`]);

    assert.equal(run.stdout, 'status=0\n', run.stderr);
    const pid = readFileSync(join(out, 'pid'), 'utf8').trim();
    assert.match(pid, /^[0-9]+$/);
    assert.equal(readFileSync(join(out, 'prompt'), 'utf8'), `Signal ${pid} with $HOME & \\n, then stop.`);
    assert.equal(readFileSync(join(out, 'allowed'), 'utf8'), `Bash(kill -0 ${pid})\n`);
    assert.equal(readFileSync(join(a.d.spTmp, 'token.agent-pid'), 'utf8'), `${pid}\n`);
  });

  await t.test('no token: the prompt passes byte for byte', async (t) => {
    const a = await agentFixture(t);
    const out = join(a.d.tmp, 'out-plain');
    const prompt = 'Run $HOME & \\n, @SP_AGENT_PI D@ — then stop.';

    const run = await session(a, 'plain', out, prompt, ['Bash(true)']);

    assert.equal(run.stdout, 'status=0\n', run.stderr);
    assert.equal(readFileSync(join(out, 'prompt'), 'utf8'), prompt);
    assert.equal(readFileSync(join(out, 'allowed'), 'utf8'), 'Bash(true)\n');
    assert.ok(!existsSync(join(a.d.spTmp, 'plain.agent-pid')), 'no PID file without a token');
  });

  await t.test("job mode: the fixed two --add-dir values, then the profile's", async (t) => {
    const a = await agentFixture(t);
    const out = join(a.d.tmp, 'out-job');
    const profile = join(a.d.tmp, 'base.json');
    await writeFile(profile, JSON.stringify({ permissions: { additionalDirectories: ['/a', a.d.cwd, '/b'] } }));

    const run = await session(
      a,
      'job',
      out,
      'Stop.',
      [],
      `SP_JOB_MODE=1; SP_JOB_PLACEHOLDER_HOST=0; SP_JOB_BASE_PROFILE=${q(profile)}`,
    );

    assert.equal(run.stdout, 'status=0\n', run.stderr);
    assert.deepEqual(lines(readFileSync(join(out, 'add-dirs'), 'utf8')), [
      a.d.cwd,
      `${a.d.main}/${STATE_DIR}`,
      '/a',
      '/b',
    ]);
  });
});
