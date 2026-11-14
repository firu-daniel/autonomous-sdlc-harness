/**
 * The flow walker `init` writes, driven through the task-plan loop against a throwaway fixture.
 *
 * **The rule these tests exist to enforce: the walker reproduces the round routing
 * `plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker — routing is its,
 * judgement is yours` hands it, under the round contract (`plugin/instructions/plan_review_rounds.md`)
 * — every gate runs every round, one round node closes the round, the loop counter alone drives the
 * cap and the review mode, and the round number names the round files — and every expectation cites
 * the rule it pins, by heading and quoted substring.** Each expected action is a literal written here
 * and never read out of the walker's graph: an expectation derived from the graph would prove only
 * that the walker agrees with itself.
 *
 * Not covered here, deliberately: resuming a saved walk, the UI-test-plan review loop, re-entry
 * through `--entry`, and `current`. Those are separate suites'.
 *
 * Every fixture repository is built under the system temp directory and torn down in process; no
 * case is ever aimed at this checkout (`.claude/context/conventions.md` → `## The testing bar`).
 * Every walk here starts with no round file on disk except `(9)`'s, so the round number equals the
 * counter in all of them but that one.
 *
 * `(#<total_dispatches>)` is asserted as that literal slot: the counter is the orchestrator's safety
 * contract, not the walker's.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/** The heartbeat's `iter <i>` is the loop counter, never the round number. */
function heartbeat(template, i, agent) {
  return ['heartbeat', template.replace('<i>', String(i)).replace('<agent_name>', agent)];
}

/**
 * Reviewers run `full` for the first two rounds of a walk and `converging` from the third: the
 * 0-based counter's values 0 and 1 are `full`.
 */
const modeAt = (i) => (i < 2 ? 'full' : 'converging');

/**
 * `### 1. Spawn task-plan-writer`: the first-iteration prompt, or the revision naming every findings
 * file of the closed round, in gate order. `arg.iteration` is the round the write feeds, on both
 * variants. `passed` holds the `round:` / `skip:` / `ledger:` lines for what the walk passed through.
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

/**
 * A round gate's dispatch: `arg.iteration` is the round number — the same index in every gate's
 * folder — and `arg.review_mode` follows the counter.
 */
function gate(node, agent, template, heartbeatAgent) {
  return (round, i, { passed = [], mode = modeAt(i) } = {}) => [
    ['action', 'dispatch'],
    ['node', node],
    ['agent', agent],
    ['arg.iteration', String(round)],
    ['arg.review_mode', mode],
    ...passed,
    heartbeat(template, i, heartbeatAgent),
  ];
}

const parity = gate('business_parity_review', 'business-parity-reviewer', PARITY_HB);
const architecture = gate('architecture_review', 'architecture-reviewer', ARCH_HB);
// `### 4. Spawn task-plan-reviewer` carries no heartbeat of its own; `## Safety contract` step 3's
// template names the agent.
const planReview = gate('plan_review', 'task-plan-reviewer', PLAN_WRITE_HB, 'task-plan-reviewer');

const findings = (folder, n) => `devscene/${folder}/${BRANCH}/review_${n}.md`;

/** Every file round `n` records with all three gates run, in gate order. */
const roundFiles = (n) => [
  findings('business_parity_reviews', n),
  findings('architecture_reviews', n),
  findings('task_plan_reviews', n),
];

/** The line a walk prints on passing through the round node. */
const closed = (n, verdict) => ['round', `${n} ${verdict}`];

/**
 * One round's three gate verdicts, each planting its round file — `PASS` included — before it is fed.
 *
 * @param {number} n the round number.
 * @param {{ parity?: string, architecture?: string, plan?: string }} [verdicts] `PASS` unless named.
 */
function gates(n, verdicts = {}) {
  const v = { parity: 'PASS', architecture: 'PASS', plan: 'PASS', ...verdicts };
  return [
    { outcome: v.parity, review: ['business_parity_reviews', n] },
    { outcome: v.architecture, review: ['architecture_reviews', n] },
    { outcome: v.plan, review: ['task_plan_reviews', n] },
  ];
}

/**
 * `## Convergence` with `phases.qa` off: `## UI-test-plan write loop`, "Skip this loop unless
 * `phases.qa` is `true` … fall straight through to `## Convergence`, which reports the loop as not
 * run". The round node's `PASS` records the ledger's P1, "Task plan converged"
 * (`autonomous_pause_and_ledger.md` → `### 1.3 Templates`).
 */
function handoff(parityReport, round) {
  return [
    ['action', 'binding'],
    ['binding', '<terminal_handoff>'],
    ['node', 'convergence'],
    ['report', `business_parity_review ${parityReport}`],
    ['report', 'architecture_review passed'],
    ['report', 'plan_review passed'],
    ['report', 'ui_test qa-phase-off'],
    closed(round, 'PASS'),
    ['ledger', 'P1'],
    ['skip', 'ui_writer skipped'],
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
    ['rounds', `business_parity_review ${rounds[0]}`],
    ['rounds', `architecture_review ${rounds[1]}`],
    ['rounds', `plan_review ${rounds[2]}`],
    ['summary', `the plan loop reached its 5-revision cap; the gates open when it fired: ${openGates}`],
    closed(round, 'FAIL'),
  ];
}

const dispatchesOf = (actions, ...nodes) =>
  actions.filter((pairs) => pairs.some(([k, v]) => k === 'node' && nodes.includes(v)) && pairs[0][1] === 'dispatch');

/** A walk from `start` through the writer's first return. */
const OPEN = [{ start: true }, { outcome: 'returned' }];
const RETURNED = { outcome: 'returned' };

async function fixture(t, phases) {
  const fx = await walkerFixture({ ...phases, branch: BRANCH });
  t.after(fx.cleanup);
  return fx.dir;
}

test('(1) every gate passes first time: writer, parity, architecture, plan review, then the hand-off', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, ...gates(0)]);

  assert.deepEqual(actions, [
    writer(0),
    // `### 2`: "Business parity comes **before** architecture"; each gate's `PASS` routes on to the
    // next gate, and `plan_review`'s to the round node.
    parity(0, 0),
    architecture(0, 0),
    planReview(0, 0),
    // A round in which no gate recorded `FAIL` closes `PASS` and leaves the task-plan loop.
    handoff('passed', 0),
  ]);
});

test('(2) a parity FAIL still dispatches architecture and plan review, then one revision carries every file of the round', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, ...gates(0, { parity: 'FAIL' }), RETURNED, ...gates(1)]);

  assert.deepEqual(actions, [
    writer(0),
    parity(0, 0),
    // Every gate runs every round: a `FAIL` is recorded and the walk moves on to the next reviewer.
    architecture(0, 0),
    planReview(0, 0),
    // The round node closes round 0 `FAIL`: one revision, naming every file the round recorded —
    // `PASS` files included — in gate order, feeding round 1.
    writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] }),
    // Every gate re-runs on the revised plan, each at round 1 in its own folder.
    parity(1, 1),
    architecture(1, 1),
    planReview(1, 1),
    handoff('passed', 1),
  ]);
});

test('(3) architecture FAILs every round until the cap, counted once per round, and the escalation carries the round payload', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const steps = [...OPEN];
  for (let n = 0; n < 5; n += 1) {
    steps.push(...gates(n, { architecture: 'FAIL' }));
    if (n < 4) steps.push(RETURNED);
  }
  const actions = await run(dir, steps);

  // The counter moves once per round close: FAIL rounds one to four each send one revision back.
  assert.deepEqual(dispatchesOf(actions, 'plan_writer'), [
    writer(0),
    writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] }),
    writer(2, roundFiles(1), { passed: [closed(1, 'FAIL')] }),
    writer(3, roundFiles(2), { passed: [closed(2, 'FAIL')] }),
    writer(4, roundFiles(3), { passed: [closed(3, 'FAIL')] }),
  ]);
  assert.deepEqual(dispatchesOf(actions, 'architecture_review'), [
    architecture(0, 0),
    architecture(1, 1),
    architecture(2, 2),
    architecture(3, 3),
    architecture(4, 4),
  ]);

  // The fifth `FAIL` round reaches the 5-revision cap: `<escalate>` from the round node, with every
  // file of the closing round, each gate's count of `FAIL` round files, and the gates open when it
  // fired. No story index exists in the fixture, so no index evidence is printed.
  assert.deepEqual(actions.at(-1), capEscalation(4, [0, 5, 0], 'architecture_review'));
});

test('(4) with phases.parity false the parity gate is skipped and records no pass', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  const actions = await run(dir, [
    ...OPEN,
    { outcome: 'PASS', review: ['architecture_reviews', 0] },
    { outcome: 'PASS', review: ['task_plan_reviews', 0] },
  ]);

  assert.deepEqual(actions, [
    writer(0),
    // `### 2`: "Skip this gate unless `phases.parity` is `true` in `devscene.config.json`. … the loop
    // proceeds to the next step" — no parity dispatch.
    architecture(0, 0, { passed: [['skip', 'business_parity_review skipped']] }),
    planReview(0, 0),
    // … "A skipped gate is **not** a converged gate … records no pass for it, and reports none at
    // `## Convergence`": the gate's value is `skipped`, never `passed`. A skipped gate records no
    // verdict, so the round closes on the other two.
    handoff('skipped', 0),
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
 * `business-parity-reviewer`** … a gate a run mode excludes is *passed by exclusion*".
 */
const PASSED_BY_EXCLUSION = [
  writer(0),
  architecture(0, 0, { passed: [['skip', 'business_parity_review passed-by-exclusion']] }),
  planReview(0, 0),
  // `## Convergence`: "the `task-plan-reviewer` returned `verdict: PASS` … or were passed by
  // exclusion, where the run mode skipped them".
  handoff('passed-by-exclusion', 0),
];

const PASS_WITHOUT_PARITY = [
  ...OPEN,
  { outcome: 'PASS', review: ['architecture_reviews', 0] },
  { outcome: 'PASS', review: ['task_plan_reviews', 0] },
];

test('(5) a run-mode parity skip in the ledger passes the parity gate by exclusion', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await plantLedger(dir, BRANCH, 'parity');
  // No `--skipped`: the ledger is "the record `… run_mode_instructions.md` → `## The durable
  // record` defines for this flow", so it alone answers the gate.
  const actions = await run(dir, PASS_WITHOUT_PARITY, { skipped: null });

  assert.deepEqual(actions, PASSED_BY_EXCLUSION);
});

test('(6) with both parity switches off, passed-by-exclusion wins', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  await plantLedger(dir, BRANCH, 'parity');
  const actions = await run(dir, PASS_WITHOUT_PARITY, { skipped: null });

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
    RETURNED,
    ...gates(0, { parity: 'FAIL' }),
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
    architecture(0, 0),
    planReview(0, 0),
    writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] }),
    ask,
    // "dispatch the writer again with the answers appended to the prompt" — the prompt it had, so a
    // revision stays a revision against the same round's files, and no round closes again.
    writer(1, roundFiles(0)),
  ]);
});

test('(8) a reviewer blocker escalates', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [
    ...OPEN,
    { outcome: 'PASS', review: ['business_parity_reviews', 0] },
    { outcome: 'blocker' },
  ]);

  // `## Stop conditions`: "Any agent returns `error:` or `blocker:` → `<escalate>`."
  assert.deepEqual(actions.at(-1), [
    ['action', 'binding'],
    ['binding', '<escalate>'],
    ['node', 'architecture_review'],
    ['agent', 'architecture-reviewer'],
    ['reason', 'blocker'],
  ]);
});

test('(9) a gapped findings series is never back-filled, and rounds count FAIL files', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await plantReview(dir, `architecture_reviews/${BRANCH}`, 0, 'FAIL');
  await plantReview(dir, `architecture_reviews/${BRANCH}`, 3, 'PASS');

  const steps = [...OPEN, ...gates(4, { architecture: 'FAIL' }), RETURNED];
  for (let n = 5; n < 9; n += 1) {
    steps.push(...gates(n, { plan: 'FAIL' }));
    if (n < 8) steps.push(RETURNED);
  }
  const actions = await run(dir, steps);

  // The round number carries on past the highest `review_<n>.md` on disk — round 4, never a gap
  // index — while the counter starts at 0.
  assert.deepEqual(actions[0], writer(0, undefined, { round: 4 }));
  assert.deepEqual(actions[2], architecture(4, 0));
  assert.deepEqual(actions[6], architecture(5, 1));

  // One architecture `FAIL` round and four plan-review `FAIL` rounds reach the 5-revision cap. Each
  // gate's count is its folder's `FAIL` files: architecture's planted `review_3.md` and its round 5–8
  // files read `PASS` and are not counted, so it is 2 (rounds 0 and 4), not its seven files.
  assert.deepEqual(actions.at(-1), capEscalation(8, [0, 2, 4], 'plan_review'));
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

test('(11) a middle gate fails and every later reviewer is still dispatched', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: false });
  const actions = await run(dir, [
    ...OPEN,
    { outcome: 'FAIL', review: ['architecture_reviews', 0] },
    { outcome: 'PASS', review: ['task_plan_reviews', 0] },
  ]);

  assert.deepEqual(actions, [
    writer(0),
    architecture(0, 0, { passed: [['skip', 'business_parity_review skipped']] }),
    // The architecture `FAIL` short-circuits nothing: plan review runs in the same round.
    planReview(0, 0),
    // Exactly the two files the round recorded — the skipped parity gate recorded none — in gate
    // order, the architecture `FAIL` file and the plan-review `PASS` file.
    writer(1, [findings('architecture_reviews', 0), findings('task_plan_reviews', 0)], {
      passed: [closed(0, 'FAIL')],
    }),
  ]);
});

test('(12) the counter moves once per round, however many gates fail in it', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [...OPEN, ...gates(0, { parity: 'FAIL', architecture: 'FAIL' })]);

  assert.deepEqual(actions.at(-1), writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] }));
  assert.deepEqual(actions.at(-1).at(-1), ['heartbeat', '[plan-write · iter 1] → task-plan-writer  (#<total_dispatches>)']);
});

test('(13) the cap names every gate open in the closing round', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const steps = [...OPEN];
  for (let n = 0; n < 4; n += 1) steps.push(...gates(n, { architecture: 'FAIL' }), RETURNED);
  steps.push(...gates(4, { parity: 'FAIL', plan: 'FAIL' }));
  const actions = await run(dir, steps);

  // `{open_gates}` is the closing round's `FAIL` gates, comma-joined in gate order — not every gate
  // that ever failed: architecture passed round 4 and is not named.
  assert.deepEqual(actions.at(-1), capEscalation(4, [1, 4, 1], 'business_parity_review, plan_review'));
});

test('(14) the review mode switches to converging at the third round', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  const actions = await run(dir, [
    ...OPEN,
    ...gates(0, { plan: 'FAIL' }),
    RETURNED,
    ...gates(1, { plan: 'FAIL' }),
    RETURNED,
    ...gates(2),
  ]);

  assert.deepEqual(dispatchesOf(actions, 'business_parity_review', 'architecture_review', 'plan_review'), [
    parity(0, 0, { mode: 'full' }),
    architecture(0, 0, { mode: 'full' }),
    planReview(0, 0, { mode: 'full' }),
    parity(1, 1, { mode: 'full' }),
    architecture(1, 1, { mode: 'full' }),
    planReview(1, 1, { mode: 'full' }),
    parity(2, 2, { mode: 'converging' }),
    architecture(2, 2, { mode: 'converging' }),
    planReview(2, 2, { mode: 'converging' }),
  ]);
  assert.deepEqual(actions.at(-1), handoff('passed', 2));
});

test('(15) a round of three PASS files reaches the UI-test-plan writer', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: true });
  const actions = await run(dir, [...OPEN, ...gates(0)]);

  // `## UI-test-plan write loop` runs when `phases.qa` is `true`; the round's `PASS` resets the
  // counter, so the UI writer's heartbeat reads `iter 0`.
  assert.deepEqual(actions.at(-1), [
    ['action', 'dispatch'],
    ['node', 'ui_writer'],
    ['agent', 'ui-tests-plan-writer'],
    ['prompt', 'initial'],
    closed(0, 'PASS'),
    ['ledger', 'P1'],
    ['heartbeat', '[ui-test-write · iter 0] → ui-tests-plan-writer  (#<total_dispatches>)'],
  ]);
  // A reviewer writes its round file on `PASS` too.
  for (const file of roundFiles(0)) assert.ok(existsSync(join(dir, file)), `${file} is absent`);
});

test('(16) PASS at a round gate without --findings is refused and changes no state', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: true, qa: false });
  await run(dir, OPEN);
  const before = readFileSync(walkerStatePath(dir));

  // Every round gate writes a round file on `PASS` as on `FAIL`, so its verdict is never fed
  // without the file it stands for.
  const refused = await walk(dir, [
    'next', '--flow', WALKER_FLOW, '--branch', BRANCH, '--outcome', 'PASS', '--skipped', 'none',
  ]);

  assert.equal(refused.status, 1);
  assert.equal(refused.stdout, '');
  assert.match(refused.stderr, /^flow-walker: [^\n]*\n$/);
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
});

/*
 * The task prompt's `## Tests` → **Walker / graph**, bullet by bullet:
 *
 * - a round in which a middle gate fails still dispatches every later reviewer — `(11)`, and `(2)`
 *   for the first gate;
 * - the counter increments once per round — `(12)`, and `(3)`'s writer dispatches;
 * - the cap escalation names every open gate — `(13)`, and `(3)` / `(9)` for one open gate;
 * - `arg.review_mode` is `full` for rounds 1–2 and `converging` from round 3 — `(14)`;
 * - continuing a saved walk mid-round re-dispatches the reviewer in flight and keeps the round's
 *   recorded findings — `cli/test/flow-walker-resume.test.mjs`, not this suite.
 */
