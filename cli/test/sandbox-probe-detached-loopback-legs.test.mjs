/**
 * The sandbox probe's detached and loopback legs' grading functions (`sp__bg9_grade`, `sp__wf5_grade` in
 * `scripts/lib/sandbox-probe/legs-detached.sh`; `sp__lb_proxy_line`, `sp__lb_grade`, `sp__lb5_grade` in
 * `scripts/lib/sandbox-probe/legs-loopback.sh`).
 *
 * **The rule these tests exist to enforce: a detached worker that dies with its session is a finding, not a
 * pass; the heartbeat must advance; and the loopback rows record what came back, never what was expected,
 * with the proxy recorded by host and port only.** Every grading function drives a permission-refused
 * fixture to `not run`, and LB5 never records *unreachable* for a listener that was no longer running.
 *
 * Each case runs a `bash -c` through `runBash` sourcing `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`,
 * `session.sh`, `legs-network.sh` and the two leg files, then sets SP_PLATFORM (`linux` unless a case says
 * otherwise), since `platform.sh` empties it. Fixtures are passed unsubstituted: every grading function
 * matches the command it is given byte-equal. Temporary files are `mkdtemp`s under `os.tmpdir()`, removed
 * in process when each case ends.
 *
 * Left out deliberately: no case launches a session, a worker or a listener, so the legs' session wiring
 * (`sp_leg_detached`, `sp_leg_loopback`) is exercised only by a hand-run probe.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  'legs-detached.sh',
  'legs-loopback.sh',
].map((f) => join(PROBE_LIB, f));
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing {@link LIBS} with SP_PLATFORM set to `platform`, its own arguments in `"$@"`. */
function sourced(cwd, body, args = [], { platform = 'linux' } = {}) {
  const script = [
    `for lib in "\${@:1:${LIBS.length}}"; do . "$lib"; done`,
    `shift ${LIBS.length}`,
    `SP_PLATFORM='${platform}'`,
    body,
  ].join('\n');
  return runBash(cwd, ['-c', script, '_', ...LIBS, ...args], { SP_VERSION: '', SP_CURRENT_LEG: '' });
}

async function caseDir(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'harness-sp-detached-loopback-')));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return dir;
}

/** Runs `fn "$@"` and returns `[SP_VERDICT, SP_EVIDENCE]`. */
async function graded(t, fn, args, opts) {
  const dir = await caseDir(t);
  const run = await sourced(dir, `${fn} "$@"; printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`, args, opts);
  assert.equal(run.status, 0, run.stderr);
  const bar = run.stdout.indexOf('|');
  return [run.stdout.slice(0, bar), run.stdout.slice(bar + 1)];
}

/** Runs `sp__lb_proxy_line "$@"` and returns its printed line. */
async function proxyLine(t, args) {
  const run = await sourced(await caseDir(t), 'sp__lb_proxy_line "$@"', args);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const BG9_START = 'bash @FIXTURE_ROOT@/bg9-start.sh';
const LB_PROXY = 'bash @FIXTURE_ROOT@/sp-tmp/lb-proxy.sh';
const LB_TOKEN = 'sbx_n3_tok';
const IP_PLAIN = 'curl -sS --max-time 5 http://127.0.0.1:8765/sbx_n3.txt';
const IP_NOPROXY = "curl -sS --max-time 5 --noproxy '*' http://127.0.0.1:8765/sbx_n3.txt";
const LH_PLAIN = 'curl -sS --max-time 5 http://localhost:8765/sbx_n3.txt';
const LH_NOPROXY = "curl -sS --max-time 5 --noproxy '*' http://localhost:8765/sbx_n3.txt";
const IP_CURL7 = "curl: (7) Failed to connect to 127.0.0.1 port 8765 after 0 ms: Couldn't connect to server";
const CURL56 = 'curl: (56) CONNECT tunnel failed, response 403';
const LB5_START = 'bash @FIXTURE_ROOT@/lb5-start.sh';
const LB5_NO_LISTENER = 'bash @FIXTURE_ROOT@/lb5-start-no-listener.sh';
const LB5_TOKEN = 'sbx_lb5_fixture';
const LB5_CURL7 = "curl: (7) Failed to connect to 127.0.0.1 port 9876 after 0 ms: Couldn't connect to server";

test('sp__bg9_grade: pass only on a worker that outlived the session and finished', async (t) => {
  const bg9 = (t, stream, end, beat, done) => graded(t, 'sp__bg9_grade', [fixture(stream), BG9_START, end, beat, done]);

  await t.test('a beat after the session end and the done marker: pass', async (t) => {
    assert.deepEqual(await bg9(t, 'bg9-started', '100', '115', '1'), [
      'pass',
      'outlived the call and the session: last beat 15s after the session ended, the worker finished',
    ]);
  });

  await t.test('a worker that stopped with the session: fail', async (t) => {
    assert.deepEqual(await bg9(t, 'bg9-started', '100', '100', '0'), [
      'fail',
      'the detached process did not outlive the session: last beat 0s after it ended, no done marker',
    ]);
  });

  await t.test('beats past the session with no done marker: not run, never pass', async (t) => {
    assert.deepEqual(await bg9(t, 'bg9-started', '100', '110', '0'), [
      'not run',
      "neither outlived nor died with the session: session end '100', last beat '110', done '0'",
    ]);
  });

  await t.test('a permission-layer refusal of the start call is not run', async (t) => {
    assert.deepEqual(await bg9(t, 'bg9-permission', '100', '115', '1'), [
      'not run',
      `the start call was refused at the permission layer, so nothing was detached: ${DONT_ASK}`,
    ]);
  });
});

test('sp__wf5_grade: pass only on an advancing hr_lane_mtime', async (t) => {
  /** Grades a temp file holding `text`, or, with `text` null, a path that does not exist. */
  async function wf5(t, text) {
    const dir = await caseDir(t);
    const file = join(dir, 'sbx_wf5.mtimes');
    if (text !== null) await writeFile(file, text);
    return [file, await graded(t, 'sp__wf5_grade', [file])];
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
});

test('sp__lb_grade: records what came back on the plain and --noproxy calls', async (t) => {
  const IP_PASS = ['pass', `plain: the token came back; --noproxy: no body: ${IP_CURL7}`];

  await t.test('the 127.0.0.1 pair: the token on the plain call, curl (7) on --noproxy', async (t) => {
    assert.deepEqual(
      await graded(t, 'sp__lb_grade', [fixture('lb-session'), IP_PLAIN, IP_NOPROXY, LB_TOKEN, '1']),
      IP_PASS,
    );
  });

  await t.test('the localhost pair: both calls quote the CONNECT 403', async (t) => {
    assert.deepEqual(
      await graded(t, 'sp__lb_grade', [fixture('lb-session'), LH_PLAIN, LH_NOPROXY, LB_TOKEN, '1']),
      ['pass', `plain: no body: ${CURL56}; --noproxy: no body: ${CURL56}`],
    );
  });

  await t.test('judged at `ran`, Linux’s curl (7) grades identically with SP_PLATFORM empty', async (t) => {
    assert.deepEqual(
      await graded(t, 'sp__lb_grade', [fixture('lb-session'), IP_PLAIN, IP_NOPROXY, LB_TOKEN, '1'], { platform: '' }),
      IP_PASS,
    );
  });

  await t.test('a listener that did not answer: not run', async (t) => {
    const [v, e] = await graded(t, 'sp__lb_grade', [fixture('lb-session'), IP_PLAIN, IP_NOPROXY, LB_TOKEN, '0']);
    assert.equal(v, 'not run');
    assert.ok(e.startsWith("the listener did not answer the probe's own request"), e);
  });

  await t.test('a permission-layer refusal of the plain call is not run', async (t) => {
    assert.deepEqual(
      await graded(t, 'sp__lb_grade', [fixture('lb-permission'), IP_PLAIN, IP_NOPROXY, LB_TOKEN, '1']),
      ['not run', `${IP_PLAIN}: refused at the permission layer, so it never reached the sandbox: ${DONT_ASK}`],
    );
  });
});

test('sp__lb_proxy_line: host and port only, never a credential', async (t) => {
  await t.test('the helper’s lines are printed as NAME=value', async (t) => {
    const line = await proxyLine(t, [fixture('lb-session'), LB_PROXY]);
    assert.ok(line.startsWith('proxy: '), line);
    assert.ok(line.includes('http_proxy=localhost:3128'), line);
    assert.ok(line.includes('HTTPS_PROXY=localhost:3128'), line);
    assert.ok(line.includes('no_proxy=localhost,127.0.0.1'), line);
  });

  await t.test('a userinfo left in a value is stripped when the line is read back', async (t) => {
    const dir = await caseDir(t);
    const stream = join(dir, 'lb-proxy-userinfo.jsonl');
    const records = [
      { type: 'system', subtype: 'init', session_id: 'sp-lb-proxy-userinfo', cwd: '@FIXTURE_ROOT@/proj-sbx' },
      { type: 'user', message: { role: 'user', content: 'Run the command.' } },
      {
        type: 'assistant',
        message: { id: 'm1', content: [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command: LB_PROXY } }] },
      },
      {
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tu1',
              content: 'sbx_lb_proxy http_proxy user:secret@localhost:3128\nsbx_lb_proxy no_proxy unset',
            },
          ],
        },
      },
      { type: 'result', subtype: 'success', duration_ms: 1000, permission_denials: [] },
    ];
    await writeFile(stream, `${records.map((r) => JSON.stringify(r)).join('\n')}\n`);
    const line = await proxyLine(t, [stream, LB_PROXY]);
    assert.ok(line.includes('http_proxy=localhost:3128'), line);
    assert.ok(!line.includes('secret'), line);
  });

  await t.test('a permission-layer refusal of the helper records no proxy', async (t) => {
    assert.equal(
      await proxyLine(t, [fixture('lb-permission'), IP_PLAIN]),
      `proxy: not recorded (refused at the permission layer: ${DONT_ASK})\n`,
    );
  });
});

test('sp__lb5_grade: never records unreachable for a listener that was no longer running', async (t) => {
  const lb5 = (t, cmd, reply, alive) => graded(t, 'sp__lb5_grade', [fixture('lb5-listening'), cmd, reply, LB5_TOKEN, alive]);
  const REACHABLE = ['pass', 'reachable from outside the sandbox: the token came back on 127.0.0.1:9876'];

  await t.test('the token in the outside reply, listener alive: pass, reachable', async (t) => {
    assert.deepEqual(await lb5(t, LB5_START, `${LB5_TOKEN}\n`, '1'), REACHABLE);
  });

  await t.test('the token in the outside reply, listener gone since: still pass, reachable', async (t) => {
    assert.deepEqual(await lb5(t, LB5_START, `${LB5_TOKEN}\n`, '0'), REACHABLE);
  });

  await t.test('curl (7) while the listener was running: pass, unreachable', async (t) => {
    assert.deepEqual(await lb5(t, LB5_START, LB5_CURL7, '1'), [
      'pass',
      `unreachable from outside the sandbox while the listener was running: ${LB5_CURL7}`,
    ]);
  });

  await t.test('the dead-listener case: curl (7) with the listener gone is not run', async (t) => {
    const [v, e] = await lb5(t, LB5_START, LB5_CURL7, '0');
    assert.equal(v, 'not run');
    assert.ok(e.startsWith('the listener was no longer running when the probe called it'), e);
  });

  await t.test('curl (7) with liveness unknown is not run', async (t) => {
    const [v, e] = await lb5(t, LB5_START, LB5_CURL7, '?');
    assert.equal(v, 'not run');
    assert.ok(e.startsWith('could not tell whether the listener was still running'), e);
  });

  await t.test('a start call that started no listener is not run', async (t) => {
    const [v, e] = await lb5(t, LB5_NO_LISTENER, LB5_CURL7, '1');
    assert.equal(v, 'not run');
    assert.ok(e.startsWith('the start call started no listener: sbx_lb5_no_listener'), e);
  });

  await t.test('a permission-layer refusal of the start call is not run', async (t) => {
    assert.deepEqual(
      await graded(t, 'sp__lb5_grade', [fixture('lb-permission'), IP_PLAIN, `${LB5_TOKEN}\n`, LB5_TOKEN, '1']),
      ['not run', `the start call was refused at the permission layer, so no listener was started: ${DONT_ASK}`],
    );
  });
});
