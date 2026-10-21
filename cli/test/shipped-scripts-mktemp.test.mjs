import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

/**
 * The rule this suite exists to enforce: every `mktemp` a shipped script runs names an explicit
 * template, and none uses `-t`.
 *
 * The guard is on the source, because no behavioural case can tell the forms apart:
 *
 * - GNU `mktemp` called bare honours `TMPDIR`, so on Linux a bare call and an explicit
 *   `"${TMPDIR:-/tmp}/<name>.XXXXXX"` land in the same directory and pass the same test.
 * - BSD (macOS) `mktemp` called bare ignores `TMPDIR` and writes under the per-user
 *   `/var/folders/…/T`. That fails only where that directory is unwritable, which is the
 *   unattended sandbox, and no test can launch it (`docs/sandbox-verification.md` →
 *   `## 5. Failures and their follow-ups`, row F2).
 * - `-t` is no portable alternative: GNU rejects `mktemp -t <prefix>` with fewer than three `X`s
 *   outright (`mktemp: too few X's in template '<prefix>'`).
 *
 * A line whose first non-blank character is `#` is skipped: the header `REPRO` blocks are
 * hand-run examples, not code a shipped script runs.
 */
const SCRIPTS_ROOT = join(WORKSPACE_ROOT, 'cli', 'templates', 'scripts');
const MKTEMP_CALL = /\$\(\s*mktemp\b([^)]*)\)/g;
const SHORT_T_OPTION = /(^|\s)-[A-Za-z]*t[A-Za-z]*(?=\s|$)/;

function shellScripts(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return shellScripts(path);
    return entry.isFile() && entry.name.endsWith('.sh') ? [path] : [];
  });
}

test('every mktemp in a shipped script names an explicit XXXXXX template and no -t', () => {
  const calls = [];
  for (const file of shellScripts(SCRIPTS_ROOT)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.trimStart().startsWith('#')) return;
      for (const match of line.matchAll(MKTEMP_CALL)) {
        calls.push({ site: `${relative(WORKSPACE_ROOT, file)}:${index + 1}`, call: match[0], args: match[1] });
      }
    });
  }

  assert.ok(calls.length > 0, `no $(mktemp …) call found under ${relative(WORKSPACE_ROOT, SCRIPTS_ROOT)}; the pattern has stopped matching`);

  const offending = calls
    .filter(({ args }) => !args.includes('XXXXXX') || SHORT_T_OPTION.test(args))
    .map(({ site, call }) => `${site}: ${call}`);
  assert.deepEqual(
    offending,
    [],
    `mktemp called with no explicit template or with -t:\n${offending.join('\n')}`,
  );
});
