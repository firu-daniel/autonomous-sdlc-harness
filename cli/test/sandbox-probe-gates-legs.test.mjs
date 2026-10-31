/**
 * The sandbox probe's T2/T3 and TD2/TD4 grading functions (`sp__t2_grade`, `sp__td2_tmpdir`,
 * `sp__td2_grade`, `sp__td4_grade` in `scripts/lib/sandbox-probe/legs-local.sh`) and the row choice
 * between them (`sp_leg_row_for` in `core.sh`), run over the recorded streams in
 * `fixtures/sandbox-probe/` and over gate-lane files each case writes.
 *
 * **The rule these tests exist to enforce: T2 and T3 are graded from the gate lane's verdict and log,
 * T3's log search quoting a Linux refusal line on Linux only; TD2's control is a literal path; TD4 is
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
 * the lane's `.verdict` and `.log` are files the case writes.
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
