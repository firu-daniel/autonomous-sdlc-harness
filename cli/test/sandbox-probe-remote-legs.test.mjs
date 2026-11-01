/**
 * The sandbox probe's N3 and N4 grading (`sp__net_n3_grade`, `sp__net_n4_grade` in `legs-network.sh`), the
 * credentials leg's no-calls check (`sp__cred_issued` in `legs-settings.sh`), P1b's permission screen
 * (`sp__wr_permission_screen` in `legs-wrappers.sh`) and R4's `--local` grading (`sp__rf_r4_local_grade` in
 * `legs-refresh.sh`), run over the recorded streams in `fixtures/sandbox-probe/`.
 *
 * **The rule these tests exist to enforce: a refusal is graded only at the layer the row measures — a
 * permission-layer refusal is `not run`; N3 fails only on a body that came back; N4 never fails on an error
 * line that cannot tell; N4 passes only where its curl error differs from the same call issued unsandboxed from
 * the probe's own shell; a session that issued no calls grades nothing; on Linux an `unrecognised` curl error
 * is N3's and N4's data, graded exactly as on macOS.**
 *
 * Every case sources libraries and reads a fixture: none starts a listener, a session or a network call.
 * Port `8765` and token `sbx_n3_fixture` are fixture literals. Fixtures are passed unsubstituted, since
 * each call is matched byte-equal against a command that spells `@FIXTURE_ROOT@` the same way.
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const BASE_LIBS = ['core.sh', 'judge.sh', 'controls.sh'];
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

const N3_CMD = 'curl -sS --max-time 5 http://127.0.0.1:8765/sbx_n3.txt';
const N3_TOKEN = 'sbx_n3_fixture';
const N4_CMD = 'curl -sS --max-time 5 http://169.254.169.254/';
const CRED_CTL = 'cat @FIXTURE_ROOT@/clone/harness.config.json';
const P1B_CMD =
  'GIT_SSH_COMMAND=@FIXTURE_ROOT@/tmp/sbx_ssh_probe.sh bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone';
const R4_LOCAL_CMD = 'bash @FIXTURE_ROOT@/clone/scripts/refresh-branch.sh --local @FIXTURE_ROOT@/clone';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const VERDICT = 'printf \'%s|%s\' "$SP_VERDICT" "$SP_EVIDENCE"';

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/**
 * `body` run after sourcing the base libraries and `leg`, its own arguments in `"$@"`; with `platform`,
 * SP_PLATFORM is set to it after sourcing and before `body`.
 */
function sourced(cwd, leg, body, args, platform) {
  const libs = [...BASE_LIBS, leg].map((f) => join(PROBE_LIB, f));
  const setPlatform = platform === undefined ? '' : `SP_PLATFORM=${platform}; `;
  return runBash(
    cwd,
    ['-c', `. "$1"; . "$2"; . "$3"; . "$4"; shift 4; ${setPlatform}${body}`, '_', ...libs, ...args],
    { SP_VERSION: '' },
  );
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-remote-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** Runs `fn "$@"` from `leg` and returns `<SP_VERDICT>|<SP_EVIDENCE>`. */
async function graded(t, leg, fn, args, platform) {
  const run = await sourced(await caseDir(t), leg, `${fn} "$@"; ${VERDICT}`, args, platform);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

test('sp__net_n3_grade: N3 fails only on a body that came back', async (t) => {
  const n3 = (t, stream, answered) =>
    graded(t, 'legs-network.sh', 'sp__net_n3_grade', [fixture(stream), N3_CMD, N3_TOKEN, answered]);

  await t.test('the token in the result fails', async (t) => {
    assert.equal(await n3(t, 'n3-body', '1'), `fail|the listener's body came back to the sandboxed session: ${N3_TOKEN}`);
  });

  await t.test('no body while the listener answered passes, quoting the curl line', async (t) => {
    assert.equal(
      await n3(t, 'n3-no-body', '1'),
      "pass|no body came back while the listener answered the probe: curl: (7) Failed to connect to 127.0.0.1 port 8765 after 0 ms: Couldn't connect to server",
    );
  });

  await t.test('no body while the listener did not answer is not run', async (t) => {
    assert.match(await n3(t, 'n3-no-body', '0'), /^not run\|/);
  });
});

test('sp__net_n4_grade: N4 never fails on an error line that cannot tell, and passes only on a difference from its unsandboxed control', async (t) => {
  const n4 = (t, stream, ...control) =>
    graded(t, 'legs-network.sh', 'sp__net_n4_grade', [fixture(stream), N4_CMD, ...control]);

  await t.test('a curl error is not run, carrying the whole curl line', async (t) => {
    assert.equal(
      await n4(t, 'n4-curl-error'),
      "not run|curl's error line cannot tell a refused connect from an unreachable host: curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server",
    );
  });

  await t.test('a sandbox refusal passes', async (t) => {
    assert.equal(
      await n4(t, 'n4-refused'),
      'pass|curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Operation not permitted',
    );
  });

  await t.test('a control that ended differently passes', async (t) => {
    assert.equal(
      await n4(t, 'n4-curl-error', '28', 'curl: (28) Connection timed out after 5001 milliseconds'),
      "pass|the session's connect ended differently from the same call issued unsandboxed from the probe's own shell: session: curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server; unsandboxed control: curl: (28) Connection timed out after 5001 milliseconds",
    );
  });

  await t.test('a control that ended the same way is not run', async (t) => {
    assert.equal(
      await n4(
        t,
        'n4-curl-error',
        '7',
        "curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Couldn't connect to server",
      ),
      "not run|curl's error line cannot tell a refused connect from an unreachable host, and the same call issued unsandboxed from the probe's own shell ended the same way: session: curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server; unsandboxed control: curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Couldn't connect to server",
    );
  });

  await t.test('a control that got a response passes', async (t) => {
    assert.equal(
      await n4(t, 'n4-curl-error', '0', 'a response (12 bytes)'),
      "pass|refused in the session while the same call, unsandboxed from the probe's own shell, got a response: session: curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server; unsandboxed control: a response (12 bytes)",
    );
  });
});

test('on Linux, N3 and N4 grade an unrecognised curl error exactly as their macOS twins do', async (t) => {
  const N3_NO_BODY_PASS =
    "pass|no body came back while the listener answered the probe: curl: (7) Failed to connect to 127.0.0.1 port 8765 after 0 ms: Couldn't connect to server";
  const N4_SESSION = "curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server";
  const N4_SAME_CODE = "curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Couldn't connect to server";

  async function layer(t, stream, cmd, platform) {
    const run = await sourced(
      await caseDir(t),
      'legs-network.sh',
      'sp_judge_call "$@"; printf %s "$SP_LAYER"',
      [fixture(stream), 'network', cmd],
      platform,
    );
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }

  await t.test('precondition: both fixtures are layer unrecognised on Linux and ran without a platform', async (t) => {
    assert.equal(await layer(t, 'n3-no-body', N3_CMD, 'linux'), 'unrecognised');
    assert.equal(await layer(t, 'n4-curl-error', N4_CMD, 'linux'), 'unrecognised');
    assert.equal(await layer(t, 'n3-no-body', N3_CMD), 'ran');
    assert.equal(await layer(t, 'n4-curl-error', N4_CMD), 'ran');
  });

  /** The grader's output with `linux` and with no platform, asserted equal; returns the one string. */
  async function twins(t, fn, args) {
    const linux = await graded(t, 'legs-network.sh', fn, args, 'linux');
    const macos = await graded(t, 'legs-network.sh', fn, args);
    assert.equal(linux, macos);
    return linux;
  }

  await t.test('N3 with the listener answering passes on the curl line', async (t) => {
    assert.equal(await twins(t, 'sp__net_n3_grade', [fixture('n3-no-body'), N3_CMD, N3_TOKEN, '1']), N3_NO_BODY_PASS);
  });

  await t.test('N3 with the listener not answering is not run', async (t) => {
    assert.match(await twins(t, 'sp__net_n3_grade', [fixture('n3-no-body'), N3_CMD, N3_TOKEN, '0']), /^not run\|/);
  });

  const n4 = (t, ...control) => twins(t, 'sp__net_n4_grade', [fixture('n4-curl-error'), N4_CMD, ...control]);

  await t.test('N4 with no control is not run', async (t) => {
    assert.equal(
      await n4(t),
      `not run|curl's error line cannot tell a refused connect from an unreachable host: ${N4_SESSION}`,
    );
  });

  await t.test('N4 with a control that ended differently passes', async (t) => {
    const control = 'curl: (28) Connection timed out after 5001 milliseconds';
    assert.equal(
      await n4(t, '28', control),
      `pass|the session's connect ended differently from the same call issued unsandboxed from the probe's own shell: session: ${N4_SESSION}; unsandboxed control: ${control}`,
    );
  });

  await t.test('N4 with a control that ended the same way is not run', async (t) => {
    assert.equal(
      await n4(t, '7', N4_SAME_CODE),
      `not run|curl's error line cannot tell a refused connect from an unreachable host, and the same call issued unsandboxed from the probe's own shell ended the same way: session: ${N4_SESSION}; unsandboxed control: ${N4_SAME_CODE}`,
    );
  });

  await t.test('N4 with a control that got a response passes', async (t) => {
    assert.equal(
      await n4(t, '0', 'a response (12 bytes)'),
      `pass|refused in the session while the same call, unsandboxed from the probe's own shell, got a response: session: ${N4_SESSION}; unsandboxed control: a response (12 bytes)`,
    );
  });
});

test('sp__cred_issued: a session that issued no calls grades nothing', async (t) => {
  async function issued(t, stream) {
    const run = await sourced(await caseDir(t), 'legs-settings.sh', 'sp__cred_issued "$@"; printf %s "$?"', [
      stream,
      CRED_CTL,
    ]);
    assert.equal(run.stderr, '');
    return run.stdout;
  }

  await t.test('no tool_use at all is status 1', async (t) => {
    assert.equal(await issued(t, fixture('credentials-no-calls')), '1');
  });

  await t.test('the exact control call is status 0', async (t) => {
    const dir = await caseDir(t);
    const stream = join(dir, 'credentials-issued.jsonl');
    const events = [
      { type: 'system', subtype: 'init', session_id: 'sp-credentials-issued', cwd: '@FIXTURE_ROOT@' },
      { type: 'user', message: { role: 'user', content: 'Run the commands.' } },
      {
        type: 'assistant',
        message: { id: 'm1', content: [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command: CRED_CTL } }] },
      },
      {
        type: 'user',
        message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu1', content: '{}' }] },
      },
      { type: 'result', subtype: 'success', duration_ms: 3000, permission_denials: [] },
    ];
    await writeFile(stream, `${events.map((e) => JSON.stringify(e)).join('\n')}\n`);
    assert.equal(await issued(t, stream), '0');
  });
});

test('sp__wr_permission_screen: P1b refused at the permission layer is not run', async (t) => {
  async function screen(t, stream, cmd) {
    const run = await sourced(
      await caseDir(t),
      'legs-wrappers.sh',
      'sp__wr_permission_screen "$@"; s=$?; printf \'%s|%s|%s\' "$s" "${SP__WR_V-unset}" "${SP__WR_E-unset}"',
      [stream, cmd],
    );
    assert.equal(run.stderr, '');
    return run.stdout;
  }

  await t.test('a permission-layer refusal is status 0 with the not-run pair', async (t) => {
    assert.equal(
      await screen(t, fixture('p1b-permission'), P1B_CMD),
      `0|not run|refused at the permission layer, so it never reached the sandbox or the excludedCommands match: ${DONT_ASK}`,
    );
  });

  await t.test('a sandbox refusal is status 1, setting nothing', async (t) => {
    assert.equal(
      await screen(t, fixture('sandbox-dd'), 'dd if=/dev/zero of=@FIXTURE_ROOT@/outside/probe bs=1 count=1'),
      '1|unset|unset',
    );
  });
});

test('sp__rf_r4_local_grade: R4’s --local half is graded on its exit and its refusal layer', async (t) => {
  const r4 = (t, stream) => graded(t, 'legs-refresh.sh', 'sp__rf_r4_local_grade', [fixture(stream), R4_LOCAL_CMD]);

  await t.test('exit 3 passes as nothing to do', async (t) => {
    assert.equal(
      await r4(t, 'r4-local-ran'),
      'pass|--local exit 3, nothing to do: refresh-branch.sh: sbx_probe already contains main — nothing to do',
    );
  });

  await t.test('a sandbox refusal in the clone fails', async (t) => {
    assert.equal(
      await r4(t, 'r4-local-sandbox'),
      "fail|the --local merge was refused sandboxed in the clone: fatal: Unable to create '@FIXTURE_ROOT@/clone/.git/index.lock': Operation not permitted",
    );
  });

  await t.test('a session without the call is not run', async (t) => {
    assert.equal(await r4(t, 'ran'), `not run|no Bash call "${R4_LOCAL_CMD}" in the session`);
  });
});
