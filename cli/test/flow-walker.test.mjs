/**
 * The flow walker `init` writes, driven through the task-plan loop against a throwaway fixture.
 *
 * **The rule these tests exist to enforce: the walker reproduces the routing the pre-change
 * `plugin/instructions/task_plan_writing_instructions_core.md` prescribed — the core as it stood at
 * this branch's merge base, before its routing moved into data — and every expectation cites the
 * pre-change sentence it comes from, by heading and quoted substring.** Each expected action is a
 * literal written here and never read out of the walker's graph: an expectation derived from the
 * graph would prove only that the walker agrees with itself.
 *
 * Not covered here, deliberately: the UI-test-plan loop, re-entry through `--entry`, and `current`.
 * Those are a separate suite's.
 *
 * Every fixture repository is built under the system temp directory and torn down in process; no
 * case is ever aimed at this checkout (`.claude/context/conventions.md` → `## The testing bar`).
 *
 * `(#<total_dispatches>)` is asserted as that literal slot: the counter is the orchestrator's safety
 * contract, not the walker's, and the pre-change heartbeat template spells it so.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  plantLedger,
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
const PLAN_WRITE_HB = '[plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)';
// `### 2. Business-parity review`: "[plan-write · parity · iter <i>] → business-parity-reviewer  (#<total_dispatches>)".
const PARITY_HB = '[plan-write · parity · iter <i>] → business-parity-reviewer  (#<total_dispatches>)';
// `### 3. Architecture review`: "[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)".
const ARCH_HB = '[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)';

/**
 * `## Loop` preamble: "The heartbeat's `iter <i>` stays this counter, not the resolved index."
 */
function heartbeat(template, i, agent) {
  return ['heartbeat', template.replace('<i>', String(i)).replace('<agent_name>', agent)];
}

/**
 * `### 1. Spawn task-plan-writer`: a "First iteration prompt" and, "for revision iterations",
 * "Revise the task plan per findings at <findings_file>."
 */
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

/**
 * `## Loop` preamble: the `iteration:` argument is "the next free index resolved per findings
 * folder", and "a folder holding no `review_*.md` — including one that does not exist yet — starts
 * at 0". `passed` holds the `skip:` / `ledger:` lines for what the walk passed through.
 */
function parity(index, i, passed = []) {
  return [
    ['action', 'dispatch'],
    ['node', 'business_parity_review'],
    ['agent', 'business-parity-reviewer'],
    ['arg.iteration', String(index)],
    ...passed,
    heartbeat(PARITY_HB, i),
  ];
}

function architecture(index, i, passed = []) {
  return [
    ['action', 'dispatch'],
    ['node', 'architecture_review'],
    ['agent', 'architecture-reviewer'],
    ['arg.iteration', String(index)],
    ...passed,
    heartbeat(ARCH_HB, i),
  ];
}

// `### 4. Spawn task-plan-reviewer` carries no heartbeat of its own; `## Safety contract` step 3's
// template names the agent.
function planReview(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'plan_review'],
    ['agent', 'task-plan-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(PLAN_WRITE_HB, i, 'task-plan-reviewer'),
  ];
}

const findings = (folder, n) => `sdlc-harness/${folder}/${BRANCH}/review_${n}.md`;

/** A walk from `start` through the writer's first return. */
const OPEN = [{ start: true }, { outcome: 'returned' }];

async function fixture(t, phases) {
  const fx = await walkerFixture({ ...phases, branch: BRANCH });
  t.after(fx.cleanup);
  return fx.dir;
}

test('(1) every gate passes first time: writer, parity, architecture, plan review, then the hand-off', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, { outcome: 'PASS' }, { outcome: 'PASS' }, { outcome: 'PASS' }]);

  assert.deepEqual(actions, [
    writer(0),
    // `### 2`: "Business parity comes **before** architecture".
    parity(0, 0),
    // `### 2`, `verdict: PASS`: "fall through to step 3 (architecture review)".
    architecture(0, 0),
    // `### 3`, `verdict: PASS`: "fall through to step 4 (`task-plan-reviewer`)".
    planReview(0, 0),
    // `### 5`, `verdict: PASS`: "break, go to the \"UI-test-plan write loop\" below and then to
    // `## Convergence`"; `## UI-test-plan write loop`: "Skip this loop unless `phases.qa` is
    // `true` … fall straight through to `## Convergence`, which reports the loop as not run".
    // The ledger's P1 is "Task plan converged (business_parity + architecture + task-plan-reviewer
    // all PASS)" (`autonomous_pause_and_ledger.md` → `### 1.3 Templates`).
    [
      ['action', 'binding'],
      ['binding', '<terminal_handoff>'],
      ['node', 'convergence'],
      ['report', 'business_parity_review passed'],
      ['report', 'architecture_review passed'],
      ['report', 'plan_review passed'],
      ['report', 'ui_test qa-phase-off'],
      ['ledger', 'P1'],
      ['skip', 'ui_writer skipped'],
    ],
  ]);
});

test('(2) a parity FAIL sends the plan back to the writer, and every gate re-runs', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [
    ...OPEN,
    { outcome: 'FAIL', review: ['business_parity_reviews', 0] },
    { outcome: 'returned' },
    { outcome: 'PASS' },
    { outcome: 'PASS' },
  ]);

  assert.deepEqual(actions, [
    writer(0),
    parity(0, 0),
    // `### 2`, `verdict: FAIL`: "increment `iteration` … Otherwise loop back to **step 1** with the
    // revision prompt `Revise the task plan per findings at <findings_file>.`"
    writer(1, findings('business_parity_reviews', 0)),
    // … "then re-run the parity review (then the architecture review, then the structural
    // reviewer) on the revised plan"; the parity folder now holds `review_0.md`, so its next free
    // index is 1 while the other two folders are still empty.
    parity(1, 1),
    architecture(0, 1),
    planReview(0, 1),
  ]);
});

test('(3) architecture FAILs until the cap escalate with the round counts and the summary', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const steps = [...OPEN, { outcome: 'PASS' }];
  for (let n = 0; n < 5; n += 1) {
    steps.push({ outcome: 'FAIL', review: ['architecture_reviews', n] });
    if (n < 4) steps.push({ outcome: 'returned' }, { outcome: 'PASS' });
  }
  const actions = await run(dir, steps);

  // `### 3`, `verdict: FAIL`: "increment `iteration`. If `>= 5`, `<escalate>`" — so FAILs one to
  // four each loop back, and each re-dispatch of the gate takes the next free index.
  const archDispatches = actions.filter((pairs) => pairs.some(([k, v]) => k === 'node' && v === 'architecture_review'));
  assert.deepEqual(archDispatches.slice(0, 5), [
    architecture(0, 0),
    architecture(1, 1),
    architecture(2, 2),
    architecture(3, 3),
    architecture(4, 4),
  ]);

  // … "`<escalate>` with the latest findings path, each gate's own round count (`ls
  // <findings_folder> | grep -c '^review_'`, run per gate …) and a one-paragraph summary (\"the plan
  // loop reached its 5-revision cap; the architecture gate was open when it fired\")". No story
  // index exists in the fixture, so the index evidence — named only "when the index carries one" —
  // is absent.
  assert.deepEqual(actions.at(-1), [
    ['action', 'binding'],
    ['binding', '<escalate>'],
    ['node', 'architecture_review'],
    ['agent', 'architecture-reviewer'],
    ['reason', 'cap'],
    ['findings_file', findings('architecture_reviews', 4)],
    ['rounds', 'business_parity_review 0'],
    ['rounds', 'architecture_review 5'],
    ['rounds', 'plan_review 0'],
    ['summary', 'the plan loop reached its 5-revision cap; the architecture gate was open when it fired'],
  ]);
});

test('(4) with phases.parity false the parity gate is skipped and records no pass', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  const actions = await run(dir, [...OPEN, { outcome: 'PASS' }, { outcome: 'PASS' }]);

  assert.deepEqual(actions, [
    writer(0),
    // `### 2`: "Skip this gate unless `phases.parity` is `true` in `harness.config.json`. … the loop
    // proceeds to the next step" — no parity dispatch.
    architecture(0, 0, [['skip', 'business_parity_review skipped']]),
    planReview(0, 0),
    // … "A skipped gate is **not** a converged gate … records no pass for it, and reports none at
    // `## Convergence`": the gate's value is `skipped`, never `passed`.
    [
      ['action', 'binding'],
      ['binding', '<terminal_handoff>'],
      ['node', 'convergence'],
      ['report', 'business_parity_review skipped'],
      ['report', 'architecture_review passed'],
      ['report', 'plan_review passed'],
      ['report', 'ui_test qa-phase-off'],
      ['ledger', 'P1'],
      ['skip', 'ui_writer skipped'],
    ],
  ]);
  assert.ok(
    !actions.flat().some(([k, v]) => k === 'report' && v === 'business_parity_review passed'),
    'a skipped parity gate reported a pass',
  );
  assert.ok(
    !actions.flat().some(([k, v]) => k === 'node' && v === 'business_parity_review'),
    'a skipped parity gate was dispatched',
  );
});

/**
 * `### 2`, the run-mode gate: "If `parity` is among the skipped ids, **do not dispatch
 * `business-parity-reviewer`** … **fall through to step 3 exactly as a `verdict: PASS` does** — a
 * gate a run mode excludes is *passed by exclusion*".
 */
const PASSED_BY_EXCLUSION = [
  writer(0),
  architecture(0, 0, [['skip', 'business_parity_review passed-by-exclusion']]),
  planReview(0, 0),
  [
    ['action', 'binding'],
    ['binding', '<terminal_handoff>'],
    ['node', 'convergence'],
    // `## Convergence`: "the `task-plan-reviewer` returned `verdict: PASS` … or were passed by
    // exclusion, where the run mode skipped them".
    ['report', 'business_parity_review passed-by-exclusion'],
    ['report', 'architecture_review passed'],
    ['report', 'plan_review passed'],
    ['report', 'ui_test qa-phase-off'],
    ['ledger', 'P1'],
    ['skip', 'ui_writer skipped'],
  ],
];

test('(5) a run-mode parity skip in the ledger passes the parity gate by exclusion', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await plantLedger(dir, BRANCH, 'parity');
  // No `--skipped`: the ledger is "the record `… run_mode_instructions.md` → `## The durable
  // record` defines for this flow", so it alone answers the gate.
  const actions = await run(dir, [...OPEN, { outcome: 'PASS' }, { outcome: 'PASS' }], { skipped: null });

  assert.deepEqual(actions, PASSED_BY_EXCLUSION);
});

test('(6) with both parity switches off, passed-by-exclusion wins', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  await plantLedger(dir, BRANCH, 'parity');
  const actions = await run(dir, [...OPEN, { outcome: 'PASS' }, { outcome: 'PASS' }], { skipped: null });

  // `### 2` opens on the run-mode gate — "Before anything else in this step, re-read the run
  // mode" — and only then states "Skip this gate unless `phases.parity` is `true`", so the run
  // mode's disposition is the one reached first.
  assert.deepEqual(actions, PASSED_BY_EXCLUSION);
});

test('(7) writer questions route through <ask> and resume the writer on the prompt it had', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [
    { start: true },
    { outcome: 'questions' },
    { outcome: 'answered' },
    { outcome: 'returned' },
    { outcome: 'FAIL', review: ['business_parity_reviews', 0] },
    { outcome: 'questions' },
    { outcome: 'answered' },
  ]);

  // `### 1`: "If the writer returns a `## Questions` section in its output, **stop and route the
  // questions through `<ask>` verbatim**. If an answer comes back, dispatch the writer again".
  const ask = [
    ['action', 'binding'],
    ['binding', '<ask>'],
    ['node', 'plan_writer'],
    ['agent', 'task-plan-writer'],
    ['resume', 'plan_writer'],
  ];
  assert.deepEqual(actions, [
    writer(0),
    ask,
    writer(0),
    parity(0, 0),
    writer(1, findings('business_parity_reviews', 0)),
    ask,
    // "dispatch the writer again with the answers appended to the prompt" — the prompt it had, so
    // a revision stays a revision against the same findings file.
    writer(1, findings('business_parity_reviews', 0)),
  ]);
});

test('(8) a reviewer blocker escalates', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, { outcome: 'PASS' }, { outcome: 'blocker' }]);

  // `## Stop conditions`: "Any agent returns `error:` or `blocker:` → `<escalate>`."
  assert.deepEqual(actions.at(-1), [
    ['action', 'binding'],
    ['binding', '<escalate>'],
    ['node', 'architecture_review'],
    ['agent', 'architecture-reviewer'],
    ['reason', 'blocker'],
  ]);
});

test('(9) a gapped findings series is never back-filled, and rounds count files', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await plantReview(dir, `architecture_reviews/${BRANCH}`, 0);
  await plantReview(dir, `architecture_reviews/${BRANCH}`, 3);

  const steps = [...OPEN, { outcome: 'PASS' }, { outcome: 'FAIL', review: ['architecture_reviews', 4] }];
  steps.push({ outcome: 'returned' }, { outcome: 'PASS' }, { outcome: 'PASS' });
  for (let n = 0; n < 4; n += 1) {
    steps.push({ outcome: 'FAIL', review: ['task_plan_reviews', n] });
    if (n < 3) steps.push({ outcome: 'returned' }, { outcome: 'PASS' }, { outcome: 'PASS' });
  }
  const actions = await run(dir, steps);

  // `## Loop` preamble: "pass one past the highest `review_<n>.md` it holds, so an existing gapped
  // series is never back-filled".
  assert.deepEqual(actions[2], architecture(4, 0));
  assert.deepEqual(actions[5], architecture(5, 1));

  // `### 5`, `verdict: FAIL`: the cap is on "writer revisions across this loop's sequential gates"
  // (`## Loop` preamble) — one architecture FAIL and four plan-review FAILs reach 5 — and each
  // gate's round count is "`ls <findings_folder> | grep -c '^review_'`": three files, not index 5.
  assert.deepEqual(actions.at(-1), [
    ['action', 'binding'],
    ['binding', '<escalate>'],
    ['node', 'plan_review'],
    ['agent', 'task-plan-reviewer'],
    ['reason', 'cap'],
    ['findings_file', findings('task_plan_reviews', 3)],
    ['rounds', 'business_parity_review 0'],
    ['rounds', 'architecture_review 3'],
    ['rounds', 'plan_review 4'],
    ['summary', 'the plan loop reached its 5-revision cap; the plan-review gate was open when it fired'],
  ]);
});

test('(10) an outcome the pending node does not declare is refused and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await run(dir, OPEN);
  const before = readFileSync(walkerStatePath(dir));

  // `### 2`, "Parse the return" lists `verdict: PASS` and `verdict: FAIL`, and `## Stop conditions`
  // adds `error:` / `blocker:`; `no_ui` is the UI-test writer's outcome (`### 1. Spawn
  // ui-tests-plan-writer`, "No-UI short-circuit"), never a parity reviewer's.
  const refused = await walk(dir, [
    'next', '--flow', WALKER_FLOW, '--branch', BRANCH, '--outcome', 'no_ui', '--skipped', 'none',
  ]);

  assert.equal(refused.status, 1);
  assert.equal(refused.stdout, '');
  assert.match(refused.stderr, /^flow-walker: [^\n]*\n$/);
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
});
