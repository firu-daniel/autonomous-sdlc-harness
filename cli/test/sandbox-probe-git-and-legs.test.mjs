/**
 * The sandbox probe's git judges (`sp_remote_tip`, `sp_judge_push`, `sp_judge_ref` in
 * `scripts/lib/sandbox-probe/judge.sh`), its leg table (`SP_LEGS`, printed by
 * `scripts/sandbox-probe.sh --list`), its result line (`sp_result_line` in
 * `scripts/lib/sandbox-probe/core.sh`) and its non-pass record (`sp_leg_nonpass`, same file).
 *
 * **The rule these tests exist to enforce: the probe's git judges read refs, never exit statuses —
 * a push by `ls-remote` on origin, a commit by `rev-parse` before and after — and its leg table is
 * the single declaration `--list` prints, every row id in exactly one leg, and Gate 15 in
 * `docs/development.md` restates it row for row. A result line's row must be one of its leg's rows,
 * so an argument shift that fuses the row with the verdict is refused at its source. The Linux-only
 * legs (`SP_LINUX_ONLY_LEGS`) are recorded `not run` row by row off Linux, a leg whose row differs by
 * platform takes the one `sp_leg_row_for` picks from `SP_PLATFORM`, and the parity script's text
 * changes on Linux in its two expectation endings only. The job declaration `--list --job` prints is
 * the single source of which rows each leg takes in job mode, every job row is a row of its leg,
 * Gate 15 restates it row for row, and in job mode a clone-only row can be printed only `not run`.**
 *
 * The judges run in a `bash -c` that sources `core.sh` and `judge.sh` from `WORKSPACE_ROOT`, with the
 * fixture (or `os.tmpdir()`) as its working directory; every repository argument names a `seedRepository` fixture and
 * its bare origin, both under one `os.tmpdir()` directory removed when the case ends. Neither file
 * reads `SP_MAIN` or the probe's own checkout. `--list` runs the probe in place and touches nothing.
 *
 * Left out deliberately: the sandboxed sessions, which only a hand-run `sandbox-probe.sh run`
 * reaches, so no case launches `claude`; and the preflight refusals and the `shasum` guard, which
 * `cli/test/sandbox-probe-shell.test.mjs` covers.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runBash, runGit, seedRepository, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE = join(WORKSPACE_ROOT, 'scripts', 'sandbox-probe.sh');
const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const CORE = join(PROBE_LIB, 'core.sh');
const JUDGE = join(PROBE_LIB, 'judge.sh');

/** The run order, the Linux legs placed before `headless-parity` and `refusal` last. */
const LEG_ORDER = [
  'gates',
  'mktemp',
  'scratch',
  'retrieval',
  'wrappers',
  'wrappers-refresh',
  'planted-config',
  'planted-files',
  'write-protection',
  'git',
  'network',
  'retry',
  'repo-settings',
  'credentials',
  'invalid-profile',
  'glob-deny',
  'registry',
  'detached',
  'loopback',
  'job-layout',
  'runner-install',
  'runner-pid',
  'runner-privs',
  'headless-parity',
  'refusal',
];

/** The legs that run in job mode, in leg-table order. */
const JOB_LEGS = [
  'wrappers',
  'planted-files',
  'write-protection',
  'network',
  'credentials',
  'detached',
  'loopback',
  'job-layout',
  'runner-install',
  'runner-pid',
  'runner-privs',
];

/** The rows the probe's branches added to the table, ranges expanded. */
const NEW_ROWS = [
  'P1b',
  'P1c',
  'SR1',
  'SR2',
  'MC1',
  'CS12',
  'CS13',
  'CS14',
  'CS15',
  'N3',
  'N4',
  'N5',
  'RT1',
  'S4',
  'S5',
  'RS1',
  'HP1',
  'T3',
  'TD4',
  'GW1',
  'GW2',
  'RG1',
  'RG2',
  'RG3',
  'BG9',
  'WF5',
  'LB1',
  'LB2',
  'LB3',
  'LB4',
  'LB5',
  'RF1',
  'RF2',
  'RF3',
  'CS6',
  'IS1',
  'IS2',
  'IS3',
  'IS4',
  'PN1',
  'PN2',
  'PN3',
  'NN1',
  'NN2',
];

/**
 * `body` run after sourcing the two libraries, its own arguments in `"$@"`, in `cwd`. `SP_VERSION`
 * is blanked so `claude=` reads `unknown` unless a case sets it.
 */
function sourced(cwd, body, args = [], env = {}) {
  return runBash(cwd, ['-c', `. "$1"; . "$2"; shift 2; ${body}`, '_', CORE, JUDGE, ...args], {
    SP_VERSION: '',
    ...env,
  });
}

/** Runs one judge and returns `<SP_VERDICT>|<SP_EVIDENCE>|<status>`. */
async function judged(cwd, judge, args) {
  const run = await sourced(cwd, `${judge} "$@"; s=$?; printf '%s|%s|%s' "$SP_VERDICT" "$SP_EVIDENCE" "$s"`, args);
  assert.equal(run.stderr, '');
  return run.stdout;
}

/**
 * A seeded repository with its bare origin, both inside one `os.tmpdir()` directory removed when the
 * case ends, plus the default branch name and origin's tip for it.
 *
 * @param {import('node:test').TestContext} t
 */
async function gitFixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'sandbox-probe-git-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  await mkdir(repo);
  await seedRepository(repo);
  const branch = (await runGit(repo, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim();
  const seed = (await runGit(repo, ['rev-parse', `refs/remotes/origin/${branch}`])).stdout.trim();
  return { root, repo, branch, seed };
}

/** A new commit object on `parent` (or a root commit), written without touching `HEAD`. */
async function commitObject(repo, parent, message) {
  const tree = (await runGit(repo, ['hash-object', '-w', '-t', 'tree', '/dev/null'])).stdout.trim();
  const parents = parent === null ? [] : ['-p', parent];
  return (await runGit(repo, ['commit-tree', tree, ...parents, '-m', message])).stdout.trim();
}

test('sp_remote_tip reads origin by ls-remote', async (t) => {
  const f = await gitFixture(t);
  const tip = await sourced(f.repo, 'sp_remote_tip "$@"', [f.repo, f.branch]);
  assert.equal(tip.stdout, `${f.seed}\n`, tip.stderr);
  const absent = await sourced(f.repo, 'sp_remote_tip "$@"; printf "|%s" "$?"', [f.repo, 'no-such-branch']);
  assert.equal(absent.stdout, '|0', absent.stderr);
});

test('sp_judge_push: pass only when ls-remote moved', async (t) => {
  const f = await gitFixture(t);

  await t.test('origin unchanged is fail', async () => {
    assert.equal(await judged(f.repo, 'sp_judge_push', [f.repo, f.branch, f.seed]), `fail|ls-remote ${f.seed} unchanged|0`);
  });

  await t.test('no branch on origin is fail, naming the tip before', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_push', [f.repo, 'never-pushed', '']),
      'fail|ls-remote: no refs/heads/never-pushed on origin (before: none)|0',
    );
  });

  await t.test('a fast-forward push to origin is pass', async () => {
    const next = await commitObject(f.repo, f.seed, 'probe push');
    await runGit(f.repo, ['push', '--quiet', 'origin', `${next}:refs/heads/${f.branch}`]);
    assert.equal(await judged(f.repo, 'sp_judge_push', [f.repo, f.branch, f.seed]), `pass|ls-remote ${f.seed}..${next}|0`);
  });

  await t.test('a branch created on origin, with no tip before, is pass', async () => {
    const root = await commitObject(f.repo, null, 'probe new branch');
    await runGit(f.repo, ['push', '--quiet', 'origin', `${root}:refs/heads/probe-new`]);
    assert.equal(await judged(f.repo, 'sp_judge_push', [f.repo, 'probe-new', '']), `pass|ls-remote none..${root}|0`);
  });

  await t.test('a local-only commit, origin untouched, is fail', async () => {
    const before = (await sourced(f.repo, 'sp_remote_tip "$@"', [f.repo, f.branch])).stdout.trim();
    const local = await commitObject(f.repo, before, 'probe local only');
    await runGit(f.repo, ['update-ref', `refs/heads/${f.branch}`, local]);
    assert.equal(await judged(f.repo, 'sp_judge_push', [f.repo, f.branch, before]), `fail|ls-remote ${before} unchanged|0`);
  });
});

test('sp_judge_ref: moved or unchanged by rev-parse before and after', async (t) => {
  const f = await gitFixture(t);
  const ref = 'refs/heads/probe-ref';
  const first = await commitObject(f.repo, null, 'probe ref first');
  await runGit(f.repo, ['update-ref', ref, first]);

  await t.test('an unchanged ref expected unchanged is pass', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, ref, first, 'unchanged']),
      `pass|rev-parse ${ref} ${first}..${first} (unchanged)|0`,
    );
  });

  await t.test('an unchanged ref expected moved is fail', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, ref, first, 'moved']),
      `fail|rev-parse ${ref} ${first}..${first} (unchanged)|0`,
    );
  });

  await t.test('a ref absent before and after reads unchanged', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, 'refs/heads/never-made', '', 'unchanged']),
      'pass|rev-parse refs/heads/never-made none..none (unchanged)|0',
    );
  });

  await t.test('an unknown expectation is fail with status 1', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, ref, first, 'landed']),
      "fail|sp_judge_ref: expectation 'landed' is not moved or unchanged|1",
    );
  });

  const second = await commitObject(f.repo, first, 'probe ref second');
  await runGit(f.repo, ['update-ref', ref, second]);

  await t.test('a moved ref expected moved is pass', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, ref, first, 'moved']),
      `pass|rev-parse ${ref} ${first}..${second} (moved)|0`,
    );
  });

  await t.test('a moved ref expected unchanged is fail', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, ref, first, 'unchanged']),
      `fail|rev-parse ${ref} ${first}..${second} (moved)|0`,
    );
  });

  await t.test('a ref created during the session reads moved', async () => {
    assert.equal(
      await judged(f.repo, 'sp_judge_ref', [f.repo, ref, '', 'moved']),
      `pass|rev-parse ${ref} none..${second} (moved)|0`,
    );
  });
});

/** `--list`'s lines, each split into its four tab-separated fields. */
async function legTable() {
  const run = await runBash(WORKSPACE_ROOT, [PROBE, '--list']);
  assert.equal(run.status, 0, run.stderr);
  assert.ok(run.stdout.endsWith('\n'), 'the table ends with a newline');
  return run.stdout
    .slice(0, -1)
    .split('\n')
    .map((line) => {
      const fields = line.split('\t');
      assert.equal(fields.length, 4, `not four tab-separated fields: ${JSON.stringify(line)}`);
      const [leg, rows, expected, recorded] = fields;
      return { leg, rows: rows.split(','), expected, recorded };
    });
}

test('--list prints the leg table', async (t) => {
  const table = await legTable();

  await t.test('one line per leg, in run order', () => {
    assert.deepEqual(
      table.map((entry) => entry.leg),
      LEG_ORDER,
    );
  });

  await t.test('every leg carries its rows, an expected result and where it is recorded', () => {
    for (const entry of table) {
      assert.ok(entry.rows.length > 0 && entry.rows.every((row) => /^[A-Z]+[0-9]+[a-z]?$/.test(row)), entry.leg);
      assert.notEqual(entry.expected, '', entry.leg);
      assert.notEqual(entry.recorded, '', entry.leg);
    }
  });

  await t.test('no row id appears in two legs, or twice in one', () => {
    const seen = new Map();
    for (const entry of table) {
      for (const row of entry.rows) {
        assert.ok(!seen.has(row), `${row} is in ${seen.get(row)} and ${entry.leg}`);
        seen.set(row, entry.leg);
      }
    }
  });

  await t.test("every new row id is in exactly one leg, and CS4 is the wrappers leg's alone", () => {
    for (const row of NEW_ROWS) {
      const legs = table.filter((entry) => entry.rows.includes(row)).map((entry) => entry.leg);
      assert.equal(legs.length, 1, `${row} is in ${JSON.stringify(legs)}`);
    }
    assert.deepEqual(
      table.filter((entry) => entry.rows.includes('CS4')).map((entry) => entry.leg),
      ['wrappers'],
    );
  });

  await t.test('sp_leg_rows answers each leg with the row field --list printed', async () => {
    const names = await sourced(tmpdir(), 'sp_leg_names');
    assert.equal(names.stdout, LEG_ORDER.map((leg) => `${leg}\n`).join(''), names.stderr);
    for (const entry of table) {
      const rows = await sourced(tmpdir(), 'sp_leg_rows "$1"', [entry.leg]);
      assert.equal(rows.stdout, `${entry.rows.join(',')}\n`, rows.stderr);
    }
    const unknown = await sourced(tmpdir(), 'sp_leg_rows no-such-leg; printf "|%s" "$?"');
    assert.equal(unknown.stdout, '|1');
  });

  await t.test("run --leg refusal is a usage error, raised before preflight", async () => {
    const run = await runBash(WORKSPACE_ROOT, [PROBE, 'run', '--leg', 'refusal']);
    assert.equal(run.status, 1, run.stderr);
    assert.ok(
      run.stderr.split('\n').includes("sandbox-probe: the refusal leg runs only through 'sandbox-probe.sh refusal'"),
      run.stderr,
    );
  });
});

test('the Linux-only legs and the per-platform rows', async (t) => {
  await t.test('sp_leg_linux_only answers 0 for exactly the Linux-only legs', async () => {
    const legs = [
      'glob-deny',
      'registry',
      'detached',
      'loopback',
      'refusal',
      'runner-install',
      'runner-pid',
      'runner-privs',
      'gates',
      'headless-parity',
      'job-layout',
    ];
    const run = await sourced(tmpdir(), 'for leg in "$@"; do sp_leg_linux_only "$leg"; printf "%s=%s\\n" "$leg" "$?"; done', legs);
    assert.equal(
      run.stdout,
      'glob-deny=0\nregistry=0\ndetached=0\nloopback=0\nrefusal=0\nrunner-install=0\nrunner-pid=0\nrunner-privs=0\n' +
        'gates=1\nheadless-parity=1\njob-layout=1\n',
      run.stderr,
    );
  });

  await t.test('sp_leg_platform_skip records each row not run, naming the host', async () => {
    const run = await sourced(tmpdir(), 'sp_leg_platform_skip loopback', [], { SP_PLATFORM: 'macos' });
    assert.equal(
      run.stdout,
      ['LB1', 'LB2', 'LB3', 'LB4', 'LB5']
        .map(
          (row) =>
            `leg="loopback" row="${row}" result="not run" evidence="Linux only: this host is macos" departure="none" claude="unknown"\n`,
        )
        .join(''),
      run.stderr,
    );
  });

  await t.test('sp_leg_row_for takes the Linux row on linux and the macOS row otherwise', async () => {
    for (const [platform, row] of [
      ['linux', 'TD4'],
      ['macos', 'TD2'],
      ['', 'TD2'],
    ]) {
      const run = await sourced(tmpdir(), 'sp_leg_row_for TD2 TD4', [], { SP_PLATFORM: platform });
      assert.equal(run.stdout, `${row}\n`, `SP_PLATFORM=${platform}: ${run.stderr}`);
    }
  });
});

/**
 * The Gate 15 table in `docs/development.md` under `header`, read to the next blank line, each row as
 * `--list` would print it: backticks stripped, cells tab-joined, the row cell's `, ` joined to `,`.
 */
function restatedTable(header, cellCount) {
  const doc = readFileSync(join(WORKSPACE_ROOT, 'docs', 'development.md'), 'utf8').split('\n');
  const start = doc.indexOf(header);
  assert.notEqual(start, -1, `${header} is in docs/development.md`);
  const end = doc.indexOf('', start);
  return doc.slice(start + 2, end === -1 ? undefined : end).map((line) => {
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.replaceAll('`', '').trim());
    assert.equal(cells.length, cellCount, `not ${cellCount} cells: ${JSON.stringify(line)}`);
    cells[1] = cells[1].replaceAll(', ', ',');
    return cells.join('\t');
  });
}

/** The probe's stdout for `args`, one entry per line, the trailing newline dropped. */
async function listed(args) {
  const run = await runBash(WORKSPACE_ROOT, [PROBE, ...args]);
  assert.equal(run.status, 0, run.stderr);
  const lines = run.stdout.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

test("Gate 15's restated leg table matches --list, row for row", async () => {
  assert.deepEqual(restatedTable('| Leg | Rows | Expected | Recorded in |', 4), await listed(['--list']));
});

test('--list --job prints the job table', async (t) => {
  const table = await legTable();
  const job = (await listed(['--list', '--job'])).map((line) => {
    const fields = line.split('\t');
    assert.equal(fields.length, 2, `not two tab-separated fields: ${JSON.stringify(line)}`);
    return { leg: fields[0], rows: fields[1].split(',') };
  });

  await t.test('one line per job leg, exactly the eleven, in leg-table order', () => {
    assert.deepEqual(
      job.map((entry) => entry.leg),
      JOB_LEGS,
    );
    assert.deepEqual(
      LEG_ORDER.filter((leg) => JOB_LEGS.includes(leg)),
      JOB_LEGS,
    );
  });

  await t.test("every job row is in that leg's --list row field", () => {
    for (const entry of job) {
      const leg = table.find((row) => row.leg === entry.leg);
      assert.ok(leg, `${entry.leg} is not a --list leg`);
      assert.ok(entry.rows.length > 0, entry.leg);
      for (const row of entry.rows) {
        assert.ok(leg.rows.includes(row), `${row} is not a row of ${entry.leg} (${leg.rows.join(',')})`);
      }
    }
  });

  await t.test('no non-job leg appears', () => {
    for (const entry of job) assert.ok(JOB_LEGS.includes(entry.leg), entry.leg);
  });

  await t.test('sp_leg_job_rows answers each job leg with its field, and git with status 1', async () => {
    for (const entry of job) {
      const rows = await sourced(tmpdir(), 'sp_leg_job_rows "$1"', [entry.leg]);
      assert.equal(rows.stdout, `${entry.rows.join(',')}\n`, rows.stderr);
    }
    const git = await sourced(tmpdir(), 'sp_leg_job_rows git; printf "|%s" "$?"');
    assert.equal(git.stdout, '|1', git.stderr);
  });
});

test("Gate 15's restated job table matches --list --job, row for row", async () => {
  assert.deepEqual(restatedTable('| Leg | Job rows |', 2), await listed(['--list', '--job']));
});

test('the mode skips and the job-mode result line', async (t) => {
  /** `sp_result_line`'s line for a `not run` row, `claude=` unknown. */
  const notRun = (leg, row, evidence) =>
    `leg="${leg}" row="${row}" result="not run" evidence="${evidence}" departure="none" claude="unknown"\n`;

  await t.test('sp_leg_mode_skip prints one not run line per row, carrying the evidence', async () => {
    const run = await sourced(tmpdir(), 'sp_leg_mode_skip runner-pid "job mode only: x"');
    assert.equal(
      run.stdout,
      ['PN1', 'PN2', 'PN3'].map((row) => notRun('runner-pid', row, 'job mode only: x')).join(''),
      run.stderr,
    );
  });

  await t.test('sp_job_skip_clone_rows prints the clone-only rows in job mode, and nothing outside it', async () => {
    const job = await sourced(tmpdir(), 'SP_JOB_MODE=1; sp_job_skip_clone_rows wrappers');
    assert.equal(
      job.stdout,
      ['CS4', 'P3', 'CW2']
        .map((row) => notRun('wrappers', row, 'clone layout only: job mode measures no clone, only the checkout itself'))
        .join(''),
      job.stderr,
    );
    const clone = await sourced(tmpdir(), 'SP_JOB_MODE=0; sp_job_skip_clone_rows wrappers; printf "|%s" "$?"');
    assert.equal(clone.stdout, '|0', clone.stderr);
  });

  await t.test('in job mode a measured clone-only row is refused, while not run and a job row print', async () => {
    const refused = await sourced(
      tmpdir(),
      'SP_JOB_MODE=1; sp_result_line wrappers CW2 pass x ""; printf "|%s|%s" "$?" "$SP_FAIL_COUNT"',
    );
    assert.equal(refused.stdout, '|1|1');
    assert.equal(
      refused.stderr,
      "sandbox-probe: sp_result_line: row 'CW2' of leg 'wrappers' is not a job-mode row, so its verdict 'pass' is refused in job mode\n",
    );

    const skipped = await sourced(tmpdir(), 'SP_JOB_MODE=1; sp_result_line wrappers CW2 "not run" x ""');
    assert.equal(skipped.stdout, notRun('wrappers', 'CW2', 'x'), skipped.stderr);

    const measured = await sourced(tmpdir(), 'SP_JOB_MODE=1; sp_result_line wrappers P1b pass x ""');
    assert.equal(
      measured.stdout,
      'leg="wrappers" row="P1b" result="pass" evidence="x" departure="none" claude="unknown"\n',
      measured.stderr,
    );
  });

  await t.test('outside job mode a measured clone-only row prints as before', async () => {
    const run = await sourced(tmpdir(), 'SP_JOB_MODE=0; sp_result_line wrappers CW2 pass x ""');
    assert.equal(run.stdout, 'leg="wrappers" row="CW2" result="pass" evidence="x" departure="none" claude="unknown"\n', run.stderr);
  });

  for (const [args, refusal] of [
    [['run', '--runner-controls', 'x'], 'sandbox-probe: --runner-controls needs --job <checkout>'],
    [
      ['run', '--job', '/nonexistent', '--leg', 'headless-parity'],
      "sandbox-probe: --job does not take --leg headless-parity: the parity script prints a clone's paths",
    ],
  ]) {
    await t.test(`${args.join(' ')} is a usage error, raised before preflight`, async () => {
      const run = await runBash(WORKSPACE_ROOT, [PROBE, ...args]);
      assert.equal(run.status, 1, run.stderr);
      assert.equal(run.stdout, '');
      const lines = run.stderr.split('\n');
      assert.equal(lines[0], refusal, run.stderr);
      assert.ok(
        lines.some((line) => line.startsWith('Usage: sandbox-probe.sh')),
        run.stderr,
      );
      assert.ok(!run.stderr.includes('stamp:'), 'no preflight output');
    });
  }
});

test('sp_result_line: fixed field order, double-quoted values', async (t) => {
  await t.test('every field, in order, with claude= from SP_VERSION', async () => {
    const run = await runBash(
      tmpdir(),
      ['-c', '. "$1"; shift; sp_result_line "$@"', '_', CORE, 'network', 'N3', 'pass', 'Operation not permitted', 'interactive'],
      { SP_VERSION: '2.1.0 (Claude Code)' },
    );
    assert.equal(
      run.stdout,
      'leg="network" row="N3" result="pass" evidence="Operation not permitted" departure="interactive" claude="2.1.0 (Claude Code)"\n',
      run.stderr,
    );
  });

  await t.test('evidence keeps its first line, each double quote becomes a single one, and an empty departure is none', async () => {
    const run = await sourced(tmpdir(), 'sp_result_line "$@"', [
      'git',
      'CS3',
      'not run',
      'first "quoted" line\nsecond line\nthird',
      '',
    ]);
    assert.equal(
      run.stdout,
      `leg="git" row="CS3" result="not run" evidence="first 'quoted' line" departure="none" claude="unknown"\n`,
      run.stderr,
    );

    const multiline = await sourced(tmpdir(), 'sp_result_line "$@"', [
      'git',
      'CS3',
      'fail',
      'first "quoted" line\nsecond line\nthird',
      'one "departure"\ndropped',
    ]);
    assert.equal(
      multiline.stdout,
      `leg="git" row="CS3" result="fail" evidence="first 'quoted' line" departure="one 'departure'" claude="unknown"\n`,
      multiline.stderr,
    );
  });

  await t.test('a verdict other than pass, fail or not run prints no line and counts as a fail', async () => {
    const run = await sourced(tmpdir(), 'sp_result_line "$@"; printf "|%s|%s" "$?" "$SP_FAIL_COUNT"', [
      'git',
      'CS3',
      'passed',
      'x',
      '',
    ]);
    assert.equal(run.stdout, '|1|1');
    assert.equal(run.stderr, "sandbox-probe: sp_result_line: verdict 'passed' for git CS3 is not pass, fail or not run\n");
  });

  await t.test("a row fused with its verdict is refused, naming the leg's rows", async () => {
    const run = await sourced(tmpdir(), 'sp_result_line "$@"; printf "|%s|%s" "$?" "$SP_FAIL_COUNT"', [
      'gates',
      'T2fail',
      '<sandbox_violations>',
      'x',
      '',
    ]);
    assert.equal(run.stdout, '|1|1');
    assert.equal(run.stderr, "sandbox-probe: sp_result_line: row 'T2fail' is not a row of leg 'gates' (T2,W7,T3)\n");
  });

  await t.test('a foreign row is refused, the match is on whole rows, and judge takes row -', async () => {
    const foreign = await sourced(tmpdir(), 'sp_result_line "$@"; printf "|%s|%s" "$?" "$SP_FAIL_COUNT"', [
      'gates',
      'CS3',
      'pass',
      'x',
      '',
    ]);
    assert.equal(foreign.stdout, '|1|1');
    assert.equal(foreign.stderr, "sandbox-probe: sp_result_line: row 'CS3' is not a row of leg 'gates' (T2,W7,T3)\n");

    const prefix = await sourced(tmpdir(), 'sp_result_line "$@"; printf "|%s|%s" "$?" "$SP_FAIL_COUNT"', [
      'planted-files',
      'CS1',
      'pass',
      'x',
      '',
    ]);
    assert.equal(prefix.stdout, '|1|1');
    assert.equal(
      prefix.stderr,
      "sandbox-probe: sp_result_line: row 'CS1' is not a row of leg 'planted-files' (CS12,CS13,CS14,L1,L2)\n",
    );

    const judge = await sourced(tmpdir(), 'sp_result_line "$@"', ['judge', '-', 'pass', 'x', '']);
    assert.equal(judge.stdout, 'leg="judge" row="-" result="pass" evidence="x" departure="none" claude="unknown"\n', judge.stderr);
  });

  await t.test('sp_leg_nonpass records the leg of a not run line and of a refused line, not of a pass', async () => {
    const run = await sourced(
      tmpdir(),
      [
        "{ sp_result_line network N1 pass x ''; sp_result_line git CS3 'not run' x ''; sp_result_line gates T2fail fail x ''; } >/dev/null 2>&1",
        'sp_leg_nonpass network; a=$?',
        'sp_leg_nonpass git; b=$?',
        'sp_leg_nonpass gates; c=$?',
        'printf "%s,%s,%s" "$a" "$b" "$c"',
      ].join('; '),
    );
    assert.equal(run.stdout, '1,0,0', run.stderr);
  });
});

/**
 * The headless-parity checklist (`sp_print_parity_script` in `legs-settings.sh`). Its launch lines must
 * carry the flags the headless sessions launch with (`HARNESS_MAIN_REPO`, `--settings`,
 * `--permission-mode dontAsk`, `--model`/`--effort` when configured, both `--add-dir`s) and the
 * `--allowedTools` departures the headless N1, RT1 and CS2 sessions run with — both profiles set
 * `defaultMode: dontAsk`, so a bare `claude --settings <profile>` refuses every call at the permission
 * layer (2026-10-27) — and each step must print the exact prompt to paste, RT1's asking for the flag.
 * Every path is absolute and one shell word: a home directory with a space is single-quoted.
 */
test('print-parity-script: launch lines carry the headless flags and departures, steps carry the prompts', async (t) => {
  const n1 = 'curl -sS https://example.com/';

  /** `blocks` expected for the given (already shell-spelled) words. */
  function expected({ clone, run, net, main, state, home, cs2, model = '' }) {
    const launch = (settings, rule) =>
      `HARNESS_MAIN_REPO=${main} claude --settings ${settings} --permission-mode dontAsk${model} ` +
      `--add-dir ${clone} --add-dir ${state} --allowedTools ${rule}`;
    return [
      `cd ${clone}`,
      launch(net, `'Bash(${n1})'`),
      launch(run, "'Bash(dd:*)'"),
      `Run this Bash call exactly: ${n1}`,
      `Run this Bash call exactly, with dangerouslyDisableSandbox set to true: dd if=/dev/null of=${home} conv=notrunc`,
      `Run this Bash call exactly: dd if=/dev/null of=${cs2} conv=notrunc`,
      `ls -l ${home}`,
      `ls -l ${cs2}`,
    ];
  }

  function assertScript(stdout, blocks) {
    assert.deepEqual([...stdout.matchAll(/```\n(.*)\n```/g)].map((m) => m[1]), blocks);
    assert.match(stdout, /note the prompt's text in the record, and answer No to any offer to run the call unsandboxed/);
    assert.doesNotMatch(stdout, /~|\$HOME/, 'every path is spelled absolute');
  }

  const placeholders = {
    clone: "'<clone>'",
    run: "'<run profile>'",
    net: "'<net profile>'",
    main: "'<main>'",
    state: "'<main>/<stateDir>'",
    home: '/probe-home/sbx_probe_rt1_marker',
    cs2: "'<main>/.git/sbx_cs2_new'",
  };
  const darwin = await runBash(WORKSPACE_ROOT, [PROBE, 'print-parity-script'], {
    HOME: '/probe-home',
    SANDBOX_PROBE_UNAME: 'Darwin',
  });

  await t.test('the placeholder form, through the entry point', async () => {
    assert.equal(darwin.status, 0, darwin.stderr);
    assertScript(darwin.stdout, expected(placeholders));
  });

  await t.test('the placeholder form on Linux differs in the two expectation endings only', async () => {
    const run = await runBash(WORKSPACE_ROOT, [PROBE, 'print-parity-script'], {
      HOME: '/probe-home',
      SANDBOX_PROBE_UNAME: 'Linux',
    });
    assert.equal(run.status, 0, run.stderr);
    assertScript(run.stdout, expected(placeholders));
    const n1 = "; expect a <sandbox_violations> refusal:\n";
    const cs2 = '; expect Operation not permitted:\n';
    assert.equal(darwin.stdout.split(n1).length, 2, 'step 2 ends with the macOS expectation once');
    assert.equal(darwin.stdout.split(cs2).length, 2, 'step 4 ends with the macOS expectation once');
    assert.equal(
      run.stdout,
      darwin.stdout
        .replace(n1, '; expect a network refusal: CONNECT tunnel failed, response 403, or a <sandbox_violations> line:\n')
        .replace(cs2, '; expect a sandbox refusal: Read-only file system, or Operation not permitted:\n'),
    );
  });

  await t.test('the live form the leg prints, a home with a space quoted, model and effort mirrored', async () => {
    const libs = ['core.sh', 'session.sh', 'legs-protection.sh', 'legs-network.sh', 'legs-settings.sh'].map((f) =>
      join(PROBE_LIB, f),
    );
    const run = await runBash(
      tmpdir(),
      [
        '-c',
        'for f in "$1" "$2" "$3" "$4" "$5"; do . "$f"; done; shift 5; ' +
          'SP_STATE_DIR=sdlc-harness SP_AGENT_MODEL=opus SP_AGENT_EFFORT=high; sp_print_parity_script "$@"',
        '_',
        ...libs,
        '/w/clone',
        '/s/run.json',
        '/t/sbx_net.json',
        '/w/main',
      ],
      { HOME: '/Users/a b', SP_VERSION: '' },
    );
    assert.equal(run.status, 0, run.stderr);
    assertScript(
      run.stdout,
      expected({
        clone: '/w/clone',
        run: '/s/run.json',
        net: '/t/sbx_net.json',
        main: '/w/main',
        state: '/w/main/sdlc-harness',
        home: "'/Users/a b/sbx_probe_rt1_marker'",
        cs2: '/w/main/.git/sbx_cs2_new',
        model: ' --model opus --effort high',
      }),
    );
  });
});
