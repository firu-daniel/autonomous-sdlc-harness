/**
 * The sandbox probe's gate-sandbox leg's grading and script functions (`sp__gs1_grade`,
 * `sp__gs2_outside_paths`, `sp__gs2_grade`, `sp__gs3_grade`, `sp__gs4_grade`, `sp__wf5_grade` and
 * `sp__gs_test_script` in `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`).
 *
 * **The rule these tests exist to enforce: a launcher answer other than `pending`, an absent control, or an
 * exit status alone never grades a row `pass`, and the grading reads what reached the disk.** GS2 never
 * passes a path lying inside the target as an outside one, GS4's evidence never quotes a credential, and the
 * worker's script stores every step's reading whole.
 *
 * Each case runs a `bash -c` through `runBash` sourcing `scripts/lib/harness-run-lib.sh` (GS1 reads the done
 * marker through its `hr_lane_mtime`), `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`, `session.sh` and
 * `legs-gate-sandbox.sh`, then sets SP_PLATFORM to `linux`, since `platform.sh` empties it. Fixtures are
 * `mkdtemp`s under `os.tmpdir()`, removed in process when each case ends.
 *
 * Left out deliberately: no case launches a session, the launcher or `bwrap`, so `sp_leg_gate_sandbox`'s
 * wiring is exercised only by a hand-run probe.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = [
  join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh'),
  ...['core.sh', 'platform.sh', 'judge.sh', 'controls.sh', 'session.sh', 'legs-gate-sandbox.sh'].map((f) =>
    join(PROBE_LIB, f),
  ),
];

/** `body` run after sourcing {@link LIBS} with SP_PLATFORM `linux`, its own arguments in `"$@"`. */
function sourced(cwd, body, args = [], env = {}) {
  const script = [
    `for lib in "\${@:1:${LIBS.length}}"; do . "$lib"; done`,
    `shift ${LIBS.length}`,
    "SP_PLATFORM='linux'",
    body,
  ].join('\n');
  return runBash(cwd, ['-c', script, '_', ...LIBS, ...args], { SP_VERSION: '', SP_CURRENT_LEG: '', ...env });
}

async function caseDir(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'harness-sp-gate-sandbox-')));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return dir;
}

/** Runs `fn "$@"` and returns `[SP_VERDICT, SP_EVIDENCE]`. */
async function graded(t, fn, args) {
  const dir = await caseDir(t);
  const run = await sourced(dir, `${fn} "$@"; printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`, args);
  assert.equal(run.status, 0, run.stderr);
  const bar = run.stdout.indexOf('|');
  return [run.stdout.slice(0, bar), run.stdout.slice(bar + 1)];
}

/** A `<parent>/target` and `<parent>/main`, and a home directory outside both. */
async function layout(t) {
  const parent = await caseDir(t);
  const target = join(parent, 'target');
  const main = join(parent, 'main');
  const home = await caseDir(t);
  await mkdir(target);
  await mkdir(main);
  return { parent, target, main, home };
}

/** Runs `sp__gs2_outside_paths` and returns `{ lines, stderr }`. */
async function outsidePaths(t, target, main, home) {
  const run = await sourced(await caseDir(t), 'sp__gs2_outside_paths "$@"', [target, main, home]);
  assert.equal(run.status, 0, run.stderr);
  return { lines: run.stdout.split('\n').filter(Boolean), stderr: run.stderr };
}

test('sp__gs1_grade: pass only on a pending launch whose worker reached a pass after the session', async (t) => {
  const DONE_AT = 2_000_000_000;

  /** A lane holding a verdict file of `verdict` (none when null) and a done marker of mtime {@link DONE_AT}. */
  async function lane(t, verdict) {
    const dir = await caseDir(t);
    const vfile = join(dir, 'sbx_probe_gs.verdict');
    const done = join(dir, 'done');
    if (verdict !== null) await writeFile(vfile, verdict);
    await writeFile(done, '');
    await utimes(done, DONE_AT, DONE_AT);
    return { vfile, done };
  }

  await t.test('in-session: not run, quoting the answer', async (t) => {
    const { vfile, done } = await lane(t, 'pass\n');
    assert.deepEqual(await graded(t, 'sp__gs1_grade', ['in-session', vfile, done, String(DONE_AT - 10)]), [
      'not run',
      "the launcher answered 'in-session', not pending",
    ]);
  });

  await t.test('pending, a pass verdict and a done marker after the session end: pass', async (t) => {
    const { vfile, done } = await lane(t, 'pass\n');
    assert.deepEqual(await graded(t, 'sp__gs1_grade', ['pending', vfile, done, String(DONE_AT - 10)]), [
      'pass',
      'the worker outlived the call and the session: verdict pass, its done marker written 10s after the session ended',
    ]);
  });

  await t.test('pending with no verdict file: fail', async (t) => {
    const { vfile, done } = await lane(t, null);
    assert.deepEqual(await graded(t, 'sp__gs1_grade', ['pending', vfile, done, String(DONE_AT - 10)]), [
      'fail',
      `the launcher answered pending, and the worker did not reach a verdict: no ${vfile}`,
    ]);
  });

  await t.test('pending with a fail verdict: fail, quoting it', async (t) => {
    const { vfile, done } = await lane(t, 'fail /lane/sbx_probe_gs.log\n');
    assert.deepEqual(await graded(t, 'sp__gs1_grade', ['pending', vfile, done, String(DONE_AT - 10)]), [
      'fail',
      `the launcher answered pending, and the worker did not reach a verdict: ${vfile} reads 'fail /lane/sbx_probe_gs.log'`,
    ]);
  });
});

test('sp__gs2_outside_paths: never a path inside the target', async (t) => {
  await t.test('clone-shaped: the home, parent-directory and main-checkout paths', async (t) => {
    const { parent, target, main, home } = await layout(t);
    const { lines, stderr } = await outsidePaths(t, target, main, home);
    assert.deepEqual(lines, [
      join(home, 'sbx_gs2_home.txt'),
      join(parent, 'sbx_gs2_parent.txt'),
      join(main, 'sbx_gs2_main.txt'),
    ]);
    assert.equal(stderr, '');
  });

  await t.test('job-shaped: the main checkout is the target, so its path is dropped', async (t) => {
    const { parent, target, home } = await layout(t);
    const { lines, stderr } = await outsidePaths(t, target, target, home);
    assert.deepEqual(lines, [join(home, 'sbx_gs2_home.txt'), join(parent, 'sbx_gs2_parent.txt')]);
    for (const line of lines) assert.ok(!line.startsWith(`${target}/`), line);
    assert.equal(stderr, `dropped ${join(target, 'sbx_gs2_main.txt')}: inside the target\n`);
  });

  await t.test('a home inside the target is dropped, on stderr', async (t) => {
    const { parent, target, main } = await layout(t);
    const home = join(target, 'home');
    await mkdir(home);
    const { lines, stderr } = await outsidePaths(t, target, main, home);
    assert.ok(!lines.includes(join(home, 'sbx_gs2_home.txt')), lines.join('\n'));
    assert.deepEqual(lines, [join(parent, 'sbx_gs2_parent.txt'), join(main, 'sbx_gs2_main.txt')]);
    assert.equal(stderr, `dropped ${join(home, 'sbx_gs2_home.txt')}: inside the target\n`);
  });
});

test('sp__gs2_grade: read on disk, with the control written', async (t) => {
  /** A control file (absent when `control` is false) and three outside paths, none of them written. */
  async function fixture(t, control = true) {
    const dir = await caseDir(t);
    const ctl = join(dir, 'gs2_control.txt');
    if (control) await writeFile(ctl, 'sandbox probe gate-sandbox control\n');
    const paths = ['sbx_gs2_home.txt', 'sbx_gs2_parent.txt', 'sbx_gs2_main.txt'].map((f) => join(dir, f));
    return { ctl, paths };
  }

  await t.test('the control present, every outside path absent and equal shasums: pass', async (t) => {
    const { ctl, paths } = await fixture(t);
    assert.deepEqual(await graded(t, 'sp__gs2_grade', [ctl, 'aaa', 'aaa', ...paths]), [
      'pass',
      `read on disk with the control written: none of ${paths.join(', ')} exists, and the target's .git/config shasum is unchanged`,
    ]);
  });

  await t.test('one outside path present: fail, naming it', async (t) => {
    const { ctl, paths } = await fixture(t);
    await writeFile(paths[1], 'sbx_gs2\n');
    assert.deepEqual(await graded(t, 'sp__gs2_grade', [ctl, 'aaa', 'aaa', ...paths]), [
      'fail',
      `read on disk, never from an exit status: ${paths[1]} exists`,
    ]);
  });

  await t.test('differing shasums: fail, naming .git/config', async (t) => {
    const { ctl, paths } = await fixture(t);
    assert.deepEqual(await graded(t, 'sp__gs2_grade', [ctl, 'aaa', 'bbb', ...paths]), [
      'fail',
      "read on disk, never from an exit status: the target's .git/config shasum changed",
    ]);
  });

  await t.test('the control absent: not run', async (t) => {
    const { ctl, paths } = await fixture(t, false);
    assert.deepEqual(await graded(t, 'sp__gs2_grade', [ctl, 'aaa', 'aaa', ...paths]), [
      'not run',
      `the worker's control ${ctl} was not written`,
    ]);
  });

  await t.test('job-shaped: a file at <target>/sbx_gs2_main.txt is not an outside path, so pass', async (t) => {
    const { parent, target, home } = await layout(t);
    const ctl = join(target, 'gs2_control.txt');
    await writeFile(ctl, 'sandbox probe gate-sandbox control\n');
    await writeFile(join(target, 'sbx_gs2_main.txt'), 'sbx_gs2\n');
    const run = await sourced(
      parent,
      [
        'ctl="$1"; shift',
        'paths=()',
        'while IFS= read -r p; do [ -n "$p" ] && paths[${#paths[@]}]="$p"; done <<EOF',
        '$(sp__gs2_outside_paths "$@" 2>/dev/null)',
        'EOF',
        'sp__gs2_grade "$ctl" aaa aaa "${paths[@]}"',
        `printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`,
      ].join('\n'),
      [ctl, target, target, home],
    );
    assert.equal(run.status, 0, run.stderr);
    const checked = [join(home, 'sbx_gs2_home.txt'), join(parent, 'sbx_gs2_parent.txt')].join(', ');
    assert.equal(
      run.stdout,
      `pass|read on disk with the control written: none of ${checked} exists, and the target's .git/config shasum is unchanged`,
    );
  });
});

test('sp__gs3_grade: no body and a non-zero curl status, against a control that reached the host', async (t) => {
  const STDERR = [
    'curl: (6) Could not resolve host: example.com',
    'curl: second line of the stored reading',
    'curl: third line of the stored reading',
  ].join('\n');

  /** A body file holding `body`, a status file of `status` and the three-line stderr file. */
  async function records(t, body, status) {
    const dir = await caseDir(t);
    const files = { body: join(dir, 'gs3.body'), status: join(dir, 'gs3.status'), stderr: join(dir, 'gs3.stderr') };
    await writeFile(files.body, body);
    await writeFile(files.status, `${status}\n`);
    await writeFile(files.stderr, `${STDERR}\n`);
    return files;
  }

  await t.test('an empty body, status 6 and control 200: pass, the shortening named as display', async (t) => {
    const f = await records(t, '', 6);
    const [verdict, evidence] = await graded(t, 'sp__gs3_grade', [f.body, f.status, f.stderr, '200']);
    assert.equal(verdict, 'pass');
    assert.equal(
      evidence,
      `no body, curl exited 6, the unsandboxed control answered 200: ${STDERR.split('\n')[0]} ` +
        `(stderr shown to its first line, a display cut only; full text in ${f.stderr})`,
    );
    assert.equal(await readFile(f.stderr, 'utf8'), `${STDERR}\n`);
  });

  await t.test('a non-empty body: fail', async (t) => {
    const f = await records(t, '<html></html>\n', 0);
    const [verdict] = await graded(t, 'sp__gs3_grade', [f.body, f.status, f.stderr, '200']);
    assert.equal(verdict, 'fail');
  });

  await t.test('control 000: not run', async (t) => {
    const f = await records(t, '', 6);
    assert.deepEqual(await graded(t, 'sp__gs3_grade', [f.body, f.status, f.stderr, '000']), [
      'not run',
      "the unsandboxed control reached no host: http code '000'",
    ]);
  });
});

test('sp__gs4_grade: the credential file and names read as absent, never quoted', async (t) => {
  const HOST_TEXT = 'Host sbx-gs4-secret\n  IdentityFile ~/.ssh/sbx_gs4_key\n';

  /** The worker's copy, the host file (absent when null), the env record and the control. */
  async function records(t, { copy = '', host = HOST_TEXT, env = 'GH_TOKEN unset\n', control = '{}\n' } = {}) {
    const dir = await caseDir(t);
    const files = {
      copy: join(dir, 'gs4.ssh'),
      host: join(dir, 'ssh-config'),
      env: join(dir, 'gs4.env'),
      control: join(dir, 'gs4.control'),
    };
    await writeFile(files.copy, copy);
    if (host !== null) await writeFile(files.host, host);
    await writeFile(files.env, env);
    await writeFile(files.control, control);
    return files;
  }
  const args = (f) => [f.copy, f.host, f.env, f.control];

  await t.test('an empty copy, GH_TOKEN unset and a control: pass', async (t) => {
    const f = await records(t);
    assert.deepEqual(await graded(t, 'sp__gs4_grade', args(f)), [
      'pass',
      `the worker read nothing of ${f.host} (its copy of ${f.host} is empty), and 1 envVars name(s) are unset`,
    ]);
  });

  await t.test('a copy equal to the host file: fail, never quoting it', async (t) => {
    const f = await records(t, { copy: HOST_TEXT });
    const [verdict, evidence] = await graded(t, 'sp__gs4_grade', args(f));
    assert.equal(verdict, 'fail');
    assert.ok(!evidence.includes('sbx-gs4-secret'), evidence);
    assert.ok(!evidence.includes('IdentityFile'), evidence);
  });

  await t.test('NPM_TOKEN set: fail, naming NPM_TOKEN only', async (t) => {
    const f = await records(t, { env: 'GH_TOKEN unset\nNPM_TOKEN set\n' });
    assert.deepEqual(await graded(t, 'sp__gs4_grade', args(f)), ['fail', 'set in the worker: NPM_TOKEN']);
  });

  await t.test('the host file absent: not run', async (t) => {
    const f = await records(t, { host: null });
    assert.deepEqual(await graded(t, 'sp__gs4_grade', args(f)), ['not run', `the host has no ${f.host} to read`]);
  });
});

test('sp__gs_test_script: every path quoted once, every reading stored whole', async (t) => {
  const dir = await caseDir(t);
  const target = join(dir, 'target');
  const rec = join(dir, 'records');
  const running = join(dir, 'lane', 'sbx_probe_gs.running');
  const lib = join(dir, 'lib', 'harness-run-lib.sh');
  const probeHome = join(dir, 'probe-home');
  const outside = [join(dir, 'home', 'sbx_gs2_home.txt'), join(dir, 'sbx_gs2_parent.txt')];
  const outsideFile = join(dir, 'gate-sandbox.outside');
  const script = join(dir, 'sbx_gs_test.sh');
  const NAMES = ['GH_TOKEN', 'NPM_TOKEN'];
  await writeFile(outsideFile, `${outside.join('\n')}\n`);

  const run = await sourced(
    dir,
    'sp__gs_test_script "$@"',
    [script, target, rec, running, lib, outsideFile, ...NAMES],
    { HOME: probeHome },
  );
  assert.equal(run.status, 0, run.stderr);
  const text = await readFile(script, 'utf8');
  const count = (needle) => text.split(needle).length - 1;

  await t.test('the written file parses with bash -n', async () => {
    const parse = await runBash(dir, ['-n', script]);
    assert.equal(parse.status, 0, parse.stderr);
  });

  await t.test('each path argument and env name is carried once', async () => {
    for (const value of [target, rec, running, lib, ...outside, ...NAMES]) assert.equal(count(value), 1, value);
  });

  await t.test('one GS2 write per outside-paths line', async () => {
    assert.ok(text.includes(`outside=( ${outside.join(' ')} )\n`), text);
    assert.equal(count('>"$p"'), 1, text);
  });

  await t.test("GS4 reads $HOME at run time, never the probe's own HOME", async () => {
    assert.ok(!text.includes(probeHome), text);
    assert.ok(text.includes('cat "$HOME/.ssh/config"'), text);
  });

  await t.test("each step's whole stderr is stored, with no cut", async () => {
    for (const step of ['wf5_stat', 'gs2_control', 'gs2_out_$n', 'gs2_gitconfig', 'gs3', 'gs4_ssh', 'gs4_control']) {
      assert.ok(text.includes(`2>"$rec/${step}.stderr"`), step);
    }
    assert.ok(!/\bhead\b/.test(text), text);
    assert.ok(!text.includes('sed -n 1p'), text);
    assert.ok(!text.includes("%%$'\\n'*"), text);
  });
});

test('sp__wf5_grade: pass only on an advancing hr_lane_mtime', async (t) => {
  /** Grades a temp file holding `text`, or, with `text` null, a path that does not exist. */
  async function wf5(t, text, kind) {
    const dir = await caseDir(t);
    const file = join(dir, 'sbx_wf5.mtimes');
    if (text !== null) await writeFile(file, text);
    return [file, await graded(t, 'sp__wf5_grade', kind === undefined ? [file] : [file, kind])];
  }

  await t.test('an advancing mtime through the GNU arm: pass', async (t) => {
    const [, r] = await wf5(t, 'stat -f %m: ?\nmtime 100\nmtime 103\n');
    assert.deepEqual(r, [
      'pass',
      "hr_lane_mtime advanced 100..103 in a sandboxed process (stat -f %m gave '?', so the GNU stat -c %Y arm answered)",
    ]);
  });

  await t.test('two equal mtimes: fail', async (t) => {
    const [, r] = await wf5(t, 'stat -f %m: ?\nmtime 100\nmtime 100\n');
    assert.deepEqual(r, ['fail', 'hr_lane_mtime did not advance: 100, then 100']);
  });

  await t.test('a 0: fail, neither stat arm answered', async (t) => {
    const [, r] = await wf5(t, 'stat -f %m: ?\nmtime 0\nmtime 103\n');
    assert.deepEqual(r, ['fail', 'neither stat arm answered: hr_lane_mtime printed 0, then 103']);
  });

  await t.test('a one-line file: not run', async (t) => {
    const [file, r] = await wf5(t, 'mtime 100\n');
    assert.deepEqual(r, ['not run', `the worker did not reach the hr_lane_mtime calls: 1 mtime line(s) in ${file}`]);
  });

  await t.test('a missing file: not run', async (t) => {
    const [file, r] = await wf5(t, null);
    assert.deepEqual(r, ['not run', `the worker did not reach the hr_lane_mtime calls: no ${file}`]);
  });

  await t.test("the launcher's gate-worker kind: pass, naming it", async (t) => {
    const [, r] = await wf5(t, 'stat -f %m: ?\nmtime 100\nmtime 103\n', "the launcher's sandboxed gate-worker");
    assert.deepEqual(r, [
      'pass',
      "hr_lane_mtime advanced 100..103 in the launcher's sandboxed gate-worker process (stat -f %m gave '?', so the GNU stat -c %Y arm answered)",
    ]);
  });
});
