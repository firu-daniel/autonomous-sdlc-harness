/**
 * The sandbox probe's wrappers-leg grading (`sp__wr_reached`, `sp__wr_push_held`, `sp__wr_commit_held` and
 * `sp__wr_cw6_grade` in `legs-wrappers.sh`), run over the recorded streams in `fixtures/sandbox-probe/`.
 *
 * **The rule these tests exist to enforce: a wrappers-leg row passes only on a call that reached the layer
 * the row measures; a permission-layer refusal of any measured call, CW6's included, is `not run`, and
 * CW6's pass names the layer that answered.**
 *
 * No case launches a session: every case sources libraries and reads a fixture. The CW6 ref cases seed two
 * throwaway repositories under the case directory. Fixtures are passed unsubstituted, since each call is
 * matched byte-equal against a command that spells `@FIXTURE_ROOT@` the same way.
 */

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'controls.sh', 'legs-wrappers.sh'];
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

const CS4_COMMIT =
  'bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone sbx_wr_cs4.txt -- "chore: Sandbox probe CS4"';
const CS4_PUSH = 'bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone';
const P1C_CMD = 'bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone; git status';
const CW5_CMD =
  'bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone sbx_wr_compound.txt -- "chore: Sandbox probe CW5"; git status';
const CW6_CMD =
  'GIT_DIR=@FIXTURE_ROOT@/tmp/wr-cw6-scratch/.git bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone sbx_wr_prefix.txt -- "chore: Sandbox probe CW6"';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";
const PERMISSION_WHY = `refused at the permission layer, so it never reached the sandbox or the excludedCommands match: ${DONT_ASK}`;
const BRANCH = 'sbx_probe';
const WR_VERDICT = 'printf \'%s|%s\' "$SP__WR_V" "$SP__WR_E"';

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** `body` run after sourcing the probe libraries and `legs-wrappers.sh`, its own arguments in `"$@"`. */
function sourced(cwd, body, args, env = {}) {
  const libs = LIBS.map((f) => join(PROBE_LIB, f));
  return runBash(cwd, ['-c', `. "$1"; . "$2"; . "$3"; . "$4"; shift 4; ${body}`, '_', ...libs, ...args], {
    SP_VERSION: '',
    ...env,
  });
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-wrappers-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** Runs `fn "$@"` and returns `<SP__WR_V>|<SP__WR_E>`. */
async function wrGraded(dir, fn, args, env) {
  const run = await sourced(dir, `${fn} "$@"; ${WR_VERDICT}`, args, env);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

/** A throwaway repository at `dir` with one commit on {@link BRANCH}; returns that branch's sha. */
async function seedRepo(dir) {
  await mkdir(dir, { recursive: true });
  await runGit(dir, ['init', '-q']);
  await runGit(dir, ['checkout', '-q', '-b', BRANCH]);
  await commitOn(dir, 'seed');
  return revParse(dir);
}

async function commitOn(dir, message) {
  await runGit(dir, [
    '-c',
    'user.name=Sandbox Probe',
    '-c',
    'user.email=probe@example.invalid',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-q',
    '--allow-empty',
    '--no-verify',
    '-m',
    message,
  ]);
}

async function revParse(dir) {
  return (await runGit(dir, ['rev-parse', `refs/heads/${BRANCH}`])).stdout.trim();
}

test('sp__wr_reached: a permission-layer refusal never reaches the layer a wrappers row measures', async (t) => {
  async function reached(t, stream, cmd) {
    const run = await sourced(
      await caseDir(t),
      'sp__wr_reached "$@"; s=$?; printf \'%s|%s|%s\' "$s" "${SP_LAYER-}" "${SP__WR_WHY-}"',
      [stream, cmd],
    );
    assert.equal(run.stderr, '');
    return run.stdout.split('|');
  }

  await t.test('CS4’s commit refused at the permission layer is status 1 with the permission text', async (t) => {
    const [status, , why] = await reached(t, fixture('cs4-permission'), CS4_COMMIT);
    assert.equal(status, '1');
    assert.equal(why, PERMISSION_WHY);
  });

  await t.test('CS4’s push with an ordinary result is status 0, answered by ran', async (t) => {
    const [status, layer] = await reached(t, fixture('cs4-permission'), CS4_PUSH);
    assert.equal(status, '0');
    assert.equal(layer, 'ran');
  });

  await t.test('a command the stream does not hold is status 1', async (t) => {
    const [status, , why] = await reached(t, fixture('ran'), CS4_COMMIT);
    assert.equal(status, '1');
    assert.equal(why, `no Bash call "${CS4_COMMIT}" in the session`);
  });
});

test('sp__wr_push_held and sp__wr_commit_held: a permission-layer refusal is not run, reading no git state', async (t) => {
  // Neither path exists, so a git read would show in the evidence.
  async function held(t, fn, cmd) {
    const dir = await caseDir(t);
    return wrGraded(dir, fn, [fixture('p1c-permission'), cmd, 'deadbeef'], {
      SP_MAIN: join(dir, 'no-main'),
      SP_CLONE: join(dir, 'no-clone'),
      SP_BRANCH: BRANCH,
    });
  }

  await t.test('P1c’s compound push', async (t) => {
    assert.equal(await held(t, 'sp__wr_push_held', P1C_CMD), `not run|${PERMISSION_WHY}`);
  });

  await t.test('CW5’s compound commit', async (t) => {
    assert.equal(await held(t, 'sp__wr_commit_held', CW5_CMD), `not run|${PERMISSION_WHY}`);
  });
});

test('sp__wr_cw6_grade: CW6 is not run when refused at the permission layer, and its pass names the layer', async (t) => {
  await t.test('a permission-layer refusal is not run', async (t) => {
    const dir = await caseDir(t);
    const out = await wrGraded(
      dir,
      'sp__wr_cw6_grade',
      [fixture('cw6-permission'), CW6_CMD, join(dir, 'no-x', '.git'), 'deadbeef', 'deadbeef'],
      { SP_CLONE: join(dir, 'no-clone'), SP_BRANCH: BRANCH },
    );
    assert.equal(out, `not run|${PERMISSION_WHY}`);
  });

  async function seeded(t) {
    const dir = await caseDir(t);
    const clone = join(dir, 'clone');
    const x = join(dir, 'x');
    const cloneBefore = await seedRepo(clone);
    const xBefore = await seedRepo(x);
    return { dir, clone, x, xGit: join(x, '.git'), cloneBefore, xBefore };
  }

  await t.test('the wrapper answering sandboxed passes, naming the layer that answered', async (t) => {
    const s = await seeded(t);
    const out = await wrGraded(
      s.dir,
      'sp__wr_cw6_grade',
      [fixture('cw6-sandboxed'), CW6_CMD, s.xGit, s.xBefore, s.cloneBefore],
      { SP_CLONE: s.clone, SP_BRANCH: BRANCH },
    );
    assert.equal(
      out,
      `pass|stayed sandboxed: clone rev-parse refs/heads/${BRANCH} ${s.cloneBefore}..${s.cloneBefore} (unchanged); ` +
        `<x> rev-parse refs/heads/${BRANCH} ${s.xBefore}..${s.xBefore} (unchanged); call answered by ran: Exit code 1: ` +
        `commit-on-branch.sh: refusing to commit: cannot sync branch 'sbx_probe' in from '@FIXTURE_ROOT@/clone': ` +
        `the fetch of refs/heads/sbx_probe failed`,
    );
  });

  await t.test('<x>’s ref moving fails', async (t) => {
    const s = await seeded(t);
    await commitOn(s.x, 'moved');
    const out = await wrGraded(
      s.dir,
      'sp__wr_cw6_grade',
      [fixture('cw6-sandboxed'), CW6_CMD, s.xGit, s.xBefore, s.cloneBefore],
      { SP_CLONE: s.clone, SP_BRANCH: BRANCH },
    );
    assert.match(out, /^fail\|the GIT_DIR prefix reached <x>: /);
  });
});
