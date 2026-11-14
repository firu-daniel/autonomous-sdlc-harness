/**
 * The flow walker's round, recorded by simultaneous calls: several sessions each issue their own
 * gate's `next --node` at the same moment, as a per-gate driver does.
 *
 * **The rule this suite exists to enforce: recording is safe under concurrent calls — every outcome
 * of simultaneous `next` calls lands, exactly one call prints the round's result, and no call leaves
 * the lock behind.** Beside it, a lock left by a killed call is broken once it is older than a
 * minute, and a fresh one is waited for. The lock is cited from the shipped walker's own header
 * (`cli/templates/scripts/flow-walker.sh` → `# CONCURRENCY`) and is asserted only where a driver can
 * observe it: the outcomes, the single result, and the lock directory's absence afterwards.
 *
 * The mutation that turns case (1) red, applied to the template alone and reverted after: `next`
 * no longer calls `lock_take` — run red once on feat_parallel_plan_reviews.
 *
 * Every fixture repository is built under the system temp directory and torn down in process; no
 * case is ever aimed at this checkout (`.claude/context/conventions.md` → `## The testing bar`).
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, rmdir, utimes } from 'node:fs/promises';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { INIT_SCRIPTS_DIR, runBash } from './helpers/fixture.mjs';
import {
  plantReview,
  run,
  runConcurrently,
  walk,
  walkerFixture,
  walkerStatePath,
  walkerUnavailable,
  WALKER_FLOW,
} from './helpers/walker.mjs';

const SKIP = walkerUnavailable();
const BRANCH = 'feat_x';

/**
 * Fresh fixtures per verdict mix. A lost update needs two calls to interleave between reading and
 * replacing the state, which a single run may not hit, so one green run proves nothing.
 */
const REPETITIONS = 5;

const OPEN = [{ start: true }, { outcome: 'returned' }];

const gate = (node, folder, outcome) => ({ node, outcome, review: [folder, 0] });

/** `# CONCURRENCY`: the lock directory sits beside the state file. */
const lockPath = (dir) => `${walkerStatePath(dir)}.lock`;

const roundLines = (action) => action.filter(([k]) => k === 'round').map(([, v]) => v);

async function fixture(t) {
  const fx = await walkerFixture({ parity: true, qa: false, branch: BRANCH });
  t.after(fx.cleanup);
  return fx.dir;
}

test("(1) three outcomes recorded by simultaneous next calls all land, and exactly one prints the round's result", { skip: SKIP }, async (t) => {
  const mixes = [
    { name: 'three PASS', archOutcome: 'PASS', round: '0 PASS' },
    // `# ROUNDS`: "the round closes FAIL when a gate recorded FAIL".
    { name: 'two PASS and one FAIL', archOutcome: 'FAIL', round: '0 FAIL' },
  ];
  for (const mix of mixes) {
    for (let i = 0; i < REPETITIONS; i += 1) {
      await t.test(`${mix.name}, repetition ${i + 1} of ${REPETITIONS}`, async (st) => {
        const dir = await fixture(st);
        await run(dir, OPEN);

        const results = await runConcurrently(dir, [
          gate('business_parity_review', 'business_parity_reviews', 'PASS'),
          gate('architecture_review', 'architecture_reviews', mix.archOutcome),
          gate('plan_review', 'task_plan_reviews', 'PASS'),
        ]);

        for (const r of results) assert.equal(r.status, 0, `a simultaneous next exited ${r.status}\n${r.stdout}\n${r.stderr}`);
        // `# ROUNDS`: "until the last one the walker prints `wait`"; the last outcome is the join.
        const closers = results.filter((r) => roundLines(r.action).length > 0);
        assert.equal(closers.length, 1, `expected one call to print the round's result, got ${closers.length}`);
        assert.deepEqual(roundLines(closers[0].action), [mix.round]);
        const waits = results.filter((r) => r !== closers[0]);
        for (const w of waits) assert.deepEqual(w.action[0], ['action', 'wait']);
        // Every outcome landed: the two waits recorded two distinct gates, the join the third.
        const recorded = waits.map((w) => w.action.find(([k]) => k === 'recorded')[1].split(' ')[0]);
        assert.equal(new Set(recorded).size, 2, `the waits recorded ${recorded.join(', ')}`);

        const current = await walk(dir, ['current', '--flow', WALKER_FLOW, '--branch', BRANCH]);
        assert.equal(current.status, 0, current.stderr);
        assert.equal(current.stdout, closers[0].stdout);
        assert.equal(existsSync(lockPath(dir)), false, 'a call left the lock directory behind');
      });
    }
  }
});

/** The `wait` recording `plan_review`'s `PASS` with the two other gates still out. */
const PLAN_WAIT = [
  ['action', 'wait'],
  ['node', 'plan_round'],
  ['recorded', 'plan_review PASS'],
  ['pending', 'business_parity_review'],
  ['pending', 'architecture_review'],
];

const PLAN_PASS = gate('plan_review', 'task_plan_reviews', 'PASS');

test('(2) a lock older than a minute is broken, and the call proceeds', { skip: SKIP }, async (t) => {
  const dir = await fixture(t);
  await run(dir, OPEN);

  // A killed call's leftover: `# CONCURRENCY`, "removed once as stale when older than a minute".
  await mkdir(lockPath(dir));
  const twoMinutesAgo = new Date(Date.now() - 120_000);
  await utimes(lockPath(dir), twoMinutesAgo, twoMinutesAgo);

  const [recorded] = await run(dir, [PLAN_PASS]);
  assert.deepEqual(recorded, PLAN_WAIT);
  assert.equal(existsSync(lockPath(dir)), false, 'the call left the lock directory behind');
});

/** Far under the walker's own 120 s give-up, so a call that never waits cannot hide behind it. */
const WAIT_BOUND_MS = 30_000;
const HOLD_MS = 1_500;

test('(3) a fresh lock held by another call is waited for, never broken', { skip: SKIP }, async (t) => {
  const dir = await fixture(t);
  await run(dir, OPEN);

  await mkdir(lockPath(dir));
  const findings = await plantReview(dir, `task_plan_reviews/${BRANCH}`, 0, 'PASS');
  const args = [
    `${INIT_SCRIPTS_DIR}/flow-walker.sh`, 'next', '--node', 'plan_review', '--outcome', 'PASS',
    '--flow', WALKER_FLOW, '--branch', BRANCH, '--findings', findings, '--skipped', 'none',
  ];
  let settled = false;
  const pending = runBash(dir, args, {}, { timeoutMs: WAIT_BOUND_MS }).finally(() => {
    settled = true;
  });

  await delay(HOLD_MS);
  assert.equal(settled, false, 'the call finished while another call held a fresh lock');
  // Throws if the waiting call removed the fresh lock.
  await rmdir(lockPath(dir));

  const result = await pending;
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.stdout, `${PLAN_WAIT.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`);
  assert.equal(existsSync(lockPath(dir)), false, 'the call left the lock directory behind');
});
