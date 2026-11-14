/**
 * The flow walker `init` writes, driven across a session boundary: what `current` re-prints for each
 * saved state, what `next` continues it into, and what the ledger's fallback `start --entry …` gives.
 *
 * **The rule these tests exist to enforce: a planning (re-)entry that continues a saved walk carries
 * the loop counter and the open round's recorded findings, along with the prompt variant and the
 * revision's findings files, and `current` re-prints a set in flight with only its gates whose
 * outcome is not recorded; a `start` — the ledger's fallback when no walk is pending — begins the
 * counter at 0 and continues the round numbering from the round files, dispatching only the gates
 * whose file is missing where the present files' evidence is consistent and the whole set
 * otherwise, and never reads convergence from them. Every expected action is a literal written
 * here, citing the rule by heading and quoted substring, never read out of the graph.**
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
 * that file's `## Setup (once per session)` step 5; *Override 2* and *Override 5* are
 * `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`
 * and `## Override 5 — pause/resume + flow-progress ledger (planning half)`; *§1.6* is
 * `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct
 * `commit-on-branch.sh`, NEVER a committer dispatch`; *walker STATE*, *walker ROUNDS* and *walker
 * OUTPUT* are those paragraphs of the header of `cli/templates/scripts/flow-walker.sh`.
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

/** The files round `n` records with `phases.parity` on, in gate order. */
const roundFilesWithParity = (n) => [findings('business_parity_reviews', n), ...roundFiles(n)];

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

/** A round gate's block: `arg.iteration` is the round number, `arg.review_mode` follows the counter. */
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
const planReview = gate('plan_review', 'task-plan-reviewer', PLAN_WRITE_HB, 'task-plan-reviewer');

/**
 * Round `n`'s whole set at counter `i`, as one printed action — walker OUTPUT, `set`: "one dispatch
 * block per due gate, in `gates` order, back to back; the passed-through skip: / round: / ledger:
 * lines in the first block only". With `phases.parity` off the parity gate's skip line is passed
 * through; with it on, the set opens at the parity gate and passes nothing through.
 */
function set(n, i, { withParity = false } = {}) {
  return withParity
    ? [...parity(n, i), ...architecture(n, i), ...planReview(n, i)]
    : [...architecture(n, i, { passed: PARITY_SKIPPED }), ...planReview(n, i)];
}

/** walker OUTPUT, `wait`: "action: wait / node: <round> / recorded: <gate> <outcome> / pending: <gate> per gate still out, in `gates` order". */
function wait(recorded, pending) {
  return [
    ['action', 'wait'],
    ['node', 'plan_round'],
    ['recorded', recorded],
    ...pending.map((name) => ['pending', name]),
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

/** Round `n`'s set with the parity gate skipped, recorded in gate order, each verdict planting its round file first. */
const gates = (n, { architecture: a = 'PASS', plan = 'PASS' } = {}) => [
  { node: 'architecture_review', outcome: a, review: ['architecture_reviews', n] },
  { node: 'plan_review', outcome: plan, review: ['task_plan_reviews', n] },
];

const RETURNED = { outcome: 'returned' };
const TO_UI_LOOP = [{ start: true }, RETURNED, ...gates(0)];
const REVIEW_ENTRY = { start: true, entry: 'plan_round' };

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

/** A gate's round-`n` file, repo-relative. */
const roundFile = (dir, folder, n) => `${stateDirOf(dir)}/${folder}/${BRANCH}/review_${n}.md`;

async function writeRelative(dir, relative, body) {
  await mkdir(join(dir, dirname(relative)), { recursive: true });
  await writeFile(join(dir, relative), body, 'utf8');
}

/** Commit exactly `paths` in the fixture, hooks skipped: what is committed is the case's subject. */
async function commit(dir, paths, message) {
  await runGit(dir, ['add', '--', ...paths]);
  await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', message]);
}

/** A git fixture on `BRANCH` whose story index is committed: the plan the round files postdate. */
async function committedPlanFixture(t, phases) {
  const dir = await fixture(t, phases);
  await runGit(dir, ['checkout', '-q', '-b', BRANCH]);
  await writeRelative(dir, storyIndex(dir), '# draft\n');
  await commit(dir, [storyIndex(dir)], 'fixture: story index');
  return dir;
}

const FAIL_BODY = `# review 3\nverdict: FAIL\nreview_mode: full\n`;
const PASS_BODY = `# review 3\nverdict: PASS\nreview_mode: full\n`;

/**
 * A committed-plan fixture whose round 3 is part-recorded: each `[folder, body]` of `files` is
 * written as that gate's `review_3.md` and committed after the story index, and every other gate's
 * round-3 file is missing.
 */
async function midRoundFixture(t, { parity: parityOn = false, files = [['architecture_reviews', FAIL_BODY]] } = {}) {
  const dir = await committedPlanFixture(t, { parity: parityOn, qa: true });
  const paths = [];
  for (const [folder, body] of files) {
    const path = roundFile(dir, folder, 3);
    await writeRelative(dir, path, body);
    paths.push(path);
  }
  await commit(dir, paths, 'fixture: round 3, part-recorded');
  return dir;
}

test('(1) a set in flight is re-printed with only its unrecorded gates, and the counter and the round\'s recorded findings carry on', { skip: SKIP }, async (t) => {
  const dir = await fixture(t, { parity: false, qa: true });
  const actions = await run(dir, [
    { start: true },
    RETURNED,
    ...gates(0, { architecture: 'FAIL', plan: 'FAIL' }),
    RETURNED,
    { node: 'architecture_review', outcome: 'PASS', review: ['architecture_reviews', 1] },
  ]);
  assert.deepEqual(actions.at(-2), set(1, 1));
  assert.deepEqual(actions.at(-1), wait('architecture_review PASS', ['plan_review']));

  // walker STATE: `current` re-prints "while a set is pending, the blocks of the gates with no
  // recorded outcome, the first carrying the fan-out's passed-through lines".
  await assertCurrentUnchanged(dir, planReview(1, 1, { passed: PARITY_SKIPPED }));

  const resumed = await run(dir, [{ node: 'plan_review', outcome: 'FAIL', review: ['task_plan_reviews', 1] }, RETURNED]);
  // core: "Issue no `start`" — the counter carries on (iter 2, not 0), and round 1 closes with the
  // architecture file recorded before the boundary beside the plan-review file fed after it, in
  // `gates` order.
  assert.deepEqual(resumed, [writer(2, roundFiles(1), { passed: [closed(1, 'FAIL')] }), set(2, 2)]);
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
  const refused = await walk(dir, ['next', ...flags('--node', 'plan_review', '--outcome', 'PASS', '--skipped', 'none')]);
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
    // "**review** (send the existing draft back through its loop's gates, neither rewritten nor
    // skipped)"; walker STATE: "no round file opens round 0's whole set".
    const actions = await run(dir, [REVIEW_ENTRY, ...gates(0, { architecture: 'FAIL' })]);
    assert.deepEqual(
      actions,
      [set(0, 0), wait('architecture_review FAIL', ['plan_review']), writer(1, roundFiles(0), { passed: [closed(0, 'FAIL')] })],
      label,
    );
    assert.ok(!has(actions.slice(0, 1), 'node', 'plan_writer'), `${label}: the fallback rewrote the draft`);
    assert.ok(!has(actions, 'node', 'ui_writer'), `${label}: the fallback skipped past the task-plan loop`);
    assert.ok(!has(actions, 'prompt', 'initial'), `${label}: the draft was rewritten from the initial prompt`);
    // Override 2(b): "a story index that exists and looks complete is never enough".
    assert.ok(!has(actions, 'ledger', 'P1'), `${label}: a draft on disk was treated as converged`);
  }

  const withParity = await fixture(t, { parity: true, qa: true });
  assert.deepEqual(await run(withParity, [REVIEW_ENTRY]), [set(0, 0, { withParity: true })]);

  const uiDraft = await fixture(t, { parity: false, qa: true });
  assert.deepEqual(await run(uiDraft, [{ start: true, entry: 'ui_review' }]), [uiReview(0, 0)]);
});

test('(8) with the saved walk deleted and two of three round files committed, start dispatches only the third gate at counter 0', { skip: SKIP }, async (t) => {
  const dir = await midRoundFixture(t, {
    parity: true,
    files: [
      ['business_parity_reviews', PASS_BODY],
      ['architecture_reviews', FAIL_BODY],
    ],
  });
  await run(dir, [{ start: true }]);
  rmSync(walkerStatePath(dir));
  await assertNoSavedWalk(dir);

  // walker STATE: "a round with files missing whose evidence is consistent — no present gate reads
  // `unreadable`, and `plan:` is `not-newer` — records the present gates' verdicts and files and
  // opens the set with only the gates whose file is `missing`" — and "every `start` sets every
  // counter to 0".
  const resumed = await run(dir, [REVIEW_ENTRY]);
  assert.deepEqual(resumed, [planReview(3, 0)]);

  // The two verdicts read off disk are the round's recorded evidence: the revision carries them
  // beside the plan-review file fed now, in `gates` order, and the counter's first increment is iter 1.
  const closedRound = await run(dir, [{ node: 'plan_review', outcome: 'PASS', review: ['task_plan_reviews', 3] }]);
  assert.deepEqual(closedRound, [writer(1, roundFilesWithParity(3), { round: 4, passed: [closed(3, 'FAIL')] })]);
});

test('(9) inconsistent round evidence dispatches the whole set, and each gate replaces its file', { skip: SKIP }, async (t) => {
  // (a) The committed architecture file carries no verdict line: it reads `unreadable`.
  const noVerdict = await midRoundFixture(t, { files: [['architecture_reviews', '# review 3\nreview_mode: full\n']] });
  // (b) A commit touches the story index after the round's earliest file's commit.
  const planNewer = await midRoundFixture(t);
  await writeRelative(planNewer, storyIndex(planNewer), '# draft, revised\n');
  await commit(planNewer, [storyIndex(planNewer)], 'fixture: story index revised');

  for (const [label, dir] of [['no verdict line', noVerdict], ['plan newer', planNewer]]) {
    // walker STATE: "any other incomplete round opens the whole set at that round".
    assert.deepEqual(await run(dir, [REVIEW_ENTRY]), [set(3, 0)], label);

    // Each gate writes its own round-3 file over whatever stood there, and the round closes on the
    // verdicts fed now.
    const joined = await run(dir, gates(3, { plan: 'FAIL' }));
    assert.deepEqual(
      joined,
      [wait('architecture_review PASS', ['plan_review']), writer(1, roundFiles(3), { round: 4, passed: [closed(3, 'FAIL')] })],
      label,
    );
    assert.match(readFileSync(join(dir, roundFile(dir, 'architecture_reviews', 3)), 'utf8'), /^verdict: PASS$/m, label);
  }
});

test('(10) convergence is never read from round files: a complete round is reviewed or moved past', { skip: SKIP }, async (t) => {
  // walker STATE: "A complete all-PASS round is reviewed again: convergence is never inferred from
  // files" — only the ledger's P1 records it.
  const allPass = await fixture(t, { parity: false, qa: true });
  await plantReview(allPass, `architecture_reviews/${BRANCH}`, 3, 'PASS');
  await plantReview(allPass, `task_plan_reviews/${BRANCH}`, 3, 'PASS');
  const reviewed = await run(allPass, [REVIEW_ENTRY]);
  assert.deepEqual(reviewed, [set(3, 0)]);
  assert.ok(!has(reviewed, 'ledger', 'P1'), 'a round of PASS files was treated as converged');
  assert.ok(!has(reviewed, 'node', 'ui_writer'), 'a round of PASS files skipped the task-plan loop');

  // walker STATE: "a FAIL with the next revision note on disk opens the next round's whole set".
  const noted = await fixture(t, { parity: false, qa: true });
  await plantReview(noted, `architecture_reviews/${BRANCH}`, 3, 'FAIL');
  await plantReview(noted, `task_plan_reviews/${BRANCH}`, 3, 'PASS');
  await writeRelative(noted, `${stateDirOf(noted)}/plan_revisions/${BRANCH}/task_plan_revision_4.md`, '# revision 4\n');
  assert.deepEqual(await run(noted, [REVIEW_ENTRY]), [set(4, 0)]);
});

test('(11) a partial return: one gate\'s error escalates after the set, and a start dispatches only the missing gate', { skip: SKIP }, async (t) => {
  const dir = await committedPlanFixture(t, { parity: true, qa: true });
  const actions = await run(dir, [
    { start: true },
    RETURNED,
    { node: 'architecture_review', outcome: 'error' },
    { node: 'business_parity_review', outcome: 'PASS', review: ['business_parity_reviews', 0] },
    { node: 'plan_review', outcome: 'PASS', review: ['task_plan_reviews', 0] },
  ]);

  assert.deepEqual(actions.slice(1), [
    set(0, 0, { withParity: true }),
    // walker ROUNDS: an `error` is "HELD, not routed when recorded" — the set still waits.
    wait('architecture_review error', ['business_parity_review', 'plan_review']),
    wait('business_parity_review PASS', ['plan_review']),
    // walker OUTPUT, `binding`: "at a join with a held outcome, node: and agent: are the first held
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

  // The two verdicts' files are committed, as an autonomous run commits each round; the walk is
  // finished, so the re-entry is the ledger's fallback.
  await commit(dir, [roundFile(dir, 'business_parity_reviews', 0), roundFile(dir, 'task_plan_reviews', 0)], 'fixture: round 0, two verdicts');

  // walker STATE: the consistent part-recorded round "opens the set with only the gates whose file
  // is `missing`" — the gate that errored, at that round.
  assert.deepEqual(await run(dir, [REVIEW_ENTRY]), [architecture(0, 0)]);
});

test('(12) a pause honoured at the join resumes at the writer revision on a FAIL round and at the UI-test writer on a PASS round', { skip: SKIP }, async (t) => {
  const toRound1 = [{ start: true }, RETURNED, ...gates(0, { plan: 'FAIL' }), RETURNED];

  // FAIL: the join queued the revision; the pause between sessions changes nothing it printed.
  const failed = await fixture(t, { parity: false, qa: true });
  const failRound = await run(failed, [...toRound1, ...gates(1, { architecture: 'FAIL' })]);
  const revision = writer(2, roundFiles(1), { passed: [closed(1, 'FAIL')] });
  assert.deepEqual(failRound.at(-1), revision);
  // core: "`action: dispatch` — a dispatch was pending when the last session ended".
  await assertCurrentUnchanged(failed, revision);
  assert.deepEqual(await run(failed, [RETURNED]), [set(2, 2)]);

  // PASS: the join moved the walk into the UI-test loop and printed the ledger line.
  const passed = await fixture(t, { parity: false, qa: true });
  const passRound = await run(passed, [...toRound1, ...gates(1)]);
  const atUiLoop = uiWriter(0, undefined, [closed(1, 'PASS'), ['ledger', 'P1']]);
  assert.deepEqual(passRound.at(-1), atUiLoop);
  await assertCurrentUnchanged(passed, atUiLoop);
  assert.deepEqual(await run(passed, [RETURNED]), [uiReview(0, 0)]);
});

/*
 * The task prompt's `## Tests` bullets this suite answers, and the case that covers each.
 *
 *   Walker / graph — continuing a saved walk mid-round re-prints the set's unrecorded
 *     gates and keeps the round's recorded findings .......................... (1)
 *   Planning pause — resuming continues at the interrupted dispatch with the
 *     round's findings intact ................................................. (1), (2), (12)
 *   Mid-round resume — the saved walk deleted, only the missing gate dispatched,
 *     the counter at 0 ........................................................ (8)
 *   Mid-round resume — inconsistent evidence dispatches the whole set ......... (9)
 *   Partial return — a held error escalates after the set, and a start
 *     dispatches only the missing gate ........................................ (11)
 *   Convergence from the ledger — a committed but unconverged plan is reviewed,
 *     never treated as converged .............................................. (7), (10), (6)
 *
 * The cases the suite carried before round routing, kept: UI reviewer in flight (4), parked <ask>
 * (5), finished walk (6), repeated ledger line (3).
 */
