/**
 * The per-file timing reporter, `scripts/lib/test-timing-reporter.mjs`.
 *
 * **The rule this suite enforces: every reported test file appears exactly once, with its result,
 * its top-level test and failure counts and its summed top-level duration, under a relative path,
 * rows sorted slowest first, and the record ends `end`; a file that loaded with no test of its own
 * reads `tests 0`.** Two cases run a real `node --test` in a throwaway directory under `os.tmpdir()`
 * with `tap` to stdout and the reporter to a file, and read both; the others drive the reporter's
 * generator with hand-built events. The second real run pins attribution: a suite lands on the file
 * whose code calls `describe`, with a suite opened by a helper module as the control.
 *
 * The real runs' children get the parent's environment **minus `NODE_TEST_CONTEXT`**: the outer
 * runner sets it, and a child `node --test` that inherits it reports to its parent instead of running
 * its own reporters.
 *
 * Deliberately not covered: whether `data.file`, `data.nesting`, `data.details.duration_ms` and
 * `data.name` are present on a Node older than the one running this suite (the reporter's own header
 * states what was and was not read), and the reporter's use inside `scripts/run-gates.sh`, which only
 * a Run gates round runs.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

const REPORTER = join(WORKSPACE_ROOT, 'scripts', 'lib', 'test-timing-reporter.mjs');
const HEADER = 'file\tstatus\tseconds\ttests\tfailed';
const SECONDS = /^[0-9]+\.[0-9]$/;

const ALPHA = [
  "import test from 'node:test';",
  "test('alpha one', async (t) => {",
  "  await t.test('alpha nested', () => {});",
  '});',
  "test('alpha two', () => {});",
  '',
].join('\n');

const BETA = [
  "import test from 'node:test';",
  "import assert from 'node:assert/strict';",
  "test('beta passes', () => {});",
  "test('beta fails', () => { assert.equal(1, 2); });",
  '',
].join('\n');

const DIRECT = [
  "import { describe, it } from 'node:test';",
  "import assert from 'node:assert/strict';",
  `import { CASE_CONCURRENCY } from ${JSON.stringify(new URL('./helpers/concurrency.mjs', import.meta.url).href)};`,
  "describe('direct', { concurrency: CASE_CONCURRENCY }, () => {",
  "  it('passes', () => {});",
  "  it('fails', () => { assert.equal(1, 2); });",
  '});',
  '',
].join('\n');

/** The control: the helper-opened suite shape this repository removed. */
const OPENER = [
  "import { describe } from 'node:test';",
  'export function openSuite(name, fn) { return describe(name, { concurrency: 2 }, fn); }',
  '',
].join('\n');

const VIA_HELPER = [
  "import { it } from 'node:test';",
  "import { openSuite } from './helpers/opener.mjs';",
  "openSuite('via helper', () => { it('passes', () => {}); });",
  '',
].join('\n');

const INERT = 'export const VALUE = 1;\n';

function execResult(command, args, options) {
  return new Promise((resolveExec) => {
    execFile(command, args, { encoding: 'utf8', ...options }, (error, stdout, stderr) => {
      const status = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
      resolveExec({ status, stdout, stderr });
    });
  });
}

function childEnv() {
  const { NODE_TEST_CONTEXT: _childMarker, ...env } = process.env;
  return { ...env, [MAIN_REPO_ANCHOR_VARIABLE]: '' };
}

async function report(events) {
  const { default: reporter } = await import(pathToFileURL(REPORTER).href);
  async function* source() {
    yield* events;
  }
  let out = '';
  for await (const chunk of reporter(source())) out += chunk;
  return out.split('\n').slice(0, -1);
}

/**
 * A nesting-0 event for `file`, relative to this process's working directory, as the reporter keys it.
 * `name` defaults to a case name, never the file's path, so the event stands for a test case.
 */
function event(type, file, durationMs, extra = {}) {
  return {
    type,
    data: {
      nesting: 0,
      name: 'a case',
      file: join(process.cwd(), file),
      details: { duration_ms: durationMs },
      ...extra,
    },
  };
}

test('a real node --test run writes one row per file beside an intact tap stream', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'test-timing-reporter-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'test'));
  await writeFile(join(dir, 'test', 'alpha.test.mjs'), ALPHA, 'utf8');
  await writeFile(join(dir, 'test', 'beta.test.mjs'), BETA, 'utf8');
  const record = join(dir, 'record.tsv');

  const run = await execResult(
    process.execPath,
    [
      '--test',
      '--test-reporter=tap',
      '--test-reporter-destination=stdout',
      `--test-reporter=${REPORTER}`,
      `--test-reporter-destination=${record}`,
      'test/alpha.test.mjs',
      'test/beta.test.mjs',
    ],
    { cwd: dir, env: childEnv() },
  );

  assert.notEqual(run.status, 0, run.stdout);
  assert.match(run.stdout, /^\s*not ok /m, run.stdout);

  const text = await readFile(record, 'utf8');
  const lines = text.split('\n').slice(0, -1);
  assert.equal(lines[0], HEADER, text);
  assert.equal(lines.at(-1), 'end', text);
  const rows = lines.slice(1, -1).map((line) => line.split('\t'));
  assert.equal(rows.length, 2, text);

  const alpha = rows.filter((row) => row[0] === 'test/alpha.test.mjs');
  const beta = rows.filter((row) => row[0] === 'test/beta.test.mjs');
  assert.equal(alpha.length, 1, text);
  assert.equal(beta.length, 1, text);
  assert.deepEqual([alpha[0][1], alpha[0][3], alpha[0][4]], ['pass', '2', '0'], text);
  assert.deepEqual([beta[0][1], beta[0][3], beta[0][4]], ['fail', '2', '1'], text);
  for (const row of rows) {
    assert.equal(row.length, 5, text);
    assert.match(row[2], SECONDS, text);
  }

  for (const absolute of new Set([dir, await realpath(dir)])) {
    assert.ok(!text.includes(absolute), text);
  }
  for (const field of lines.flatMap((line) => line.split('\t'))) {
    assert.ok(!field.startsWith('/'), text);
  }
});

test('a real run credits a suite to the file that calls describe, and a helper with no test reads tests 0', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'test-timing-reporter-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'test', 'helpers'), { recursive: true });
  await writeFile(join(dir, 'test', 'direct.test.mjs'), DIRECT, 'utf8');
  await writeFile(join(dir, 'test', 'via-helper.test.mjs'), VIA_HELPER, 'utf8');
  await writeFile(join(dir, 'test', 'helpers', 'opener.mjs'), OPENER, 'utf8');
  await writeFile(join(dir, 'test', 'helpers', 'inert.mjs'), INERT, 'utf8');
  const record = join(dir, 'record.tsv');

  const run = await execResult(
    process.execPath,
    [
      '--test',
      '--test-reporter=tap',
      '--test-reporter-destination=stdout',
      `--test-reporter=${REPORTER}`,
      `--test-reporter-destination=${record}`,
      'test/direct.test.mjs',
      'test/via-helper.test.mjs',
      'test/helpers/opener.mjs',
      'test/helpers/inert.mjs',
    ],
    { cwd: dir, env: childEnv() },
  );

  assert.notEqual(run.status, 0, run.stdout);

  const text = await readFile(record, 'utf8');
  const lines = text.split('\n').slice(0, -1);
  assert.equal(lines[0], HEADER, text);
  assert.equal(lines.at(-1), 'end', text);
  const rows = lines.slice(1, -1).map((line) => line.split('\t'));
  assert.equal(rows.length, 3, text);

  const only = (file) => {
    const matching = rows.filter((row) => row[0] === file);
    assert.equal(matching.length, 1, text);
    return matching[0];
  };
  const direct = only('test/direct.test.mjs');
  const opener = only('test/helpers/opener.mjs');
  const inert = only('test/helpers/inert.mjs');
  assert.deepEqual([direct[1], direct[3], direct[4]], ['fail', '1', '1'], text);
  assert.deepEqual([opener[1], opener[3], opener[4]], ['pass', '1', '0'], text);
  assert.deepEqual([inert[1], inert[3], inert[4]], ['pass', '0', '0'], text);
  assert.ok(!rows.some((row) => row[0] === 'test/via-helper.test.mjs'), text);
  for (const row of rows) {
    assert.equal(row.length, 5, text);
    assert.match(row[2], SECONDS, text);
  }
});

test('rows sort by seconds descending, a tie broken by file ascending', async () => {
  const lines = await report([
    event('test:pass', 'test/fast.test.mjs', 100),
    event('test:pass', 'test/tie-b.test.mjs', 2000),
    event('test:fail', 'test/slow.test.mjs', 3000),
    event('test:pass', 'test/tie-a.test.mjs', 1500),
    event('test:pass', 'test/tie-a.test.mjs', 500),
  ]);
  assert.deepEqual(lines, [
    HEADER,
    'test/slow.test.mjs\tfail\t3.0\t1\t1',
    'test/tie-a.test.mjs\tpass\t2.0\t2\t0',
    'test/tie-b.test.mjs\tpass\t2.0\t1\t0',
    'test/fast.test.mjs\tpass\t0.1\t1\t0',
    'end',
  ]);
});

test('an event with no data.file or at nesting 1 adds nothing, and a missing duration counts as 0', async () => {
  const lines = await report([
    event('test:pass', 'test/one.test.mjs', 1000),
    { type: 'test:fail', data: { nesting: 0, details: { duration_ms: 9000 } } },
    event('test:fail', 'test/one.test.mjs', 9000, { nesting: 1 }),
    event('test:fail', 'test/nested-only.test.mjs', 9000, { nesting: 1 }),
    { type: 'test:pass', data: { nesting: 0, file: join(process.cwd(), 'test/no-duration.test.mjs'), details: {} } },
    { type: 'test:pass', data: { nesting: 0, file: join(process.cwd(), 'test/no-duration.test.mjs') } },
  ]);
  assert.deepEqual(lines, [
    HEADER,
    'test/one.test.mjs\tpass\t1.0\t1\t0',
    'test/no-duration.test.mjs\tpass\t0.0\t2\t0',
    'end',
  ]);
});

test('a file-level entry named for its file adds no test on pass, and one failed test on fail', async () => {
  const lines = await report([
    event('test:pass', 'test/helpers/absolute.mjs', 200, { name: join(process.cwd(), 'test/helpers/absolute.mjs') }),
    event('test:pass', 'test/helpers/relative.mjs', 100, { name: 'test/helpers/relative.mjs' }),
    event('test:fail', 'test/broken.test.mjs', 300, { name: join(process.cwd(), 'test/broken.test.mjs') }),
  ]);
  assert.deepEqual(lines, [
    HEADER,
    'test/broken.test.mjs\tfail\t0.3\t1\t1',
    'test/helpers/absolute.mjs\tpass\t0.2\t0\t0',
    'test/helpers/relative.mjs\tpass\t0.1\t0\t0',
    'end',
  ]);
});

test('an empty stream yields the header then end', async () => {
  assert.deepEqual(await report([]), [HEADER, 'end']);
});
