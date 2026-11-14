/**
 * The flow walker `init` writes, driven across a session boundary: what `current` re-prints for each
 * saved state, what `next` continues it into, and what the ledger's fallback `start --entry …` gives.
 *
 * **The rule these tests exist to enforce: a planning (re-)entry that continues a saved walk carries
 * the loop counter and the open round's recorded findings, along with the prompt variant and the
 * revision's findings files; a `start` — the ledger's fallback when no walk is pending — begins the
 * counter at 0 and continues the round numbering from the round files, mid-round only where that
 * evidence is complete and consistent, and never reads convergence from them. Every expected action
 * is a literal written here, citing the rule by heading and quoted substring, never read out of the
 * graph.**
 *
 * Not covered here, deliberately: the choice between continuing and falling back. It reads the
 * flow-progress ledger and whether a plan artifact exists, which the walker cannot observe; it is the
 * orchestrator's prose (`plugin/instructions/task_plan_writing_instructions_core.md`,
 * `plugin/instructions/task_plan_writing_instructions_autonomous.md`). This suite pins each half the
 * walker owns. The re-entry reset and the cap budget after an answered cap park are
 * `cli/test/flow-walker-ui-and-reentry.test.mjs`'s.
 *
 * Citations abbreviated below: *core* is `plugin/instructions/task_plan_writing_instructions_core.md`
 * → `## The walker — routing is its, judgement is yours` → **Continuing a saved walk.**; *setup* is
 * that file's `## Setup (once per session)` step 7; *Override 2* and *Override 5* are
 * `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`
 * and `## Override 5 — pause/resume + flow-progress ledger (planning half)`; *§1.6* is
 * `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct
 * `commit-on-branch.sh`, NEVER a committer dispatch`; *walker STATE* is the `STATE` paragraph of the
 * header of `cli/templates/scripts/flow-walker.sh`.
 *
 * Every fixture repository is built under the system temp directory and torn down in process.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import {
  plantReview,
  run,
  stateDirOf,
  walk,
  walkerFixture,
  walkerStatePath,
  walkerUnavailable,
  WALKER_FLOW,
} from './helpers/walker.mjs';

const SKIP = walkerUnavailable();
const BRANCH = 'feat_x';

const PLAN_WRITE_HB = '[plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)';
const PARITY_HB = '[plan-write · parity · iter <i>] → business-parity-reviewer  (#<total_dispatches>)';
const ARCH_HB = '[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)';
const UI_WRITER_HB = '[ui-test-write · iter <i>] → ui-tests-plan-writer  (#<total_dispatches>)';
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
 * The task-plan writer: the initial prompt, or the revision naming every file of the closed round in
 * gate order. `arg.iteration` is the round the write feeds, on both variants.
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

const parity = gate('business_parity_review', 'business-parity-reviewer', PARITY_HB, undefined, []);
// Every walk below that reaches architecture through the parity gate runs with `phases.parity` off.
const architecture = gate('architecture_review', 'architecture-reviewer', ARCH_HB, undefined, PARITY_SKIPPED);
const planReview = gate('plan_review', 'task-plan-reviewer', PLAN_WRITE_HB, 'task-plan-reviewer', []);

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

/** `ui_review` is no round gate: its `arg.iteration` is its folder's next free index. */
function uiReview(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'ui_review'],
    ['agent', 'ui-tests-plan-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(UI_REVIEW_HB, i),
  ];
}

/** Round `n` with the parity gate skipped, each verdict planting its round file first. */
const gates = (n, { architecture: a = 'PASS', plan = 'PASS' } = {}) => [
  { outcome: a, review: ['architecture_reviews', n] },
  { outcome: plan, review: ['task_plan_reviews', n] },
];

const RETURNED = { outcome: 'returned' };
const TO_UI_LOOP = [{ start: true }, RETURNED, ...gates(0)];
const REVIEW_ENTRY = { start: true, entry: 'business_parity_review' };

const has = (actions, key, value) => actions.flat().some(([k, v]) => k === key && v === value);

async function fixture(t, phases) {
  const fx = await walkerFixture({ ...phases, branch: BRANCH });
  t.after(fx.cleanup);
  return fx.dir;
}

const flags = (...rest) => ['--flow', WALKER_FLOW, '--branch', BRANCH, ...rest];

/** `current` exits 0, re-prints `expected`, and leaves the state file byte-identical. */
async function assertCurrentUnchanged(dir, expected) {
  const before = readFileSync(walkerStatePath(dir));
  const result = await walk(dir, ['current', ...flags()]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.action, expected);
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);
  return result;
}

/** `current` exits 1 with one `flow-walker:` line: no walk is saved. */
async function assertNoSavedWalk(dir) {
  const current = await walk(dir, ['current', ...flags()]);
  assert.equal(current.status, 1);
  assert.equal(current.stdout, '');
  assert.match(current.stderr, /^flow-walker: [^\n]*\n$/);
}

/** The story index's repo-relative path. */
const storyIndex = (dir) => `${stateDirOf(dir)}/story_plans/${BRANCH}_story_plan.md`;

async function writeRelative(dir, relative, body) {
  await mkdir(join(dir, dirname(relative)), { recursive: true });
  await writeFile(join(dir, relative), body, 'utf8');
}

/** Commit exactly `paths` in the fixture, hooks skipped: what is committed is the case's subject. */
async function commit(dir, paths, message) {
  await runGit(dir, ['add', '--', ...paths]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', message]);
}

/**
 * A git fixture with `phases.parity` off — so architecture is the first gate that runs — whose story
 * index is committed, then whose architecture `review_3.md` is committed with `firstGate` as its body.
 */
async function midRoundFixture(t, firstGate = `# review 3\nverdict: FAIL\nreview_mode: full\n`) {
  const dir = await fixture(t, { parity: false, qa: true });
  await runGit(dir, ['checkout', '-q', '-b', BRANCH]);
  await writeRelative(dir, storyIndex(dir), '# draft\n');
  await commit(dir, [storyIndex(dir)], 'fixture: story index');
  const review = `${stateDirOf(dir)}/architecture_reviews/${BRANCH}/review_3.md`;
  await writeRelative(dir, review, firstGate);
  await commit(dir, [review], 'fixture: architecture round 3');
  return dir;
}

test('(1) a reviewer in flight is re-dispatched, and the counter and the round\'s recorded findings carry on', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    { start: true },
    RETURNED,
    ...gates(0, { architecture: 'FAIL', plan: 'FAIL' }),
    RETURNED,
    { outcome: 'PASS', review: ['architecture_reviews', 1] },
  ]);
  assert.deepEqual(actions.at(-1), planReview(1, 1));

  // core: "`action: dispatch` — a dispatch was pending when the last session ended".
  await assertCurrentUnchanged(dir, planReview(1, 1));

  const resumed = await run(dir, [{ outcome: 'FAIL', review: ['task_plan_reviews', 1] }, RETURNED]);
  // core: "Issue no `start`" — the counter carries on (iter 2, not 0), and round 1 closes with the
  // architecture file recorded before the boundary beside the plan-review file fed after it, in gate
  // order.
  assert.deepEqual(resumed, [
    writer(2, roundFiles(1), { passed: [closed(1, 'FAIL')] }),
    architecture(2, 2),
  ]);
});

test('(2) a revision a FAIL round queued is re-printed with every file of the round', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  await run(dir, [{ start: true }, RETURNED, ...gates(0, { plan: 'FAIL' })]);

  // core: "`action: dispatch` — a dispatch was pending when the last session ended".
  const expected = writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] });
  const result = await assertCurrentUnchanged(dir, expected);
  assert.ok(has([result.action], 'prompt', 'revision'));
  for (const file of roundFiles(0)) assert.ok(has([result.action], 'arg.findings_file', file), `${file} is not named`);
});

test('(3) a ledger line printed again flips nothing twice', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const atUiLoop = uiWriter(0, undefined, [closed(0, 'PASS'), ['ledger', 'P1']]);
  const actions = await run(dir, TO_UI_LOOP);
  assert.deepEqual(actions.at(-1), atUiLoop);

  // Override 5: "A `ledger:` line the walker prints again is re-applied".
  const first = await assertCurrentUnchanged(dir, atUiLoop);
  const second = await assertCurrentUnchanged(dir, atUiLoop);
  assert.equal(second.stdout, first.stdout);
  for (const { action } of [first, second]) {
    assert.equal(action.filter(([k, v]) => k === 'ledger' && v === 'P1').length, 1);
  }

  // §1.6: "**Idempotency:** re-flipping an already-`[x]`" — the second commit finds nothing staged.
  await runGit(dir, ['checkout', '-q', '-b', BRANCH]);
  const ledger = `${stateDirOf(dir)}/flow_progress/${BRANCH}_progress.md`;
  await writeRelative(dir, ledger, '- [x] P1.\n');
  const flip = [`${INIT_SCRIPTS_DIR}/commit-on-branch.sh`, '--repo', dir, ledger, '--', `chore: Flow progress P1 for ${BRANCH}`];

  const landed = await runBash(dir, flip);
  assert.equal(landed.status, 0, landed.stderr);
  const head = (await runGit(dir, ['rev-parse', 'HEAD'])).stdout;
  const again = await runBash(dir, flip);
  assert.equal(again.status, 3, again.stderr);
  assert.equal((await runGit(dir, ['rev-parse', 'HEAD'])).stdout, head);
});

test('(4) a UI reviewer in flight is re-dispatched, and the UI plan is not rewritten', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  await run(dir, [
    ...TO_UI_LOOP,
    RETURNED,
    { outcome: 'FAIL', review: ['ui_test_plan_reviews', 0] },
    RETURNED,
  ]);

  // core: "`action: dispatch` — a dispatch was pending when the last session ended".
  await assertCurrentUnchanged(dir, uiReview(1, 1));

  const resumed = await run(dir, [{ outcome: 'PASS' }]);
  assert.deepEqual(resumed, [
    [
      ['action', 'binding'],
      ['binding', '<terminal_handoff>'],
      ['node', 'convergence'],
      ['report', 'business_parity_review skipped'],
      ['report', 'architecture_review passed'],
      ['report', 'plan_review passed'],
      ['report', 'ui_test passed'],
      ['ledger', 'P2'],
    ],
  ]);
  assert.ok(
    !resumed.some((action) => has([action], 'node', 'ui_writer') && has([action], 'prompt', 'initial')),
    'a resumed UI review rewrote the UI plan',
  );
});

test('(5) a parked <ask> resumes at the writer that parked, on its stored revision', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    ...TO_UI_LOOP,
    RETURNED,
    { outcome: 'FAIL', review: ['ui_test_plan_reviews', 0] },
    { outcome: 'questions' },
  ]);
  const ask = [
    ['action', 'binding'],
    ['binding', '<ask>'],
    ['node', 'ui_writer'],
    ['agent', 'ui-tests-plan-writer'],
    ['resume', 'ui_writer'],
  ];
  assert.deepEqual(actions.at(-1), ask);

  // core: "`binding: <ask>` — a writer's `## Questions` parked the walk".
  await assertCurrentUnchanged(dir, ask);

  const resumed = await run(dir, [{ outcome: 'answered' }]);
  assert.deepEqual(resumed, [uiWriter(1, findings('ui_test_plan_reviews', 0))]);
});

test('(6) a finished walk is recognised as finished and replaced by the ledger fallback', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const steps = [{ start: true }];
  for (let n = 0; n < 5; n += 1) steps.push(RETURNED, ...gates(n, { plan: 'FAIL' }));
  await run(dir, steps);

  // core: "any other `binding:` — the walk finished".
  const current = await walk(dir, ['current', ...flags()]);
  assert.equal(current.status, 0, current.stderr);
  assert.deepEqual(current.action[1], ['binding', '<escalate>']);

  const before = readFileSync(walkerStatePath(dir));
  const refused = await walk(dir, ['next', ...flags('--outcome', 'PASS', '--skipped', 'none')]);
  assert.equal(refused.status, 1);
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);

  // The fallback starts a fresh walk at counter 0 over five complete FAIL rounds with no revision
  // note: it closes round 4 from its files — the round series continues — and the revision is the
  // first increment of the new walk's counter, so the cap does not fire again.
  const fallback = await run(dir, [REVIEW_ENTRY]);
  assert.deepEqual(fallback, [writer(1, roundFiles(4), { round: 5, passed: [closed(4, 'FAIL')] })]);
  assert.ok(!has(fallback, 'binding', '<escalate>'), 'the fallback fired the cap again');

  const handedOff = await fixture(t, { parity: false, qa: true });
  await run(handedOff, [...TO_UI_LOOP, RETURNED, { outcome: 'PASS' }]);
  const done = await walk(handedOff, ['current', ...flags()]);
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(done.action[1], ['binding', '<terminal_handoff>']);
});

test('(7) with no saved walk, a draft on disk — committed or not — is reviewed, never skipped or rewritten', { skip: SKIP }, async (t) => {
  for (const committed of [false, true]) {
    const label = committed ? 'committed' : 'untracked';
    const dir = await fixture(t, { parity: false, qa: true });
    await writeRelative(dir, storyIndex(dir), '# draft\n');
    if (committed) {
      await runGit(dir, ['checkout', '-q', '-b', BRANCH]);
      await commit(dir, [storyIndex(dir)], 'fixture: story index');
    }

    // core: "exit 1 — no walk of this flow is saved for this branch".
    await assertNoSavedWalk(dir);
    assert.ok(!existsSync(walkerStatePath(dir)), `${label}: current wrote the walker state`);

    // Override 2: "send the draft back through review — never rewrite it, never skip it"; setup:
    // "**review** gives the first gate of the loop whose draft no reviewer has passed".
    const actions = await run(dir, [REVIEW_ENTRY, ...gates(0, { architecture: 'FAIL' })]);
    assert.deepEqual(
      actions,
      [architecture(0, 0), planReview(0, 0), writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] })],
      label,
    );
    assert.ok(!has(actions.slice(0, 1), 'node', 'plan_writer'), `${label}: the fallback rewrote the draft`);
    assert.ok(!has(actions, 'node', 'ui_writer'), `${label}: the fallback skipped past the task-plan loop`);
    assert.ok(!has(actions, 'prompt', 'initial'), `${label}: the draft was rewritten from the initial prompt`);
    // Override 2(b): "a story index that exists and looks complete is never enough".
    assert.ok(!has(actions, 'ledger', 'P1'), `${label}: a draft on disk was treated as converged`);
  }

  const withParity = await fixture(t, { parity: true, qa: true });
  assert.deepEqual(await run(withParity, [REVIEW_ENTRY]), [parity(0, 0)]);

  const uiDraft = await fixture(t, { parity: false, qa: true });
  assert.deepEqual(await run(uiDraft, [{ start: true, entry: 'ui_review' }]), [uiReview(0, 0)]);
});

test('(8) with the saved walk deleted, a committed mid-round continues at the next reviewer at counter 0', { skip: SKIP }, async (t) => {
  const dir = await midRoundFixture(t);
  await run(dir, [{ start: true }]);
  rmSync(walkerStatePath(dir));
  await assertNoSavedWalk(dir);

  // walker STATE: "continued at its first missing gate when every earlier gate reads a verdict and no
  // plan change postdates it" — and "every `start` sets every counter to 0".
  const resumed = await run(dir, [REVIEW_ENTRY]);
  assert.deepEqual(resumed, [planReview(3, 0, { mode: 'full' })]);

  // The architecture FAIL read off disk is the round's recorded evidence: the revision carries it
  // beside the plan-review file fed now, and the counter's first increment is iter 1.
  const closedRound = await run(dir, [{ outcome: 'PASS', review: ['task_plan_reviews', 3] }]);
  assert.deepEqual(closedRound, [writer(1, roundFiles(3), { round: 4, passed: [closed(3, 'FAIL')] })]);
});

test('(9) inconsistent round evidence restarts the round at its first gate', { skip: SKIP }, async (t) => {
  // (a) The committed first-gate file carries no verdict line.
  const noVerdict = await midRoundFixture(t, '# review 3\nreview_mode: full\n');
  assert.deepEqual(await run(noVerdict, [REVIEW_ENTRY]), [architecture(3, 0)], 'no verdict line');

  // (b) A commit touches the story index after the first-gate file's commit.
  const planNewer = await midRoundFixture(t);
  await writeRelative(planNewer, storyIndex(planNewer), '# draft, revised\n');
  await commit(planNewer, [storyIndex(planNewer)], 'fixture: story index revised');
  assert.deepEqual(await run(planNewer, [REVIEW_ENTRY]), [architecture(3, 0)], 'plan newer');
});

test('(10) convergence is never read from round files: a complete round is reviewed or moved past', { skip: SKIP }, async (t) => {
  // walker STATE: "A complete all-PASS round is reviewed again: convergence is never inferred from
  // files" — only the ledger's P1 records it.
  const allPass = await fixture(t, { parity: false, qa: true });
  await plantReview(allPass, `architecture_reviews/${BRANCH}`, 3, 'PASS');
  await plantReview(allPass, `task_plan_reviews/${BRANCH}`, 3, 'PASS');
  const reviewed = await run(allPass, [REVIEW_ENTRY]);
  assert.deepEqual(reviewed, [architecture(3, 0)]);
  assert.ok(!has(reviewed, 'ledger', 'P1'), 'a round of PASS files was treated as converged');
  assert.ok(!has(reviewed, 'node', 'ui_writer'), 'a round of PASS files skipped the task-plan loop');

  // walker STATE: "a complete round with a FAIL is … moved past when its revision note exists".
  const noted = await fixture(t, { parity: false, qa: true });
  await plantReview(noted, `architecture_reviews/${BRANCH}`, 3, 'FAIL');
  await plantReview(noted, `task_plan_reviews/${BRANCH}`, 3, 'PASS');
  await writeRelative(noted, `${stateDirOf(noted)}/plan_revisions/${BRANCH}/task_plan_revision_4.md`, '# revision 4\n');
  assert.deepEqual(await run(noted, [REVIEW_ENTRY]), [architecture(4, 0)]);
});

/*
 * The task prompt's `## Tests` bullets this suite answers, and the case that covers each.
 *
 *   Walker / graph — continuing a saved walk mid-round re-dispatches the reviewer in flight
 *     and keeps the round's recorded findings ................................. (1)
 *   Planning pause — resuming continues at the interrupted dispatch with the
 *     round's findings intact ................................................. (1), (2)
 *   Mid-round resume — the saved walk deleted, the second reviewer dispatched,
 *     the counter at 0 ........................................................ (8)
 *   Mid-round resume — inconsistent evidence restarts at the first reviewer ... (9)
 *   Convergence from the ledger — a committed but unconverged plan is reviewed,
 *     never treated as converged .............................................. (7), (10), (6)
 *
 * The cases the suite carried before round routing, kept: UI reviewer in flight (4), parked <ask>
 * (5), finished walk (6), repeated ledger line (3).
 */
