/**
 * The flow walker `init` writes, driven across a session boundary: what `current` re-prints for each
 * saved state, what `next` continues it into, and what the ledger's fallback `start --entry …` gives.
 *
 * **The rule these tests exist to enforce: a planning (re-)entry continues a saved walk where the last
 * session stopped — the loop counter, each findings folder's `review_<n>` series, the prompt variant
 * and the recorded findings file all carry over — and falls back to the ledger's `start --entry …`
 * only when no walk is pending; every expected action is a literal written here, citing the rewritten
 * rule by heading and quoted substring, never read out of the graph.**
 *
 * Not covered here, deliberately: the choice between continuing and falling back. It reads the
 * flow-progress ledger and whether a plan artifact exists, which the walker cannot observe; it is the
 * orchestrator's prose (`plugin/instructions/task_plan_writing_instructions_core.md`,
 * `plugin/instructions/task_plan_writing_instructions_autonomous.md`). This suite pins each half the
 * walker owns.
 *
 * Citations abbreviated below: *core* is `plugin/instructions/task_plan_writing_instructions_core.md`
 * → `## The walker — routing is its, judgement is yours` → **Continuing a saved walk.**; *setup* is
 * that file's `## Setup (once per session)` step 7; *Override 2* and *Override 5* are
 * `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`
 * and `## Override 5 — pause/resume + flow-progress ledger (planning half)`; *§1.6* is
 * `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct
 * `commit-on-branch.sh`, NEVER a committer dispatch`.
 *
 * Every fixture repository is built under the system temp directory and torn down in process.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { runBash, runGit } from './helpers/fixture.mjs';
import { run, stateDirOf, walk, walkerFixture, walkerStatePath, walkerUnavailable, WALKER_FLOW } from './helpers/walker.mjs';

const SKIP = walkerUnavailable();
const BRANCH = 'feat_x';

const PLAN_WRITE_HB = '[plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)';
const PARITY_HB = '[plan-write · parity · iter <i>] → business-parity-reviewer  (#<total_dispatches>)';
const ARCH_HB = '[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)';
const UI_WRITER_HB = '[ui-test-write · iter <i>] → ui-tests-plan-writer  (#<total_dispatches>)';
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

const PARITY_SKIPPED = [['skip', 'business_parity_review skipped']];

function parity(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'business_parity_review'],
    ['agent', 'business-parity-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(PARITY_HB, i),
  ];
}

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

function uiReview(index, i) {
  return [
    ['action', 'dispatch'],
    ['node', 'ui_review'],
    ['agent', 'ui-tests-plan-reviewer'],
    ['arg.iteration', String(index)],
    heartbeat(UI_REVIEW_HB, i),
  ];
}

const TO_UI_LOOP = [{ start: true }, { outcome: 'returned' }, { outcome: 'PASS' }, { outcome: 'PASS' }];

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

test('(1) a reviewer in flight is re-dispatched, and the counter and review series carry on', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    { start: true },
    { outcome: 'returned' },
    { outcome: 'FAIL', review: ['architecture_reviews', 0] },
    { outcome: 'returned' },
    { outcome: 'PASS' },
  ]);
  assert.deepEqual(actions.at(-1), planReview(0, 1));

  // core: "`action: dispatch` — a dispatch was pending when the last session ended".
  await assertCurrentUnchanged(dir, planReview(0, 1));

  const resumed = await run(dir, [
    { outcome: 'FAIL', review: ['task_plan_reviews', 0] },
    { outcome: 'returned' },
  ]);
  // core: "the counter and every `review_<n>` series carry on" — iter 2, not 0; architecture index 1.
  assert.deepEqual(resumed, [writer(2, findings('task_plan_reviews', 0)), architecture(1, 2)]);
});

test('(2) a revision a FAIL queued is re-printed with its findings file', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  await run(dir, [
    { start: true },
    { outcome: 'returned' },
    { outcome: 'PASS' },
    { outcome: 'FAIL', review: ['task_plan_reviews', 0] },
  ]);

  // core: "`action: dispatch` — a dispatch was pending when the last session ended".
  const result = await assertCurrentUnchanged(dir, writer(1, findings('task_plan_reviews', 0)));
  assert.ok(has([result.action], 'prompt', 'revision'));
  assert.ok(has([result.action], 'arg.findings_file', findings('task_plan_reviews', 0)));
});

test('(3) a ledger line printed again flips nothing twice', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, TO_UI_LOOP);
  assert.deepEqual(actions.at(-1), uiWriter(0, undefined, [['ledger', 'P1']]));

  // Override 5: "A `ledger:` line the walker prints again is re-applied".
  const first = await assertCurrentUnchanged(dir, uiWriter(0, undefined, [['ledger', 'P1']]));
  const second = await assertCurrentUnchanged(dir, uiWriter(0, undefined, [['ledger', 'P1']]));
  assert.equal(second.stdout, first.stdout);
  for (const { action } of [first, second]) {
    assert.equal(action.filter(([k, v]) => k === 'ledger' && v === 'P1').length, 1);
  }

  // §1.6: "**Idempotency:** re-flipping an already-`[x]`" — the second commit finds nothing staged.
  await runGit(dir, ['checkout', '-q', '-b', BRANCH]);
  const ledger = `${stateDirOf(dir)}/flow_progress/${BRANCH}_progress.md`;
  await mkdir(join(dir, dirname(ledger)), { recursive: true });
  await writeFile(join(dir, ledger), '- [x] P1.\n', 'utf8');
  const flip = ['scripts/commit-on-branch.sh', '--repo', dir, ledger, '--', `chore: Flow progress P1 for ${BRANCH}`];

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
    { outcome: 'returned' },
    { outcome: 'FAIL', review: ['ui_test_plan_reviews', 0] },
    { outcome: 'returned' },
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
    { outcome: 'returned' },
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
  for (let n = 0; n < 5; n += 1) {
    steps.push({ outcome: 'returned' }, { outcome: 'PASS' }, { outcome: 'FAIL', review: ['task_plan_reviews', n] });
  }
  await run(dir, steps);

  // core: "any other `binding:` — the walk finished".
  const current = await walk(dir, ['current', ...flags()]);
  assert.equal(current.status, 0, current.stderr);
  assert.deepEqual(current.action[1], ['binding', '<escalate>']);

  const before = readFileSync(walkerStatePath(dir));
  const refused = await walk(dir, ['next', ...flags('--outcome', 'PASS', '--skipped', 'none')]);
  assert.equal(refused.status, 1);
  assert.deepEqual(readFileSync(walkerStatePath(dir)), before);

  // The fallback starts a fresh walk: the counter is back at 0.
  const fallback = await run(dir, [{ start: true, entry: 'business_parity_review' }]);
  assert.deepEqual(fallback, [architecture(0, 0)]);

  const handedOff = await fixture(t, { parity: false, qa: true });
  await run(handedOff, [...TO_UI_LOOP, { outcome: 'returned' }, { outcome: 'PASS' }]);
  const done = await walk(handedOff, ['current', ...flags()]);
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(done.action[1], ['binding', '<terminal_handoff>']);
});

test('(7) with no saved walk, a draft on disk is reviewed, never skipped or rewritten', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const draft = join(dir, stateDirOf(dir), 'story_plans', `${BRANCH}_story_plan.md`);
  await mkdir(dirname(draft), { recursive: true });
  await writeFile(draft, '# draft\n', 'utf8');

  // core: "exit 1 — no walk of this flow is saved for this branch".
  const current = await walk(dir, ['current', ...flags()]);
  assert.equal(current.status, 1);
  assert.equal(current.stdout, '');
  assert.match(current.stderr, /^flow-walker: [^\n]*\n$/);
  assert.ok(!existsSync(walkerStatePath(dir)), 'current wrote the walker state');

  // Override 2: "send the draft back through review — never rewrite it, never skip it"; setup:
  // "**review** gives the first gate of the loop whose draft no reviewer has passed".
  const actions = await run(dir, [
    { start: true, entry: 'business_parity_review' },
    { outcome: 'FAIL', review: ['architecture_reviews', 0] },
  ]);
  assert.deepEqual(actions, [architecture(0, 0), writer(1, findings('architecture_reviews', 0))]);
  assert.ok(!has(actions.slice(0, 1), 'node', 'plan_writer'), 'the fallback rewrote the draft');
  assert.ok(!has(actions, 'node', 'ui_writer'), 'the fallback skipped past the task-plan loop');
  assert.ok(!has(actions, 'prompt', 'initial'), 'the draft was rewritten from the initial prompt');

  const withParity = await fixture(t, { parity: true, qa: true });
  assert.deepEqual(await run(withParity, [{ start: true, entry: 'business_parity_review' }]), [parity(0, 0)]);

  const uiDraft = await fixture(t, { parity: false, qa: true });
  assert.deepEqual(await run(uiDraft, [{ start: true, entry: 'ui_review' }]), [uiReview(0, 0)]);
});

/*
 * The task prompt's `## Verification` list, and the case that covers each.
 *
 *   reviewer in flight ...................................... (1)
 *   pause after a FAIL ...................................... (2)
 *   UI reviewer in flight ................................... (4)
 *   parked <ask> ............................................ (5)
 *   finished walk ........................................... (6)
 *   no state, draft on disk ................................. (7)
 *   repeated ledger line .................................... (3)
 */
