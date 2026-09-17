/**
 * The written watcher's resume of a parked run, driven pass by pass against a fixture.
 *
 * **The rule these tests exist to enforce: a park is resumed once, when every question in it has
 * its answer, and the exit of that session archives exactly the answers the resume named.** The
 * defect they replay: a park of three questions was resumed with one answer at a time while the
 * other answered pairs stayed at the top level, so each exit left pairs the engine had already read
 * behind to trigger the next resume — the run re-launched once per answered question, re-reading
 * answers it had consumed.
 *
 * Loop-guard behaviour is out of scope here: no case parks more than once without progress.
 */

import assert from 'node:assert/strict';
import { mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { createWatcherFixture } from './helpers/watcher.mjs';

/** Every `answer_<n>.md` a prompt names under the branch's clarification directory, as numbers. */
function answersNamed(prompt, branch) {
  const pattern = new RegExp(`clarifications/${branch}/answer_(\\d+)\\.md`, 'g');
  return [...prompt.matchAll(pattern)].map((match) => Number(match[1]));
}

/** Pairs for these indexes, as `topLevel()` / `archived()` list them. */
function pairs(...indexes) {
  return indexes.flatMap((n) => [`answer_${n}.md`, `question_${n}.md`]).sort();
}

/** A pass that must launch nothing: no prompt, no notification, the record still `parked`. */
async function assertNoLaunch(w, promptsBefore, notificationsBefore) {
  await w.tick();
  assert.equal(w.prompts().length, promptsBefore, `a session launched:\n${w.watcherLog()}`);
  assert.equal(w.notifications().length, notificationsBefore, 'a notification fired on a pass that launched nothing');
  assert.equal(w.record().status, 'parked');
}

test('the observed sequence: three questions answered in two steps, then a late fourth', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  for (const n of [1, 2, 3]) await w.writeQuestion(n, `## Q${n}\n`);
  await w.seedRecord();
  await w.writeAnswer(1, 'a1\n');
  await w.writeAnswer(2, 'a2\n');

  await assertNoLaunch(w, 0, 0);

  await w.writeAnswer(3, 'a3\n');
  await w.setStub('printf "## Q4\\n" > "$CLAR/question_4.md"');
  await w.tick();

  assert.equal(w.prompts().length, 1, `expected one resume:\n${w.watcherLog()}`);
  assert.deepEqual(answersNamed(w.prompts()[0], w.branch), [1, 2, 3]);
  assert.deepEqual(await w.archived(), pairs(1, 2, 3));
  assert.deepEqual(await w.topLevel(), ['question_4.md']);
  assert.equal(w.record().resumed_for_index, '');
  assert.equal(w.record().status, 'parked');
  assert.deepEqual(
    w.notifications().map((n) => n.event),
    ['resumed', 'parked'],
  );

  await assertNoLaunch(w, 1, 2);

  await w.writeAnswer(4, 'a4\n');
  await w.setStub(':');
  await w.tick();

  assert.equal(w.prompts().length, 2, `expected exactly one more resume:\n${w.watcherLog()}`);
  assert.deepEqual(answersNamed(w.prompts()[1], w.branch), [4]);
});

test('one file per park: a single question file carrying several questions resumes once', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  await w.writeQuestion(1, '## Q1\nfirst\n\n## Q2\nsecond\n\n## Q3\nthird\n');
  await w.seedRecord();
  await w.writeAnswer(1, '## Q1\nyes\n\n## Q2\nno\n\n## Q3\nlater\n');
  await w.tick();

  assert.equal(w.prompts().length, 1, `expected one resume:\n${w.watcherLog()}`);
  assert.deepEqual(answersNamed(w.prompts()[0], w.branch), [1]);
  assert.deepEqual(await w.archived(), pairs(1));
  assert.deepEqual(await w.topLevel(), []);
});

test('an answer written during the resumed session is left for the next resume', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  await w.writeQuestion(1, '## Q1\n');
  await w.writeAnswer(1, 'a1\n');
  await w.seedRecord();
  await w.setStub('printf "## Q2\\n" > "$CLAR/question_2.md"; printf "a2\\n" > "$CLAR/answer_2.md"');
  await w.tick();

  assert.equal(w.prompts().length, 1, `expected one resume:\n${w.watcherLog()}`);
  assert.deepEqual(await w.archived(), pairs(1));
  assert.deepEqual(await w.topLevel(), pairs(2));
  assert.equal(w.record().status, 'parked');

  await w.setStub(':');
  await w.tick();

  assert.equal(w.prompts().length, 2, `expected the pending pair to resume:\n${w.watcherLog()}`);
  assert.deepEqual(answersNamed(w.prompts()[1], w.branch), [2]);
});

test('a question that appears after the park holds the resume back until it is answered', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  await w.writeQuestion(1, '## Q1\n');
  await w.seedRecord();
  await w.writeQuestion(2, '## Q2\n');
  await w.writeAnswer(1, 'a1\n');

  await assertNoLaunch(w, 0, 0);

  await w.writeAnswer(2, 'a2\n');
  await w.tick();

  assert.equal(w.prompts().length, 1, `expected one resume:\n${w.watcherLog()}`);
  assert.deepEqual(answersNamed(w.prompts()[0], w.branch), [1, 2]);
});

test('a run parked under the old layout, partly archived, resumes once for everything left', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  await w.writeQuestion(1, '## Q1\n');
  await w.writeAnswer(1, 'a1\n');
  // Pair 1 archived by an earlier exit; pairs 2 and 3 read by an earlier session but never archived.
  await mkdir(join(w.clarDir, 'answered'), { recursive: true });
  for (const name of pairs(1)) await rename(join(w.clarDir, name), join(w.clarDir, 'answered', name));
  for (const n of [2, 3]) {
    await w.writeQuestion(n, `## Q${n}\n`);
    await w.writeAnswer(n, `a${n}\n`);
  }
  await w.writeQuestion(4, '## Q4\n');
  await w.seedRecord({ resumed_for_index: '' });

  await assertNoLaunch(w, 0, 0);

  await w.writeAnswer(4, 'a4\n');
  await w.tick();

  assert.equal(w.prompts().length, 1, `expected exactly one resume:\n${w.watcherLog()}`);
  assert.deepEqual(answersNamed(w.prompts()[0], w.branch), [2, 3, 4]);
  assert.deepEqual(await w.archived(), pairs(1, 2, 3, 4));
  assert.deepEqual(await w.topLevel(), []);
  assert.equal(w.record().status, 'completed');
});
