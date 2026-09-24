/**
 * The flow walker `init` writes, driven through the UI-test-plan loop, re-entry through `--entry`,
 * and the `current` re-print, against a throwaway fixture.
 *
 * **The rule these tests exist to enforce is `cli/test/flow-walker.test.mjs`'s, scoped to the UI
 * loop and re-entry: the walker reproduces the routing the pre-change
 * `plugin/instructions/task_plan_writing_instructions_core.md` prescribed — and, for re-entry, the
 * pre-change `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 —
 * resumability` and `## Override 5` — and every expected action is a literal written here, citing
 * its sentence by heading and quoted substring, never read out of the walker's graph.**
 *
 * One behaviour pinned here is stated by the prose only by absence: **re-entry resets the loop
 * counter.** The core opens each loop on a fresh counter — `## Loop`: "`iteration = 0`. Loop:";
 * `## UI-test-plan write loop`: "`iteration` is reset to 0 at the start of this loop" — the counter
 * lives only in the orchestrator's context, and Override 2(a) re-enters the loop ("Then continue the
 * loop normally from that point"). The per-folder review indices, by contrast, continue, because
 * they are read off disk.
 *
 * Every fixture repository is built under the system temp directory and torn down in process.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { run, walk, walkerFixture, walkerStatePath, walkerUnavailable, WALKER_FLOW } from './helpers/walker.mjs';

const SKIP = walkerUnavailable();
const BRANCH = 'feat_x';

// `## Safety contract` step 3: "[plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)".
const PLAN_WRITE_HB = '[plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)';
// `### 3. Architecture review`: "[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)".
const ARCH_HB = '[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)';
// `### 1. Spawn ui-tests-plan-writer`: "[ui-test-write · iter <i>] → ui-tests-plan-writer  (#<total_dispatches>)".
const UI_WRITER_HB = '[ui-test-write · iter <i>] → ui-tests-plan-writer  (#<total_dispatches>)';
// `### 2. Spawn ui-tests-plan-reviewer`: "[ui-test-write · iter <i>] → ui-tests-plan-reviewer  (#<total_dispatches>)".
const UI_REVIEW_HB = '[ui-test-write · iter <i>] → ui-tests-plan-reviewer  (#<total_dispatches>)';

function heartbeat(template, i, agent) {
  return ['heartbeat', template.replace('<i>', String(i)).replace('<agent_name>', agent)];
}

const findings = (folder, n) => `sdlc-harness/${folder}/${BRANCH}/review_${n}.md`;

function writer(i, findingsFile) {
  return [
    ['action', 'dispatch'],
    ['node', 'plan_writer'],
    ['agent', 'task-plan-writer'],
    ...(findingsFile === undefined
      ? [['prompt', 'initial']]
      : [['prompt', 'revision'], ['arg.findings_file', findingsFile]]),
    heartbeat(PLAN_WRITE_HB, i, 'task-plan-writer'),
  ];
}

// Every case here runs with `phases.parity: false`, so the architecture gate is reached through
// `### 2`'s "Skip this gate unless `phases.parity` is `true`".
const PARITY_SKIPPED = [['skip', 'business_parity_review skipped']];

function architecture(index, i, passed = PARITY_SKIPPED) {
  return [
    ['action', 'dispatch'],
    ['node', 'architecture_review'],
    ['agent', 'architecture-reviewer'],
    ['arg.iteration', String(index)],
    ...passed,
    heartbeat(ARCH_HB, i),
  ];
}

function planReview(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'plan_review'],
    ['agent', 'task-plan-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(PLAN_WRITE_HB, i, 'task-plan-reviewer'),
  ];
}

/**
 * `### 1. Spawn ui-tests-plan-writer`: a "First iteration prompt" and, "for revision iterations",
 * "Revise the UI-test plan per findings at <findings_file>."
 */
function uiWriter(i, findingsFile, passed = []) {
  return [
    ['action', 'dispatch'],
    ['node', 'ui_writer'],
    ['agent', 'ui-tests-plan-writer'],
    ...(findingsFile === undefined
      ? [['prompt', 'initial']]
      : [['prompt', 'revision'], ['arg.findings_file', findingsFile]]),
    ...passed,
    heartbeat(UI_WRITER_HB, i),
  ];
}

// `### 2. Spawn ui-tests-plan-reviewer`: "Resolve `iteration:` as the `## Loop` preamble states — the
// next free index in `<state_dir>/ui_test_plan_reviews/<branch>/`, not the loop counter."
function uiReview(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'ui_review'],
    ['agent', 'ui-tests-plan-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(UI_REVIEW_HB, i),
  ];
}

// `### 5`, `verdict: PASS`: "break, go to the \"UI-test-plan write loop\""; Override 5 flips `P1`
// "when the core's `## Loop` converges".
const TO_UI_LOOP = [{ start: true }, { outcome: 'returned' }, { outcome: 'PASS' }, { outcome: 'PASS' }];

function terminal(uiTest, tail) {
  return [
    ['action', 'binding'],
    ['binding', '<terminal_handoff>'],
    ['node', 'convergence'],
    ['report', 'business_parity_review skipped'],
    ['report', 'architecture_review passed'],
    ['report', 'plan_review passed'],
    ['report', `ui_test ${uiTest}`],
    ...tail,
  ];
}

const has = (actions, key, value) => actions.flat().some(([k, v]) => k === key && v === value);

async function fixture(t, phases) {
  const fx = await walkerFixture({ ...phases, branch: BRANCH });
  t.after(fx.cleanup);
  return fx.dir;
}

const flags = (...rest) => ['--flow', WALKER_FLOW, '--branch', BRANCH, ...rest];

function assertRefused(result) {
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^flow-walker: [^\n]*\n$/);
}

test('(1) a no_ui writer return skips the UI reviewer and flips P2', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [...TO_UI_LOOP, { outcome: 'no_ui' }]);

  assert.deepEqual(actions, [
    writer(0),
    architecture(0, 0),
    planReview(0, 0),
    uiWriter(0, undefined, [['ledger', 'P1']]),
    // `### 1`, "No-UI short-circuit": "**skip the `ui-tests-plan-reviewer` dispatch and the rest of
    // this loop entirely** … fall through to `## Convergence`"; Override 5 flips `P2` when the loop
    // "short-circuits on `no_ui: true`".
    terminal('no_ui', [['ledger', 'P2']]),
  ]);
  assert.ok(!has(actions, 'node', 'ui_review'), 'a no_ui return dispatched the UI reviewer');
});

test('(2) with phases.qa false the UI loop never runs and P2 is never flipped', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  const actions = await run(dir, TO_UI_LOOP);

  // `## UI-test-plan write loop`: "Skip this loop unless `phases.qa` is `true` … fall straight
  // through to `## Convergence`, which reports the loop as not run". Override 5: "A `P2` seeded
  // `[-]` at creation — **whether by a run mode carrying `qa` or by `phases.qa` being `false`** — is
  // **already resolved and is never flipped**".
  assert.deepEqual(actions.at(-1), terminal('qa-phase-off', [['ledger', 'P1'], ['skip', 'ui_writer skipped']]));
  assert.ok(!has(actions, 'ledger', 'P2'), 'a UI loop phases.qa switched off flipped P2');
  assert.ok(!has(actions, 'node', 'ui_writer'), 'a UI loop phases.qa switched off dispatched its writer');
});

test('(3) a run-mode qa skip with no ledger passes the UI loop by exclusion, never as no_ui', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  // No ledger is planted, so `--skipped` is the only run-mode record the gate can read.
  const actions = await run(dir, TO_UI_LOOP, { skipped: 'qa' });

  // `### 1`, the run-mode gate: "If `qa` is among the skipped ids, **do not dispatch
  // `ui-tests-plan-writer`** and skip this whole loop … This is a **third** terminal state … Report
  // it as such — never in the `no_ui` wording"; `## Convergence`: "keep the fourth distinct from the
  // second".
  assert.deepEqual(
    actions.at(-1),
    terminal('run-mode-skipped', [['ledger', 'P1'], ['skip', 'ui_writer passed-by-exclusion']]),
  );
  assert.ok(!has(actions, 'report', 'ui_test no_ui'), 'a run-mode qa skip was reported in the no_ui wording');
  assert.ok(!has(actions, 'ledger', 'P2'), 'a run-mode qa skip flipped P2');
});

test('(4) UI reviewer FAILs until the cap escalate with no round counts', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const steps = [...TO_UI_LOOP];
  for (let n = 0; n < 5; n += 1) {
    steps.push({ outcome: 'returned' }, { outcome: 'FAIL', review: ['ui_test_plan_reviews', n] });
  }
  const actions = await run(dir, steps);

  // `### 3`, `verdict: FAIL`: "increment `iteration`. If `>= 5`, `<escalate>` … Otherwise loop back
  // to step 1 with the revision prompt".
  const expectedLoop = [uiWriter(0, undefined, [['ledger', 'P1']])];
  for (let n = 0; n < 4; n += 1) {
    expectedLoop.push(uiReview(n, n), uiWriter(n + 1, findings('ui_test_plan_reviews', n)));
  }
  expectedLoop.push(uiReview(4, 4));
  assert.deepEqual(actions.slice(3, -1), expectedLoop);

  // … "`<escalate>` with the latest findings path and a one-paragraph summary (\"5 UI-test-plan-review
  // iterations did not converge\")". Unlike the task-plan loop's step 5, this step names no round
  // counts, and the index evidence is named only "when the index carries one" — the fixture has none.
  assert.deepEqual(actions.at(-1), [
    ['action', 'binding'],
    ['binding', '<escalate>'],
    ['node', 'ui_review'],
    ['agent', 'ui-tests-plan-reviewer'],
    ['reason', 'cap'],
    ['findings_file', findings('ui_test_plan_reviews', 4)],
    ['summary', '5 UI-test-plan-review iterations did not converge'],
  ]);
  assert.ok(!actions.at(-1).some(([k]) => k === 'rounds'), 'the UI-loop escalation carried round counts');
});

test('(5) the UI loop starts its counter at 0 after a task-plan loop that FAILed twice', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    { start: true },
    { outcome: 'returned' },
    { outcome: 'PASS' },
    { outcome: 'FAIL', review: ['task_plan_reviews', 0] },
    { outcome: 'returned' },
    { outcome: 'PASS' },
    { outcome: 'FAIL', review: ['task_plan_reviews', 1] },
    { outcome: 'returned' },
    { outcome: 'PASS' },
    { outcome: 'PASS' },
  ]);

  assert.deepEqual(actions, [
    writer(0),
    architecture(0, 0),
    planReview(0, 0),
    writer(1, findings('task_plan_reviews', 0)),
    architecture(0, 1),
    planReview(1, 1),
    writer(2, findings('task_plan_reviews', 1)),
    architecture(0, 2),
    planReview(2, 2),
    // `## UI-test-plan write loop`: "`iteration` is reset to 0 at the start of this loop" — `iter 0`,
    // not the task-plan loop's 2.
    uiWriter(0, undefined, [['ledger', 'P1']]),
  ]);
});

test('(6) re-entry mid-loop restarts the counter and continues the findings folder', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    { start: true },
    { outcome: 'returned' },
    { outcome: 'FAIL', review: ['architecture_reviews', 0] },
    // A resumed session re-enters as Override 2(a) states: "Then continue the loop normally from that
    // point", with the core's "`iteration = 0`. Loop:".
    { start: true, entry: 'plan_writer' },
    { outcome: 'returned' },
  ]);

  assert.deepEqual(actions, [
    writer(0),
    architecture(0, 0),
    writer(1, findings('architecture_reviews', 0)),
    writer(0),
    // `## Loop` preamble: the `iteration:` argument is "the next free index resolved per findings
    // folder" — `review_0.md` is on disk, so 1, while the heartbeat's counter is 0 again.
    architecture(1, 0),
  ]);
});

test('(7) re-entry past a converged task-plan loop dispatches the UI-test writer first', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [{ start: true, entry: 'ui_writer' }]);

  // Override 5, resume-from-ledger: "on re-entry, if `P1` is `[x]` skip the task-plan loop".
  assert.deepEqual(actions, [uiWriter(0)]);
});

test('(8) re-entry with planning resolved prints the hand-off immediately', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [{ start: true, entry: 'convergence' }]);

  // Override 5: "if all three `## Planning` entries are **resolved** … fall straight through to
  // implementation (`<terminal_handoff>`)". This walk recorded no gate, so it reports none.
  assert.deepEqual(actions, [
    [
      ['action', 'binding'],
      ['binding', '<terminal_handoff>'],
      ['node', 'convergence'],
    ],
  ]);
});

test('(9) an --entry outside the flow\'s entries is refused and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  await run(dir, [{ start: true }]);
  const before = readFileSync(walkerStatePath(dir));

  // Override 2 and Override 5 re-enter only at the task-plan loop, the UI-test loop or the hand-off;
  // a reviewer is never an entry point.
  assertRefused(await walk(dir, ['start', ...flags('--entry', 'plan_review', '--skipped', 'none')]));
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
});

test('(10) current re-prints the pending dispatch byte-identically and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [{ start: true }, { outcome: 'returned' }]);
  const before = readFileSync(walkerStatePath(dir));

  // `autonomous_pause_and_ledger.md` §2.5: a dispatch that died on an API overload is re-dispatched,
  // and "does **not** advance any `>= 5` iteration cap".
  const first = await walk(dir, ['current', ...flags()]);
  const second = await walk(dir, ['current', ...flags()]);

  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  assert.equal(second.stdout, first.stdout);
  assert.deepEqual(first.action, actions.at(-1));
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
});

test('(11) next for a branch other than the one started is refused and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  await run(dir, [{ start: true }]);
  const before = readFileSync(walkerStatePath(dir));

  // `returned` is declared by the pending writer, so the branch is the only thing refused.
  assertRefused(
    await walk(dir, ['next', '--flow', WALKER_FLOW, '--branch', 'feat_y', '--outcome', 'returned', '--skipped', 'none']),
  );
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
});

/*
 * The task prompt's item 8 minimum scenario list, and the case that covers each.
 * `flow-walker` is `cli/test/flow-walker.test.mjs`; `this` is this suite.
 *
 *   all gates pass first time ................................ flow-walker (1)
 *   parity FAIL once, then PASS, every gate re-runs .......... flow-walker (2)
 *   architecture FAIL until the cap, with round counts ....... flow-walker (3)
 *   phases.parity: false ..................................... flow-walker (4)
 *   run-mode parity skip ..................................... flow-walker (5), (6)
 *   writer ## Questions, <ask>, writer re-dispatch ........... flow-walker (7)
 *   no_ui: true .............................................. this (1)
 *   phases.qa: false ......................................... this (2)
 *   run-mode qa skip ......................................... this (3)
 *   blocker: from a reviewer ................................. flow-walker (8)
 *   a gapped review_<n> series ............................... flow-walker (9)
 *   re-entry mid-loop ........................................ this (6)
 */
