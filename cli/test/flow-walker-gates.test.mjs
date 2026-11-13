/**
 * The flow walker's gate library, `lib/flow-walker-gates.sh`: `fw_review_verdict`, `fw_fail_count`
 * and `fw_round_evidence`.
 *
 * **The rule this suite enforces: a round file's verdict is read only from exactly one
 * `verdict: PASS` / `verdict: FAIL` line, a folder's FAIL count counts only files read as `FAIL`,
 * and a round's evidence is reported literally — the highest round, each gate's verdict or
 * `missing` / `unreadable`, the next round's note, and whether a plan path changed after the
 * earliest present gate file was committed — without the library deciding anything from it.** The
 * line contract is `plugin/instructions/plan_review_rounds.md` → `## The round file`.
 *
 * Both libraries are the copies `init` shipped into a fixture (`cli/test/helpers/walker.mjs`: never
 * the template in this checkout), sourced by a `bash -c` driver that calls one function with fixed
 * arguments. Every case works in its own directory of one shared fixture repository, built under
 * the system temp directory and torn down in process.
 *
 * Not covered: `fw_round_evidence`'s status 2 when `git` cannot run in the root, which needs a root
 * outside any repository and so a second fixture this suite has no other use for.
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import { walkerFixture, walkerUnavailable } from './helpers/walker.mjs';

const SKIP = walkerUnavailable();

const DRIVER = '. "$1" || exit 99; . "$2" || exit 99; shift 2; "$@"';

/** @type {{ dir: string, cleanup: () => Promise<void> }} */
let fixture;

before(async () => {
  if (SKIP) return;
  fixture = await walkerFixture({ parity: false, qa: false });
});

after(async () => {
  if (fixture) await fixture.cleanup();
});

/** Call one library function, sourcing the `init`-shipped copies first. */
async function call(fn, ...args) {
  const lib = join(fixture.dir, INIT_SCRIPTS_DIR, 'lib');
  return runBash(fixture.dir, [
    '-c',
    DRIVER,
    'driver',
    join(lib, 'harness-run-lib.sh'),
    join(lib, 'flow-walker-gates.sh'),
    fn,
    ...args,
  ]);
}

/** Write `content` at fixture-relative `relative` and return its absolute path. */
async function plant(relative, content) {
  const path = join(fixture.dir, relative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  return path;
}

async function commit(...relatives) {
  await runGit(fixture.dir, ['add', '--', ...relatives]);
  await runGit(fixture.dir, ['commit', '-q', '--no-verify', '-m', 'fixture']);
}

const FAIL = '# Review\n\nverdict: FAIL\n';
const PASS = '# Review\n\nverdict: PASS\n';

test('fw_review_verdict reads exactly one verdict line', { skip: SKIP }, async (t) => {
  await t.test('a FAIL file prints FAIL', async () => {
    const file = await plant('verdict/fail/review_0.md', FAIL);
    assert.deepEqual(await call('fw_review_verdict', file), { status: 0, stdout: 'FAIL\n', stderr: '' });
  });

  await t.test('a PASS line ending in CR prints PASS', async () => {
    const file = await plant('verdict/crlf/review_0.md', '# Review\r\nverdict: PASS\r\n');
    assert.deepEqual(await call('fw_review_verdict', file), { status: 0, stdout: 'PASS\n', stderr: '' });
  });

  await t.test('a duplicated verdict line returns 1 and prints nothing', async () => {
    const file = await plant('verdict/dup/review_0.md', 'verdict: FAIL\nverdict: FAIL\n');
    assert.deepEqual(await call('fw_review_verdict', file), { status: 1, stdout: '', stderr: '' });
  });

  await t.test('a file with no verdict line, or none at all, returns 1', async () => {
    const file = await plant('verdict/none/review_0.md', 'verdict: maybe\n Verdict: FAIL\n');
    assert.deepEqual(await call('fw_review_verdict', file), { status: 1, stdout: '', stderr: '' });
    const absent = join(fixture.dir, 'verdict/none/review_9.md');
    assert.deepEqual(await call('fw_review_verdict', absent), { status: 1, stdout: '', stderr: '' });
  });
});

test('fw_fail_count counts only files read as FAIL', { skip: SKIP }, async () => {
  await plant('count/f/review_0.md', FAIL);
  await plant('count/f/review_1.md', FAIL);
  await plant('count/f/review_2.md', PASS);
  await plant('count/f/review_x.md', FAIL);
  assert.deepEqual(await call('fw_fail_count', join(fixture.dir, 'count/f')), { status: 0, stdout: '2\n', stderr: '' });
  assert.deepEqual(await call('fw_fail_count', join(fixture.dir, 'count/absent')), { status: 0, stdout: '0\n', stderr: '' });
});

test('fw_round_evidence reports a round literally', { skip: SKIP }, async (t) => {
  /** The call for case folder `c`: gates `a`, `b`, `c` over `<c>/a`, `<c>/b`, `<c>/c`. */
  const evidence = (c, plan, gates = ['a', 'b']) =>
    call(
      'fw_round_evidence',
      fixture.dir,
      join(fixture.dir, c, 'note_{round}.md'),
      join(fixture.dir, plan),
      '--',
      ...gates.map((g) => `${g}=${join(fixture.dir, c, g)}`),
    );
  const at = (c, g, n) => join(fixture.dir, c, g, `review_${n}.md`);

  await t.test('no round file anywhere', async () => {
    assert.deepEqual(await evidence('ev_none', 'ev_none/plan.md'), {
      status: 0,
      stdout: 'round: none\nnote: absent\nplan: unknown\n',
      stderr: '',
    });
  });

  await t.test('an incomplete round: a missing and an unreadable gate file', async () => {
    await plant('ev_part/a/review_0.md', FAIL);
    await plant('ev_part/a/review_1.md', PASS);
    await plant('ev_part/b/review_0.md', FAIL);
    await plant('ev_part/c/review_1.md', 'verdict: PASS\nverdict: FAIL\n');
    assert.deepEqual(await evidence('ev_part', 'ev_part/plan.md', ['a', 'b', 'c']), {
      status: 0,
      stdout: [
        'round: 1',
        `gate: a PASS ${at('ev_part', 'a', 1)}`,
        `gate: b missing ${at('ev_part', 'b', 1)}`,
        `gate: c unreadable ${at('ev_part', 'c', 1)}`,
        'note: absent',
        'plan: unknown',
        '',
      ].join('\n'),
      stderr: '',
    });
  });

  await t.test("a complete round with the next round's note present", async () => {
    await plant('ev_full/a/review_0.md', PASS);
    await plant('ev_full/b/review_0.md', FAIL);
    await plant('ev_full/note_1.md', '# note\n');
    assert.deepEqual(await evidence('ev_full', 'ev_full/plan.md'), {
      status: 0,
      stdout: [
        'round: 0',
        `gate: a PASS ${at('ev_full', 'a', 0)}`,
        `gate: b FAIL ${at('ev_full', 'b', 0)}`,
        'note: present',
        'plan: unknown',
        '',
      ].join('\n'),
      stderr: '',
    });
  });

  await t.test('a committed review, then a commit touching the story index', async () => {
    await plant('ev_git/plan.md', '# index\n');
    await plant('ev_git/a/review_0.md', FAIL);
    await plant('ev_git/b/review_0.md', PASS);
    await commit('ev_git/plan.md', 'ev_git/a/review_0.md', 'ev_git/b/review_0.md');
    const head = [
      'round: 0',
      `gate: a FAIL ${at('ev_git', 'a', 0)}`,
      `gate: b PASS ${at('ev_git', 'b', 0)}`,
      'note: absent',
    ];
    assert.deepEqual(await evidence('ev_git', 'ev_git/plan.md'), {
      status: 0,
      stdout: [...head, 'plan: not-newer', ''].join('\n'),
      stderr: '',
    });

    await plant('ev_git/plan.md', '# index, revised\n');
    assert.deepEqual(await evidence('ev_git', 'ev_git/plan.md'), {
      status: 0,
      stdout: [...head, 'plan: newer', ''].join('\n'),
      stderr: '',
    });

    await commit('ev_git/plan.md');
    assert.deepEqual(await evidence('ev_git', 'ev_git/plan.md'), {
      status: 0,
      stdout: [...head, 'plan: newer', ''].join('\n'),
      stderr: '',
    });
  });

  await t.test('an uncommitted review file', async () => {
    await plant('ev_open/plan.md', '# index\n');
    await commit('ev_open/plan.md');
    await plant('ev_open/a/review_0.md', FAIL);
    assert.deepEqual(await evidence('ev_open', 'ev_open/plan.md', ['a']), {
      status: 0,
      stdout: ['round: 0', `gate: a FAIL ${at('ev_open', 'a', 0)}`, 'note: absent', 'plan: unknown', ''].join('\n'),
      stderr: '',
    });
  });
});
