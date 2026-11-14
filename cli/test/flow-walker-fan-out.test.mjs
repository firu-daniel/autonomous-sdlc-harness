/**
 * The flow walker's parallel round, driven through the walker's CLI alone, as a second driver would:
 * `start` and `next --node`, with no orchestrator prose between the calls.
 *
 * **The rule this suite exists to enforce: a round's due gates are dispatched as one set, their
 * outcomes are recorded in any order, the round closes exactly once at the last of them, and an
 * outcome the round does not await is refused and changes nothing.** The set, the join and the held
 * binding are cited from the shipped walker's own header (`cli/templates/scripts/flow-walker.sh` →
 * `# ROUNDS`, `# OUTPUT` and `# EXIT CODES`); a refusal is asserted on the state file's bytes, as
 * `cli/test/config-command.test.mjs`'s are (`.claude/context/cli.md` → `## What "done" means here`).
 * Every expected action is a literal written here and never read out of the walker's graph.
 *
 * Not covered here, deliberately: the cap, the review mode, resuming a saved walk and gates recorded
 * by simultaneous calls. Those are other suites'.
 *
 * Every fixture repository is built under the system temp directory and torn down in process; no
 * case is ever aimed at this checkout (`.claude/context/conventions.md` → `## The testing bar`).
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  blocksOf,
  plantReview,
  run,
  walk,
  walkerFixture,
  walkerStatePath,
  walkerUnavailable,
  WALKER_FLOW,
} from './helpers/walker.mjs';

const SKIP = walkerUnavailable();
const BRANCH = 'feat_x';

// `## Safety contract` step 3: "[plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)".
const PLAN_WRITE_HB = (agent) => ['heartbeat', `[plan-write · iter 0] → ${agent}  (#<total_dispatches>)`];

/** `### 1. Spawn task-plan-writer`, first iteration, feeding round 0. */
const WRITER = [
  ['action', 'dispatch'],
  ['node', 'plan_writer'],
  ['agent', 'task-plan-writer'],
  ['prompt', 'initial'],
  ['arg.iteration', '0'],
  PLAN_WRITE_HB('task-plan-writer'),
];

/**
 * A round-0 gate's dispatch block at counter 0: `# OUTPUT`, `dispatch` — "arg.iteration: (a round
 * gate: the round number)" and "arg.review_mode: full|converging (a round gate: `full` while the
 * counter is below the round node's `convergingFrom`)".
 */
function block(node, agent, heartbeat, passed = []) {
  return [
    ['action', 'dispatch'],
    ['node', node],
    ['agent', agent],
    ['arg.iteration', '0'],
    ['arg.review_mode', 'full'],
    ...passed,
    heartbeat,
  ];
}

const PARITY_BLOCK = (passed) =>
  block('business_parity_review', 'business-parity-reviewer', [
    'heartbeat',
    '[plan-write · parity · iter 0] → business-parity-reviewer  (#<total_dispatches>)',
  ], passed);
const ARCH_BLOCK = (passed) =>
  block('architecture_review', 'architecture-reviewer', [
    'heartbeat',
    '[plan-write · arch · iter 0] → architecture-reviewer  (#<total_dispatches>)',
  ], passed);
const PLAN_BLOCK = (passed) => block('plan_review', 'task-plan-reviewer', PLAN_WRITE_HB('task-plan-reviewer'), passed);

/** `# ROUNDS`: "until the last one the walker prints `wait`" — `# OUTPUT`, `wait`. */
function wait(recorded, pending) {
  return [
    ['action', 'wait'],
    ['node', 'plan_round'],
    ['recorded', recorded],
    ...pending.map((name) => ['pending', name]),
  ];
}

/**
 * The join's `PASS` with `phases.qa` off: `## UI-test-plan write loop`, "Skip this loop unless
 * `phases.qa` is `true`", so the round's close hands off; `report:` lines follow `gates` order
 * whatever order the outcomes were recorded in.
 */
function handoff(parityReport) {
  return [
    ['action', 'binding'],
    ['binding', '<terminal_handoff>'],
    ['node', 'convergence'],
    ['report', `business_parity_review ${parityReport}`],
    ['report', 'architecture_review passed'],
    ['report', 'plan_review passed'],
    ['report', 'ui_test qa-phase-off'],
    ['round', '0 PASS'],
    ['ledger', 'P1'],
    ['skip', 'ui_writer skipped'],
  ];
}

const PARITY = { node: 'business_parity_review', outcome: 'PASS', review: ['business_parity_reviews', 0] };
const ARCH = { node: 'architecture_review', outcome: 'PASS', review: ['architecture_reviews', 0] };
const PLAN = { node: 'plan_review', outcome: 'PASS', review: ['task_plan_reviews', 0] };

const OPEN = [{ start: true }, { outcome: 'returned' }];

async function fixture(t, phases) {
  const fx = await walkerFixture({ ...phases, branch: BRANCH });
  t.after(fx.cleanup);
  return fx.dir;
}

/** One `next` call's argument vector, the flags the helper's `run` would pass. */
const nextArgs = (...flags) => ['next', '--flow', WALKER_FLOW, '--branch', BRANCH, ...flags, '--skipped', 'none'];

/** `# EXIT CODES`: a refusal exits 1, prints one `flow-walker: <cause>` line and leaves the state file byte-identical. */
async function assertRefused(dir, args, cause) {
  const before = readFileSync(walkerStatePath(dir));
  const refused = await walk(dir, args);
  assert.equal(refused.status, 1, `\`${args.join(' ')}\` exited ${refused.status}\n${refused.stderr}`);
  assert.equal(refused.stdout, '');
  assert.match(refused.stderr, /^flow-walker: [^\n]*\n$/);
  assert.match(refused.stderr, cause);
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
}

test("(1) the writer's return dispatches every non-skipped gate as one set", { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, OPEN);

  assert.deepEqual(actions[0], WRITER);
  // `# ROUNDS`: "every gate not skipped is due, all dispatched at once as one SET"; `# OUTPUT`, `set`:
  // "one dispatch block per due gate, in `gates` order, back to back".
  const blocks = blocksOf(actions[1]);
  assert.equal(blocks.length, 3);
  assert.deepEqual(blocks, [PARITY_BLOCK(), ARCH_BLOCK(), PLAN_BLOCK()]);
  // `# ROUNDS`: the round number "is the same index in every gate's folder".
  assert.deepEqual(new Set(blocks.map((b) => b.find(([k]) => k === 'arg.iteration')[1])), new Set(['0']));
});

test('(2) outcomes recorded in any order close the round only at the last', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, PLAN, PARITY, ARCH]);

  assert.deepEqual(actions.slice(2), [
    // `# ROUNDS`: "Each gate's outcome is recorded by its own `next --node <gate>`, in any order" —
    // `pending:` names the gates still out, in `gates` order, whichever was recorded.
    wait('plan_review PASS', ['business_parity_review', 'architecture_review']),
    wait('business_parity_review PASS', ['architecture_review']),
    // "The last outcome is the JOIN": no gate recorded `FAIL`, so the round closes `PASS`, once.
    handoff('passed'),
  ]);
  assert.equal(actions.flat().filter(([k]) => k === 'round').length, 1, 'the round closed more than once');
});

test('(3) an outcome for a gate not pending in the round, or a second outcome for one gate, is refused and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await run(dir, [...OPEN, PLAN]);

  // `# EXIT CODES`, 1: "while a set is pending: … a `--node` that is not a pending gate of the round".
  await assertRefused(dir, nextArgs('--node', 'plan_writer', '--outcome', 'returned'), /not pending in round 0/);
  // … "a second outcome for one gate": `plan_review`'s `PASS` is recorded; its own file is re-offered.
  const planFile = `devscene/task_plan_reviews/${BRANCH}/review_0.md`;
  await assertRefused(
    dir,
    nextArgs('--node', 'plan_review', '--outcome', 'PASS', '--findings', planFile),
    /already recorded in round 0/,
  );
});

test('(4) a skipped gate is absent from the set and counts as passed', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  const actions = await run(dir, [...OPEN, ARCH, PLAN]);

  // `# ROUNDS`: "each gate's skip constructs are evaluated in `gates` order before anything is
  // printed"; `# OUTPUT`, `set`: "the passed-through skip: … lines in the first block only".
  assert.deepEqual(blocksOf(actions[1]), [ARCH_BLOCK([['skip', 'business_parity_review skipped']]), PLAN_BLOCK()]);
  assert.deepEqual(actions[2], wait('architecture_review PASS', ['plan_review']));
  // "the round closes FAIL when a gate recorded FAIL (a skipped gate counts as passed), else PASS".
  assert.deepEqual(actions[3], handoff('skipped'));
});

test("(5) a gate's error with two verdicts recorded is held until the set is in, then escalates once, and the round files stand", { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, { node: 'architecture_review', outcome: 'error' }, PARITY, PLAN]);

  assert.deepEqual(actions.slice(2), [
    // `# ROUNDS`: an `error` is "HELD, not routed when recorded" — the set still waits.
    wait('architecture_review error', ['business_parity_review', 'plan_review']),
    wait('business_parity_review PASS', ['plan_review']),
    // `# OUTPUT`, `binding`: "at a join with a held outcome, node: and agent: are the first held
    // gate's in `gates` order, reason: its outcome, then held: <gate> <outcome> per held gate, and
    // no round: line".
    [
      ['action', 'binding'],
      ['binding', '<escalate>'],
      ['node', 'architecture_review'],
      ['agent', 'architecture-reviewer'],
      ['reason', 'error'],
      ['held', 'architecture_review error'],
    ],
  ]);
  // "the first held gate's binding is printed and the round is not closed": the two verdicts' files
  // are not withdrawn.
  for (const folder of ['business_parity_reviews', 'task_plan_reviews']) {
    const file = join(dir, 'devscene', folder, BRANCH, 'review_0.md');
    assert.ok(existsSync(file), `${file} is absent`);
  }
  // `# USAGE`: a binding other than `<ask>` is "a finished walk … `next` refuses it with exit 1".
  await assertRefused(dir, nextArgs('--node', 'architecture_review', '--outcome', 'PASS'), /the walk finished/);
});

test('(6) --node is required while a set is pending', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await run(dir, OPEN);
  const findings = await plantReview(dir, `architecture_reviews/${BRANCH}`, 0, 'PASS');

  // `# USAGE`, `--node`: "Required while a set is pending"; `# EXIT CODES`, 1: "no `--node`".
  await assertRefused(dir, nextArgs('--outcome', 'PASS', '--findings', findings), /name the gate with --node/);
});
