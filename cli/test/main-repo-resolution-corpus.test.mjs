/**
 * The `<MAIN_REPO>` resolution clause across the plugin corpus.
 *
 * **The rule this suite exists to enforce: the `<MAIN_REPO>` resolution clause is wire text carried
 * byte-identical at every plugin site that resolves `<MAIN_REPO>`, and its single home's roster
 * (`plugin/instructions/main_repo_resolution.md` → `## Who may cite this`) names exactly those
 * sites.**
 *
 * Registered as a tree guard by Task 11 of `fix_clone_main_repo_resolution`, which adds this
 * file's `treeGuards` entry to `harness.config.json`.
 *
 * A later suite adds a corpus case as a row in `CASES`, with no new runner code.
 *
 * RED ONCE (first row) — 2026-10-29, `plugin/commands/branch-status.md` reverted to the old clause
 * in the working tree only, then restored: `main-repo-resolution-clause` failed its `deepEqual`,
 * the file missing from `needle` and listed under `forbidden`; the roster check stayed green.
 *
 * RED ONCE (roster check) — 2026-10-29, the `${CLAUDE_PLUGIN_ROOT}/commands/branch-status.md`
 * entry deleted from `## Who may cite this` in the working tree only, then restored: the roster
 * check failed its `deepEqual`, `plugin/commands/branch-status.md` missing from the roster.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

const NEW_CLAUSE =
  'the path a bare `printenv HARNESS_MAIN_REPO` prints, else the path `${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves, and a stop with its sentence when it resolves none';

const OLD_CLAUSE =
  'the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`';

/** `{ id, root, glob, needle, expected, forbidden }` — `root` repo-relative, `glob` a file-name suffix. */
export const CASES = [
  {
    id: 'main-repo-resolution-clause',
    root: 'plugin',
    glob: '.md',
    needle: NEW_CLAUSE,
    expected: {
      'plugin/agents/committer.md': 1,
      'plugin/agents/qa-tester.md': 1,
      'plugin/commands/branch-answer.md': 1,
      'plugin/commands/branch-pause.md': 1,
      'plugin/commands/branch-prompt.md': 1,
      'plugin/commands/branch-resume.md': 1,
      'plugin/commands/branch-start-docs-autonomous.md': 1,
      'plugin/commands/branch-start-plan-autonomous.md': 1,
      'plugin/commands/branch-start-user-review-fix-autonomous.md': 2,
      'plugin/commands/branch-status.md': 1,
      'plugin/commands/branch-user-review.md': 1,
      'plugin/docs/AUTONOMOUS_FLOW.md': 1,
      'plugin/instructions/autonomous_pause_and_ledger.md': 1,
      'plugin/instructions/clarification_digest_instructions.md': 1,
      'plugin/instructions/dispatch_discipline_instructions.md': 1,
      'plugin/instructions/docs_orchestration_instructions_autonomous.md': 1,
      'plugin/instructions/improvement_observations_instructions.md': 1,
      'plugin/instructions/plan_orchestration_instructions_autonomous.md': 1,
      'plugin/instructions/task_plan_writing_instructions_autonomous.md': 1,
      'plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md': 1,
      'plugin/instructions/user_review_fixes_instructions_autonomous.md': 1,
    },
    forbidden: [OLD_CLAUSE],
  },
];

const MODULE = 'plugin/instructions/main_repo_resolution.md';

/** Repo-relative, `/`-separated paths of every file under `root` whose name ends in `glob`. */
function filesUnder(root, glob) {
  return readdirSync(join(WORKSPACE_ROOT, root), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(glob))
    .map((entry) => relative(WORKSPACE_ROOT, join(entry.parentPath ?? entry.path, entry.name)).split(sep).join('/'));
}

const occurrences = (text, needle) => text.split(needle).length - 1;

const sorted = (record) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));

test('corpus cases', async (t) => {
  for (const row of CASES) {
    await t.test(row.id, () => {
      const found = {};
      const forbiddenHits = [];
      for (const file of filesUnder(row.root, row.glob)) {
        const text = readFileSync(join(WORKSPACE_ROOT, file), 'utf8');
        const count = occurrences(text, row.needle);
        if (count > 0) found[file] = count;
        for (const string of row.forbidden) {
          if (text.includes(string)) forbiddenHits.push(`${file}: ${string}`);
        }
      }
      // One assertion, so a site reverted to a forbidden string reports both its halves.
      assert.deepEqual(
        { needle: sorted(found), forbidden: forbiddenHits },
        { needle: sorted(row.expected), forbidden: [] },
      );
    });
  }
});

test('main_repo_resolution.md — one `## The fallback`, and a plugin roster equal to the first row', () => {
  const lines = readFileSync(join(WORKSPACE_ROOT, MODULE), 'utf8').split('\n');
  assert.equal(lines.filter((line) => line === '## The fallback').length, 1);

  const start = lines.indexOf('## Who may cite this');
  assert.notEqual(start, -1, `${MODULE} has no \`## Who may cite this\``);
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  const section = lines.slice(start + 1, end === -1 ? undefined : end);

  // Only `${CLAUDE_PLUGIN_ROOT}/` entries are compared: the repo-relative entries (`cli/…`,
  // `docs/…`) lie outside the first row's `plugin` root, so they neither match nor fail here.
  const roster = section
    .map((line) => line.match(/^- `\$\{CLAUDE_PLUGIN_ROOT\}\/([^`]+)`/))
    .filter(Boolean)
    .map((match) => `plugin/${match[1]}`)
    .sort();

  const row = CASES.find((c) => c.id === 'main-repo-resolution-clause');
  assert.deepEqual(roster, Object.keys(row.expected).sort());
});
