/**
 * The written watcher's park-loop guard, driven pass by pass against a fixture.
 *
 * **The rule these tests exist to enforce: a park-resume that makes no progress is bounded, the
 * bound is a distinct status an operator can clear, and a run that makes progress is never
 * caught.** Every window case sets `PARK_LOOP_WINDOW_SECS` to `0` or `3600`, so no case waits for
 * a window; the legacy case runs under the shipped defaults on purpose. The measured basis for
 * those defaults is `docs/watcher.md` §4 → **A resume that makes no progress is bounded.**
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { createWatcherFixture } from './helpers/watcher.mjs';

/** Writes an unanswered question at the lowest index with no question file in either location. */
const LOWEST_FREE_INDEX_STUB = [
  'k=1',
  'while [ -e "$CLAR/question_$k.md" ] || [ -e "$CLAR/answered/question_$k.md" ]; do k=$((k + 1)); done',
  'printf "## Q%s\\n" "$k" > "$CLAR/question_$k.md"',
].join('\n');

/** Writes an unanswered question one index above every existing question, in either location. */
const NEXT_INDEX_STUB = [
  'max=0',
  'for q in "$CLAR"/question_*.md "$CLAR"/answered/question_*.md; do',
  '  [ -e "$q" ] || continue',
  '  n="${q##*/}"; n="${n#question_}"; n="${n%.md}"',
  '  if [ "$n" -gt "$max" ]; then max="$n"; fi',
  'done',
  'k=$((max + 1))',
  'printf "## Q%s\\n" "$k" > "$CLAR/question_$k.md"',
].join('\n');

/** Pairs for these indexes, as `topLevel()` / `archived()` list them. */
function pairs(...indexes) {
  return indexes.flatMap((n) => [`answer_${n}.md`, `question_${n}.md`]).sort();
}

/** The single top-level question with no answer, as its index. */
async function openQuestion(w) {
  const names = await w.topLevel();
  const open = names
    .filter((name) => /^question_\d+\.md$/.test(name))
    .map((name) => Number(name.slice('question_'.length, -'.md'.length)))
    .filter((n) => !names.includes(`answer_${n}.md`));
  assert.equal(open.length, 1, `expected one open question, found ${JSON.stringify(names)}`);
  return open[0];
}

async function answerOpenQuestion(w) {
  const n = await openQuestion(w);
  await w.writeAnswer(n, `a${n}\n`);
}

const events = (w) => w.notifications().map((n) => n.event);

test('forced no progress trips the guard, and PARK_LOOP_CLEAR releases it', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;
  const env = { PARK_LOOP_WINDOW_SECS: '0' };

  await t.test('index detector: two resumes that raise nothing above index 5 become park_loop', async () => {
    await w.writeQuestion(5, '## Q5\n');
    await w.writeAnswer(5, 'a5\n');
    await w.seedRecord();
    await w.setStub(LOWEST_FREE_INDEX_STUB);

    await w.tick(env);
    assert.equal(w.record().status, 'parked', w.watcherLog());
    assert.equal(w.record().park_loop_cycles, '1');

    await answerOpenQuestion(w);
    const before = w.notifications().length;
    await w.tick(env);

    assert.equal(w.prompts().length, 2, w.watcherLog());
    assert.equal(w.record().status, 'park_loop', w.watcherLog());
    assert.equal(w.record().park_loop_cycles, '2');
    assert.deepEqual(events(w).slice(before), ['resumed', 'park_loop']);
    assert.equal(events(w).filter((e) => e === 'park_loop').length, 1);
    const log = w.watcherLog();
    assert.match(log, /made no progress \(cycle 1\/2/);
    assert.match(log, /made no progress \(cycle 2\/2/);
    assert.match(log, /park loop — 2 consecutive resumes made no progress/);

    await answerOpenQuestion(w);
    const notificationsBefore = w.notifications().length;
    await w.tick(env);
    assert.equal(w.prompts().length, 2, `a held run was resumed:\n${w.watcherLog()}`);
    assert.equal(w.notifications().length, notificationsBefore);
    assert.equal(w.record().status, 'park_loop');
  });

  await t.test('the clear action: the sentinel is spent and the run resumes in the same pass', async () => {
    const clearFile = join(w.clarDir, 'PARK_LOOP_CLEAR');
    await writeFile(clearFile, '', 'utf8');
    await w.setStub(':');
    await w.tick(env);

    assert.equal(existsSync(clearFile), false);
    assert.match(w.watcherLog(), new RegExp(`park loop cleared for '${w.branch}' \\(PARK_LOOP_CLEAR found\\)`));
    assert.equal(w.prompts().length, 3, w.watcherLog());
    assert.equal(w.record().status, 'completed', w.watcherLog());
    assert.equal(w.record().park_loop_cycles, '0');
  });
});

test('window detector: progress by index, but re-parked instantly, is caught', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;
  const env = { PARK_LOOP_WINDOW_SECS: '3600' };

  await w.writeQuestion(1, '## Q1\n');
  await w.writeAnswer(1, 'a1\n');
  await w.seedRecord();
  await w.setStub(NEXT_INDEX_STUB);

  await w.tick(env);
  assert.equal(w.record().status, 'parked', w.watcherLog());
  await answerOpenQuestion(w);
  await w.tick(env);

  assert.equal(w.record().status, 'park_loop', w.watcherLog());
  assert.equal(w.record().park_loop_cycles, '2');
  assert.match(w.watcherLog(), /cycle 2\/2: re-parked after \d+s, inside PARK_LOOP_WINDOW_SECS=3600\)/);
  assert.equal(events(w).filter((e) => e === 'park_loop').length, 1);
});

test('a real multi-park is never caught', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;
  const env = { PARK_LOOP_WINDOW_SECS: '0' };

  await w.writeQuestion(1, '## Q1\n');
  await w.writeAnswer(1, 'a1\n');
  await w.seedRecord();
  await w.setStub(NEXT_INDEX_STUB);

  for (let round = 1; round <= 3; round += 1) {
    if (round > 1) await answerOpenQuestion(w);
    await w.tick(env);
    assert.equal(w.prompts().length, round, w.watcherLog());
    assert.equal(w.record().status, 'parked', `round ${round}:\n${w.watcherLog()}`);
    assert.equal(w.record().park_loop_cycles, '0', `round ${round}`);
  }
  assert.equal(events(w).includes('park_loop'), false);
  assert.doesNotMatch(w.watcherLog(), /made no progress/);
});

test('a legacy in-flight park spends at most one cycle, and a pause-resume is not counted', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  await w.writeQuestion(1, '## Q1\n');
  await w.writeAnswer(1, 'a1\n');
  await mkdir(join(w.clarDir, 'answered'), { recursive: true });
  for (const name of pairs(1)) await rename(join(w.clarDir, name), join(w.clarDir, 'answered', name));
  for (const n of [2, 3]) {
    await w.writeQuestion(n, `## Q${n}\n`);
    await w.writeAnswer(n, `a${n}\n`);
  }
  await w.writeQuestion(4, '## Q4\n');
  await w.writeAnswer(4, 'a4\n');
  await w.seedRecord({ resumed_for_index: '' });
  await w.setStub('printf "## Q5\\n" > "$CLAR/question_5.md"');

  // Shipped defaults: no PARK_LOOP_* variable is passed, and the log line below names both values.
  await w.tick();
  assert.equal(w.prompts().length, 1, w.watcherLog());
  assert.equal(w.record().status, 'parked', w.watcherLog());
  assert.equal(w.record().park_loop_cycles, '1');
  assert.match(w.watcherLog(), /made no progress \(cycle 1\/2: re-parked after \d+s, inside PARK_LOOP_WINDOW_SECS=300\)/);
  assert.equal(events(w).includes('park_loop'), false);

  await w.writeAnswer(5, 'a5\n');
  await w.setStub(':');
  await w.tick();
  assert.equal(w.prompts().length, 2, w.watcherLog());
  assert.equal(w.record().status, 'completed', w.watcherLog());
  assert.equal(w.record().park_loop_cycles, '0');
  assert.equal(events(w).includes('park_loop'), false);

  await t.test('pause-resume: a parked exit leaves park_loop_cycles as it was', async () => {
    const stateDir = join(w.dir, 'sdlc-harness');
    await w.seedRecord({ status: 'paused', park_loop_cycles: '1', resume_max_question_index: '5' });
    await writeFile(join(stateDir, 'PAUSE_ACK'), '', 'utf8');
    await writeFile(join(stateDir, 'RESUME'), '', 'utf8');
    await w.setStub('printf "## Q3\\n" > "$CLAR/question_3.md"');
    const noProgressLines = w.watcherLog().match(/made no progress/g).length;

    await w.tick({ PARK_LOOP_WINDOW_SECS: '3600' });

    assert.equal(w.prompts().length, 3, w.watcherLog());
    assert.match(w.watcherLog(), new RegExp(`resuming paused run '${w.branch}'`));
    assert.equal(w.record().status, 'parked', w.watcherLog());
    assert.equal(w.record().park_loop_cycles, '1');
    assert.equal(w.watcherLog().match(/made no progress/g).length, noProgressLines);
  });
});
