/**
 * Which library call places each library-sourcing outer-loop script's root (F15).
 *
 * **The rule this test exists to enforce: each script listed in {@link SCRIPTS} places its root with
 * `hr_script_root "$script_dir"`, and through neither `hr_repo_root "$script_dir"` nor
 * `git -C "$script_dir" rev-parse`,** either of which a placeholder `<scriptsDir>/.git` stops.
 *
 * A source guard, the last resort the testing bar allows: running these scripts needs a watcher, a
 * daemon, an MCP runtime, a notifier or a live worktree set, and `hr_script_root`'s behaviour is
 * already held by its own suite. The boundary: this reads a fixed list of files and walks no tree,
 * so a script added later is not read; the behavioural suites, not this one, carry the contract.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const SCRIPTS = [
  'docs-search-server.sh',
  'autonomous-notify.sh',
  'setup-worktree.sh',
  'create-worktree.sh',
  'cleanup-merged-worktrees.sh',
  'restart-watcher.sh',
  'run-test-suite.sh',
  'scratch-run.sh',
];

const REQUIRED = 'hr_script_root "$script_dir"';
const FORBIDDEN = ['hr_repo_root "$script_dir"', 'git -C "$script_dir" rev-parse'];

for (const name of SCRIPTS) {
  test(`${name} places its root through hr_script_root`, () => {
    const source = readFileSync(new URL(`../templates/scripts/${name}`, import.meta.url), 'utf8');
    assert.ok(source.includes(REQUIRED), `${name} does not carry ${REQUIRED}`);
    for (const needle of FORBIDDEN) {
      assert.ok(!source.includes(needle), `${name} still carries ${needle}`);
    }
  });
}
