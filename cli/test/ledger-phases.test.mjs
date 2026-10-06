/**
 * The flow-progress ledger's phases and the progress-comment switch — `hr_ledger_phases` and
 * `hr_progress_comments` in the generated run library.
 *
 * **The rule these tests exist to enforce: a phase is done only when every entry of its set is
 * `[x]` or `[-]`, and only a task or user-review ledger has phases.** Beside it,
 * `execution.progressComments` reads as on when `true` or absent, off when `false`, and
 * unresolvable when it is not a boolean.
 *
 * The library is sourced out of an `init`-wired fixture, as `cli/test/branch-naming.test.mjs`
 * does, so the copy under test is the one an adopter receives. Every ledger is written into the
 * fixture's own temp directory.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { createFixture, runBash, runCli } from './helpers/fixture.mjs';

/** The library's path under the default `scriptsDir`. */
const LIB_PATH = 'scripts/lib/harness-run-lib.sh';

const TASK_IDS = ['P1', 'P2', 'P3', 'A', 'A1.5g', 'A1.5f', 'A2g', 'A2f', 'Bg', 'Bm', 'C', 'C2g', 'C2m', 'C2f', 'E', 'G', 'D'];
const REVIEW_IDS = ['R1', 'R2', 'R3', 'R4', 'RG', 'R5'];

let fixture;
let dir = '';
let originalConfig = '';

before(async () => {
  fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
      'README.md': '# fixture project\n',
    },
  });
  dir = fixture.dir;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  originalConfig = readFileSync(join(dir, 'harness.config.json'), 'utf8');
});

after(async () => {
  if (fixture) await fixture.cleanup();
});

/** Source the written library, then run `script` with the remaining values as `$1`, `$2`, …. */
function libCall(script, args = []) {
  return runBash(dir, ['-c', `. "$1"; shift; ${script}`, '_', join(dir, LIB_PATH), ...args]);
}

/**
 * A ledger in the template's shape: `marks` maps an id to `x` or `-`; every other listed id is `[ ]`.
 * Ids in `omit` get no line at all.
 */
function ledger(header, ids, marks = {}, omit = []) {
  const lines = [header, '', '## Run mode', '- skipped: none', ''];
  for (const id of ids) {
    if (omit.includes(id)) continue;
    lines.push(`- [${marks[id] ?? ' '}] ${`${id}.`.padEnd(8)} label for ${id}`);
  }
  return `${lines.join('\n')}\n`;
}

const TASK_HEADER = '# Flow progress — feat/some_branch   (engine: task)';
const reviewHeader = (n) => `# Flow progress — fix_review_thing   (engine: user_review, round ${n})`;

let ledgers = 0;
async function phases(content) {
  const file = join(dir, `ledger_${++ledgers}.md`);
  writeFileSync(file, content, 'utf8');
  return libCall('hr_ledger_phases "$1"', [file]);
}

const allExcept = (ids, skip, mark = 'x') => Object.fromEntries(ids.filter((id) => !skip.includes(id)).map((id) => [id, mark]));

test('hr_ledger_phases reports a fresh task ledger as all pending', async () => {
  const r = await phases(ledger(TASK_HEADER, TASK_IDS));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'task - pending pending pending pending\n');
});

test('hr_ledger_phases settles a phase on [x] and [-] alike', async () => {
  const r = await phases(ledger(TASK_HEADER, TASK_IDS, { P1: 'x', P2: '-', P3: 'x' }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'task - done pending pending pending\n');
});

test('hr_ledger_phases leaves phase 4 pending until D is settled', async () => {
  const marks = { ...allExcept(TASK_IDS, ['D']), E: '-', 'A1.5g': '-', 'A1.5f': '-' };
  const r = await phases(ledger(TASK_HEADER, TASK_IDS, marks));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'task - done done done pending\n');
});

test('hr_ledger_phases reads the user-review engine and its round', async () => {
  const r = await phases(ledger(reviewHeader(3), REVIEW_IDS, { R1: 'x', R2: 'x', R3: 'x' }));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'user_review 3 done done pending pending\n');
});

test('hr_ledger_phases counts a missing entry as not settled', async () => {
  const r = await phases(ledger(TASK_HEADER, TASK_IDS, allExcept(TASK_IDS, ['G', 'D']), ['G']));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'task - done done pending pending\n');
});

test('hr_ledger_phases refuses a docs-engine ledger and a non-ledger file', async () => {
  for (const content of [
    ledger('# Flow progress — some_branch   (engine: docs)', TASK_IDS, allExcept(TASK_IDS, [])),
    'just some notes\n- [x] P1. looks like an entry\n',
    '',
  ]) {
    const r = await phases(content);
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
    assert.equal(r.stderr, '');
  }
});

test('hr_ledger_phases refuses a missing file', async () => {
  const r = await libCall('hr_ledger_phases "$1"', [join(dir, 'no_such_ledger.md')]);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
});

test('hr_progress_comments answers through its status alone', async (t) => {
  const cases = [
    { name: 'absent', value: undefined, status: 0 },
    { name: 'true', value: true, status: 0 },
    { name: 'false', value: false, status: 1 },
    { name: '"no"', value: 'no', status: 2 },
  ];
  for (const { name, value, status } of cases) {
    await t.test(name, async () => {
      const config = JSON.parse(originalConfig);
      if (value === undefined) {
        if (config.execution) delete config.execution.progressComments;
      } else {
        config.execution = { ...(config.execution ?? {}), progressComments: value };
      }
      writeFileSync(join(dir, 'harness.config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
      const r = await libCall('hr_progress_comments "$1"', [dir]);
      assert.equal(r.status, status);
      assert.equal(r.stdout, '');
    });
  }
});
