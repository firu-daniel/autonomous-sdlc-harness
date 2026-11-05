import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

/**
 * The rule this suite enforces: every wrapper and verify call the committer makes — step 4's
 * commit, step 5's two verify reads, step 6's push, and the `ui_test_pass` steps that defer to
 * them — is issued "once, alone", and the orchestrator-side ledger flip in
 * `autonomous_pause_and_ledger.md` §1.6 states the same rule in the same words.
 *
 * This is a source guard, the last resort `.claude/context/conventions.md` → `## The testing bar`
 * permits. The rule is agent prose a committer session reads, and no behavioural test starts one.
 *
 * Deliberately not covered: whether a live committer session actually issues one Bash call per
 * command. That needs a live session, which no test in this package starts.
 *
 * Each assertion reads one section, sliced from its heading to the next heading of the same or a
 * higher level, so a match elsewhere in the file cannot satisfy it; a heading that is not found
 * fails its case by name. `DEFINITION` is a literal here, never read from `committer.md`, so an
 * edit made to both prose copies at once still fails.
 */

const read = (rel) => ({ rel, text: readFileSync(join(WORKSPACE_ROOT, rel), 'utf8') });

const COMMITTER = read('plugin/agents/committer.md');
const LEDGER = read('plugin/instructions/autonomous_pause_and_ledger.md');

const DEFINITION =
  '**Once, alone** means its own Bash call holding that one command and nothing else — no `cd`, `;`, `&&`, `||`, pipe, `echo "exit $?"`, `$(…)` or shell variable before or after it.';
const PUSH_ROOT = '<MAIN_REPO>/<scripts_dir>/';

const collapse = (s) => s.replace(/\s+/g, ' ');

function section(file, heading) {
  const lines = file.text.split('\n');
  const start = lines.findIndex((line) => line === heading);
  assert.notEqual(start, -1, `${file.rel}: heading not found: ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  const end = lines.findIndex(
    (line, i) => i > start && /^#+ /.test(line) && line.match(/^#+/)[0].length <= level,
  );
  return { where: `${file.rel} → ${heading}`, text: lines.slice(start, end === -1 ? undefined : end).join('\n') };
}

function lineStarting(sec, prefix) {
  const line = sec.text.split('\n').find((l) => l.trimStart().startsWith(prefix));
  assert.ok(line, `${sec.where}: no line starting "${prefix}"`);
  return line;
}

const standard = () => section(COMMITTER, '### Standard procedure (`task` / `review_plan_file` / `review_item`)');

test('(a) committer step 4 commits and step 6 pushes once, alone, under <MAIN_REPO>', () => {
  const std = standard();
  const commit = 'then call the wrapper once, alone, with exactly step 3\'s paths and every placeholder as literal text:';
  assert.ok(std.text.includes(commit), `${std.where}: step 4 does not carry "${commit}"`);
  assert.ok(collapse(std.text).includes(DEFINITION), `${std.where}: step 4 does not carry the "Once, alone" definition`);

  const step6 = lineStarting(std, '6. **Push:**');
  const push = 'call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` once, alone';
  assert.ok(step6.includes(push), `${std.where}: step 6 does not carry "${push}"`);
  assert.ok(step6.includes('never `<repo_root>`'), `${std.where}: step 6 does not carry "never \`<repo_root>\`"`);
  for (let i = step6.indexOf('push-branch.sh'); i !== -1; i = step6.indexOf('push-branch.sh', i + 1)) {
    assert.ok(
      step6.slice(0, i).endsWith(PUSH_ROOT),
      `${std.where}: step 6 names push-branch.sh under a root other than "${PUSH_ROOT}"`,
    );
  }
});

test('(b) committer step 5 verifies once, alone, and ui_test_pass defers to steps 4–6', () => {
  const std = standard();
  const step5 = lineStarting(std, '5. **Verify:**');
  const verify = 'as two separate calls, each once, alone';
  assert.ok(step5.includes(verify), `${std.where}: step 5 does not carry "${verify}"`);

  const ui = section(COMMITTER, '### ui_test_pass procedure');
  const stepF = lineStarting(ui, 'f. **Commit:**');
  assert.ok(stepF.includes('call the wrapper once, alone'), `${ui.where}: step f does not carry "call the wrapper once, alone"`);
  lineStarting(ui, 'g. **Verify** as step 5 does');
  lineStarting(ui, 'h. **Push** as step 6 does');
});

test('(c) the ledger §1.6 states the same once, alone rule and drops "newline-separated"', () => {
  const s16 = section(LEDGER, '### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch');
  assert.ok(s16.text.includes('Call each wrapper once, alone.'), `${s16.where}: "Call each wrapper once, alone." not found`);
  assert.ok(collapse(s16.text).includes(DEFINITION), `${s16.where}: the "Once, alone" definition not found`);
  assert.ok(!s16.text.includes('newline-separated'), `${s16.where}: still carries "newline-separated"`);
});
