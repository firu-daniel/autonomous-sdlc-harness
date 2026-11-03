/**
 * The sandbox probe's T2/T3 and TD2/TD4 grading functions (`sp__t2_grade`, `sp__t3_grade`,
 * `sp__t2_lane_state`, `sp__td2_tmpdir`, `sp__td2_grade`, `sp__td4_grade` in
 * `scripts/lib/sandbox-probe/legs-local.sh`) and the row choice
 * between them (`sp_leg_row_for` in `core.sh`), run over the recorded streams in
 * `fixtures/sandbox-probe/` and over gate-lane files each case writes.
 *
 * **The rule these tests exist to enforce: T2 and T3 are graded from the gate lane's verdict and log,
 * T3's log search quoting a Linux refusal line on Linux only; T3 is graded only when Phase G's launcher
 * answered `pending`, and a stale `.running` heartbeat is read as a dead worker; TD2's control is a
 * literal path; TD4 is
 * graded against TD3's unsandboxed result, never TD2's, an error carrying no known text being `not run`;
 * and a permission-layer refusal of any measured call or control is `not run`, never `fail`.**
 *
 * **The TD2 and TD4 fixtures are substituted; the T2 fixtures are not.** Before each TD2 or TD4 case the
 * suite writes copies of the `td2-*.jsonl` and `td4-*.jsonl` fixtures into the case directory with every
 * `@FIXTURE_ROOT@` replaced by that directory, and passes the copies' paths. In a TD4 fixture that
 * directory stands for the session's TMPDIR.
 * `cli/test/sandbox-probe-judge.test.mjs` passes its fixtures unsubstituted; this suite cannot, because
 * `sp__td2_tmpdir` returns status 1 when the printed TMPDIR is not an absolute path, and
 * `@FIXTURE_ROOT@/…` is not one. That rule is held as `legs-local.sh` states it, never loosened here.
 *
 * The four libraries are sourced in a `bash -c` whose working directory is the case directory, a
 * `mkdtemp` under `os.tmpdir()` removed when the case ends; a case setting SP_PLATFORM also sources
 * `platform.sh` and sets it afterwards, since that file empties it. No case launches `claude` or starts a gate:
 * the lane's `.verdict` and `.log` are files the case writes. Left out deliberately: the session wiring
 * of T3's wait loop in `sp_leg_gates`, which stays hand-run.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'controls.sh', 'legs-local.sh'].map((f) => join(PROBE_LIB, f));
const PLATFORM_LIB = join(PROBE_LIB, 'platform.sh');
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');
const T2_COMMAND = 'bash scripts/run-test-suite.sh sbx_probe_t2';
const COMPARE = 'compare with the same call unsandboxed on the same tree before filing its row';
const DENIALS = 'network denials in the log, recorded and not graded';
const STREAM_DENIALS = 'network denials in the session stream, recorded and not graded';
const T3_REFUSAL =
  'launch-sandboxed-gates.sh: bwrap is not on PATH, so the gate run cannot be sandboxed on this bubblewrap host, and Run gates do not run here unsandboxed (docs/cli.md §6)';

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing the four libraries, its own arguments in `"$@"`, in `cwd`. */
function sourced(cwd, body, args = []) {
  return runBash(cwd, ['-c', `. "$1"; . "$2"; . "$3"; . "$4"; shift 4; ${body}`, '_', ...LIBS, ...args], {
    SP_VERSION: '',
  });
}

/** Runs one grading function and returns `<SP_VERDICT>|<SP_EVIDENCE>`. */
async function graded(cwd, fn, args) {
  const run = await sourced(cwd, `${fn} "$@"; printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`, args);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

/** As `graded`, with `platform.sh` sourced too and SP_PLATFORM set to `platform` after it. */
async function gradedOn(cwd, platform, fn, args) {
  const run = await runBash(
    cwd,
    [
      '-c',
      `. "$1"; . "$2"; . "$3"; . "$4"; . "$5"; SP_PLATFORM="$6"; shift 6; ${fn} "$@"; printf '%s|%s' "$SP_VERDICT" "$SP_EVIDENCE"`,
      '_',
      ...LIBS,
      PLATFORM_LIB,
      platform,
      ...args,
    ],
    { SP_VERSION: '' },
  );
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-gates-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** Copies the TD2 and TD4 fixtures into `dir` with `@FIXTURE_ROOT@` replaced by `dir`. */
async function substituteTd2(dir) {
  for (const name of [
    'td2-tmpdir',
    'td2-forms',
    'td2-control-permission',
    'td4-forms',
    'td4-refused',
    'td4-unrecognised',
  ]) {
    const text = readFileSync(fixture(name), 'utf8').split('@FIXTURE_ROOT@').join(dir);
    await writeFile(join(dir, `${name}.jsonl`), text);
  }
}

test('sp__t2_grade: graded from the lane verdict and log', async (t) => {
  await t.test('a pass verdict passes, and the log’s network denial is counted, not graded', async (t) => {
    const dir = await caseDir(t);
    const violation =
      '<sandbox_violations>api.anthropic.com:443 refused: host is not on the allow list</sandbox_violations>';
    await writeFile(join(dir, 'sbx_probe_t2.verdict'), 'pass\n');
    await writeFile(join(dir, 'sbx_probe_t2.log'), `== run-test-suite.sh: gate test exited 0 ==\n${violation}\n`);
    assert.equal(
      await graded(dir, 'sp__t2_grade', [
        fixture('t2-run-form'),
        T2_COMMAND,
        join(dir, 'sbx_probe_t2.verdict'),
        join(dir, 'sbx_probe_t2.log'),
      ]),
      `pass|run-test-suite.sh verdict pass; ${DENIALS}: 1, first: ${violation}; ${STREAM_DENIALS}: 0 event(s)`,
    );
  });

  await t.test('a fail verdict fails, quoting the log’s mkstemp line and the compare clause', async (t) => {
    const dir = await caseDir(t);
    const log = join(dir, 'sbx_probe_t2.log');
    const mkstemp = `mktemp: mkstemp failed on ${dir}/system-tmp/tmp.XXXXXXXXXX: Operation not permitted`;
    await writeFile(join(dir, 'sbx_probe_t2.verdict'), `fail ${log}\n`);
    await writeFile(log, `== run-test-suite.sh: gate test exited 1 ==\n${mkstemp}\n`);
    assert.equal(
      await graded(dir, 'sp__t2_grade', [fixture('t2-run-form'), T2_COMMAND, join(dir, 'sbx_probe_t2.verdict'), log]),
      `fail|${mkstemp}; ${COMPARE}; ${DENIALS}: 0; ${STREAM_DENIALS}: 0 event(s)`,
    );
  });

  await t.test('no verdict file is not run', async (t) => {
    const dir = await caseDir(t);
    const verdict = join(dir, 'sbx_probe_t2.verdict');
    const log = join(dir, 'sbx_probe_t2.log');
    await writeFile(log, '== run-test-suite.sh: gate test exited 0 ==\n');
    assert.equal(
      await graded(dir, 'sp__t2_grade', [fixture('t2-run-form'), T2_COMMAND, verdict, log]),
      `not run|no verdict for the gate run: ${verdict} is absent, and the log ${log} exists; ${DENIALS}: 0; ${STREAM_DENIALS}: 0 event(s)`,
    );
  });

  await t.test('a run form refused at the permission layer is not run, whatever the lane says', async (t) => {
    const dir = await caseDir(t);
    const log = join(dir, 'sbx_probe_t2.log');
    await writeFile(join(dir, 'sbx_probe_t2.verdict'), 'pass\n');
    await writeFile(log, '== run-test-suite.sh: gate test exited 0 ==\n');
    assert.equal(
      await graded(dir, 'sp__t2_grade', [
        fixture('t2-run-permission'),
        T2_COMMAND,
        join(dir, 'sbx_probe_t2.verdict'),
        log,
      ]),
      `not run|the run form did not reach the gates: Permission to use Bash with command ${T2_COMMAND} has been denied because Claude Code is running in don't ask mode.; ${DENIALS}: 0; ${STREAM_DENIALS}: 0 event(s)`,
    );
  });

  await t.test('a denial annotated on a session tool_result is counted from the stream, not graded', async (t) => {
    const dir = await caseDir(t);
    const stream = join(dir, 't2-violation.jsonl');
    const log = join(dir, 'sbx_probe_t2.log');
    const text = readFileSync(fixture('t2-run-form'), 'utf8').replace(
      '"text":"pending"',
      '"text":"pending\\n<sandbox_violations>api.anthropic.com:443 refused: host is not on the allow list</sandbox_violations>"',
    );
    await writeFile(stream, text);
    await writeFile(join(dir, 'sbx_probe_t2.verdict'), 'pass\n');
    await writeFile(log, '== run-test-suite.sh: gate test exited 0 ==\n');
    assert.equal(
      await graded(dir, 'sp__t2_grade', [stream, T2_COMMAND, join(dir, 'sbx_probe_t2.verdict'), log]),
      `pass|run-test-suite.sh verdict pass; ${DENIALS}: 0; ${STREAM_DENIALS}: 1 event(s)`,
    );
  });

  await t.test('a Linux refusal line in the log is quoted on Linux only, else the gate-exit line', async (t) => {
    const dir = await caseDir(t);
    const verdict = join(dir, 'sbx_probe_t2.verdict');
    const log = join(dir, 'sbx_probe_t2.log');
    const exit = '== run-test-suite.sh: gate test exited 1 ==';
    const erofs = "mktemp: failed to create file via template '/tmp/x': Read-only file system";
    await writeFile(verdict, `fail ${log}\n`);
    await writeFile(log, `${exit}\n${erofs}\n`);
    const args = [fixture('t2-run-form'), T2_COMMAND, verdict, log];
    assert.equal(
      await gradedOn(dir, 'linux', 'sp__t2_grade', args),
      `fail|${erofs}; ${COMPARE}; ${DENIALS}: 0; ${STREAM_DENIALS}: 0 event(s)`,
    );
    assert.equal(
      await gradedOn(dir, '', 'sp__t2_grade', args),
      `fail|${exit}; ${COMPARE}; ${DENIALS}: 0; ${STREAM_DENIALS}: 0 event(s)`,
    );
  });
});

/**
 * Writes `<dir>/<name>.jsonl`: one launcher call `command` whose tool_result carries `text`, in the
 * T2 fixture's shape. A non-zero `exit` opens the text on the Bash tool's `Exit code <n>` header.
 */
async function launchStream(dir, name, command, text, exit = 0) {
  const content = exit === 0 ? [{ type: 'text', text }] : `Exit code ${exit}\n${text}`;
  const result = { type: 'tool_result', tool_use_id: 'tu1', content };
  if (exit !== 0) result.is_error = true;
  const lines = [
    { type: 'system', subtype: 'init', session_id: `sp-${name}`, cwd: dir },
    { type: 'user', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'user', content: 'Run the commands.' } },
    {
      type: 'assistant',
      timestamp: '2026-01-01T00:00:01.000Z',
      message: { id: 'm1', content: [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command } }] },
    },
    { type: 'user', timestamp: '2026-01-01T00:00:02.000Z', message: { role: 'user', content: [result] } },
    {
      type: 'result',
      subtype: 'success',
      timestamp: '2026-01-01T00:00:03.000Z',
      duration_ms: 3000,
      permission_denials: [],
    },
  ];
  const path = join(dir, `${name}.jsonl`);
  await writeFile(path, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return path;
}

test('sp__t3_grade: T2’s grade kept only when the launcher answered pending', async (t) => {
  /** A pass lane and the launcher call, both under `dir`. */
  async function lane(dir) {
    const verdict = join(dir, 'sbx_probe_t2.verdict');
    const log = join(dir, 'sbx_probe_t2.log');
    await writeFile(verdict, 'pass\n');
    await writeFile(log, '== run-test-suite.sh: gate test exited 0 ==\n');
    const command = `bash ${dir}/main/scripts/launch-sandboxed-gates.sh ${dir}/clone sbx_probe_t2`;
    return { verdict, log, command };
  }

  await t.test('pending, bare or under its Exit code 3 header, keeps the pass verdict', async (t) => {
    const dir = await caseDir(t);
    const { verdict, log, command } = await lane(dir);
    for (const exit of [0, 3]) {
      const stream = await launchStream(dir, `t3-pending-${exit}`, command, 'pending', exit);
      assert.equal(
        await graded(dir, 'sp__t3_grade', [stream, command, verdict, log]),
        `pass|the launcher answered pending; run-test-suite.sh verdict pass; ${DENIALS}: 0; ${STREAM_DENIALS}: 0 event(s)`,
        `exit ${exit}`,
      );
    }
  });

  await t.test('in-session with a pass verdict on disk is not run', async (t) => {
    const dir = await caseDir(t);
    const { verdict, log, command } = await lane(dir);
    const stream = await launchStream(dir, 't3-in-session', command, 'in-session', 4);
    const out = await graded(dir, 'sp__t3_grade', [stream, command, verdict, log]);
    assert.ok(out.startsWith('not run|'), out);
    assert.ok(
      out.includes(
        "the launcher answered 'in-session', not pending, so no sandboxed gate run was started: run-test-suite.sh verdict pass",
      ),
      out,
    );
  });

  await t.test('the launcher’s refusal is not run, quoting it', async (t) => {
    const dir = await caseDir(t);
    const { verdict, log, command } = await lane(dir);
    const stream = await launchStream(dir, 't3-refused', command, T3_REFUSAL, 2);
    const out = await graded(dir, 'sp__t3_grade', [stream, command, verdict, log]);
    assert.ok(out.startsWith('not run|'), out);
    assert.ok(out.includes(`the launcher answered '${T3_REFUSAL}', not pending`), out);
  });

  await t.test('a launch call that did not run keeps T2’s not run', async (t) => {
    const dir = await caseDir(t);
    const { verdict, log, command } = await lane(dir);
    const out = await graded(dir, 'sp__t3_grade', [fixture('t2-run-form'), command, verdict, log]);
    assert.ok(out.startsWith('not run|the run form did not reach the gates: '), out);
    assert.ok(!out.includes('the launcher answered'), out);
  });
});

test('sp__t2_lane_state: verdict, gone, live or stale, first that applies', async (t) => {
  const dir = await caseDir(t);
  for (const [args, want] of [
    [['1', '1', '0', '1000', '30'], 'verdict'],
    [['1', '0', 'x', 'y', 'z'], 'verdict'],
    [['0', '0', '970', '1000', '30'], 'gone'],
    [['0', '1', '970', '1000', '30'], 'live'],
    [['0', '1', '969', '1000', '30'], 'stale'],
    [['0', '1', 'abc', '1000', '30'], 'stale'],
    [['0', '1', '', '1000', '30'], 'stale'],
    [['0', '1', '970', 'now', '30'], 'stale'],
  ]) {
    const run = await sourced(dir, 'sp__t2_lane_state "$@"', args);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, `${want}\n`, args.join(' '));
  }
});

test('sp__td2_tmpdir: the printed TMPDIR as one literal path', async (t) => {
  await t.test('the substituted printenv TMPDIR call prints the path without its trailing slash', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    const run = await sourced(dir, 'sp__td2_tmpdir "$@"', [join(dir, 'td2-tmpdir.jsonl'), 'printenv TMPDIR']);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, `${dir}/claude-tmp\n`);
  });

  await t.test('a session with no such call returns status 1 and prints nothing', async (t) => {
    const dir = await caseDir(t);
    const run = await sourced(dir, 'sp__td2_tmpdir "$@"', [fixture('ran'), 'printenv TMPDIR']);
    assert.equal(run.status, 1, run.stderr);
    assert.equal(run.stdout, '');
  });
});

test('sp__td2_grade: the four mktemp forms against the literal TMPDIR', async (t) => {
  await t.test('three sandbox refusals and an explicit path under TMPDIR pass, clauses in form order', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    const tmp = `${dir}/claude-tmp`;
    assert.equal(
      await graded(dir, 'sp__td2_grade', [join(dir, 'td2-forms.jsonl'), tmp]),
      'pass|' +
        [
          `bare: sandbox mktemp: mkstemp failed on ${dir}/system-tmp/tmp.XXXXXXXXXX: Operation not permitted`,
          `-d: sandbox mktemp: mkdtemp failed on ${dir}/system-tmp/tmp.XXXXXXXXXX: Operation not permitted`,
          `-t: sandbox mktemp: mkstemp failed on ${dir}/system-tmp/harness-gates.XXXXXXXX: Operation not permitted`,
          `explicit: ran ${tmp}/harness-gates.AbC123`,
        ].join('; '),
    );
  });

  // Defect 3's guard: a control the permission layer refused never reached the sandbox.
  await t.test('an explicit form refused at the permission layer is not run, never fail', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    const tmp = `${dir}/claude-tmp`;
    const out = await graded(dir, 'sp__td2_grade', [join(dir, 'td2-control-permission.jsonl'), tmp]);
    assert.ok(out.startsWith('not run|'), out);
    assert.ok(
      out.endsWith(
        `; explicit: refused at the permission layer, so it never reached the sandbox: Permission to use Bash with command mktemp ${tmp}/harness-gates.XXXXXX has been denied because Claude Code is running in don't ask mode.`,
      ),
      out,
    );
  });
});

test('sp__td4_grade: the four forms against TD3’s result', async (t) => {
  const TOO_FEW = "-t: Exit code 1: mktemp: too few X's in template 'harness-gates'";

  await t.test('bare and -d written under TMPDIR, -t too few X’s, explicit written: pass, in form order', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    assert.equal(
      await gradedOn(dir, 'linux', 'sp__td4_grade', [join(dir, 'td4-forms.jsonl'), dir]),
      'pass|' +
        [
          `bare: written ${dir}/tmp.AbC123`,
          `-d: written ${dir}/tmp.DeF456`,
          TOO_FEW,
          `explicit: written ${dir}/harness-gates.GhI789`,
        ].join('; '),
    );
  });

  await t.test('a form the sandbox refused differs from TD3 and fails', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    assert.equal(
      await gradedOn(dir, 'linux', 'sp__td4_grade', [join(dir, 'td4-refused.jsonl'), dir]),
      'fail|' +
        [
          `bare: refused (sandbox) mktemp: failed to create file via template '${dir}/tmp.XXXXXXXXXX': Read-only file system — differs from TD3`,
          `-d: written ${dir}/tmp.DeF456`,
          TOO_FEW,
          `explicit: written ${dir}/harness-gates.GhI789`,
        ].join('; '),
    );
  });

  await t.test('an error carrying no known text is not run, naming it', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    const out = await gradedOn(dir, 'linux', 'sp__td4_grade', [join(dir, 'td4-unrecognised.jsonl'), dir]);
    assert.ok(out.startsWith('not run|'), out);
    assert.ok(
      out.includes(
        '; -d: no refusal string this judge knows on Linux, so not graded: Exit code 1: mktemp: sbx unknown failure; ',
      ),
      out,
    );
  });

  // Defect 3's guard, on TD4: a control the permission layer refused never reached the sandbox.
  await t.test('an explicit form refused at the permission layer is not run, never fail', async (t) => {
    const dir = await caseDir(t);
    await substituteTd2(dir);
    const tmp = `${dir}/claude-tmp`;
    const out = await gradedOn(dir, 'linux', 'sp__td4_grade', [join(dir, 'td2-control-permission.jsonl'), tmp]);
    assert.ok(out.startsWith('not run|'), out);
    assert.ok(
      out.endsWith(
        `; explicit: refused (permission) Permission to use Bash with command mktemp ${tmp}/harness-gates.XXXXXX has been denied because Claude Code is running in don't ask mode.`,
      ),
      out,
    );
  });

  await t.test('sp_leg_row_for picks the Linux row on Linux only', async (t) => {
    const dir = await caseDir(t);
    for (const [platform, rows] of [
      ['linux', 'TD4\nT3\n'],
      ['', 'TD2\nT2\n'],
    ]) {
      const run = await runBash(
        dir,
        [
          '-c',
          `. "$1"; . "$2"; . "$3"; . "$4"; . "$5"; SP_PLATFORM="$6"; sp_leg_row_for TD2 TD4; sp_leg_row_for T2 T3`,
          '_',
          ...LIBS,
          PLATFORM_LIB,
          platform,
        ],
        { SP_VERSION: '' },
      );
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, rows, `SP_PLATFORM='${platform}'`);
    }
  });
});
