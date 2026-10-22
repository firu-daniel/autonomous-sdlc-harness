/**
 * `writeWrapperScripts` — the opt-in carry-forward arm of `resolveBody`.
 *
 * **The rule these tests exist to enforce: a wrapper whose configured value is its own invocation
 * keeps the command line on disk when the caller opts in, and only then.** Cases (a) and (b) are one
 * input apart — the option — and have opposite outcomes, which ties the result to the option rather
 * than to the fixture.
 *
 * The generator is driven through the compiled module rather than the CLI because the option has no
 * caller yet; the end-to-end case that drives `init` belongs to the task that sets it. Every fixture
 * lives under the system temp directory and is removed in process; nothing writes into this checkout.
 *
 * These run against the **compiled** CLI, so `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';

import { WritePlan } from '../dist/core/writer.js';
import { writeWrapperScripts } from '../dist/generators/scripts.js';

const fixtures = [];

afterEach(() => {
  while (fixtures.length > 0) rmSync(fixtures.pop(), { recursive: true, force: true });
});

/** A throwaway repository holding `scripts/<file>` for each entry, forwarding `line "$@"`. */
function fixture(lines) {
  const root = mkdtempSync(join(tmpdir(), 'wrapper-carry-'));
  fixtures.push(root);
  mkdirSync(join(root, 'scripts'));
  for (const [file, line] of Object.entries(lines)) {
    writeFileSync(join(root, 'scripts', file), `#!/usr/bin/env bash\nset -u\n${line} "$@"\n`);
  }
  return root;
}

function config(commands = {}) {
  return {
    scriptsDir: 'scripts',
    commands: { test: 'bash scripts/test.sh', typecheck: 'bash scripts/typecheck.sh', ...commands },
  };
}

/** Run the generator and return its result plus each wrapper's enqueued content by file. */
function run(repoRoot, options) {
  const plan = new WritePlan();
  const result = writeWrapperScripts({ repoRoot, plan, rawCommands: { test: 'npm test' }, ...options });
  const content = {};
  for (const request of plan.requests) {
    if (request.content !== undefined) content[request.path.slice(join(repoRoot, 'scripts').length + 1)] = request.content;
  }
  const byFile = Object.fromEntries(result.written.map((entry) => [entry.file, entry]));
  return { result, content, byFile };
}

const ON_DISK = { 'test.sh': 'bash scripts/run-gates.sh', 'typecheck.sh': 'npm run build' };

test('(a) with the option on, both self-invoking wrappers carry their on-disk line', () => {
  const root = fixture(ON_DISK);
  const { content, byFile } = run(root, { config: config(), carryOnDiskCommandLines: true });

  assert.match(content['test.sh'], /^bash scripts\/run-gates\.sh "\$@"/m);
  assert.match(content['typecheck.sh'], /^npm run build "\$@"/m);
  assert.equal(byFile['test.sh'].carried, true);
  assert.equal(byFile['typecheck.sh'].carried, true);
  assert.equal(byFile['typecheck.sh'].unresolved, false);
});

test('(b) with the option absent, detection and the stub win over the same files', () => {
  const root = fixture(ON_DISK);
  const { content, byFile } = run(root, { config: config() });

  assert.match(content['test.sh'], /^npm test "\$@"/m);
  assert.doesNotMatch(content['test.sh'], /run-gates/);
  assert.match(content['typecheck.sh'], /^harness_fail /m);
  assert.equal(byFile['test.sh'].carried, false);
  assert.equal(byFile['typecheck.sh'].carried, false);
  assert.equal(byFile['typecheck.sh'].unresolved, true);
});

test('(c) with the option on, an on-disk stub is not carried', () => {
  const root = fixture({ 'typecheck.sh': 'harness_fail "harness: set commands.typecheck in harness.config.json"' });
  const { byFile } = run(root, { config: config(), carryOnDiskCommandLines: true });

  assert.equal(byFile['typecheck.sh'].carried, false);
  assert.equal(byFile['typecheck.sh'].unresolved, true);
});

test('(d) with the option on, a raw configured line wins over the file', () => {
  const root = fixture(ON_DISK);
  const { content, byFile } = run(root, {
    config: config({ test: 'node --test' }),
    carryOnDiskCommandLines: true,
  });

  assert.match(content['test.sh'], /^node --test "\$@"/m);
  assert.equal(byFile['test.sh'].carried, false);
  assert.equal(byFile['test.sh'].command, 'node --test');
});

test('(e) a carried line that runs the wrapper itself throws', () => {
  const root = fixture({ 'test.sh': 'bash scripts/test.sh' });
  assert.throws(
    () => run(root, { config: config(), carryOnDiskCommandLines: true }),
    (error) => error.name === 'HarnessError' && /recurse forever/.test(error.message),
  );
});
