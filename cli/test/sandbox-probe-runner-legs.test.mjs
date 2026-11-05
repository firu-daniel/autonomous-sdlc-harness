/**
 * The sandbox probe's runner legs: the runner controls file and the runner stamp (`sp_runner_controls_read`,
 * `sp_runner_control`, `sp_runner_stamp` in `legs-runner.sh`), the IS1–IS4 grades (`sp__is1_grade` …
 * `sp__is4_grade`, same file), the PN1–PN3 and NN1–NN2 grades (`legs-runner-isolation.sh`) and N4's runner
 * arm (`sp__net_n4_grade`'s fifth argument in `legs-network.sh`).
 *
 * **The rule these tests exist to enforce: the controls file is read whole, and an absent key is
 * `unrecorded`, never a guess; the stamp names the image; every grade passes only on the reading it names,
 * fails only on the one that shows the leak or the missing package, and is `not run` for a permission-layer
 * refusal (PD9), a failed control, an absent canary or an unrecorded key; N4's runner arm follows the
 * prompt's rule, and the clone-layout N4 grade is byte-for-byte unchanged without the fifth argument.
 * PD31: no runner-pid or runner-privs prompt or allow rule names a `/proc` path — each read is `bash <file>`
 * on a file the probe wrote, sp_session's `--token-file` puts the agent PID into it, the grades quote the
 * `/proc` path, and a script path already present is left alone.**
 *
 * Left out deliberately: no session, sudo or `/proc` read is real — every stream is a fixture under
 * `fixtures/sandbox-probe/`, or one of them with its command rewritten to `bash <file>`, and the PD31 legs
 * run under an agent-CLI stub (`SANDBOX_PROBE_AGENT_CLI`) that records its arguments and the script files. Each case runs a `bash -c` through `runBash` sourcing `core.sh`, `platform.sh`,
 * `judge.sh`, `controls.sh`, `session.sh`, `legs-network.sh`, `legs-runner.sh` and
 * `legs-runner-isolation.sh` from `WORKSPACE_ROOT/scripts/lib/sandbox-probe/`, with `SP_PLATFORM` set to
 * `linux`. PIDs `123` (the agent CLI) and `456` (the probe) are fixture literals.
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = [
  'core.sh',
  'platform.sh',
  'judge.sh',
  'controls.sh',
  'session.sh',
  'legs-network.sh',
  'legs-runner.sh',
  'legs-runner-isolation.sh',
];
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

const AGENT_PID = '123';
const PROBE_PID = '456';
const PN_CMD = `grep -a -c SBX_PROBE_CANARY= /proc/${AGENT_PID}/environ`;
const LS_CMD = 'ls /proc';
const SUDO_CMD = 'sudo -n true';
const NNP_CMD = 'grep NoNewPrivs /proc/self/status';
const N4_CMD = 'curl -sS --max-time 5 http://169.254.169.254/';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const VERDICT = 'printf \'%s|%s\' "$SP_VERDICT" "$SP_EVIDENCE"';

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-runner-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** `body` run after sourcing every library in LIBS and setting SP_PLATFORM=linux, its own arguments in `"$@"`. */
async function sourced(t, body, args) {
  const libs = LIBS.map((f) => join(PROBE_LIB, f));
  const script = `while [ "$1" != -- ]; do . "$1"; shift; done; shift; SP_PLATFORM=linux; ${body}`;
  return runBash(await caseDir(t), ['-c', script, '_', ...libs, '--', ...args], { SP_VERSION: '' });
}

/** Runs `fn "$@"` and returns `<SP_VERDICT>|<SP_EVIDENCE>`. */
async function graded(t, fn, args) {
  const run = await sourced(t, `${fn} "$@"; ${VERDICT}`, args);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

/** A controls file in a fresh case directory holding `lines` joined by newlines; returns its path. */
async function controlsFile(t, lines) {
  const path = join(await caseDir(t), 'runner-controls.tsv');
  await writeFile(path, lines.length === 0 ? '' : `${lines.join('\n')}\n`, 'utf8');
  return path;
}

/** Every key of the closed set, in the workflow's order, each with a value. */
const FULL = [
  ['image-os', 'ubuntu24'],
  ['image-version', '20261020.1.0'],
  ['uname-r', '6.8.0-1015-azure'],
  ['probe-commit', '9cd826bc'],
  ['cli-version', '0.9.0'],
  ['sysctl-before', '1'],
  ['apparmor-profile-before', 'absent'],
  ['bwrap-before', 'absent'],
  ['socat-before', 'absent'],
  ['sudo-control', 'exit 0'],
  ['imds-control', 'no answer: curl exit 28'],
  ['sysctl-after', '1'],
  ['apparmor-profile-after', 'present'],
  ['bwrap-after', '/usr/bin/bwrap'],
  ['socat-after', '/usr/bin/socat'],
  ['bwrap-version', 'bubblewrap 0.9.0'],
  ['bwrap-start', 'exit 1: bwrap: setting up uid map: Permission denied'],
  ['ssh-config', 'created'],
];
const tsv = (pairs) => pairs.map(([k, v]) => `${k}\t${v}`);
const without = (key) => FULL.filter(([k]) => k !== key);

/** Reads `file`, then prints `read <status>` and one `<key>=<value>|<status>` line per key. */
const READ_BACK =
  'sp_runner_controls_read "$1"; r=$?; shift; printf "read %s\\n" "$r"; ' +
  'for k in "$@"; do v="$(sp_runner_control "$k")"; s=$?; printf "%s=%s|%s\\n" "$k" "$v" "$s"; done';

async function readBack(t, file, keys) {
  const run = await sourced(t, READ_BACK, [file, ...keys]);
  assert.equal(run.status, 0, run.stderr);
  return run;
}

test('the runner controls file and the stamp', async (t) => {
  await t.test('a file with every key reads back each value whole, spaces included', async (t) => {
    const run = await readBack(
      t,
      await controlsFile(t, tsv(FULL)),
      FULL.map(([k]) => k),
    );
    assert.equal(run.stdout, `read 0\n${FULL.map(([k, v]) => `${k}=${v}|0\n`).join('')}`);
    assert.equal(run.stderr, '');
  });

  await t.test('an unknown key is ignored and a repeated key keeps its last value', async (t) => {
    const file = await controlsFile(t, [
      ...tsv(without('sudo-control')),
      'colour\tblue',
      'sudo-control\texit 1',
      'sudo-control\texit 0',
    ]);
    const run = await readBack(t, file, ['colour', 'sudo-control']);
    assert.equal(run.stdout, 'read 0\ncolour=unrecorded|1\nsudo-control=exit 0|0\n');
  });

  await t.test('an absent key prints unrecorded with status 1', async (t) => {
    const run = await readBack(t, await controlsFile(t, tsv(without('ssh-config'))), ['ssh-config', 'image-os']);
    assert.equal(run.stdout, 'read 0\nssh-config=unrecorded|1\nimage-os=ubuntu24|0\n');
  });

  await t.test('with no file read, every key is unrecorded with status 1', async (t) => {
    const run = await sourced(t, 'v="$(sp_runner_control image-os)"; printf "%s|%s" "$v" "$?"', []);
    assert.equal(run.stdout, 'unrecorded|1');
  });

  for (const [name, lines] of [
    ['an empty file', []],
    ['a file with no tab', ['image-os ubuntu24', 'uname-r 6.8.0-1015-azure']],
  ]) {
    await t.test(`${name} makes sp_runner_controls_read return 1, and nothing is read`, async (t) => {
      const file = await controlsFile(t, lines);
      const run = await readBack(t, file, ['image-os']);
      assert.equal(run.stdout, 'read 1\nimage-os=unrecorded|1\n');
      assert.equal(
        run.stderr,
        `sandbox-probe: the runner controls file '${file}' holds no <key><tab><value> line\n`,
      );
    });
  }

  await t.test('a missing file makes sp_runner_controls_read return 1', async (t) => {
    const file = join(await caseDir(t), 'absent.tsv');
    const run = await readBack(t, file, []);
    assert.equal(run.stdout, 'read 1\n');
    assert.equal(run.stderr, `sandbox-probe: the runner controls file '${file}' is not readable\n`);
  });

  const STAMP = 'sp_runner_controls_read "$1"; sp_runner_stamp';
  const stampLines = (values) =>
    ['image-os', 'image-version', 'uname-r', 'bwrap-version', 'probe-commit', 'cli-version']
      .map((k) => `sandbox-probe: stamp: runner ${k}: ${values[k]}\n`)
      .join('');
  const FULL_VALUES = Object.fromEntries(FULL);

  await t.test('sp_runner_stamp prints the six lines in order', async (t) => {
    const run = await sourced(t, STAMP, [await controlsFile(t, tsv(FULL))]);
    assert.equal(run.status, 0);
    assert.equal(run.stdout, '');
    assert.equal(run.stderr, stampLines(FULL_VALUES));
  });

  await t.test('sp_runner_stamp prints an absent key as unrecorded', async (t) => {
    const run = await sourced(t, STAMP, [await controlsFile(t, tsv(without('probe-commit')))]);
    assert.equal(run.stderr, stampLines({ ...FULL_VALUES, 'probe-commit': 'unrecorded' }));
  });

  await t.test('sp_runner_stamp prints nothing when no file was read', async (t) => {
    const run = await sourced(t, 'sp_runner_stamp; printf %s "$?"', []);
    assert.equal(run.stdout, '0');
    assert.equal(run.stderr, '');
  });
});

test('IS1–IS4', async (t) => {
  /** Each position of `base` replaced by `unrecorded` in turn gives `not run` naming that position's key. */
  async function unrecordedEach(t, fn, base, keys) {
    for (const [i, key] of keys.entries()) {
      const args = base.map((v, j) => (j === i ? 'unrecorded' : v));
      assert.equal(await graded(t, fn, args), `not run|the runner controls file records no ${key}`, key);
    }
  }

  await t.test('IS1 records the sysctl it read and has no fail arm', async (t) => {
    assert.equal(
      await graded(t, 'sp__is1_grade', ['1']),
      'pass|kernel.apparmor_restrict_unprivileged_userns before the install step: 1',
    );
    assert.equal(
      await graded(t, 'sp__is1_grade', ['absent']),
      'pass|kernel.apparmor_restrict_unprivileged_userns before the install step: absent',
    );
    await unrecordedEach(t, 'sp__is1_grade', ['1'], ['sysctl-before']);
  });

  const IS2_BASE = ['absent', '/usr/bin/socat', '/usr/bin/bwrap', '/usr/bin/socat', 'bubblewrap 0.9.0'];
  const IS2_KEYS = ['bwrap-before', 'socat-before', 'bwrap-after', 'socat-after', 'bwrap-version'];

  await t.test('IS2 passes with both on PATH after the step', async (t) => {
    assert.equal(
      await graded(t, 'sp__is2_grade', IS2_BASE),
      'pass|bwrap installed by the step at /usr/bin/bwrap; socat already at /usr/bin/socat, at /usr/bin/socat after the step; bwrap --version: bubblewrap 0.9.0',
    );
  });

  await t.test('IS2 fails only on a package absent after the step', async (t) => {
    assert.equal(
      await graded(t, 'sp__is2_grade', ['absent', 'absent', '/usr/bin/bwrap', 'absent', 'bubblewrap 0.9.0']),
      'fail|socat absent from PATH after the install step (bwrap-after: /usr/bin/bwrap; socat-after: absent)',
    );
    assert.equal(
      await graded(t, 'sp__is2_grade', ['absent', 'absent', 'absent', 'absent', 'absent']),
      'fail|bwrap and socat absent from PATH after the install step (bwrap-after: absent; socat-after: absent)',
    );
  });

  await t.test('IS2 is not run on a reading that is neither a path nor absent, or an unrecorded key', async (t) => {
    assert.equal(
      await graded(t, 'sp__is2_grade', ['absent', 'absent', 'bwrap', '/usr/bin/socat', 'bubblewrap 0.9.0']),
      "not run|neither a path nor absent: bwrap-after 'bwrap'",
    );
    await unrecordedEach(t, 'sp__is2_grade', IS2_BASE, IS2_KEYS);
    assert.equal(
      await graded(t, 'sp__is2_grade', ['unrecorded', '/usr/bin/socat', '/usr/bin/bwrap', 'unrecorded', 'x']),
      'not run|the runner controls file records no bwrap-before, socat-after',
    );
  });

  await t.test("IS3's three consistent pairs pass", async (t) => {
    assert.equal(
      await graded(t, 'sp__is3_grade', ['1', 'absent', 'present']),
      'pass|written: the sysctl read 1 and the step wrote /etc/apparmor.d/bwrap',
    );
    assert.equal(
      await graded(t, 'sp__is3_grade', ['1', 'present', 'present']),
      'pass|not needed: /etc/apparmor.d/bwrap was present before the install step (sysctl: 1)',
    );
    assert.equal(
      await graded(t, 'sp__is3_grade', ['0', 'absent', 'absent']),
      'pass|not needed: the sysctl read 0, and the step wrote no /etc/apparmor.d/bwrap',
    );
  });

  await t.test('IS3 fails on 1 absent absent', async (t) => {
    assert.equal(
      await graded(t, 'sp__is3_grade', ['1', 'absent', 'absent']),
      'fail|the sysctl read 1 before the install step and /etc/apparmor.d/bwrap is absent after it (before: absent)',
    );
  });

  await t.test('IS3 grades a profile carrying no userns rule by what the step must do with it', async (t) => {
    assert.equal(
      await graded(t, 'sp__is3_grade', ['1', 'present without userns', 'present']),
      'pass|written: the sysctl read 1 and the step rewrote /etc/apparmor.d/bwrap, which carried no userns rule',
    );
    assert.equal(
      await graded(t, 'sp__is3_grade', ['1', 'present without userns', 'present without userns']),
      'fail|the sysctl read 1 before the install step and /etc/apparmor.d/bwrap is present without userns after it (before: present without userns)',
    );
    assert.equal(
      await graded(t, 'sp__is3_grade', ['0', 'present without userns', 'present without userns']),
      'pass|not needed: the sysctl read 0, and /etc/apparmor.d/bwrap was present before the install step, carrying no userns rule',
    );
  });

  await t.test('IS3 is not run where no rule fits, or on an unrecorded key', async (t) => {
    assert.equal(
      await graded(t, 'sp__is3_grade', ['0', 'present', 'absent']),
      "not run|no rule fits sysctl-before '0', apparmor-profile-before 'present', apparmor-profile-after 'absent'",
    );
    await unrecordedEach(
      t,
      'sp__is3_grade',
      ['1', 'absent', 'present'],
      ['sysctl-before', 'apparmor-profile-before', 'apparmor-profile-after'],
    );
  });

  const PREREQ_PASS = 'PASS  sandbox-prerequisites  ok';

  await t.test('IS4 passes on exit 0 with a PASS prerequisites line', async (t) => {
    assert.equal(
      await graded(t, 'sp__is4_grade', ['exit 0', PREREQ_PASS]),
      `pass|bwrap starts as the runner user (exit 0), and doctor --remote-job: ${PREREQ_PASS}`,
    );
  });

  await t.test('IS4 fails on a bwrap that does not start', async (t) => {
    assert.equal(
      await graded(t, 'sp__is4_grade', ['exit 1: bwrap: setting up uid map: Permission denied', PREREQ_PASS]),
      'fail|bwrap does not start as the runner user: exit 1: bwrap: setting up uid map: Permission denied',
    );
  });

  await t.test('IS4 is not run with no or a failing prerequisites line, or on an unrecorded key', async (t) => {
    assert.equal(
      await graded(t, 'sp__is4_grade', ['exit 0', '']),
      'not run|doctor --remote-job printed no sandbox-prerequisites line (bwrap-start: exit 0)',
    );
    const failLine = '!! FAIL  sandbox-prerequisites  bwrap missing';
    assert.equal(
      await graded(t, 'sp__is4_grade', ['exit 0', failLine]),
      `not run|no rule fits bwrap-start 'exit 0' with the sandbox-prerequisites line: ${failLine}`,
    );
    await unrecordedEach(t, 'sp__is4_grade', ['exit 0', PREREQ_PASS], ['bwrap-start', 'sandbox-prerequisites line']);
  });

  await t.test('the runner-install leg prints an unrecorded key as its row not run', async (t) => {
    const file = await controlsFile(t, tsv(without('bwrap-start')));
    const run = await sourced(
      t,
      `SP_JOB_MODE=1; SP_JOB_PREREQ_LINE='${PREREQ_PASS}'; sp_runner_controls_read "$1"; sp_leg_runner_install`,
      [file],
    );
    assert.equal(run.status, 0, run.stderr);
    const line = (row, result, evidence) =>
      `leg="runner-install" row="${row}" result="${result}" evidence="${evidence}" departure="none" claude="unknown"\n`;
    assert.equal(
      run.stdout,
      line('IS1', 'pass', 'kernel.apparmor_restrict_unprivileged_userns before the install step: 1') +
        line(
          'IS2',
          'pass',
          'bwrap installed by the step at /usr/bin/bwrap; socat installed by the step at /usr/bin/socat; bwrap --version: bubblewrap 0.9.0',
        ) +
        line('IS3', 'pass', 'written: the sysctl read 1 and the step wrote /etc/apparmor.d/bwrap') +
        line('IS4', 'not run', 'the runner controls file records no bwrap-start'),
    );
  });

  await t.test('the runner-install leg with no controls file is not run on every row', async (t) => {
    const run = await sourced(t, 'SP_JOB_MODE=1; sp_leg_runner_install', []);
    assert.equal(run.status, 0, run.stderr);
    const rows = run.stdout.trimEnd().split('\n');
    assert.deepEqual(
      rows.map((l) => /row="([^"]+)" result="([^"]+)"/.exec(l).slice(1).join(' ')),
      ['IS1 not run', 'IS2 not run', 'IS3 not run', 'IS4 not run'],
    );
    for (const l of rows) assert.match(l, /evidence="no runner controls file: /);
  });
});

test('PN1–PN3 and NN1–NN2', async (t) => {
  const pn = (t, stream) => graded(t, 'sp__pn_read_grade', [fixture(stream), PN_CMD]);
  const PERMISSION_NOT_RUN = `not run|refused at the permission layer, so the call never reached the sandbox: ${DONT_ASK}`;

  await t.test('a count of 1 fails, carrying the count and never a variable', async (t) => {
    const out = await pn(t, 'runner-pn-count');
    assert.equal(out, `fail|the canary was readable in /proc/${AGENT_PID}/environ (count 1)`);
    assert.doesNotMatch(out, /SBX_PROBE_CANARY|=/);
  });

  await t.test('No such file or directory passes', async (t) => {
    assert.equal(
      await pn(t, 'runner-pn-absent'),
      `pass|the process is not visible from the call: grep: /proc/${AGENT_PID}/environ: No such file or directory`,
    );
  });

  await t.test('Permission denied passes', async (t) => {
    assert.equal(
      await pn(t, 'runner-pn-denied'),
      `pass|its environ is not readable from the call: grep: /proc/${AGENT_PID}/environ: Permission denied`,
    );
  });

  await t.test('a count of 0 is not run', async (t) => {
    assert.equal(
      await pn(t, 'runner-pn-zero'),
      `not run|the environ was readable but the canary was not in it, so the read proves nothing (/proc/${AGENT_PID}/environ: count 0)`,
    );
  });

  await t.test("a don't-ask refusal is not run", async (t) => {
    assert.equal(await pn(t, 'runner-pn-permission'), PERMISSION_NOT_RUN);
  });

  await t.test('the runner-pid leg with no canary is not run on every row, launching nothing', async (t) => {
    const run = await sourced(t, 'unset SBX_PROBE_CANARY; SP_JOB_MODE=1; sp_leg_runner_pid', []);
    assert.equal(run.status, 0, run.stderr);
    const tail = 'evidence="the workflow set no canary (SBX_PROBE_CANARY)" departure="none" claude="unknown"';
    assert.equal(
      run.stdout,
      ['PN1', 'PN2', 'PN3'].map((row) => `leg="runner-pid" row="${row}" result="not run" ${tail}\n`).join(''),
    );
  });

  const pn3 = (t, stream) => graded(t, 'sp__pn3_grade', [fixture(stream), LS_CMD, AGENT_PID, PROBE_PID]);

  await t.test("ls /proc holding the probe's PID fails", async (t) => {
    assert.equal(await pn3(t, 'runner-pn3-probe'), `fail|ls /proc in the call lists the probe's PID ${PROBE_PID}`);
  });

  await t.test('ls /proc holding neither PID passes', async (t) => {
    assert.equal(
      await pn3(t, 'runner-pn3-neither'),
      `pass|ls /proc in the call lists neither ${AGENT_PID} nor ${PROBE_PID}, among 3 numeric entries`,
    );
  });

  const nn1 = (t, stream, control) => graded(t, 'sp__nn1_grade', [fixture(stream), SUDO_CMD, control]);

  await t.test('NN1 with a control that did not succeed, or none recorded, is not run', async (t) => {
    for (const control of ['exit 1', 'unrecorded']) {
      assert.equal(
        await nn1(t, 'runner-nn1-refused', control),
        `not run|the workflow's unsandboxed sudo -n true did not succeed (${control}), so a refusal here proves nothing`,
      );
    }
  });

  await t.test('NN1 errored under an exit 0 control passes', async (t) => {
    assert.equal(
      await nn1(t, 'runner-nn1-refused', 'exit 0'),
      'pass|Exit code 1: sudo: The "no new privileges" flag is set, which prevents sudo from running as root.',
    );
  });

  await t.test('NN1 that ran fails', async (t) => {
    assert.equal(await nn1(t, 'runner-nn1-ran', 'exit 0'), 'fail|sudo succeeded inside the sandbox: (empty tool_result)');
  });

  const nn2 = (t, stream) => graded(t, 'sp__nn2_grade', [fixture(stream), NNP_CMD]);

  await t.test('NN2 reading NoNewPrivs 1 passes and 0 fails', async (t) => {
    assert.equal(await nn2(t, 'runner-nn2-set'), 'pass|NoNewPrivs:\t1');
    assert.equal(await nn2(t, 'runner-nn2-unset'), 'fail|NoNewPrivs:\t0');
  });
});

test("N4's runner arm", async (t) => {
  const N4_SESSION = "curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server";
  const CTL_28 = 'curl: (28) Connection timed out after 5001 milliseconds';
  const n4 = (t, stream, ...rest) => graded(t, 'sp__net_n4_grade', [fixture(stream), N4_CMD, ...rest]);

  await t.test('http 400 with a response in the result fails', async (t) => {
    assert.equal(
      await n4(t, 'runner-n4-response', '28', CTL_28, 'http 400'),
      "fail|the metadata service answered the workflow's unsandboxed control (http 400) and the sandboxed call got a response: 400 Bad Request",
    );
  });

  await t.test('http 400 with a curl error passes', async (t) => {
    assert.equal(
      await n4(t, 'n4-curl-error', '28', CTL_28, 'http 400'),
      `pass|the workflow's control got http 400; the sandboxed call got none: ${N4_SESSION}`,
    );
  });

  await t.test('http 400 with a sandbox refusal passes', async (t) => {
    assert.equal(
      await n4(t, 'n4-refused', '28', CTL_28, 'http 400'),
      "pass|the workflow's control got http 400; the sandboxed call got none: curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Operation not permitted",
    );
  });

  await t.test('http 400 with a permission-layer refusal is not run', async (t) => {
    assert.equal(
      await n4(t, 'runner-n4-permission', '28', CTL_28, 'http 400'),
      `not run|refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`,
    );
  });

  const FOUR_ARG =
    "pass|the session's connect ended differently from the same call issued unsandboxed from the probe's own shell: " +
    `session: ${N4_SESSION}; unsandboxed control: ${CTL_28}`;

  await t.test("the four-argument call is byte-identical to sandbox-probe-remote-legs's N4 case", async (t) => {
    assert.equal(await n4(t, 'n4-curl-error', '28', CTL_28), FOUR_ARG);
  });

  await t.test('a fifth argument not starting http gives the four-argument verdict, evidence extended', async (t) => {
    assert.equal(
      await n4(t, 'n4-curl-error', '28', CTL_28, 'no answer: curl exit 28'),
      `${FOUR_ARG}; the workflow's control: no answer: curl exit 28`,
    );
  });
});

test('PD31', async (t) => {
  const PN_FILES = ['sbx_pn_agent.sh', 'sbx_pn_probe.sh', 'sbx_pn_ls.sh', 'sbx_pn_self.sh'];
  const NN_FILES = ['sbx_nn_nnp.sh'];

  /**
   * A case with a checkout, a temp area, a profile and an agent-CLI stub that records, under `$STUB_OUT`,
   * its PID, its prompt, its `--allowedTools` values and a copy of every `sbx_*.sh` in its working directory.
   */
  async function legFixture(t) {
    const dir = await realpath(await caseDir(t));
    const f = {
      clone: join(dir, 'clone'),
      spTmp: join(dir, 'sp-tmp'),
      rec: join(dir, 'rec'),
      profile: join(dir, 'profile.json'),
      stub: join(dir, 'agent-stub.sh'),
    };
    for (const d of [f.clone, f.spTmp, f.rec]) await mkdir(d);
    await writeFile(f.profile, '{}\n');
    f.controls = join(dir, 'runner-controls.tsv');
    await writeFile(f.controls, `${tsv(FULL).join('\n')}\n`);
    await writeFile(
      f.stub,
      [
        '#!/usr/bin/env bash',
        'out="$STUB_OUT"',
        'mkdir -p "$out/files"',
        `printf '%s\\n' "$$" >"$out/pid"`,
        ': >"$out/allowed"',
        'while [ $# -gt 0 ]; do',
        '  case "$1" in',
        `    -p) printf '%s' "$2" >"$out/prompt"; shift 2 ;;`,
        `    --allowedTools) printf '%s\\n' "$2" >>"$out/allowed"; shift 2 ;;`,
        '    *) shift ;;',
        '  esac',
        'done',
        'for s in sbx_*.sh; do [ -f "$s" ] && cp "$s" "$out/files/$s"; done',
        'exit 0',
        '',
      ].join('\n'),
    );
    await chmod(f.stub, 0o755);
    return f;
  }

  /**
   * `body` sourced in job mode with `f`'s directories and controls file, the launch line and job manifest
   * stubbed out.
   */
  const legRun = (t, f, body) =>
    sourced(
      t,
      [
        'sp_launch_args() { SP_LAUNCH_ARGS=(); }',
        'sp_job_manifest_write() { :; }',
        'SP_JOB_MODE=1; SP_CLONE="$1"; SP_TMP="$2"; SP_MAIN="$2"; SP_STATE_DIR=harness-runs; SP_RUN_PROFILE="$3"',
        'export SANDBOX_PROBE_AGENT_CLI="$4" SBX_PROBE_CANARY=1',
        'sp_runner_controls_read "$5" || exit 99',
        body,
      ].join('\n'),
      [f.clone, f.spTmp, f.profile, f.stub, f.controls],
    );

  /** Both legs, each under its own `$STUB_OUT`; stdout carries `probe=<pid>` and one `departure=` line per leg. */
  const LEGS = [
    `printf 'probe=%s\\n' "$$"`,
    'export STUB_OUT="$SP_TMP/../rec/runner-pid"; sp_leg_runner_pid; printf "departure=%s\\n" "$(sp_departures)"',
    'export STUB_OUT="$SP_TMP/../rec/runner-privs"; sp_leg_runner_privs; printf "departure=%s\\n" "$(sp_departures)"',
  ].join('\n');

  const recorded = async (f, leg, file) => readFile(join(f.rec, leg, file), 'utf8');

  await t.test('PD31: no runner-pid or runner-privs prompt or allow rule names a /proc path', async (t) => {
    const f = await legFixture(t);
    const run = await legRun(t, f, LEGS);
    assert.equal(run.status, 0, run.stderr);
    const probe = /^probe=(\d+)$/m.exec(run.stdout)[1];
    const departures = run.stdout.split('\n').filter((l) => l.startsWith('departure='));
    assert.equal(departures.length, 2);

    for (const [leg, files] of [
      ['runner-pid', PN_FILES],
      ['runner-privs', NN_FILES],
    ]) {
      const prompt = await readFile(join(f.spTmp, `${leg}.prompt`), 'utf8');
      const received = await recorded(f, leg, 'prompt');
      const allowed = (await recorded(f, leg, 'allowed')).trimEnd().split('\n');
      for (const [what, text] of [
        ['prompt file', prompt],
        ['prompt received', received],
        ['allow rules', allowed.join('\n')],
      ]) {
        assert.doesNotMatch(text, /\/proc/, `${leg} ${what}`);
      }
      for (const name of files) {
        const call = `bash ${join(f.clone, name)}`;
        assert.ok(prompt.split('\n').includes(call), `${leg} prompt line ${call}`);
        assert.ok(allowed.includes(`Bash(${call})`), `${leg} rule Bash(${call})`);
      }
      assert.deepEqual((await readdir(join(f.rec, leg, 'files'))).sort(), [...files].sort(), leg);
    }
    for (const d of departures) assert.doesNotMatch(d, /\/proc/);

    const agentPid = (await recorded(f, 'runner-pid', 'pid')).trim();
    const held = {
      'runner-pid': {
        'sbx_pn_agent.sh': `grep -a -c SBX_PROBE_CANARY= /proc/${agentPid}/environ\n`,
        'sbx_pn_probe.sh': `grep -a -c SBX_PROBE_CANARY= /proc/${probe}/environ\n`,
        'sbx_pn_ls.sh': 'ls /proc\n',
        'sbx_pn_self.sh': 'grep -a -c PATH= /proc/self/environ\n',
      },
      'runner-privs': { 'sbx_nn_nnp.sh': 'grep NoNewPrivs /proc/self/status\n' },
    };
    for (const [leg, files] of Object.entries(held)) {
      for (const [name, line] of Object.entries(files)) {
        assert.equal(await recorded(f, leg, join('files', name)), line, `${leg} ${name}`);
      }
    }
    assert.deepEqual(await readdir(f.clone), [], 'every script file is gone after its leg');
  });

  await t.test('PD31: sp_session replaces @SP_AGENT_PID@ in a --token-file before the agent starts', async (t) => {
    const f = await legFixture(t);
    const run = await legRun(t, f, LEGS);
    assert.equal(run.status, 0, run.stderr);
    const held = (await readFile(join(f.spTmp, 'runner-pid.agent-pid'), 'utf8')).trim();
    assert.match(held, /^[0-9]+$/);
    assert.equal((await recorded(f, 'runner-pid', 'pid')).trim(), held);
    assert.equal(
      await recorded(f, 'runner-pid', join('files', 'sbx_pn_agent.sh')),
      `grep -a -c SBX_PROBE_CANARY= /proc/${held}/environ\n`,
    );

    const g = await legFixture(t);
    const absent = join(g.clone, 'absent.sh');
    const run96 = await legRun(
      t,
      g,
      [
        `printf 'Stop.\\n' >"$SP_TMP/tokmiss.prompt"`,
        'export STUB_OUT="$SP_TMP/../rec/tokmiss"',
        `sp_session tokmiss "$SP_RUN_PROFILE" "$SP_TMP/tokmiss.prompt" --cwd "$SP_CLONE" --token-file '${absent}'`,
        'printf "status=%s\\n" "$?"',
      ].join('\n'),
    );
    assert.equal(run96.stdout, 'status=96\n', run96.stderr);
    assert.equal(
      await readFile(join(g.spTmp, 'tokmiss.stderr'), 'utf8'),
      `sandbox-probe: sp_session tokmiss: token file ${absent} is missing or not writable\n`,
    );
    assert.deepEqual(await readdir(g.rec), [], 'the agent CLI never started');
  });

  await t.test('PD31: the graders judge the bash call and quote the /proc path', async (t) => {
    const dir = await caseDir(t);
    const agentSh = '/work/clone/sbx_pn_agent.sh';
    const nnpSh = '/work/clone/sbx_nn_nnp.sh';
    const proc = `/proc/${AGENT_PID}/environ`;
    /** `name`'s fixture with its recorded command rewritten to `bash <script>`. */
    const indirected = async (name, from, script) => {
      const text = await readFile(fixture(name), 'utf8');
      assert.ok(text.includes(`"command":"${from}"`), name);
      const path = join(dir, `${name}.jsonl`);
      await writeFile(path, text.replaceAll(`"command":"${from}"`, `"command":"bash ${script}"`));
      return path;
    };
    const pn = async (name) =>
      graded(t, 'sp__pn_read_grade', [await indirected(name, PN_CMD, agentSh), `bash ${agentSh}`, proc]);

    const cases = [
      [await pn('runner-pn-count'), `fail|the canary was readable in ${proc} (count 1)`],
      [await pn('runner-pn-absent'), `pass|the process is not visible from the call: grep: ${proc}: No such file or directory`],
      [await pn('runner-pn-denied'), `pass|its environ is not readable from the call: grep: ${proc}: Permission denied`],
      [
        await pn('runner-pn-zero'),
        `not run|the environ was readable but the canary was not in it, so the read proves nothing (${proc}: count 0)`,
      ],
      [
        await pn('runner-pn-permission'),
        `not run|refused at the permission layer, so the call never reached the sandbox: ${DONT_ASK} (it reads ${proc})`,
      ],
      [
        await graded(t, 'sp__nn2_grade', [
          await indirected('runner-nn2-set', NNP_CMD, nnpSh),
          `bash ${nnpSh}`,
          '/proc/self/status',
        ]),
        'pass|/proc/self/status: NoNewPrivs:\t1',
      ],
    ];
    for (const [out, expected] of cases) {
      assert.equal(out, expected);
      assert.doesNotMatch(out, /sbx_/, 'the evidence names the /proc path, not the script path');
    }
  });

  await t.test("PD31: a script path that exists before the session prints the leg's rows not run and removes nothing", async (t) => {
    for (const [leg, rows, name] of [
      ['runner-pid', ['PN1', 'PN2', 'PN3'], 'sbx_pn_ls.sh'],
      ['runner-privs', ['NN1', 'NN2'], 'sbx_nn_nnp.sh'],
    ]) {
      const f = await legFixture(t);
      const path = join(f.clone, name);
      await writeFile(path, 'mine\n');
      const fn = leg === 'runner-pid' ? 'sp_leg_runner_pid' : 'sp_leg_runner_privs';
      const run = await legRun(t, f, `export STUB_OUT="$SP_TMP/../rec/${leg}"; ${fn}`);
      assert.equal(run.status, 0, run.stderr);
      const evidence = `'${path}' exists before the session; the probe removes only what it created, so remove it and re-run`;
      assert.equal(
        run.stdout,
        rows
          .map(
            (row) =>
              `leg="${leg}" row="${row}" result="not run" evidence="${evidence}" departure="none" claude="unknown"\n`,
          )
          .join(''),
        leg,
      );
      assert.deepEqual(await readdir(f.clone), [name], `${leg}: nothing written, nothing removed`);
      assert.equal(await readFile(path, 'utf8'), 'mine\n', leg);
      assert.deepEqual(await readdir(f.rec), [], `${leg}: the agent CLI never started`);
    }
  });
});
