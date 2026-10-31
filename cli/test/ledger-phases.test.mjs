/**
 * The flow-progress ledger's phases and the progress-comment switch — `hr_ledger_phases` and
 * `hr_progress_comments` in the generated run library.
 *
 * **The rule these tests exist to enforce: a phase is done only when every entry of its set is
 * `[x]` or `[-]`, and only a task or user-review ledger has phases.** Beside it,
 * `execution.progressComments` reads as on when `true` or absent, off when `false`, and
 * unresolvable when it is not a boolean. And for `hr_run_ledger_state`: **a run is finished only
 * when its own ledger says so, and an absent ledger is reported as absent, never as finished or
 * unfinished.**
 *
 * Each `hr_run_ledger_state` case below was run red once against a scratch copy of the written
 * library, never by editing the tracked template, under the mutation it names:
 * - the engine test dropped → the task-ledger-for-`user_review` case;
 * - the round test dropped → the stale-round case;
 * - the all-phases test dropped → the `D`-left-open case;
 * - the entry test anchored at column 0 → the indented-entry case;
 * - the open-box test dropped → the one-open-entry docs case;
 * - the no-entry test dropped → the entry-less checklist case;
 * - an absent file returned as `finished` → the no-file cases;
 * - a non-ledger file returned as `unfinished` → the non-ledger case.
 *
 * The library is sourced out of an `init`-wired fixture, as `cli/test/branch-naming.test.mjs`
 * does, so the copy under test is the one an adopter receives. Every ledger is written into the
 * fixture's own temp directory.
 */

import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli } from './helpers/fixture.mjs';

/** The library's path under the `scriptsDir` a configless `init` writes. */
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;

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

const BRANCH = 'some_branch';

let stateTrees = 0;
/** A fresh state directory under the fixture's temp directory, holding `files` (relative path → content). */
function stateTree(files = {}) {
  const root = join(dir, `state_${++stateTrees}`);
  mkdirSync(root, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content, 'utf8');
  }
  return root;
}

const runState = (root, engine) => libCall('hr_run_ledger_state "$1" "$2" "$3"', [root, BRANCH, engine]);

const TASK_LEDGER = `flow_progress/${BRANCH}_progress.md`;
const DOCS_CHECKLIST = `docs_catalog/${BRANCH}_docs.md`;
const finishedTask = () => ledger(TASK_HEADER, TASK_IDS, allExcept(TASK_IDS, []));
const finishedReview = (n) => ledger(reviewHeader(n), REVIEW_IDS, allExcept(REVIEW_IDS, []));

/** A docs checklist in the parse contract's shape: two entries plus the INDEX, continuation lines indented. */
function checklist(boxes, indent = ['', '', '']) {
  const slugs = ['first-feature', 'second-concept', 'index'];
  const lines = ['# Docs catalog — some_branch', ''];
  slugs.forEach((slug, i) => {
    lines.push(`${indent[i]}- [${boxes[i]}] \`${slug}\` · feature · docs/features/${slug}.md`);
    lines.push(`      title: ${slug}`);
    lines.push(`      entry: usecases: ${slug}`);
  });
  return `${lines.join('\n')}\n`;
}

test('hr_run_ledger_state', async (t) => {
  await t.test('a task ledger all [x] / [-] is finished', async () => {
    const marks = { ...allExcept(TASK_IDS, []), E: '-', 'A1.5g': '-' };
    const r = await runState(stateTree({ [TASK_LEDGER]: ledger(TASK_HEADER, TASK_IDS, marks) }), 'task');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'finished task - done done done done\n');
  });

  await t.test('an empty engine reads as task', async () => {
    const r = await runState(stateTree({ [TASK_LEDGER]: finishedTask() }), '');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^finished task /);
  });

  await t.test('a task ledger with D left open is unfinished, carrying the phases line', async () => {
    const r = await runState(stateTree({ [TASK_LEDGER]: ledger(TASK_HEADER, TASK_IDS, allExcept(TASK_IDS, ['D'])) }), 'task');
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stdout, 'unfinished task - done done done pending\n');
  });

  await t.test('no ledger is absent', async () => {
    const r = await runState(stateTree(), 'task');
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stdout, /^absent /);
  });

  await t.test('a file that is not a ledger is unreadable', async () => {
    const r = await runState(stateTree({ [TASK_LEDGER]: 'just some notes\n- [x] P1. looks like an entry\n' }), 'task');
    assert.equal(r.status, 3, r.stderr);
    assert.match(r.stdout, /^unreadable /);
  });

  await t.test('a finished task ledger read for user_review is unfinished', async () => {
    const r = await runState(stateTree({ [TASK_LEDGER]: finishedTask() }), 'user_review');
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stdout, 'unfinished ledger engine task, run engine user_review\n');
  });

  await t.test('a finished round-1 review ledger with a round-2 review file is unfinished', async () => {
    const root = stateTree({
      [TASK_LEDGER]: finishedReview(1),
      [`user_reviews/${BRANCH}_review.md`]: '# review\n',
      [`user_reviews/${BRANCH}_review_2.md`]: '# review 2\n',
    });
    const r = await runState(root, 'user_review');
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stdout, 'unfinished ledger round 1, active round 2\n');
  });

  await t.test('a finished round-1 review ledger with only the first review file is finished', async () => {
    const root = stateTree({ [TASK_LEDGER]: finishedReview(1), [`user_reviews/${BRANCH}_review.md`]: '# review\n' });
    const r = await runState(root, 'user_review');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'finished user_review 1 done done done done\n');
  });

  await t.test('a docs checklist all [x] is finished', async () => {
    const r = await runState(stateTree({ [DOCS_CHECKLIST]: checklist(['x', 'x', 'x']) }), 'docs');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'finished checklist 3/3\n');
  });

  await t.test('a docs checklist with one open entry is unfinished', async () => {
    const r = await runState(stateTree({ [DOCS_CHECKLIST]: checklist(['x', ' ', 'x']) }), 'docs');
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stdout, 'unfinished checklist 2/3\n');
  });

  await t.test('an open docs entry indented by two spaces is unfinished', async () => {
    const r = await runState(stateTree({ [DOCS_CHECKLIST]: checklist(['x', ' ', 'x'], ['', '  ', '']) }), 'docs');
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stdout, 'unfinished checklist 2/3\n');
  });

  await t.test('no docs checklist is absent', async () => {
    const r = await runState(stateTree(), 'docs');
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stdout, /^absent /);
  });

  await t.test('a docs checklist with no entry line is unreadable', async () => {
    const r = await runState(stateTree({ [DOCS_CHECKLIST]: '# Docs catalog — some_branch\n\nnothing listed yet\n' }), 'docs');
    assert.equal(r.status, 3, r.stderr);
    assert.match(r.stdout, /^unreadable /);
  });

  await t.test('an unknown engine is unreadable', async () => {
    const r = await runState(stateTree({ [TASK_LEDGER]: finishedTask() }), 'nightly');
    assert.equal(r.status, 3, r.stderr);
    assert.equal(r.stdout, 'unreadable unknown engine nightly\n');
  });
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
