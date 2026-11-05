/**
 * The written watcher's zero-exit classification over the run's own ledger — `classify_run_exit`
 * in `autonomous-watcher.sh`, reading `hr_run_ledger_state` — driven through a pause-resume launch:
 * a `paused` record, an empty `sdlc-harness/RESUME`, one `tick`; through a park resume for the
 * answer case; and, for the inputs no resume pass isolates (a first launch, a stall restart, an
 * earlier park), by calling `classify_run_exit` in a shell that sourced the installed watcher.
 *
 * **The rule this suite enforces: a zero exit is `completed` only over a finished ledger; over an
 * unfinished one it is `paused` with `pause_reason` `unfinished` and sends no `completed`
 * notification; an absent ledger keeps `completed` only on a first launch; after a resume, a stall
 * restart or an earlier park it is `paused` / `unfinished`; and a pause or a park outranks the
 * ledger.**
 *
 * The stub writes its ledger into its own working copy, so the file classified is the one the
 * session left behind.
 *
 * Each case was run red once against the fixture's installed copy of the watcher, never the tracked
 * template, under the mutation it names:
 * - the reader's result ignored (always `completed`) → `task, unfinished`, `user_review, stale
 *   round` and `docs, one open entry` fail, and `hygiene` with them;
 * - the resume signal ignored → the resumed cases fail;
 * - `absent` always treated as `unfinished` → the first-launch cases fail;
 * - the ledger check moved above the `PAUSE_ACK` arm → both `order` cases fail, and `task,
 *   unfinished` with them;
 * - the `pause_reason` clear removed from `begin_pause_resume` → `hygiene` fails;
 * - `spawn_engine`'s `pause_note_stale` read kept job-mode only → `note, unfinished` fails;
 * - the `pause_note_stale` clear dropped from the local `PAUSE_ACK` arm → `note, real pause` fails.
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runBash } from './helpers/fixture.mjs';
import { createWatcherFixture, TICK_TIMEOUT_MS } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const RESUME_COMMAND = '/autonomous-sdlc-harness:branch-resume feat_x';

const TASK_IDS = ['P1', 'P2', 'P3', 'A', 'A1.5g', 'A1.5f', 'A2g', 'A2f', 'Bg', 'Bm', 'C', 'C2g', 'C2m', 'C2f', 'E', 'G', 'D'];
const REVIEW_IDS = ['R1', 'R2', 'R3', 'R4', 'RG', 'R5'];

/** A shell single-quoted literal, so a fixture path is one word whatever it contains. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/** A ledger in the template's shape: `marks` maps an id to `x` or `-`; every other id is `[ ]`. */
function ledger(header, ids, marks = {}) {
  const lines = [header, '', '## Run mode', '- skipped: none', ''];
  for (const id of ids) lines.push(`- [${marks[id] ?? ' '}] ${`${id}.`.padEnd(8)} label for ${id}`);
  return `${lines.join('\n')}\n`;
}

const allMarked = (ids) => Object.fromEntries(ids.map((id) => [id, 'x']));
const taskLedger = (marks) => ledger('# Flow progress — feat_x   (engine: task)', TASK_IDS, marks);
const reviewLedger = (round, marks) =>
  ledger(`# Flow progress — feat_x   (engine: user_review, round ${round})`, REVIEW_IDS, marks);

function checklist(boxes) {
  const lines = ['# Docs catalog — feat_x', ''];
  ['first-feature', 'second-concept', 'index'].forEach((slug, i) => {
    lines.push(`- [${boxes[i]}] \`${slug}\` · feature · docs/features/${slug}.md`);
    lines.push(`      title: ${slug}`);
  });
  return `${lines.join('\n')}\n`;
}

const TASK_LEDGER = `${STATE_DIR}/flow_progress/feat_x_progress.md`;
const DOCS_CHECKLIST = `${STATE_DIR}/docs_catalog/feat_x_docs.md`;

let sources = 0;
/** A stub body copying `content` to `rel` inside the session's working copy. */
async function writesFile(f, rel, content) {
  const src = join(f.dir, 'watcher-test', `ledger_${++sources}.md`);
  await writeFile(src, content, 'utf8');
  const parent = rel.slice(0, rel.lastIndexOf('/'));
  return `mkdir -p ${shellQuote(parent)}\ncp ${shellQuote(src)} ${shellQuote(rel)}`;
}

/** Launch one session through the pause-resume pass, with `body` as the stub's body. */
async function resumeOnce(f, body, engine = 'task', seed = true) {
  if (seed) await f.seedRecord({ status: 'paused', engine });
  await mkdir(join(f.dir, STATE_DIR), { recursive: true });
  await writeFile(join(f.dir, STATE_DIR, 'RESUME'), '', 'utf8');
  await f.setStub(body);
  await f.tick();
}

const events = (f, event) => f.notifications().filter((n) => n.event === event);

function assertCompleted(f) {
  const log = f.watcherLog();
  assert.equal(f.record().status, 'completed', log);
  assert.equal(events(f, 'completed').length, 1, log);
  assert.equal(f.record().pause_reason ?? '', '', log);
}

function assertUnfinished(f) {
  const log = f.watcherLog();
  assert.equal(f.record().status, 'paused', log);
  assert.equal(f.record().pause_reason, 'unfinished', log);
  assert.deepEqual(events(f, 'completed'), [], log);
}

/** A pause-resumed session's ledger-less zero exit: `unfinished`, with its one `paused` notification. */
function assertResumedAbsent(f) {
  assertUnfinished(f);
  const paused = events(f, 'paused');
  assert.equal(paused.length, 1, f.watcherLog());
  assert.ok(paused[0].detail.includes(RESUME_COMMAND), paused[0].detail);
  assert.doesNotMatch(paused[0].detail, /continue from the ledger/, paused[0].detail);
  assert.match(f.watcherLog(), /'feat_x' has no readable ledger \(absent: .*\) after a pause resume — not classifying it completed/);
}

/**
 * Seed a `running` record carrying `fields`, write no ledger, and call `classify_run_exit` for a
 * zero exit in one shell that sourced the installed watcher, as `tick` does.
 */
async function classifyDirect(f, fields) {
  await f.seedRecord({ status: 'running', ...fields });
  const script = `. "$1" status >/dev/null\nclassify_run_exit feat_x ${shellQuote(f.dir)} ${shellQuote(f.record().log_path)} 0`;
  const result = await runBash(f.dir, ['-c', script, '_', f.watcherPath], f.watcherEnv(), { timeoutMs: TICK_TIMEOUT_MS });
  assert.equal(result.status, 0, `classify_run_exit exited ${result.status}\n${result.stdout}\n${result.stderr}`);
}

test('task, finished: a settled ledger is completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({ ...allMarked(TASK_IDS), E: '-' })));

  assertCompleted(f);
});

test('task, unfinished: an open ledger is paused unfinished, with one paused notification', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({})));

  assertUnfinished(f);
  const paused = events(f, 'paused');
  assert.equal(paused.length, 1, f.watcherLog());
  assert.ok(paused[0].detail.includes(RESUME_COMMAND), paused[0].detail);
  assert.match(f.watcherLog(), /run 'feat_x' paused \(unfinished\)/);
});

test('task, absent after a pause resume: paused unfinished, never completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, ':');

  assertResumedAbsent(f);
});

test('task, absent after an answer resume: paused unfinished, the pair archived', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  await f.seedRecord();
  await f.writeQuestion(1, 'q\n');
  await f.writeAnswer(1, 'a\n');
  await f.setStub(':');

  await f.tick();

  assertUnfinished(f);
  assert.match(f.watcherLog(), /'feat_x' has no readable ledger \(absent: .*\) after an answer resume — not classifying it completed/);
  assert.deepEqual(await f.archived(), ['answer_1.md', 'question_1.md']);
  assert.deepEqual(await f.topLevel(), []);
});

test('user_review, absent after a pause resume: paused unfinished, never completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, ':', 'user_review');

  assertResumedAbsent(f);
});

test('user_review, stale round: a finished round-1 ledger under a round-2 review is unfinished', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  await mkdir(join(f.dir, STATE_DIR, 'user_reviews'), { recursive: true });
  await writeFile(join(f.dir, STATE_DIR, 'user_reviews', 'feat_x_review.md'), '# review\n', 'utf8');
  await writeFile(join(f.dir, STATE_DIR, 'user_reviews', 'feat_x_review_2.md'), '# review 2\n', 'utf8');

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, reviewLedger(1, allMarked(REVIEW_IDS))), 'user_review');

  assertUnfinished(f);
});

test('user_review, current round: a finished round-1 ledger under the first review is completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  await mkdir(join(f.dir, STATE_DIR, 'user_reviews'), { recursive: true });
  await writeFile(join(f.dir, STATE_DIR, 'user_reviews', 'feat_x_review.md'), '# review\n', 'utf8');

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, reviewLedger(1, allMarked(REVIEW_IDS))), 'user_review');

  assertCompleted(f);
});

test('docs, finished: a checklist all [x] is completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, DOCS_CHECKLIST, checklist(['x', 'x', 'x'])), 'docs');

  assertCompleted(f);
});

test('docs, one open entry: the checklist is unfinished', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, DOCS_CHECKLIST, checklist(['x', ' ', 'x'])), 'docs');

  assertUnfinished(f);
});

test('docs, absent after a pause resume: paused unfinished, never completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, ':', 'docs');

  assertResumedAbsent(f);
});

test('task, absent on a first launch keeps completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await classifyDirect(f, { resume_kind: '', stall_restarts: '0' });

  assertCompleted(f);
  assert.match(f.watcherLog(), /'feat_x' has no readable ledger \(absent: .*\) — classifying on the exit code alone/);
});

test('docs, absent on a first launch keeps completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await classifyDirect(f, { engine: 'docs', resume_kind: '', stall_restarts: '0' });

  assertCompleted(f);
  assert.match(f.watcherLog(), /'feat_x' has no readable ledger \(absent: .*\) — classifying on the exit code alone/);
});

test('task, absent after a stall restart: paused unfinished', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await classifyDirect(f, { resume_kind: '', stall_restarts: '1' });

  assertUnfinished(f);
  assert.match(f.watcherLog(), /'feat_x' has no readable ledger \(absent: .*\) after a stall restart — not classifying it completed/);
});

test('task, absent after an earlier park: paused unfinished', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  await mkdir(join(f.clarDir, 'answered'), { recursive: true });
  await writeFile(join(f.clarDir, 'answered', 'question_1.md'), 'q\n', 'utf8');
  await writeFile(join(f.clarDir, 'answered', 'answer_1.md'), 'a\n', 'utf8');

  await classifyDirect(f, { resume_kind: '', stall_restarts: '0' });

  assertUnfinished(f);
  assert.match(f.watcherLog(), /'feat_x' has no readable ledger \(absent: .*\) after an earlier park — not classifying it completed/);
});

test('order, park: an unanswered question outranks an unfinished ledger', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const ledgerBody = await writesFile(f, TASK_LEDGER, taskLedger({}));

  await resumeOnce(f, `${ledgerBody}\nmkdir -p "$CLAR"\nprintf 'q\\n' > "$CLAR/question_1.md"`);

  assert.equal(f.record().status, 'parked', f.watcherLog());
  assert.equal(f.record().pause_reason ?? '', '', f.watcherLog());
  assert.deepEqual(events(f, 'completed'), []);
});

test('order, pause: PAUSE_ACK outranks an unfinished ledger', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const ledgerBody = await writesFile(f, TASK_LEDGER, taskLedger({}));

  await resumeOnce(f, `${ledgerBody}\n: > ${STATE_DIR}/PAUSE_ACK`);

  assert.equal(f.record().status, 'paused', f.watcherLog());
  assert.equal(f.record().pause_reason ?? '', '', f.watcherLog());
});

test('hygiene: resuming an unfinished pause to a finished ledger leaves no pause_reason', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({})));
  assertUnfinished(f);

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger(allMarked(TASK_IDS))), 'task', false);

  assertCompleted(f);
});

const NO_NOTE = /RESUME after the previous job was stopped or ended without pausing: there is no pause note/;

test('note, unfinished: a local resume after an unfinished exit names no pause note', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({})));
  assertUnfinished(f);
  assert.equal(f.record().pause_note_stale, '1', f.watcherLog());

  await resumeOnce(f, ':', 'task', false);

  const prompt = f.prompts().at(-1);
  assert.match(prompt, NO_NOTE);
  assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
});

test('note, real pause: a PAUSE_ACK after an unfinished exit restores the note-naming resume', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({})));
  assertUnfinished(f);

  await resumeOnce(f, `: > ${STATE_DIR}/PAUSE_ACK`, 'task', false);
  assert.equal(f.record().status, 'paused', f.watcherLog());
  assert.equal(f.record().pause_note_stale ?? '', '', f.watcherLog());

  await resumeOnce(f, ':', 'task', false);

  assert.match(f.prompts().at(-1), /RESUME from a PAUSE: read sdlc-harness\/PAUSE_PROGRESS\.md/);
});
