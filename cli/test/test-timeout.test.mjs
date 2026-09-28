/**
 * The suite's timeout bound, proven on a watcher that never returns.
 *
 * **The rule this test exists to enforce: a hung watcher case fails by name with a timeout, and
 * leaves no process of its fixture behind.** One case writes a child test file that runs the
 * written watcher's endless `watch` loop through `runBash`'s bounded form
 * (`helpers/fixture.mjs`, choice 6), runs it in a child `node --test`, and reads the child's TAP
 * and the process table.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, because `init` is what writes the
 * watcher into the child's fixture; `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture } from './helpers/fixture.mjs';

const CHILD_TEST_NAME = 'a watch loop that never returns';

/**
 * The child runner's `--test-timeout`. Under Node 20.19.5 it bounds the child **file's** whole run —
 * start-up, its own fixture seeding and `init` on a loaded gate host — and it must never fire before
 * `CHILD_BOUND_MS`: if it did, the child's TAP would name the file and leave the watcher group
 * running, which is what this case asserts cannot happen. Kept below the parent suite's own
 * `--test-timeout` (`cli/package.json` → `scripts.test`).
 */
const CHILD_TEST_TIMEOUT_MS = 240_000;

/**
 * The child's explicit `runBash` bound, which is what reaps: under Node 20.19.5 a `--test-timeout`
 * expiry kills the child's process without aborting `t.signal`, and the TAP then names the file
 * rather than the case. `t.signal` is passed as well, for a runner that does abort it.
 */
const CHILD_BOUND_MS = 2_000;

/** How long the process table is given to drop the killed group before `pgrep` reads it. */
const REAP_GRACE_MS = 500;

/** `execFile` resolving whatever the command exited with — this case asserts a failing child. */
function execResult(command, args, options = {}) {
  return new Promise((resolveExec) => {
    execFile(command, args, { encoding: 'utf8', ...options }, (error, stdout, stderr) => {
      resolveExec({ status: error === null ? 0 : error.code, stdout, stderr });
    });
  });
}

function childSource() {
  const helpers = new URL('./helpers/', import.meta.url);
  return [
    "import test from 'node:test';",
    "import { writeFileSync } from 'node:fs';",
    `import { runBash } from ${JSON.stringify(new URL('fixture.mjs', helpers).href)};`,
    `import { createWatcherFixture } from ${JSON.stringify(new URL('watcher.mjs', helpers).href)};`,
    '',
    `test(${JSON.stringify(CHILD_TEST_NAME)}, async (t) => {`,
    '  const f = await createWatcherFixture(t);',
    '  if (f === null) return;',
    '  writeFileSync(process.env.HUNG_FIXTURE_RECORD, f.dir);',
    `  await runBash(f.dir, [f.watcherPath, 'watch'], f.watcherEnv(), { timeoutMs: ${CHILD_BOUND_MS}, signal: t.signal });`,
    '});',
    '',
  ].join('\n');
}

test('a hung watcher case fails by name with a timeout and leaves no process behind', async (t) => {
  const { dir, cleanup } = await createFixture({ git: false });
  t.after(cleanup);

  const childPath = join(dir, 'hung-watcher.test.mjs');
  const recordPath = join(dir, 'hung-fixture.txt');
  writeFileSync(childPath, childSource(), 'utf8');
  writeFileSync(recordPath, '', 'utf8');

  const child = await execResult(
    process.execPath,
    ['--test', `--test-timeout=${CHILD_TEST_TIMEOUT_MS}`, childPath],
    { cwd: dir, env: { ...process.env, HUNG_FIXTURE_RECORD: recordPath } },
  );
  if (/^ok \d+ - .* # SKIP/m.test(child.stdout)) {
    t.skip('the child skipped its watcher fixture: bash or jq does not resolve on PATH');
    return;
  }

  assert.notEqual(child.status, 0, `the child run exited 0\n${child.stdout}\n${child.stderr}`);
  assert.match(child.stdout, new RegExp(`^not ok \\d+ - ${CHILD_TEST_NAME}$`, 'm'), child.stdout);
  assert.match(child.stdout, /timed out|cancelled/, child.stdout);

  const fixtureDir = readFileSync(recordPath, 'utf8');
  assert.notEqual(fixtureDir, '', 'the child never recorded its watcher fixture');
  await new Promise((resolveWait) => setTimeout(resolveWait, REAP_GRACE_MS));
  // `pgrep` exits 1 when nothing matches, and 0 with the matches listed.
  const left = await execResult('pgrep', ['-f', fixtureDir]);
  assert.equal(left.status, 1, `processes of the hung fixture survived:\n${left.stdout}${left.stderr}`);
});
