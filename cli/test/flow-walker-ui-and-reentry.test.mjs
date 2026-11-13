/**
 * The flow walker `init` writes, driven through the UI-test-plan loop, re-entry through `--entry`,
 * and the `current` re-print, against a throwaway fixture.
 *
 * **The rule these tests exist to enforce is `cli/test/flow-walker.test.mjs`'s, scoped to the UI
 * loop and re-entry: the walker reproduces the round routing
 * `plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker — routing is its,
 * judgement is yours` hands it — and, for re-entry through `--entry`, that file's `## Setup (once per
 * session)` step 7 and `plugin/instructions/task_plan_writing_instructions_autonomous.md` →
 * `## Override 2 — resumability` and `## Override 5` — and every expected action is a literal
 * written here, citing its sentence by heading and quoted substring, never read out of the walker's
 * graph.**
 *
 * **`start` resets the loop counter** and renders its entry with the `initial` prompt — a fresh
 * write, an **extend**, a **review** of a draft and a **skip** past a loop alike. The core opens
 * each loop on a fresh counter — `## Loop`: "`iteration = 0`. Loop:"; `## UI-test-plan write loop`:
 * "`iteration` is reset to 0 at the start of this loop" — so the cap budget and the review mode
 * start over with it. The numbering continues: the three plan gates' round number is read off their
 * round files, one past the highest on disk, and `ui_review`'s index off its own folder, the next free
 * one. A re-entry that **continues** a saved walk resets nothing; that is pinned in
 * `cli/test/flow-walker-resume.test.mjs`.
 *
 * Every case here runs with `phases.parity: false`, so a round records the architecture and
 * plan-review files only.
 *
 * Every fixture repository is built under the system temp directory and torn down in process.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR } from './helpers/fixture.mjs';
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

/** The heartbeat's `iter <i>` is the loop counter, never the round number. */
function heartbeat(template, i, agent) {
  return ['heartbeat', template.replace('<i>', String(i)).replace('<agent_name>', agent)];
}

/** Reviewers run `full` while the 0-based counter is below 2, and `converging` from it. */
const modeAt = (i) => (i < 2 ? 'full' : 'converging');

const findings = (folder, n) => `devscene/${folder}/${BRANCH}/review_${n}.md`;

/** The files round `n` records with the parity gate skipped, in gate order. */
const roundFiles = (n) => [findings('architecture_reviews', n), findings('task_plan_reviews', n)];

/** The line a walk prints on passing through the round node. */
const closed = (n, verdict) => ['round', `${n} ${verdict}`];

/**
 * `### 1. Spawn task-plan-writer`: the first-iteration prompt, or the revision naming every file of
 * the closed round in gate order. `arg.iteration` is the round the write feeds, on both variants.
 */
function writer(i, files, { round = i, passed = [] } = {}) {
  return [
    ['action', 'dispatch'],
    ['node', 'plan_writer'],
    ['agent', 'task-plan-writer'],
    ['prompt', files === undefined ? 'initial' : 'revision'],
    ['arg.iteration', String(round)],
    ...(files ?? []).map((file) => ['arg.findings_file', file]),
    ...passed,
    heartbeat(PLAN_WRITE_HB, i, 'task-plan-writer'),
  ];
}

// The architecture gate is reached through `### 2`'s "Skip this gate unless `phases.parity` is
// `true`".
const PARITY_SKIPPED = [['skip', 'business_parity_review skipped']];

/** A round gate: `arg.iteration` is the round number, `arg.review_mode` follows the counter. */
function gate(node, agent, template, heartbeatAgent, defaultPassed) {
  return (round, i, { passed = defaultPassed, mode = modeAt(i) } = {}) => [
    ['action', 'dispatch'],
    ['node', node],
    ['agent', agent],
    ['arg.iteration', String(round)],
    ['arg.review_mode', mode],
    ...passed,
    heartbeat(template, i, heartbeatAgent),
  ];
}

const architecture = gate('architecture_review', 'architecture-reviewer', ARCH_HB, undefined, PARITY_SKIPPED);
// `### 4. Spawn task-plan-reviewer` carries no heartbeat of its own; `## Safety contract` step 3's
// template names the agent.
const planReview = gate('plan_review', 'task-plan-reviewer', PLAN_WRITE_HB, 'task-plan-reviewer', []);

/** Round `n` with the parity gate skipped, each verdict planting its round file first. */
const gates = (n, { architecture: a = 'PASS', plan = 'PASS' } = {}) => [
  { outcome: a, review: ['architecture_reviews', n] },
  { outcome: plan, review: ['task_plan_reviews', n] },
];

const RETURNED = { outcome: 'returned' };

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
// next free index in `<state_dir>/ui_test_plan_reviews/<branch>/`, not the loop counter." `ui_review`
// is no round gate, so it prints no `arg.review_mode`.
function uiReview(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'ui_review'],
    ['agent', 'ui-tests-plan-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(UI_REVIEW_HB, i),
  ];
}

// A round in which no gate recorded `FAIL` closes `PASS` and leaves the task-plan loop; Override 5
// flips `P1` "when the core's `## Loop` converges".
const TO_UI_LOOP = [{ start: true }, RETURNED, ...gates(0)];
const LEFT_TASK_PLAN_LOOP = [closed(0, 'PASS'), ['ledger', 'P1']];

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

/** The cap escalation from the round node: no agent, every file of the closing round, then counts. */
function capEscalation(round, rounds, openGates) {
  return [
    ['action', 'binding'],
    ['binding', '<escalate>'],
    ['node', 'plan_round'],
    ['reason', 'cap'],
    ...roundFiles(round).map((file) => ['findings_file', file]),
    ['rounds', `architecture_review ${rounds[0]}`],
    ['rounds', `plan_review ${rounds[1]}`],
    ['summary', `the plan loop reached its 5-revision cap; the gates open when it fired: ${openGates}`],
    closed(round, 'FAIL'),
  ];
}

const has = (actions, key, value) => actions.flat().some(([k, v]) => k === key && v === value);

const dispatchesOf = (actions, ...nodes) =>
  actions.filter((pairs) => pairs.some(([k, v]) => k === 'node' && nodes.includes(v)) && pairs[0][1] === 'dispatch');

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
    uiWriter(0, undefined, LEFT_TASK_PLAN_LOOP),
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
  assert.deepEqual(actions.at(-1), terminal('qa-phase-off', [...LEFT_TASK_PLAN_LOOP, ['skip', 'ui_writer skipped']]));
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
    terminal('run-mode-skipped', [...LEFT_TASK_PLAN_LOOP, ['skip', 'ui_writer passed-by-exclusion']]),
  );
  assert.ok(!has(actions, 'report', 'ui_test no_ui'), 'a run-mode qa skip was reported in the no_ui wording');
  assert.ok(!has(actions, 'ledger', 'P2'), 'a run-mode qa skip flipped P2');
});

test('(4) UI reviewer FAILs until the cap escalate with no round counts', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const steps = [...TO_UI_LOOP];
  for (let n = 0; n < 5; n += 1) {
    steps.push(RETURNED, { outcome: 'FAIL', review: ['ui_test_plan_reviews', n] });
  }
  const actions = await run(dir, steps);

  // `### 3`, `verdict: FAIL`: "increment `iteration`. If `>= 5`, `<escalate>` … Otherwise loop back
  // to step 1 with the revision prompt".
  const expectedLoop = [uiWriter(0, undefined, LEFT_TASK_PLAN_LOOP)];
  for (let n = 0; n < 4; n += 1) {
    expectedLoop.push(uiReview(n, n), uiWriter(n + 1, findings('ui_test_plan_reviews', n)));
  }
  expectedLoop.push(uiReview(4, 4));
  assert.deepEqual(actions.slice(3, -1), expectedLoop);

  // … "`<escalate>` with the latest findings path and a one-paragraph summary (\"5 UI-test-plan-review
  // iterations did not converge\")". Unlike the task-plan loop's cap, this step names no round
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
    RETURNED,
    ...gates(0, { plan: 'FAIL' }),
    RETURNED,
    ...gates(1, { plan: 'FAIL' }),
    RETURNED,
    ...gates(2),
  ]);

  assert.deepEqual(actions, [
    writer(0),
    architecture(0, 0),
    planReview(0, 0),
    // Each `FAIL` round closes once and sends the writer one revision: the counter reaches 2.
    writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] }),
    architecture(1, 1),
    planReview(1, 1),
    writer(2, roundFiles(1), { passed: [closed(1, 'FAIL')] }),
    architecture(2, 2),
    planReview(2, 2),
    // `## UI-test-plan write loop`: "`iteration` is reset to 0 at the start of this loop" — `iter 0`,
    // not the task-plan loop's 2.
    uiWriter(0, undefined, [closed(2, 'PASS'), ['ledger', 'P1']]),
  ]);
});

test('(6) re-entry mid-loop restarts the counter and continues the findings folder', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    { start: true },
    RETURNED,
    ...gates(0, { architecture: 'FAIL' }),
    // A `start` issued mid-loop, as **extend** does, opens on a fresh counter — the core's
    // "`iteration = 0`. Loop:".
    { start: true, entry: 'plan_writer' },
    RETURNED,
  ]);

  assert.deepEqual(actions, [
    writer(0),
    architecture(0, 0),
    planReview(0, 0),
    writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] }),
    // Round 0's files are on disk, so the round numbering carries on at 1 — read off the round files,
    // not off any counter — while the heartbeat's counter is 0 again and the review mode with it.
    writer(0, undefined, { round: 1 }),
    architecture(1, 0, { mode: 'full' }),
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

  // A `start` enters only at a loop's writer, a loop's **first** gate or the hand-off; a draft sent
  // back for review always starts at its loop's first gate, so `plan_review`, not a first gate, is
  // refused.
  assertRefused(await walk(dir, ['start', ...flags('--entry', 'plan_review', '--skipped', 'none')]));
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
});

test('(10) current re-prints the pending dispatch byte-identically and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [{ start: true }, RETURNED]);
  assert.deepEqual(actions.at(-1), architecture(0, 0));
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

test('(12) a lib/harness-run-lib.sh older than the walker is refused at start, naming the file', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  // `init` writes the library create-if-absent, so an adoption from before the walker keeps a copy
  // with no `hr_phase_enabled`.
  const lib = join(dir, INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh');
  await writeFile(lib, readFileSync(lib, 'utf8').replace('hr_phase_enabled() {', 'hr_phase_enabled_absent() {'));

  const result = await walk(dir, ['start', ...flags('--skipped', 'none')]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^flow-walker: .*harness-run-lib\.sh predates this walker/);
  assert.ok(!existsSync(walkerStatePath(dir)), 'a refused start wrote the walker state');
});

test('(13) an answered cap park starts a fresh cap budget, and the round series carries on', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const steps = [{ start: true }, RETURNED];
  for (let n = 0; n < 5; n += 1) {
    steps.push(...gates(n, { plan: 'FAIL' }));
    if (n < 4) steps.push(RETURNED);
  }
  const firstWalk = await run(dir, steps);
  assert.deepEqual(firstWalk.at(-1), capEscalation(4, [0, 5], 'plan_review'));

  // A cap park is a finished walk, so answering it never continues the walk: `## Setup (once per
  // session)` step 7, "**extend** gives `plan_writer`", through `start`.
  const resumed = [{ start: true, entry: 'plan_writer' }, RETURNED];
  for (let n = 5; n < 10; n += 1) {
    resumed.push(...gates(n, { plan: 'FAIL' }));
    if (n < 9) resumed.push(RETURNED);
  }
  const actions = await run(dir, resumed);

  // The counter starts at 0 and the round number at 5; rounds 5–8 each close `FAIL` and send one
  // revision back.
  assert.deepEqual(dispatchesOf(actions, 'plan_writer'), [
    writer(0, undefined, { round: 5 }),
    writer(1, roundFiles(5), { round: 6, passed: [closed(5, 'FAIL')] }),
    writer(2, roundFiles(6), { round: 7, passed: [closed(6, 'FAIL')] }),
    writer(3, roundFiles(7), { round: 8, passed: [closed(7, 'FAIL')] }),
    writer(4, roundFiles(8), { round: 9, passed: [closed(8, 'FAIL')] }),
  ]);

  // The review mode follows the counter, not the round number: rounds 5 and 6 are `full`, round 7
  // `converging`.
  const expectedGates = [];
  for (let n = 5; n < 10; n += 1) expectedGates.push(architecture(n, n - 5), planReview(n, n - 5));
  assert.deepEqual(dispatchesOf(actions, 'architecture_review', 'plan_review'), expectedGates);
  assert.deepEqual(
    expectedGates.map((pairs) => pairs.find(([k]) => k === 'arg.review_mode')[1]),
    ['full', 'full', 'full', 'full', 'converging', 'converging', 'converging', 'converging', 'converging', 'converging'],
  );

  // The fresh budget is spent at round 9, and `rounds:` counts every `FAIL` file in each folder —
  // rounds 0–9 alike, not only this walk's.
  assert.deepEqual(actions.at(-1), capEscalation(9, [0, 10], 'plan_review'));
});

/*
 * The task prompt's minimum scenario lists, and the case that covers each.
 * `flow-walker` is `cli/test/flow-walker.test.mjs`; `resume` is `cli/test/flow-walker-resume.test.mjs`;
 * `this` is this suite.
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
 *   re-entry mid-loop through start .......................... this (6)
 *   a continued walk: counter, round files, prompt, findings . resume
 *
 * `## Tests` → **Walker / graph** is mapped in `flow-walker`'s closing comment. Part 4's counter
 * rule, as restated on this branch:
 *
 *   every start begins the counter at 0 ...................... this (6), (13)
 *   round numbering carries on across the branch's history ... this (6), (13)
 *   answering a cap park starts a fresh cap budget ........... this (13)
 *   converging mode keys on the current walk's counter ....... this (13)
 */
